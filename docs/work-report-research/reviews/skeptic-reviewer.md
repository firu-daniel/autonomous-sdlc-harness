# Review — skeptic-reviewer
verdict: FAIL

## Must Fix

1. **`## Adversarial checks` is undercounted by 140 words (16 %), and the "headings excluded" note that explains it is false.**
   - Evidence: `sed -n '97,123p' plugin/agents/skeptic-reviewer.md | wc -w` → **993**. The report gives 853 (report:69, :15, :136).
   - Every other row was measured with its heading included. For example, `sed -n '12,14p' | wc -w` → 137, which matches the report's row, and that row includes `## What you are NOT`. The 20 measured ranges sum to 5 372, which matches `wc -w` for the file.
   - So the report's 5 232 total, and its claim that "Headings and blank lines (≈141) are excluded" (report:54), just reflect this one wrong row. Nothing was excluded.
   - Change:
     - Set the row to 993 and re-split its classes. ACTION/REFERENCE grow by about 140.
     - Set the total to 5 372 and delete the ≈141 sentence.
     - In the thinning plan, change the Adversarial checks "after" to about 900, since the plan keeps all five checks and cuts only the ~93 anecdote words.
     - Carry this through: body after ≈ 3 880, agent-owned delta ≈ −1 040, fixed up-front total ≈ 19 910.
     - Fix the "853-word" figure in `## Verdict`.
     - The constraint still holds.

2. **The adjust-dispatch frequency is misread from the run artifacts.**
   - Evidence: `review-plan-reviewer` writes no file on PASS (`plugin/agents/review-plan-reviewer.md:64`, `:177` "Do not save a file when PASS"). So every `review_<i>.md` under `harness-runs/skeptic_review_plan_reviews/` is a FAIL, and each FAIL produced one Adjust re-dispatch (`plan_orchestration_instructions_core.md:387`).
   - The tree holds 4 such files: `feat_forge_run_control/review_0`, `feat_forge_run_triggers/review_0,1` and `fix_remote_job_permission_profile/review_0`. That is 4 adjust dispatches across 30 FAIL branches, not "only one" (report:41) or "about 1 in 30" (report:165).
   - Change: state "4 adjust dispatches over 30 indexed branches, ≈1.1 reports per FAIL branch, ≈1.09 per branch overall". The cost conclusion is unchanged.

3. **The template's header line mimics the verdict wire literal, and on PASS that line ends up in the parsed return.**
   - Template line `verdict: <PASS|FAIL>   must_fix_count: <n>   excluded_run_artifacts: <N>` (report:98).
   - On PASS the report proposes returning the filled template as `## Work report` **above** `verdict: PASS` (report:13, :180). The return would then carry two lines that begin `verdict: PASS`, one of them decorated.
   - The definition says the caller matches the verdict line exactly and that "a reworded or decorated verdict strands the flow with no error message" (`skeptic-reviewer.md:62`). The caller parses on that string (`plan_orchestration_instructions_core.md:364-365`). The review brief also bars template items that paraphrase a wire literal.
   - Change:
     - Rename the header field so no line in the report starts with `verdict:` (for example, `outcome: pass|fail`).
     - Add to the wire-change list (report:180) that C2.1's parse must take the **last** `verdict:` line, or the line outside any `##` section.

## Should Fix

1. **Lead 1 premise.** The report says "tick-as-you-go means a full `Write` per tick" (report:170) and reasons "Write once … The agent has `Write` but no `Edit`" (report:10).
   - Both rest on the corrected premise. `Bash(sed:*)` and `Bash(cat:*)` are allowed (`cli/templates/claude/settings.autonomous.json:36`, `:39`), so `sed -i` ticking is possible.
   - The write-once conclusion still holds, for better reasons that the report should state instead:
     - (a) on PASS the agent may touch no disk at all;
     - (b) `sed -i` ticking would work around the deliberate, tool-level read-only guarantee at `skeptic-reviewer.md:10` ("Do not treat it as an oversight to work around");
     - (c) tick timing is unverifiable anyway.

2. **"PASS leaves no trace at all today" is overstated** (report:7).
   - The autonomous ledger flips `C2g`/`C2m`/`C2f` with text that records the clean pass (`autonomous_pause_and_ledger.md:82-84`, `plan_orchestration_instructions_autonomous.md:184`). D.2 prints "passed clean (no net-new findings)" (`core:676`).
   - What is missing is evidence of *which checks ran*, not a record that the stage passed.
   - Change: reword to that. Also note that semi-autonomous runs, which keep no ledger, do lack even the stage trace.

