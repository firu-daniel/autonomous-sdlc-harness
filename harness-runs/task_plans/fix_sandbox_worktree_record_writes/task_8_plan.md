### Task 8 — Move the four autonomous forks' commit points, the fix-plan core's wrapper statement and the user-review-fix command to the new spelling

**Goal:** Give every commit point in the four autonomous instruction forks the main checkout's literal commit-wrapper spelling: the plan, the ledger creation and every ledger flip, the review artifacts, the fix plan and the per-doc commits. Align the user-review-fix command's description of those calls, and the fix-plan core's statement of how a fork's added commit-wrapper call is spelled, so no autonomous run is left calling the worktree's sandboxed copy. Remove every description of a commit hook the wrapper no longer runs.

**Depends on:** Task 6. It made the canonical spelling, in `plugin/instructions/autonomous_pause_and_ledger.md` §1.6 and in `plugin/instructions/docs_orchestration_instructions_autonomous.md` → `## Commit mechanics (single source of truth)`:

```zsh
bash <MAIN_REPO>/<scripts_dir>/commit-on-branch.sh --repo <repo_root> <path>... -- "<subject>" ["<body line>"]
```

`<MAIN_REPO>`, `<repo_root>` and `<branch>` are each written as the literal text they resolve to, and there is no `$` anywhere in the command, `"$REPO_ROOT"` and `${branch}` included. The call is issued alone, never compounded. It also depends on Task 1: the wrapper's exits 0/1/2/3 and its stdout line are unchanged, and it runs no commit hook. This task restates the spelling in each fork's own blocks and cites the two canonical anchors for the reasoning.

**Three more things to know before editing:**

- **Each fork already resolves `<MAIN_REPO>` for its push.** Use that same value and that same declaring row or binding, and add none where one exists.
- **The exit-1 restatement is one phrase, used everywhere below:** "a refusal or a git failure, including a branch that moved under the wrapper". It replaces "non-git dir / detached HEAD / hook failure", and "(exit 1, hook failure)" becomes "(exit 1, a refusal or a git failure)". Each "If a hook fails, surface the error — do not bypass it with a hook-skip flag and do not create a partial commit; the wrapper returns a loud non-zero on a hook failure, which the fork surfaces." sentence becomes "A non-zero wrapper exit is surfaced, never retried or bypassed.".
- **Every fixed subject is quoted byte-for-byte** (`.claude/context/conventions.md` → `## Commit-message policy`). Only the spelling of `<branch>` changes, from `${branch}` to the literal branch name. The subject text itself does not.

### Targets

- `plugin/instructions/task_plan_writing_instructions_autonomous.md`
- `plugin/instructions/plan_orchestration_instructions_autonomous.md`
- `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md`
- `plugin/instructions/user_review_fix_plan_writing_instructions_core.md`
- `plugin/instructions/user_review_fixes_instructions_autonomous.md`
- `plugin/commands/branch-start-user-review-fix-autonomous.md`

**Work:**

- [ ] `task_plan_writing_instructions_autonomous.md`:
  - **Both "Commit mechanism" paragraphs and their code blocks** (the plan commit, and the six-target review commit) move to the canonical spelling. Their stated reason — *"a `git commit` carrying a `${branch}` expansion is what is refused … whereas the wrapper is auto-allowed by the … guard"* — is replaced by a citation of §1.6.
  - **The "Pass all six unconditionally" paragraph** cites the wrapper's STAGING POLICY header, which Task 1 kept by that title. Leave the citation as it is.
  - **The `<app_dir>` row of `## Resolved values`** says *"the commit wrapper's `<scripts_dir>` path below is repo-relative and runs from `$REPO_ROOT`, and the push wrapper is named under `<MAIN_REPO>`"*. Restate it: the commit wrapper and the push wrapper are both named under `<MAIN_REPO>`, the commit with `--repo <repo_root>`, because those copies are the ones the unattended permission profile runs outside the sandbox. Keep the row's statement that no step this file states consumes the app root, and that this fork declares no `<app_root>` binding of its own.
  - **The ledger creation and `## Planning` flip paragraphs** name `<scripts_dir>/commit-on-branch.sh`. Make them name `<MAIN_REPO>/<scripts_dir>/commit-on-branch.sh`.
  - **Both "If a hook fails, surface the error …" sentences**, in Override 3 and Override 4, take the restatement above.
