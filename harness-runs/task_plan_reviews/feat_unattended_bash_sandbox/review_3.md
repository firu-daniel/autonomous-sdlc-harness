# Task plan review — iteration 3

This revision closes all four of iteration 2's Must Fix findings:

- `autoAllowBashIfSandboxed` is now set to `false` in Task 2, and the story index's Unresolved bullet is restated.
- The hooks pin accepts only `<main>/<githooksDir>` or `<main>/.git/hooks`. Task 3 items 3 and 7 protect both directories and the main checkout's `harness.config.json`, and Task 4 adds cases (f) and (g).
- Rows 185–188 and 191–192 and entries H (widened), J and K are added.
- `cli/src/commands/doctor.ts` is now one of Task 7's targets.

These checks still pass:

- **Index shape:** Context ends with `Top risks:` and `Manual setup required:`. Readiness comes immediately after Context, and the Scope register after Readiness. There is no `## Tasks` section and no index-level Sources or Targets.
- **Correspondence:** 27 readiness entries map to 27 files, and every heading matches its filename.
- **Tags and budget:** every task is single-layer, every points value is 20 or less, and every task has 5 `**Work:**` bullets or fewer.
- **Order:** tasks run bottom-up in the order `cli` → `plugin` → `general`, and every `**Depends on:**` link points to an earlier task.
- **Code citations:** every code symbol the tasks cite resolves in the tree, including `homeRoot`, `worktreeGlob`, `outerLoopScriptPath`, `resolveGithooksDir`, `bashScriptRule`, `assertUsableInEntry`, `shippedDenyFloor`, `buildCheckContext` and `REMOTE_JOB_FLAG`.
- **Derivation entries:** re-running entries A, B, C, J and K gives no hit outside the register's rows. Every file reached by entries G and H, both commands and the first step, is named by a row, with the one exception in Must Fix 1.

The three findings below all come from executing the register's derivation entries. They are listed in the order of the three dispositions.

## Must Fix

1. **Scope register: entry H reaches a site that is not a row (disposition (i))** — story index (`feat_unattended_bash_sandbox_story_plan.md`), `## Scope register`.
   Entry H's runnable first step, re-run verbatim, prints `scripts/refresh-branch.sh:9`: *"# cannot answer. Both fire on the SAFE direction too, …"*. That file is this checkout's `init` output of row 72's template. No row names it:
   - row 123 lists ten files under `scripts/`, but not `scripts/refresh-branch.sh`;
   - rows 194–199, which entry H's text says cover *"every hit in a file no earlier row names"*, do not name it either.

   **Fix:** add `scripts/refresh-branch.sh` to row 123's `Site` cell, and add *"72"* to its `Copy` cell, giving *"this checkout's `init` output of rows 66–77, 134, 138–142"* with row 72 included. Disposition `no-change`, for the reason row 123 already gives. No task changes.

2. **Scope register: no derivation entry reaches a sentence Task 9 makes false (disposition (ii))** — story index `## Scope register`, owned by `task_9_plan.md`.
   - **The site.** `plugin/instructions/dispatch_discipline_instructions.md` → `## Push`, the sentence right after the push code block: *"The script-path token obeys the same guard-safe spelling rule `## Commit mechanics` states above — unquoted and repo-relative — and the call is **unconditional**"*. Task 9 rewrites the token in that code block to `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh "$REPO_ROOT"`, which is an absolute path. After that, *"repo-relative"* is false of it. The sentence is not a register row, and it is not in Task 9's `**Work:**`.
   - **Why entry B misses it.** Entry B searches for three phrases only (`repo-relative and take no app-root`, `wrapper paths below are repo-relative`, `repo-relative and run from`). This sentence uses none of them.
   - **Corrected derivation entry**, strictly wider than entry B (every entry B phrase contains `repo-relative`). This is a command entry:

     ```
     git grep -n -i -F 'repo-relative' -- plugin
     ```

     Decision rule: a sentence is `change` when it says the **push** wrapper's script path is repo-relative or runs from the run's own root, in a file where Tasks 8–10 move the push under `<MAIN_REPO>`. It is `no-change` when it is about:
     - a `commands.*` string;
     - the commit wrapper;
     - a staged or recorded path;
     - the `<scripts_dir>` definition itself.

     Group the `no-change` hits into class rows, as row 193 does. Run this way, the only new `change` site it reaches beyond the existing rows is the `dispatch_discipline_instructions.md` sentence above. Its `## Commit mechanics` *"Write the script-path token exactly as shown — unquoted and repo-relative"* is about the commit wrapper and stays.

   **Fix:**
   - replace entry B with the command above, or add it beside entry B;
   - add a `change` row for the `dispatch_discipline_instructions.md` → `## Push` sentence, owned by Task 9;
   - in `task_9_plan.md`, add a `**Work:**` clause to the `dispatch_discipline_instructions.md` bullet: the push token stays unquoted, and is now named under `<MAIN_REPO>` rather than repo-relative, because that is the copy the profile runs outside the sandbox. Keep *"and the call is **unconditional**"* and everything after it byte-identical;
   - add a `**Verification:**` bullet: `git grep -n -F 'unquoted and repo-relative — and the call' -- plugin/instructions/dispatch_discipline_instructions.md` prints nothing.

