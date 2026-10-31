## `bash -n` on an edited shell script is refused in the unattended run copy
- **category:** tooling-gap
- **evidence:** the Task 2 and Task 5 `layer-implementer` returns each report the plan's `bash -n` verification step "refused" by the permission mode; both fell back to `bash scripts/typecheck.sh`'s shell-parse step (97 files, 0 failed). Task 2 recorded it as an evidence downgrade in `harness-runs/task_plans/fix_linux_sandbox_sibling_glob_trio/task_2_plan.md`; Task 5 in `harness-runs/task_plans/fix_linux_sandbox_sibling_glob_trio/task_5_plan.md`.
- **cost this run:** two task plans' named parse check did not run as written; parse evidence rests on the typecheck wrapper instead.

## `cp` of a template over its self-adopted copy is refused in the unattended run copy
- **category:** tooling-gap
- **evidence:** the Task 4 `layer-implementer` return ("`cp` was refused under don't-ask mode") and the code-review Finding 4 (general layer), Finding 3 (cli layer) and Finding 2 (cli layer) returns each report the template→`scripts/` copy refused; each re-applied the template's hunks by hand with the Edit tool and confirmed byte-identity with `cmp` / `git diff --no-index`.
- **cost this run:** four units mirrored `cli/templates/scripts/…` into `scripts/…` hunk by hand instead of by one copy.

## Push of the run branch failed with `Permission denied (publickey)` mid-run, then recovered
- **category:** tooling-gap
- **evidence:** the C2.3 `committer` (commit `560b6a5c`) returned `pushed: failed` after `push-branch.sh`'s three attempts all failed with `Permission denied (publickey)`. The orchestrator's next direct `bash scripts/push-branch.sh` (main checkout) call after commit `795b3eb1` also failed all three attempts: `ls-remote exited 128`, two `Permission denied (publickey)`, then `remote: Internal Server Error` / `[remote rejected]`. The following call (after `833cfa71`) succeeded on its third attempt; every push before and after succeeded on the first.
- **cost this run:** two commits sat unpushed until the next push call carried them.
- **hypothesis:** an intermittent SSH-agent / remote condition rather than the profile, since the same command succeeded before and after.

## Reviewers and the statistics writer each fell back to `origin/dev` because the run copy has no local `dev`
- **category:** agent-contract
- **evidence:** the A2 `architecture-reviewer`, the B.1 `branch-reviewer` and the D.1 `statistics-plan-writer` returns each state that `defaultBranch` `dev` has no local ref in this run copy and that they diffed / scanned `origin/dev..HEAD` instead; the `branch-reviewer` raised it as a `## Questions` item asking whether `origin/dev` is the right base.
- **cost this run:** three agents each resolved the diff base on their own; one escalated it as an open question to the operator.

