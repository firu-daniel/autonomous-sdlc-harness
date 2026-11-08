### Task 1 — Add mode `rounds` to `run-analytics.jq`: parse, validate and de-duplicate Run gates round records

**Goal:** Give `cli/templates/scripts/lib/run-analytics.jq` a fifth mode, `rounds`. It turns the concatenated records of a branch's finished Run gates rounds into new round records, and names every record it refused. It decides which rounds are new and how a resumed label is keyed. Finding the files, merging, writing and rendering are other tasks' work.

**Where this task stops.** This task does not touch these:
- `run-analytics.sh`: finding the lane, building the input, merging and choosing the schema are **Task 3's**.
- `run-analytics-report.jq`: the `## Gate rounds` section and accepting schema 2 are **Task 2's**.
- The self-adopted copy `scripts/lib/run-analytics.jq`, which is **Task 6's**.

The round-record shape below is defined here. Tasks 2 and 3 restate it and consume it unchanged.

### Targets

- `cli/templates/scripts/lib/run-analytics.jq`: the new mode, and its header paragraph.
- `cli/test/run-analytics-rounds-parse.test.mjs` (new): the mode's own suite. It runs `jq` on the template file with input built by the test. It reads one fixed file, so it is not a tree guard.

**Work:**

- [ ] **The header** (the comment block above `def polling_min_repeats`):
  - Add a `Mode \`rounds\`` paragraph in the existing modes' form. The call is:
    `jq -n -R -c -S -f run-analytics.jq --arg mode rounds --argjson idle_threshold_s 1 --slurpfile known <file holding the document's .rounds array, or []> --argjson redact '<pairs>' --argjson suspend '[]' --arg suspend_source none < <concatenated records>`
  - **`$known` reaches this mode through a file, never through argv.** `--slurpfile` (present at the jq 1.5 floor, and already used by `run-analytics.sh`) binds `$known` to a one-element array whose element is the file's JSON value, so the mode reads the recorded rounds as `$known[0]`. When `$known` is not exactly one element that is an array, the mode stops with a jq `error` naming that, so the call exits non-zero (Task 3 degrades that to its `round records not read` line). State the reason in the paragraph: one recorded round carries every test file's row, so the recorded rounds of a busy branch outgrow Linux's per-argument limit `MAX_ARG_STRLEN` (131072 bytes on 4 KiB pages; in the harness's own repository, `cli/test/helpers/fixture.mjs` → `MAX_ARG_STRING_BYTES` records it — never "this repository", since the header ships into every adopter's checkout, where that file does not exist), and an `--argjson` of them would make `exec` of `jq` fail with `E2BIG`.
  - Amend `EVERY MODE TAKES EVERY VARIABLE` where it lists the modes, and add one sentence: the variable set is unchanged, and a variable may be bound by `--slurpfile` as well as by `--arg` / `--argjson`; mode `rounds` binds `$known` that way, as the recorded rounds array wrapped in a one-element array, not session ids. Every other mode keeps `--argjson known`.
  - State the input format:
    - Raw lines, read with `inputs`.
    - A line that `fromjson?` parses to an object with string `run_analytics_round` and string `record` starts that round's record. `record` is one of `verdict`, `gates.tsv`, `focused.tests.tsv` and `full.tests.tsv`.
    - The lines up to the next such marker are the record's lines.
    - Exactly one empty line at the end of a record is dropped before validation. The driver appends a newline after each file.
    - Lines before the first marker are ignored.
  - State the output: `{"rounds": [<round record>…], "skipped": [{"record": "<label>.<record>", "reason": "<one line>"}…]}`, with `skipped` sorted by `record`.
  - Say this is the only mode that reads Run gates records. The header states the accepted record shapes itself, as this reader's contract — the four record names and, for each, the line shapes the **Validation** bullets below list in full — so an adopter's checkout needs no other file to know what the mode accepts. Cite `run-test-suite.sh` → `WHAT A GATE IS TOLD` as the shipped allowance for a gate command to write its own `<label>.<suffix>` records beside the round's log. Name this repository's producers only as the current writers of those shapes, never as the format's owners, for example *"in the harness's own repository, `scripts/lib/gate-round-lib.sh` and `scripts/lib/test-timing-reporter.mjs` write them"*. A gate that writes these shapes is read; this mode changes no producer.
  - Amend the file's ownership statement so it names the new mode, in the same edit:
    - **The title line** (`run-analytics.jq — per-session records from one headless stream file.`) also names Run gates round records, for example `run-analytics.jq — per-session records from one headless stream file, and Run gates round records from a branch's finished rounds.`
    - **The `Owns:` paragraph** gains a clause: `and turning a branch's finished Run gates round records (mode \`rounds\`) into round records, deciding which are new`.
    - Keep the existing *"reads no file of its own, resolves no path …"* sentence of that paragraph as it is. The new mode satisfies it, because it reads only stdin and its variables.
