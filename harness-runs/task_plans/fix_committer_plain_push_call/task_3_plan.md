### Task 3 — Pin the "once, alone" wording with a source guard in `cli/test`

**Goal:** Make the "once, alone" rule fail loudly if it drifts. A new `cli/test` source guard asserts that the committer's commit, verify and push steps all carry the rule, that `ui_test_pass` still defers to those steps, and that the orchestrator-side copy in §1.6 is the same sentence. No existing suite quotes `committer.md` (`git grep -l 'committer\.md' -- cli/test` finds none), so this task adds a new file rather than extending one.

**Depends on:** Task 1 and Task 2, which write the strings this suite asserts:

- `plugin/agents/committer.md` → `### Standard procedure (`task` / `review_plan_file` / `review_item`)` (Task 1):
  - step 4 keeps "then call the wrapper once, alone, with exactly step 3's paths and every placeholder as literal text:" and gains the definition sentence `DEFINITION` below;
  - step 5 is the line beginning `5. **Verify:**` and contains "as two separate calls, each once, alone";
  - step 6 is the line beginning `6. **Push:**` and contains "call `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>` once, alone" and "never `<repo_root>`".
- `plugin/agents/committer.md` → `### ui_test_pass procedure` (unchanged by Task 1): step f contains "call the wrapper once, alone", step g begins `g. **Verify** as step 5 does`, step h begins `h. **Push** as step 6 does`.
- `plugin/instructions/autonomous_pause_and_ledger.md` → `### 1.6 How to flip / create — direct `commit-on-branch.sh`, NEVER a committer dispatch` (Task 2): contains "Call each wrapper once, alone." and `DEFINITION`, and no longer contains "newline-separated".

`DEFINITION` = `**Once, alone** means its own Bash call holding that one command and nothing else — no `cd`, `;`, `&&`, `||`, pipe, `echo "exit $?"`, `$(…)` or shell variable before or after it.`

This task edits no plugin file. If an asserted string is missing, report it as a deviation from Task 1 or Task 2. Never re-word the prose to make the test pass.

### Targets

- `cli/test/committer-wrapper-calls.test.mjs` (new) — the source guard.

**Work:**

- [ ] Header: open with the rule the suite enforces, in the shape `cli/test/run-gates-park-answer.test.mjs` uses. State that it is a source guard, the last resort `.claude/context/conventions.md` → `## The testing bar` permits, and give the reason: the rule is agent prose a committer session reads, and no behavioural test starts one. Name what is deliberately not covered, namely whether a live committer session actually issues one call per command.
- [ ] Reuse that suite's shape: read files with `readFileSync(join(WORKSPACE_ROOT, rel), 'utf8')` (`WORKSPACE_ROOT` from `./helpers/fixture.mjs`), and slice each section from its exact heading line to the next heading of the same or higher level, failing by name when a heading is missing. Keep the `section` helper file-local; `.claude/context/cli.md` → `## Not determined` leaves sharing it unsettled. Add a `collapse(s)` that replaces each run of whitespace with one space, and compare `DEFINITION` against collapsed section text.
- [ ] Case (a), the commit and push steps: inside `### Standard procedure`, assert step 4's existing "once, alone" sentence and `DEFINITION`, the step-6 line's push phrase and "never `<repo_root>`", and that the step-6 line does not contain `push-branch.sh` under any root but `<MAIN_REPO>/<scripts_dir>/`.
- [ ] Case (b), the verify step and `ui_test_pass`: assert the step-5 line's "as two separate calls, each once, alone". Inside `### ui_test_pass procedure`, assert step f's "call the wrapper once, alone" and the lines beginning `g. **Verify** as step 5 does` and `h. **Push** as step 6 does`.
- [ ] Case (c), one wording across two owners: inside §1.6, assert "Call each wrapper once, alone." and collapsed `DEFINITION`, and assert that "newline-separated" is absent from that section. Assert `DEFINITION` against a string literal, never against text read from `committer.md`, so a matching edit to both prose copies still fails (`.claude/context/conventions.md` → `## The testing bar` → "Assert against the contract stated literally").

**Verification:**

- `npm test --workspace cli -- test/committer-wrapper-calls.test.mjs`, run from the repository root as one plain foreground command, exits zero, and its `# fail` / `ℹ fail` count is zero. Read the counts, not a summary line.
- The guard bites: temporarily change "once, alone" to "once" in step 6 of `plugin/agents/committer.md`, re-run the same command, and see case (a) fail and name step 6. Then revert that edit with the file tool and confirm `git diff plugin/agents/committer.md` shows only Task 1's change.
- `commands.typecheck` (`bash scripts/typecheck.sh`), run as written, exits zero. The new file is `.mjs` outside `cli/src`, so it should not affect the result. Run it anyway as the unit's typecheck.
