### Task 1 — Add the run-ledger reader `hr_run_ledger_state` and the bundle's `unfinished` reason to the run library

**Goal:** Give the run library one reader that answers whether a run's own ledger says the run finished, for each of the three engines. Also let the remote state bundle carry the new `pause_reason` value `unfinished`. Task 3 classifies a zero exit with the reader, and Task 4's job mode writes the value into the bundle.

**Where this task stops.** This task adds a reader and widens one vocabulary. It calls neither from the watcher. `classify_run_exit`'s use of the reader is **Task 3's**, and `run_job`'s handling of `unfinished` is **Task 4's**. `hr_ledger_phases` itself is unchanged: its output and its two existing callers (`job_progress_pass` in the watcher, and `remote-run.sh`'s progress report) stay as they are.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh` — the new reader, beside `hr_ledger_phases`; the header's mirror declarations; `hr_remote_status_write`'s vocabulary and the `status.json` comment block above it.
- `cli/test/ledger-phases.test.mjs` — the reader's cases, in the suite that already sources the written library through `libCall`.

**Work:**

- [x] Add `hr_run_ledger_state <state_abs> <branch> <engine>` under the library's `# The flow-progress ledger` section. `<state_abs>` is the run copy's absolute state directory, and an empty `<engine>` means `task`. It prints one line, `<state> <detail>`, with `<state>` one of `finished`, `unfinished`, `absent` or `unreadable`, and returns 0, 1, 2 or 3 respectively. The `<detail>` is one short human-readable clause for a log line. It sets no shell option and writes nothing (`.claude/context/conventions.md` → `## Shell assets`: a sourced library sets no shell options). It stays on the bash 3.2 floor: parameter expansion and `case`, no `[[ =~ ]]`, no `mapfile`.
  - **`task` / `user_review`:** the file is `<state_abs>/flow_progress/<branch>_progress.md`.
    - Not a regular file → `absent`.
    - Present but not readable, or `hr_ledger_phases` returns 1 on it → `unreadable`.
    - Otherwise take `hr_ledger_phases`' line `<engine> <round> <p1> <p2> <p3> <p4>`. The run is `finished` only when all four are `done`, **and** the ledger's engine equals `<engine>`, **and**, for `user_review`, its round equals the active round. Anything else is `unfinished`.
    - The active round is the highest of 1 when `<state_abs>/user_reviews/<branch>_review.md` exists and each `<n>` of an existing `<state_abs>/user_reviews/<branch>_review_<n>.md` whose `<n>` is all digits (base 10, as `max_question_index` forces). With no such file the round test is skipped.
    - The `<detail>` names the failing condition: the phases line, `ledger engine task, run engine user_review`, or `ledger round 1, active round 2`.
  - **`docs`:** the file is `<state_abs>/docs_catalog/<branch>_docs.md`, the checklist whose boxes are the docs flow's only iteration state (`plugin/instructions/docs_orchestration_instructions_autonomous.md` → `## Checklist entry format (parse contract)`).
    - Not a regular file → `absent`. Not readable → `unreadable`.
    - An entry is a line whose first non-blank characters are `- [ ] ` or `- [x] `. No entry line at all → `unreadable`.
    - Any `- [ ] ` entry → `unfinished`. Otherwise → `finished`.
    - The `<detail>` is `checklist <x-count>/<entry-count>`.
  - **Any other `<engine>`** → `unreadable`, `<detail>` naming it.
- [x] Declare the new mirror in the library header, beside the existing `MIRROR OF plugin/instructions/autonomous_pause_and_ledger.md → ### 1.3 Templates` paragraph. `hr_run_ledger_state` also keys on the docs checklist's entry-box form, owned by `plugin/instructions/docs_orchestration_instructions_autonomous.md` → `## Checklist entry format (parse contract)`, and on the user-review file name `<branch>_review[_<n>].md`. A change to either there is an edit here.
- [x] In `hr_remote_status_write`, add `unfinished` to the accepted `pause_reason` set (`usage|budget|user|overload|unfinished`). Add it to the `status.json` comment's `pause_reason` line too: *`unfinished` — a session that exited 0 before its ledger finished*. `killed` and `expired` stay registry-only.
- [x] In `cli/test/ledger-phases.test.mjs`, add a `hr_run_ledger_state` group using the file's own `ledger(...)` builder, `TASK_IDS`, `REVIEW_IDS` and `allExcept`. Write each case's state tree under the fixture's temp directory.
  - A task ledger all `[x]` / `[-]` → `finished`, exit 0.
  - The same ledger with `D` left `[ ]` → `unfinished`, exit 1, the detail carrying the phases line.
  - No file → `absent`, exit 2. A file whose first line is not a ledger header → `unreadable`, exit 3.
  - A finished **task** ledger read for engine `user_review` → `unfinished`.
  - A finished round-1 user-review ledger with `user_reviews/<branch>_review_2.md` present → `unfinished` (stale round). The same ledger with only `<branch>_review.md` present → `finished`.
  - A docs checklist (two entries plus the `INDEX`, in the parse contract's shape, continuation lines indented) all `[x]` → `finished`. One `[ ]` → `unfinished`. One `[ ]` entry indented by two spaces → `unfinished`. No checklist → `absent`. A checklist with no entry line → `unreadable`.
  - Extend the file header's rule paragraph with the reader's rule: *a run is finished only when its own ledger says so, and an absent ledger is reported as absent, never as finished or unfinished*.
  - The header also records, per new case, the mutation that turns it red. For example:
    - the engine test dropped → the task-ledger-for-`user_review` case;
    - the round test dropped → the stale-round case;
    - the entry test anchored at column 0 → the indented-entry case;
    - an absent file returned as `finished` → the no-file case.
    State that each was run red once against a scratch copy of the written library, never by editing the tracked template.

**Verification:**

- `npm test --workspace cli -- test/ledger-phases.test.mjs` passes, the existing `hr_ledger_phases` cases included, unchanged.
- `bash -n cli/templates/scripts/lib/harness-run-lib.sh` exits 0.
- `git grep -n 'usage|budget|user|overload' -- cli/templates/scripts/lib/harness-run-lib.sh` shows the `case` line now ending in `|unfinished`, and no other vocabulary line was added elsewhere.
  - **Deviations from plan:** The `bash -n cli/templates/scripts/lib/harness-run-lib.sh` bullet was not executed: the call was refused by the tool layer (`Permission to use Bash has been denied because Claude Code is running in don't ask mode`). The claim rests instead on `bash scripts/typecheck.sh`, whose `check-shell-parse` leg reported `97 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed`, and on `ledger-phases.test.mjs` sourcing the written library and passing (27 tests, 0 fail). The test group also carries two cases the plan did not list (an empty engine reads as `task`; an unknown engine is `unreadable`), and the header's mutation list adds the all-phases, open-box, no-entry and non-ledger mutations; all eight mutations were run red against scratch copies via `bash scripts/scratch-run.sh harness-runs/scratch/mutate_run_ledger_state.mjs`, the tracked template untouched.
