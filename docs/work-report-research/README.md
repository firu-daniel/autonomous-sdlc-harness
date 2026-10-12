# Work-report research — synthesis

Research only; nothing under `plugin/`, `cli/` or `schemas/` changed. One report per agent definition in this folder, each written under [`_brief.md`](_brief.md), reviewed under [`_review_brief.md`](_review_brief.md) (reviews in [`reviews/`](reviews/)), then revised by its author. Every report ends with a `## Review response` section; no review finding was rebutted.

## User verdict

**Work reports are dropped.** No work report lands on any agent, not even the pilot below.

Why:
- **A report cannot be checked.** Nothing shows when an agent ticked an item or whether it did the step honestly. A checklist ticked at the end proves no more than the agent's own reply does.
- **It costs the agent more than it gives.** It means another file to write and keep in sync, and the agent goes back and forth between the report and the actual work. It also adds words to every dispatch. That is the opposite of goal (c).
- **The goal it was meant to serve is reached without it.** Agents follow their rules more reliably when the rules are short, direct and stated once. That is thinning, not a new mechanism.

What remains from this research is in *Follow-ups* below. The research verdict after it is kept as written.

## Follow-ups

Fix the bugs first, then thin. Each step gets its own task prompt and branch.

**1. Fix the pre-existing bugs.** Fix the ten defects in *Pre-existing bugs found along the way* in one fix task. This goes before any thinning, because both touch the same agent and instruction files.

**2. Base session.** This is the only thinning step whose edits reach every agent, so it lands before any family session:
- **Blocks copied across families.** Thin each block that appears word for word in several agent definitions once, and apply the result to every copy. Examples: `## Unsolicited dispatch guidance` (10 agents), the `<repo_root>` row (11 agents), the docs-tool paragraph and the shared `## Resolved values` rows. The copies stay in each definition (`dispatch_discipline_instructions.md` → `## The receiving side`). A base file read up front would move words rather than cut them.
- **Shared instruction files.** Thin the sections of the instruction and sample files that agents from more than one family read, such as `unit_loop_core.md`, `plan_orchestration_instructions_core.md`, `task_plan_writing_instructions_core.md` and `sample_code_review.md`. Keep every cited anchor and wire literal.
- **Read-list precedence.** Add one sentence to each agent definition whose read list is narrower than `CLAUDE.md`'s routing table, saying the definition's list wins. Do not add it to `CLAUDE.md` or its template, because not every agent needs it.
- **Thinning rule.** Record the writing rule in the plugin layer's conventions document, so that every family session's implementer and reviewers apply the same standard. The rule: direct instruction points, each rule stated once, no rationale an agent does not act on, and a lower up-front word count.

**3. Family sessions.** Run one per family, after the base session has merged. A reviewer that grades against its writer's definition is thinned in the same session as that writer. The families share no files with one another, so their prompts can be written together. Each session measures word counts again from the current `main`, and uses its agents' *Prose classification* and *Thinning plan* sections here as input.
- **Task plan:** task-plan-writer and task-plan-reviewer.
- **Unit loop:** layer-implementer, layer-reviewer and committer.
- **Branch review:** branch-reviewer, skeptic-reviewer and review-plan-reviewer.
- **Plan/diff gates:** architecture-reviewer and business-parity-reviewer. They share about 1 500 identical words.
- **UI tests and QA:** ui-tests-plan-writer, ui-tests-plan-reviewer, qa-tester and the two mobile stubs. The largest saving is reading only qa-tester's capability set.
- **Fix-plan and statistics writers:** user-review-fix-plan-writer, test-fix-plan-writer and statistics-plan-writer.
- **Docs:** docs-writer and docs-reviewer.
- **Conventions:** conventions-writer and conventions-reviewer, together with their caller `harness-analyze.md`.

The orchestrator instruction files that no agent reads are out of this series.

## Verdict (research)

**Do it in two steps, and do not expect the work report itself to thin anything.**

1. **Thin first, with no new mechanism.** Each agent definition carries roughly 25–35 % redundant prose: rules restated in several sections, rationale an agent does not act on, a 10-way identical `## Unsolicited dispatch guidance` block, and whole sibling files read where a few sections are used. Cutting that meets goal (c) and the word-count constraint for every agent on its own.
2. **Then pilot the work report on the few agents where evidence is worth most and wiring is cheap** (see *Where to pilot*), and measure whether it catches skipped steps before rolling it out.

