### Task 2 — Accept schema 2 in `run-analytics-report.jq` and render the `## Gate rounds` section

**Goal:** Let `cli/templates/scripts/lib/run-analytics-report.jq` read a document carrying Run gates rounds. Its `markdown` mode adds a `## Gate rounds` section. A schema-1 document renders exactly as today, and `.run` is recomputed exactly as today.

**Depends on:** Task 1. That task defines the round record this task renders: `{round_id, verdict, gates, tests, unreadable}`.
- `round_id` is a label, or `<label>#<N>` for a later occurrence.
- `verdict` is `pass` or `fail`.
- `gates` is `null` or `{outcome: "complete"|"stopped", rows: [{phase, gate, status, seconds}]}`.
- `tests` has optional `focused` / `full` keys, each holding `[{file, status, seconds, tests, failed}]` in record order. Task 1 promises no other order and checks none, so this task sorts the rows itself before choosing the slowest.
- `unreadable` is a sorted list of record names such as `full.tests.tsv`.

**Where this task stops.** This task does not touch these:
- `run-analytics.sh`: who writes `schema: 2`, and when, is **Task 3's**. This task only reads a document handed to it.
- The self-adopted copy `scripts/lib/run-analytics-report.jq`, which is **Task 6's**.

### Targets

- `cli/templates/scripts/lib/run-analytics-report.jq`: `check_doc`, the `markdown` mode, and the header's `Document:` and `Mode \`markdown\`` paragraphs.
- `cli/test/run-analytics-report-rounds.test.mjs` (new): this program's suite for the new section. It runs `jq` on the template file with documents built by the test. It reads one fixed file, so it is not a tree guard.

**Work:**

- [ ] **`check_doc` and the header's `Document:` line.** Accept two shapes:
  - `schema` 1 with no `rounds` key.
  - `schema` 2 with `.rounds` an array.

  Any other schema is the existing error, reworded to `expected 1 or 2`. A schema-1 document carrying `rounds`, or a schema-2 one whose `rounds` is not an array, is an error naming which. Mode `rollup` stays `.run = (.sessions | run_of)`: `.run` gains no key and `.rounds` passes through untouched.
- [ ] **The section's place and wall figure.**
  - **Place:** in `markdown`, render `## Gate rounds` between the `## Whole run` table and the first `## Session`, only when `(.rounds // []) | length > 0`. Otherwise emit nothing, not even a blank line, so a schema-1 document's text is unchanged byte for byte.
  - **Lead lines:** under the heading, one line saying that `Wait` is the orchestrator's wait on `run-test-suite.sh --wait <label>`, and one saying that a phase's test-file total is the sum of each file's own seconds, which exceeds the gate's wall time when files run in parallel.
  - **The wait figure:** computed per bare label (`round_id | split("#")[0]`). It is the sum of `total_ms` over every session's `.tools.polling[]` entries whose `context` is `orchestrator` and whose `command`, split on spaces with empty pieces dropped, ends in the two tokens `--wait` and that label.
  - **When it reads `—`:** when no entry matches, for example a label waited on fewer than three times in a session, so that `run-analytics.jq` → `polling_min_repeats` wrote no polling row for it, or a command cut at 160 characters by `redact`. State that limit in the lead line.
- [ ] **One sub-section per round, in document order.**
  - **Heading:** `### Round <round_id> — <verdict>`.
  - **Measure / Value table:**
    - `Wait (every run of <label>)`, through `fmt_dur`.
    - `Gate rows` as `<n> (<outcome>)`, or `—` when `gates` is null.
    - One `Test files — <phase>` row per phase present, as `<count> files, <total> s summed`.
  - **Gate table:** `Phase | Gate | Status | Seconds`, in record order, seconds as `<n> s`.
  - **Per phase present:** `#### Slowest test files — <phase> (<shown> of <count>)`, then `File | Status | Seconds | Tests | Failed`, holding the first `slowest_test_files` rows of that phase's array **after sorting it by `seconds` descending, then `file` ascending** (`sort_by([0 - .seconds, .file])` — subtraction from zero, as `run_of`'s `slowest_subagent` already writes `sort_by(0 - .duration_ms)`, because the header's `Floor:` forbids unary minus). The sort is the report's own; the document's array is never reordered, so `rollup` and the JSON keep record order.
  - **Unreadable records:** a `Records not read: <list>` line when `unreadable` is non-empty.
  - **The constant:** declare `def slowest_test_files: 10;` beside the other top-level `def`s. Name N = 10 in the header's `Mode \`markdown\`` paragraph, and state there that the JSON keeps every row while the report shows only the slowest N.
  - **Formatting:** format test-file seconds and totals with exactly one decimal, built from `(. * 10 + 0.5 | floor)`, so a float sum never renders a long tail. Reuse `table`, `row` and `cell` so a `|` in a file name is escaped as elsewhere.
- [ ] **`run-analytics-report-rounds.test.mjs`.** Open with the rule the suite enforces: a schema-1 document renders exactly as before, and a schema-2 document renders every round with only the slowest N files. Run `jq -r -f <template> --arg mode markdown` and `--arg mode rollup` through `execFileSync` with a fixed argument vector, on documents built by the test with one session. Cases:
  - **Schema-1 document:** the markdown has no `## Gate rounds`. It equals the markdown of the same document re-run (deterministic), and the text before `## Session 1` is the whole-run table only.
  - **Schema-2 document, one round:** a `full` phase of 12 files gives `(10 of 12)`, with the ten slowest by `seconds` descending. The gate table has every row. A polling entry `bash scripts/run-test-suite.sh --wait task_round_1` with `total_ms` 90 000 gives `1m 30s`.
  - **Rows arriving unsorted:** a `full` phase of 12 files in an order that is neither ascending nor descending by `seconds`, two of them tied on `seconds`. The table shows `(10 of 12)` with the ten largest `seconds` in descending order, the tied pair in `file` ascending order, and the two smallest absent. `rollup` on the same document keeps the array in its original order.
  - **The same round with no matching polling entry:** renders `—`.
  - **A `task_round_1#2` occurrence:** renders its own sub-section, with the label's wait.
  - **`unreadable: ["focused.tests.tsv"]`:** renders the `Records not read` line.
  - **`rollup` on the schema-2 document:** keeps `.rounds` byte-equal, and gives the same `.run` as on the schema-1 document with the same sessions.
  - **Rejected documents:** schema 3, and schema 1 carrying `rounds`, each fail with a message naming the problem.

**Verification:**

- `cli/test/run-analytics-report-rounds.test.mjs` passes.
- Take one existing committed schema-1 `run-analytics.json` under `harness-runs/run_analytics/`. Render it through the edited template and through the self-adopted `scripts/lib/run-analytics-report.jq`, which still holds the pre-edit bytes until Task 6. Use `jq -r -f <program> --arg mode markdown <file>` for each, and the two texts must be identical. Compare them by reading both outputs, never with a pipe.
- The new text uses no jq keyword as a `$` variable, a `.` field or an object key, and every `if` has an `else`.
- The new text uses no unary minus: every negation is written `0 - <expr>`, as the header's `Floor:` line requires.