- [ ] **Validation.** Write it within the jq 1.5 floor that the header's `Floor:` line states: no regex, so digit and path checks go through `explode`; every `if` has an `else`; no jq keyword as a key. A record failing any check below is unreadable, and its reason names the first failed check:
  - **`verdict`:** exactly one line, either `pass`, or `fail` optionally followed by a space and anything. Only the first word is kept.
  - **`gates.tsv`:**
    - First line exactly `phase\tgate\tstatus\tseconds`.
    - Last line `end\tcomplete` or `end\tstopped`.
    - Every row between has four tab-separated fields: phase `focused` or `full`; gate non-empty with no space; status `ok`, `FAIL`, `BLOCKED` or `SKIPPED`; seconds all digits.
  - **`<phase>.tests.tsv`:**
    - First line exactly `file\tstatus\tseconds\ttests\tfailed`.
    - Last line `end`.
    - Every row between has five fields:
      - file non-empty, not starting `/`, with no space and no `.` or `..` segment;
      - status `pass` or `fail`;
      - seconds digits, optionally followed by `.` and digits;
      - tests and failed all digits.
  - The caller's own file pattern and gate-id set (`GR_TEST_FILE_PATTERN`, the ids `run-gates.sh` passes) are deliberately **not** checked. They belong to `run-gates.sh` and are not known here.
  - **After validation: a per-phase record belongs to this attempt only when this attempt ran that phase.** A valid `<phase>.tests.tsv` can be a stale file from an earlier attempt of the same label: `scripts/lib/gate-round-lib.sh` → `gr_run_round` truncates only `<label>.gates.tsv` at round start, a per-file record is written only when the test gate runs in that phase (`gr_tests_destination`), and `run-test-suite.sh` → `ONE RUN PER LABEL` re-runs a finished label whenever the tree changed. So accept a `<phase>.tests.tsv` that passed validation only when the label's `gates.tsv` is readable **and** has at least one row whose phase is `<phase>`. Otherwise the record is left out of the round and named in `skipped` only, with reason `no <phase> rows in gates.tsv` (or `no readable gates.tsv` when that record is absent or unreadable). It is **not** added to the round's `unreadable`, which lists records of this attempt that failed validation; a refused stale file is no fact about this attempt. State this rule in the header's `Mode \`rounds\`` paragraph with its reason.
    - **Residual, stated in the same header paragraph:** a stale `<phase>.tests.tsv` still passes this rule when this attempt's `gates.tsv` has rows of that phase but the test gate wrote no record in it — it did not run there (BLOCKED by a prerequisite, or the attempt was killed first). Why it is narrow: a label's focus set is computed from the newest **other** label's record, never its own (`gr_previous_focus_var`), so a resumed attempt of the same label normally gets the same focus set as the earlier one. The test gate is then in both focused phases or in neither, and the narrowed test gate always runs in `full`. Why no file-age test closes it: no record in the lane carries this attempt's start time. `gates.tsv`'s mtime is its last append (the `end` line), which always postdates this attempt's own per-file record, and `<label>.commit` is renamed into place at the run's end, just before `.verdict` (`run-test-suite.sh` → `BESIDE THE LOG`), so it also postdates a fresh record. A stale record and a fresh one therefore compare the same way against both. Closing the residual is the producer's to do, by truncating or removing `<label>.<phase>.tests.tsv` at round start, and this branch changes no producer.
