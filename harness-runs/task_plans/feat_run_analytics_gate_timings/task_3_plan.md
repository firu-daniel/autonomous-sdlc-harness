### Task 3 — Read finished rounds from the lane in `run-analytics.sh`, merge them and write schema 2 only when rounds exist

**Goal:** On every call, `cli/templates/scripts/run-analytics.sh` adds every finished, not-yet-recorded Run gates round of the branch to `run-analytics.json`. It skips a running round until a later call, names every record it refused, and still writes the sessions whatever the rounds step does. A run whose lane holds no round records writes exactly the bytes it writes today.

**Depends on:** Task 1 and Task 2.
- **Task 1's mode `rounds`.** The call is:
  `jq -n -R -c -S -f "$sessions_jq" --arg mode rounds --argjson idle_threshold_s 1 --slurpfile known "$work/known_rounds.json" --argjson redact "$redact" --argjson suspend '[]' --arg suspend_source none < "$work/rounds.jsonl"`
  - **`$known` comes from a file, never argv:** `$work/known_rounds.json` holds one JSON value, the old document's `.rounds // []` array, written by `jq -c '.rounds // []' "$work/old.json" > "$work/known_rounds.json"`. The mode reads it as `$known[0]` and exits non-zero when the file does not hold exactly one array. The recorded rounds carry every test file's row, so an `--argjson` of them would outgrow Linux's 131072-byte `MAX_ARG_STRLEN` on a busy branch and fail `exec` with `E2BIG`.
  - **A stale per-phase record is refused by the mode, not here:** a valid `<phase>.tests.tsv` is accepted only when the label's readable `gates.tsv` has at least one row of that phase, else it is named in `skipped` with reason `no <phase> rows in gates.tsv` (or `no readable gates.tsv`). Task 1's header states the residual: a stale record beside `gates.tsv` rows of its phase in which the test gate wrote nothing.
  - **Input:** a marker line `{"run_analytics_round":"<label>","record":"<verdict|gates.tsv|focused.tests.tsv|full.tests.tsv>"}`, then that file's lines.
  - **Output:** `{"rounds": [<round record>…], "skipped": [{"record", "reason"}…]}`.
  - **Round record:** `{round_id, verdict, gates, tests, unreadable}`. Task 1 decides new versus recorded, including `<label>#<N>`, so this task appends `rounds` as given and never re-derives that decision.
- **Task 2's `run-analytics-report.jq`.** It accepts `schema` 1 with no `rounds` key, and `schema` 2 with a `rounds` array. Its `rollup` leaves `.rounds` alone.

**Where this task stops.** This task does not touch these:
- The watcher. `record_run_analytics` is unchanged: it still commits the same two files and still returns 0.
- The self-adopted `scripts/run-analytics.sh` and `scripts/lib/harness-run-lib.sh`, which are **Task 6's**: Task 6 copies this task's edited `cli/templates/scripts/lib/harness-run-lib.sh` comments over byte for byte.
- Any code line of `cli/templates/scripts/lib/harness-run-lib.sh`. This task edits only its comments, to name the new caller.
- No round record's format, and nothing `run-test-suite.sh` or `run-gates.sh` writes.

### Targets

- `cli/templates/scripts/run-analytics.sh`: discovery, the document check, the merge and the output lines, plus its header.
- `cli/templates/scripts/lib/harness-run-lib.sh`: comments only. The file header's lane-ownership clause, `THE RUN GATES LANE` and `hr_test_run_lane_dir`'s `Callers:` line.
- `cli/test/run-analytics-rounds.test.mjs` (new): end-to-end runs of the `init`-written script in a throwaway fixture. It uses `createFixture`, `runCli` and `runBash` from `cli/test/helpers/fixture.mjs`, in the way `cli/test/run-analytics.test.mjs` does. It is not a tree guard: it reads no tree of repository files.

**Work:**

