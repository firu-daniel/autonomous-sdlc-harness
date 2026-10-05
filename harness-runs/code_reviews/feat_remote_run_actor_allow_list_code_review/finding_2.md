### 2. The README and the run-control entry point give the unset default as "the repository owner" with no organisation case

**Files:**
- `README.md` → `### Working from GitHub` — "by default only the repository owner, and the maintainer names anyone else"
- `docs/github-run-control.md` → `## The GitHub entry point`, opening paragraph — "the repository owner alone until it is set"

Both sentences give an unset `HARNESS_RUN_ACTORS` one meaning: the repository owner. That holds only when a personal account owns the repository. The code has a second case. `remote-run.sh` → `run_actor_listed`, the gate step in `harness-run.yml`, and `cli/src/remote/githubActions.ts` → `effectiveRunActors` all admit **nobody** when the owner is an `Organization`, or when the owner's type cannot be read. Every other document this branch touched states both cases:

- `docs/github-issue-trigger.md` → `## 3. Who can start a run`
- `docs/github-run-control.md` → `## 6. Who can act, and pull requests from forks`
- `docs/remote-execution.md` → `## 7. Turning it on`, step 4

The reader who goes wrong is a maintainer of an organisation-owned repository. Reading the README or the entry point, they conclude they need not set the variable, because the default already admits "the owner". In fact every trigger, command, review and **Run workflow** dispatch is refused until they set it. The cause is spelled out only after the first refusal, or in the linked section.

**Fix:**

- [ ] `README.md` → `### Working from GitHub`: replace "by default only the repository owner, and the maintainer names anyone else in the repository variable `HARNESS_RUN_ACTORS`" with:

  > by default only the owner of a repository a personal account owns, and nobody in an organisation-owned one, and the maintainer names anyone else in the repository variable `HARNESS_RUN_ACTORS`

- [ ] `docs/github-run-control.md` → `## The GitHub entry point`: replace "— the repository owner alone until it is set —" with:

  > — until it is set, the owner alone of a repository a personal account owns, and nobody in an organisation-owned one —

- [ ] Leave the link targets and the rest of each sentence unchanged.
