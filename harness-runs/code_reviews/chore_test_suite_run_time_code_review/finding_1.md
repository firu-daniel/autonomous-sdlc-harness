### 1. The gate-4 run-time record names two branch-only commits, so its reproduce command stops resolving once the branch is squash-merged

**File:** `docs/development.md` → `## 5. Verifying a change` → **Gate 4**, the **Run time, measured.** paragraph: "bash scripts/measure-suite.sh --ref a885d631d85b" (two fenced blocks), "`a885d631d85b` is the commit before the template-copied fixtures", the table header "`npm test` before (`a885d631d85b`)", and the fenced block "bash scripts/measure-suite.sh --ref 4c36164a9759 --runs 3". Line hints: 245, 249, 252, 254, 279.

**Problem.** Both commits the record names exist only on `chore_test_suite_run_time`:

- `a885d631d85b` is `chore: Flow progress P3 for chore_test_suite_run_time`.
- `4c36164a9759` is `chore: Add task plan for chore_test_suite_run_time`.

`dev` is merged by squash. `git log --merges --oneline dev` prints nothing, and every PR commit on `dev` (for example `fe17b4e fix: hooks json quote plugin root (#31)`) is a single-parent commit authored by GitHub. After this branch is squash-merged and deleted, neither SHA is reachable from `dev`, and a fresh clone does not have either object.

`scripts/measure-suite.sh` resolves `--ref` with `git rev-parse --verify --quiet "${ref}^{commit}"` and exits 2 with `--ref '<ref>' does not resolve to a commit` when that fails. So the one command this record gives for the before side of the restricted-core measurement fails in exactly the setting it exists for: `bash scripts/measure-suite.sh --ref a885d631d85b --cpus 4`, the follow-up that closes acceptance item 1. The record's own before/after labels also stop being checkable.

A commit that survives the merge already exists. `fe17b4e2293f` is `git merge-base dev HEAD`, the `dev` commit this branch forked from. Its tree matches `a885d631d85b` everywhere outside `harness-runs/`: `git diff --stat fe17b4e2293f a885d631d85b` lists only files under `harness-runs/`. Measuring at it measures the same code. `4c36164a9759` differs from this branch's `HEAD` only in `docs/cli.md` and `docs/development.md`, so the after state is the code the squash commit carries into `dev`.

**Fix.** Edit only the **Run time, measured.** paragraph and the fenced blocks in it:

- [ ] First fenced block: replace `bash scripts/measure-suite.sh --ref a885d631d85b --runs 1` with `bash scripts/measure-suite.sh --ref fe17b4e2293f --runs 1`.
- [ ] Second fenced block: replace `bash scripts/measure-suite.sh --ref 4c36164a9759 --runs 3` with `bash scripts/measure-suite.sh --runs 3`.
- [ ] Replace the sentence that begins "`a885d631d85b` is the commit before the template-copied fixtures and the concurrent suites;" and ends "…rounded to whole seconds:" with:

  > `fe17b4e2293f` is the `dev` commit before the template-copied fixtures and the concurrent suites. Its column was measured at `a885d631d85b`, a commit on the branch that brought them, whose tree differs from `fe17b4e2293f` only under `harness-runs/`. The after columns were measured at that branch's `4c36164a9759`, whose `cli/` and `scripts/` are the ones the `dev` commit adding `scripts/measure-suite.sh` carries. Neither branch commit survives that branch's squash merge, so every command here names a commit that does, and the after command runs at the checkout's own `HEAD`. Each figure is the script's own `measure-suite:` line rounded to whole seconds:

- [ ] Table header: replace each of the two `before (`a885d631d85b`)` with `before (`fe17b4e2293f`)`, and each of the two `after (`4c36164a9759`)` with `after`.
- [ ] Follow-up fenced block: replace `bash scripts/measure-suite.sh --ref a885d631d85b --cpus 4` with `bash scripts/measure-suite.sh --ref fe17b4e2293f --cpus 4`.

**Verification:**

- `git grep -n "a885d631d85b" -- docs` and `git grep -n "4c36164a9759" -- docs` each print only the new explanatory sentence.
- `git merge-base --is-ancestor fe17b4e2293f dev` exits 0.
- `git diff --stat fe17b4e2293f a885d631d85b -- . ':(exclude)harness-runs'` prints nothing.
