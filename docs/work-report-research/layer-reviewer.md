# Work report research — layer-reviewer

## Verdict

**Recommend with changes.** A short checklist helps this agent with the steps it can actually skip: reading `??` paths, disclosing confirmations it never ran, and writing the Should-Fix-only file on PASS. The definition can also lose about 45 % of its words.

The proposed **separate report file does not fit this agent**:
- it breaks the PASS no-disk contract;
- it trips the committer's index-only test;
- it lands in a folder whose listing other consumers treat as authoritative;
- it becomes a `??` file that diff reviewers grade.

The changes:
- **Embed the template in the agent definition.**
- **Append the filled report as a trailing `## Work report` section of `review_<iteration>.md`.** That file is the one the agent already writes on both findings branches, so this adds no new file, no extra call and no committer change.
- **Write it once, just before returning,** with evidence slots (paths, probe) rather than bare ticks.
- **Accept that a clean PASS (branch 1) carries no durable report** unless the return contract is widened (Open question 2).

The hard constraint holds, mainly through thinning (the 644-word catch-all section moves to on-demand), not through the template.

## Read tree

Measured with `wc -w` in this repository. `harness.config.json` defines the layers `cli`, `plugin` and `general` at `.`.

| File | Up-front / on-demand | Words |
|---|---|---|
| `plugin/agents/layer-reviewer.md` | up-front | 3 997 |
| `.claude/CLAUDE.md` (auto-loaded; template `cli/templates/claude/CLAUDE.md` = 1 320) | up-front | 1 695 |
| `harness.config.json` (gives `stateDir`, `scriptsDir`, `phases.parity`, `layers[]` — `layer-reviewer.md:14`, `:119`) | up-front | 154 |
| Dispatched `layers[].conventions`: `.claude/context/plugin.md` / `cli.md` / `conventions.md` | up-front (one of) | 4 174 / 2 647 / 5 864 |
| `.claude/context/conventions.md`, required by the CLAUDE.md table for "Any implementation, review or planning" (`.claude/CLAUDE.md` → `## Context files`) | up-front on a non-catch-all dispatch | 5 864 |
| Every `layers[].conventions` (catch-all only, `layer-reviewer.md:119`) | up-front on catch-all | 12 685 |
| `<task_file>` (per unit, variable) | up-front | n/a |
| `<reference_impl>` sources named by the task file (`phases.parity` true only) | on demand | n/a (parity off here) |
| `unit_loop_core.md` → `## The test-run rule` (lines 140–177); point 6 is cited at `layer-reviewer.md:75` | on demand | 216 (point 6); 732 (section) |
| `scripts/scratch-run.sh`, the dispatched `<scripts_dir>` copy; its `WHAT THIS DOES NOT CONTAIN` header is cited at `layer-reviewer.md:10` | on demand | 2 604 (file); 1 652 (comment lines 1–152 of the template copy `cli/templates/scripts/scratch-run.sh`, which is 2 429) |
| Samples `sample_story_plan.md`, `sample_task_plan.md`, `sample_code_review.md`, `sample_user_review_fix_plan.md` + per-item dirs (catch-all, `layer-reviewer.md:139`) | on demand | 1 270 + 1 399 + 1 146 + 985 (+ per-item files) |

**Read-list conflict (lead 13).** The definition asks only for the dispatched conventions document. On a non-catch-all dispatch, CLAUDE.md adds `conventions.md` as well. The two lists are additive rather than contradictory, so the larger set is counted, and CLAUDE.md wins by inclusion.

**Up-front total per dispatch in this repo** (task file excluded):

| Dispatch | Sum | Total |
|---|---|---|
| `plugin` layer | 3 997 + 1 695 + 154 + 4 174 + 5 864 | **15 884** |
| `cli` layer | | **14 357** |
| `general` catch-all | 3 997 + 1 695 + 154 + 12 685 | **18 531** |

The agent's own share is 3 997 words, and that is the only part this research can change. The lessons ledger is not read. It appears only as a grading note (`layer-reviewer.md:89`), and CLAUDE.md scopes it to branch-level review.