- [ ] `plan_orchestration_instructions_autonomous.md`:
  - **"Exact staging + commit" and its block**, as above.
  - **The flip-point, docs-commit and summary entries 9 and 10**, which name `<scripts_dir>/commit-on-branch.sh` + `<scripts_dir>/push-branch.sh`. Name both under `<MAIN_REPO>`, which the push already is everywhere it is spelled out.
  - **Override D's Wrapper exit status (surface the error).** and **Override E's No exit-code gate note**: restate exit 1 as above.
- [ ] `user_review_fix_plan_writing_instructions_autonomous.md` and the core it forks, `user_review_fix_plan_writing_instructions_core.md`:
  - **The core's `<app_root>` row of `## Resolved values`**, and the core's paragraph that opens *"`<app_root>` is declared here, not consumed here."*. Both say *"a commit-wrapper call a fork adds names its (`<scripts_dir>`) script path repo-relative and runs from `<repo_root>`, and a fork naming a push may name the main checkout's copy of the push wrapper instead"*. Restate both: a commit-wrapper call a fork adds names the **main checkout's copy** of `<scripts_dir>/commit-on-branch.sh`, with `--repo <repo_root>`, as a push names the main checkout's copy of the push wrapper; `<app_root>` anchors neither call. Keep the core literal-free under `plugin/instructions/mode_contract.md` → `## (4) Cores are literal-free`: say "the main checkout's copy" in prose, introduce no `<MAIN_REPO>` token (the core declares no such binding) and no absolute path. Leave the rest of the row and the paragraph, including the rule (1) and rule (5) reasoning and the `mode_contract.md` → `## Binding vocabulary` citation, byte-identical.
  - **The `<app_root>` row** says the Override 3 and 4 `commit-on-branch.sh` calls "name their script paths repo-relative and run from `$REPO_ROOT`". Restate it: they name `<MAIN_REPO>`'s copy with `--repo <repo_root>`, as the push names `<MAIN_REPO>`'s copy. Keep the `<app_root>` sentence that it is not a working directory.
  - **The "Commit mechanism" paragraph, both code blocks, and the R-ledger creation and flip paragraphs**, as above.
  - **Override 3's "If a hook fails, surface the error …" sentence** takes the restatement above, and Override 5's "A hook failure is surfaced exactly as Override 3 surfaces one." becomes "A non-zero exit is surfaced exactly as Override 3 surfaces one.".
- [ ] `user_review_fixes_instructions_autonomous.md`:
  - **"Exact staging + commit", both code blocks, the `## Fixing` flip paragraph and the docs-commit bullet**, as above.
  - **The read-back.** Where the fork reads back the wrapper's stdout or maps its exit codes, keep the codes and stdout line as they are. Restate exit 1 as above in Override D's **Wrapper exit status (surface the error).** and in Override E's "(exit 1, hook failure)".
- [ ] `branch-start-user-review-fix-autonomous.md` → step 3's sentence *"whose Override 3 / Override 4 wrapper calls run from `$REPO_ROOT` and name `commit-on-branch.sh` repo-relative, while the push names the main checkout's copy"*. Say that both the commit and the push name the main checkout's copies, spelled exactly as that fork's `## Override 3 — commit the fix plan + source review after the gates converge` states them. Keep that cited heading byte-identical.

**Verification:**

