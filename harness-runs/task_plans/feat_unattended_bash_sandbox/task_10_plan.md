### Task 10 — Move the committer's push and the review-fix command's wrapper statement to the main checkout's wrapper

**Goal:** The `committer` agent is how the committer-funnelled commit points in the autonomous task and review-fix flows push (`push: true`). Make its two push steps run the spelling the unattended profile excludes from the sandbox. Also correct the review-fix command's statement that its forks' wrapper calls are all repo-relative. The spelling is:

```
bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>
```

**Depends on:**

- Task 2, which makes `Bash(bash <repoRoot>/<scriptsDir>/push-branch.sh:*)` the named `sandbox.excludedCommands` entry, where `<repoRoot>` is the main checkout `init` ran in.
- Task 8, which moves `user_review_fix_plan_writing_instructions_autonomous.md`'s Override 3 push to `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh "$REPO_ROOT"`. The command sentence this task fixes describes that fork.

**Where this task stops.** The `push` bullet in `## Invocation contract` names the mechanism only and stays as it is (scope register row 1). The three `## Hard boundary` statements in the `branch-start-*-autonomous.md` commands stay too (rows 4–6). The instruction files are **Tasks 8–9's**.

### Targets

- `plugin/agents/committer.md` — scope register rows 2, 3.
- `plugin/commands/branch-start-user-review-fix-autonomous.md` — row 7.

**Work:**

- [ ] `committer.md` → `### Standard procedure (…)`, the push sub-step: keep resolving `<repo_root>` with a bare `git rev-parse --show-toplevel`. Then resolve `<MAIN_REPO>` from the first `worktree ` line of a bare `git worktree list --porcelain`, and run `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>`. Both paths are spelled literally. Add one clause of reason: the main checkout's copy is the one the unattended profile runs outside the sandbox, where an SSH push works. Make the same change in `### ui_test_pass procedure` step h.
- [ ] `committer.md` → `## Resolved values`:
  - add the `<MAIN_REPO>` row, class `derived at runtime`, resolved as above;
  - amend the `<scripts_dir>` row's sentence on the two scripts this file names: `push-branch.sh` is invoked under `<MAIN_REPO>`.

  The return fields `pushed: yes|no|failed` and every other wire string stay byte-stable (`.claude/context/plugin.md` → `## Wires: dispatch in, return out`). Run `grep -rn 'pushed: ' plugin` before and after, and the result set must be unchanged.
- [ ] `branch-start-user-review-fix-autonomous.md`: rewrite the sentence *"the fix-plan fork's (whose Override 3 / Override 4 wrapper calls name their `<scripts_dir>` scripts repo-relative and run from `$REPO_ROOT`)"*. The commit wrapper is still repo-relative. The push names the main checkout's copy under `<MAIN_REPO>`, which this command already resolves in its own step 2.

**Verification:**

- `git grep -n -E 'bash <scripts_dir>/push-branch\.sh' -- plugin/agents/committer.md` prints nothing.
- Re-run scope-register derivation entry A:

  ```
  git grep -n -F '<scripts_dir>/push-branch.sh' -- plugin
  ```

  Its hits in the two target files must be ⊆ the register's rows 1–7. Rows 2, 3 and 7 now read the `<MAIN_REPO>` form.
- `committer.md`'s frontmatter is unchanged: `name`, `description`, `tools` and `model` only. Its `tools:` allowlist already grants `Bash`.
