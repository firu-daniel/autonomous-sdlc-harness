# Review — layer-implementer
verdict: FAIL

Checked: every `wc -w` in the Read tree and ledger (all within 5 %); ledger arithmetic, which is correct in all four shapes; 24 citations (listed at the end); the dispatch count in the main checkout's `harness-runs/autonomous_logs/fix_run_gates_typecheck.log` (`grep -c '→ layer-implementer'` = 18, split matching the report); and every reader of a unit detail file.

## Must Fix

1. **"No caller, prompt or committer change is needed" is false. The supervised flow would leave the report uncommitted.**
   Evidence:
   - `plugin/instructions/plan_orchestration_instructions.md:63`: the supervised orchestrator commits "the per-item detail file **if the specialist appended `**Deviations from plan:**` notes to it**". Under the proposal every specialist dispatch modifies the detail file, so a literal reading leaves a tracked file dirty after the item's commit.
   - The same Deviations-only condition is stated in `unit_loop_core.md` → `#### Row A` ("the per-task file **only if** the implementer appended `**Deviations from plan:**` notes"). It is also in `committer.md:111` ("(deviation notes; …)") and `committer.md:112` ("a code-only fix touches no detail file, so in the common case there is nothing extra to stage"). The committer stages from `git status`, so it still works, but all three sentences become false.

   Change: in `## Storage and lifecycle` → **Recommended key**, replace "No caller, prompt or committer change is needed" with a list of the edits. These are `plan_orchestration_instructions.md:63` (stage the detail file whenever it is modified), the Row A exception, and `committer.md:111–112` wording. Add them to the thinning plan, and add their word delta to the ledger.

2. **The template's "Append once at dispatch start" breaks the agent's own no-write blocker contract.**
   Evidence:
   - `layer-implementer.md:41`: on a missing value, "return a blocker … and stop".
   - `layer-implementer.md:78`: an unreadable input means "return a blocker naming the path and the refusal, **change no file**, and stop".
   - Template L1 says "change nothing", but the header comment has already appended the section to the detail file before L1 runs.
   - The result is a tracked detail file left modified on an escalating blocker. The autonomous pause check treats any non-`??` line as dirty-tracked (`autonomous_pause_and_ledger.md` → `### 2.2`, around line 471).

   Change: append the section at the first checkpoint, after L2 passes. Alternatively, state that the L1 and L2 blockers write no report and return the blocker only. Then update the mode table.

## Should Fix

1. **The reader analysis of the detail file is missing, and it is the crux of the recommendation.** Add a reader-by-reader table. My findings:
   - **`layer-reviewer`.** It treats the detail file as ground truth (`layer-reviewer.md:70`). It also reads "the whole uncommitted set" and "every changed file in full" (`:71–72`). So it both reads the report as part of the spec and grades it as part of the change (lead 5). Self-attested `[x]` lines then sit inside the reviewer's ground truth.
   - **`layer-implementer` itself.** It reads the detail file in full on every dispatch (`layer-implementer.md:144`), so the next layer's dispatch and every fix iteration re-read the earlier `[x]` sections.
   - **`ui-tests-plan-writer`.** It reads every per-task file (`ui-tests-plan-writer.md:79`, `:118`), including on the augment round, which runs after implementation. For 12 tasks that adds about 5.5k or more words.
   - **`user-review-fix-plan-writer`.** It reads per-task files and code-review `finding_<K>.md` files (`:82–84`), which become the detail files of rows `A` and `C`.
   - **Unaffected:**
     - `statistics-plan-writer` reads no detail file (`:33`).
     - `branch-reviewer` excludes `<state_dir>/*<branch>*` from its diff (`branch-reviewer.md:83`).
     - The `review-plan-reviewer` orphan check is file-level (`:108`).
     - The improvement-observations "index-only commit" class already exempts the detail file (`improvement_observations_instructions.md:65`).

   Change: add the table. Add one header line stating that the section is a record, not spec. Also say what each affected reader should do with it.

2. **Lead 12 (evidence leaking into committed files) is not addressed, and this repository has a gate that would catch it.**
   - L10 asks the agent to paste the type check's verdict line. L11 asks it to list each test result. Both land in a committed file: `harness-runs/task_plans/…` is not gitignored, as `git check-ignore` confirms.
   - Gate 6a greps the whole tree for `$HOME` (`scripts/run-gates.sh:141`). `test-fix-plan-writer.md:77` already carries a rule to rewrite machine paths for exactly this reason.

   Change: add a "repo-relative paths, `<home>/…` for anything else, no timestamps" clause to L10 and L11, or point both at `test-fix-plan-writer.md` step 5. List the clause as a risk.

