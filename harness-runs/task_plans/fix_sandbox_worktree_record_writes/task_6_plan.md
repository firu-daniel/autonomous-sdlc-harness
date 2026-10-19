### Task 6 — Move the canonical commit mechanics to the main checkout's literal spelling: `autonomous_pause_and_ledger.md` §1.6, the docs engine's single source, dispatch discipline and `AUTONOMOUS_FLOW.md`

**Goal:** Rewrite the plugin's two canonical statements of how an autonomous commit point commits, and the two files that restate them most closely, so that every commit names the main checkout's copy of the wrapper. That copy is the one the profile runs outside the sandbox. It is spelled the way the push already is, so it can be the call's only grant.

**Depends on:** Task 1, which made the main checkout's `commit-on-branch.sh` judge any target it is handed, and Task 4, which makes the profile exclude exactly `bash <MAIN_REPO>/<scripts_dir>/commit-on-branch.sh:*`. **The spelling this task makes canonical**, and which Tasks 7 and 8 restate:

```zsh
bash <MAIN_REPO>/<scripts_dir>/commit-on-branch.sh --repo <repo_root> <path>... -- "<subject>" ["<body line>"]
```

- `<MAIN_REPO>`, `<repo_root>` and `<branch>` (inside a path or a subject) are each written as the literal text they resolve to. There is **no `$` anywhere in the command**, so neither `"$REPO_ROOT"` nor `${branch}`. From a worktree, the script-allowlist guard does not vouch for the main checkout's copy, so the profile's literal `allow` entry is this call's only grant, and a command carrying a shell expansion does not match it. That is the reasoning §1.6 already gives for the push.
- The call is its own Bash command. A compound runs sandboxed, where the commit cannot write a linked worktree's record.
- The wrapper's contract is unchanged: exits 0 / 1 / 2 / 3 and the stdout line `commit-on-branch.sh: committed <short_sha> on <branch>`. What is new: it runs no commit hook, and a branch moved under it is an exit 1 that leaves the given paths staged.

### Targets

- `plugin/instructions/docs_orchestration_instructions_autonomous.md`
- `plugin/instructions/autonomous_pause_and_ledger.md`
- `plugin/instructions/dispatch_discipline_instructions.md`
- `plugin/docs/AUTONOMOUS_FLOW.md`

**Work:**

- [ ] `docs_orchestration_instructions_autonomous.md` → `## Commit mechanics (single source of truth)`. Keep the heading byte-identical: `docs_phase_instructions.md` cites it.
  - Replace the two guard rules ("(1) write the script-path token UNQUOTED and repo-relative", "(2) The args after the script path may … carry a plain `$VAR` or `${VAR}`") and the `cd` warning with the canonical spelling and its reasons above.
  - Rewrite the code block to that spelling, keeping this file's paths and subject.
  - Merge the paragraph that explains why the push names `<MAIN_REPO>` with the commit's reason, so the "main checkout's copy, literal, alone" rule is stated once for both calls.
  - Extend the closing contract paragraph with "no commit hook runs".
  - If `<MAIN_REPO>` is used here without a declaring row, add one in the form the file's sibling forks use.
- [ ] `autonomous_pause_and_ledger.md`:
  - In the `<scripts_dir>` row, say that `commit-on-branch.sh` and `push-branch.sh` are both invoked under `<MAIN_REPO>`.
  - In §1.6's opening paragraph, name `<MAIN_REPO>`'s copy for the commit as well as the push. Drop "the commit using the `$REPO_ROOT` the fork resolved at session start (the commit wrapper's path is repo-relative …)". Extend "Spell both paths literally" to the commit's `--repo <repo_root>` and to `<branch>` in the subject.
  - Update the trap paragraph's example piece `bash <scripts_dir>/commit-on-branch.sh …` to the new spelling. Its closing parenthesis currently says "`$?` and `${branch}` are fine": make it say that the commit and the push carry no `$` at all.
  - In the reuse paragraph ("no shell-expansion refusal on `${branch}`"), drop that claim, and add that the wrapper commits by plumbing and runs no commit hook.
  - Keep the `### 1.6` heading byte-identical: it is cited by section number across `plugin/`.
