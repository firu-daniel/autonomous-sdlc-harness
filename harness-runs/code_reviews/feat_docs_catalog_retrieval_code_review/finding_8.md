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

**Deviations from plan (cli layer):** The fix asks for a new case beside `search (a)-(d)`; that exact case already existed as the second assertion of `(c)` in `cli/test/docs-retrieval.test.mjs`, asserting `''` for `docs search NO_MATCH_QUERY --mode lexical`. Its expectation was updated to `'no results'` in place rather than duplicated as a new test.

**Deviations from plan (general layer):** The fix asks for one added sentence in `docs/cli.md` → `### docs search`. The sentence beside it read *"the other modes' scores are rank-derived and uncalibrated, so they always return hits"*, which is the false claim this finding rests on, so that clause was corrected to *"so they never abstain and return whatever they ranked"* in the same edit rather than left standing next to its own contradiction. `### docs serve` was left alone: `cli/src/retrieval/server.ts` passes `mode: 'fused-rerank'`, which abstains on zero candidates, so `no results` is unreachable through the MCP tool and that section's *"or `no confident match`"* stays exact.

**Deviations from plan (cli layer):** `renderResults`'s doc comment names `NO_RESULTS_MESSAGE` as asked and adds the one sentence a reader needs at the point of use — every caller prints what it returns — because `cli/src/retrieval/server.ts` → `textResult(renderResults(result))` is a second caller the finding does not mention and the empty string was equally wrong there.
