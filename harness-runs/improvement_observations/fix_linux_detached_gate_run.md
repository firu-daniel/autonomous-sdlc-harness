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