## Dispatch sites and phases

- **Sole dispatch site:** `plugin/instructions/unit_loop_core.md` → `### Per-unit review step`. It dispatches once per layer per unit, plus once per FAIL iteration. The counter resets per layer (`:71`, `:86`), and the run escalates at `iteration >= 5` (`:108`).
- **Substitution rows:** `A`, `A1.5.3`, `A2.3`, `C`, `C2.4`, `E.3`, `UR-A` and `G.4`. A row-`A` task is always single-layer (`:55`). Only the fix rows can be multi-layer (`:57`).
- **Gate `<per_unit_review>`:**
  - `on` in `plan_orchestration_instructions_semi_autonomous.md:32`, `user_review_fixes_instructions_semi_autonomous.md:32` and `user_review_fixes_instructions_autonomous.md:39`.
  - **`off`** in `plan_orchestration_instructions_autonomous.md:41`, with the rationale at `:157`.
- **No supervised flow dispatches it.** `plan_orchestration_instructions.md:3` says that loop has "no reviewer agents", yet `layer-reviewer.md:3` claims "supervised".
- **Excluded from the docs flow:** `docs_orchestration_instructions_autonomous.md:131`.
- **On the receiving-side roster:** `dispatch_discipline_instructions.md:68`.

**Frequency (assumption, not measured).** A semi-autonomous branch of 8 single-layer tasks averaging about 1.5 review iterations gives about 12 Phase-A dispatches. Fix rows add more.

## Prose classification

The section totals are measured with `sed -n 'a,bp' | wc -w`. The split into ACTION, REFERENCE, WIRE and REDUNDANT is my estimate, constrained to each measured total.

| Section (lines) | Total | ACTION | REFERENCE | WIRE | REDUNDANT | Notes |
|---|---|---|---|---|---|---|
| Frontmatter (1–6) | 85 | 0 | 0 | 85 | 0 | `name`, `tools` and `description` are read by Claude Code |
| Intro (7–11) | 151 | 15 | 50 | 0 | 86 | The "Write is not a boundary" rationale |
| `## Resolved values` (12–26) | 522 | 0 | 300 | 0 | 222 | The placeholder-list paragraph (~110) restates per-use definitions; the `<repo_root>` row restates the CLAUDE.md rule |
| `## Invocation contract` (29–60) | 429 | 80 | 160 | 110 | 79 | WIRE: the four-key block, `review_{iteration}.md`, the verdict strings. The mkdir rule (`:58`) duplicates `:157` |
| `## Read first` (62–66) | 155 | 50 | 60 | 0 | 45 | |
| `## Process` 1–4 (68–73) | 256 | 150 | 80 | 0 | 26 | |
| Probe paragraph (75) | 169 | 40 | 90 | 0 | 39 | Partly restates the `scratch-run.sh` header |
| Disclosure (77) | 82 | 30 | 40 | 0 | 12 | |
| Grading ladder (79–85) | 150 | 0 | 150 | 0 | 0 | The grading standard; never becomes an item (lead 7) |
| Non-downgradable + carve-out (87–89) | 102 | 0 | 102 | 0 | 0 | |
| Prose volume (91) | 172 | 0 | 120 | 0 | 52 | The closing "stated here because…" is rationale |
| Trigger source (93) | 62 | 20 | 0 | 0 | 42 | Restates `## Read first` |
| Trigger groups + Do NOT flag (95–113) | 330 | 0 | 300 | 0 | 30 | |
| `## Catch-all layer additions` (115–141) | 644 | 120 | 400 | 30 | 94 | WIRE: the `## Phase 2 Readiness — Ordered Fix List` literal |
| `## Unsolicited dispatch guidance` (143–151) | 296 | 40 | 140 | 40 | 76 | WIRE: the heading + `(disregarded for verdict purposes)`. Ten roster copies |
| `## Output contract` (153–208) | 391 | 40 | 80 | 240 | 31 | WIRE: the three return blocks, the template, the filename, `must_fix_count` |
| **Total** | **3 996** | **585** | **2 072** | **505** | **834** | |

