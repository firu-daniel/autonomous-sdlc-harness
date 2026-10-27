### 2. A session's `Cache hit ratio` is read from the record, not computed from the share the token rows beside it show

**File:** `cli/templates/scripts/lib/run-analytics-report.jq` (`session_md`) — "[\"Cache hit ratio\", $c.cache_hit_ratio]," — and its byte-identical mirror `scripts/lib/run-analytics-report.jq` (same anchor)

In `### Cost and tokens`, this branch moved the four token rows from the record (`$c.*`) to the session's share (`$sh.input_tokens`, `$sh.output_tokens`, `$sh.cache_read_tokens`, `$sh.cache_write_tokens`). The header says so: "Per session, the four token totals are the share's". The `Cache hit ratio` row was left reading `$c.cache_hit_ratio`, the stored value. That value disagrees with the rows around it in two cases:

- **A record from before token accounting.** Its four token rows now render `—`, because the share treats it as not available. But its stored `cache_hit_ratio` is the old one, computed over `result.usage`'s main-thread totals, and the task prompt names that ratio as computed from the wrong totals. The session shows a ratio that is known to be wrong beside `—` for every operand it should come from.
- **A resumed occurrence (`<session_id>#<N>`).** `lib/run-analytics.jq` computes the stored ratio over the cumulative `modelUsage`, while the token rows show this occurrence's share. The whole-run ratio in `run_of` is already computed over the share sums, so only the per-session row is inconsistent.

**Fix:**

1. In `session_md`, replace `["Cache hit ratio", $c.cache_hit_ratio],` with a ratio computed from the share. It must be null whenever any operand is not a number:

   ```jq
   ["Cache hit ratio",
    (if ([$sh.cache_read_tokens, $sh.cache_write_tokens, $sh.input_tokens] | map(type == "number") | all)
        and ($sh.cache_read_tokens + $sh.cache_write_tokens + $sh.input_tokens) > 0
     then ($sh.cache_read_tokens / ($sh.cache_read_tokens + $sh.cache_write_tokens + $sh.input_tokens) | round4)
     else null end)],
   ```

2. Extend the header's per-session bullet, "Per session, the four token totals are the share's", with ", and Cache hit ratio is computed from them (— when any is null)".

3. Copy the edited template over `scripts/lib/run-analytics-report.jq` and confirm with `cmp cli/templates/scripts/lib/run-analytics-report.jq scripts/lib/run-analytics-report.jq`.

4. In `cli/test/run-analytics-tokens.test.mjs`, case C, add an assertion that session 1's Markdown contains `| Cache hit ratio | 0.9572 |`. The value is the one the header's hand computation already derives: 13800 / 14417. If Finding 1's legacy-record case is present, also assert that its rendered session contains `| Cache hit ratio | — |`. Run only that file: `npm test --workspace cli -- test/run-analytics-tokens.test.mjs`.
