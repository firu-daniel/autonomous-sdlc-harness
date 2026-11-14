### Task 9 — Pin the per-round and planning-pause commit path sets at the commit wrapper

**Goal:** Prove, against the shipped `commit-on-branch.sh` in a throwaway fixture, that the exact path sets the two autonomous plan forks will pass at a round's end and on a planning pause stage those paths and nothing else — tracked edits and new untracked drafts under them alike — while a tracked change outside them stays out of the commit.

**Where this task stops.** The forks that issue these calls are **Task 19** (task plan) and **Task 20** (fix plan), and the pause rule that decides whether the commit happens at all is **Task 18**'s `autonomous_pause_and_ledger.md` §2.2 step. This suite pins the path sets and the wrapper's behaviour on them; it does not drive an orchestrator session, which no test in this package starts — its header says so. Each fork's fenced command must list the same paths as this file's literals, in the same order; Tasks 19 and 20 verify that against this file.

**The path sets this test pins**, `<state_dir>` and `<branch>` substituted by the fixture's values, in this order:

- **Task plan** (round commit `chore: Plan round <n> for <branch>`, pause commit `chore: Plan round <n> partial for <branch>`): `<state_dir>/story_plans/<branch>_story_plan.md`, `<state_dir>/task_plans/<branch>/`, `<state_dir>/task_plan_reviews/<branch>/`, `<state_dir>/business_parity_reviews/<branch>/`, `<state_dir>/architecture_reviews/<branch>/`, `<state_dir>/plan_revisions/<branch>/`.
- **Fix plan**, user-review round `<N>` with round suffix `<round_suffix>` (round commit `chore: Fix plan <N> round <k> for <branch>`, pause commit `chore: Fix plan <N> round <k> partial for <branch>`): `<state_dir>/user_reviews/<branch>_fix_plan<round_suffix>.md`, `<state_dir>/user_reviews/<branch>_fix_plan<round_suffix>/`, `<state_dir>/business_parity_user_review_reviews/<branch>/user_review_<N>/`, `<state_dir>/architecture_user_review_reviews/<branch>/user_review_<N>/`, `<state_dir>/plan_revisions/<branch>/`.

### Targets

- `cli/test/plan-round-commit.test.mjs` (new)

**Work:**

- [ ] Header: the rule this suite enforces (the two forks' round and pause commits stage exactly their planning path set and nothing else, and a repeated call is a no-op), what it deliberately does not cover (the orchestrator choosing when to call, which needs a live session), and the two path sets above as named literals in the file.
- [ ] Fixture: a repository `init` wired, on a non-protected branch, with a first commit holding a story index, one per-task file and an unrelated tracked file (for example `README.md`); then modify the story index, add an **untracked** `task_2_plan.md`, a round file in each task-plan gate folder and `plan_revisions/<branch>/task_plan_revision_1.md`, and modify the unrelated tracked file.
- [ ] **Round commit**: call the fixture's `commit-on-branch.sh --repo <dir> <the six paths> -- "chore: Plan round 0 for <branch>"`; assert exit 0, that `git show --name-only --format= HEAD` lists exactly the changed and new planning files, that the unrelated file is still modified and unstaged, and that an identical second call exits 3 with `HEAD` unchanged. Pass `business_parity_reviews/<branch>/` with no such folder on disk, and assert the call still succeeds (the wrapper's skip-with-warning for an absent path).
- [ ] **Pause commit, both cases the task prompt lists**: a pause after the writer returned and before the first reviewer (only the plan files and the revision note changed) commits exactly those under the partial subject; a pause between two reviewers (one more gate file than the last commit) commits exactly that file. The unrelated tracked change is never in either commit — the §2.2 dirty-tracked case stays the caller's to detect, which the header states.
- [ ] **Fix-plan set**: the same round-commit assertion over the five fix-plan paths for user-review round 2 (`<round_suffix>` `_2`, `user_review_2/`), with a round-1 fix-plan file present and untouched, which must not be in the commit.

**Verification:**

- `npm test --workspace cli -- test/plan-round-commit.test.mjs` passes — this task's own new test file.
- The fixture is built under the system temp directory by `cli/test/helpers/fixture.mjs` and removed in process; `grep -n "WORKSPACE_ROOT" cli/test/plan-round-commit.test.mjs` finds nothing, because this suite reads no file of this checkout.
