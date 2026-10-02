# Task plan review — iteration 2

Both Must Fix findings from iteration 1 are resolved:
- E2 now reaches `ARCHITECTURE.md`. Rows 29 and 30 dispose of its `## 5.` and `## 7.` sentences, and Task 15 owns the `## 5.` edit.
- Task 5's pause-note rule is stated once, with the `answer` resume as a move-aside case and a fifth test case. Tasks 14 and 18 restate it word for word.

I re-ran E1, E2 and E3 verbatim. Every file they list is a row, so the closure invariant holds.

The structure, the 1:1 index-to-file correspondence, the single-layer tags, the bottom-up order (Task 20 before Task 5), the points and **Work:** ceilings, and the test-run rule all pass. The script, library and test symbols the plan cites resolve in the tree. One new Must Fix follows.

## Must Fix

1. **`task_5_plan.md`: a pause resume after a stop or a kill gets the stop/kill clause only when a carried note exists, which contradicts the task's own Goal and the story index.**
   The Goal says: *"A pause resume after a stop or a kill is told so ("no pause note; continue from the ledger") instead of 'This is a RESUME from a PAUSE: read …/PAUSE_PROGRESS.md'"*. The story index → item 12 says the same, with no condition: *"A pause resume after a stop or a kill gets its own clause"*.
   **Work:** bullet 1 makes the whole action conditional on the note existing: *"unless `resume` is `pause`, `prev_status` is `paused` and `prev_engine` equals `$engine`, **and `$state_abs/PAUSE_PROGRESS.md` exists**, move it aside …, set `pause_note_stale` to `1` when this job's `resume` is `pause`, and log one line naming … `$HR_REMOTE_ASIDE`"*. Bullet 2 picks the stop/kill clause only when `pause_note_stale` is `1`.
   So a pause resume whose previous job was cancelled (restored `status` `running`), or whose previous job ran a different engine, and that carries no `PAUSE_PROGRESS.md`, keeps today's *"This is a RESUME from a PAUSE: read PAUSE_PROGRESS.md"* clause. That clause points the session at a note that does not exist, which is exactly what item 12's candidate fix rules out: *"Have the resume prompt after a stop or kill say so … rather than point at the pause note."* This happens whenever a run is stopped before it ever paused.
   None of the five test cases covers it, because every `resume pause` case seeds a note. Task 19's leg (g) (*"the job's log carries the stop/kill launch clause and no `PAUSE_PROGRESS.md` clause"*) would then pass or fail depending on whether the scratch run had paused before.
   **Fix:** In `task_5_plan.md`, split the two decisions:
   - **Move aside.** A carried note is moved aside under the stated rule, and only when it exists.
   - **Stop/kill clause.** `pause_note_stale` is set for every `resume pause` job whose restored `status` is not `paused` or whose `engine` differs, **whether or not a note was carried**.

   Make the Goal, **Work:** bullets 1 and 2 and the log line agree with that split. Log the aside path only when a move happened. Add a sixth `watcher-remote-job.test.mjs` case: restored `status` `running`, **no** note, `resume pause`. The prompt carries the stop/kill clause and never names `PAUSE_PROGRESS.md`.
   If the clause wording changes, restate it the same way in `task_14_plan.md` (the §2.3 sentence *"a pause resume whose note was moved aside is re-launched with a clause …"*, which must not be limited to a moved note) and in `task_18_plan.md` (*"A pause resume whose note was moved aside is told there is no pause note"*).

## Should Fix

