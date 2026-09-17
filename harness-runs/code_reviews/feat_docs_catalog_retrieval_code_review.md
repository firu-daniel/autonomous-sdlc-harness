# Code Review: feat_docs_catalog_retrieval

## Context

**Branch:** `feat_docs_catalog_retrieval`
**Date:** 2026-09-17
**Reviewed:** the whole branch diff against `dev` — 72 files, +3993/-120, in four segments: the new `cli/src/retrieval/` area with the `docs` verb and its two suites (Tasks 1–8); the adopter surface, i.e. the launcher template, the `.mcp.json` and permission-profile retrieval halves, the `init` flag and setup step and the three `doctor` checks (Tasks 9–14); the ten agent grants and the guard's left-allowed set (Tasks 15–17); and the schema, its negative fixture and the documents of record (Tasks 18–25). 43 run-artifact files excluded from the reviewed diff.

`bash scripts/run-gates.sh` was run against this checkout: gates 1, 2, 3 and 4 pass — the whole `node --test` suite, including the four new retrieval suites and the retrieval cases added to `init`, `doctor`, `profile` and `outer-loop-scripts` — and gate 6a fails on its pre-existing hit alone, the worktree's untracked `.git` pointer file (recorded for an earlier branch in `harness-runs/improvement_observations/feat_readme_summary_compact_llms_txt.md`) plus the untracked scratch log quoting it. No new failure, which is the branch's Acceptance 8. Every accompanying item the conventions documents require is present: the `SUBCOMMANDS` row with its fixture-driven cases, the configuration key in all four of its places, the negative fixture with its chained `ajv` assertion, the outer-loop row with its `agentInvocable` decision argued, the module headers, and the idempotence assertions beside each new written artifact. `phases.parity` is `false`, so no parity review ran and the divergence call-out section is empty.

**The `plugin` layer is touched and passes its own layer check.** The diff changes fourteen files under `plugin/` — ten agent `tools:` allowlists with their `<docs_retrieval>` rows, the new docs-retrieval roster block in `plugin/agents/README.txt`, `plugin/hooks/README.md` and the guard's LEFT-ALLOWED comment. The check `.claude/context/plugin.md` → `## Verifying a change in this layer` prescribes for a new wire (*"A change to a wire is verified by the grep that re-derives its readers"*) was run: `grep -rln --include='*.md' "mcp__harness-docs__search_docs" plugin/agents` returns exactly the ten files `plugin/agents/README.txt` rosters, and the server name agrees across `cli/src/retrieval/server.ts` (`DOCS_SERVER_NAME = 'harness-docs'`), `cli/templates/repo/mcp.retrieval.json` and `cli/templates/claude/settings.autonomous.retrieval.json` — a clean pass, no finding. The guard edit is comment-only (`git diff dev...HEAD -- plugin/hooks/autonomous-script-allowlist-guard.sh` adds no non-comment line), so the re-measurement obligation `.claude/context/plugin.md` → `## Guards, the shared library and the helper scripts` places on `docs/guard-verification.md` is not engaged.

**The lessons ledger's adopter-documentation category is exercised and also passes.** `harness-runs/lessons.md` → `## Adopter-facing documentation` requires every command an adopter is meant to run to sit in a fenced block, one command per line; the commands this branch adds to `README.md`, `cli/README.md`, `docs/cli.md`, `docs/development.md`, `docs/retrieval.md` and `llms.txt` were each checked and each sits in a fenced block, one per line, with no command inlined into prose or joined to another — a clean pass, no finding.

**One finding on this branch is a Must Fix:** Finding 3, the launcher template re-spelling the repository-root probe the shared outer-loop library owns — a mandated accessor bypassed, which also leaves the script's own stated exit contract wrong on the failure arm. The remaining seven are four convention and robustness defects in the `cli` layer and three low-consequence surface items. The launcher pair (Findings 3 and 4) sits on the one path whose failure mode is the branch's own stated top risk — a tool the agents are granted but a run never loads.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top-to-bottom; the committer flips each one to `[x]` as that fix's commit lands. **Only the committing role flips a marker** — the `committer` agent in every flow that dispatches one, the orchestrator itself in the supervised fix flow, which dispatches none. `[ ]` markers anywhere else, such as sub-step bullets inside individual per-finding files, are informational progress markers for the implementer agent — they are NEVER the iteration source and the committer does NOT touch them.

Each entry resolves to a self-contained `harness-runs/code_reviews/feat_docs_catalog_retrieval_code_review/finding_<K>.md` file via its `**Finding K**` reference. Sorted with the one Must Fix leading, then lowest blast-radius first among the rest: the two single-token edits, then the comment corrections, then the second launcher edit, then the surface items.

1. [x] **Finding 3** — Resolve the launcher's repository root through the shared library's `hr_repo_root` _(layer: cli)_
2. [x] **Finding 5** — Give `--docs-retrieval` a flag constant beside `QA_DRIVER_FLAG` and read it at its three sites _(layer: cli)_
3. [x] **Finding 2** — Import `ABSTAIN_MESSAGE` from its owner instead of retyping the literal in the `search_docs` tool description _(layer: cli)_
4. [x] **Finding 1** — State `lexicalSearch`'s measured behaviour in its interface comment and its SQL comment _(layer: cli)_
5. [x] **Finding 4** — Settle `PATH` through `hr_path_with_fallbacks` before the launcher `exec`s `node` _(layer: cli)_
6. [x] **Finding 6** — Give `RepoRootResult.retrievalWired` a consumer or drop it, and re-word `mcpWritten` _(layer: cli)_
7. [ ] **Finding 7** — Drop `export` from the five new retrieval symbols nothing outside their module reads _(layer: cli)_
8. [ ] **Finding 8** — Make `docs search` answer when a non-abstaining mode returns zero hits _(layer: cli, general)_

---

## Must Fix

### 3. `docs-search-server.sh` re-spells the repository-root probe the shared library owns
→ [finding_3.md](feat_docs_catalog_retrieval_code_review/finding_3.md)

---

## Should Fix

### 1. `DocStore.lexicalSearch` states a filtering contract the branch's own measurement disproves
→ [finding_1.md](feat_docs_catalog_retrieval_code_review/finding_1.md)

### 2. The `search_docs` tool description retypes the abstention literal instead of importing `ABSTAIN_MESSAGE`
→ [finding_2.md](feat_docs_catalog_retrieval_code_review/finding_2.md)

### 4. The launcher `exec`s `node` with whatever `PATH` the agent runner happened to have
→ [finding_4.md](feat_docs_catalog_retrieval_code_review/finding_4.md)

### 5. `--docs-retrieval` is spelled as a literal at three sites in `init.ts`
→ [finding_5.md](feat_docs_catalog_retrieval_code_review/finding_5.md)

---

## Nice to Have

### 6. `RepoRootResult.retrievalWired` has no consumer, and `mcpWritten` no longer means what its name says
→ [finding_6.md](feat_docs_catalog_retrieval_code_review/finding_6.md)

### 7. Five new retrieval symbols are exported with no reader outside their own module
→ [finding_7.md](feat_docs_catalog_retrieval_code_review/finding_7.md)

### 8. `docs search` prints nothing at all when a non-abstaining mode returns zero hits
→ [finding_8.md](feat_docs_catalog_retrieval_code_review/finding_8.md)

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false` in `harness.config.json`, so there is no reference implementation to diverge from and this section is empty.
