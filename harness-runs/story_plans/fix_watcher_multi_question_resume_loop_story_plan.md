# Story: One exchange per park, answered once — and a guard that stops any park/resume loop

## Context

This branch fixes the watcher defect observed on `feat_docs_catalog_retrieval` on 2026-09-17: a run that parked with three questions, was resumed once, and parked again on a new question was then resumed a second and a third time for answers it had already consumed. It also adds a loop guard that stops re-resuming any run whose resumes make no progress, whatever the cause. The work lands in three layers, bottom-up: the watcher and its sibling outer-loop scripts plus their tests and the adopter-facing state-dir READMEs (`cli`), every plugin contract that describes the clarification channel (`plugin`), then the developer documentation and this repository's own byte-identical copies of the changed templates (`general`).

**The mechanism, confirmed from the code rather than taken from the prompt.** `cli/templates/scripts/autonomous-watcher.sh` → `resume_parked_run` picks the single lowest-indexed top-level `question_<n>.md` that has an `answer_<n>.md` (its comment block "THE LOWEST INDEX WINS"), records that one index as `resumed_for_index`, and hands `spawn_engine` a resume clause naming that one answer file. `classify_run_exit` archives only that pair (`archive_answered_pair "$clar_dir" "$consumed_n"`). The engine side reads more than the named file: `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability` case (a) keys on "a sibling answer file … at the **top level**", and the launch prompt also says "If a clarification answer is present under `<state_dir>/clarifications/<branch>/`, resume from the park point" — so the first resume read all three answers while only pair 1 was archived. Pairs 2 and 3 stayed at the top level; when the run parked again on `question_4.md`, `resume_parked_run` found them answered and resumed twice more. The measured timeline is in this repository's main-checkout `harness-runs/autonomous_logs/watcher.log`: real resumed sessions ran 50m04s (13:30:34 → 14:20:38) and 38m28s (15:14:45 → 15:53:13) on `feat_docs_catalog_retrieval`, and 3h01m56s on `chore_plugin_prefix_command_sweep` (10:31:53 → 13:33:49); the two spurious sessions ran 41s (14:20:44 → 14:21:25) and 39s (14:21:30 → 14:22:09).

**The design chosen: one question file per park, answered by one answer file.** Every site that writes a question writes it at the moment it parks and then ends the session — `task_plan_writing_instructions_autonomous.md` → ``### `<escalate>` / `<ask>` — the headless clarification reroute``, `plan_orchestration_instructions_autonomous.md` → ``### `<escalate>` — the clarification reroute``, `user_review_fixes_instructions_autonomous.md` → ``### `<escalate>` / `<ask>` — the park-and-yield clarification reroute`` and `user_review_fix_plan_writing_instructions_autonomous.md`'s headless bullet all say "write … then **truly stop and yield — end the session**". No agent writes a question while its run keeps going, so a park's questions are always known together and can be answered as a unit; the one-file-per-question layout is not needed. The filenames and their index pairing stay exactly as they are — `question_<n>.md` ↔ `answer_<n>.md`, `<n>` unique across the branch directory and its `answered/` archive — and what changes is what an index names: one park, holding every question that park raises as `## Q<k>` sections. Keeping the names keeps the committed clarification digest's `## question_<n>` key valid (one block per park from now on, existing per-question blocks untouched and still uniquely keyed) and keeps `/autonomous-sdlc-harness:branch-answer` a single command.

**The watcher is made correct for both layouts, not only the new one.** A park written before this branch may still be several question files, some answered and some already archived, so the watcher resumes only when **every** top-level question file has its answer, records **every** top-level answered index it resumed for, and on exit archives exactly that set — an answer written while the resumed session was running is not in it and stays for the next resume. That is what makes an in-flight run survive the upgrade.

> Assumption: a run parked under the old layout that already carries used-but-unarchived pairs (the `feat_docs_catalog_retrieval` shape) is resumed once with those pairs included in its consumed set, so its resumed engine re-reads rulings it has already applied. The alternative — archiving pairs the watcher guesses were already read, from file timestamps — can silently discard an operator's answer that arrived mid-session, which is the worse failure. Re-reading an applied ruling is idempotent for a writer revision; the set is then archived and the stale pairs are gone.

