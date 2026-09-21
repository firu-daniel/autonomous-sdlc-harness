# general review — 3. Nothing records whether an agent ever calls `search_docs` — iteration 0

Scope: the catch-all layer (`path: "."`). The in-scope changed files are `docs/retrieval.md` and
`docs/cli.md`; `cli/src/retrieval/queryLog.ts`, `cli/src/retrieval/server.ts`,
`cli/src/core/writer.ts` and `cli/test/docs-retrieval.test.mjs` belong to the `cli` layer's dispatch
and are graded here only where a cross-document claim in a `docs/` file disagrees with one of them
(`## Documentation parity`).

Verified by execution: `npx tsc --noEmit -p cli/tsconfig.json` exits 0; `node --test
cli/test/docs-retrieval.test.mjs` is 17/17 including the three new cases (h), (i), (j).

## Must Fix

1. **The new cwd claim contradicts this document's own `## Still open` row, and the two cannot both be true** — `docs/retrieval.md` (`## How it fits together` → the *Query log* bullet) — "Give an absolute path — the server's working directory is the runner's, not the checkout's"

   The same file, unchanged by this diff, carries in `## Still open`: "**Whether the agent runner
   starts the `.mcp.json` server with the checkout root as its working directory.** The launcher
   path in `.mcp.json` is relative and relies on it. Settled by Gate 10's unattended-session leg."
   The new sentence answers that open question flatly, in the negative, with no measurement behind
   it. `grep -rn "working directory"` over `docs/retrieval.md`, `docs/cli.md`,
   `cli/templates/scripts/docs-search-server.sh` and `cli/src/retrieval/server.ts` finds no third
   site and no measurement; `## Measured, and how` (a)–(d) does not cover it, and (d) records that
   Gate 10 "has not been run".

   This is not a wording collision. The two statements are mutually exclusive and the feature's
   startup path turns on which is right: `cli/templates/repo/mcp.retrieval.json` launches the server
   with `"args": ["{{docsSearchServerPath}}"]`, a **repo-relative** path. If the new sentence is
   correct, that relative path does not resolve and docs retrieval does not start at all — which
   would be a defect in the shipped template, not a footnote in a logging paragraph. A contributor
   reading the two sections gets opposite answers to a question one of them says is scheduled to be
   settled.

   It also bypasses `.claude/context/conventions.md` → `## Documents of record`: "A measured fact
   states what was measured, the command and the exact message." Nothing here states any of the
   three.

   **Fix:** keep the operational advice and drop the unmeasured causal claim. Replace the final
   sentence of that bullet with, e.g.: "Give an **absolute** path: whether the agent runner starts
   this server with the checkout root as its working directory is still open (`## Still open`), so a
   relative one is not safe." If instead the cwd behaviour was actually observed while establishing
   the route, record it as a lettered entry under `## Measured, and how` with the host, date, the
   command and the exact output, close the `## Still open` row against it, and then state the
   consequence for `cli/templates/repo/mcp.retrieval.json`'s relative `args`.

## Should Fix

2. **`docs/retrieval.md` and `cli/src/retrieval/queryLog.ts` state the SDK's inherited-env set differently, and the code-side one is the wrong statement** — `docs/retrieval.md` (`## How it fits together` → the *Query log* bullet) — "`DEFAULT_INHERITED_ENV_VARS` in `@modelcontextprotocol/sdk/client/stdio.js` is `HOME`, `LOGNAME`, `PATH`, `SHELL`, `TERM` and `USER` on POSIX"

   `cli/src/retrieval/queryLog.ts`'s header states the same fact as: "`getDefaultEnvironment()` in
   `@modelcontextprotocol/sdk/client/stdio.js` is `HOME`, `LOGNAME`, `PATH`, `SHELL` and `USER` on
   POSIX" — a different symbol and a five-name list omitting `TERM`. Probed via
   `bash scripts/scratch-run.sh harness-runs/scratch/env-inherit.mjs`:

   ```
   DEFAULT_INHERITED_ENV_VARS = ["HOME","LOGNAME","PATH","SHELL","TERM","USER"]
   platform = darwin
   includes TERM? true
   getDefaultEnvironment() keys = ["HOME","LOGNAME","PATH","SHELL","USER"]
   log var survives inheritance? false
   ```

   `docs/retrieval.md` is right. `queryLog.ts` is wrong as a general claim: `getDefaultEnvironment()`
   is not a fixed set — it filters `DEFAULT_INHERITED_ENV_VARS` to the names that happen to be
   **defined** in the parent, which is why the probe's non-TTY process saw five keys and not six.
   Written into a module header as "is … on POSIX", that is a host-dependent observation stated as an
   invariant, and it is the spelling the next reader will copy.

   The conclusion both sites draw is sound and the probe's last line confirms it independently: an
   exported `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_LOG` does not survive into the child, so route (b) is
   the right answer and nothing downstream is affected. This is a correctness-of-statement finding,
   not a behaviour one.

   **Fix:** in `cli/src/retrieval/queryLog.ts`'s header, cite the constant rather than the function
   and give all six names, matching `docs/retrieval.md` verbatim: "`DEFAULT_INHERITED_ENV_VARS` in
   `@modelcontextprotocol/sdk/client/stdio.js` is `HOME`, `LOGNAME`, `PATH`, `SHELL`, `TERM` and
   `USER` on POSIX". (The edit lands in the `cli` layer's file; raising it here because the
   divergence is only visible with both documents in view.)