**Wire that stays verbatim and in place.** Everything below lives in `layer-reviewer.md` → `## Invocation contract` / `## Output contract`. The return is parsed at `unit_loop_core.md:105-108` (anchor: `### Per-unit review step`).
- the four-key dispatch block
- `verdict: PASS` / `verdict: FAIL`, `findings_file:` and `must_fix_count:`
- `review_{iteration}.md` and the findings template
- the `## Unsolicited dispatch guidance` heading and its suffix
- the `## Phase 2 Readiness — Ordered Fix List` literal

Only about 585 words (15 %) are true actions. The fat is REDUNDANT text (834 words) plus catch-all text loaded on dispatches that never use it.

## Draft work report template

**Shape.**
- **Placement and modes.** The template is embedded in the agent definition (no extra `Read`) as one template. Modes are handled by `n/a` ticks: catch-all or not, parity on or off, the output branch.
- **When it is written.** It is written **once**, as a trailing section of `review_<iteration>.md`, in the same `Write` that creates the findings file.
- **Why not tick-as-you-go.** Lead 1's correction stands: `sed -i` and `Write`/`Edit` are allowed. Tick-as-you-go is still rejected by choice. There is no file to tick into until the findings are known, and in-place edits would put a read-only reviewer into an edit loop.
- **Evidence slots.** R6, R7 and R9 carry evidence values, not bare ticks (lead 6). Every value is repo-relative, with no absolute path, timestamp or environment output (lead 12).

```markdown
## Work report
_Process record — not findings; nothing here is to be fixed._
- [ ] R1. **Confirm the three layer values** — Take layer name, path scope and conventions doc from the dispatch; any absent → return a blocker naming it. (ref: layer-reviewer.md → ## Invocation contract)
- [ ] R2. **Quote any steering in the dispatch** — Copy text outside the contract verbatim into the return section; it never changes the verdict. (ref: layer-reviewer.md → ## Unsolicited dispatch guidance)
- [ ] R3. **Read the conventions document** — Read the dispatched conventions file; unreadable → blocker naming path and refusal, no findings file, stop.
- [ ] R4. **Catch-all: apply cross-layer checks** — Only when path is `.`: read every layers[].conventions and run the catch-all checks; else n/a. (ref: plugin/instructions/layer_review_catch_all.md)
- [ ] R5. **Read the task file fresh** — Read <task_file> now; `**Deviations from plan:**` entries are intended, never findings.
- [ ] R6. **Enumerate the uncommitted set** — Run `git status --short` then `git diff HEAD`; skip other agents' `<state_dir>` run artifacts. paths: <repo-relative list>
- [ ] R7. **Read every changed file whole** — Read each tracked change and each `??` path in full; no skimming. untracked read: <repo-relative list|none>
- [ ] R8. **Cross-check parity** — Only when phases.parity: check constants, predicates, ordering, gates, call/payload names against <reference_impl>; else n/a.
- [ ] R9. **Probe what reading cannot settle** — Run scratch-run.sh on a file under <state_dir>/scratch/; never write the tree. probe: <command> → <one-line result|none> (ref: layer-reviewer.md → ## Process)
- [ ] R10. **Grade every finding by consequence** — Apply the ladder; conventions Must Fix triggers and each missing required-set item stay Must Fix. (ref: layer-reviewer.md → ## Checklist)
- [ ] R11. **Disclose unexecuted confirmations** — In each finding confirmed only by reading, name what was read.
```

This is 11 items and 307 words, measured. The old R12 ("write the findings file") is dropped, because the report now *is* part of that file.

The verdict is not an item: the file's own `## Must Fix` presence already states it, and nobody can tick a return before it is sent.

## Thinning plan

`plugin/agents/layer-reviewer.md` goes from 3 997 to about **2 200** words, plus the 307-word embedded template.