**The loop guard.** A park-resumed session that parks again is a *no-progress cycle* when it raised no question file with an index above the highest index that existed at resume time, or when it parked again inside `PARK_LOOP_WINDOW_SECS` (default `300`, about 7× the spurious sessions and 1/7 of the shortest real one measured above). After `PARK_LOOP_MAX_CYCLES` (default `2`) consecutive no-progress cycles the watcher records the distinct status `park_loop` instead of `parked`, logs the evidence, sends one `park_loop` notification, and stops resuming the run. A progress cycle, a completion or a failure resets the count; a session launched by the pause-resume pass is never counted. The operator clears the status by creating `<state_dir>/clarifications/<branch>/PARK_LOOP_CLEAR` in the run's working copy (that directory's contents are already gitignored); the next pass removes the file, resets the count and sets the record back to `parked`, after which the ordinary resume rule applies. Notification kinds are declared in `cli/templates/scripts/autonomous-notify.sh` → `THE EVENT VOCABULARY IS A CONTRACT`, and the registry status vocabulary in the watcher's own header; both grow by one word, and every reader that enumerates statuses is swept in the scope register below.

**Top risks:** the resume/archive change is the one place this branch can lose an operator's answer or strand a parked run, so Task 1 archives only the recorded set and never guesses, and Task 4 replays the observed three-question sequence, an answer written during a resumed session and a question that appears after the park against the real written watcher. The second risk is a loop guard that catches a run parking twice for real reasons — Task 2 sizes both thresholds from the measured sessions above, and Task 5 asserts that a run raising a new question on every resume, and a legacy in-flight park, are never caught. The third is a channel consumer left describing one file per question; the scope register enumerates every consumer, Tasks 7–13 each own theirs, and Task 13's verification runs the retired-form grep over the whole set.

**Manual setup required:**

- After this branch merges, restart this repository's watcher so the live daemon runs the new `scripts/autonomous-watcher.sh` (`docs/watcher.md` §3: an edit to a script is inert until restarted). `restart-watcher.sh` is withheld from agents, so a person runs it; no task depends on this step, and it refuses by default while a run is in flight.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top-to-bottom; the committer flips each one to `[x]` as that task's commit lands. **Only the committing role flips a marker** — the `committer` agent in every flow that dispatches one, the orchestrator itself in the supervised flow, which dispatches none: an implementer never changes a marker here, and never edits any other line of this section, in an index a run is iterating. `[ ]` markers anywhere else (sub-step bullets inside the per-task files) are informational progress markers for the implementer — they are never the iteration source and the committer does not touch them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_watcher_multi_question_resume_loop/task_<K>_plan.md`. Ordered bottom-up in the configured layer order — `cli`, `plugin`, then the catch-all `general` last.

1. [x] **Task 1** — Watcher: resume a park only when fully answered, and archive exactly the consumed set _(layer: cli)_ _(points: 20)_
2. [x] **Task 2** — Watcher: the park-loop guard, its `park_loop` status and its operator clear _(layer: cli)_ _(points: 20)_
3. [x] **Task 3** — Declare the `park_loop` notification and status in the notifier and the registry readers _(layer: cli)_ _(points: 10)_
4. [x] **Task 4** — Tests: the observed multi-question sequence, mid-session answers and late questions _(layer: cli)_ _(points: 20)_
5. [x] **Task 5** — Tests: the loop guard trips, clears, and never catches a real double park _(layer: cli)_ _(points: 20)_
6. [x] **Task 6** — State-dir READMEs: one question file per park, and the consumed-set archive _(layer: cli)_ _(points: 10)_
7. [x] **Task 7** — Planning fork: redefine the clarification channel as one exchange per park _(layer: plugin)_ _(points: 15)_
8. [x] **Task 8** — The other three autonomous forks write and consume one exchange per park _(layer: plugin)_ _(points: 15)_
9. [ ] **Task 9** — Shared modules: digest a whole park per block, and the ledger's resume sentence _(layer: plugin)_ _(points: 10)_
10. [ ] **Task 10** — Commands: answer a whole park, and name the `park_loop` status and its clear action _(layer: plugin)_ _(points: 15)_
11. [ ] **Task 11** — Plugin flow documents: the park exchange and the loop guard _(layer: plugin)_ _(points: 10)_
12. [ ] **Task 12** — Developer docs: the watcher's park protocol, `park_loop` and its knobs _(layer: general)_ _(points: 15)_
13. [ ] **Task 13** — Mirror the changed templates into this repository's own copies _(layer: general)_ _(points: 5)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"**Every consumer of the channel moves together.** Re-derive the set with `grep -rln "question_<n>\|answer_<n>" plugin cli/src cli/templates cli/test docs README.md`."* This branch also adds a registry status and a notification kind, so the readers of those two vocabularies are consumers too, and the prompt's roots omit this repository's own copies of the templates (`scripts/`, `harness-runs/`), which the prompt states are byte-identical.

**Derivation entry C1 — channel consumers (command, the prompt's own).** Run from the repository root: `grep -rln "question_<n>\|answer_<n>" plugin cli/src cli/templates cli/test docs README.md`

**Derivation entry C2 — this checkout's copies of channel templates (command).** `grep -rln "question_<n>\|answer_<n>" scripts harness-runs/clarifications/README.md harness-runs/clarification_digests/README.md`

**Derivation entry C3 — sentences that enumerate or count the status or notification vocabulary (command).** `grep -rln "completed | parked\|running | parked\|completed|parked\|four terminal states\|six lifecycle words\|watcher's six\|one live state and four" plugin cli/src cli/templates cli/test docs README.md scripts` — `watcher's six` reaches a count whose noun is wrapped onto the next line (the `DOCTOR_USAGE` array in `cli/src/commands/doctor.ts`), and `cli/test` reaches the same count in a test's doc comment.