3. **The pasteable snippet freezes a configured directory name an adopter may not have** — `docs/retrieval.md` (`## How it fits together` → the *Query log* bullet's fenced `json` block) — `"args": ["scripts/docs-search-server.sh"]`

   `cli/templates/repo/mcp.retrieval.json` carries `"args": ["{{docsSearchServerPath}}"]`, rendered
   from the adopter's configured `scriptsDir`. The prose around the block says the route is "an entry
   the operator adds by hand to the `harness-docs` server's `env` object", but the block shows the
   **whole** server entry, with `command`, `args` and `type` alongside the one key being added. An
   adopter whose `scriptsDir` is not `scripts/` who pastes the block as shown replaces a working
   launcher path with one that does not exist, and the failure surfaces as a dead MCP server rather
   than as a bad path. `.claude/context/conventions.md` → `## Configuration is the source of truth`
   is the rule this rubs against: no configured value is frozen into a file, precisely because the
   frozen one is wrong silently.

   The task file's own sub-step asked for "the `env` entry as a fenced snippet an adopter can paste",
   which is narrower than what landed.

   **Fix:** either reduce the block to the key being added —

   ```json
   "env": { "AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_LOG": "/absolute/path/to/docs-queries.jsonl" }
   ```

   — or keep the full entry and add one sentence after it: "`command`, `args` and `type` are `init`'s
   and already correct for your configured `scriptsDir`; add only the `env` key."

4. **The amended write-surface sentence's own qualifier no longer covers the item added under it** — `docs/cli.md` (`## 3. The re-run contract`, the fourth bullet) — "**Nothing is written outside the repository** except the machine-local artifacts named individually below"

   The added clause is explicit that the query log "is the one artifact here whose location is
   neither inside nor outside the repository by rule" and that "its path is the operator's own". It
   is therefore not a *machine-local* artifact, which is the class the sentence's exception is
   qualified to. As written, the paragraph now enumerates a write surface that can land outside the
   repository and that its own opening predicate does not admit — the exact failure the task file's
   sub-step existed to prevent ("A new write surface that joins neither list leaves that sentence
   false the moment this fix lands").

   **Fix:** widen the qualifier by one word rather than restructuring the paragraph — "except the
   artifacts named individually below, each of which lives outside it by that artifact's own
   definition or by the operator's own choice rather than by this CLI's" — or add "and the
   operator-located query log" to the qualifier. The rest of the added clause is correct and needs no
   change.

## Nice to Have

5. **The query-log paragraph carries a claim of uniqueness that its own neighbour weakens** — `docs/retrieval.md` (`## How it fits together` → the *Query log* bullet) — "it is the only thing that distinguishes a tool no agent reaches for from one agents reach for and get nothing from"

   `server.ts`'s `answer` deliberately does **not** log the argument-refusal exit (its own comment
   says so: "The argument refusal is the one exit this log does not record"). That is a defensible
   choice, but it means a call that reached the tool and was rejected at the argument gate leaves no
   trace, so "the only thing" overstates slightly for the eval branch that will read this as its
   input contract.

   **Fix:** one clause — "…get nothing from (an argument refusal is not recorded: it precedes the
   resolved query and `k` the record's fixed key set requires)". Same sentence, no restructuring.
