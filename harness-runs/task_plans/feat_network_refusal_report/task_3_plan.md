### Task 3 — Hand finished rounds' logs to mode `gate_logs` in `run-analytics.sh`, merge them and write schema 3

**Goal:** On every call, `cli/templates/scripts/run-analytics.sh` hands the log of every finished Run gates round of the branch to mode `gate_logs`, whether or not that round wrote timing records. It appends the entries that come back as `gate_logs`, writes schema 3 when the document carries them, and never stops writing the sessions because of this step. The session refusals need no change here: mode `sessions` already runs on every call and Task 1 put them in its records.

**Depends on:**
- **Task 1's mode `gate_logs`.** The call:
  `jq -n -R -c -S -f "$sessions_jq" --arg mode gate_logs --argjson idle_threshold_s 1 --slurpfile known "$work/known_gate_logs.json" --argjson redact "$redact" --argjson suspend '[]' --arg suspend_source none < "$work/gate_logs.jsonl"`
  - **Input:** a marker line `{"run_analytics_gate_log":"<label>"}`, then the log's lines, then one newline.
  - **`$known`:** a file holding one JSON value, the old document's `.gate_logs // []`. The mode exits non-zero unless that is exactly one array.
  - **Output:** `{"gate_logs": [{log_id, matches: [{kind, test_file, line, count}]}]}`, already new-only: the mode decides new versus recorded, including `<label>#<N>`, so this task appends as given and never re-derives it. Every recorded field is already redacted by the mode.
- **Task 2's `run-analytics-report.jq`.** It accepts schema 1 (neither `rounds` nor `gate_logs`), schema 2 (a `rounds` array, no `gate_logs`) and schema 3 (a `gate_logs` array and a `rounds` array, possibly empty). Its `rollup` leaves both arrays untouched.

**Where this task stops.**
- The watcher is unchanged: `record_run_analytics` still commits the same two files and still returns 0.
- No stdout form changes, and no exit status depends on a match: the report is read-only and changes no verdict.
- No round's run, log, records or verdict changes, and `lib/harness-run-lib.sh` is not touched.
- The self-adopted `scripts/run-analytics.sh` is **Task 6's**. The prose under `docs/` is **Task 7's**.

### Targets

- `cli/templates/scripts/run-analytics.sh`: discovery, the call, the document check, the merge and the header.
- `cli/src/generators/outerLoopScripts.ts`: the comment above the `run-analytics.sh` row of `OUTER_LOOP_SCRIPTS` only, which states what an agent reaching the script can do.
- `cli/test/run-analytics-rounds.test.mjs`: two existing cases updated (Work bullet 4).
- `cli/test/run-analytics-network.test.mjs` (new): end-to-end runs of the `init`-written script in a throwaway fixture, using `createFixture`, `runCli` and `runBash` from `cli/test/helpers/fixture.mjs` as `cli/test/run-analytics-rounds.test.mjs` does. It is not a tree guard.

**Work:**

- [ ] **Discovery, inside the existing loop over `"$lane"/*.verdict`.**
  - The loop already skips a non-regular, symlinked or out-of-pattern `.verdict`. For each label it keeps, and **before** the existing `[ -n "$recs" ] || continue`, append `$lane/$label.log` to `$work/gate_logs.jsonl` when that log is a regular, non-symlink file: one `printf` marker line, then `cat` of the log, then one `printf '\n'`.
  - A copy failure sets `gate_logs_err` to a one-line reason, as `rounds_err` is set. Nothing new resolves the lane: it stays `hr_test_run_lane_dir`'s answer.
  - A running round has no `.verdict`, so its log is read by a later call.
- [ ] **The call, never dying on it.**
  - Make the call only when `$work/gate_logs.jsonl` is non-empty and `gate_logs_err` is empty. First write `jq -c '.gate_logs // []' "$work/old.json" > "$work/known_gate_logs.json"`, then make the call restated under **Depends on**, with stdout to `$work/gate_logs_out.json`. Neither the recorded entries nor the output ever passes through an argument or a shell variable.
  - Set g to `.gate_logs | length` of that file.
  - **On any failure** (the copy, the known file, the call or the count): print one `run-analytics: gate logs not read: <reason>` to stderr, set g to 0 and continue. No path here reaches `die`.
  - The early exit becomes `no session in <stream_file>` only when n, m and g are all 0 and there is no record.