3. **The PASS-path report is not durable.**
   - "Retained … to D.2" (report:180) means the report lives only in the session's Done summary. That summary is chat output, not a committed artifact (`core` → `### D.2 Done summary`).
   - D.2 also concedes that a session re-entered after a pause cannot state figures it did not itself walk (`core:669`). A pause between C2 and D therefore loses the PASS report entirely.
   - On PASS, goal (a) ("durable record") is not met by this design.
   - Change: say so in Verdict and in Risks. Open question 1 should weigh adding the evidence to the `C2g` ledger flip line (autonomous) as the durable alternative.

4. **A downstream reader is missing.**
   - `/branch-status` globs the branch under `<state_dir>/skeptic_reviews/` and scans review artifacts for `deferred`, `assumption`, `BLOCKED`, `unreachable` (`plugin/commands/branch-status.md:43`, `:45`).
   - A `work_report.md` in the findings folder would feed that scan. Item S9's own text contains "deferred-work marker".
   - Change: add `branch-status` to "Downstream readers" (report:46-50) and give it the same "ignore `work_report*.md`" clause proposed for `review-plan-reviewer`.

5. **Lead 12 (evidence leakage) is not addressed.**
   - The agent builds every path from `<repo_root>` and writes "with `Write` and absolute paths" (`skeptic-reviewer.md:186`, `:23`). The S2/S7/S9 `Evidence:` fields would therefore naturally carry absolute worktree paths into a committed file.
   - Change: add "repo-relative paths only; no timestamps" to the work-report instruction (report:141).

6. **Blocker mode is unhandled.**
   - S3 says "unreadable → `blocker:` line, write nothing" (report:102), but the mode list (report:117-121) does not say where the report goes on a blocker.
   - The definition says the `blocker:` line replaces the verdict and no files are written (`:81`).
   - Change: state that on a blocker the report is returned inline above `blocker:`, the same as on PASS, or is omitted.

7. **S5 relocates a wire element.**
   - "record the excluded count in the header" (report:104) points to the report header. The definition requires the count in the **index's Context paragraph** as `"N run-artifact files excluded from the reviewed diff."` (`:90`, `:148`).
   - Change: "…in the index Context paragraph (FAIL) and the report header".

8. **The "after" estimates are subtraction estimates, not drafts.**
   - The largest cut, Resolved values 774 → 330 (report:132), was neither drafted nor counted. The report does not say this plainly.
   - The constraint margin (~1 040 words of cuts against the +492 the mechanism costs) is large enough to absorb error.
   - Change: label the column "estimated, no draft", and state the minimum cut needed: 492.

## Nice to Have

1. `core:365` is cited for the caller's reliance on PASS (report:176). Line 365 is the FAIL arm; the PASS arm is `:364`.
2. Lead 13 (CLAUDE.md read list) is not discussed explicitly. `.claude/CLAUDE.md` names the same set (`conventions.md` plus the per-layer files plus `lessons.md` for branch-level review), so there is no conflict. Say so in one line.
3. The `mcp__harness-docs__search_docs` locator-only rule (`:77`, `:79`) has no conditional item. It is inert here (`phases.docs: false`), but a docs-enabled adopter loses its tick. Add an `n/a`-able item or fold it into S6.
4. An adjust dispatch that removes every finding (meta-review drops all of them) is not covered by the k-index scheme or the mode list.

Verified without finding (spot-checks): `skeptic-reviewer.md:10, :14, :23, :60, :62, :75, :76, :81, :87, :90, :93, :99, :102, :107, :116, :152, :160, :178, :194`; `committer.md:45, :89, :113`; `core:360, :367, :387, :676, :681`; `review-plan-reviewer.md:82, :108`; `autonomous_pause_and_ledger.md:82-84`; `plan_orchestration_instructions_autonomous.md:161, :184, :309`; `run_mode_instructions.md:83`; `docs_orchestration_instructions_autonomous.md:24`; `unit_loop_core.md:202` and `## The test-run rule` (732); `dispatch_discipline_instructions.md:68, :72`; `hooks.json` (sole matcher `Bash`); `settings.autonomous.json:45, :50`.

Read-tree counts all match `wc -w`: 5 373, 1 695, 2 647 + 4 174 + 5 864 = 12 685, 1 199, 1 146 + 377. The fixed total of 20 952 is correct. The template measures 452 words. The 30/44 skeptic-index vs code-review count is correct, and the 14 missing branches show a `C2g` PASS flip in their ledgers. `git ls-files -- ':(top)harness-runs/*feat_forge_run_control*'` → 109, and the result includes nested paths. Report length ≈ 2 930 words excluding the template. All fixed headings are present.

## Bug claims

The report makes no pre-existing-bug claims. It notes the `<app_dir>` row is "bound for completeness — no step consumes" it. That is the definition's own statement (`skeptic-reviewer.md:23`), not a bug: CONFIRMED as described, and not a defect.