- [ ] **The header.**
  - Amend the **opening paragraph**: besides every not-yet-recorded headless session, the script also records every finished, not-yet-recorded Run gates round of the branch. Say that which rounds are new is decided by `lib/run-analytics.jq`'s mode `rounds`, not by this script, which only finds the records, hands them over and appends what comes back.
  - Amend **`THREE FILES, ONE DRIVER`** so its list of `lib/run-analytics.jq`'s modes adds mode `rounds` beside `sessions`, `overlay`, `transcripts` and `attach`, described as parsing and validating the round records and deciding which rounds are new.
  - Add a `GATE ROUNDS` paragraph after `SUB-AGENT TRANSCRIPTS`:
    - **The lane:** `<state_dir>/test_run_logs/<sanitized branch>/`, resolved by the library's one owner of that path, `hr_test_run_lane_dir "<state_dir>" "$branch"`, with `<state_dir>` taken from `hr_state_dir "$top"` and the result anchored to the checkout root `$top` the script already holds, as `run-test-suite.sh` does. Never a path assembled from `hr_state_path`, `HR_TEST_RUN_LOG_SUBDIR` and `hr_sanitize_branch`, and never a retyped directory name. A non-zero return from either function means no rounds, silently.
    - **What a finished round is:** a regular, non-symlink `<label>.verdict` whose label matches `HR_TEST_RUN_LABEL_PATTERN`.
    - **The records read:** `<label>.gates.tsv`, `<label>.focused.tests.tsv` and `<label>.full.tests.tsv`, each only when it is a regular, non-symlink file. Handed over is not recorded: a `<phase>.tests.tsv` left by an earlier attempt of the label is refused by mode `rounds` unless this attempt's `gates.tsv` has rows of that phase (its header states the rule and the residual), and this script adds no file-age test, because no lane file carries an attempt's start time.
    - **The recorded rounds reach the mode through a file** (`--slurpfile known`), never an argument, because their size grows past Linux's per-argument limit.
    - **Which labels count:** only one with at least one of the three. A lane holding only logs and verdicts, which is an adopter's, contributes nothing.
    - **Running rounds:** a round still running has no `.verdict` and is picked up by a later call.
  - Amend `THE MERGE`:
    - A recorded round, like a session, is never rewritten.
    - A changed record under a recorded label is appended as `<label>#<N>`.
    - A document is schema 2 exactly when it carries a round.
    - An existing schema-1 document is read and extended.
    - Neither a schema-1 nor a schema-2 document of any other shape is accepted.
  - Amend `PATHS IN THE RECORD` to say that round ids, gate ids and file paths pass through the same pairs, through mode `rounds`' `redact_path` (Task 1), which applies the pairs only — **without** the home step and **without** the 160-character cut that free-text fields get — so a long path or label is recorded in full, and a relative path containing `/home/` is not collapsed by the home step.
  - Amend the exit map:
    - Exit 0 may add stderr lines `run-analytics: round record skipped: <label>.<record> — <reason>` and `run-analytics: round records not read: <reason>`.
    - The stdout line becomes `recorded <n> session(s) and <m> round(s) for <branch>` when m > 0, and is unchanged otherwise.
  - Add `REPRO` lines for a finished round and for a running one.