- [ ] **The document check and the merge.**
  - **The check.** Widen the `jq -s -e` test to also accept `.schema == 3`, with `.rounds` an array of objects each with a string `round_id`, and `.gate_logs` an array of objects each with a string `log_id`, besides the existing `sessions` conditions. Schema 1 also must not carry `gate_logs`, nor schema 2. The refusal becomes `is not a schema-1, schema-2 or schema-3 run-analytics document; left untouched`, still exit 1, the file left as it is.
  - **The merge.** `gate_logs` is `($old[0].gate_logs // []) + <new entries>`, the new entries read with `--slurpfile` from `$work/gate_logs_out.json` (`/dev/null` when the step recorded nothing, slurped as `[]`, as `rounds_file` is). When `gate_logs` is non-empty, write `schema: 3` with `gate_logs` and `rounds` (the merged rounds, `[]` when there are none). Otherwise write schema 2 or 1 exactly as today.
  - The roll-up, the render, the byte-stable write and the stdout lines are unchanged. A call that adds only gate-log entries changes the files, so it prints the existing `recorded 0 session(s) for <branch>`.
- [ ] **The header, the generator comment, and the two existing cases.**
  - **Header.** In the opening paragraph, add that the record also lists each session's refused network calls (decided in `lib/run-analytics.jq` mode `sessions`) and each finished round log's possible network attempts (mode `gate_logs`).
  - **`THREE FILES, ONE DRIVER`.** Add mode `gate_logs` to the list of `lib/run-analytics.jq`'s modes.
  - **`GATE ROUNDS`.** Its sentence "Only a label with at least one of the three counts, so a lane of logs and verdicts alone contributes nothing." becomes false. Restate it so it covers round records only: only a label with at least one of the three counts contributes a **round**, so a lane of logs and verdicts alone records no round; its logs are read under `GATE LOGS`.
  - **New `GATE LOGS` paragraph** after `GATE ROUNDS`:
    - which logs are read: a finished label's `<label>.log`, regular and non-symlink, whether or not the round wrote records;
    - that the log's matching lines alone reach the record, redacted and uncut, decided by the mode;
    - that recorded entries reach the mode through a file;
    - that a failure is one stderr line and never stops the sessions.
  - **`THE MERGE`.** Add that a recorded gate-log entry is never rewritten either, new entries appended in the order mode `gate_logs` returns them. Then restate its two schema statements for all three schemas, using the rule restated under Task 2's **Depends on** (Task 2's file, **Depends on**):
    - Replace "A document is schema 2 exactly when it carries a round" with: a document is schema 3 exactly when it carries a gate-log entry, with `gate_logs` and a `rounds` array (possibly empty) beside it; otherwise schema 2 exactly when it carries a round; otherwise schema 1. An existing schema-1 or schema-2 document is read and extended.
    - Replace the refusal enumeration ("does not parse as one schema-1 document without `rounds`, or one schema-2 document whose `rounds` …") with one that admits all three: one schema-1 document with neither `rounds` nor `gate_logs`; one schema-2 document without `gate_logs` whose `rounds` is an array of objects with a string `round_id`; or one schema-3 document whose `rounds` is such an array and whose `gate_logs` is an array of objects with a string `log_id`. The rest of the sentence (refused and left byte-for-byte as it is) stays.
  - **`PATHS IN THE RECORD`.** Its last sentence says file paths pass through `redact_path`, without the home step and without the cut. Keep it for round ids, gate ids and round file paths, and add the gate-log split, citing `lib/run-analytics.jq` → `Mode gate_logs` rather than restating its rules: a gate-log `test_file` goes through `redact_file`, the pairs plus the anchored home step; a gate-log `line` goes through `redact_text` uncut.
  - **The exit map.** Add the stderr line `run-analytics: gate logs not read: <reason>` at exit 0. Extend the `no session in <stream_file>` parenthetical to "(no session, no new round, no new gate-log entry and no record: nothing written)", matching the early-exit rule on n, m and g in the call bullet.
  - **REPRO.** Add a `gate log` line: a finished label with only a `.log` carrying `Error: connect ECONNREFUSED 127.0.0.1:443` and a `.verdict`, giving schema 3 with one match.
  - **`cli/src/generators/outerLoopScripts.ts`.** In the comment above the `run-analytics.sh` row, after "the finished Run gates rounds it reads", add "and the matching lines of their logs", and keep the rest of the sentence. Comment only.
  - **`cli/test/run-analytics-rounds.test.mjs`.** Change nothing else in the file.
    - The case `a run with no round records writes the same bytes with or without a lane of logs and verdicts` becomes `a lane of logs and verdicts adds gate-log entries and no round`. Both fixtures still print `recorded 1 session(s) for <branch>`. Their `sessions` are deep-equal. The bare one is schema 1 with neither key. The logs one is schema 3 with `rounds: []` and one `gate_logs` entry `{log_id: LABEL, matches: []}`.
    - The `schema 3 refused` sub-case becomes `schema 4 refused`: input `"schema":4`, the stderr match is the new refusal text, and the bytes are still unchanged. Update the parent test's title from *a schema-3 one is refused* to *a schema-4 one is refused*.