**Derivation entry C4 — readers that name the `parked` status (command).** ``grep -rln '`parked`\|"parked"' plugin cli/src cli/templates docs README.md scripts``

**Closure invariant:** every file any of C1–C4 reaches appears as a row below. `Copy` is `template` for a file under `cli/templates/` that this repository also carries as its own `init` output, `this checkout` for that output, and `—` for a file with no mirrored counterpart.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Clarification channel — file format (canonical, single source of truth)`, `## Override 2 — resumability`, the `<ask>` / `<existing_artifact_decision>` rows and the headless reroute bullet | — | C1, C4 | `change` | Task 7 |
| 2 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` → ``### `<escalate>` — the clarification reroute`` ("one or more self-contained … files") | — | C1, C4 | `change` | Task 8 |
| 3 | `plugin/instructions/user_review_fixes_instructions_autonomous.md` → ``### `<escalate>` / `<ask>` — the park-and-yield clarification reroute`` and its **On resume** paragraph | — | C1 | `change` | Task 8 |
| 4 | `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → the `<ask>` / `<existing_artifact_decision>` rows, the channel-reference paragraph, the headless bullet, `## Override 2 — resumability` (a) | — | C1, C4 | `change` | Task 8 |
| 5 | `plugin/instructions/mode_contract.md` → `### Sanctioned cross-fork anchors`, class (i-b) *Reason* ("the literal artefact path … it reads") | — | C1 | `no-change` | Its sentences say the watcher names no file or heading and keys on the `question_<n>.md` ↔ `answer_<n>.md` names and their index pairing; this branch keeps both names and the pairing, so every sentence stays true |
| 6 | `plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.7 Resume-from-ledger` step 5 ("a top-level `answer_<n>.md` is consumed as today") | — | C1 | `change` | Task 9 |
| 7 | `plugin/instructions/clarification_digest_instructions.md` → `## What is digested`, `## The entry format` | — | C1 | `change` | Task 9 |
| 8 | `plugin/docs/AUTONOMOUS_FLOW.md` → `## Answer a clarification (park-and-ask)`, `## Clarification digest` | — | C1 | `change` | Task 11 |
| 9 | `plugin/commands/branch-answer.md` | — | C1, C4 | `change` | Task 10 |
| 10 | `plugin/commands/branch-status.md` | — | C1 | `change` | Task 10 |
| 11 | `plugin/commands/branch-start-plan-autonomous.md` → entry point (b) | — | C1, C4 | `change` | Task 10 |
| 12 | `plugin/commands/branch-start-user-review-fix-autonomous.md` → entry point (b) | — | C1, C4 | `change` | Task 10 |
| 13 | `cli/templates/scripts/autonomous-watcher.sh` | template | C1, C3, C4 | `change` | Task 1 (resume set and archive), then Task 2 (loop guard), which `**Depends on:**` Task 1 |
| 14 | `cli/templates/state-dir/clarifications/README.md` | template | C1 | `change` | Task 6 |
| 15 | `cli/templates/state-dir/clarification_digests/README.md` | template | C1 | `change` | Task 6 |
| 16 | `docs/watcher.md` → §1 steps 3, 7–8, the status table, §4 | — | C1, C3, C4 | `change` | Task 12 |
| 17 | `scripts/autonomous-watcher.sh` | this checkout | C2, C3, C4 | `change` | Task 13 |
| 18 | `harness-runs/clarifications/README.md` | this checkout | C2 | `change` | Task 13 |
| 19 | `harness-runs/clarification_digests/README.md` | this checkout | C2 | `change` | Task 13 |
| 20 | `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → **The exit.** ("four terminal states") and `## The ways a run stops, and which of them come back` | — | C3 | `change` | Task 11 |
| 21 | `cli/src/commands/doctor.ts` → `TEST_NOTIFICATION_EVENT` doc comment ("six lifecycle words") and the `DOCTOR_USAGE` array ("none of the watcher's six" / "lifecycle words", the text `doctor --help` prints) | — | C3, C4 | `change` | Task 3 |
| 22 | `cli/templates/scripts/autonomous-notify.sh` → `THE EVENT VOCABULARY IS A CONTRACT`, usage line, event `case` | template | C3 | `change` | Task 3 |
| 23 | `scripts/autonomous-notify.sh` | this checkout | C3 | `change` | Task 13 |
| 24 | `docs/cli.md` → the `--test-notification` paragraph ("six lifecycle words") | — | C3 | `change` | Task 12 |
| 25 | `plugin/commands/branch-user-review.md` → step 2 candidate set | — | C4 | `no-change` | Its candidates are `completed` or `failed` records only, so a `park_loop` record is already excluded; the `running`/`parked` parenthetical explains a non-target, it does not enumerate them |
| 26 | `plugin/commands/branch-resume.md` | — | C4 | `no-change` | It acts on a `paused` record only and reports any other status and stops, which is the right answer for `park_loop`; the clear action is named by `branch-status` (Task 10) |
| 27 | `plugin/commands/branch-pause.md` | — | C4 | `no-change` | It acts on a `running` record only; its status list is introduced by `e.g.` and is not a closed enumeration |
| 28 | `cli/src/doctor/checks.ts` → `liveRunCount` doc comment | — | C4 | `no-change` | It counts `running` records only; the comment's `parked`, `paused` or `failed` list illustrates records a bare pid walk would miscount and stays true |
| 29 | `cli/templates/scripts/cleanup-merged-worktrees.sh` → the ACTIVE RUN rule and its `jq` select | template | C4 | `change` | Task 3 — a `park_loop` run owns a working copy the watcher comes back to once cleared, so the sweep must not remove it |
| 30 | `cli/templates/scripts/restart-watcher.sh` → WHAT COUNTS AS IN FLIGHT and its `jq` select | template | C4 | `change` | Task 3 |
| 31 | `scripts/cleanup-merged-worktrees.sh` | this checkout | C4 | `change` | Task 13 |
| 32 | `scripts/restart-watcher.sh` | this checkout | C4 | `change` | Task 13 |
| 33 | `docs/outer-loop-verification.md` → §2.1, §2.4 **Park resume.** | — | C4 | `no-change` | A dated record of what the watcher did when driven; editing a measured fact falsifies the record (`.claude/context/conventions.md` → `## Documents of record`) |
| 34 | `cli/test/doctor.test.mjs` → the doc comment above `TEST_EVENT` ("none of the watcher's six") | — | C3 | `change` | Task 3 |
