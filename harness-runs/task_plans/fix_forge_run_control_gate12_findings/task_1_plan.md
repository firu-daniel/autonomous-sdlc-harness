### Task 1 — Archive every answered pair a session launched with, so a park answered then paused never ends `parked`

**Goal:** Fix item 7's root cause in the watcher. A non-pause exit archives every top-level `question_<n>.md` / `answer_<n>.md` pair that was on disk when the session launched, as well as the `resumed_for_index` set. Classification then no longer depends on registry memory that a remote job boundary throws away.

**Why this is the fix, not carrying `resumed_for_index` in the bundle.** `classify_run_exit` (`cli/templates/scripts/autonomous-watcher.sh`) archives only the registry's `resumed_for_index`. A pause exit leaves that field set on purpose (the comment above the pause arm, *"a pause honored mid park-resume must NOT archive"*). A job's registry is discarded, and `status.json` does not carry the field, so job 3 of round 6 (`resume=pause`) found the answered pair at the top level and classified a completed run `parked`. Carrying the field would fix that one sequence. A stop instead cancels the job before it writes a fresh status, though, and the field would be lost again. The canonical consume-then-archive contract (`plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Clarification channel — file format (canonical, single source of truth)`) says a re-entering engine consumes **every** top-level answered pair. So the set a session read is exactly the set present when it launched, and that is re-derivable from disk in any job. `status.json` and its schema `1` are unchanged.

**Where this task stops.** It changes the watcher's classification and its registry record, the clarifications README template, and one job-mode case. It does **not**:
- touch `remote-run.sh`'s `report` — the "no question-less parked comment" guard is **Task 2**'s;
- add the multi-job sequence cases (answer → pause → resume → complete, with each pause kind, and the stop variant) — those are **Tasks 3 and 4**;
- edit the plugin's canonical contract text — **Task 14** does, in the plugin layer.

### Targets

- `cli/templates/scripts/autonomous-watcher.sh` — `spawn_engine`, `classify_run_exit`, a new helper, and the header's registry-field block.
- `cli/templates/state-dir/clarifications/README.md` — the adopter's statement of which pairs move to `answered/`.
- `cli/test/watcher-remote-job.test.mjs` — one new case (this task owns the edit; **Task 5** edits the file after it).

**Work:**

- [ ] Add `top_level_answered_pairs <clar_dir>` beside `park_answered_set`. It prints every top-level index that has **both** files, numerically sorted and space-separated, and prints nothing when there is none. Unlike `park_answered_set`, it does not fail when another question is still unanswered. It uses the same index peeling: numeric-only names, base 10 forced.
- [ ] In `spawn_engine`, before the session launches, write `registry_set "$branch" launch_answered_set "<that set>"` from the run's `clarifications/<branch>/` directory, in local mode and job mode alike. Re-deriving it at every launch is what makes it survive any job boundary.
- [ ] In `classify_run_exit`, the non-pause path archives the **union** of `resumed_for_index` and `launch_answered_set`, deduplicated, through `archive_answered_pair`, then clears both fields. The pause arm still returns before any archival and leaves both as they are. A pair written during the session is in neither set and stays at the top level for the next resume, as now. Rewrite the function's comment and the header's `resumed_for_index` registry-field paragraph to say this. Add a `launch_answered_set` paragraph (what it holds, who writes it, that `classify_run_exit` clears it, and why the bundle need not carry it).
- [ ] `cli/templates/state-dir/clarifications/README.md`: change "exactly the pairs that resume consumed move into `<branch>/answered/`" to say that every pair answered when the session launched moves there after the session exits, a pause excepted. Keep the rest of the paragraph.
- [ ] `cli/test/watcher-remote-job.test.mjs`: add the case *"a pause resume launched with an answered pair at the top level ends completed and archives the pair"*. Seed `clarifications/<branch>/question_1.md` and `answer_1.md` and no registry record, run `job <branch> task pause` with a stub exiting 0, and assert the written `remote_status.json` says `completed`, both files sit under `answered/`, and the top level holds no `question_*.md`.

**Verification:**

- `npm test -- test/watcher-remote-job.test.mjs` from `cli/` passes, the new case included. That is this task's own edited test file. The local park-resume suites (`watcher-park-resume.test.mjs`, `watcher-park-loop.test.mjs`) are not run here: the Run gates phase runs them.
- Read `classify_run_exit` top to bottom: the pause arm still precedes every archival, and the park-loop guard still reads `resume_kind` and `resume_max_question_index` exactly as before.
- `grep -n "launch_answered_set" cli/templates/scripts/autonomous-watcher.sh` shows the write in `spawn_engine`, the union and clear in `classify_run_exit`, and the header paragraph, and nothing else.
- The header's `resumed_for_index` paragraph no longer claims it is the only record of the consumed set.

**Deviations from plan:**
- "Base 10 forced" in `top_level_answered_pairs` is applied to the ordering only (`sort -n`), as `park_answered_set` does; each index is printed as its file name spells it. Normalising `01` to `1` would make `archive_answered_pair` look for `question_1.md` and leave a zero-padded pair unarchived.
- The header's `resumed_for_index` paragraph now names `begin_park_resume` as its writer: that function holds the `registry_set` and is shared by `resume_parked_run` and job mode's `answer` start.
- `bash -n` on the watcher template was refused by the permission layer after a final comment-only edit to the helper's doc comment; the passing `npm test -- test/watcher-remote-job.test.mjs` run preceded that edit and exercised the code, which the edit did not change.
