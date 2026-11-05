# Review — test-fix-plan-writer
verdict: FAIL

Checked and clean, no finding: every Read-tree count (`wc -w` on the agent definition 2 411, `.claude/CLAUDE.md` 1 695, notes-app `CLAUDE.md` 1 676, the sample 985, finding_1/2/3 282/375/317, `cli.md` 2 647, `plugin.md` 4 174, `conventions.md` 5 864, `## The test-run rule` at `unit_loop_core.md:140–176` 732). All 21 section counts in the classification table match `sed -n 'a,bp' | wc -w` exactly. The thinning column sums to 1 536, and the ledger totals are right (6 105 → 4 498, −1 607). The template measures 535 words; every title is ≤ 8 words and every description ≤ 25. The roster holds 17 entries, so "16 other citers" is right. Lead 1: no reasoning rests on the wrong premise. The report names Write+Edit (`:4`), needs no `cp`, and picks checkpoint ticking on cost (Risks, tool calls). Header and wire collisions: the template's `- [ ] W1.` items do not match G.0's `^[0-9]+\. \[ \]` (`plan_orchestration_instructions_core.md:542`), and no parser reads `work_report.md`.

## Must Fix

1. **The "write no report on `## Questions` / `blocker:`" change cannot hold under the report's own checkpoint scheme.** Checkpoint 1 is written to disk after W1–W5. But a `blocker:` can arise later, at P1 (an unreadable conventions document) or at P2 (`unit_loop_core.md`), and both lie in Checkpoint 2. `test-fix-plan-writer.md:55` lists "a conventions document" among the blocker paths and requires the agent to write nothing (`:118`, "write nothing"). The unattended allow list has no `rm` (`cli/templates/claude/settings.autonomous.json:36–51`), so the partial report cannot be removed. It is left as an untracked folder holding only `work_report.md`. Verdict item 3 and Storage → "Paths that write nothing" claim "Keep that" without showing how.
   **Change:** move every read that can produce a blocker (P1, P2, and on revision the findings file) into Checkpoint 1, before the first `Write`; or defer the file's creation until all reads succeed. Otherwise state plainly that a blocker or questions return can leave an untracked `work_report.md`, and that `:118`'s "write nothing" then needs rewording. Also check whether a question can surface during P5, which is in Checkpoint 2.

## Should Fix

1. **Lead 13 is raised but not done: the larger read set is not counted, and the lessons ledger is missing from the Read tree.** `CLAUDE.md`'s routing table also sends "Planning or reviewing at branch level" to `harness-runs/lessons.md`, which runs 1 199 words (`wc -w`). The agent's only mention of the ledger is the ban at `test-fix-plan-writer.md:105`. The conflict is adopter-wide, because the "Any implementation, review or planning" row is generated (`cli/src/generators/claudeContext.ts:470`).
   **Change:** add both rows to the Read tree as "up-front if `CLAUDE.md` wins". Add a ledger variant: 6 105 + 5 864 + 1 199 = 13 168 before and 11 561 after. The constraint still holds and the delta is unchanged, but the saving shrinks from −26 % to −12 %. Then answer Open question 1, since the brief asks which wins, and say so in the Verdict.
2. **The template's P1 ("Read only the fix layers' conventions — none other") takes a side in that conflict and contradicts the agent's own `<impl_stack>` row.** `test-fix-plan-writer.md:22` says to read the stack's names "off the conventions documents `<layer_path_map>` names". `:51` says to read only the fix layer's document.
   **Change:** drop "none other" from P1 until Open question 1 is settled, and list the `:22`/`:51` tension under Open questions.
3. **The "after" figure for `:79–91` (581 → 470) contradicts its own row.** The row keeps both templates verbatim and also moves "the ordering, tag and grep-verify actions" out. Those actions sit inside the verbatim bullets: ordering and tag at `:85`, grep-verify at `:90`. The lead `:79–80` is 60 words and itself carries the wire sentence "Heading text must match exactly — the caller keys off it", so it cannot supply the 111-word cut.
   **Change:** either say which words of `:85`/`:90` leave, and show they are not wire, or keep 581. Keeping 581 gives an after of 1 647 and an up-front total of 4 609, so the constraint still holds. Restate the delta.