| Section | Remove | Shorten | Keep verbatim | Est. after |
|---|---|---|---|---|
| Frontmatter | — | Drop "supervised" (fact fix) | `name`, `tools`, `model` | 84 |
| Intro | Probe-reaches-interpreter rationale | To 2 sentences | — | 60 |
| `## Resolved values` | Placeholder-list paragraph; `<repo_root>` row text (pointer at CLAUDE.md) | Rows to one clause | Token names | 200 |
| `## Invocation contract` | Duplicate mkdir rule (`:58`); FAIL-loop mechanics beyond "exact verdict string" | Values table | Fenced block, verdict-exactness sentence | 250 |
| `## Read first` | Restated "canonical source" list | To the blocker rule | — | 50 |
| `## Process` 1–4 + probe + disclose | The actions (now R5–R9, R11) | Rationale: deviations, untracked in scope, probe never writes, `.sh` excluded, disclosure ≠ grade | — | 200 |
| `## Checklist` | Trigger-source paragraph (62); prose-volume closing sentence (~52) | — | Ladder 150, guard + carve-out 102, trigger groups + Do NOT flag 330, prose volume ~120 | ~700 |
| `## Catch-all layer additions` | **Move** to the on-demand `plugin/instructions/layer_review_catch_all.md` (R4 `ref:`) | Its redundant intro (−94) | `## Phase 2 Readiness — Ordered Fix List` inside the moved file | 0 here |
| `## Unsolicited dispatch guidance` | — | **Deferred** to the cross-agent synthesis: shortening one of ten roster copies alone creates drift (`dispatch_discipline_instructions.md:68`) | Whole section | 296 |
| `## Output contract` | Duplicate mkdir sentence | Branch-2 safety-net rationale to 1 sentence | Return blocks, template, location rule | 330 |
| *New:* report pointer | — | "When you write a findings file, append the `## Work report` below, filled; on branch 1 write nothing." | — | +30 |

That totals 2 170 (2 200 with the pointer), plus the 307-word template.

**New on-demand file `layer_review_catch_all.md`: about 670 words.** That is the moved section (644 − 94 redundant ≈ 550) plus its own `## Resolved values` table, which `.claude/context/plugin.md:46` requires of every loaded instruction file. The table is about 5 rows × 25 words ≈ 125. Its tokens are `<task_file>`, `<convention_symbols>`, `<layer_path_map>`, `<state_dir>` and the `${CLAUDE_PLUGIN_ROOT}` sample paths.

**Shared base file (candidate, for the synthesis).** A `reviewer_base.md` could carry five parts:
- unsolicited guidance
- disclosure
- the probe route
- the consequence ladder + carve-out
- prose volume

It would be shared by the ten agents on the `dispatch_discipline_instructions.md:68` roster. It cuts corpus duplication, not per-dispatch words. It also conflicts with `:72`, which keeps the rule body inside each definition on purpose.

## Word-count ledger

**Up-front, agent-owned** (the only part this proposal changes):

| File | Today | After | Delta |
|---|---|---|---|
| `layer-reviewer.md` body | 3 997 | ~2 200 | −1 797 |
| Embedded template | 0 | 307 | +307 |
| **Subtotal, non-catch-all** | **3 997** | **~2 507** | **−1 490** |
| `layer_review_catch_all.md` (read via R4 when `path == "."`) | (inside the 3 997) | ~670 | +670 |
| **Subtotal, catch-all** | **3 997** | **~3 177** | **−820** |

**Unchanged up-front:** CLAUDE.md 1 695, `harness.config.json` 154, conventions docs 2 647–12 685, task file.

**Full per-dispatch load in this repo:**

| Dispatch | Today | After |
|---|---|---|
| `plugin` | 15 884 | ~14 394 |
| `cli` | 14 357 | ~12 867 |
| catch-all | 18 531 | ~17 711 |

**On demand (unchanged):**
- test-run rule: 216 (point 6) / 732 (section)
- `scripts/scratch-run.sh`: 2 604
- samples: about 4 800

**Constraint holds: yes,** on every dispatch shape. Honest attribution:
- The template is net **+307** words. The constraint holds because of thinning, which is worth doing anyway.
- An adopter whose only layer is the `init` default `general` at `.` gets every dispatch as a catch-all, and so only the smaller −820 saving.

