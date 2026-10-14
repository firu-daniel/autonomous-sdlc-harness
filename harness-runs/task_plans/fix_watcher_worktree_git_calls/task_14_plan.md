### Task 14 — `docs/cli.md` §6 and §7, and `docs/watcher.md`: residual 1 narrowed, and where the family runs git

**Goal:** Write the inventory's result into the two documents that own it.

- `docs/cli.md` §6: residual 1 narrowed to exactly what remains, with its reason, and residual 2's closing clause matched.
- `docs/cli.md` §7: `doctor`'s new option.
- `docs/watcher.md`: the prepare and commit steps, the `commit-on-branch.sh` row, and a new statement of which of the watcher family's git calls run where and under what pins.

This is the catch-all task. It documents what Tasks 1–9 built and changes no code.

**Depends on:** Tasks 1–9. The facts this task states, as those tasks define them:

- **Every watcher-family git call in a run's copy runs no hook** (`core.hooksPath=/dev/null`), with `-c core.fsmonitor=false -c submodule.recurse=false`, and `--ignore-submodules` / `--no-recurse-submodules` where a call could recurse. Each runs either as `git -C <main>`, or with `GIT_DIR=<main>/.git`, `GIT_INDEX_FILE=<record>/index` and `GIT_WORK_TREE=<copy>`, naming `refs/heads/<branch>`, never `HEAD`. Git never reads the record's `config.worktree`, `commondir`, `HEAD` or the `.git` pointer. The main checkout is placed by `hr_wrapper_main_of`, the copy is checked by `hr_wrapper_target_check_var`, and the branch is read once by `hr_wrapper_branch_var`. The code is `cli/templates/scripts/lib/harness-run-lib.sh` → the section *The watcher family's git in a run's copy*.
- **No unsandboxed checkout installs a run-authored protected path.** Before a fast-forward, a reset or `create-worktree.sh --existing` writes a tree, the tree must equal the default branch at their merge base on `copySurfacePaths`. The default branch there is the commit origin reports at that moment (`ls-remote`, then a destination-less fetch and `cat-file -e`), never a local ref, because a sandboxed session can write `refs/remotes/origin/<defaultBranch>` and `refs/heads/<defaultBranch>`; an unreachable origin is a refusal. That set is `<githooksDir>`, `.mcp.json`, `.claude/settings.json` and `.claude/settings.local.json`, plus `<scriptsDir>/docs-search-server.sh` and `<scriptsDir>/lib` where retrieval applies, read from the main checkout's configuration. A reused copy's working tree must match too, with nothing untracked there. The chosen remedy is refusal, never restore.
- **The watcher's artifact commit** (task prompt, docs checklist, remote review) is a plumbing commit through `hr_commit_placed`. It commits only the artifact over `refs/heads/<branch>` through a temporary index, hashes with `--no-filters`, runs no commit hook, refuses a protected branch from the main checkout's configuration, and leaves the copy's index clean. `commit-on-branch.sh` is unchanged for dispatched agents.
- **`create-worktree.sh --existing`** checks the tip, adds the copy with `--no-checkout`, populates it from that commit with `read-tree`, and bootstraps with the **main** checkout's `setup-worktree.sh --target <copy>` and configuration.
- **The state directory a dropped file is placed under is the main checkout's.** A copy whose own configuration resolves to another one is refused.
- **`cleanup-merged-worktrees.sh`** removes a working copy only when it passes the target check and equals the gone branch's derived directory.
- **`doctor --job-surfaces=<branch>`** runs only the `job-surfaces` check. It fails when the branch's own commits since `merge-base(HEAD, origin/<defaultBranch>)` changed any path of `jobSurfacePaths`, with `defaultBranch` read from `<branch>`'s tree. Its `--job-surfaces=<branch>@<commit>` form reads the configuration from `<commit>` and takes `merge-base(HEAD, <commit>)`, reading no `refs/remotes/origin/*` ref; the job-mode watchdog passes the commit `harness-run.yml` recorded before any session. `harness-run.yml` runs it before the plugin install, and the job-mode watchdog runs it before its reset.
- **No `npm` or `npx` the family or the job runs starts in a run's checkout, but the bootstrap's two configured commands, `commands.depInstall` and `commands.build`.** The watchdog's `npx` runs from a fresh `mktemp -d` directory, and every `run`-job step that runs `npm` or `npx` runs with `working-directory: ${{ runner.temp }}`; each names the repository with the CLI's global `--cwd`. So a run-written project `.npmrc` (`registry=`, `node-options=`) or `node_modules/` — neither a job surface — is out of npm's reach, whether committed by an earlier job or written by the session without a commit.

**What remains as residual 1, narrowed, with each reason:**