Why not all at once:
- **The mechanism always adds words.** A template is 270–940 words per agent. Without the thinning it breaks the hard constraint: `ui-tests-plan-writer` goes from 23 127 to 24 029 with the report alone.
- **Action prose is a small share of each file.** For example, 610 of the skeptic's 5 373 words and 1 055 of the committer's 8 100. Moving actions into a checklist barely shortens anything; the savings come from deduplication.
- **Goal (a) is weaker than it looks.** Nothing reads a report during a run, and an agent can tick every box at the end. A report proves work only through the **evidence lines** it demands: verdict lines, hit counts, `file:line`, pasted test results.
- **Goal (b) is plausible but untested.** A checklist item is harder to skip than a sentence buried in prose. But where reviewers grade against "reference" prose, moving it behind a `ref:` makes it more likely to be under-read.

| Verdict | Agents |
|---|---|
| Recommend with changes | 19: task-plan-writer, task-plan-reviewer, layer-implementer, layer-reviewer, branch-reviewer, review-plan-reviewer, skeptic-reviewer, architecture-reviewer, business-parity-reviewer, ui-tests-plan-writer, ui-tests-plan-reviewer, qa-tester, user-review-fix-plan-writer, test-fix-plan-writer, statistics-plan-writer, docs-writer, docs-reviewer, conventions-writer, conventions-reviewer |
| Do not recommend a report — thin only | 3: committer (the commit *is* its record; ticks after the commit dirty the tree), qa-tester-mobile-maestro, qa-tester-mobile-mcp (stubs: `Read`-only, never dispatched by a shipped flow) |

## Word counts (up-front words per dispatch, before → after, estimates)

The baselines differ between reports: some count `CLAUDE.md` and the conventions documents, some count only the agent's own share. Each report's `## Word-count ledger` states its basis. Only the templates and a few sections were actually drafted and counted. The other "after" figures are section-by-section subtractions, so treat them as estimates. The hard constraint holds in every report; the margin is thin only where noted.

| Agent | Before | After | Note |
|---|---|---|---|
| task-plan-writer | 26 291 | ~22 452 | |
| task-plan-reviewer | 25 853 | ~21 938 | |
| layer-implementer (`plugin` layer) | 18 818 | ~15 287 | |
| layer-reviewer (`plugin` layer) | 15 884 | ~14 394 | |
| committer | 10 380 | ~6 342 | thinning only |
| branch-reviewer | 23 277 | ~21 480–21 740 | |
| review-plan-reviewer | 21 523 | ~20 325 | |
| skeptic-reviewer | 20 952 | ~19 798 | |
| architecture-reviewer | 21 450 | ~19 530 | |
| business-parity-reviewer (plan mode) | 21 270 | ~19 351 | |
| ui-tests-plan-writer (notes-app) | 23 127 | ~14 619 | 79 % of the saving is reading only qa-tester's capability set |
| ui-tests-plan-reviewer (notes-app) | 22 532 | ~10 859 | **report-only path:** 21 761, thin margin |
| qa-tester | 21 735 | ~19 188 | |
| qa-tester-mobile-maestro | 1 183 | ~470 | thinning only |
| qa-tester-mobile-mcp | 1 337 | 360 | drafted; thinning only |
| user-review-fix-plan-writer | 9 102 | ~6 405 | **conservative case:** −77 only |
| test-fix-plan-writer | 6 105 | ~4 664 | |
| statistics-plan-writer | 6 145 | ~4 833 | |
| docs-writer | 18 017 | ~17 166 | |
| docs-reviewer | 13 726 | ~13 103 | |
| conventions-writer (body) | 4 990 | ~3 918 | |
| conventions-reviewer | 12 321 | ~8 724 | |

## The proposed design, and what replaced it

The idea as briefed was: copy a template file to `<state_dir>/work_reports/<branch>/<phase>/<agent>/report_<index>.md`, then tick it at each step. The research found that this shape breaks the harness in several places:

- **The copy is blocked.** `cp` is not on the unattended allow list (`cli/templates/claude/settings.autonomous.json:36–51`). `sed`, `cat`, `mkdir -p`, `Write` and `Edit` are allowed.
- **A new untracked file wrecks the commit checks.**
  - The committer stages everything `git status --short` lists. Its subject-reconciliation test then always sees "other paths staged". That hides the `staged: index-only` and disposition signals that `unit_loop_core.md:80` and the improvement-observations step read.
  - Fixed-path commits (the planning commit, `ui_test_pass`, `review_plan_file`, Override D) leave the file out. It is then swept into an unrelated later commit or left behind, which breaks the clean-tree invariant.