3. **Lead 13 (read-list conflicts) is not addressed.**
   - `.claude/CLAUDE.md`'s routing table sends "Any implementation" to `context/conventions.md`, which is 5 864 words. So a `plugin`-layer dispatch loads 18 678 words up front, not 12 814. For a fresh adopter, add `cli/templates/claude/context/conventions.md` (974 words).
   - `harness.config.json` (154 words) is also read but not listed. The agent is told to take the layer set from it (`layer-implementer.md:84`).
   - The constraint still holds, because the same amount is added before and after.

   Change: add these rows and say which read list wins.

4. **The "after" figures are per-row guesses.**
   - Only the template was drafted and counted (458 words, which checks out). The agent figure of about 2 300 is the sum of `~` estimates. The about 850 and about 1 150 words for the two new files are not drafted either.
   - The margin of about 3 500 words makes the constraint robust even at ±50 %, but the report should say that the figures are estimates.
   - Note that about 2 250 of the 3 987-word cut is relocation, not thinning: 1 044 + 1 265 moved, minus about 70 for pointers. The verdict says this; the ledger should show it as a separate line.

5. **Section accumulation is left as an open question.** Fix iterations, up to 5 per layer (`unit_loop_core.md:108`), times the number of layers can give 10 sections of about 460 words in one spec file. That file is re-read by the reviewer and the implementer on every iteration.

   Change: make "replace this layer's previous section; keep only the latest per layer" part of the recommendation. Do not leave it as Open question 3.

6. **A cross-reference inside the agent definition dangles after the move.** `layer-implementer.md:166` (the probe route, which stays) says "`**Standing-prohibition disposition.**` below owns that case". That paragraph moves to `layer_implementer_closures.md`.

   Change: list this pointer in the thinning plan.

## Nice to Have

- The test-run rule is cited as "lines 140–157, 658 words". Points 1–6 are actually lines 140–153 (644 words); lines 154–157 are the start of the citer roster. The difference is under 5 %, but fix the range.
- The catch-all section (lines 80–130) is given as 1 053 words; `sed -n '80,130p' | wc -w` gives 1 044.
- L8's `ref:` points into the agent's own resident file, which is already loaded. Drop the ref or point it at the proposed shared base file.
- L7 says "Renames via `git mv`", but `Bash(git mv:*)` is in the autonomous `ask` list (`cli/templates/claude/settings.autonomous.json:80`). This is pre-existing: output-contract item 2 has the same issue. Raise it as an open question rather than baking it into a checklist item.
- The report is 3 701 words; without the template it is about 3 240, slightly over the 3 000-word target.

## Bug claims

The report names no pre-existing bug. Its factual claims about the alternative storage path:

- **CONFIRMED.** A separate report file breaks subject reconciliation for dispositioned and already-passing units.
  - `committer.md:111` stages "the code files shown by `git status --short`", which includes an untracked report.
  - The test at `committer.md:83`, "any path other than `plan_path` and the unit's own detail file?", then answers yes.
  - That suppresses the `record disposition of …` subject and the `staged: index-only` line that `unit_loop_core.md:80` reads.
- **CONFIRMED.** The phase key cannot be passed without editing the caller: "nothing else may be appended" (`unit_loop_core.md:75`).
- **CONFIRMED.** `<app_root>` is bound with no consumer, as the agent definition itself says (`layer-implementer.md:21`).

Citations verified correct:
- `unit_loop_core.md` lines 69, 72–73, 75, 77, 80, 97, 108, 134, 148, 152 and 174.
- `committer.md` lines 83 and 111–112.
- `layer-reviewer.md` lines 19 and 115.
- `sample_story_plan.md:21`, `conventions-writer.md:164`, `conventions-reviewer.md:183`, `plan_orchestration_instructions_core.md:86` and `docs_orchestration_instructions_autonomous.md:131`.
- The two semi-autonomous command lines.
- `## Disposition` is quoted by six other files.
- `settings.autonomous.json` has `Write(/{{repoRoot}}/**)` and no `cp`.
- Every `hooks.json` matcher is `Bash`.
- The only external anchors into the agent are `unit_loop_core.md:148`, `unit_loop_core.md:152` and `sample_story_plan.md:21`; none of the moved prose is anchored from outside.
