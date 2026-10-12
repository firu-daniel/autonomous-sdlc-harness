### Task 9 — Move the shared push and ledger-flip modules to the main checkout's wrapper

**Goal:** Make the four shared instruction modules use the one push spelling the unattended profile runs outside the sandbox: the three modules whose `## Push` section spells a push, plus `autonomous_pause_and_ledger.md` §1.6, which every ledger flip in every autonomous flow follows. The spelling is:

```
bash <MAIN_REPO>/<scripts_dir>/push-branch.sh "$REPO_ROOT"
```

**Depends on:** Task 2, which makes the main checkout's copy the named `sandbox.excludedCommands` entry:

```
Bash(bash <repoRoot>/<scriptsDir>/push-branch.sh:*)
```

Here `<repoRoot>` is the checkout `init` ran in. The repo-relative spelling stays allow-listed but runs **sandboxed**, where an SSH push fails on macOS and `push-branch.sh` still exits 0. `push-branch.sh` pushes the checkout its argument names, so `"$REPO_ROOT"` stays the argument.

**Where this task stops.** This task covers these four modules only. The five autonomous forks are **Task 8's**, and the committer and the review-fix command are **Task 10's**. The fork-level pointers that say *"each a direct `<scripts_dir>/commit-on-branch.sh` + `<scripts_dir>/push-branch.sh` flip … (canonical-doc §1.6)"* stay as they are (scope register rows 14, 21, 25, 28): they point at §1.6, which this task fixes.

### Targets

- `plugin/instructions/dispatch_discipline_instructions.md` — scope register rows 10 and 200.
- `plugin/instructions/improvement_observations_instructions.md` — row 11.
- `plugin/instructions/clarification_digest_instructions.md` — row 9.
- `plugin/instructions/autonomous_pause_and_ledger.md` — row 8.

**Work:**

- [ ] `dispatch_discipline_instructions.md` → `## Push`: rewrite `bash <scripts_dir>/push-branch.sh "$REPO_ROOT"` to the main-checkout spelling. In `## Resolved values`:
  - add a `<MAIN_REPO>` row, class `derived at runtime`: *the main checkout — the first `worktree ` line of a bare `git worktree list --porcelain`. Spelled as a literal absolute path in the command, never through a substitution or a variable.*
  - amend the `<scripts_dir>` row's sentence about the two scripts this file names: the push script is invoked under `<MAIN_REPO>`, and the reason is the sandbox exclusion.
  - In `## Push`, the sentence right after the code block, *"The script-path token obeys the same guard-safe spelling rule `## Commit mechanics` states above — unquoted and repo-relative — and the call is **unconditional**"*, becomes false once the token is absolute (register row 200). Rewrite only its opening clause: the push token stays **unquoted**, as `## Commit mechanics` requires, and is now named under `<MAIN_REPO>` rather than repo-relative, because the main checkout's copy is the one the unattended profile runs outside the sandbox. Keep *"and the call is **unconditional**"* and everything after it byte-identical.
- [ ] `improvement_observations_instructions.md` → `## Push`: the same rewrite, `<MAIN_REPO>` row and `<scripts_dir>` amendment.
- [ ] `clarification_digest_instructions.md` → `## Push`: the same rewrite, `<MAIN_REPO>` row and `<scripts_dir>` amendment.
- [ ] `autonomous_pause_and_ledger.md` → `### 1.6 How to flip / create — direct `commit-on-branch.sh`, NEVER a committer dispatch`:
  - rewrite *"`<scripts_dir>/commit-on-branch.sh`, then `<scripts_dir>/push-branch.sh`, using the `$REPO_ROOT` the fork resolved at session start (both wrapper paths are repo-relative and take no app-root prefix)"* so that the commit wrapper stays repo-relative, the push is `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh "$REPO_ROOT"`, and the parenthesis says why: the main checkout's copy is the one the unattended profile runs outside the sandbox;
  - add or reuse a `<MAIN_REPO>` row in this file's `## Resolved values`, resolved the same way;
  - keep the ⚠️ *"two separate, literal single-statement Bash commands"* paragraph that follows byte-identical.

  The `"$REPO_ROOT"` argument and every *"No exit-code gate"* rule in these files stay byte-identical. These modules are shared across modes. The main-checkout spelling is correct in a supervised session too, where `<MAIN_REPO>` is the session's own checkout, so no mode fork is needed.

**Verification:**

- Run:

  ```
  git grep -n -E 'bash <scripts_dir>/push-branch\.sh' -- plugin/instructions/dispatch_discipline_instructions.md plugin/instructions/improvement_observations_instructions.md plugin/instructions/clarification_digest_instructions.md plugin/instructions/autonomous_pause_and_ledger.md
  ```

  It must print nothing.
- Re-run scope-register derivation entry B:

  ```
  git grep -n -E 'repo-relative and take no app-root|wrapper paths below are repo-relative|repo-relative and run from' -- plugin
  ```

  It must no longer hit `autonomous_pause_and_ledger.md`, and its remaining hits must be ⊆ the register's rows.
- Run:

  ```
  git grep -n -F 'unquoted and repo-relative — and the call' -- plugin/instructions/dispatch_discipline_instructions.md
  ```

  It must print nothing, and `git grep -n -F 'and the call is **unconditional**' -- plugin/instructions/dispatch_discipline_instructions.md` must still print the `## Push` sentence.
- Re-run scope-register derivation entry L (`git grep -n -i -F 'repo-relative' -- plugin`): its hits in these four files are ⊆ the register's rows, and none of them says the push token is repo-relative.
- Each `<MAIN_REPO>` this task uses is declared in its own file's `## Resolved values`, in the table's three-column form (`.claude/context/plugin.md` → `## The placeholder vocabulary`).