3. **Scope register rows 31 and 32 keep a sentence the branch makes false (disposition (iii))** — story index `## Scope register`, rows 31 and 32; ownership in `task_8_plan.md`.
   - Row 31: `plugin/instructions/user_review_fix_plan_writing_instructions_core.md` → `## Resolved values`, the `<app_root>` row. It says *"It does **not** anchor the wrapper calls a fork *adds* (mechanism rule (3)): `<scripts_dir>` is repo-relative, so those calls name their script paths repo-relative and run from `<repo_root>`"*.
   - Row 32: the paragraph **`<app_root>` is declared here, not consumed here.** in the same file. It says *"those name their `<scripts_dir>` script paths repo-relative and run from `<repo_root>`"*.
   - Both rows are `no-change`, with the reason *"This core invokes no wrapper."* That reason does not address what the sentences claim: they describe the calls a **fork** adds. Task 8 moves one of exactly those calls, the autonomous fix-plan fork's Override 3 push, to `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh "$REPO_ROOT"`. That call is not repo-relative.
   - The register is inconsistent here: row 26 marks the **fork's** own statement of the same claim `change` (Task 8). The core's identical claim then remains false. No recorded rejection covers these rows: the index has no `## Rejected findings` section.

   **Fix:**
   - set rows 31 and 32 to `change`, owned by Task 8, and add the file to `task_8_plan.md`'s `### Targets`;
   - add a `**Work:**` clause that narrows both sentences to the commit-wrapper calls a fork adds. It should say, mode-free, that a fork naming a push may name the main checkout's copy, and that this binding still does not anchor either call;
   - keep the core literal-free under `.claude/context/plugin.md` → `## Cores, forks and the single-owner rule` rule (4). It must name no `<MAIN_REPO>` path step and no slash-command name;
   - add a verification grep showing that the two phrases no longer claim the push call is repo-relative.

## Should Fix

1. **Two different rewrites of one sentence across Tasks 20 and 21.**
   - The `Bash(git push:*)` `ask` sentence *"which an unattended run cannot answer"* has **six** copies:
     - the three `branch-start-*-autonomous.md` commands;
     - `docs_orchestration_instructions_autonomous.md`;
     - `user_review_fixes_instructions_autonomous.md`;
     - `plan_orchestration_instructions_autonomous.md` (line hint 99).
   - `task_21_plan.md` gives five of them *"which an unattended run's permission mode refuses"* and says *"the five statements of one fact stay alike"*. `task_20_plan.md` rewrites the sixth as *"which an unattended run's mode refuses"*.
   - Use one wording in all six. Widen Task 21's identity check to the six files, or make Task 20 use Task 21's words and name the sixth file in its verification.
2. **`task_26_plan.md`: the render route.**
   - The plan still cites *"the scratch-run route the conventions document names"*, and no conventions document names it. `grep -n -i 'scratch-run\|probe route' .claude/context/*.md` prints nothing. Name the actual route (`plugin/agents/layer-implementer.md` → **The probe route, in every mode.**).
   - The first step, *"Build the CLI with `commands.build` as written"*, is a raw command line that the profile deliberately does not allow-list. The fallback, *"If that route is refused, fall back to applying the template diffs by hand"*, covers only the `init` route. Extend it to a refused build.
3. **`task_8_plan.md` Verification, the entry-J bullet.** After the edit, the five files carry new `<MAIN_REPO>` hits: the rewritten push lines and the new `## Resolved values` row. Those are not rows 188 or 193, so *"its hits in these five files are ⊆ the register's rows 188 and 193"* cannot pass. Name the push rows this task changes (12, 13, 17, 19, 22, 23, 26 and 27) as permitted hits as well.
4. **`task_7_plan.md` calls Task 1's `sandboxOptedOut(config)` without depending on it.** Task 1 is not listed under `**Depends on:**`, and the signature is not restated. Add Task 1 and the signature `sandboxOptedOut(config: HarnessConfig): boolean`, as `task_6_plan.md` does.
5. Still open from iteration 2's Should Fix 1: register rows 50–123 give `Site` as line coordinates only. Add a quoted anchor or a symbol to each.

## Nice to Have

1. `task_23_plan.md` lists *"Not a dependency, a forward citation: Task 25"* inside its `**Depends on:**` list. `task_6_plan.md` puts the same note under its own bold lead. Doing the same in Task 23 would keep the `**Depends on:**` list to real dependencies only.
