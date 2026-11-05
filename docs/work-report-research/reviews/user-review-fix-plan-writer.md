# Review — user-review-fix-plan-writer
verdict: FAIL

## Must Fix

1. **The classification column totals are wrong.** The total row gives ACTION 751 / REFERENCE 1 451 / WIRE 1 070 / REDUNDANT 823. Summing the report's own per-row cells gives **662 / 1 401 / 970 / 1 062**, and the four columns still total 4 095. ACTION is off by 13 %, WIRE by 10 % and REDUNDANT by 23 %. Every per-row figure re-measures exactly (`sed -n 'a,bp' plugin/agents/user-review-fix-plan-writer.md | wc -w` matches all 30 rows), so only the total row is wrong.
   - **Change:** correct the total row (report :92) and the verdict's "about 1 000 are redundant" (:5). The measured REDUNDANT figure is 1 062 on its own, without the "+≈200 shortenable REFERENCE".
   - **Change:** reconcile the thinning plan with the corrected totals. The plan cuts 1 645 words while measured REDUNDANT is 1 062, so about 580 words of REFERENCE or WIRE are shortened. Name the rows they come from: 77–89 cuts 202 against 96 REDUNDANT, and 97–109 cuts 184 against 68.

2. **"Shared with 13 agents" is wrong.** The claim appears at report :91 ("The two line formats and `call stands` are shared with 13 agents"), and :176 repeats the "13 sharers" figure.
   - **Evidence:** `grep -l "rejected round" plugin/agents/*.md | wc -l` → 4. `grep -l "call stands" plugin/agents/*.md | wc -l` → 8. `grep -l "Rejected findings" plugin/agents/*.md | wc -l` → 8, and 12 across all of `plugin/`.
   - **Change:** use 4 for the line formats and 8 for `call stands`. Re-check the shared-base sizing argument against those numbers.

## Should Fix

1. **The `lessons.md` gap is framed as supervised-only, but it hits the autonomous fork too.**
   - Override 3's explicit list (`plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md:84–91`) omits `lessons.md`.
   - In autonomous runs, the first Phase A `review_item` committer therefore sweeps it in as a "code file shown by `git status --short`" (`plugin/agents/committer.md:111–112`).
   - The sweep flips subject reconciliation to **Yes** (`committer.md:83`). That suppresses `staged: index-only` and mislabels a disposition-only first commit.
   - **Change:** move the point at report :236–238 out of the "Supervised" bullet. Recommend adding `<state_dir>/lessons.md` to Override 3's list as the autonomous fix. Rewrite open question 3 to cover both forks.

2. **The template contradicts the no-write paths.** S3 ("Open this report — `Write` it to …") runs before R1/R5. A `## Questions` dispatch or a `blocker:` dispatch therefore writes the report file *and* returns it inline. The report says those paths "write no file" (report :101, :227–231). In an autonomous park, the result is an untracked file left in the worktree.
   - **Change:** defer the first `Write` until after R5 / the blocker check, or let S3 hold the report in memory until W1.

3. **Lead 12 (evidence leakage) is not addressed.** The writer builds every path from an absolute `<repo_root>` (agent :97, :120). The evidence slots W5 `index=…; folder=…`, R2 `path read` and R4 `evidence file:line` will therefore carry home-directory paths into a file that Override 3 commits.
   - **Change:** add "repo-relative paths only; no timestamps or env output" to the template header line. Add a lead-12 paragraph under Storage.

4. **Lead 13 (read-list conflict) is not addressed.** The auto-loaded `.claude/CLAUDE.md` table says to read `context/conventions.md` (5 864 words) for "Any implementation, review or planning". The definition says "Never read all of them up front" (agent :68).
   - **Change:** state which instruction wins and, if `CLAUDE.md` does, the larger up-front total. The delta is unchanged, but the before/after figures change.

5. **The inline report on no-write paths can be mistaken for parsed lines, and its headings clash.**
   - The template's first line is an H1 (`# Work report — …`) and its sections are H2s (`## Setup` …). Returned "under `## Work report`", that produces sibling and parent headings in the agent's reply.
   - R5's description carries the literal `fix_plan_file: (pending — questions for user)` and `## Questions`. On a `blocker:` return, which has no contract block (agent :75), the only `fix_plan_file:` text in the reply would sit inside the report. A caller could then read a blocker as a questions park. The core parses named fields (`user_review_fix_plan_writing_instructions_core.md:165–169`), and step 6 keys on a `## Questions` section (core :89).
   - **Change:** inline, return only the ticked IDs and their evidence (no headings above H3, no template prose), or strip the wire literals from the R5/O2 descriptions.