- [ ] **The round record.** Emit one per label whose verdict record is readable and which has a readable `gates.tsv` (by the per-phase rule above, a `*.tests.tsv` is accepted only beside one):
  - `round_id`: the label or `<label>#<N>` (below).
  - `verdict`: `pass` or `fail`.
  - `gates`: `{outcome: "complete"|"stopped", rows: [{phase, gate, status, seconds}]}`, with `seconds` a number and rows in record order. The contract keeps `null` for "no readable `gates.tsv`", which Task 2 renders as `—`, but no round this mode emits carries it.
  - `tests`: an object with a `focused` and/or `full` key, only for phases whose record was readable and accepted by the per-phase rule. Each is an array of `{file, status, seconds, tests, failed}`, in record order, with the last three as numbers. Record order is the only order promised: the mode neither checks nor imposes a sort by `seconds`, so a consumer that wants the slowest files sorts them itself (Task 2 does).
  - `unreadable`: the sorted `record` names of this round that failed validation.
  - `round_id`, every `gate` and every `file` pass through a new `def redact_path`, **never** through `redact`. `redact` ends with `.[0:160]`, a cut written for free-text fields; applied to a `file` it would shorten the record itself (the ledger rule *"truncation belongs to a display, never to the record"*) and merge two paths sharing a 160-character prefix into one key, and applied to `round_id` a label over 160 characters (`HR_TEST_RUN_LABEL_PATTERN` bounds no length) would never equal its stored entry under **New versus recorded**, so it would be appended again on every call. Define `redact_path` as `if type != "string" then . else <redact's replace-pairs reduce> end` — the replace-pairs step **only**, with neither `strip_home` step and no cut. The home step is left out because `def strip_home($pre)` runs `split($pre)` anywhere in the string, not only at its start, and replaces the following `seg_len` run with `~`: a valid relative `file` `src/home/a.test.ts` would become `src~`, and so would `src/home/b.test.ts`, merging two rows into one key and losing both paths. Validation already refuses a `file` starting with `/`, so for `file` the home step protects nothing. Redefine `redact` as `if type != "string" then . else redact_path | strip_home("/Users/") | strip_home("/home/") | .[0:160] end` — the same three steps in the same order as today — so `redact`'s output is byte-unchanged for every existing caller and the pair logic has one home. State both of these — why the home step is absent, and that `redact`'s output is unchanged — in a source comment above `def redact_path`. Amend the header's *"Every free-text field written … goes through `redact`"* bullet with one sentence: mode `rounds`' round ids, gate ids and file paths go through `redact_path`, the replace pairs only, with neither the home step nor the 160-character cut, because they are keys and record values, not display text, and the home step matches `/home/` inside a relative path.
  - Key names avoid the jq keywords `label` and `end`.
  - **A round is not emitted** when its verdict is unreadable (`skipped` names `<label>.verdict`), or when its `gates.tsv` is absent or unreadable (`skipped` names each of its records: an unreadable one with its validation reason, a valid `*.tests.tsv` with `no readable gates.tsv`). Unreadable records of an emitted round, and its refused stale ones, are named in `skipped` too.
- [ ] **New versus recorded.** Compare the parse's `{verdict, gates, tests, unreadable}` with the **last** entry of `$known` whose `round_id | split("#")[0]` equals the label:
  - No such entry: emit with `round_id` = label.
  - Equal: emit nothing.
  - Different: emit with `round_id` = `<label>#<k + 1>`, where k is how many entries of `$known` carry that label.

  A recorded entry is never altered. Order the emitted rounds deterministically. A label ending in `_round_<digits>` sorts by the text before the last `_round_` and then by that number as a number, so `task_round_2` comes before `task_round_10`. Any other label sorts by its own text after them.