- **`task_19_plan.md`: a target is still missing (carried over from iterations 0 and 1).** The last **Work:** bullet edits the *"What still owes a first recording"* sentence that closes the Round 6 record in `docs/development.md` (the paragraph after *"The round also settled four design changes for the follow-up"*). `### Targets` and register row 6 still do not name it. That sentence sits inside the Round 6 record, which `task_15_plan.md`'s verification calls byte-identical apart from one added sentence, and which Task 19's own **Where this task stops** assigns to Task 15. Name the sentence in Task 19's `### Targets` and in row 6, and qualify Task 19's stop line.
- **`task_13_plan.md`: the `issues` prefilter can silently turn off the close-stop (carried over).** The clause `contains(join(github.event.issue.labels.*.name, ','), 'sdlc-harness: ')` skips the job when the issue has no state label. That happens when a `forge_set_state` failure only warned, or when someone removed the label. The run is then not stopped and nothing is logged. Either drop the clause, or state this cost in THE PREFILTER and in Task 17's §5/§6 text.
- **`task_8_plan.md`: two rendered sentences will say `status` steers a run (carried over).** `cli/src/doctor/checks.ts` (the `forge` pass text, *"a `` `${COMMAND_HANDLE} <verb>` `` comment (`${nameList([...COMMAND_VERBS])}`) steers it"*) and `cli/src/commands/init.ts` (*"followed by `${nameList([...COMMAND_VERBS])}` steers the run"*) render the verb list from `COMMAND_VERBS`. Either reword both or render the steering verbs without `status`, and add both files to `### Targets`. Register row 19's reason (*"quotes `doctor`'s own wording, which this branch does not change"*) is still inaccurate. `docs/cli.md` paraphrases the verbs that steer a run, and `status` steers nothing, so state that reason instead.
- **Register row 11: the reason still does not engage the user-review engine's phase split (carried over).** State why the union archive is safe when a pair raised by the fix-implementation phase is *"NOT consumed here"* by the fix-plan phase. The canonical text's own *"the watcher archives them after this session's next non-pause exit whether or not they reached the writer"* (`task_plan_writing_instructions_autonomous.md`, the saved-walk paragraph before *"Decide as follows"*) is a candidate basis. Task 14's new safety clause (*"a pair present at launch has been read"*) overstates it and should cite that sentence rather than claim every pair was read.
- **`task_5_plan.md`: item 12's local-mode exclusion still rests on the QA clause's comment (carried over).** Give the real reason a local new-round launch may still read an older engine's note (the local file is append-only and *"no fresh launch reads it"*), and record it in Task 18's `watcher.md` §4 bullet.
- **`task_1_plan.md`: `parked` still counts an answered top-level pair (carried over).** Item 7's candidate *"Count only a pair whose question was written during this session as a park"* is not addressed. Either take it, or state why the union archive makes it unnecessary.
- **`task_11_plan.md`: a failed state read on a close is unspecified (carried over).** State the outcome, for example an `::error::` line and exit 3, and add a Task 12 case for it.
- **`task_16_plan.md`: §1's refusal paragraph does not say a stopped run is named `stopped` (carried over).** Add one sentence with a pointer to §5.
- **`task_15_plan.md` → **Depends on:**: a dangling sentence.** After the Task 1 restatement, *"They are items 4, 13 and 6 only: the draft pull request opened at start …"* has no antecedent, because it was left over from the earlier row-19 wording. Move it to the row-19 **Work:** bullet, or reattach it to *"roadmap item 19"*.
- **`task_9_plan.md` → **Verification:**: `grep -n "Started from" cli/templates/scripts/remote-run.sh` already returns six hits today (header lines, the `start` printf, the `deliver` body line and the parser prefix), so it cannot by itself show "one provenance-line parser". Grep for the parser's prefix assignment (`prefix="Started from`) instead.

## Nice to Have

- `docs/github-run-control.md` → `## The GitHub entry point` (*"answers, pauses, resumes or stops the run with `@sdlc-harness` comments"*) could name the new read-only `status`. Neither Task 16 nor Task 17 targets that section.
- `task_11_plan.md`: a merged pull request with *Automatically delete head branches* on fires `pull_request: closed` and `delete` together, in separate concurrency groups, so the run can get two `stopped` comments (carried over).
- `task_19_plan.md`: Gate 12 *Teardown*'s `gh pr close … --delete-branch` now starts a close job and a delete job (carried over).
