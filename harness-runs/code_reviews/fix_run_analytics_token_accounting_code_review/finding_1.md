### 1. A record written before token accounting still shows its undercounted sub-agent tokens, under a note saying none is shown

**File:** `cli/templates/scripts/lib/run-analytics-report.jq` (`session_md`) — "[$sa[] | [.type, .description, (.duration_ms | fmt_dur), .requests," — and its byte-identical mirror `scripts/lib/run-analytics-report.jq` (same anchor)

The branch's rule for a record written before this change is "treated as 'not available' rather than summed, because its figures are the undercounted ones" (story index `## Context`, and this file's own header: "a record whose cost has no token_source key predates true token accounting"). `shares` applies that rule to the session totals, so a legacy session's `Input tokens` / `Output tokens` / … rows render `—` and its `Token source` reads `recorded before token accounting`.

The `### Sub-agents` table does not apply it. It renders each entry's `.output_tokens`, `.input_tokens`, `.cache_read_tokens` and `.cache_write_tokens` as stored. A legacy `subagents[]` entry has no `token_source` key and holds the old stream sums, which are exactly the undercounted figures this branch exists to stop showing (16 in the old `cli/test/run-analytics.test.mjs` fixture, 677 against a true 100,845 in the task prompt's measurement). And because `$untracked` counts every entry whose `token_source` is not `"transcript"`, a legacy entry also triggers the note "— in a token column: no transcript was found for this dispatch, and the stream's own sub-agent usage is partial, so none is shown." So the report shows the partial numbers directly under a sentence saying they are not shown.

A legacy record is not hypothetical. `run-analytics.sh` merges new records onto the stored document and re-renders the whole Markdown, so any branch whose run spans the upgrade carries legacy records in the same report as new ones. The `#### Token attribution` note for such a session has the same problem: it says "N of N sub-agent dispatches have no transcript", but the real cause is that the record predates token accounting.

No case covers a legacy record. Every fixture in `cli/test/run-analytics-tokens.test.mjs` is written by the new code.

**Fix:**

1. In `session_md`, render a sub-agent's four token cells only when its figures came from a transcript. Replace the `### Sub-agents` rows expression with:

   ```jq
   [$sa[] | (if .token_source == "transcript" then .
             else .output_tokens = null | .input_tokens = null
                  | .cache_read_tokens = null | .cache_write_tokens = null end)
          | [.type, .description, (.duration_ms | fmt_dur), .requests,
             .output_tokens, .input_tokens, .cache_read_tokens,
             .cache_write_tokens, .wall_share]]
   ```

2. Make both notes name the legacy cause when the session's share is legacy (`$sh.token_source == "legacy"`):
   - The `### Sub-agents` note, when `$untracked > 0`, becomes:
     - `"— in a token column: this session was recorded before token accounting, and its stream-derived sub-agent figures are partial, so none is shown."` when `$sh.token_source == "legacy"`;
     - the existing sentence otherwise.
   - The `#### Token attribution` note, when `$untracked > 0`, becomes:
     - `"Recorded before token accounting: no sub-agent or session token total is available."` when `$sh.token_source == "legacy"`;
     - the existing `"\($untracked) of \($sa | length) sub-agent dispatches have no transcript; …"` otherwise.

3. Add one line to the header's `Mode markdown` bullet list, after the `#### Token attribution` bullet: `- A sub-agent row whose token_source is not "transcript" (a missing transcript, or a record from before token accounting) renders — in its four token cells.`

4. Copy the edited template over `scripts/lib/run-analytics-report.jq` so the two stay byte-identical, and confirm with `cmp cli/templates/scripts/lib/run-analytics-report.jq scripts/lib/run-analytics-report.jq`.

5. Add a case to `cli/test/run-analytics-tokens.test.mjs`. It takes `doc` from `recordedRun(t, { transcript: true })` and builds a legacy copy of `doc.sessions[0]`:
   - delete `cost.token_source`;
   - delete every `subagents[].token_source`;
   - set the one sub-agent's tokens to `output_tokens: 16, input_tokens: 4, cache_read_tokens: 0, cache_write_tokens: 0`.

   Wrap the copy as `{ schema: 1, branch: BRANCH, sessions: [legacy], run: {} }` and render it with `execFileSync('jq', ['-r', '-f', <the adopted fixture's <scriptsDir>/lib/run-analytics-report.jq>, '--arg', 'mode', 'markdown'], { input: JSON.stringify(document), encoding: 'utf8' })`, the form `cli/test/remote-run.test.mjs` already uses. `recordedRun` must return the fixture `dir` for this, or the case resolves the path from `INIT_SCRIPTS_DIR`. Assert that:
   - the `### Sub-agents` row reads `| task-plan-writer | Write the plan | 9.0s | 2 | — | — | — | — |`;
   - the section contains `this session was recorded before token accounting`;
   - it does not contain `no transcript was found`.

   In the header's mutation list, record the mutation that turns the case red: the report renders the stored sub-agent tokens again. Run only that test file: `npm test --workspace cli -- test/run-analytics-tokens.test.mjs`.
