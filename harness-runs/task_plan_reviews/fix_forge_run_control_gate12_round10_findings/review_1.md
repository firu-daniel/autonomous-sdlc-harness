# Task plan review — iteration 1

Iteration 0's Must Fix is resolved: rows 47 (the act step) and 48 (the `collect` job) are now in the register. I re-ran D1, D2, D3, D7 and D8 verbatim and re-walked D4, D5 and D6. Every site any entry reaches appears as a row.

## Must Fix

1. **`task_4_plan.md` — (xv) leg (d)'s new pass condition contradicts Task 1's contract.**
   Leg (d) is the second account's exact-form comment `@sdlc-harness status` (`docs/development.md` → Gate 12 → (xv) → **(d) A comment command.**). Task 4's (xv) bullet makes its pass condition require *"the job's `needs-agent:` line reads `no` naming `HARNESS_RUN_ACTORS`"*.
   Task 1's contract decides the exact form before any gate: *"the comment is the exact form (a `CONTROL_VERB` is set). This is decided **before** any gate, so it makes no `gh` call"*. Its `no` line for that case is `` the comment is the exact form `@sdlc-harness <verb>` ``. Task 4 restates the same contract in its own **Depends on:** block (*"`<reason>` is the sentence `control`'s refusal names, or `` the comment is the exact form `@sdlc-harness <verb>` ``"*).
   So leg (d)'s check line will name the exact form and never `HARNESS_RUN_ACTORS`. A Gate 12 round that follows the rewritten text would record a correct job as failing. `HARNESS_RUN_ACTORS` reaches only the act step's reply, which the existing condition (*"Passes when the reply names `HARNESS_RUN_ACTORS`"*) already checks. The `naming HARNESS_RUN_ACTORS` condition is right only for (d′), the mention.
   **Fix:** In `task_4_plan.md` → **Work:** → the **(xv) legs (d) and (d′)** bullet, change (d)'s added condition to: its `needs-agent:` line reads `no`, naming the exact form `` `@sdlc-harness status` ``, and the three comment-only steps are `skipped`. Keep the reply's `HARNESS_RUN_ACTORS` condition as it is. Leave (d′)'s added condition naming `HARNESS_RUN_ACTORS`. In the second sentence of the **(d′)** sub-bullet, replace "the same two conditions" with (d′)'s own pair, so the two legs no longer share one wording.

## Should Fix

1. **`task_4_plan.md` — "steps 1 and 10 together settle" the new §8 row still overclaims** (iteration 0, Should Fix 2, not addressed and not recorded as rejected). Task 3's row has two halves: the output read by a later `if:`, and *"a `continue-on-error` step that failed leaves it empty"*. Steps 1 and 10 exercise only the first half. **Fix:** in Task 4's **What it settles** bullet, say that steps 1 and 10 settle the output-read half and that the failed-step half stays unobserved. Alternatively, split the row in Task 3 so that Task 4 can name the half it settles.

2. **`task_4_plan.md` — step 11 cannot attribute a refusal to `--restricted`** (iteration 0, Should Fix 3, not addressed). The drive also carries `--permission-prompts none`, whose help line is *"anything that would prompt is denied automatically"*. A `Read` outside the working directories would prompt anyway, so a refused outside read does not show that `--restricted` did the confining. **Fix:** do one of the following:
   - say in step 11 how the recorded refusal text tells the two mechanisms apart;
   - add a control drive without `--restricted`;
   - or settle the row as "the session's flag set, as `control_mention_session` passes it, refuses …".

3. **`task_1_plan.md` — the `control` paragraph's opening clause goes stale** (iteration 0, Should Fix 1, not addressed). `` `control` IS THE COMMENT AND REVIEW ADAPTER `` opens *"the twin of `trigger` and the one step of the `WORKFLOW_CONTROL_FILE` job"*. After Task 2, two steps of that job run `remote-run.sh control`. **Fix:** in Task 1's **Header and `REPRO`** bullet, and in register row 3's reason, reword that clause as well.

4. **`task_4_plan.md` — (j)'s opening paragraph no longer describes step 11.** The leg opens *"post each mention below in order, on `<pr 2>` … waiting for each one's `harness-control.yml` run to finish … After each, read the runs and that run's log"*. Rewritten step 11 posts no comment and needs no runner. **Fix:** add a work item that amends the opening paragraph so it says steps 1 to 10 are mentions and step 11 is a direct drive on the operator's machine. Add a matching register row.

5. **Story index — register row 39 names the wrong section.** The sweep invariant paragraph that carries *"`remote-run.sh control` launches one read-only, one-shot mention session"* is in `ARCHITECTURE.md` → `## 5. Where the engine is reached — the launch path`, and the `control_mention_session` row sits in §5's table. It is not in `## 7.` **Fix:** repoint row 39's `Site` cell at `## 5.`.

## Nice to Have

1. **`task_3_plan.md` — the §1 paragraph's third bullet** says a failed permission call in the check step "installs anyway, and the act step's reply names the failure". The act step makes the permission call again, so its reply names a failure only if that second call fails too. Suggested wording: "installs anyway, and the act step checks the commenter again".