- [ ] **`run-analytics-rounds-parse.test.mjs`.** Open with the rule the suite enforces: every readable round is recorded once with every row, every unreadable record is named, and a resumed label is appended, never rewritten. Run `jq` with `execFileSync` and a fixed argument vector over input the test builds; `$known` is bound with `--slurpfile` from a file the test writes in a throwaway directory. Cases:
  - **One valid round:** both phases and a gates record. Assert every row and number, and that a record of 12 test files keeps all 12.
  - **Each validation failure class above:** each named in `skipped` with its record name.
  - **All non-verdict records unreadable:** not emitted, and each named.
  - **An unreadable verdict:** not emitted.
  - **A stale per-phase record:** a `gates.tsv` with only `focused` rows ending `end\tstopped`, a valid `focused.tests.tsv` and a valid `full.tests.tsv`. The round is emitted with `tests` holding `focused` only, its `unreadable` empty, and `skipped` naming `<label>.full.tests.tsv` with reason `no full rows in gates.tsv`.
  - **A valid `*.tests.tsv` with no `gates.tsv`:** not emitted, and `skipped` names it with reason `no readable gates.tsv`.
  - **`$known` not a single array** (the slurped file holds an object, or two values): the call exits non-zero.
  - **`$known` holding the same round:** emits nothing.
  - **`$known` holding a different round for the label:** emits `<label>#2`, and `<label>#3` when `$known` holds two.
  - **Ordering:** `task_round_2` before `task_round_10`.
  - **Redaction:** a gate id carrying a redact pair's `from` comes out with its `to`.
  - **No cut on keys and record values:** a `file` of 200 characters comes out with all 200 (after the pairs), two files sharing their first 160 characters stay two rows with distinct `file`s, and a label of 200 characters whose same round is already in `$known` emits nothing.
  - **No home step on keys and record values:** a `focused.tests.tsv` with rows `src/home/a.test.ts` and `src/home/b.test.ts` (and an empty redact pairs list) comes out as two rows whose `file` values are exactly `src/home/a.test.ts` and `src/home/b.test.ts`.

**Verification:**

- `cli/test/run-analytics-rounds-parse.test.mjs` passes.
- A run over input with no marker line prints `{"rounds":[],"skipped":[]}`.
- The new mode's text uses no jq keyword as a `$` variable, a `.` field or an object key. The mode reads no file and resolves no path: it consumes only stdin and its variables, as the header's `Owns:` line says of every mode.
- **The cut stays on display text only (by reading the edited file):** `.[0:160]` and the `strip_home` calls appear only in `redact`, never in `redact_path`; `redact` is `redact_path`, then `strip_home("/Users/")`, then `strip_home("/home/")`, then that cut; and mode `rounds` calls `redact_path` and never `redact`.
- **Ownership text check (by reading the edited header):** the title line and the `Owns:` paragraph both name mode `rounds`, the `Owns:` paragraph says this mode decides which rounds are new, and the *"reads no file of its own, resolves no path …"* sentence is unchanged.
- **Format-ownership text check (by reading the edited header):** the `Mode \`rounds\`` paragraph states every accepted record shape itself, cites `run-test-suite.sh` → `WHAT A GATE IS TOLD` as the allowance for `<label>.<suffix>` records, and names neither `scripts/lib/gate-round-lib.sh` nor `scripts/lib/test-timing-reporter.mjs` as the owner or definer of the format — either may appear only as a current writer in the harness's own repository. The header also never says "this repository" about a file that exists only in the harness's own tree (`scripts/lib/gate-round-lib.sh`, `scripts/lib/test-timing-reporter.mjs`, `cli/test/helpers/fixture.mjs` → `MAX_ARG_STRING_BYTES` included): every such file is introduced as *in the harness's own repository*, and `grep -n "this repository" cli/templates/scripts/lib/run-analytics.jq` returns no hit that refers to one of them.