1. **The bootstrap's configured commands, `commands.depInstall` and `commands.build`, run against a run's own manifest** unsandboxed. This happens in `create-worktree.sh --existing`'s bootstrap locally, and in the job's `Bootstrap the checkout` on GitHub. The install runs the manifest's lifecycle scripts, and a build such as `npm run build` runs its `scripts.build` / `prebuild` / `postbuild`; `package.json` is in neither `copySurfacePaths` nor `jobSurfacePaths`. A package manager runs the manifest's lifecycle and script entries by nature, and no out-of-session sandbox runtime ships to run them in. These two are also the npm runs left inside a run's checkout, so they still read a run-written project `.npmrc` or `node_modules/`; every other `npm` / `npx` call runs from outside the checkout.
2. **Filter (smudge/clean) drivers** the user's own global or system git configuration defines still run during the watcher's `read-tree` checkouts, against a `.gitattributes` the run wrote. This is residual 6's exposure, now reached by the watcher's checkouts as well.
3. **The copy check reads the record once**, and on Linux a sandboxed rewrite can race that one read. This is residual 2's remaining case, with git never re-reading it afterwards.
4. **Writes the family makes into a copy other than artifact placement and the watchdog's note** are not git calls and are not hardened here. An example is `lib/harness-run-lib.sh` → `hr_remote_bundle_restore`'s writes into a mirror. **Read that function before writing this item.** State it only for the writes it actually makes through an unguarded path, naming each.
5. **The object store is sandbox-writable**, so a session could overwrite the bytes of an object the trusted base already names. **Probe it before writing this item**, in a throwaway repository: overwrite a committed blob's loose object file with other content under the same name, run `git read-tree --reset -u HEAD`, and see whether the working tree takes the substituted bytes. If it does, state it as a residual with that observation and the git version; if git refuses, state what refused and omit the residual.

### Targets

- `docs/cli.md`
- `docs/watcher.md`

**The inventory, which `docs/watcher.md`'s new subsection carries as its result table.** Classes: (a) trusted tree, (b) reads only, (c) exposed.

| Script → site | Class before | Payloads | Now |
|---|---|---|---|
| `autonomous-watcher.sh` → review reuse: `hr_current_branch` | (b) | the `.git` pointer or record (Linux) | branch read once from main |
| → review reuse: `status --short` | (c) | `config.worktree` fsmonitor; a nested repository's config; `modules/*/config`; `.gitattributes`; the pointer or record | env-pinned `diff` / `diff-index` with no hook and no fsmonitor, plus the surface check |
| → remote arm: `fetch` | (c) | `config.worktree` (`core.sshCommand`, `remote.*`); hooks; `modules/*/config` | `git -C <main>`, pinned, URL required in the main `.git/config` |
| → remote arm: `merge --ff-only` | (c) | committed protected paths; `post-merge` / `reference-transaction`; fsmonitor; `.gitattributes` | plumbing fast-forward after the surface check |
| → artifact commit (`hr_commit_placed` → `commit-on-branch.sh`) | (c) on the review path, (a) on task and docs | commit hooks; `config.worktree`; the run's other staged paths | plumbing commit of one path, no hook |
| → `hr_push_landed` | (c) through its fetch | `config.worktree`; hooks | reads and fetch in main |
| → stall watchdog: `reset --hard HEAD` | (c) | committed protected paths; `reference-transaction`; fsmonitor; submodules; in job mode, the outer-loop scripts the post-session steps run | copy check, plus `doctor --job-surfaces` in job mode, plus a surface-checked `read-tree --reset` |
| → `footprint_grade`: `rev-parse --show-toplevel` | (b) | none | unchanged |
| `create-worktree.sh` → default mode | (c) offline: a failed fetch was tolerated and the cut came from `refs/remotes/origin/<defaultBranch>` as it stood | a forged `refs/remotes/origin/<defaultBranch>` | (a): cut from the commit origin reports, exit 2 when it cannot be established |
| → `--existing`: `worktree add` and the branch's `setup-worktree.sh` | (c) | committed hooks (probed at plan time: the branch's `reference-transaction` ran); committed protected paths; the branch's own scripts and configuration | surface check, `--no-checkout`, `read-tree`, and the main checkout's bootstrap |
| `setup-worktree.sh` | (c) when it is the branch's own | the branch's `commands.*` | run only as the main checkout's copy for an existing branch; its `commands.depInstall` and `commands.build` are residual item 1 |
| `commit-on-branch.sh` as the watcher called it | (c) | as the artifact-commit row | no longer called by the watcher |
| `cleanup-merged-worktrees.sh` → `worktree remove --force` | (c), destructive | the pointer or record (Linux); a record's `HEAD` | target check plus derived-path equality |
| `restart-watcher.sh` | — runs no git on a copy | — | unchanged |
| `remote-run.sh` → `review`: mirror detection, `fetch`, `merge --ff-only`, `ls-tree HEAD`, `rev-parse HEAD`, commit | (b) / (c) | as the watcher's rows | same primitives |
| → `start`: commit in a fresh cut | (a) | — | same primitive |
| → `lineage_commits_var`, and every `refs/remotes/origin/*` read | (b) / (a) | none | unchanged |
| `harness-run.yml` → `run` job | (c) | the branch's own scripts, configuration, `.claude/settings*.json`, `.mcp.json` and hooks | `doctor --job-surfaces` step before them (`docs/remote-execution.md`, Task 15) |
| → every `run`-job `npm` / `npx` step, and the job-mode watchdog's `npx` | (c) when run in the checkout | a project `.npmrc` (`registry=`, `node-options=`) or `node_modules/` the run wrote | run from `$RUNNER_TEMP` / a `mktemp -d` directory, naming the repository with `--cwd`; the bootstrap's `commands.depInstall` and `commands.build` are residual item 1 |