## A multi-layer review finding's second-layer dispatch found its work already done
- **category:** flow-efficiency
- **evidence:** code-review Finding 3 (tag `cli, general`) and Finding 2 (tag `cli, general`): the `cli`-layer `layer-implementer` (dispatches #30, #33) also edited the `general`-layer mirror under `scripts/` because the finding's fix names both files; the following `general`-layer dispatches (#31, #34) each reported making no edit and only re-running the checks. For Finding 4 the `cli`-layer dispatch (#27) instead declined the out-of-path mirror and the `general` dispatch (#28) made it.
- **cost this run:** 2 of 3 multi-layer units spent one implementer dispatch that changed nothing.

## The same stale-statement finding class hit 3 of 4 code-review findings
- **category:** optimization
- **evidence:** `harness-runs/code_reviews/fix_linux_sandbox_sibling_glob_trio_code_review.md` readiness titles — Finding 1 (`legs-glob.sh`'s header re-quotes deleted sentences), Finding 3 (`push-branch.sh`'s two "unverified" glob statements), Finding 4 (wrong caller lists in the `hr_deny_glob_expand` / `hr_profile_deny_paths` headers); citing reviewer `branch-reviewer`. The plan loop's round 1 (`harness-runs/task_plan_reviews/fix_linux_sandbox_sibling_glob_trio/review_1.md`) raised the same class as its Must Fix per the `task-plan-writer`'s revision return (two "unverified" sites no task owned).
- **cost this run:** one extra plan revision round and three Phase C fix units.

# User-review fix round 1 — run copy's trio `Edit` rules on bubblewrap, empty `config.worktree` trust check, 2026-10-30 records

## `cp` of a template over its self-adopted copy is still refused in the unattended run copy
- **category:** tooling-gap
- **evidence:** the Finding 1 `general` `layer-implementer` (dispatch #3: "`cp` is refused in this mode"), the Finding 2 `general` one (#8) and the Finding 3 `cli` one (#13) each report the `cli/templates/scripts/…` → `scripts/…` copy refused; each re-applied the template's hunks with the Edit tool and confirmed byte-identity with `cmp`.
- **cost this run:** three units mirrored template edits into `scripts/` hunk by hand instead of by one copy.

## `rm`, `rm -f`, a direct `node` and a direct `bash -n` are refused, so scratch probes stay in the run copy
- **category:** tooling-gap
- **evidence:** the Finding 2 `cli` `layer-reviewer` (#7) reports `node` refused and its `rm` of `harness-runs/scratch/run_sibling_case.mjs` refused; the Finding 3 `general` reviewer (#16) left `harness-runs/scratch/fifo_config_probe.py`; the Finding 5 `layer-implementer` (#23) reports `bash -n` and `rm -f` refused and left `harness-runs/scratch/absent_check_probe.py`. All three files are git-ignored (absent from `git status --short`).
- **cost this run:** three scratch files left on disk; the script parse check ran through a scratch probe instead of `bash -n`.

## A Bash heredoc write was refused with a protected-branch message naming a detached branch
- **category:** tooling-gap
- **evidence:** the Finding 4 `layer-implementer` (#18) reports its heredoc write of the deviation note to `harness-runs/user_reviews/fix_linux_sandbox_sibling_glob_trio_fix_plan/finding_4.md` refused by a guard: "Branch detached is protected … confirm commit manually"; the run branch `fix_linux_sandbox_sibling_glob_trio` is not detached. It rewrote the note with the Edit tool.
- **cost this run:** one refused call; no lost work.
- **hypothesis:** the commit-branch guard judged text inside the heredoc body as a `git` command.

## The fix-plan writer could not read Claude Code's installed bundle, so the built-in-path list stayed unreadable
- **category:** tooling-gap
- **evidence:** the `user-review-fix-plan-writer` initial-write return (fix-plan dispatch #1) reports its read of the installed Claude Code bundle, outside this checkout, refused by the session's permissions; Finding 4 in `harness-runs/user_reviews/fix_linux_sandbox_sibling_glob_trio_fix_plan.md` therefore takes the review's "accept" arm rather than recording built-in paths in the sweep manifest.
- **cost this run:** review item 4 resolved to documentation only; the sweep does not cover Claude Code's built-in leftovers.

## Cross-finding doc sites flagged by implementers were left unedited because no finding owned them
- **category:** agent-contract
- **evidence:** the Finding 6 `layer-implementer` returns (#28, #30) each flag that `docs/cli.md` still labels the AP2 glob reading **measured** (residual 2; the §5 paragraph on what runs outside the sandbox; *Each run adds its own copy's paths by exact path*) and declined to edit it as outside the finding's file list; the Finding 2 (#10) and Finding 4 (#18) returns flag `docs/cli.md` / `docs/watcher.md` citations that point at the user-review record rather than `docs/sandbox-verification.md` §5, with no finding owning the re-point.
- **cost this run:** `docs/cli.md` carries "measured" wording that `docs/sandbox-verification.md` now labels *derived*.

## Two fix items needed 3 review rounds each
- **category:** optimization
- **evidence:** `harness-runs/user_review_fix_plan_point_reviews/fix_linux_sandbox_sibling_glob_trio_fix_plan/item_2/` holds `review_0.md` (`cli`), `review_1.md` and `review_2.md` (`general`); `item_6/` holds `review_0.md`, `review_1.md`, `review_2.md` (`general`). The files carry only severity-section headings, no per-finding headings, so the net-new / re-raised split is not measurable under the headings-only read.
- **cost this run:** three extra implementer + reviewer pairs: one on Finding 2 (dispatches #10–#11), two on Finding 6 (#28–#31).

# User-review fix round 2 — file-tool trio guard, AP8 correction, absent-path check script, 2026-10-31 records

## The dispositioned-units derivation command fails in a run copy with no local default-branch ref
- **category:** agent-contract
- **evidence:** `## Dispositioned units` (b) of the improvement-observations instructions prescribes `git log --format='%h %s%n%b' --name-only <default_branch>..HEAD`; with `defaultBranch` `dev` this run's `git log --format='%h %s%n%b' dev..HEAD` printed `fatal: ambiguous argument 'dev..HEAD': unknown revision or path not in the working tree.` The same scan against `origin/dev..HEAD` ran.
- **cost this run:** none beyond one re-issued command; without the re-issue the dispositioned and index-only scans would have read nothing.
- **hypothesis:** the run copy carries only the remote-tracking ref, the case the core's D.2 delivery bullet already handles by counting against `origin/<default_branch>`.

## `test-fix-plan-writer`'s machine-path check could not resolve the home directory
- **category:** tooling-gap
- **evidence:** the G.2 dispatch's return (`harness-runs/test_fix_plans/fix_linux_sandbox_sibling_glob_trio_review_2_round_1.md`) reported "the bare `printenv HOME` call was refused by the permission mode"; it fell back to a fixed-string search for the checkout prefix.
- **cost this run:** the home-directory needle of the agent's machine-path check went unchecked.

## Per-unit agents could not run a shell parse check or the typos tool on their own change
- **category:** tooling-gap
- **evidence:** Finding 3's `layer-implementer` return: "the permission mode refused a plain `bash -n` call" (it ran the check through `bash scripts/scratch-run.sh` instead); test-fix Finding 1's `layer-reviewer` return: "I did not run the `typos` tool on the file: the sandbox refused a combined command that included it".
- **cost this run:** the test-fix review passed on a grep rather than the gate's own tool; the gate itself ran it in round 2.

## Two reviewers raised the same `REPRO`-block pointer on Finding 1
- **category:** optimization
- **evidence:** Finding 1 (layers `cli, plugin`): the `cli` reviewer's `harness-runs/user_review_fix_plan_point_reviews/fix_linux_sandbox_sibling_glob_trio_fix_plan/item_1/review_1.md` and the `plugin` reviewer's `item_1/review_2.md` both report that the test suite's "Not covered" note points at `REPRO`-block coverage the guard does not carry; the second return says "The iteration 1 review raised this from the `cli` side and it is still open". Both PASSed, the finding was Should Fix in each.
- **cost this run:** none on the verdict; one finding carried unfixed through two reviews of the same unit.
