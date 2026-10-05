# Task plan review — iteration 1

## Must Fix

1. **`task_10_plan.md` — a verification bullet that cannot pass unless the task edits a row outside its targets.**
   The second `**Verification:**` bullet says: *"Run `git grep -n "no upgrade ever" -- docs`. It finds nothing."* Today the phrase appears twice in `docs/cli.md`'s re-run-contract table:
   - in the `.github/workflows/harness-control.yml` row, which is Task 10's target (scope register row 1);
   - in the `.github/workflows/harness-trigger.yml` row directly above it (*"… no upgrade ever `.bak`s it."*).

   Task 10 does not target the trigger row, the scope register gives it no row, and its statement stays true after this branch: the repair touches only `harness-control.yml`, and the trigger workflow is still never `.bak`ed by an upgrade. As written, the bullet leaves the implementer two choices. It can report a verification failure, or it can rewrite a true sentence in a durable document that no task owns and no register row covers. The second is an unscheduled corpus edit.
   **Fix:** In `task_10_plan.md`, scope the check to the control row, for example: *"`git grep -n "harness-control.yml.*no upgrade ever" -- docs/cli.md` finds nothing, and the `harness-trigger.yml` row's 'no upgrade ever `.bak`s it' is left unchanged, because it stays true."* Alternatively, state that exactly one hit remains and that it is the trigger row.

## Should Fix

1. **`task_3_plan.md` — when a repair and a replacing `--upgrade-workflows` happen in the same run, the output contradicts itself. Re-raised from iteration 0: it was neither resolved nor recorded under `## Rejected findings`.**
   `reportWorkflowUpgrade` (`cli/src/commands/init.ts`) prints `git diff --no-index <path>.bak <path>` for every entry of `replacedWorkflows`. That list is every workflow whose effect is `backed-up-and-replaced`, so it includes the repaired `harness-control.yml`. The same function then prints *"The .bak files are ignored by the managed .gitignore block, so git add -A leaves them out"*. Task 2 deliberately leaves the control file's `.bak` out of that block, so the sentence is false for that file. Task 3's Work bullet says that in this case the repair block "prints only its explanation and the diff line", so the diff line appears twice. Case 2 asserts only the `git add` behaviour.
   Two things need stating in Task 3:
   - how the combined case reads: either the repair block prints no second diff line, or the control path is filtered out of `replacedWorkflows`;
   - that the repair block's "this `.bak` is not ignored" sentence is the one that holds for the control file.

   Then assert both in case 2.

2. **`task_8_plan.md` and the story index — the claim that no sentence of the Round 7 paragraph becomes untrue. Re-raised from iteration 0: it was neither resolved nor recorded.**
   The story index's `**Item 4**` bullet and Task 8's first judgement still argue only from *"All three are carried to …"*. Two sentences of the paragraph describe the tree in the present tense, and this branch falsifies both:
   - Finding 1 ends *"No gate parses the rendered workflows."*, and Task 7 adds that gate.
   - Finding 3 says `forge_report` *"checks whether the branch was stopped for `failed` alone"*, and Task 5 changes that.

   The prompt asks the plan to adjust such wording, "and say so in the plan". There are two ways to settle it:
   - follow the round 5 and round 6 precedent with one appended sentence naming the branch that addressed the findings;
   - argue in the index why a finding's present-tense description is exempt.

3. **`task_3_plan.md` — a grep verification that fails against the current tree.**
   The last `**Verification:**` bullet says to grep `cli/src/commands/init.ts` for `if: >-` and `init --force`, and to "find them only through `unparseableControlRoute`". `init --force` already appears three times in `init.ts` for reasons unrelated to this branch: the permission-entries line near `'… init --force is what clears them'`, and the two `claudeMdBackupExisted` comments. Rescope the bullet to `if: >-` alone, or to new literals this task adds.

4. **`task_5_plan.md` — the grep for other suites that pin `gh` call lists misses most of the paths that reach `forge_report`.**
   `git grep -nE "report (resumed|paused|parked|park_loop|round)|'report'|forge_report" -- cli/test` reaches only the three `flow-walker*` suites and `remote-report.test.mjs`. The guard's extra `run list` is also reached through three other routes:
   - `notify()` (`poll`, `continue`), driven by `remote-run.test.mjs`;
   - `review`'s `forge_report round`, driven by `remote-control-review.test.mjs` and `remote-collect.test.mjs`;
   - the job-mode watcher's `report` calls, driven by `watcher-remote-job.test.mjs` and `watcher-remote-park-sequence.test.mjs`.

   The story index's second `Top risks:` entry says that Task 5 finds these suites "rather than leaving them to the gate". Widen the probe so it covers them, for example by naming the suites that drive `notify`, `review`, `collect` or the watcher in job mode, or by grepping `cli/test` for `STUB_RUN_LIST` together with label or comment assertions.

## Nice to Have

1. **`task_4_plan.md`** — re-raised from iteration 0. `### Targets` places `WORKFLOWS_ENDPOINT` "beside `PR_SETTING_ENDPOINT`", and `**Work:**` places it "beside `ARTIFACT_RETENTION_ENDPOINT`". Pick one.
2. **`task_2_plan.md`** — the module header of `cli/src/generators/githubWorkflows.ts` is headed "## Five non-obvious choices". Adding a choice 6 should change that heading to "Six" in the same edit.
3. **`task_5_plan.md`** — the reproduce-by-hand block in the `remote-run.sh` header (`report needs trigger's setup, … and a stub answering \`pr list\` and \`api repos/o/r/issues/7/labels\` with []`) does not mention `run list`. After this task, every guarded `report` lists runs first. Add `run list` → `[]` to that stub description so that the by-hand example prints no "whether feat_x was stopped is unknown" line.
4. **`task_5_plan.md`** — re-raised from iteration 0. When `run_by_sha_var` gave up before the dispatched run was listed, a legitimate `round` can be withheld. A sentence on that edge, or a test case for it, would settle it.
