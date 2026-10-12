### Task 8 — Move the autonomous forks' pushes to the main checkout's wrapper

**Goal:** Make every push an autonomous fork tells an agent to run use the one spelling the generated profile runs **outside** the sandbox:

```
bash <MAIN_REPO>/<scripts_dir>/push-branch.sh "$REPO_ROOT"
```

Today's `bash <scripts_dir>/push-branch.sh "$REPO_ROOT"` resolves to the worktree's own copy. That copy stays sandboxed, and on macOS an SSH push fails inside the sandbox. `push-branch.sh` exits 0 on a failed push, so the run would carry on with nothing pushed and nothing reported.

**Depends on:** Task 2, which makes the main checkout's copy the named `sandbox.excludedCommands` entry:

```
Bash(bash <repoRoot>/<scriptsDir>/push-branch.sh:*)
```

Here `<repoRoot>` is the checkout `init` ran in, which is the main checkout. The repo-relative and sibling-worktree spellings stay allow-listed and stay sandboxed. `push-branch.sh` already pushes the checkout named by its argument, so `"$REPO_ROOT"` (the worktree) stays the argument. Only the script's path moves.

**Where this task stops.** This task covers the five autonomous instruction forks, plus the two sentences of the fix-plan core those forks' claim restates (rows 31, 32), only. The shared modules (`dispatch_discipline_instructions.md`, `improvement_observations_instructions.md`, `clarification_digest_instructions.md`, `autonomous_pause_and_ledger.md` §1.6) are **Task 9's**. The committer and the review-fix command are **Task 10's**. A prose mention that only names the mechanism is left alone: the scope register in the story index rows each one with its reason. The spelling an agent runs lives in the code blocks this task changes.

### Targets

- `plugin/instructions/task_plan_writing_instructions_autonomous.md` — scope register rows 17, 19, 22.
- `plugin/instructions/plan_orchestration_instructions_autonomous.md` — row 13.
- `plugin/instructions/user_review_fixes_instructions_autonomous.md` — row 27.
- `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` — rows 23, 26.
- `plugin/instructions/docs_orchestration_instructions_autonomous.md` — rows 12 and 188.
- `plugin/instructions/user_review_fix_plan_writing_instructions_core.md` — rows 31 and 32. It is the core the fix-plan fork above binds, and its two sentences make the same claim as row 26.

**Work:**

- [ ] `task_plan_writing_instructions_autonomous.md`:
  - In `## Override 3 — commit the UI-test plan after it converges` and `## Override 4 — commit the task plan after it converges`, rewrite each code-block line `bash <scripts_dir>/push-branch.sh "$REPO_ROOT"` to `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh "$REPO_ROOT"`.
  - In `## Resolved values`:
    - add a `<MAIN_REPO>` row, class `derived at runtime`: *the main checkout — the first `worktree ` line of a bare `git worktree list --porcelain`. Spell it as a literal absolute path in the command, never through a substitution or a variable.*
    - fix the `<app_dir>` row's *"the `<scripts_dir>` wrapper paths below are repo-relative and run from `$REPO_ROOT`"*: the commit wrapper's still are, and the push wrapper is named under `<MAIN_REPO>`, because that is the copy the unattended profile runs outside the sandbox.
