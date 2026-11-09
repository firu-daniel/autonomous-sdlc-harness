### Task 1 — Add `hr_inbox_branch_refusal_var` to the run library, reusing `hr_branch_is_protected`

**Goal:** Give the run library one function that judges whether a branch derived from an inbox filename may be acted on, built on the existing protected-branch trichotomy and `git check-ref-format --branch`, so the watcher (Task 2) has a single call to make and no second matcher exists anywhere.

**Where this task stops.** This task adds the function, its library-header mentions and its unit case. It does **not** call the function from the watcher, archive anything, log or notify. That is **Task 2's** job (`cli/templates/scripts/autonomous-watcher.sh` → `process_inbox_file`), and the end-to-end watcher cases are **Task 3's**.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh`: the new function under the `Inbox routing — the one owner of the drop filename patterns.` banner, directly after `hr_inbox_route_var`, plus two header-comment edits.
- `cli/test/outer-loop-scripts.test.mjs`: one new case beside `'hr_inbox_route_var routes each suffix to its engine and branch and refuses anything else'`.

**Work:**

- [ ] `harness-run-lib.sh`: add `hr_inbox_branch_refusal_var <root> <branch>` after `hr_inbox_route_var`. **The contract below is exactly what Task 2 calls and Task 3 asserts on.**
  - It returns **0** when the branch may be acted on, with `HR_INBOX_REFUSAL` set to `""`.
  - It returns **1** when the branch is refused, with `HR_INBOX_REFUSAL` set to one of these three reasons, spelled exactly like this:
    - `'<branch>' is not a valid branch name (git check-ref-format --branch)`
    - `'<branch>' is a protected branch in '<root>/harness.config.json'`
    - `whether '<branch>' is protected cannot be judged: the protected set in '<root>/harness.config.json' cannot be resolved`
  - It never returns anything else.
- [ ] Same function, the order of tests (validity first, so a name git rejects is reported as such even when the configuration is also unreadable):
  - (a) an empty branch, or one starting with `-`, is invalid. This mirrors `hr_clone_create_var`'s `'' | -*` arm and `remote-run.sh` → `valid_branch`.
  - (b) capture the **stdout** of `git -C "$root" check-ref-format --branch "$branch"` with stderr discarded. A non-zero exit is invalid, and so is an exit 0 whose printed name is not byte-equal to `$branch`. **The second condition is load-bearing:** `--branch` expands the `@{-N}` previous-checkout syntax and prints the branch it names, so `@{-1}` exits 0 in any repository with a previous checkout.
  - (c) call `hr_branch_is_protected "$root" "$branch"` and `case` on its status, following the established `|| status=$?` idiom (`hr_branch_taken_judge`): `1` passes, `0` is the protected reason, and anything else is the unresolvable reason. Never treat 2 as 1. The library header's `THE THREE-STATE ANSWER` paragraph says why.
  - The function sets no shell option (the sourced-library rule in `.claude/context/conventions.md` → `## Shell assets`) and stays bash 3.2-safe.
- [ ] `harness-run-lib.sh` header:
  - In the opening summary, extend *"routes an inbox filename to its engine and branch (`hr_inbox_route_var`),"* to name the new function as the intake judge of that branch.
  - In `THE THREE-STATE ANSWER` paragraph, replace the stale clause *"the watcher logs and defers"*. No watcher site defers on 2 today. The replacement states the two watcher outcomes that will be true after Task 2: its inbox intake archives the drop as `rejected_` through `hr_inbox_branch_refusal_var`, and its `job` subcommand refuses with exit 2.
  - Give the function itself a comment stating the contract above and why the printed-name comparison exists.
- [ ] `outer-loop-scripts.test.mjs`: add a case named like `'hr_inbox_branch_refusal_var refuses an invalid, protected or unresolvable branch and accepts any other'`, using the file's own `fixtureFor` / `initOk` / `sourceAndCall` pattern from the neighbouring `hr_inbox_route_var` case (a reader that prints `"$?|$HR_INBOX_REFUSAL"`). Read the protected name as `defaultBranch` from the fixture's own `harness.config.json`, never a literal. Rows:
  - `feat_x` gives `0|`.
  - The `defaultBranch` value gives `1|` plus the protected reason.
  - `a..b`, `foo.lock`, `-x` and the empty string each give `1|` plus the invalid reason.
  - `@{-1}` gives `1|` plus the invalid reason, run after the fixture repository has a previous checkout. Create a branch and switch back with `runGit`, committing first if the fixture has no commit, so `--branch` really expands it.
  - `feat_x`, with `defaultBranch` deleted from the fixture's `harness.config.json`, gives `1|` plus the unresolvable reason.

**Verification:**

- `npm test --workspace cli -- test/outer-loop-scripts.test.mjs` passes, and the new case's `@{-1}` row is refused.
- `grep -n 'hr_branch_is_protected' cli/templates/scripts/lib/harness-run-lib.sh`: the new function's body contains a call, and the body contains no `case` over `protectedBranches` patterns and no second reading of the protected set.
- `grep -n 'logs and defers' cli/templates/scripts/lib/harness-run-lib.sh` prints nothing.
