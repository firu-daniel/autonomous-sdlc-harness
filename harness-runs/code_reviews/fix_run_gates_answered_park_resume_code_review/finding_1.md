### 1. The `<park_answer_lookup>` command aborts under zsh when either glob matches nothing, so the answered `fixable: 0` park goes undetected

**File:** `plugin/instructions/plan_orchestration_instructions_autonomous.md` (`## Mode contract — bindings`, the `<park_answer_lookup>` row) — "grep -lF '<test_fix_plan_path>' <state_dir>/clarifications/<branch>/question_*.md"

**Also:** `plugin/instructions/user_review_fixes_instructions_autonomous.md` (`## Mode contract — bindings`, the `<park_answer_lookup>` row), which carries the same cell byte-for-byte, and `cli/test/run-gates-park-answer.test.mjs` (`LOOKUP`), which pins that cell.

Both autonomous forks bind `<park_answer_lookup>` to this command:

```
grep -lF '<test_fix_plan_path>' <state_dir>/clarifications/<branch>/question_*.md <state_dir>/clarifications/<branch>/answered/question_*.md
```

It passes two unquoted globs on one command line. The orchestrator's Bash tool runs in the operator's login shell. On macOS that is zsh by default, and zsh's `nomatch` option aborts the **whole** command when **any** glob matches nothing. Nothing runs and stdout is empty. The plugin already records this failure: `plugin/instructions/qa_test_instructions.md` → the `<round>` paragraph — *"a lone `_*` glob that matches nothing aborts the command in zsh"*. This review's own session showed it too: on this machine (`$SHELL` is `/bin/zsh`), an unmatched glob in a Bash tool call printed `(eval):1: no matches found: …` and ran nothing.

This hits the exact case the branch exists to fix. In `feat_unattended_sandbox_preflight`, `question_1.md` was the branch's first park, so `<state_dir>/clarifications/<branch>/answered/` held no `question_*.md`. The second glob matches nothing and the command aborts. G.0's pending-answer test then "yields at least one complete pair" fails, and the index counts as **complete** under `### G.0 Resolve the round` step 2. `<gate_round>` moves on, and G.1 runs the full gates on the unchanged tree. That is the 38-minute wasted gate run the task prompt describes. The first glob fails the same way after a non-pause exit archives every top-level pair into `answered/`, which is the case the row's own **The Phase G answer lookup.** paragraph says it searches `answered/` for. Under bash the unmatched glob is passed through literally, so grep prints `No such file or directory` and exits `2` even when it printed a match. An orchestrator that reads the exit status then sees a failed lookup.

**Fix:** search the branch directory recursively, with the file-name filter quoted so no shell expands it. In **both** forks, replace the whole `<park_answer_lookup>` value cell up to (not including) ` Why both directories,` with this text, byte-identical in the two files:

```
`grep -rlF --include='question_*.md' '<test_fix_plan_path>' <state_dir>/clarifications/<branch>/` — it searches the branch's directory and its `answered/` archive in one pass, and a directory that does not exist yields no pair; each `question_<n>.md` it prints is a complete pair only when `answer_<n>.md` sits in the same directory.
```

Leave the rest of each cell unchanged (` Why both directories, and which park's file names the index: **The Phase G answer lookup.** …`).

Then, in `cli/test/run-gates-park-answer.test.mjs`, replace the `LOOKUP` constant with:

```js
const LOOKUP =
  "grep -rlF --include='question_*.md' '<test_fix_plan_path>' <state_dir>/clarifications/<branch>/";
```

The test file is one this fix edits, so run it alone as the fix's own verification: `npm test --workspace cli -- test/run-gates-park-answer.test.mjs`, from the repository root, as one plain foreground command. The full suite runs in the Run gates phase.
