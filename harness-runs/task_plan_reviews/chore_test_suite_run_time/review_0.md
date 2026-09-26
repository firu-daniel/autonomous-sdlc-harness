# Task plan review — iteration 0

## Must Fix

1. **`task_4_plan.md` — the suite wrapper swallows seven top-level `await`s, which a sync `() => {` callback cannot hold**
   The first Work bullet says to open `concurrentSuite('init', () => {` right before the first top-level `test(` (*"a first init exits 0 and writes a schema-shaped harness.config.json"*), close it at the end of the case list, and keep only what sits **above** the first case outside the suite. But `cli/test/init.test.mjs` has seven module-level `await` statements **below** that first case, between cases:
   - `const { readProtectedCaseLabel, caseLabelMatches } = await loadCompiled('generators/githooks.js');`
   - `const { configuredWrapperFile, wrapperCommandLine, writeWrapperScripts } = await loadCompiled('generators/scripts.js');`
   - `const { READ_MANIFESTS } = await loadCompiled('detect/presets.js');`
   - `const { writeClaudeContext } = await loadCompiled('generators/claudeContext.js');`
   - `const { WritePlan } = await loadCompiled('core/writer.js');`
   - `const { parseRepoSlug } = await loadCompiled('core/paths.js');`
   - `const { PLUGIN_KEY } = await loadCompiled('generators/projectSettings.js');`

   To find them all, run `grep -nE "^[^ /*].*\bawait\b" cli/test/init.test.mjs` and compare the line numbers with the first `^test\(` line. Wrapped in a non-`async` function, each of those lines is a `SyntaxError` ("await is only valid in async functions"). The whole file would then fail to load, and none of its cases would run. The task's isolation audit mentions module-level values (`GIT_TOO_OLD`, the constant tables) but not these seven, and no Work bullet deals with them.
   **Fix:** Add a step to the first Work bullet in `task_4_plan.md`. Before opening the suite, move every module-level statement that sits between cases and contains `await` so it sits above the first case. Name the grep above as the way to find them, and say they move unchanged. Hoisting is safe because `loadCompiled` only imports compiled read-only modules. The implementer should also confirm that no helper above the suite refers to a binding that is declared below the first case, because wrapping those declarations in the suite's block scope would hide them. Add a Verification bullet: `node --check test/init.test.mjs` exits 0, run from `cli/`. Do not switch to an `async` suite callback instead of hoisting unless the plan cites where `node:test` states that a suite's asynchronously registered children are collected.

2. **`task_3_plan.md` — the same defect in `doctor.test.mjs`: two top-level `await`s below the first case**
   The first Work bullet opens `concurrentSuite('doctor', () => {` immediately before *"doctor exits 0 on a freshly wired repository, warnings and all, and writes nothing"*. It closes the suite at the end of the file and keeps only "everything above the first case" outside the suite. `cli/test/doctor.test.mjs` has two module-level `await`s far below that case:
   - `const { MARKETPLACE_NAME, PLUGIN_KEY } = await loadCompiled('generators/projectSettings.js');`
   - `const { PLUGIN_NAME } = await loadCompiled('core/pluginIdentity.js');`

   Inside the sync suite callback, the file does not parse. Task 2's parallel claim for `stack-presets.test.mjs`, that its top-level `await`s "stay above the suite", is true for that file: all three of its `await`s come before its first case. Tasks 3 and 4 copied that claim without checking it against their own files.
   **Fix:** In `task_3_plan.md`, add the same hoisting step. Before opening the suite, move every module-level statement that contains `await` and sits below the first case to above it, unchanged. Use `grep -nE "^[^ /*].*\bawait\b" cli/test/doctor.test.mjs` to find them. Also check that no helper above the suite refers to a binding declared inside it. Add `node --check test/doctor.test.mjs` exiting 0, run from `cli/`, to Verification.

## Should Fix

1. **`task_4_plan.md` — "alone within this file" is not "alone on the machine".** The dev-server case asserts `elapsed < RETURNS_PROMPTLY_MS` and polls with `eventually`. Moving it after the suite keeps it clear of `init.test.mjs`'s own burst of cases. On a 4-core runner, though, `node --test` still runs two other files beside it, and after Tasks 2–3 those files run their own concurrent suites. The header choice and the story index's first `Top risks:` entry should state this residual exposure honestly, not imply the case is isolated from load. Consider noting the per-file timing of the three green runs Task 7 already requires as the evidence.
2. **`task_6_plan.md` — "`git add` every file" inside the container.** `.claude/context/conventions.md` → `## Shell assets` says *"Never `git add -A` or `git add .`"*, and the most natural way to implement "`git add` every file" is exactly that. The repository is throwaway, but the rule is stated for shell assets without that exception. Spell out the staging form instead: an explicit path list, for example one written on the host from `git ls-tree -r --name-only <sha>` and fed through `git add --pathspec-from-file=<list>`. Otherwise, give the task's own argued reason for the exception in the script's header.
3. **`task_7_plan.md` — `grep -n "$HOME" docs/development.md`.** This command carries a shell expansion, so it cannot be issued as a literal in an unattended run (`.claude/context/conventions.md` → `## Shell assets`, the literal-command bullet). Gate 6a already greps for the home directory. Point the verification at gate 6a's result, or have the implementer substitute the resolved home path by hand.
4. **`task_1_plan.md` — the temp-directory check** `node -e "…filter(n=>n.startsWith(…))"` contains a `>` inside the program text. Some permission guards read that as a redirect. `ls` of the temp directory followed by a read of its entries would state the same check without the construct.
