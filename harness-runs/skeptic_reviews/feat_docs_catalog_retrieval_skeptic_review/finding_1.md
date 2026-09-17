### 1. The corpus-coverage warnings never reach the two consumers that act on the search, so a half-indexed corpus is indistinguishable from an exhaustive one

**Site anchors**

- `cli/src/retrieval/server.ts` → `answer`, the line `for (const warning of refreshed.warnings) report.warn(warning);`
- `cli/src/doctor/checks.ts` → `RETRIEVAL_INDEX_CHECK`, the `execFileSync(...)` call and the line `return pass(stdout.trim());`

(Line numbers are navigation hints only: `server.ts` ~94, `checks.ts` ~4205.)

## The problem

`cli/src/retrieval/corpus.ts` → `corpusFiles` is deliberately non-throwing: an absent `docs.root`, a `docs.root` that is not a directory, a `docs.root` or a conventions document resolving outside the repository, or a missing conventions document each becomes a **warning line** and the rest of the corpus is still returned. Its own header states the design — *"an absent `docs.root`, a missing conventions document or a path resolving outside the repository becomes a warning line and the rest of the corpus is still returned."* `cli/src/retrieval/refresh.ts` → `refreshIndex` carries them out as `RefreshResult.warnings`.

A whole-branch sweep for every reader of that field finds exactly three, and all three route it to the same sink:

```
cli/src/commands/docs.ts:82    for (const warning of result.warnings) ctx.report.warn(warning);      // docs index
cli/src/commands/docs.ts:142   for (const warning of refreshed.warnings) ctx.report.warn(warning);   // docs search
cli/src/retrieval/server.ts:94 for (const warning of refreshed.warnings) report.warn(warning);       // search_docs
```

`Reporter.warn` writes to **stderr** (`cli/src/core/report.ts` → `warn`, `this.#err(...)`, defaulting to `console.error`). That is correct for `docs index` and `docs search`, whose consumer is a person at a terminal reading both streams. It is not reachable for the branch's two automated consumers:

1. **The MCP tool.** `serveDocs` is a stdio server: stdout is the JSON-RPC transport and stderr is captured by the agent runner into a server log file the calling agent cannot read. The value `search_docs` returns is `renderResults(result)` alone. So an agent querying a repository whose `docs.root` is unset, mis-spelled, or not yet created receives ordinary results over the conventions documents only — or, on `fused-rerank`, `no confident match` — with no signal that the documentation catalog was never in the index. Nothing in the branch closes that gap from the other side: the granted agents' new contract bullet says *"`no confident match` means the search found nothing it trusts, not that the corpus is silent"*, which addresses a low-scoring query, not an un-indexed corpus, and a *successful* search over a truncated corpus produces no such marker at all.

2. **`doctor`'s `retrieval-index` check.** It runs `docs index --in-memory` in a child under `execFileSync` with `stdio: ['ignore', 'pipe', 'pipe']` and reports `pass(stdout.trim())`. `execFileSync` returns **stdout only**; on a zero exit the piped stderr is discarded, and `error.stderr` is read on the failure arm alone. So the check prints the child's `result()` line — `docs index: N files, M chunks; …` — and drops every warning the same run produced. `N` is never `0` for a repository with any `layers[].conventions` document on disk, so "the catalog is missing" surfaces as a passing check with a small file count rather than as a message naming the misconfiguration. This is the one check an adopter runs to answer *"is retrieval set up correctly?"*.

**Why it is reachable, and not hypothetical.** `retrievalApplies` requires `phases.docs` and `docs.retrieval`, but it does **not** require `docs.root` to be set or to exist — and `config/check.ts` → `checkPhaseSections` grades a missing `docs.root` under an enabled docs phase a **warning**, not an error, so a config in exactly this state loads, passes the write guard and wires retrieval end to end. A repository that turns the docs phase on before its catalog has been generated is the ordinary way in.

## Grade

**Should Fix.** A warning is computed on every refresh and then routed to a stream neither automated consumer reads, so the diagnostic exists and is inert. It is not Must Fix: an agent that gets `no confident match` is instructed by its own contract to fall back to index-first navigation, which is the correct action, so no consumer is steered into a *wrong* decision — it is steered into a silently degraded one.

## The fix

Two edits, both additive; neither changes what a passing, fully-indexed run prints.

- [ ] **`cli/src/retrieval/server.ts` → `answer`.** Keep the `report.warn` loop (the server log stays the operator's record) and additionally surface the warnings in the tool result, so the calling agent sees them. Capture the rendered body, then prefix one `note: <warning>` line per entry, separated from the results by a blank line:

  ```ts
  const result = await searchDocs({ /* unchanged */ });
  const body = renderResults(result);
  const notes = refreshed.warnings.map((warning) => `note: ${warning}`);
  return textResult(notes.length === 0 ? body : `${notes.join('\n')}\n\n${body}`);
  ```

  `refreshed` is currently scoped to the first `try` block; widen it to the function body (`let refreshed: RefreshResult;` before the `try`, assigned inside) so the second block can read it. The result stays a non-error result: a truncated corpus is a degraded answer, not a failed call.

- [ ] **`cli/src/retrieval/server.ts` → `SEARCH_TOOL.description`.** Add one sentence after the existing "or `no confident match`" clause so the shape the tool can return is declared where the agent reads it: `A result may be preceded by "note:" lines reporting parts of the corpus that could not be indexed; treat those as diagnostics about coverage, not as search results.`

- [ ] **`cli/src/doctor/checks.ts` → `RETRIEVAL_INDEX_CHECK`.** Swap `execFileSync` for `spawnSync` (already the only way to read a child's stderr on a **zero** exit) with the same argument vector, `encoding: 'utf8'`, the same `stdio`, `timeout` and `env`, then grade on `status`: on a non-zero status or a thrown error keep today's `fail` wording, reading the last non-empty stderr line through the existing `lastNonEmptyLine`; on success append the child's stderr, if any, to the pass message so the coverage warnings land in the report:

  ```ts
  const warnings = lastNonEmptyLine(child.stderr ?? '');
  return pass(warnings === undefined ? child.stdout.trim() : `${child.stdout.trim()} — ${warnings}`);
  ```

  `spawnSync` does not throw on a non-zero exit, so the surrounding `try`/`catch` now covers only a spawn failure; keep it, and read `child.error` on the same failure arm.

No other module reads `RefreshResult.warnings`, so nothing else changes. `docs index` and `docs search` keep their present behaviour — their warnings already reach a reader on stderr.
