### Task 18 — Add `doctor`'s offline `remote-execution` check

**Goal:** Make `doctor` report the remote setup's state from what it can see without the network — including a setting that is on but incomplete (Acceptance 5) — and say plainly that remote execution is off when it is.

**Depends on:** Task 17, which writes `.github/workflows/harness-run.yml` and `harness-resume.yml` when `remoteExecutionApplies(config)` (Task 1). Task 14, which last edited `cli/src/doctor/checks.ts` (the `plugin-permissions` check now calls the shared `pluginRootHelpers` / `pluginRootEntries`); this task edits that file after it. Task 2's `WORKFLOW_RUN_PATH`, `WORKFLOW_RESUME_PATH`, `GH_CLI_VARIABLE` and `ghCli()` (the binary run as `gh`: `HARNESS_GH_CLI` when set, else `gh`), and the secret and variable names the pass text names.

**The check, stated once for every consumer** (Task 19 sits beside it; Task 27 documents both):

`remote-execution` — *"the configured execution target, and whether this repository has what a remote run needs locally"*. It reaches no network and runs no `gh` subcommand — resolving the binary on `PATH` is the whole of its `gh` question.

| State | Grade | Detail names |
|---|---|---|
| `execution.target` absent or `local`, no workflow file | `pass` | "local execution; remote execution is off (`execution.target`)" |
| `local`, a workflow file present | `pass` | that the watcher dispatches nothing while the key is `local`, and the one `config set` that turns it on |
| `github-actions`, `harness-run.yml` absent | `fail` | `init` as the remedy — no remote run can be dispatched |
| `github-actions`, `harness-resume.yml` absent | `warn` | that a usage-paused hosted run then waits for `/autonomous-sdlc-harness:branch-resume` |
| `github-actions`, `gh` not resolvable on `PATH` | `fail` | the watcher dispatches through it; the install step |
| `github-actions`, `harness-run.yml` not present on `origin/<defaultBranch>` | `warn` | GitHub dispatches only a workflow its default branch carries: commit and push it |
| `github-actions`, all of the above satisfied | `pass` | the secrets and variables this check cannot see, and `doctor --check-github` as the way to ask GitHub |

**Whether the installed daemon's `PATH` reaches `gh` is `daemon-path`'s question, not this check's.** Rather than a second reader of the installed unit's `PATH`, `requiredBinaries` (the list `DAEMON_PATH_CHECK` grades) gains `gh` as a conditional member when `remoteExecutionApplies(config)`, so the existing `daemon-path` check reports it with its own grade, wording and remedy. The binary's name is taken the way the agent CLI's is: the installed unit's own `HARNESS_GH_CLI` value (`unitEnvValue(backend.kind, text, GH_CLI_VARIABLE)`) when set and non-empty, else `gh`, passed as a new fourth parameter `unitGhCli: string | undefined`. With remote execution off, `requiredBinaries` returns exactly what it returns today.

**Where the code lives — one route, no cycle, no copy.**

- `REMOTE_EXECUTION_CHECK` is defined **in `cli/src/doctor/checks.ts`**, beside the other checks (its header opens *"`doctor`'s questions: what is asked of an adopted repository, and how each answer is graded"*, and every existing check lives there). It calls the module's own private `resolvesOnPath` for the `gh` row and the module's own `pass` / `warn` / `fail` / `unevaluated` builders — nothing is exported, re-imported or re-implemented. **No `cli/src/doctor/remoteExecution.ts` is created**; Task 19 adds `REMOTE_GITHUB_CHECK` to the same file.
- The "present on `origin/<defaultBranch>`" question is a git read, so it is a new function in `cli/src/core/git.ts` — `pathAtRef(root, ref, path): boolean` over `git cat-file -e <ref>:<path>` with a fixed argument vector — because that module is the only one that invokes `git` (`.claude/context/conventions.md` → `### Where a new responsibility goes`).

### Targets

- `cli/src/doctor/checks.ts` — `REMOTE_EXECUTION_CHECK` and its doc comment; its `CHECKS` entry, placed after `daemon-path`; `requiredBinaries`' conditional `gh` member, its fourth parameter, and its doc comment's *"Three fixed members"* paragraph (which gains the conditional fourth); `DAEMON_PATH_CHECK` passing the unit's `HARNESS_GH_CLI` value; the module header's list of what is imported rather than re-derived (`remoteExecutionApplies`, Task 2's names, `pathAtRef`).
- `cli/src/core/git.ts` — `pathAtRef`.
- `cli/test/doctor.test.mjs` — the accompanying cases.

**Work:**

- [ ] Add `pathAtRef` to `core/git.ts` with a doc comment in that module's style.
- [ ] Extend `requiredBinaries` with the conditional `gh` member and its fourth parameter, source text naming `remote-run.sh` and `execution.target`; update its doc comment and `DAEMON_PATH_CHECK`'s call. Output for a repository with remote execution off is unchanged.
- [ ] Write `REMOTE_EXECUTION_CHECK` in `checks.ts` per the table, with a doc comment stating the rule *remote setup is graded from local evidence by default and asks GitHub only under `--check-github`* (the module header's choice 3 line extended to GitHub), resolving `gh` via `resolvesOnPath(ghCli())`.
- [ ] Register it in `CHECKS` after `daemon-path`.
- [ ] Cases on throwaway fixtures, with `PATH` controlled and `HARNESS_GH_CLI` pointed at a stub where `gh` should resolve: each row of the table, asserting grade and a stable fragment of the detail; `doctor`'s exit status is 1 exactly in the two `fail` rows; a fixture with the key absent reports the first row and its exit status is what it was before this task; a planted daemon unit whose `PATH` lacks the stub's directory makes `daemon-path` name `gh` when remote execution is on and not when it is off.

**Verification:**

- `bash scripts/typecheck.sh` and `bash scripts/test.sh` exit 0; every existing `daemon-path` case in `cli/test/doctor.test.mjs` passes unchanged.
- No case in the new tests reaches the network: every `gh` the check could touch is the stub, and the check itself spawns none.
- `doctor --help` and the report order list `remote-execution` after `daemon-path`.
- `git ls-files cli/src/doctor` lists no `remoteExecution.ts`, and `grep -n -E "function (resolvesOnPath|locateOnPath|pass|warn|fail|unevaluated)\b" -r cli/src` hits only `cli/src/doctor/checks.ts` — no second copy.