- **Files beside `review_<i>.md` are miscounted.** A report placed there is counted as a round by `fw_round_count` (any `review_*` name) and by the trip-wire and observation round counts, which list the folder. `review-plan-reviewer.md:108` flags it as an orphan Must Fix.
- **Several reviewers must write nothing on PASS.** About ten of them are contractually barred from touching disk on PASS. A report on every dispatch is a wire change at up to 12 sites per agent, both in the agents and in their callers.
- **The `<phase>` key is not available.** Ledger ids exist only in autonomous runs, are shared between gates (`P1`) or carry no round (`R1`, `G`), and the agent never sees them.

**The design the reports converged on:**

1. **Embed the template in the agent definition.** No copy step, no separate template file to keep in sync. Exception: `ui-tests-plan-writer` keeps a separate plugin file, read after its phase gate.
2. **Write the report once, or at 2–4 checkpoints, never per item.** `sed -i` ticking would work, but read-only reviewers would then be editing in place. That works around their deliberate "no `Edit`" guarantee, and tick timing cannot be verified anyway.
3. **Put the report where the flow already writes and commits.**
   - A trailing `## Work report` section of the artifact the agent already writes: the findings file on FAIL (layer, architecture, parity and task-plan reviewers), `review_<i>.md` every time (docs-reviewer), `statistics.md`, or the unit detail file (layer-implementer).
   - Or a non-`review_`-prefixed file in a folder some commit already stages whole: `work_report_<k>.md` with a next-free `k` (branch-reviewer, review-plan-reviewer, test-fix-plan-writer).
   - Only three writers need a new tree, keyed by walker node, prompt verb or round instead of a ledger id: task-plan-writer, ui-tests-plan-writer and user-review-fix-plan-writer. Each needs its path added to the matching commit.
4. **Return the report inline on paths that must write nothing:** PASS for the no-disk reviewers, `blocker:`, `## Questions`, and every conventions-writer/-reviewer dispatch (`harness-analyze` has no committer).
5. **Keep the report from being mistaken for a wire line.**
   - No report line may begin with a parsed key: the template header uses `outcome:`, never `verdict:`.
   - Evidence uses `key=N` forms.
   - The section is headed as *not findings*.
6. **Keep evidence free of machine-specific data.** Paths are repo-relative, with no timestamps and no environment output. Gate 6a (`scripts/run-gates.sh:141`) fails any tracked file containing `$HOME`, and timestamps break no-op re-commits.

**The per-phase question** (the same agent in several phases) is answered by the artifact the report lives in, which is already keyed per phase and round: the findings folder, the round folder, the unit detail file. It is not answered by a new `<phase>` level.

## Edits that cut across agents (needed before any report lands)

- **PASS-writes-nothing contracts.** Narrow them to "no *findings* file on PASS" only where a report is filed on PASS. Otherwise keep them and return the report inline.
- **Reviewers grade writers against the writer's own definition.** `ui-tests-plan-reviewer` grades `ui-tests-plan-writer`, `docs-reviewer` grades `docs-writer`, and `conventions-reviewer` grades `conventions-writer`. A writer's template must therefore stay inside the text its reviewer reads, and thinning must not remove a graded rule. Paired reports must be landed together; the conventions pair already shares one combined `harness-analyze.md` change.
- **Readers of findings files need an ignore rule for the report section:**
  - writers applying "Must Fix items" (`docs-writer.md:63`, task-plan revision);
  - `/branch-status`'s keyword scan (it would match "deferred");
  - the improvement-observations round counts.
- **Read-list precedence.** The generated `CLAUDE.md` (`cli/src/generators/claudeContext.ts:470`) tells every planning or review agent to read `context/conventions.md`, while several agent definitions say read only the layer document. One sentence should state which instruction wins. The reports recommend that the agent definition wins.
- **Cited anchors must survive thinning.** Headings and labels that other files quote literally include:
  - `### Standard procedure (task / review_plan_file / review_item)` (cited at `plan_orchestration_instructions_core.md:509`, already stale);
  - qa-tester's `## Preconditions` step 3, "Per-single-test invocation" and `### 3. Tests blocked`;
  - task-plan-writer's `## Revision mode` and `## Rejected findings` (parsed by `flow-walker-gates.sh:144`);
  - the mobile stubs' `error:` line and "not implemented in this release" (grepped per `cli/src/config/model.ts:463`).