- [ ] **The existing-document check, and discovery.**
  - **The check:** widen the `jq -s -e` test to accept either `.schema == 1` with no `rounds` key, or `.schema == 2` with `.rounds` an array of objects, each with a string `round_id`, besides the existing `sessions` conditions. Reword the refusal to `is not a schema-1 or schema-2 run-analytics document; left untouched`, still exit 1 and still leaving the file as it is.
  - **Discovery, and where it sits.** Discovery and the mode `rounds` call (the next Work bullet) both come **after** `$work` is created (`work=$(mktemp -d …)`), after `$work/old.json` is written (the existing-document branch's `cp`, or the empty-document `printf`), and after the `sessions` call has written `$work/new.json` and set n — and **before** the `no session in <stream_file>` early exit, which they now change (that exit needs m and whether any record was found). The redaction pairs `$redact` are built earlier still, so they are in hand. Discovery steps:
    - Resolve the lane: `state_dir=$(hr_state_dir "$top")`, then `lane=$(hr_test_run_lane_dir "$state_dir" "$branch")`, then prefix it with `"$top/"` when it is relative (the function prints it as given). Do not build the path from `hr_state_path`, `HR_TEST_RUN_LOG_SUBDIR` and `hr_sanitize_branch`. A non-zero return from either call, or an absent lane, means no rounds, silently. Keep `HR_TEST_RUN_LABEL_PATTERN` as the label check.
    - For each `"$lane"/*.verdict` in glob order, skip a non-matching glob, a symlink, a non-regular file and a label outside the pattern.
    - Append to `$work/rounds.jsonl`, for each present record, a `printf` marker line, then `cat` of the file, then one `printf '\n'`. The verdict comes first, and only for a label with at least one of the three records.
  - **Shell rules:** no `$(…)` beyond the forms the file already uses, no new external binary, and bash 3.2.
  - **The library's comments name the third caller (comments only, no code line changes)** in `cli/templates/scripts/lib/harness-run-lib.sh`:
    - `THE RUN GATES LANE`: its callers become three. Add `run-analytics.sh` as a read-only reader of finished rounds' `.verdict` and record files, which takes the lane directory and the label pattern from here. Keep the existing drift sentence about the launcher.
    - `hr_test_run_lane_dir`'s `Callers:` line: add `run-analytics.sh`.
    - The file header's clause "owns the Run gates lane for `run-test-suite.sh` and `launch-sandboxed-gates.sh`": add `run-analytics.sh`.
- [ ] **Running mode `rounds` without ever dying on it.**
  - **When:** only when `$work/rounds.jsonl` is non-empty. First write `$work/known_rounds.json` with `jq -c '.rounds // []' "$work/old.json" > "$work/known_rounds.json"`, then make the call restated under **Depends on** with `--slurpfile known "$work/known_rounds.json"`. Neither the recorded rounds nor the mode's output ever passes through a command-line argument or a shell variable: the mode's stdout goes to `$work/rounds_out.json`, and every later step reads that file (`jq … "$work/rounds_out.json"` for the skipped lines and the count, `--slurpfile` in the merge).
  - **If writing `known_rounds.json` or the call fails:** print one `run-analytics: round records not read: <first stderr line>` to stderr, treat it as no new rounds and continue.
  - **Naming:** print each `skipped` entry as `run-analytics: round record skipped: <record> — <reason>`.
  - **No `die` on this path:** no failure here may reach `die`. The sessions are still merged and both files written, and the exit stays 0.
  - **Counting:** set m to the new rounds' count.
  - **The early exit:** change it to `no session in <stream_file>` only when n is 0, m is 0 and there is no record.
- [ ] **The merge.**
  - Build the merged document as today. Its `rounds` are `($old[0].rounds // []) + <new rounds>`, the new rounds read with `--slurpfile` from `$work/rounds_out.json` (`.rounds` of its one value; `[]` when the rounds step recorded nothing), never passed as an argument.
  - When that array is non-empty, add it and set `schema: 2`.
  - When it is empty, write exactly `{schema: 1, branch, sessions, run: null}` as today, with no `rounds` key.
  - The roll-up, the render, the byte-stable write and the `unchanged:` line are unchanged.
- [ ] **`run-analytics-rounds.test.mjs`.** Open with the rule it enforces: every finished round is recorded once, a running one later, a refused record is named and never stops the write, a re-run changes no byte, and a run with no records writes today's bytes. Each case starts from `init` in a throwaway fixture and sets `RUN_ANALYTICS_SUSPEND_SOURCE=none`. The stream is a small inline one whose orchestrator issues `bash scripts/run-test-suite.sh --wait task_round_1` at least three times. The lane holds hand-written records in the formats `scripts/lib/gate-round-lib.sh` → `THE RECORDS` states. Cases:
  1. **A finished round with both phases:** recorded once, schema 2, with the stdout line naming 1 round. A second call prints `unchanged:` and both files are byte-identical. The `.md` carries `## Gate rounds` with that round's wait.
  2. **A running round** (`.running`, `.gates.tsv` without its `end` line, no `.verdict`): not recorded. After the test writes `.verdict` and completes the records, the next call records it.
  3. **A round whose `full.tests.tsv` breaks its header:** recorded with `unreadable` naming it, and the stderr line names it. With every record broken, the round is not recorded, the sessions are still written and the exit is 0.
  4. **A resumed label:** after recording `task_round_1`, rewrite its records with other seconds. The next call appends `task_round_1#2` and leaves the first entry's bytes unchanged.
  5. **Today's bytes:** two fixtures run the same stream. One has no lane. The other's lane holds a `.log` and a `.verdict` only. Both files must be byte-identical between them, schema 1 with no `rounds` key.
  6. **A pre-existing schema-1 document with one session:** extended to schema 2 with that session's object unchanged. A schema-3 document is refused, exit 1, left byte-identical.
  7. **No machine path:** neither output file carries the fixture root.
  8. **A stale per-phase record under a resumed label:** record `task_round_1` with a `gates.tsv` of `full` rows ending `end\tcomplete` and a `full.tests.tsv`. Then rewrite `gates.tsv` with only `focused` rows ending `end\tstopped`, add a `focused.tests.tsv`, and leave the first attempt's `full.tests.tsv` in place. The next call appends `task_round_1#2` whose `tests` has a `focused` key and no `full` key, and stderr carries `run-analytics: round record skipped: task_round_1.full.tests.tsv — no full rows in gates.tsv`.
  9. **Recorded rounds past the per-argument limit:** write a pre-existing schema-2 `run-analytics.json` whose recorded rounds, serialized with `JSON.stringify(doc.rounds)`, exceed `MAX_ARG_STRING_BYTES` (131072, imported from `cli/test/helpers/fixture.mjs`). Assert that size in the test before running, so the case cannot shrink below the limit unnoticed. A lane round under a new label is then recorded: exit 0, the stdout line names 1 round, the new `round_id` is the last entry of `.rounds`, every earlier entry is byte-identical, and stderr carries no `round records not read` line. On macOS, which has no per-string limit, this case still pins the file route, because no argument carries the rounds.

**Verification:**

- `cli/test/run-analytics-rounds.test.mjs` passes.
- **No existing assertion is contradicted (checked by reading, not by running another suite).** Read the existing assertions about this script's stdout and refusal text in `cli/test/run-analytics.test.mjs`. For a run with no rounds, each one still describes the edited script. Its fixtures have no lane, so `recorded 1 session(s) for feat_x` is still the line. No file under `cli/test/` matches the old refusal text `not a schema-1`: a grep found none when this plan was written, so the rewording breaks no assertion. Re-check with `grep -rn "not a schema-1" cli/test`, which must print nothing. That suite runs at the Run gates round, not in this task.
- **Header text check (by reading the edited header):** `THREE FILES, ONE DRIVER` lists mode `rounds` of `lib/run-analytics.jq` as the place round novelty is decided, and the opening paragraph says the script records finished, not-yet-recorded Run gates rounds with novelty delegated to that mode.
- **Text checks:** run `grep -n 'test_run_logs' cli/templates/scripts/run-analytics.sh`; every line it prints must be a `#` comment line (the `GATE ROUNDS` header spells the lane for the reader), and no non-comment line of the edited script carries `test_run_logs`, because the code takes the lane from `hr_test_run_lane_dir` only. Separately, by reading, no `exit` or `die` is reached from the rounds path.
- **No round data on argv:** `grep -n 'mode rounds' cli/templates/scripts/run-analytics.sh` prints a call carrying `--slurpfile known` and no `--argjson known`, and no line of the script passes `known_rounds.json`'s or `rounds_out.json`'s content through `$(…)` into an argument.
- **The lane has one home:** `grep -n 'hr_test_run_lane_dir' cli/templates/scripts/run-analytics.sh` prints the discovery call, and `grep -n 'HR_TEST_RUN_LOG_SUBDIR' cli/templates/scripts/run-analytics.sh` prints nothing. `grep -n 'run-analytics.sh' cli/templates/scripts/lib/harness-run-lib.sh` prints a line inside `THE RUN GATES LANE`, the `Callers:` line above `hr_test_run_lane_dir()` and the file header's lane clause.
- `git diff -U0 cli/templates/scripts/lib/harness-run-lib.sh` shows changed lines that are all `#` comment lines.
