### 8. `docs search` prints nothing at all when a non-abstaining mode returns zero hits

**File:** `cli/src/commands/docs.ts` (`search`) — "if (rendered !== '') ctx.report.result(rendered);", with `cli/src/retrieval/search.ts` (`renderResults`) — "No hits and no abstention render as `''`."

`renderResults` returns the empty string for a result that carries no hits and did not abstain, and the command then prints nothing and exits `0`. That state is reachable: `lexical`, `vector` and `fused` never abstain by this module's own rule, so a query answered against an empty or freshly-cleared index — or a `lexical` query on an index whose BM25 arm returns nothing — produces a run that writes not one line to stdout and reports success.

`.claude/context/conventions.md` → `## Output, logging and errors` makes `result()` *"the one line a caller came for"*, printing whatever the flags are. Silence is the one answer a caller cannot distinguish from a run that did nothing, and `docs/cli.md` § `docs search` does not describe it — it documents hits and `no confident match` only. The default `fused-rerank` mode is unaffected: no candidates means it abstains, so the empty rendering cannot reach a default invocation, which is why this is graded here.

**Fix:** render the zero-hit case explicitly rather than as an empty string, so both the CLI and the MCP tool always answer. In `cli/src/retrieval/search.ts`:

```ts
/** The whole rendering of a search that found nothing, in a mode that does not abstain. Module-private: `renderResults` is its only reader. */
const NO_RESULTS_MESSAGE = 'no results';
```

and in `renderResults`, before the map:

```ts
  if (result.abstained) return ABSTAIN_MESSAGE;
  if (result.hits.length === 0) return NO_RESULTS_MESSAGE;
```

Then simplify the call site in `cli/src/commands/docs.ts` → `search` to `ctx.report.result(renderResults(result));`, dropping the `rendered !== ''` guard, which now has nothing to guard. Update `renderResults`'s own doc comment, which today ends *"No hits and no abstention render as `''`"*, to name `NO_RESULTS_MESSAGE` instead, and add one sentence to `docs/cli.md` → `### docs search`, beside the `no confident match` sentence, saying that a mode that does not abstain prints `no results` when it found none.

Add a case to `cli/test/docs-retrieval.test.mjs` beside `search (a)-(d)`: `docs search --mode lexical` with a query no fixture chunk matches prints `no results` and exits `0`.