6. **Goal (a) on no-write paths is unowned.** An inline report persists only if the orchestrator saves it, and nothing in the plan says who saves it or where. A `## Questions` round is exactly where evidence of what was read matters.
   - **Change:** name the keeper. For example, the autonomous fork appends it to `question_<n>.md` (`…_autonomous.md:44`). Otherwise admit that goal (a) is nil on those paths.

7. **The constraint margin is thin under the conservative case, and the report does not show it.**
   - If the samples stay up-front and thinning removes only measured REDUNDANT (1 062): 9 102 − 1 062 + 673 + 250 = **8 963** (−1.5 %).
   - In revision mode: 4 095 − 1 062 + 673 + 250 + 1 695 + 154 = **5 805** against 5 944.
   - The mechanism alone costs +923 and holds only because of thinning.
   - **Change:** add this row to the ledger, and attribute the saving explicitly. The samples move (−1 959) is the bulk of it, and it is independent of the report mechanism.

8. **The "after" estimate for the definition is not grounded by a draft.** Per-section targets are given but not derived (see Must Fix 1).
   - **Change:** either draft the two largest sections (12–27, 97–109) and count them, or label every after figure as a target.

9. **The template has gaps against the procedure.**
   - No item covers the `blocker:` path (agent :75).
   - The revise branch has no Questions stop, although the core re-enters step 6 after every revision (core :117, :143, :153).
   - "Never edit a readiness section you did not author" (agent :103) is missing.
   - **Change:** add B1 (blocker), add a V0/V-stop item, and fold the authorship rule into W2.

10. **The item count is wrong.** The template has **23** items (`grep '^- \['` over report :104–142), not 24 (report :101). Fix the number.

11. **The report is over length.** Excluding the template it is 3 901 words (`sed -n '1,103p;144,400p' … | wc -w`), against the 1 500–3 000 target.
    - **Change:** trim the Storage and Risks prose.

## Nice to Have

1. A rule citation is mis-quoted. Report :232 quotes `Write(//{{repoRoot}}/**)`; the source uses a single slash: `Write(/{{repoRoot}}/**)` (`cli/templates/claude/settings.autonomous.json:50–51`).
2. Report :82 cites `remote-run.sh:458` for `[x] **Finding <K>**`. The literal is at :455.
3. Report :234 cites `…_autonomous.md:85` for warn-and-skip. The text is at :87, :93 and :100.
4. The read tree omits `layer-reviewer.md`, which is cited at agent :10. Like `branch-reviewer.md`, it is not read, but list it for completeness.
5. Report :87 says :117 is the only new content in the quality checks. Agent :113 also adds "grep-verified", which W3 carries, and :118 spells out the forbidden set. Soften the claim.

## Bug claims

1. **The plan-gate counters reset per round over flat folders, so round 2 overwrites round 1's `review_0.md`.** **CONFIRMED.**
   - Core :97 and :123 set `parity_iteration = 0` and `arch_iteration = 0` on every gate entry. Core :103 and :129 give flat `<branch>/` folders.
   - `plugin/agents/architecture-reviewer.md:83–84` writes `<findings_folder>/review_{iteration}.md`. It uses the "next free index" only "at the gates that resolve it that way", and this gate does not.
   - `…_autonomous.md:93` claims "a later round appends findings into the same folder". That is false given the reset.
   - On-disk evidence: `harness-runs/architecture_user_review_reviews/*/` holds only `review_0.md` and `review_1.md` per branch.
   - In the supervised fork nothing commits round 1's copy (`…_autonomous.md:73`), so there it is lost outright, not merely overwritten in the working copy.

2. **`lessons.md` is never committed by either fork.** **CONFIRMED as worded** ("no instruction commits it"), but the consequence is wider than the report says.
   - `grep -rn lessons plugin/instructions plugin/commands plugin/agents/committer.md` hits only `run_mode_instructions.md:39`, a citation of a ledger rule.
   - Override 3's explicit staging list (`…_autonomous.md:84–91`) omits it, and the supervised fork commits nothing.
   - The file is not lost, though. It is swept into the first Phase A `review_item` commit by `committer.md:111–112` ("the code files shown by `git status --short`"), and this happens in **both** forks, which corrupts reconciliation (`committer.md:83`).
   - It cannot dangle on a zero-finding round, because lessons are appended only for valid observations (agent :120).
   - A gate-cap park after step 6 (`…_autonomous.md:44`) leaves it modified at session end.
   - **Not verified:** whether a `github-actions` job boundary at that park loses it.