- [ ] **`cli/test/run-analytics-network.test.mjs`.**
  - **Header.** Opens with its rule: *every refused call in a recorded session reaches both files, every finished round log is scanned once per change, a failure on the log path never stops the sessions, and no machine path reaches either file*.
  - **Setup.** Each case starts from `init` in a throwaway fixture, sets `RUN_ANALYTICS_SUSPEND_SOURCE=none`, and copies Task 1's `cli/test/fixtures/run-analytics-network.jsonl` (read, never edited) as its stream unless the case says otherwise. Log lines are constructed in the test, and its header says so.
  - **Cases:**
    1. **No lane.** The refusal sessions carry their entries. The document is schema 1. The `.md` lists each refusal row (`example.com` and `443` for the two-line N1 shape) and `No Run gates round log was scanned.` A second call prints `unchanged:` and both files are byte-identical.
    2. **No refusal**, the stream `cli/test/fixtures/run-analytics-two-sessions.jsonl`: `No refused network call.`
    3. **A finished label** whose log carries `# Subtest: test/fetch.test.mjs`, `Error: connect ECONNREFUSED 127.0.0.1:443`, the fixture root inside a path, and `ok 3 - CONNECT tunnel failed is network`. The document is schema 3 with one `connect` match attributed to `test/fetch.test.mjs`. The `.md` section lists it with the blind-spot bullets. **Neither file carries the fixture root.** A re-run prints `unchanged:`.
    4. **A running label** (`.running`, a log, no `.verdict`): no `gate_logs`. After the test writes `.verdict`, the next call records it.
    5. **A resumed label.** After recording, rewrite the log with a second match. The next call appends `<label>#2`, and the first entry's bytes are unchanged.
    6. **A symlinked log** beside a regular `.verdict` is not followed: no entry, exit 0, and the sessions are still written.
    7. **Rounds and gate logs together** (`putFinished`'s records plus a log): schema 3 with both arrays non-empty, and the stdout line names 1 round.

**Verification:**

- `cli/test/run-analytics-network.test.mjs` and the edited `cli/test/run-analytics-rounds.test.mjs` pass.
- **No die on the log path:** read every line from the discovery to the merge, and no `die` or `exit` is reached from the gate-log step.
- **No record on argv:** `grep -n 'mode gate_logs' cli/templates/scripts/run-analytics.sh` prints a call carrying `--slurpfile known` and no `--argjson known`.
- **One lane owner:** `grep -n 'HR_TEST_RUN_LOG_SUBDIR\|test_run_logs' cli/templates/scripts/run-analytics.sh` prints only `#` comment lines.
- **Other suites (this check is made by reading the named suites):** `grep -rn "schema-1 or schema-2" cli/test` prints nothing once the edit lands. `cli/test/run-analytics.test.mjs` builds no lane, so its stdout lines and schema-1 assertion still hold.
- `git diff -U0 cli/src/generators/outerLoopScripts.ts` shows changed lines that are all `//` comment lines.
- **The header still states the script (by reading):** no sentence of the header of `cli/templates/scripts/run-analytics.sh` still says that a lane of logs and verdicts contributes nothing, that schema 2 is the only shape carrying rounds, or that every file path skips the home step. `grep -n 'contributes nothing\|schema-1 document without\|2 exactly when' cli/templates/scripts/run-analytics.sh` prints no line; `PATHS IN THE RECORD` names `redact_file` and `redact_text`; the exit map's `no session in` condition names the gate-log entry.
