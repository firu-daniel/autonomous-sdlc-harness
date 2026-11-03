## The plan's corpus staleness: `.claude/context/conventions.md` → `## Shell assets` undercounts the main-checkout wrappers
- **category:** tooling-gap
- **evidence:** the `task-plan-writer`'s first return of this session carried a `## Corpus staleness` section with one `stale-rule` entry: `.claude/context/conventions.md` → `## Shell assets`, the rule *"A call to a main-checkout wrapper — `commit-on-branch.sh`, `push-branch.sh`, `refresh-branch.sh` under `<MAIN_REPO>` — carries no `$` at all"*. This branch adds a fourth main-checkout call under the same rule, `launch-sandboxed-gates.sh` (Task 6 binds `<gate_launcher>` to its literal path in the two autonomous forks).
- **cost this run:** the rule now names three of the four main-checkout wrappers. It owes a follow-up restatement through a supervised `/autonomous-sdlc-harness:harness-analyze .claude/context/conventions.md` re-run, or a hand edit.

## `claude plugin validate --strict plugin` was refused in both plugin-layer units
- **category:** tooling-gap
- **evidence:** the `layer-implementer` returns for Task 5 (`plugin/instructions/mode_contract.md`, `plan_orchestration_instructions_core.md`, `user_review_fixes_instructions_core.md`) and Task 6 (the four fork files and `plugin/docs/AUTONOMOUS_FLOW.md`) each report that `claude plugin validate --strict plugin`, a verification step in their task files, was refused by the permission layer ("don't ask mode"). Both recorded it as an evidence downgrade in `harness-runs/task_plans/fix_linux_detached_gate_run/task_5_plan.md` and `task_6_plan.md`.
- **cost this run:** the plugin changes ship without strict manifest/frontmatter validation. Neither `bash scripts/typecheck.sh` nor `bash scripts/test.sh` runs it, so no later phase did either.
- **hypothesis:** the unattended profile has no allow entry for that command.

## `cp`, `chmod` and `rm` were refused, so byte-identical template copies were rebuilt by hand edits
- **category:** tooling-gap
- **evidence:** implementer returns report the refusals. Task 7: `cp` and `chmod 755` refused, so `scripts/launch-sandboxed-gates.sh` was written with the file tool and is tracked without mode 0755. Architecture Findings 1 and 2, code-review Findings 1 and 2, skeptic Finding 1 and test-fix Finding 2 each had to keep `cli/templates/scripts/…` and its `scripts/…` copy byte-identical, and each used Edit or Write instead of `cp`, confirmed with `cmp`. Tasks 2, 4, 10, 14, 15 and 18 report `rm` refused, leaving scratch files under `harness-runs/scratch/` (gitignored) and one scratch repository outside the checkout.
- **cost this run:** each template-copy unit ran a second hand-edit pass to replicate the same change. `scripts/launch-sandboxed-gates.sh` is not executable until the post-merge `init --force` runs. Scratch leftovers remain on disk.

## The plan unit took 8 review rounds across its two plan-review roots
- **category:** optimization
- **evidence:** `harness-runs/architecture_reviews/fix_linux_detached_gate_run/` holds `review_0.md`–`review_4.md` (5 rounds); `harness-runs/task_plan_reviews/fix_linux_detached_gate_run/` holds `review_0.md`–`review_2.md` (3 rounds); `business_parity_reviews` has none (`phases.parity` is false). Total: 8 rounds. The plan also parked once at the 5-revision cap (`question_1.md`) before the resume that produced the converged plan. The findings carry no per-finding headings (only `## Must Fix` / `## Should Fix` / `## Nice to Have`), so the net-new vs re-raised split per round cannot be measured from headings and is not reported.
- **cost this run:** one park plus 8 reviewer rounds before implementation started.

# User-review fix round 1 — launcher job-mode and per-run-profile trust inputs, two unapplied plan-review items, one conventions rule

## Finding 3 closed without a fix: the write to `.claude/context/conventions.md` was refused
- **category:** tooling-gap
- **evidence:** commit `1cf9c423` records `Record disposition of Finding 3 — tool-layer guard refused the write to .claude/context/conventions.md, which no profile entry can grant` (the cause recorded on the commit). The diagnosis is in `harness-runs/user_reviews/fix_linux_detached_gate_run_fix_plan/finding_3.md` → `## Disposition`.
- **cost this run:** the unit was closed without a fix. `## Shell assets` still names three of the four main-checkout wrappers, and the edit has to be applied by hand.

