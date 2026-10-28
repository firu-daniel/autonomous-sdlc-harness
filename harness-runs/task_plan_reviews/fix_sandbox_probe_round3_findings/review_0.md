# Task plan review — iteration 0

## Must Fix

1. **A permission-refused CS3 call still prints CS3 `fail`** — `task_3_plan.md`.
   Task 3 replaces only the per-call `sp_judge_call … ran "$cmd"` / `case "$SP_VERDICT"` in `sp_leg_git`'s CS3 loop. After that loop, `sp_leg_git` still runs its state checks unconditionally, and each one appends to `fails`:
   - `sp_judge_ref "$SP_CLONE" "refs/heads/$SP_BRANCH" "$ref" moved` → `commit: …`;
   - the `after_stash` / `before_stash` comparison → `stash list …`;
   - `head` against `$x` → `switch: HEAD is '…', not $x`.

   The row then prints `fail` whenever `fails` is non-empty, ahead of `notrun`: the `if [ -n "$fails" ] … elif [ -n "$notrun" ]` at the end of the CS3 block. So when `git add` or `git commit` is refused at the permission layer, the ref does not move, and CS3 is still `fail`. The same happens when `git switch -c` or `git stash pop` is refused. That is the PD3 shape the plan's audit (`## Context` → the `git` bullet) says Task 3 fixes, and the task's own Goal says it closes. It also makes Task 12's planned CS3 Expected sentence (*"A call refused at the permission layer never ran and is `not run`"*) false for the code that ships. The per-call function `sp__git_cs3_call` alone cannot make the row `not run`.
   **Fix:** In `task_3_plan.md`, add a `**Work:**` step to `sp_leg_git`'s CS3 block. A state check whose call grades `not run` through `sp__git_cs3_call` is not appended to `fails`; it is recorded under `notrun` or skipped. Concretely:
   - the ref-moved and "commit carries `$a`" checks are skipped when `c_add` or `c_commit` is `not run`;
   - the stash checks are skipped when `c_push` or `c_pop` is `not run`;
   - the HEAD check is skipped when `c_switch` is `not run`.

   A `fail` from a call that did run keeps its `fail`. State the resulting row rule in the task (for example: *any measured call `not run` and no `fail` from a call that ran → CS3 `not run`*), and add a `**Verification:**` bullet that checks it.

2. **CW6's sandboxed-case expected evidence cannot be produced by Task 2's contract** — `task_7_plan.md`.
   Task 2 defines CW6's pass evidence as `… call answered by <layer>`, where `<layer>` is `$SP_LAYER: $SP_LAYER_EVIDENCE`. For layer `ran`, `judge.sh` → `sp__layer` sets `SP_LAYER_EVIDENCE` to `sp__first_line` of the result text. Task 7 describes the `cw6-sandboxed.jsonl` `tool_result` as `is_error: true`, carrying `Exit code 1` and the `commit-on-branch.sh: refusing to commit: …` line. That is the shape every existing error fixture uses, with `Exit code <n>` first: `n4-curl-error.jsonl`, `r4-local-sandbox.jsonl` and `n3-no-body.jsonl` all have `"content":"Exit code 7\ncurl: …"`. So the first line, and the layer evidence, is `Exit code 1`. Task 7's sandboxed case nonetheless expects `call answered by ran: commit-on-branch.sh: refusing to commit: cannot sync branch …`. The suite, implemented as written, fails against the function Task 2 specifies. This is a cross-task interface whose two sides disagree.
   **Fix:** In `task_7_plan.md`, choose one and state it in both the fixture bullet and the sandboxed case:
   - expect `call answered by ran: Exit code 1`, keeping the realistic content order `Exit code 1\ncommit-on-branch.sh: refusing to commit: …`; or
   - drop `Exit code 1` from the fixture so the refusal line is the first line, and say why the fixture departs from the recorded shape.

   Keep the case's full-string `assert.equal`.

## Should Fix

1. **The new `wrappers` description claims every result names its answering layer, and CS4's does not** — `task_1_plan.md`.
   The new `wrappers` string ends *"and every result names the layer that answered"*. Task 2 leaves `sp__wr_cs4`'s result lines as they are, and none of its pass lines names a layer: `commit $before..$commit; push …; refresh exit 0; clone = main = …`. Neither do its commit and push `fail` lines. As written, the restated expectation in `core.sh` and in Gate 15 would be untrue for CS4. Either narrow the clause (for example *"every refusal row's result names the layer that answered"*), or add a Task 2 step that appends the answering layer to CS4's lines. Do not ship the clause as it stands.

2. **N4's empty-control arm conflicts with the "differs" arm, and two arms are untested** — `task_5_plan.md`, `task_8_plan.md`.
   - In Task 5, *"Control exit differs from the session's code"* comes before *"Same code, or an empty control exit"*. An empty `SP__NET_N4_CTL_RC` (curl not on `PATH`) differs from `7` as a string. So an implementer who takes the arms in the order listed grades it `pass`.
   - Task 5 also does not say how *"Both control arguments absent"* differs from *"empty control exit"*. `sp_leg_network` always passes both arguments, so it must be `$#`, not emptiness.
   - Fix: state the arm order explicitly, putting the empty-exit test before the differs test, and state that absence means `$# -lt 3`.
   - In Task 8, add subtests for the empty-control arm and the unparseable-session-code arm.

3. **The Task 6 wording on early `not run` exits is unclear about (b)** — `task_6_plan.md`. The `could not derive the invalid profile` exit and the early exits are listed together, but `$bad` exists only after `sp_scratch_profile`. State which early exits can carry a taken (b): only the helper-not-written exit, which comes after `$bad` is written. The others carry `(b) not taken`.

## Nice to Have

1. **`task_2_plan.md` Verification grep.** `grep -n 'sp__wr_called'` also matches the `# sp__wr_called <stream> …` comment above the definition, and any header or comment text that names it. Say *"one definition, one call inside `sp__wr_reached`, comments aside"*, or grep for `sp__wr_called "` to count call sites only.
2. **Ship-order note.** The index already explains why the general-layer probe tasks come before the cli-layer suites. The order is correct by dependency. Nothing to change. This is recorded only so the next round does not re-litigate it.
