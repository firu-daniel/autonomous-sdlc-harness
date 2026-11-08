# Task plan review — iteration 1

## Must Fix

1. **Last round's Should Fix was neither applied nor recorded under `## Rejected findings`.** The plan repeats a ledger lesson. Files: `task_3_plan.md`, and the story index (`feat_run_analytics_gate_timings_story_plan.md`) for the record.
   `review_0.md` → `## Should Fix` 1 reported a contradiction in `task_3_plan.md`, and it is still there:
   - The `GATE ROUNDS` → **The lane** bullet asks the header to spell the lane as `` `<state_dir>/test_run_logs/<sanitized branch>/` ``.
   - **Verification** → **Text checks** then says to "grep the edited script, and find `test_run_logs` nowhere as a literal".

   A header written as asked fails that check. The story index has no `## Rejected findings` section, so the finding was not recorded as rejected either. `harness-runs/lessons.md` → *Unattended control loops* says: *"In a revision round, a reviewer's Should Fix is applied or recorded under `## Rejected findings` with its reason. It is never held for a go-ahead the loop does not relay."*
   **Fix:** In `task_3_plan.md`, either narrow the **Text checks** bullet to code lines (for example "no non-comment line of the edited script carries `test_run_logs`"), or reword the `GATE ROUNDS` lane bullet so the header does not spell the directory name. Alternatively, add a trailing `## Rejected findings` section to the story index that records the finding with a reason that holds.

2. **Task 2 assumes the test-file rows arrive slowest first, but Task 1 never promises or checks that order** — `task_2_plan.md` (and `task_1_plan.md` if the fix goes there).
   `task_2_plan.md` → **Depends on** restates Task 1's `tests` rows as "in record order, slowest first". The `#### Slowest test files — <phase> (<shown> of <count>)` table then shows "the first `slowest_test_files` rows". `task_1_plan.md` defines `tests` only as arrays "in record order". Its **Validation** bullets, which the header states as the reader's whole contract for `<phase>.tests.tsv`, check no row order. The plan presents the shipped reader as one that reads any gate writing these shapes (`run-test-suite.sh` → `WHAT A GATE IS TOLD`). For such a gate, a record in any other order gets a "Slowest" table that is just its first ten rows. The descending order comes only from this repository's `scripts/lib/test-timing-reporter.mjs` → `THE RECORD` ("sorted by `seconds` descending then `file` ascending"), which neither task names as part of the contract. This breaks the rule that a consumer restates only what its producer defines.
   **Fix:** Pick one of these:
   - (a) In `task_2_plan.md`, sort each phase's rows by `seconds` descending, then `file` ascending, before taking the first `slowest_test_files`. Drop "slowest first" from the restated contract, and add a case to `run-analytics-report-rounds.test.mjs` whose rows arrive unsorted.
   - (b) In `task_1_plan.md`, add the order to the `<phase>.tests.tsv` validation (rows non-increasing by `seconds`, an out-of-order record unreadable with a named reason) and to the header's accepted shape, with a parse-suite case. Then Task 2's restatement matches its producer.

## Should Fix

1. **`redact` cuts round ids, gate ids and file paths to 160 characters inside the record** — `task_1_plan.md` ("`round_id`, every `gate` and every `file` pass through the existing `redact`"), and Scope register row 19.
   `cli/templates/scripts/lib/run-analytics.jq` → `def redact` ends with `.[0:160]`. That cut was written for free-text fields. Applied to a `file`, it shortens the record itself, which is what the ledger rule row 19 cites (*"truncation belongs to a display, never to the record"*) forbids. Two long paths that share a 160-character prefix would also become one key. Applied to `round_id`, a label longer than 160 characters would never match its stored entry in **New versus recorded**, so it would be appended again on every call and break the byte-identical re-run. The label pattern bounds neither length. Run the three fields through the replace-pairs-and-home steps without the cut, for example a `redact_path` that omits `.[0:160]`. Alternatively, refuse a label or file over the bound with a named `skipped` reason, and correct row 19's reason to match.

2. **Discovery's placement in `task_3_plan.md` is stated ahead of the working directory it writes into.** The bullet says "after the redaction pairs are built", but `$work` is created after that point (`work=$(mktemp -d …)`), and `$work/old.json` (which mode `rounds` needs) later still. State that discovery and the rounds call come after `$work/old.json` is written and after the sessions call, before the early exit they now change.
