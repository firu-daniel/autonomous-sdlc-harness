### 1. The per-session `Cache hit ratio` fix has no test that fails when it is reverted

**File:** `cli/test/run-analytics-tokens.test.mjs`, in the test `'E: a record from before token accounting shows no sub-agent tokens, and says why'`, at the line `assert.ok(!subagents.includes('no transcript was found'), subagents);`. The module header's mutation list, at the bullet beginning `- E: \`lib/run-analytics-report.jq\` renders the stored sub-agent tokens again`.

**Problem.** Code-review Finding 2 changed `session_md` in `cli/templates/scripts/lib/run-analytics-report.jq`. The `Cache hit ratio` row used to read the stored `$c.cache_hit_ratio`. It now computes the ratio from the share's three operands, and renders `—` when any operand is null.

The only assertion on that row is case C's `| Cache hit ratio | 0.9572 |`. It does not discriminate. Session `sess-tok` is a non-resumed `model_usage` session, so the stored `cost.cache_hit_ratio` is also 0.9572. The fix-loop deviation note on code-review Finding 2 records this: "It does not discriminate … No mutation run was made."

That finding's step 4 also required a second assertion: if Finding 1's legacy-record case was present, assert `| Cache hit ratio | — |` in its rendered session. Finding 1 was applied after Finding 2, and it added case E, so the condition now holds. The assertion was never added.

**Effect.** Reverting the row to `["Cache hit ratio", $c.cache_hit_ratio],` passes every case. A record written before token accounting would then show its old main-thread ratio beside `—` for every token operand, which is exactly the defect Finding 2 fixed.

**Proof:**

- `grep -n "Cache hit ratio" cli/test/run-analytics-tokens.test.mjs` returns one line, the case C assertion.
- A hand render of a legacy session (a `cost` with no `token_source` key and a stored `cache_hit_ratio` of 0.9) through `jq -r -f cli/templates/scripts/lib/run-analytics-report.jq --arg mode markdown` prints `| Cache hit ratio | — |` with the current code.
- With the old `$c.cache_hit_ratio` read, the same render prints the stored value. In case E's clone of `sess-tok`, that stored value is 0.9572.

**Fix:**

1. In case E, after the existing `assert.ok(!subagents.includes('no transcript was found'), subagents);`, add an assertion on the session's whole Markdown, outside the `### Sub-agents` section:

   ```js
   assert.ok(sessionMd(md, 1).includes('| Cache hit ratio | — |'), sessionMd(md, 1));
   ```

2. In the module header's mutation list, extend the `- E:` bullet so it reads:

   ```
   *   - E: `lib/run-analytics-report.jq` renders the stored sub-agent tokens again — run red once on
   *     fix_run_analytics_token_accounting; separately, `session_md`'s `Cache hit ratio` row reads
   *     `$c.cache_hit_ratio` again — run red once on fix_run_analytics_token_accounting.
   ```

   Write the second clause only after running that mutation red. Apply it to `cli/templates/scripts/lib/run-analytics-report.jq` alone, run the file, see case E fail, then revert the template. `cmp cli/templates/scripts/lib/run-analytics-report.jq scripts/lib/run-analytics-report.jq` must exit 0 afterwards.

3. Run only this test file, once with the mutation and once after reverting it: `npm test --workspace cli -- test/run-analytics-tokens.test.mjs`.

This finding edits the test file only. No template or mirror change remains once the mutation is reverted.
