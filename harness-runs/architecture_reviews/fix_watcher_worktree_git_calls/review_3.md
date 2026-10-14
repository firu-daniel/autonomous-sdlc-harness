# Architecture review — iteration 3

Iteration 2's Must Fix is resolved. `task_1_plan.md` → `**Work:**` → the header sub-step's item 4 now names `setup-worktree.sh --target` among the `JURISDICTION` callers and states its placement, target check and main-side configuration reads. Item 6 says the widening covers it. The `**Verification:**` bullet requires `JURISDICTION` to name `setup-worktree.sh`. No plan file asks for a test run that `## The test-run rule` forbids: every `npm test --workspace cli -- test/<file>` bullet names a file its own task creates or edits, and Tasks 1, 2, 6 and 7 verify by hand against throwaway fixtures, never by running another suite.

## Must Fix

1. **Task 4's `loadConfigText` gives `config/io.ts` a second copy of `core/json.ts` → `readJsonFile`'s JSON parse and its `is not valid JSON` message** — `task_4_plan.md`. Rule sources: `.claude/context/conventions.md` → `## Shared code, and where it lives` (*"A value or behaviour two `cli/src` areas need lives there, never duplicated into both"*), and `### Where a new responsibility goes` → **Before adding a copy of anything, grep for it.**

   The `config/io.ts` sub-step has `loadConfigText` parse the text itself. It reports unparsable text as *"`<origin> is not valid JSON: <detail>`, which is `readJsonFile`'s wording with `origin` in place of the path"*, and it moves `loadConfig` off `readJsonFile` onto a raw text read. Today `cli/src/core/json.ts` → `readJsonFile` is the one place in `cli/src` that turns JSON text into a value and words its failure. It does both inline: `JSON.parse(text)`, then `throw new HarnessError(\`${path} is not valid JSON: ${detail}\`)`. Every other `JSON.parse` in `cli/src` parses a template or a subprocess's stdout, not an adopter's file. After Task 4 lands, `config/` and `core/` would each carry a parse of an adopter JSON file plus a hand-copied failure sentence. That is the drift the `repoPaths.ts` story in `### Where a new responsibility goes` records: two bodies that must agree, with no compile error or test when one changes. The plan's Targets also do not include `cli/src/core/json.ts`, so the implementer has no sanctioned way to share the behaviour.

   **Fix:** In `task_4_plan.md`:
   - Add `cli/src/core/json.ts` to `### Targets`.
   - Add a `**Work:**` sub-step that factors `readJsonFile`'s parse-and-throw into a new export in `core/json.ts`, for example `parseJsonText<T extends JsonValue = JsonValue>(text: string, label: string): T`. It throws the same `HarnessError` (`${label} is not valid JSON: ${detail}`). `readJsonFile` keeps its signature and behaviour and calls it with the path as `label`.
   - Rewrite the `config/io.ts` sub-step so `loadConfigText` gets its parse and its failure wording from `parseJsonText(text, origin)`, and turns the thrown `HarnessError` into the *unparsable* `error` problem the way `loadConfig` already turns `readJsonFile`'s throw into one. Drop the instruction to restate `readJsonFile`'s wording in `io.ts`. `loadConfig` may stay on `readJsonFile` or read the text and call `loadConfigText`. Either way, its disk-read messages stay byte-identical.
   - Add a `**Verification:**` bullet: `git grep -n "JSON.parse\|is not valid JSON" -- cli/src/core/json.ts cli/src/config/io.ts` shows the parse and the sentence only in `core/json.ts`.

## Should Fix

1. **`hr_run_main_set_var` is still a second copy of "the directory arm of `hr_wrapper_main_of`"** — `task_1_plan.md`, the `hr_run_main_set_var` contract row. This was raised in iterations 0, 1 and 2. It is neither resolved nor recorded under a `## Rejected findings` section in the story index. Rule source: `.claude/context/conventions.md` → `### Where a new responsibility goes` → **Before adding a copy of anything, grep for it.** Factor the test (a real directory, not a symlink, no `commondir`) into one private helper that both functions call.

2. **`hr_push_landed`'s new fetch still states its pins inline and leaves out `-c core.fsmonitor=false`** — `task_1_plan.md` → **Placement, the commit and the landed test.** This was raised in iterations 0, 1 and 2, and it is still unaddressed and unrecorded. Run the fetch through `hr_run_main_git`, after `hr_run_main_set_var` on the placed main checkout, so the section's pin set is stated once.

3. **`create-worktree.sh`'s `THE TWO MODES` paragraph will still say the default mode's *"every later commit goes through `commit-on-branch.sh` and `push-branch.sh`"*** — `task_5_plan.md`, the header sub-step. This was raised in iterations 1 and 2, and it is still unaddressed and unrecorded. The paragraph's opening line is unchanged in the tree today. After Tasks 6 and 7, the artifact commit in a default-mode copy is `hr_commit_placed`. Task 5 already edits that paragraph, so have it reword this sentence too. Rule source: `.claude/context/cli.md` → `## What "done" means here` → **A reviewer holds a change to its module's own header.**

4. **Task 3's `fileAtRef` cannot be both "untrimmed" and "through the module's private `runGit`"** — `task_3_plan.md`. `cli/src/core/git.ts` → `runGit` returns `.trim()`ed stdout, but the contract table says `fileAtRef` returns `git show`'s stdout *untrimmed*. Pick one. Either accept a trimmed blob, which is harmless for the JSON this task's only consumer parses, and say so, or add a non-trimming private runner beside `runGit` inside `core/git.ts`. Add that runner to the header's account of how calls are issued.

## Nice to Have

1. `task_4_plan.md` → `**Verification:**` diffs `checks.ts` against `main`, but `defaultBranch` is `dev`. A diff against `main` can pick up `JSON.parse` lines that `dev` already carries (`cli/src/doctor/checks.ts` parses subprocess stdout in several places). Diff against the branch's base on `dev` instead.