4. **Two citations are wrong.**
   - "`blocker:` is parsed at core :592" (Prose classification, row 55–56): the blocker branch is at `plan_orchestration_instructions_core.md:590`; `:592` is "Otherwise → the architecture gate".
   - "`fixable: 0` escalates the run (core :594)" (Risks), and the same `:594` in Storage: the branch is at `:591`; `:594` is the architecture-gate paragraph.
   **Change:** correct both to `:590` and `:591`.
5. **"The prompt is byte-quoted at core :584" is inaccurate.** Core `:584` reads `Test log: <log>. Earlier logs: <paths or none>.`. The agent's `:33` reads `Test log: <log_path>. Earlier logs: <comma-separated earlier-round log paths, or none>.`. The fixed words match; the placeholders do not.
   **Change:** say "fixed text quoted at core :584, placeholders differ".
6. **Lead 12: the dispatch heading `## Dispatch <d> — <revise: findings file name>` invites a full path.** The findings file sits at `<state_dir>/…`, and an agent may paste it as an absolute path. Note too that the architecture reviewer's machine-path Must Fix covers only "the test fix plan index or any `finding_<N>.md`" (`architecture-reviewer.md:131`). A leak in `work_report.md` would therefore get past the reviewer and be caught only by the agent's own Q5, or by gate 6a after the G.3 commit.
   **Change:** require the repo-relative path or the basename in the heading. Add to Risks that `:131`'s scope does not cover `work_report.md`, and either propose widening it (a plugin edit, noted as a cost) or accept Q5 as the only guard.
7. **Template gaps against the definition:**
   - V2 omits "update that same entry … instead of adding a second line" (`:124`).
   - No item covers "a test fix plan writes neither `**Review comments:**` nor the bullet suffix" (`:79`).
   - On a revise dispatch it is unclear whether P1–P5 tick or are marked `n/a`.

   **Change:** extend V2's description, add the `**Review comments:**` exclusion to P3, and state the revise-mode rule for Checkpoint 2.

## Nice to Have

- The template and Storage use `<test_fix_findings_dir>`, which is a caller token (`plan_orchestration_instructions_core.md:86`). The agent knows only "the per-finding folder" (`:36`). Use the agent's own term in the one-sentence addition to `:7–9`.
- Several descriptions are not imperative: Q1 "Under `## Source failures`, mapped to …", Q2, Q3 and Q6 "And appended nothing …". Rephrase them as commands.
- The tool-call cost leaves out the initial `Write` that creates the dispatch section, so it is 5 calls per dispatch rather than 4, and about 100 rather than 80 per gate key.
- W4's evidence `fixable: N, not fixable: N` looks like the output-contract keys (`:114–115`). This is harmless because only the reply is parsed, but `fixable=N` would avoid any confusion when the agent copies lines into its return.

## Bug claims

The report names no explicit pre-existing bug. Two side observations:

- **CONFIRMED: the `## Read on demand (no auto-loaded context)` heading is inaccurate.** The heading is at `test-fix-plan-writer.md:46`. `CLAUDE.md` is auto-loaded into every agent (`.claude/CLAUDE.md` → `## Context files (read on demand)`, "This file is auto-loaded into every agent").
- **CONFIRMED: `:12` lists placeholders it does not declare (141 words).** `sed -n '12p' | wc -w` returns 141. The REDUNDANT classification is a judgement call, but the count is right.
- Additional, raised by this review: **UNCLEAR** — `:22` (read the stack off "the conventions documents") and `:51` ("only that one") conflict on which conventions documents to read. It is unclear whether that is a bug or loose wording. See Should Fix 2.