- [ ] `dispatch_discipline_instructions.md`:
  - In the `<scripts_dir>` row, say the commit wrapper is named under `<MAIN_REPO>`.
  - In `## Commit mechanics`, give the opening sentence and the code block the canonical spelling: the record path with `<branch>` literal, and the subject `chore: Log dispatch additions for <branch>` with `<branch>` literal.
  - Replace the paragraph beginning "**Write the script-path token exactly as shown — unquoted and repo-relative**" with a one-line citation of `${CLAUDE_PLUGIN_ROOT}/instructions/docs_orchestration_instructions_autonomous.md` → `## Commit mechanics (single source of truth)`. That one sentence stands in for the rule this file used to restate (`.claude/context/plugin.md` → *"Each rule is stated once"*).
  - Check the `## Push` paragraph's "unquoted, as `## Commit mechanics` above requires" sentence still reads true afterwards.
- [ ] `AUTONOMOUS_FLOW.md` → the "Git wrappers" row: add that an agent calls `commit-on-branch.sh` and `push-branch.sh` as the main checkout's copies (`<MAIN_REPO>/<scripts_dir>/…`), the profile's excluded spellings, and cite §1.6. Leave the row's other content as it is.
  - **Deviations from plan:** (1) The docs engine's commit block is written on one line rather than with `\` continuations, so the call is one literal single-statement command. (2) The canonical section keeps one sentence barring `$(…)`, a backtick, `|`, `>` and `<` from any argument, citing `<scripts_dir>/commit-on-branch.sh` → `MESSAGE ARGUMENTS`, which still binds the caller; the old guard-scan wording around it is gone. (3) The contract paragraph also states that a branch moved under the commit is an exit 1 leaving the paths staged (the Depends-on block's new contract). (4) Consequential edits in the same four files so they stay true: the docs engine's `<repo_root>` row (now `$REPO_ROOT` only in dispatch paths), Setup step 1 (`<MAIN_REPO>` serves the commit wrapper too) and the Done summary's "unquoted repo-relative wrapper token" parenthesis; dispatch discipline's `<repo_root>` row ("commit and push commands") and the `## Push` "unquoted" sentence, rewritten to "spelled as `## Commit mechanics` above requires"; `AUTONOMOUS_FLOW.md`'s `<MAIN_REPO>` row, which said the token was used once. (5) Stale citers of §1.6's old repo-relative spelling remain in `task_plan_writing_instructions_autonomous.md`, `plan_orchestration_instructions_autonomous.md`, `user_review_fix_plan_writing_instructions_autonomous.md` and `user_review_fixes_instructions_autonomous.md`, all Task 8 targets; `docs_phase_instructions.md`'s citing sentence still reads true.

**Verification:**

- `grep -n 'commit-on-branch.sh' plugin/instructions/docs_orchestration_instructions_autonomous.md plugin/instructions/autonomous_pause_and_ledger.md plugin/instructions/dispatch_discipline_instructions.md plugin/docs/AUTONOMOUS_FLOW.md`. Every invocation it shows is `bash <MAIN_REPO>/<scripts_dir>/commit-on-branch.sh --repo <repo_root> …`, and no hit is followed by `"$REPO_ROOT"`, `$REPO_ROOT` or `${branch}`. That is the story index's second `Top risks:` entry for these four files.
- Re-derive the citers of the two canonical anchors, `grep -rn 'Commit mechanics (single source of truth)\|§1.6' plugin`. Each citer's sentence still matches what the anchor now says. Where a citer restates the old repo-relative rule, it is one of Tasks 7 and 8's files, and is listed in its own plan.
- `claude plugin validate --strict plugin` passes (`.claude/context/plugin.md` → `## Verifying a change in this layer`).
