## `git check-ref-format --branch` and `bash -n` refused to sub-agents, so the branch-name edge cases were argued from docs rather than run
- **category:** tooling-gap
- **evidence:** three sub-agent returns this run. `task-plan-writer` (planning, dispatch #1): "I couldn't run `git check-ref-format --branch` here because the sandbox denied it", so its `@{-1}` expansion claim "rests on git's documentation". `skeptic-reviewer` (Phase C2, dispatch #28): "two Bash calls were denied in don't-ask mode … The other would have tried `git check-ref-format --branch` on edge names (`@`, `HEAD`, `x@{u}`) … that case is unverified". `layer-implementer` (Phase C, Finding 1, dispatch #17): "A separate `bash -n` on the script alone was refused by the permission mode".
- **cost this run:** the skeptic left how the installed git treats a literal `HEAD` branch name unverified, and did not raise it as a finding; the planner's claim was checked only later, by Task 1's unit test.
- **hypothesis:** read-only `git check-ref-format` and `bash -n` are not in the unattended profile's allow list.

## `branch-reviewer` reported its mechanical first-pass grep had no patterns to search for
- **category:** agent-contract
- **evidence:** `branch-reviewer` return, Phase B.1 (dispatch #10): "My definition's search patterns for the mechanical first pass were never filled in, so that grep step checked nothing. That's a gap in this agent's configuration."
- **cost this run:** the grep half of the Phase B mechanical first pass checked nothing. The wiring half ran.

## Implementers selected tree guards differently for the same changed path
- **category:** agent-contract
- **evidence:** Phase C. The `layer-implementer` returns for Findings 4 (#19), 2 (#23) and 3 (cli layer, #25) each edited only `cli/templates/scripts/autonomous-watcher.sh`, and each selected and ran `test/shipped-scripts-mktemp.test.mjs` and `test/watcher-main-anchor.test.mjs`. The return for Finding 1 (#17) edited the same file and reported "Tree guards: none selected". The return for Finding 3 (general layer, #26) edited `docs/watcher.md` and reported "No tree guard was selected", even though `harness.config.json`'s `treeGuards` maps `**/*.md` to `test/no-container-home-paths.test.mjs`.
- **cost this run:** two units committed without running tree guards their paths select. The Phase G whole-suite run then passed on round 1.

## The configured `defaultBranch` has no local ref in the run copy, so `dev..HEAD` commands fail
- **category:** tooling-gap
- **evidence:** `harness.config.json` `defaultBranch` is `dev`. At Phase D, `git log --format='%h %s%n%b' --name-only dev..HEAD` exited 128 ("ambiguous argument 'dev..HEAD': unknown revision"). The `statistics-plan-writer` return (#29) reported that the same `git log dev..HEAD` failed and it fell back to `origin/dev..HEAD`. The `branch-reviewer` (#10), `review-plan-reviewer` (#15) and `skeptic-reviewer` (#28) returns each said they diffed against `origin/dev` because no local `dev` exists.
- **cost this run:** each consumer chose its own fallback base. They all happened to choose `origin/dev`.

## Zero-yield reviewers: the architecture and skeptic reviewers returned PASS with no findings on every dispatch
- **category:** optimization
- **evidence:** `architecture-reviewer` plan mode (#2) and implemented-branch mode (#9, Phase A2) both returned `verdict: PASS` and wrote no findings file: `harness-runs/architecture_reviews/fix_inbox_drop_branch_refusal/` and `harness-runs/architecture_branch_reviews/fix_inbox_drop_branch_refusal_arch_review.md` are absent. `skeptic-reviewer` (#28, Phase C2) returned `verdict: PASS`, and `harness-runs/skeptic_reviews/fix_inbox_drop_branch_refusal_skeptic_review.md` is absent. That is 3 dispatches, 0 findings, over a 4-task branch.
- **cost this run:** 3 reviewer dispatches with no change.
