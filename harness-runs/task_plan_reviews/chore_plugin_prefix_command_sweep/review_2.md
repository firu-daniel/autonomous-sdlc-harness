# Task plan review — iteration 2

Both Must Fix findings from iteration 1 are resolved in the revised files:
- `task_10_plan.md` now rewrites the `docs/cli.md` measurement clause into a pointer to §6. It lists Tasks 1 and 2 as sources of record and adds the `headless and negative on both spellings` grep.
- `task_12_plan.md` now schedules the `**Interactive only.**` bullet. It branches on §6's headless result and handles step C's pointer and `llms.txt`.

The scope-register derivations were re-run:
- Entry 1 was re-run verbatim and reaches 88 files.
- Entry 2 was re-run verbatim.
- Entry 3 was re-walked over `harness-runs/lessons.md`.

Every file and ledger rule they reach is a row (rows 1–90), and every entry-1-only row is a path citation or a noun, as its evidence says. The closure invariant holds.

## Must Fix

1. **The gate-6d contract's pattern misses a bare spelling at the end of a sentence** — `task_11_plan.md` (item **(e)** of the rule-and-contract Work bullet). The same pattern is in the story index `chore_plugin_prefix_command_sweep_story_plan.md` → `## Context` → **The drift check.**
   The contract fixes the pattern `(^|[^A-Za-z0-9_.}/:-])/(branch-([a-z-]*[a-z]|\*)|harness-analyze)([^A-Za-z0-9_./-]|$)`. Its trailing class excludes `.`, so a spelling followed directly by a period does not match.
   I tested this with a scratch file:
   - `Then run /branch-status.` does not match.
   - `Run /harness-analyze.` does not match.
   - `` Then run `/harness-analyze`. `` matches, but only because of the backtick.

   Unquoted, sentence-final spellings are ordinary prose in this corpus. One example is the STOP line *"Run /branch-start-user-review-fix-plan first."*, which only escapes because a word follows it. So the gate would pass a reverted or newly added bare spelling like these. That fails deliverable 5 (*"It fails on a bare `/branch-*` or `/harness-analyze` spelling at a human-facing site"*).
   The `.` exclusion buys nothing for path citations. A path like `commands/branch-start-plan.md` is already excluded by the leading class, because `/` there follows a letter. A spelling followed by `.md` is still excluded if a period may end a match only when the next character is not a name character.
   Widening the pattern costs no exemption on today's tree. `grep -rnE '(^|[^A-Za-z0-9_.}/:-])/(branch-[a-z-]*[a-z]|harness-analyze)[.]([^A-Za-z]|$)' . --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git --exclude-dir=harness-runs` returns nothing, so no site is missing from the register and no new exemption is needed.
   **Fix:** In `task_11_plan.md` item **(e)**, change the trailing group to one that also accepts a period followed by a non-name character or the end of the line. For example: `(^|[^A-Za-z0-9_.}/:-])/(branch-([a-z-]*[a-z]|\*)|harness-analyze)([^A-Za-z0-9_./-]|\.([^A-Za-z0-9_/-]|$)|$)`. Have the paragraph say in one sentence that a sentence-final spelling is caught and a `.md` path is not. Make the same change to the pattern quoted in the story index `## Context` → **The drift check.** Add a Verification bullet to `task_11_plan.md`: `grep -nE '<the new pattern>' docs/development.md` prints only the gate-8 block lines and the §6 measured-subject lines. Use the same new pattern in that task's existing site-check grep.

2. **The gate-6d script uses the same pattern, and no planted-failure check covers a sentence-final spelling** — `task_13_plan.md`.
   `task_13_plan.md` restates the contract's **Pattern:** bullet byte for byte, so the script has the blind spot described in finding 1. Its two plants both use the backticked form `` Run `/harness-analyze` here. ``, which the current pattern already catches, so neither plant can show the gap is closed.
   **Fix:** In `task_13_plan.md`, restate the widened pattern that finding 1 puts into Task 11's contract. Keep the note that `commands/branch-start-plan.md`, `agents/branch-reviewer.md` and the qualified form do not match, and add that a `.md` suffix still does not match. In the **Prove it fails, then revert** Work bullet, add a third plant: append the unquoted, sentence-final line `Then run /branch-status.` to `docs/cli.md`. Confirm the script exits 1 with a `docs/cli.md` finding, revert so `git diff -- docs/cli.md` is empty, and record the run in the `REPRO` block. Add a matching Verification bullet.

## Should Fix

1. **Scope register row 89 still limits the lessons-ledger rule to `README.md` and does not say why.** This is in the story index, `## Scope register` row 89. It carries over from iterations 0 and 1, and is neither addressed nor recorded under `## Rejected findings`. Tasks 6, 10 and 12 rewrite adopter-facing lines that keep a command inline:
   - Task 6: the `**Usage:**` lines, e.g. *"type `/autonomous-sdlc-harness:branch-prompt` and then keep typing …"*
   - Task 10: `docs/cli.md`'s `/harness-analyze <target>` in the step-2 paragraph
   - Task 12: *"`/branch-prompt` itself"*

   Either the reason cell says why those lines describe syntax or name a route rather than tell a reader what to run, or the owning tasks fence the lines the rule covers.

2. **Task 12's `ARCHITECTURE.md` rewrites still do not mention the file's sentence-marker rule** (`task_12_plan.md`). This carries over from iteration 1. `ARCHITECTURE.md` marks every declarative sentence `**[shipped]**` or `**[designed]**`. The replacement sentences (the sweep ran, gate 6d exists, the route is measured) each need one. Add that to the `ARCHITECTURE.md` Work bullet.

3. **Task 1's verification rationale still names a byte comparison that does not exist for the watcher** (`task_1_plan.md`). This carries over from iteration 1. `cli/test/outer-loop-scripts.test.mjs` compares only `LIB_TEMPLATE` (`lib/harness-run-lib.sh`) byte for byte, and no case there reads `autonomous-watcher.sh` against its template. Drop the sentence, or keep `bash scripts/test.sh` as the gate without claiming it checks the watcher's bytes.

4. **Task 1's decision table has no control on the bare leg** (`task_1_plan.md`). The probe runs `--max-turns 4` in plan mode. If the **bare** leg also shows no `Skill` load, the probe has not reproduced the route the completed runs used. The table would then choose `bare` on evidence that tells the two spellings apart in neither direction, and the comment would record it as measured. Have the comment state in plain words when the bare leg did not load the engine (the result is `inconclusive`, and `bare` is kept only on the completed-runs evidence). Alternatively, raise `--max-turns` until the bare leg shows the load.

## Nice to Have

- Task 2's headless-probe bullet does not repeat Task 1's *"Write no machine path: gate 6a greps for `$HOME`"* caution for the paragraph it adds to `init.ts`. A `stream-json` `system`/`init` event carries the absolute `cwd`. `bash scripts/test.sh` would catch a copied path, but stating the caution up front saves a round.