## Where to pilot

Pilot where the evidence value is high and no contract has to change:

- **qa-tester.** A PASS leaves no record at all today. Needs `ui_test_pass` to stage the report.
- **statistics-plan-writer.** The cheapest case: a section inside `statistics.md` in the same single `Write`.
- **docs-reviewer.** It already writes and commits `review_<i>.md` on PASS too, so the report is a trailing section with no contract change.
- **skeptic-reviewer.** The adversarial checks are the steps most worth evidencing, and the report is filed on FAIL. The PASS report goes inline only into the Done summary, so it is not durable across a pause.

## Pre-existing bugs found along the way (confirmed by a reviewer)

These are independent of work reports and worth fixing on their own:

1. **User-review fix-plan gates overwrite round 1.**
   - Mechanism: `parity_iteration` and `arch_iteration` reset to 0 every round (`user_review_fix_plan_writing_instructions_core.md:97`, `:123`) over flat folders (`:103`, `:129`). Round 2's `review_0.md` overwrites round 1's.
   - Impact: in supervised runs, round 1's copy is lost. In autonomous runs it survives only in git history.
   - Contradicts: `…_autonomous.md:93` and `user_review_fixes_instructions_autonomous.md:198`.
2. **Meta-review folders overwrite earlier rounds.** `review_plan_reviews/<branch>/` and the skeptic equivalent are keyed by branch alone and restart at `iteration = 0` (core `:293`, `:373`). The state-dir READMEs document this. Git history keeps the earlier files, but readers at HEAD see only the latest round.
3. **Multi-layer fix units in the unit loop.**
   - Mechanism: every layer writes `review_<i>.md` into one per-unit folder with a per-layer counter (`unit_loop_core.md:71`, `:86`).
   - Impact: a later layer overwrites an earlier one, and the next fix round's "most recent `review_*.md`" (`:73`) can hand one layer the other layer's findings.
   - Scope: only `Finding K` / `Test K` units tagged with more than one layer.
4. **Docs catalog refresh restarts at `review_0`.** It starts at `i = 0` unconditionally (`docs_orchestration_instructions_autonomous.md:69`, `:84`) and overwrites committed reviews when a slug was already reviewed. The INDEX entry always collides.
5. **`lessons.md` is never committed by either user-review fix-plan fork.** It is swept into the first fix commit, which disturbs subject reconciliation and hides `staged: index-only`.
6. **Per-unit `layer-reviewer` findings are untracked when the committer runs and get staged with the unit.** The `staged: index-only` signal is therefore already lost whenever per-unit review is on.
7. **The autonomous user-review QA.0 augment has no commit point.** `ui_test_pass` stages only the index, so new per-test files stay uncommitted when every test passes.
8. **qa-tester per-test blocks have nowhere to go.** Blocks written as "record a finding" (`qa-tester.md:109`, `:120`, `:128`) can only return through `error:`. That halts the whole QA phase, and an `error:` return has no place for a finding. `:122` adds a third route ("record a finding and continue").
9. **`layer-reviewer`'s description is wrong about where it runs.** It claims to run in supervised flows, and none dispatch it. "Autonomous" is also only partly true: it runs in the autonomous user-review flow, not the autonomous plan flow.
10. **The augment prompt differs at all three sites that quote it:** `ui-tests-plan-writer.md:51`, `qa_test_instructions.md:50–54` and `user_review_fixes_instructions_core.md:158`.

## Process notes

- Five agents at a time: 22 research agents, 22 reviews and 22 revisions. Every first-round review except qa-tester-mobile-maestro returned FAIL. All Must Fix findings were applied and none were rebutted.
- **A wrong premise ran through many first drafts.** Lead 1 in the brief said that an agent without the `Edit` tool cannot tick items in place. The reviewers refuted this (`sed -i` is allowed unattended), and the brief and every report were corrected.
- **The shared scratchpad caused one collision.** One agent's template draft was overwritten by another's and pasted into the wrong report. It was caught and fixed, and a final grep finds no foreign template in any report.
- **Most reports exceed the brief's 3 000-word target** (2 744–4 548), mainly because of the review responses and the added evidence.
