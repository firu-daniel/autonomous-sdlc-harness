# Task plan review — iteration 2

Iteration 1's Must Fix is resolved. Rows 51–53 record the three `### Why no candidate is named here` sentences that entry D reaches, each with a stated `no-change` reason, and `task_3_plan.md`'s "Leave these unchanged" bullet points at those same rows. I re-walked entry D against `ARCHITECTURE.md` (§7's closing paragraph and every sentence of §9 → `### Why no candidate is named here`) and it now reaches rows 15, 16 and 51–53. I re-ran entries A, B and C verbatim, and every hit is a row: A reaches rows 1–2, B reaches rows 4–6 and 24–50, C reaches rows 7–13. I re-walked entry E and it reaches rows 18–22. The index structure, the 1:1 correspondence between index and files, the layer tags, the points tags and the Work-bullet counts all check clean. The cited anchors resolve: `## Override 2 — resumability`, `## Knowledge, not conclusions — the boundary`, `## The sanctioned form — the \`context_notes:\` line`, `docs/development.md` → `## 6. The roadmap this tree defers to`, `.gitignore` → `harness-runs/autonomous_logs/*`, and `scripts/publish-main.sh` → `removed_paths`.

## Must Fix

1. **Scope register: derivation entry F reaches a site that is not a row.** This is in the story index (`chore_withdraw_second_runtime_port_story_plan.md`), `## Scope register`.
   Entry F is run verbatim from the checkout root: `grep -rn -E "[Rr]oadmap item numbers" --exclude-dir=node_modules --exclude-dir=harness-runs --exclude-dir=.git --exclude-dir=dist .`. It returns two hits, not one:
   - `README.md` → the closing line of `## Where to read more`. This is row 23.
   - `docs/development.md` → the opening `**Who reads this:**` paragraph: *"…and what the roadmap item numbers cited throughout the tree mean."* **No row covers this hit.** Row 14's site is `docs/development.md` → `## 6. The roadmap this tree defers to`, which is a different site, and entry D reaches it, not entry F.

   The entry's own text says *"Its hit is the evidence behind the `no-change` rows entry B reaches"*, singular, which is not what the command returns. The closure invariant, *every site that any entry above reaches appears as a row below*, therefore fails on entry F.
   **Fix:** In the story index's `## Scope register`, add a row for `docs/development.md` → the opening `**Who reads this:**` paragraph (*"what the roadmap item numbers cited throughout the tree mean"*), with evidence `entry F`, disposition `no-change`, and the reason that it stays true: the paragraph promises the legend in `## 6`, and this branch changes no row of that legend. In entry F's text, change "Its hit is the evidence" to name both hits, with row 23 as the evidence and the new row as the pointer to the same legend.

## Should Fix

1. **`task_1_plan.md`: `harness-runs/` is the only published-tree removal guarded against being linked.** This is carried over from iterations 0 and 1 and is still not applied. The record cites `.gitignore` and `scripts/publish-main.sh`. `scripts/publish-main.sh` → `removed_paths` also strips `harness.config.json`, `.claude`, `.gitattributes`, `githooks`, `scripts` and `.github/workflows/publish-main.yml`, so a `](../scripts/publish-main.sh)` link would be dead on the published `main`. **Fix:** widen the Work bullet and the `grep -n "harness-runs/"` Verification bullet to cover every `removed_paths` entry: cite each as a code span, never as a `](` link target.
2. **`task_1_plan.md`: the stated read command does not do the planning-only selection.** This is carried over from iterations 0 and 1. `jq -c 'select(.type=="result") | .total_cost_usd'` prints the cost of every session in a run log. The planning-only selection is given only as a criterion in prose. `.claude/context/conventions.md` → `## Documents of record` requires *"what was measured, the command and the exact message"*. **Fix:** have the record either give the command or procedure that picks out the planning-only sessions, or say plainly that the selection was made by reading each session's dispatches by hand.
3. **`task_1_plan.md` has no `**Source:**` line.** This is carried over from iterations 0 and 1. **Fix:** add `**Source:** harness-runs/task_prompts/chore_withdraw_second_runtime_port_task_prompt.md → ## What the research found (2026-09-24)`.

## Nice to Have

1. **`task_3_plan.md` → Goal still says "LangGraph and six other agent frameworks".** The `**Depends on:**` line lists seven besides LangGraph. Change it to "seven", or drop the count.
2. **`task_2_plan.md` → the example row sentence says *"code-enforced routing no run has needed"*.** The prompt frames this as the maintainer's observation, and `task_1_plan.md` requires the same framing (*"never as a count or a measurement"*). Reword the example in those terms.
