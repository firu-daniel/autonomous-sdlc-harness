# Review — architecture-reviewer
verdict: FAIL

Counts re-run and matching: every Read-tree figure (`wc -w`: agent 5 139, CLAUDE.md 1 695, cli/plugin/conventions 2 647/4 174/5 864, lessons 1 199, test-run section 732, point 4 = 90, test-fix bullet 85); all 17 section counts (`sed -n | wc -w`) sum to 5 139; A/R/W/D columns sum to 872/2 161/1 009/1 097 and every row sums to its total; template = 692 words, 25 items; thinning rows sum to 2 969; shared-line counts within 1.5 % (`grep -Fxf`: 1 505 vs 1 495 for business-parity). Up-front constraint math is arithmetically correct.

## Must Fix

1. **Template item R1 commits an absolute home path; lead 12 is never addressed.** R1 asks for `→ root`, the output of `git rev-parse --show-toplevel` (an absolute path under `$HOME`). The report then has the report committed at every IP. The harness's own gate 6a fails on any tracked file containing `$HOME` (`scripts/run-gates.sh:141`, `:143 gate_silent "6a no machine paths"`), and the agent itself states this rule (`plugin/agents/architecture-reviewer.md:131`: "a tracked file naming the home directory fails the next gate run"). Lead 12 appears nowhere in the report (grep for `absolute|home|lead 12` finds only the agent's own text). **Change:** drop the evidence from R1 (or require it repo-relative, e.g. `→ layers: cli, plugin, general`). State a no-machine-paths/no-timestamps rule for every evidence tail and add lead 12 to Risks.

2. **Lead-1 premise is wrong, and the thinning plan removes the guard that the correction makes necessary.** Storage → Tools says "Tick-as-you-go means re-`Write`-ing the whole file per tick (25 × ~700 words)", and Verdict point 2 gives "The agent has no `Edit`" as the reason. Per the brief's correction, `Bash(sed:*)` is allowed unattended (`cli/templates/claude/settings.autonomous.json:39`) and the only hooks are `Bash`-matcher guards that do not block `sed -i` (`plugin/hooks/hooks.json`). So in-place ticking is possible, and the single end-`Write` is a choice, not something forced. Because `sed -i` is available, the agent's line "Do not treat it as an oversight to work around" (`architecture-reviewer.md:10`) is the only thing that stops a reviewer from editing plan files through Bash. The thinning plan classes the `:10` second half as REDUNDANT and removes it (Prose classification row "Intro"; Thinning plan row "Intro"). **Change:** restate the rationale for one end-`Write` as a choice (fewer calls; read-only posture), noting that `sed -i` would work. Keep `:10` verbatim and move its ~63 words from D to W/R. Update the after-count, which changes by about 60 words and still holds.

## Should Fix

1. **K10's ref is unconditional, and point 4 is not self-contained.** The report lists K10 among "conditional" refs (line 115) and books the test-run rule as 0 up-front / 90 on demand. But K10 applies on every plan-mode dispatch (IP1, IP3, IP4) and in diff mode too (`architecture-reviewer.md:152`), so in practice it is read up front. Point 4 also says "conditioned on (3)" (`unit_loop_core.md:150`), so a correct read needs point 3 as well (60 words, `:149`), about 150 words in total. **Change:** count about 150 as up-front in the ledger (new agent-owned delta about −2 060, constraint still holds) and stop calling K10 conditional.

2. **Wrong line citation for point 4.** The report cites `unit_loop_core.md:148–150` as "90 words". Point 4 is `:150` alone: `:148` is point 2's trailer and `:149` is point 3, and `:148–150` is 166 words. **Change:** cite `:150`.

3. **PASS-wording sites: one wrong line, one missed.** "The agent wrote no file" for A2 is at `plan_orchestration_instructions_core.md:245`, not `:243`. The report also misses `plan_orchestration_instructions_autonomous.md:191` ("the reviewer's `verdict: PASS` with no file written"), which sets the `*g` flip rule, A2g included (`:181`). **Change:** fix the cite and add `:191`, giving 5 sites, not 4.

