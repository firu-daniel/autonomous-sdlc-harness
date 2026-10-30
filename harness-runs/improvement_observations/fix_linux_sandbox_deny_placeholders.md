## The task plan needed 7 review rounds before both plan gates passed
- **category:** optimization
- **evidence:** convergence churn on the plan unit. Rounds on disk: `harness-runs/task_plan_reviews/fix_linux_sandbox_deny_placeholders/review_0.md`–`review_2.md` (3 FAIL) and `harness-runs/architecture_reviews/fix_linux_sandbox_deny_placeholders/review_0.md`–`review_1.md` (2 FAIL); this session's resumed revision then passed `architecture-reviewer` (iteration 2) and `task-plan-reviewer` (iteration 3) with no file written, so 7 rounds total. Per root, by finding title: task-plan review rounds 1 and 2 each carried only net-new Must Fix titles (2, then 1); round 1's Should Fix list carries an item headed "Carried from iteration 0, still not addressed or rejected" (1 re-raised). Architecture review round 1's Must Fix title is net-new; its Should Fix "`machineStateDir`'s account of the state directory still does not name the new manifest" is re-raised from round 0, and the same issue was raised again at branch level as `harness-runs/architecture_branch_reviews/fix_linux_sandbox_deny_placeholders_arch_review.md` Finding 2. The task-plan round-2 Should Fix "The pass-start sweep logs a kept path on every poll" reappeared as `harness-runs/code_reviews/fix_linux_sandbox_deny_placeholders_code_review.md` Finding 1.
- **cost this run:** the plan loop hit its 5-revision cap and parked once (`harness-runs/clarifications/fix_linux_sandbox_deny_placeholders/question_1.md`); two plan-stage Should Fix items were fixed only after implementation, as branch-review findings.

## B.2 and C2.2 meta-reviews each ran once and changed nothing
- **category:** optimization
- **evidence:** zero-yield phase. `review-plan-reviewer` over the code-review index (dispatch #33) and over the skeptic-review index (dispatch #44) each returned `verdict: PASS` on iteration 0 and wrote no file (`harness-runs/review_plan_reviews/fix_linux_sandbox_deny_placeholders/` and `harness-runs/skeptic_review_plan_reviews/fix_linux_sandbox_deny_placeholders/` absent); each passed its 1 unit.
- **cost this run:** 2 dispatches, no change.

## Task 10 dispositioned: notes-app profile write refused
- **category:** tooling-gap
- **evidence:** commit `9f6fcef3`, unit token `Task 10`, cause recorded on the commit: "tool-layer guard refused the write to examples/notes-app/.claude/settings.autonomous.json under a .claude/ directory". Diagnosis: `harness-runs/task_plans/fix_linux_sandbox_deny_placeholders/task_10_plan.md` → `## Disposition`.
- **cost this run:** the unit was closed without a fix; `examples/notes-app/.claude/settings.autonomous.json` still carries the stale "on Linux too" `_README` sentence.

## Finding 2 dispositioned: the same notes-app profile write refused again
- **category:** tooling-gap
- **evidence:** commit `acf9bd90`, unit token `Finding 2` (code review), cause recorded on the commit: "tool-layer guard refused the Edit to examples/notes-app/.claude/settings.autonomous.json twice in don't-ask mode". Diagnosis: `harness-runs/code_reviews/fix_linux_sandbox_deny_placeholders_code_review/finding_2.md` → `## Disposition`.
- **cost this run:** the unit was closed without a fix; the branch-reviewer re-raised the stale fixture that Task 10 could not edit, and the second attempt hit the same refusal.

## Plain shell utilities refused in don't-ask mode during units
- **category:** tooling-gap
- **evidence:** implementer returns this run: a standalone `bash -n` syntax check was refused by the permission mode (Task 2, Task 6, architecture Finding 3); `cp` from a template onto its self-adopted copy was refused (Task 5; architecture Finding 1, general layer), so the copies were rebuilt with Edit replacements and checked with `cmp`; `rm` of a scratch file was refused (Task 7), leaving `harness-runs/scratch/task7_quotes.txt` behind (git-ignored).
- **cost this run:** each check was rerouted, through `bash scripts/typecheck.sh`'s shell-parse step or Edit-and-`cmp`; no unit failed on it.

## Two unit test runs passed the 600 s tool limit and went uncollected
- **category:** tooling-gap
- **evidence:** Task 3's run of `cli/test/watcher-stall-reset-payloads.test.mjs` was moved to the background by the tool layer at 600 s (subtests 1–8 `ok` when it moved). Code-review Finding 1 (cli layer): run 1 of `cli/test/watcher-placeholder-host.test.mjs` reported `# tests 16`, `# pass 13`, `# fail 3`, all 3 timeouts; run 2 was moved to the background at 600 s.
- **cost this run:** both units committed with an evidence downgrade; the whole-tree Run gates round 1 then printed `pass`.

## A multi-layer fix unit's first layer refused a partial edit
- **category:** agent-contract
- **evidence:** dispatch #39 (`[C · Item 3 · cli · iter 0] → layer-implementer`, code-review Finding 1, tag `cli, general`) returned an unmarked blocker: "the finding's fix needs edits outside this dispatch's `cli` path scope". It was re-dispatched as #40 with the routing fact on a `context_notes:` line (`harness-runs/dispatch_additions/fix_linux_sandbox_deny_placeholders.md`), and then completed. The architecture Finding 1 unit, same `cli, general` shape, ran its cli layer without that note and left the general half for the next dispatch.
- **cost this run:** 1 dispatch redone.
- **hypothesis:** a guess — the per-finding fix steps name both layers' files, and the implementer cannot see which layer will follow.

# User-review fix round 1 — job-mode placeholder manifest and sweep

## The per-unit layer reviewer passed all 3 fix items on its first pass and changed nothing
- **category:** optimization
- **evidence:** zero-yield phase. `layer-reviewer` ran once on each of the 3 fix-plan units (dispatches #2, #5, #8) and returned `verdict: PASS` at iteration 0 each time; each unit's folder under `harness-runs/user_review_fix_plan_point_reviews/fix_linux_sandbox_deny_placeholders_fix_plan/` holds only `item_<K>/review_0.md` (items 1–3), and no fix re-dispatch followed any of them.
- **cost this run:** 3 dispatches, no change to any unit.

## The disposition derivation's unit-token match picks up a task-run commit whose token collides with this round's
- **category:** agent-contract
- **evidence:** the prescribed `git log … <default_branch>..HEAD` could not run as written: `git rev-parse --verify dev` printed `fatal: Needed a single revision` in this checkout, and `statistics-plan-writer` reported the same fallback to `origin/dev..HEAD`. Over `origin/dev..HEAD`, commit `acf9bd90` (`fix: Record disposition of Finding 2 — …`) matches, and its token `Finding 2` is also a readiness unit of this round's `harness-runs/user_reviews/fix_linux_sandbox_deny_placeholders_fix_plan.md`. But that commit changes only `harness-runs/code_reviews/fix_linux_sandbox_deny_placeholders_code_review.md` and its `finding_2.md` (the task run's code review), and this round's Finding 2 landed code in `53ebd512`. It was excluded by its changed-file list, not by the token intersection, so this round reports no dispositioned items.
- **cost this run:** none landed. Applied literally, the token intersection would have reported a task-run disposition as this round's.
- **hypothesis:** a guess — `Finding K` tokens repeat across a branch's code-review and user-review indices, so the token alone does not identify the round.