- [ ] `plan_orchestration_instructions_autonomous.md` → `### Override E — push after the Override D direct-`git` commit …`: the same rewrite. This file already resolves `<MAIN_REPO>` (for `AUTONOMOUS_STOP`), so reuse that resolution and add no second one.
- [ ] `user_review_fixes_instructions_autonomous.md` → `### Override E — …`: the same rewrite. Reuse the file's existing `<MAIN_REPO>` resolution.
- [ ] `user_review_fix_plan_writing_instructions_autonomous.md`:
  - rewrite the push line in `## Override 3 — commit the fix plan + source review after the gates converge`;
  - fix the `<app_root>` row's claim that *"the `commit-on-branch.sh` / `push-branch.sh` calls this fork **adds** … name their script paths repo-relative and run from `$REPO_ROOT`"*: the push call is now named under `<MAIN_REPO>`, and the reason follows;
  - reuse the file's existing `<MAIN_REPO>` resolution;
  - in the core it binds, `user_review_fix_plan_writing_instructions_core.md`, narrow the same claim in two places (register rows 31, 32): the `## Resolved values` `<app_root>` row's *"It does **not** anchor the wrapper calls a fork *adds* (mechanism rule (3)): `<scripts_dir>` is repo-relative, so those calls name their script paths repo-relative and run from `<repo_root>`"*, and the **`<app_root>` is declared here, not consumed here.** paragraph's *"those name their `<scripts_dir>` script paths repo-relative and run from `<repo_root>`"*. Each now says, mode-free, that a **commit**-wrapper call a fork adds names its script path repo-relative and runs from `<repo_root>`; that a fork naming a **push** may name the main checkout's copy of the push wrapper instead; and that `<app_root>` anchors neither call. Keep the core literal-free under `.claude/context/plugin.md` → `## Cores, forks and the single-owner rule` rule (4): no `<MAIN_REPO>` token or path step, no slash-command name, no mode word. Every other sentence of both passages, including the `mode_contract.md` citation and the rule (5) parenthesis, stays byte-identical.
- [ ] `docs_orchestration_instructions_autonomous.md` → `## Commit mechanics (single source of truth)`: the same rewrite, reusing the file's `<MAIN_REPO>`. Add one sentence to that section stating why the push names the main checkout's copy. It is the section `docs_phase_instructions.md` points at, so it is the single place the docs flows read that reason. In the same file, `## Setup (once, at session start)` step **1. Paths (Override-A equivalent).** says *"`<MAIN_REPO>` (for the global kill switch only) is the first entry of `git worktree list`"*; the push now also runs under it, so drop *"only"* and name both uses: *"(for the global kill switch and the push wrapper)"* (register row 188).

  In all five files, the `$REPO_ROOT` argument and every surrounding *"No exit-code gate"* / *"no `if …; then … fi`"* rule stay byte-identical.

**Verification:**

- Re-run scope-register derivation entry A:

  ```
  git grep -n -F '<scripts_dir>/push-branch.sh' -- plugin
  ```

  Its hits in these five files must be ⊆ the register's rows for them. Each row this task owns must now read `<MAIN_REPO>/<scripts_dir>/push-branch.sh`.
- Run:

  ```
  git grep -n -E 'bash <scripts_dir>/push-branch\.sh' -- plugin/instructions/task_plan_writing_instructions_autonomous.md plugin/instructions/plan_orchestration_instructions_autonomous.md plugin/instructions/user_review_fixes_instructions_autonomous.md plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md plugin/instructions/docs_orchestration_instructions_autonomous.md
  ```

  It must print nothing.
- `grep -n 'for the global kill switch only' plugin/instructions/docs_orchestration_instructions_autonomous.md` prints nothing. Re-run derivation entry J (`git grep -n -F '<MAIN_REPO>' -- plugin`): its hits in these five files are ⊆ the register's rows 188 and 193.
- Re-run derivation entry B and check that its hits in these files are ⊆ the register rows: rows 22, 26, 31 and 32 are rewritten, and the remaining rows are unchanged.
- Run:

  ```
  git grep -n -E 'so those calls name their script paths repo-relative|those name their `<scripts_dir>` script paths repo-relative' -- plugin/instructions/user_review_fix_plan_writing_instructions_core.md
  ```

  It must print nothing: neither passage still says every call a fork adds, the push included, is repo-relative. Then `git grep -n -E '<MAIN_REPO>|/autonomous-sdlc-harness:' -- plugin/instructions/user_review_fix_plan_writing_instructions_core.md` must print nothing, so the core stays literal-free.
- Each new or reused `<MAIN_REPO>` is resolved in its own file's text, with no fork→fork citation (`.claude/context/plugin.md` → `## Cores, forks and the single-owner rule`).