- `grep -rn 'commit-on-branch.sh' plugin/instructions plugin/agents plugin/commands plugin/docs`. Every **invocation** across the whole plugin, including Tasks 6 and 7's files, is `bash <MAIN_REPO>/<scripts_dir>/commit-on-branch.sh --repo <repo_root> …`.
- `grep -rn -e 'commit-on-branch.sh --repo "\$REPO_ROOT"' -e 'bash <scripts_dir>/commit-on-branch.sh' plugin` prints nothing. That is the story index's second `Top risks:` entry, closed for the whole plugin.
- `grep -rn -i 'commit wrapper.*repo-relative\|commit-wrapper.*repo-relative' plugin/instructions plugin/agents plugin/commands plugin/docs` prints nothing. This catches a prose restatement of the old spelling that never names the file, such as the `<app_dir>` row and the core's `<app_root>` row and paragraph; Task 6 cleared `autonomous_pause_and_ledger.md` §1.6's.
- `grep -n 'MAIN_REPO\|/Users/\|/home/' plugin/instructions/user_review_fix_plan_writing_instructions_core.md` prints nothing: the core stays literal-free.
- `grep -rn -e '-- "chore: [^"]*\${branch}' plugin/instructions` prints nothing.
- Each fixed subject the five files quote still matches `.claude/context/conventions.md` → `## Commit-message policy`'s list with `<branch>` substituted.
- `grep -rn -i 'hook fail\|failing hook\|skip hooks' plugin/instructions plugin/agents/committer.md` prints nothing. Task 7 cleared `committer.md` and `improvement_observations_instructions.md`, so this closes the stale hook wording for every commit point.
- `claude plugin validate --strict plugin` passes.

- **Deviations from plan:**
  - Every rewritten commit-wrapper code block is one line, as the canonical blocks in `autonomous_pause_and_ledger.md` §1.6 and `docs_orchestration_instructions_autonomous.md` → `## Commit mechanics (single source of truth)` are; the old blocks were backslash-continued.
  - `user_review_fix_plan_writing_instructions_autonomous.md`: the paths carried `${round_suffix}`, a `$` the canonical spelling forbids. Respelled as the path placeholder `<round_suffix>` (empty for round 1, `_<n>` for round N, written literally), bound in Override 3's **Active-round suffix** paragraph and listed in the opening vocabulary paragraph's "none of the three" set. The `<app_root>` row also names Override 5's lessons commit, which is a third `commit-on-branch.sh` call the fork adds.
  - The Override D "Do not bypass a hook with a hook-skip flag and do not create a partial commit." sentences in `plan_orchestration_instructions_autonomous.md` and `user_review_fixes_instructions_autonomous.md` were deleted rather than restated: the **Wrapper exit status (surface the error).** paragraph that follows each already says a non-zero exit is surfaced, never retried or bypassed. The "using the `$REPO_ROOT` resolved once at session start …" lead-ins after those blocks were deleted with them, since the command no longer carries `$REPO_ROOT`.
  - `plan_orchestration_instructions_autonomous.md` summary entry 9 named only the commit; it now names the push under `<MAIN_REPO>` too.
  - `user_review_fixes_instructions_autonomous.md` Override L gave the reason for an issued command carrying no `<…>` as "a `<` withdraws the script-allowlist guard's permit"; the main checkout's copy has no guard permit to withdraw, so the reason is now "no argument may carry a `<`", citing the same Override D paragraph.
  - Verification grep 2 (`grep -rn -e 'commit-on-branch.sh --repo "\$REPO_ROOT"' -e 'bash <scripts_dir>/commit-on-branch.sh' plugin`) still prints one line: `plugin/hooks/autonomous-script-allowlist-guard.sh`'s REPRO block, a `STILL ALLOW` row annotated "the corpus's own commit invocation". It is a guard test row, not an instruction, and lies outside this task's targets; editing a guard owes a re-measure in `docs/guard-verification.md`. Not changed.
  - Not changed, outside the named targets: the `<repo_root>` row of `## Resolved values` in `task_plan_writing_instructions_autonomous.md` and `user_review_fix_plan_writing_instructions_autonomous.md` still says the root is "written `$REPO_ROOT` in the invocations below", although no invocation there now carries it.
  - `<test_cmd>` not run: deferred to the Run gates phase.