**Work:**

- [ ] **`docs/cli.md` → `**Residuals, stated rather than hidden:**`, item 1.**
  - Rewrite it to say the watcher family's git calls in a run's copy now run as `docs/watcher.md`'s new subsection states.
  - Then state the narrowed residual 1, the four items above, each with its reason, and nothing more.
  - Keep the numbering, because other text cites *residual 6* and *residual 2* by number.
- [ ] **The same list, item 2's closing clause** "— and the watcher's own calls, residual 1.": replace it with a clause saying the watcher family's calls take the same once-only read, so on Linux they leave the same race, now named in residual 1's narrowed item 3. **The same section's wrapper paragraph**, "**The excluded rule's `:*` accepts any argument …**", says both wrappers drop an inherited `GIT_*` list. Add that the list now lives in `lib/harness-run-lib.sh` → `hr_git_env_drop`, unchanged.
- [ ] **`docs/cli.md` → `## 7. \`doctor\``.** Change "It takes four options of its own" to five, and describe `--job-surfaces=<branch>` beside `--remote-job`: what it runs alone, what it compares, where the trusted configuration comes from, its exit, and that the remote job runs it (`docs/remote-execution.md`). Add the `job-surfaces` row to the check table if the table lists checks run only under an option. Otherwise say in the option's own paragraph that it runs no other check.
- [ ] **`docs/watcher.md`.**
  - **Step 4:** the `--existing` arm checks the tip, populates without a hook, and bootstraps from the main checkout.
  - **Step 5:** artifacts are committed by the watcher's own plumbing commit, which runs no hook, not through `commit-on-branch.sh`. The remote arm's fast-forward is plumbing, after the surface check. A copy that changes a protected path, or whose `stateDir` differs from the main checkout's, is refused before launch.
  - **The `## 2. The scripts` row for `commit-on-branch.sh`:** "Who runs it" becomes dispatched agents only.
  - **The `## 2. The scripts` row for `create-worktree.sh`** ("then hands off to `setup-worktree.sh`"): keep the default-mode hand-off and the `--no-bootstrap` clause. Add that with `--existing` it adds the copy without a checkout, checks the tip and populates it from that commit, and hands off to the **main** checkout's `setup-worktree.sh --target <copy>`, never the branch's own.
  - **The `## 2. The scripts` row for `setup-worktree.sh`** ("Bootstraps the checkout it sits in"): it bootstraps the checkout it sits in, or with `--target <dir>` the copy at `<dir>`, using its own checkout's configuration. Add `create-worktree.sh --existing` as the caller of the `--target` form.
  - **A new subsection at the end of `## 2. The scripts`, `### Where the family runs git in a run's copy, and under what pins`:** the inventory table above, condensed to *site, class, what reaches it, how it runs now*, then the pins in one paragraph, then a pointer to `docs/cli.md` §6 for what remains.
- [ ] **Scope closure for this task's documents.** Re-run the story index's derivation entries 1 and 2 verbatim after editing. Every hit in `docs/cli.md` and `docs/watcher.md` must be a register row this task changed, or one whose `no-change` reason still holds.

**Verification:**

- `git grep -nE "watcher's own (git )?calls|watcher's own artifact commit|takes four options of its own|Bootstraps the checkout it sits in —" -- docs` finds no hit.
- `git grep -n -e "--target" -- docs/watcher.md` hits the `create-worktree.sh` and `setup-worktree.sh` rows, and both name the main checkout's script for `--existing`.
- Re-running the story index's derivation entries 1 and 2 verbatim gives hits that are a subset of the register rows (`⊆ the register rows`).
- Every script, function and option `docs/watcher.md`'s new subsection names resolves by `git grep` in `cli/templates/scripts` or `cli/src`.
- No line number is cited anywhere in the edited text.