4. **The template misses one of the agent's three Must Fix sources.** For sub-case (c), the agent must raise any quoted absolute checkout-root or home path in the test fix plan index or a `finding_<N>.md` as a Must Fix (`architecture-reviewer.md:131`, `:163`). G2 covers only the agent's own quoting. **Change:** add a conditional check item: "(c) only: raise each absolute or home path quoted in the test fix plan."

5. **O1 contradicts the narrowed contract.** O1 says "PASS: n/a, write nothing", yet the proposal writes a work report on PASS (Verdict point 3). **Change:** reword to "PASS: n/a, write no findings file."

6. **Leads 8 and 11 are not evaluated, and verdict condition 4 may be unnecessary.**
   - **FAIL paths:** every FAIL path already writes a committed artifact. A trailing `## Work report` section in `review_<iteration>.md` (IP1, IP3, IP4) or in the IP2 index would ride existing commits: `task_plan_writing_instructions_autonomous.md:153`, `user_review_fix_plan_writing_instructions_autonomous.md:107`, A2.2 `review_plan_file`, and G.3 `meta_findings_folder`. No new paths would be needed, and there would be no committer reconciliation problem.
   - **PASS paths:** an inline report in the return would keep "writes nothing on PASS" and remove the IP2 PASS orphan, at the cost of the parsed-return contract (`:36`).
   - **What to weigh:** the consumer-misread risk for each option. The upstream writer applies the findings file's sections, and the committer reads only the readiness list.
   - **Change:** add both alternatives to Storage and lifecycle, and re-justify the verdict's change 4 against them.

7. **The "after" estimates are not drafted.** The 2 970 figure is a sum of per-section guesses, with no drafted text and no sentence-level subtraction shown. The constraint survives large error: after Must Fix 2 and Should Fix 1, thinning needs to cut only about 170 words of the definition. **Change:** state that margin explicitly so the constraint does not rest on the estimate.

## Nice to Have

1. `cli/test/remote-deliver-threads.test.mjs:124` keys the readiness heading inside a user-review fix-plan fixture, not an architecture index. Say "the heading literal is keyed".
2. The template has no conditional item for `phases.docs` / `<docs_retrieval>` (`architecture-reviewer.md:117–118`; "navigation, never evidence"). It is n/a in this repo but owed for adopters with docs on.
3. The body runs about 3 090 words excluding the template, slightly over the 3 000 target.
4. The same IP3 collision applies to the parity gate (`user_review_fix_plan_writing_instructions_core.md:97`, `parity_iteration = 0`, a folder with no round). Mention it in Open question 3.

## Bug claims

- **IP3 findings collide across user-review rounds: CONFIRMED.**
  - The findings folder carries no round: `<state_dir>/architecture_user_review_reviews/<branch>/` (`user_review_fix_plan_writing_instructions_core.md:129`).
  - `arch_iteration = 0` is set every round (`:123`).
  - Each round's folder is committed (`user_review_fix_plan_writing_instructions_autonomous.md:107`).
  - Nothing clears or rounds the folder: `grep -rn architecture_user_review_reviews plugin/` shows only these sites plus read-only `branch-status.md:44`.
  - So round 2's first FAIL rewrites round 1's tracked `review_0.md`. History keeps round 1's file, but the working copy loses it.
- **Reusing `iteration` as the report index would collide at IP1 and IP2: CONFIRMED.** These are design observations, not existing bugs.
  - IP2 always passes `iteration: 0` (`plan_orchestration_instructions_core.md:237`, A2.1 block).
  - At IP1, `iteration` is the next free `review_<n>` (`task_plan_writing_instructions_core.md:147`), and a PASS writes no file, so the index repeats.
- **An untracked IP2 PASS report gets swept into the next unit-loop commit: CONFIRMED as reasoning.** The committer stages "the code files shown by `git status --short`" with no `<state_dir>` exclusion (`committer.md:111–112`; no `untracked` or exclusion rule in `committer.md`). The reconciliation test at `:83` would then see other paths staged.
- **The A2 diff exclusion pathspec excludes `work_reports/<branch>/…`: CONFIRMED.** The pathspec is `':(top,exclude)<state_dir>/*<branch>*'` (`architecture-reviewer.md:109`). Without `:(glob)`, git's `*` matches across `/`.
