### Task 9 — Update `docs/cli.md` §6 and §7 and `docs/watcher.md` for three excluded wrappers and the plumbing commit

**Goal:** Make the project's own reference for the permission profile and for the outer-loop scripts describe what the branch built. Three main-checkout wrappers run outside the sandbox. The commit wrapper is one of them because a sandboxed git cannot write a linked worktree's record. It commits by plumbing against `<main>/.git` and runs no commit hook.

**Depends on:** Tasks 1, 4 and 5.

- **Task 4** made `sandbox.excludedCommands` exactly `bash <repoRoot>/<scriptsDir>/commit-on-branch.sh:*`, `…/push-branch.sh:*` and `…/refresh-branch.sh:*`. It moved the main checkout's `commit-on-branch.sh` into `protectedPaths`' unsandboxed-wrapper group, with no change to the protected set. It made `profile-sandbox`'s missing-entry finding name both failure classes.
- **Task 1's wrapper** runs the target, `config.worktree` and hooks-pin checks before any git call. It reads the branch and the protected set from the main checkout. It refuses a path whose attributes select a `filter`. It then commits through `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_commit_paths_var`, the plumbing core Task 1 factored out of `hr_commit_placed`, which the watcher's and `remote-run.sh`'s artifact commits now share. That core hashes every blob with `--no-filters` into a temporary index seeded from the tip, writes the tree, and runs `commit-tree` with the main configuration's identity and signing. It moves `refs/heads/<branch>` with a guarded `update-ref`, then syncs the record's `index` for the given paths. Its runners pin `core.hooksPath=/dev/null`, so no `pre-commit`, `prepare-commit-msg`, `commit-msg` or `post-commit` hook runs, and no other hook runs either.
- **Task 5** wrote the profile `_README` line `THREE COMMANDS RUN OUTSIDE THE SANDBOX, EACH IN ONE SPELLING`. The prose here should agree with it.

### Targets

- `docs/cli.md`
- `docs/watcher.md`

**Work:**

- [ ] `docs/cli.md` §6, the paragraph **Two wrappers run outside the sandbox, each in one spelling.** Rewrite it for three:
  - why the commit wrapper is excluded (`docs/sandbox-verification.md` G1, G2, F1, on Claude Code 2.1.299, macOS, headless);
  - that its callers spell it `bash <MAIN_REPO>/<scripts_dir>/commit-on-branch.sh --repo <repo_root> …`, literal and alone, as the push is (`plugin/instructions/autonomous_pause_and_ledger.md` §1.6);
  - that the worktree's own copy stays sandboxed and still cannot commit from a linked worktree.

  Keep the paragraph's P1a/P2 entry-form text unchanged.
- [ ] `docs/cli.md` §6, the next two paragraphs:
  - **The excluded rule's `:*` accepts any argument, so both wrappers check their target …**: make it "all three wrappers". Add the commit wrapper's after-the-checks rule in one sentence: git reads nothing of the record but its `index`, as for the refresh.
  - **Everything that runs outside the sandbox is write-protected on both sides**: "the two excluded wrappers" becomes "the three excluded wrappers". The set itself is unchanged.
  - **Credentials are denied on both sides**: "the two excluded wrappers keep the environment an HTTPS push needs" becomes "the excluded wrappers".
- [ ] `docs/cli.md`, the numbered residuals after §6. Residual 6 is about filter drivers during the refresh's checkout. Add one sentence saying it does **not** extend to the commit wrapper, and why. The commit wrapper runs no `git add`: its blobs are hashed with `--no-filters` by `hr_commit_paths_var`, the single policy `hr_commit_placed` already held, so no filter driver runs. A path whose attributes select one is refused rather than committed raw. Cite the library function by name. Residual 7 states what `refresh-branch.sh`'s merge commit no longer honours. Add the commit wrapper's equivalent:
  - its identity and signing come from the main configuration;
  - no commit hook runs, so an adopter's own `pre-commit` stops running for harness commits;
  - its message lands exactly as given, with no clean-up;
  - its ref update is logged in `logs/refs/heads/<branch>` only;
  - only the tip plus the given paths are committed;
  - content is stored exactly as the working tree holds it, so no `text`/`eol` conversion is applied, and a path selecting a `filter` (git-lfs, for one) is refused.

  Each item states what was decided and why, in that residual's style.
- [ ] `docs/cli.md` §7, the **`profile-sandbox` is a warning without `--remote-job` and a failure under it** bullet: "names exactly the two main-checkout wrapper entries" becomes "names exactly the main-checkout wrapper entries the outer-loop table marks `runsUnsandboxed`". That is three today, so the doc does not restate a count the table owns. Also describe the missing-entry finding Task 4 reworded.
- [ ] `docs/watcher.md`:
  - **The outer-loop table's `commit-on-branch.sh` row.** Update "What it does" to "Stages exactly the paths it was given and commits them by plumbing, refusing a protected branch", and say in the row that the main checkout's copy is a `sandbox.excludedCommands` entry.
  - **The trust-class rows "the artifact commit, formerly through `commit-on-branch.sh`" and "`commit-on-branch.sh`, as the watcher called it".** Their "commit hooks" threat described the old wrapper. Note that the wrapper now runs none, but the watcher still does not call it, because it stages into the run's index and judges the run's copy. Also note that both now commit through the same library core, `hr_commit_paths_var`. Keep both rows; the decision stands.

**Verification:**

- `grep -n -i -e 'two wrappers' -e 'two excluded' -e 'two main-checkout' docs/cli.md` prints nothing.
- Every claim added in §6 and in residuals 6–7 cites the file and symbol or row it rests on: `cli/templates/scripts/commit-on-branch.sh` (by its header paragraph names), `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_commit_paths_var` (the filter policy), `cli/src/generators/outerLoopScripts.ts` → `OUTER_LOOP_SCRIPTS`, and `docs/sandbox-verification.md` rows. Read each cited place once and check that the sentence matches it, not memory (`.claude/context/conventions.md` → `## Documents of record`).
- The statement of who reads `docs/cli.md` and `docs/watcher.md` is unchanged, and no heading either file's citers use was renamed. Check with `grep -rn 'docs/cli.md §6\|docs/cli.md → ' plugin docs cli/templates` before and after.