## Storage and lifecycle

- **Frequency.** At most one report per dispatch that writes a findings file. Clean-PASS dispatches write none. This agent runs in:
  - the semi-autonomous plan and fix flows;
  - the autonomous user-review fix flow (ledger phase `R<n>`).

  It does not run in the autonomous plan flow or any supervised flow.
- **Location.** `<findings_folder>/review_<iteration>.md`, as a trailing section, so no new path and no new key are needed. `findings_folder` already encodes:
  - phase root
  - branch
  - round suffix
  - unit

  That covers `task_<K>/`, `item_<N>/` and `item_<K>/` (`unit_loop_core.md` → `## Substitution table`). It works without a ledger, which semi-autonomous flows lack (lead 4).
- **Rejected: a separate report file** (`<findings_folder>work_report_<layer>_<iteration>.md`, or the brief's `work_reports/` tree). Four reasons:
  1. It needs the branch-1 no-disk rule changed in `layer-reviewer.md:58`, `:157` and in the caller note at `unit_loop_core.md:103`.
  2. The committer's subject reconciliation asks "does the staged set contain any path other than `plan_path` and the unit's own detail file?" (`committer.md:83`). A staged report flips that answer. That suppresses `staged: index-only`, unless the report is explicitly excluded (lead 3).
  3. `improvement_observations_instructions.md:74` lists each review root and treats "the listing [as] authoritative" for round counting. A new file there needs an explicit exemption.
  4. As an untracked file it joins the set the next diff reviewer grades (lead 5).
- **Index.** The index is caller-supplied `iteration`, never next-free. It is **not collision-safe** across layers of a multi-layer fix unit, and the embedded report inherits the existing `review_<i>.md` collision (Risks; lead 10).
- **Commit.** No change is needed. The report rides inside `review_<i>.md`, which is committed or not on the same terms as today. The state tree is committed, apart from the `.gitignore`-managed `scratch/`, logs, inbox, clarifications and control files. The committer stages "the code files shown by `git status --short`" (`committer.md:111`). Whether that sweeps state-dir findings files is ambiguous today too (Open question 3).
- **Lead 8 (PASS has no commit point).** This is not an issue here. Every layer of a unit is followed by the unit's committer dispatch (`unit_loop_core.md` step 5), so a branch-2 file is swept into the unit's own commit.
- **Lead 9 (orphans).** The `review-plan-reviewer` orphan rule covers `finding_<N>.md` in a review index's `findings_dir` (`review-plan-reviewer.md:108`), not per-unit `*_point_reviews/` folders. It does not apply.
- **Tools.** `Read, Glob, Grep, Bash, Write` (`layer-reviewer.md:4`). The single `Write` already in the output contract carries the report, so no new tool is needed.
- **Hooks.** Every `plugin/hooks/hooks.json` matcher is `Bash`. `mkdir -p`, `sed` and `cat` are allowed, while `cp` is not (`cli/templates/claude/settings.autonomous.json:36-51`). Nothing in the embedded design needs `cp`, and nothing blocks the write.

## Risks and costs

- **Cost.** There are zero extra tool calls: the report goes out in the existing `Write`. The cost is about 310 words of input per dispatch and about 400 output tokens per findings-writing dispatch. By contrast, tick-as-you-go would cost 11 × (`Read` + `Write` or `sed -i`), about 22 calls per dispatch.
- **Goal a is attestation, not a trace.** Tick order is unverifiable, and the agent can tick everything at the end. The value lies in the evidence slots: R6 paths, R7 untracked list, R9 probe command and result. A reader can check those against the commit.
  - **The gap.** Clean PASS, the case where a skipped `??` read hides a defect, leaves no durable report under this design.
- **Consumer misread.** The fix-iteration implementer reads `review_*.md` (`unit_loop_core.md:73`). The section's italic disclaimer and its non-severity heading keep the implementer from treating ticks as fixes.
  - `branch-reviewer` Pass 2 collects only `Should Fix` / `Nice to Have` items (`branch-reviewer.md:129`).
  - `improvement_observations_instructions.md:110` reads finding headings only after the counts fire.
  - Neither consumer keys on `## Work report`.
- **Leak (lead 12).** R6 runs in `<repo_root>`, which is an absolute worktree path in an autonomous run (`layer-reviewer.md:21`), and R9 records probe output. The slots require repo-relative paths and a one-line result, never raw output.
- **Self-review hazard.** The reviewer grades all `??` paths (`layer-reviewer.md:71`). On a catch-all dispatch, other agents' work reports and earlier `review_<i>.md` fall inside path `.` and get graded. R6's skip clause is needed whatever the storage choice, and `layer-implementer` needs the matching clause.
- **Ref-starvation (lead 7).** R10's ladder, R5's deviation rule and R9's no-write rule are the grading standard. They stay in the definition's body, and the `ref:`s point at them; nothing is moved out of the up-front file except the catch-all section.
- **Existing collision: confirmed, narrower than first stated.**
  - **Mechanism.** `findings_folder` is per unit, with no layer component. `iteration` resets per layer (`unit_loop_core.md:71`, `:86`). The reviewer writes `review_{iteration}.md` (`layer-reviewer.md:55`).
  - **Scope.** Only fix rows whose tag is comma-joined collide (`A1.5.3`, `A2.3`, `C`, `C2.4`, `E.3`, `UR-A`, `G.4`; `:57`). Row-`A` tasks are always single-layer (`:55`), so `task_<K>/` never collides.
  - **Consequences.** Layer 1's file at each shared index is overwritten. Worse, `:73` hands the fix implementer "the most recent `review_*.md`", and the `iteration >= 5` escalation cites "the latest findings file" (`:108`). If layer 1 reached `review_1.md` and layer 2 then FAILs at `review_0.md`, "most recent" by number points layer 2's implementer at layer 1's findings.
  - **Not a consequence.** `branch-reviewer` Pass 2 reads only `task_<N>/` (`branch-reviewer.md:128`), so the lost files were never part of its safety net.
  - **Fix.** Put the layer in the filename, independently of this proposal.
- **Callers, tests, scripts.** No `cli/test`, `cli/src`, `cli/templates` script or hook mentions `layer-reviewer`. `plugin/docs/AUTONOMOUS_FLOW.md:42` only lists the path. Moving or shortening non-wire prose breaks no test.

## Open questions

1. Should the cross-agent synthesis adopt "embed in the artifact the agent already writes" as the default storage (lead 11)? The rejected separate-file route above fails for this agent on four counts.
2. Should a clean PASS carry evidence? The options are a widened return (`verdict: PASS` plus R6/R7 lines), which is a wire change in `layer-reviewer.md` → `## Output contract` and `unit_loop_core.md:105-108`, or nothing at all.
3. Should the committer's stage set state explicitly whether state-dir findings files are included in `task`/`review_item` mode? Today it is ambiguous (`committer.md:111`).
4. Should the stale "supervised" claim at `layer-reviewer.md:3` be fixed by hand? It is contradicted by `plan_orchestration_instructions.md:3`.
5. Should the per-layer `review_<i>.md` collision in fix rows be fixed as its own task, by adding the layer to the filename and pinning "most recent" in `unit_loop_core.md:73`?
6. Should a shared `reviewer_base.md` be adopted? The trade-off is cutting corpus duplication against `dispatch_discipline_instructions.md:72`'s placement rule. The shortening of `## Unsolicited dispatch guidance` is deferred to that decision.

## Review response

No finding is rebutted. All 1 Must Fix, 8 Should Fix and 5 Nice to Have findings are applied. Should Fix 7 (`improvement_observations` listing) and 8 (template storage, copy verb) are resolved by the revised design: there is no new file, and the template is embedded and written in the existing `Write`. The listing and orphan concerns are kept as reasons for rejecting the separate-file route. One correction beyond the review: the old Open question 1 said this agent never runs where a ledger exists. That was wrong, because it runs in the autonomous user-review flow (`user_review_fixes_instructions_autonomous.md:39`), and it is now fixed.
