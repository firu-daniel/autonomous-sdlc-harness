# general review — 3. Nothing records whether an agent ever calls `search_docs` — iteration 1

Scope: the catch-all layer (`path: "."`). The in-scope changed files are `docs/retrieval.md` and
`docs/cli.md`; `cli/src/retrieval/queryLog.ts`, `cli/src/retrieval/server.ts`,
`cli/src/core/writer.ts` and `cli/test/docs-retrieval.test.mjs` belong to the `cli` layer's dispatch
and are graded here only where a cross-document claim in a `docs/` file disagrees with one of them
(`## Documentation parity`).

**Iteration 0 items, re-checked.** The Must Fix (1, the unmeasured cwd claim) is resolved — the
bullet now reads "whether the agent runner starts this server with the checkout root as its working
directory is still open (`## Still open`), so a relative one is not safe", and that heading resolves
in the same file. Should Fix 3 (the pasteable snippet freezing `scripts/`) is resolved by the added
sentence after the fenced block. Should Fix 4 (`docs/cli.md`'s qualifier not covering the item added
under it) is resolved by the widened qualifier. Nice to Have 5 (the "only thing" overstatement) is
resolved by the added argument-refusal clause. **Should Fix 2 was not applied and is carried
forward below unchanged in substance.**

Verified by execution, this iteration: `npx tsc --noEmit -p cli/tsconfig.json` exits 0;
`npm run build && node --test cli/test/docs-retrieval.test.mjs` is 17/17, including (h), (i), (j).

## Should Fix

1. **`docs/retrieval.md` and `cli/src/retrieval/queryLog.ts` still state the SDK's inherited-env set differently, and the code-side one is the wrong statement** (carried forward from `review_0.md` finding 2, unapplied) — `docs/retrieval.md` (`## How it fits together` → the *Query log* bullet) — "`DEFAULT_INHERITED_ENV_VARS` in `@modelcontextprotocol/sdk/client/stdio.js` is `HOME`, `LOGNAME`, `PATH`, `SHELL`, `TERM` and `USER` on POSIX"

   `cli/src/retrieval/queryLog.ts`'s header still states the same fact as: "`getDefaultEnvironment()`
   in `@modelcontextprotocol/sdk/client/stdio.js` is `HOME`, `LOGNAME`, `PATH`, `SHELL` and `USER` on
   POSIX" — a different symbol and a five-name list omitting `TERM`.

   Confirmed this iteration by **reading** the installed SDK source rather than by re-running a
   probe: `node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js` line 24 declares the
   POSIX arm of `DEFAULT_INHERITED_ENV_VARS` as `['HOME', 'LOGNAME', 'PATH', 'SHELL', 'TERM',
   'USER']`, and `getDefaultEnvironment()` (line 28) loops that constant and skips any name
   `process.env` does not define — so its key set is host-dependent, which is why the iteration-0
   probe (`bash scripts/scratch-run.sh harness-runs/scratch/env-inherit.mjs`) saw five keys from
   `getDefaultEnvironment()` and six from the constant. `docs/retrieval.md` is right; the header
   states a host-dependent observation as an invariant, and it is the spelling the next reader will
   copy.

   The conclusion both sites draw is unaffected — an exported `AUTONOMOUS_SDLC_HARNESS_RETRIEVAL_LOG`
   does not survive into the child, so route (b) is the right answer. This is a
   correctness-of-statement finding, not a behaviour one.

   **Fix:** in `cli/src/retrieval/queryLog.ts`'s header, cite the constant rather than the function
   and give all six names, matching `docs/retrieval.md` verbatim: "`DEFAULT_INHERITED_ENV_VARS` in
   `@modelcontextprotocol/sdk/client/stdio.js` is `HOME`, `LOGNAME`, `PATH`, `SHELL`, `TERM` and
   `USER` on POSIX". (The edit lands in the `cli` layer's file; raised here because the divergence is
   only visible with both documents in view.)
