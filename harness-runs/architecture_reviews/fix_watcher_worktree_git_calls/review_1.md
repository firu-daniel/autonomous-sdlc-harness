# Architecture review — iteration 1

Iteration 0's Must Fix (Task 1's library file header) is resolved: `task_1_plan.md` → `**Work:**` now carries the six-part header amendment and a matching `**Verification:**` bullet.

## Must Fix

1. **Task 4 parses `harness.config.json` inside `cli/src/doctor/checks.ts`, outside the module that owns reading that file** — `task_4_plan.md`. Rule sources: `cli/src/config/io.ts`'s module header (*"Loading and saving `harness.config.json` — the only place the CLI reads or writes that file."*), held to by `.claude/context/cli.md` → `## What "done" means here` → **A reviewer holds a change to its module's own header.**, and `.claude/context/conventions.md` → `### Where a new responsibility goes` → **A responsibility that already has a home does not get a second one.**

   Step 1 of `JOB_SURFACES_CHECK` reads the trusted configuration as text with `fileAtRef(root, 'refs/remotes/origin/<branch>', 'harness.config.json')`, then says to "parse and check it through the config module's existing parse path". No such path exists. `cli/src/config/io.ts` → `loadConfig(repoRoot)` takes a directory and reads the file from disk through `readJsonFile`. No export of `config/io.ts` takes a configuration's text. Task 4's `### Targets` lists only `cli/src/doctor/checks.ts`, `cli/src/commands/doctor.ts` and the new test, so the plan leaves the implementer one way to land step 1: a `JSON.parse` of the configuration text plus a direct `checkConfigShape` call in `checks.ts`. That would be a second loader of `harness.config.json`, with its own absent / unparsable / not-an-object handling. Today nothing in `cli/src` outside `cli/src/config/` parses that file (`grep -rn "JSON.parse\|checkConfigShape" cli/src`). The second loader also contradicts `config/io.ts`'s header, and the plan does not amend it.

   **Fix:** In `task_4_plan.md`:
   - Add `cli/src/config/io.ts` to `### Targets`.
   - Add a `**Work:**` sub-step that factors `loadConfig`'s parse-and-check body into a new export taking the configuration's text and a label for where it came from, for example `loadConfigText(text: string | undefined, origin: string): LoadedConfig`. `loadConfig` keeps its behaviour and calls that export. `undefined` text gives the same *not found* problem. Unparsable text gives the same *unparsable* problem, naming `origin` (for example `refs/remotes/origin/<branch>:harness.config.json`) in place of the disk path.
   - Amend `config/io.ts`'s header in the same edit, so it says the module also parses a configuration read from a git ref, and that `fileAtRef` in `core/git.ts` supplies the bytes.
   - Rewrite step 1 of `JOB_SURFACES_CHECK` to call that export with `fileAtRef`'s result, and grade `fail` on any `error`-severity problem it returns.
   - Add a `**Verification:**` bullet: `git grep -nE "JSON\.parse|checkConfigShape" -- cli/src/doctor/checks.ts` shows no new hit, and the new export is defined once, in `cli/src/config/io.ts`.

## Should Fix

1. **`hr_run_main_set_var` is still a second copy of "the directory arm of `hr_wrapper_main_of`"** — `task_1_plan.md`, the `hr_run_main_set_var` contract row. This is iteration 0's Should Fix 1, unaddressed and not recorded as rejected. Rule source: `.claude/context/conventions.md` → `### Where a new responsibility goes` → **Before adding a copy of anything, grep for it.** Factor the test (a real directory, not a symlink, no `commondir`) into one private helper that both functions call.

2. **`hr_push_landed`'s new fetch still spells its pins inline and omits `-c core.fsmonitor=false`** — `task_1_plan.md` → **Placement, the commit and the landed test.** This is iteration 0's Should Fix 2. As written, the section's pin set has two statements, and they already differ. Run the fetch through `hr_run_main_git`, after `hr_run_main_set_var` on the placed main checkout.

3. **`create-worktree.sh`'s `THE TWO MODES` paragraph will still say *"every later commit goes through `commit-on-branch.sh` and `push-branch.sh`"*** after Task 7 moves `remote-run.sh start` / `review`'s commit to `hr_commit_placed`. Task 5 edits that same paragraph. Its header sub-step should reword the sentence to name the library's plumbing commit, which still refuses a protected branch. Rule source: `.claude/context/cli.md` → `## What "done" means here` → **A reviewer holds a change to its module's own header.**