## Run gates needed 4 rounds, and rounds 1 and 2 did not fix the cause that round 3 found
- **category:** flow-efficiency
- **evidence:** `harness-runs/test_run_logs/fix_linux_detached_gate_run/review_1_round_1.log` … `review_1_round_3.log` each ended in `fail`, and round 4 printed `pass`. In round 1 the single finding was closed as already passing (`ac03c117`). In round 2, the `(q)` fix scaled the stale window (`ced9413b`) and the `(m)` finding was closed as already passing (`1d1954c9`). In round 3, `harness-runs/test_fix_plans/fix_linux_detached_gate_run_review_1_round_3/finding_1.md` traced `(l)` to the `bwrap` stub's 0-byte `scripts/.git` placeholder and stated that the same cause may explain the rounds 1–2 failures (`8833dfec`). The four failing cases across rounds were `(g)(h)`, `(q)`, `(m)` and `(l)`.
- **cost this run:** three full gate runs before the passing one, each about 40 minutes by the round-2 planner's account. The round-2 timing fix may not be needed.
- **hypothesis:** until `ced9413b`, the gate log kept only the `not ok` lines, so the first two planners could not see which assertion failed.

## A `layer-reviewer` returned `verdict: PASS` while reporting a Should Fix
- **category:** agent-contract
- **evidence:** the cli-layer review of fix-plan Finding 1 (`harness-runs/user_review_fix_plan_point_reviews/fix_linux_detached_gate_run_fix_plan/item_1/review_0.md`) returned `verdict: PASS` and reported one Should Fix: the caller list in `hr_json_single_object`'s header in `cli/templates/scripts/lib/harness-run-lib.sh` does not name `hr_registry_foreign_copy_var`. `user_review_fixes_instructions_core.md` → `### D.2 Done summary` assumes that a Should Fix produces a FAIL.
- **cost this run:** the loop committed the unit (`8e3175bf`) with that Should Fix unapplied.

## `cp` and `printenv HOME` were refused for sub-agents again this round
- **category:** tooling-gap
- **evidence:** the general-layer `layer-implementer` returns for fix-plan Findings 1 and 2 report that `cp` from `cli/templates/scripts/…` to `scripts/…` was refused, so both root copies were rebuilt with the Edit tool and checked with `cmp`. Two `test-fix-plan-writer` returns (rounds 2 and 3) report that `printenv HOME` was denied during their machine-path check.
- **cost this run:** a second hand-edit pass for each template copy, and the planners' home-directory check was done from a path taken out of the session instead of the command.

# User-review fix round 2 — probe launcher legs record the per-run profile, launcher committed executable

## The resume answer left a tracked change that the tree-state precondition halts on
- **category:** agent-contract
- **evidence:** at the start of this resumed session, `git status --short` printed ` M scripts/launch-sandboxed-gates.sh` (`git diff` showed only `old mode 100644` / `new mode 100755`). Option (a) of `harness-runs/clarifications/fix_linux_detached_gate_run/question_2.md`, the one `answer_2.md` chose, tells the operator to make exactly that change and leave it for the committer. `/autonomous-sdlc-harness:branch-start-user-review-fix-autonomous` step 5 halts on any `git status --short` line not beginning with `??`, and it makes no exception for a change a consumed answer prescribed.
- **cost this run:** the orchestrator went ahead anyway, judging the change sanctioned by the answer. A literal reading of step 5 would have parked again on the change the answer asked for.

## A `layer-reviewer` returned `verdict: PASS` while reporting a Should Fix (again this round)
- **category:** agent-contract
- **evidence:** the general-layer review of fix-plan Finding 2 (`harness-runs/user_review_fix_plan_point_reviews/fix_linux_detached_gate_run_fix_plan/item_2/review_2.md`) returned `verdict: PASS`. Its return reported one Should Fix: the deviation note in `finding_2.md` names `question_2.md` / `answer_2.md` by filename only, not by repo-relative path.
- **cost this run:** the loop committed the unit (`bf47252d`) with that Should Fix unapplied.

## `rm` was refused for an implementer's scratch probe again this round
- **category:** tooling-gap
- **evidence:** the cli-layer `layer-implementer` return for fix-plan Finding 1 reports that it left `harness-runs/scratch/render_record_probe.py` (gitignored) behind because deleting it was refused.
- **cost this run:** a scratch file was left on disk in the run copy.
