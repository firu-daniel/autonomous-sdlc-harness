# Review — committer
verdict: FAIL

## Must Fix

1. **A cross-file heading anchor is missing, and the thinning plan breaks it.** The plan folds `### ui_test_pass procedure` into "steps 1–6" and adds a `### Stage set` sub-heading. That leaves the `### Standard procedure (`task` / `review_plan_file` / `review_item`)` heading either renamed or inaccurate. `plugin/instructions/plan_orchestration_instructions_core.md:509` cites that heading by its literal text: "`committer.md` → the subject-line step of "### Standard procedure (`task` / `review_plan_file` / `review_item`)"". The anchor is already stale, because the fixed subject lives in `## Commit-message policy` (`committer.md:76`), not in that procedure. Risk 6 still claims that only return lines, substrings and subjects are parsed.
   - Change: add `core.md:509` to the Risk 6 / thinning "keep verbatim" list. State that the heading either keeps its name, or that `core.md:509` is repointed to `## Commit-message policy` → **Fixed-form subjects** in the same edit. Note that the anchor is already stale today.

## Should Fix

1. **"Who creates the file: not the committer" is overstated.**
   - The `cp` claim holds: `cp` is absent from `allow`/`deny`/`ask` (`cli/templates/claude/settings.autonomous.json:20-87`), and the profile's own README says an unlisted tool stalls in print mode (`:4`).
   - The redirect route is not "unverified" in the way the report says. The harness documents that "whatever follows the matched prefix rides along on the allow — a pipe, a redirect" under a `Bash(<prefix>:*)` rule (`plugin/hooks/allow-safe-compounds.sh:85-89`). `Bash(cat:*)` and `Bash(sed:*)` are allowed (`settings.autonomous.json:36,39`). `Write(/{{repoRoot}}/**)` is also allowed (`:50-51`) if the runtime treats the redirect as a file write. So `cat <template> > <report>`, run by the committer itself, is a plausible route.
   - Change: rewrite the bullet as "`cp`: stall. A redirect under `Bash(cat:*)`: probably passes per `allow-safe-compounds.sh:85-89`, unmeasured", and drop the conclusion that only the orchestrator can create the file. The verdict does not depend on it.

2. **Risk 1 is presented as new. Part of it already exists.**
   - Step 3 stages "the code files shown by `git status --short`" (`committer.md:111`). Per-unit `layer-reviewer` FAIL findings are written untracked into the row's findings folder (`unit_loop_core.md:90-103`). The loop never commits them before step 5.
   - Wherever `<per_unit_review>` is `on`, a unit with one FAIL iteration therefore already stages a non-index path, and the reconciliation answers Yes. That applies to the semi-autonomous forks and the autonomous user-review flow (`user_review_fixes_instructions_autonomous.md:39`). The `mark … done — ` / `staged: index-only` signal is lost for that unit today.
   - Change: say so in Risk 1. Widen the proposed exclusion from `work_reports/` to the run-artifact paths the reconciliation should ignore. Alternatively, flag it for the synthesis as a pre-existing gap.

3. **The `### Which caller sends which mode` owner is half-wrong.** "`unit_loop_core.md:196-207` owns it" (report line 54, thinning row) covers only rows `task` / `review_item` (`committer.md:59-61`). The `review_plan_file` and `ui_test_pass` callers live in `plan_orchestration_instructions_core.md` (`committer.md:62-63`; `core.md:481,498`). The 313-word "all REDUNDANT" call stands only if both owners are named.
   - Change: name both owners.

4. **The `commit_prefix` shortening (368 → ~120) has inbound readers the report does not list.**
   - `plan_orchestration_instructions.md:84-86` (supervised) and `unit_loop_core.md:277` both read "`committer.md`'s own contract for the `commit_prefix` argument". They rely on it naming a value "for every state the policy can be in" (`none`, and the `fix` fallback).
   - The report keeps 30 WIRE words there, but classifies 188 as REDUNDANT without checking these readers.
   - Change: list both readers in Risk 6 and the thinning row. Keep the three-state rule (designated token / `none` / `fix` when silent) intact.

5. **The "~2 900 after" figure is a guess, not a subtraction.**
   - WIRE (1 406) + ACTION (1 055) = 2 461. That leaves about 440 words for the 2 056 REFERENCE words, an implicit 79 % cut of REFERENCE that the per-section shortenings shown do not add up to.
   - The constraint holds regardless: the template is 374 words, so any thinning above 374 suffices.
   - Change: show the per-section after-figures, or state a range (for example 3 000–4 500), and note that the constraint survives the pessimistic end.

6. **The verdict overstates what reaches the progress line.** The verdict says "the 5–6-line return is appended to the run's progress line (`unit_loop_core.md:80`)". Step 6 appends `committed: <sha> <subject>` plus the `already-[x]` / `staged: index-only` / disposition clauses only, not the whole return.
   - Change: reword.

## Nice to Have

1. `scripts/push-branch.sh` is 1 119 words in this repository. The adopter-shipped `cli/templates/scripts/push-branch.sh` is 1 903. Note which one is counted.
2. The allow-list citation `settings.autonomous.json:20-48` stops before the wrapper entries (`:54-59`) and the `ask` block. Cite `:20-87` for "absent from every list".
3. The fixed-form subject citation `.claude/context/conventions.md:172-185` misses `:186`, where `chore: Mark UI test K passing for <branch>` sits.
4. Lead 11 (embed in an artifact already committed): for the committer, that artifact is the commit message itself. Say so explicitly, since it is the real reason goal (a) is already met.

## Bug claims

- **"`cp` is absent from the unattended allow list; copying stalls" — CONFIRMED.** No `Bash(cp…)` entry in `cli/templates/claude/settings.autonomous.json:20-87`. No generator fragment adds one (`grep -rn 'Bash(cp' cli/src` returns nothing; `permissionProfile.ts:12` mentions `cp` only in the no-compound rationale). Stall-not-refusal: `settings.autonomous.json:4`. The caveat in Should Fix 1 applies: the redirect route is not closed.
- **Subject-reconciliation risk ("index-only signal silently breaks") — CONFIRMED.**
  - The test is "does the staged set contain any path other than `plan_path` and the unit's own detail file?" (`committer.md:83`). Untracked reports enter the set through `committer.md:111`.
  - The signal's consumers are `unit_loop_core.md:80` (step 6, `staged: index-only` appended verbatim) and `improvement_observations_instructions.md:72` (row (d), which matches `mark ` … ` done — `).
  - Disposition records survive: they move to a body line, "never in neither" (`committer.md:84`; `improvement_observations_instructions.md:91`). So only the no-disposition index-only case is lost, as the report says.
  - Partly pre-existing: see Should Fix 2.
- **"Nothing in `committer.md` tells it how to read only that section" — CONFIRMED.** `committer.md:27` describes `<commit_conventions>` as "the commit-policy section of the shared conventions document" and gives no path, heading or line hint. Only `.claude/CLAUDE.md` → `## Context files` says "reads exactly one section".
- **"Post-commit ticks C11–C13 dirty a tracked file and fail step 5's clean check" — CONFIRMED.** `committer.md:127`; untracked-only tolerance at `plan_orchestration_instructions_autonomous.md:281`.
- **"`ui_test_pass` / `review_plan_file` leave other agents' reports behind" — CONFIRMED.** `committer.md:148,150-155` (one file only) and `:113` (index + folder + meta folder only).

Counts checked: every Read-tree figure matches `wc -w` (8 100 / 1 695 / 1 320 / 5 864 / 585 for lines 155–193 / 2 272 / 1 119 / 9 143 / 1 251 / 7 201 / 42 067). Every per-section classification total matches `sed -n | wc -w`. The class columns sum to 8 100. The ledger arithmetic holds: 10 380, 5 554, 5 180 and 15 659 are all correct. The template measures 376 words with its fences (claimed 374). Report length is about 2 950 words excluding the template, and all fixed headings are present.
