# Work report research — review-plan-reviewer

## Verdict

**Recommend with changes.** The agent definition is 4 421 words, of which about 1 800 are restatement, unreachable adopter scaffolding or rationale. Its `## What to check` block is already a checklist, so a 22-item template fits it cleanly. Thinning the definition to about 2 560 words (drafted for the largest section) and adding a template of 661 words takes the up-front load in this repository from 21 523 to about 20 325 (−5.6 %). The template alone would add about 15 % to the agent's share; thinning pays for it. Five changes are needed:

1. Write the report with **one `Write` before returning**. This is a design choice, not a forced one: `sed -i`, `Edit` and `Write` are all allowed in unattended runs (`cli/templates/claude/settings.autonomous.json:39,48–51`). One end `Write` costs fewer calls and keeps a reviewer from editing files in place.
2. Store the report **inside `findings_folder`**, so the existing `meta_findings_folder` staging in B.3 and C2.3 commits it with no committer change.
3. Amend the "PASS writes nothing" contract in the 9 places that state it or depend on it.
4. Choose the report index by next free integer, not by `iteration`, which already overwrites across review rounds. The `work_report_` prefix keeps the scripted round count (`fw_round_count`) correct.
5. Exempt `work_report_*.md` from this agent's own orphan check (`:108`) before any reviewer it grades writes a report into its findings folder.

Goal (a) holds only through the pasted-evidence fields. Tick timing cannot be verified.

## Read tree

Measured with `wc -w`. The conventions documents are this repository's (`harness.config.json` → `layers`: cli, plugin, general). An adopter's are typically 300–974 words each (`cli/templates/claude/context/*.md`).

| File | Up-front / on demand | Words |
|---|---|---|
| `plugin/agents/review-plan-reviewer.md` | up-front (definition) | 4 421 |
| `.claude/CLAUDE.md` | up-front (auto-loaded) | 1 695 |
| `.claude/context/conventions.md` | up-front (`:73` "Read **all** of them") | 5 864 |
| `.claude/context/cli.md` | up-front | 2 647 |
| `.claude/context/plugin.md` | up-front | 4 174 |
| `plugin/samples/sample_code_review.md` | up-front (`:72`) | 1 146 |
| `plugin/samples/sample_code_review/finding_1.md` | up-front (`:72`; `finding_2`/`_3` are not named) | 377 |
| `<state_dir>/lessons.md` (`harness-runs/lessons.md`) | up-front (`:74`) | 1 199 |
| **Up-front total** | | **21 523** |
| `plugin/instructions/unit_loop_core.md` → `## The test-run rule` | on demand (`:103`) | 728 (file 9 143) |
| `plugin/instructions/plan_orchestration_instructions_core.md` | on demand, **grep only** for `^## Phase` (`:143`) | ~15 lines of output (file 16 609) |
| `plugin/agents/branch-reviewer.md`, `skeptic-reviewer.md` | named for identity (`:12`), not read | 0 |
| `mcp__harness-docs__search_docs` | on demand, only when `phases.docs` ∧ `docs.retrieval` (`:75`) | variable |
| Inputs: story index, review index, every `finding_<N>.md`, diff hunks | per dispatch, input not convention | variable |

Lead 13 (read-list conflicts) does not apply. `.claude/CLAUDE.md` → `## Context files` asks a reviewer for `conventions.md`, the layer documents and, at branch level, the lessons ledger. All of these are already in the agent's own list (`:73–74`), so the agent's set is the larger one and is the one counted. The test-run rule section measures 732 words with the next heading excluded; 728 was an earlier count.

The agent's own share of the up-front load is 4 421 words, and it is the only part this research can change. The other 17 102 words are adopter content shared with every reviewer.

## Dispatch sites and phases

| Site | Flow / phase | Ledger id | Count |
|---|---|---|---|
| `plan_orchestration_instructions_core.md` → `### B.2 Meta-review the review plan` (`:291–310`) | semi-autonomous (`plugin/commands/branch-implement-plan-semi-autonomous.md:27`) and autonomous (`plan_orchestration_instructions_autonomous.md:161,182`) | `Bm` (`autonomous_pause_and_ledger.md:80`) | 1–5 per round (`iteration >= 5` → escalate) |
| same file → `### C2.2 Meta-review the skeptic review` (`:369–383`) | same two flows, only if C2.1 returned FAIL | `C2m` (`:83`, "or not owed") | 0–5 |
| `unit_loop_core.md:164` | listed in "who may cite the test-run rule" | — | n/a |
| `dispatch_discipline_instructions.md:68` | names it on the receiving-side roster | — | n/a |
| `run_mode_instructions.md:84` | not a dispatch site: a run mode may not skip it "while the phase that dispatches them runs" | — | n/a |

No supervised command dispatches it, and the user-review fix flows do not either. A typical branch sees 2–4 dispatches, and the worst case is 10 per round.

## Prose classification

Section totals are measured (`sed -n 'a,bp' | wc -w`). The class split inside each section is an estimate from line-level counts (for example `:21` = 161, `:66` = 128, `:97` = 171, `:145` = 140).

| Section (lines) | Total | ACTION | REFERENCE | WIRE | REDUNDANT | Notes |
|---|---|---|---|---|---|---|
| Frontmatter (1–6) | 96 | 0 | 0 | 96 | 0 | `tools:`/`description` are read by Claude Code. |
| Intro (7–13) | 191 | 35 | 70 | 0 | 86 | The `Edit`-omission rationale (`:10`, 54) is maintainer rationale. The "stay index-agnostic" rule (`:12`) is an ACTION. |
| `## Resolved values` (14–29) | 662 | 20 | 230 | 0 | 412 | Preamble `:16` (102) lists what is *not* listed. The `<repo_root>`/`<app_dir>` row `:21` (161) restates the CLAUDE.md checkout-root block and says "no step in this file consumes `<app_dir>`". The docs/parity rows (`:24–25,27`, 148) are inert unless their phase is on. The `<state_dir>` pathspec-slash edge (`:26`) is REFERENCE and stays. |
| `## Invocation contract` (30–69) | 541 | 60 | 200 | 230 | 51 | Both key blocks (`:38–54`) and the exact-verdict rule (`:66`) are WIRE. The quote of the caller's no-mkdir text (`:64`) duplicates core `:305`. The downstream paragraph (`:68`, 80) is REFERENCE and could be shortened. |
| `## Read first` (70–78) | 386 | 70 | 170 | 67 | 79 | The fixture-precedence rule (`:72`) is REFERENCE and stays. The docs-tool paragraph (`:75`, 130) is conditional. The `blocker:` rule (`:77`) is WIRE. |
| `## Process` (79–85) | 132 | 52 | 0 | 80 | 0 | Moves wholly into items. The diff command with its two `:(top,exclude)` pathspecs (`:83`) is a WIRE literal and moves verbatim into item S7. |
| Check intro + Index (86–98) | 335 | 90 | 120 | 110 | 15 | `## Phase 2 Readiness — Ordered Fix List`, the entry form and the `_(layer: …)_` tag (`:97`) are WIRE: the committer and unit loop key on them. |
| Per-finding files (99–104) | 217 | 60 | 140 | 0 | 17 | Site-anchor grammar (`:101`) is the grading standard (lead 7), so it stays. |
| Correspondence (105–110) | 100 | 80 | 0 | 0 | 20 | Item X1 captures all of it. |
| False positives (111–118) | 205 | 30 | 165 | 0 | 10 | This is the severity standard, so it stays. |
| Missed checks (119–138) | 398 | 60 | 170 | 0 | 168 | The empty adopter table and its "replace this table" scaffolding (`:123–129`, ~145) is unreachable in a plugin-shipped file (open question 1). |
| Unactionable gates (139–150) | 486 | 50 | 330 | 30 | 76 | `:145` (140) explains *why* closure is unreachable. Keep the test, the three boundaries and the calibration (`:149`). |
| Parity spot-check (151–156) | 128 | 30 | 60 | 0 | 38 | Inert when `phases.parity` is false (this repository: false). |
| Unsolicited dispatch guidance (157–166) | 296 | 40 | 140 | 50 | 66 | Copied into 10 roster agents (`dispatch_discipline_instructions.md:68`). The rule must stay in the agent file ("an agent-side pointer at this file would add an activating document", same file). The section heading and `(disregarded for verdict purposes)` are WIRE. |
| `## Output contract` (167–205) | 248 | 20 | 30 | 190 | 8 | Fully WIRE: the verdict lines, the findings template and `review_{iteration}.md`. `:177` "Do not save a file when PASS." changes under this proposal. |
| **Total** | **4 421** | **697** | **1 825** | **853** | **1 046** | |

## Draft work report template

The template is one variant for both review families, every verdict (PASS, FAIL and blocker) and every iteration. Conditional items are ticked `n/a — <reason>`. The template is embedded in the agent definition under `## Work report` rather than shipped as a separate file, because `cp` is not on the unattended allow list (lead 1, corrected) and the agent would otherwise need an extra `Read`. Every evidence field holds **repo-relative paths only**, with no timestamps or environment output (lead 12). The FAIL return's `findings_file: <full_path>` (`:200`) stays absolute because it is a wire line, but it is never copied into the report.

```markdown
# Work report — review-plan-reviewer — <review_path basename> — report_<k>

review_path: <repo-relative>   findings_dir: <repo-relative>   iteration: <i>   verdict: <PASS|FAIL|blocker>
<!-- Evidence fields: repo-relative paths only; no absolute paths, timestamps or env output. -->

## Read
- [ ] S1. **Record the dispatch values** — Copy the five keys repo-relative; take the family from the values only; never name one family's author in findings against the other. (ref: review-plan-reviewer.md → ## Invocation contract)
- [ ] S2. **Read both format fixtures** — Read sample_code_review.md and sample_code_review/finding_1.md; if either is unreadable, return `blocker:` with no review_<i>.md; still do O2.
- [ ] S3. **Read every conventions document** — Read each distinct layers[].conventions; paste the paths read. If one is unreadable, return a blocker.
- [ ] S4. **Read the lessons ledger** — Read <state_dir>/lessons.md; paste the categories this diff could exhibit, or `none`.
- [ ] S5. **Skim the story index** — Read plan_path only to learn the branch's intent; do not review it.
- [ ] S6. **Read the whole review** — Read the index and every finding_<N>.md in full; unreadable → blocker. Paste: readiness entries R, pointers P, files F.
- [ ] S7. **List and map the diff** — Run `git diff <default_branch>...HEAD --name-only -- ':(top,exclude)<state_dir>/*<branch>*' ':(top,exclude)<state_dir>/docs_catalog/reviews/*'`; paste the touched layers.

## Check
- [ ] I1. **Check index section order** — Expect Context, readiness, Must/Should/Nice pointers, then divergence call-outs. A missing, misplaced or mistitled readiness section is Must Fix.
- [ ] I2. **Check the readiness list literally** — Exactly `## Phase 2 Readiness — Ordered Fix List`, at least one `[ ]`, entries `N. [ ] **Finding K** — title`; layer tags allowed.
- [ ] I3. **Check that pointers are one-liners** — `### N. Title` plus one pointer line, no `[ ]` on headings, impact-sorted. An inlined body is Should Fix.
- [ ] F1. **Check each finding is self-contained** — Needs heading, site anchor, full description, concrete fix. Missing anchor or fix is Must Fix; a line number never is. (ref: ## What to check → Per-finding files)
- [ ] F2. **Reject forbidden test runs** — A fix or sub-step naming the test command, a gate script or an untouched test file is Must Fix. (ref: unit_loop_core.md → ## The test-run rule)
- [ ] X1. **Prove index↔finding correspondence** — Every entry and pointer resolves; no orphans (ignore `work_report_*.md`); R = P = F; round suffix matches folder. Paste the counts.
- [ ] G1. **Grade each Must Fix** — Flag false positives, plan-correct deviations and severity inflation; quote the finding number for each. (ref: ## False positives)
- [ ] G2. **Cover every touched layer** — For each layer from S7, cite a finding or clean-pass rationale drawn from its conventions document; silence is Must Fix.
- [ ] G3. **Check sets, shared state and lessons** — Each required-set member needs its own finding; check the store-listener path and the S4 categories. (ref: ## Missed checks)
- [ ] G4. **Reject unactionable gates** — Grep `^## Phase [A-Z]` in the governing core; a gate needing closure of the dispatching or a later phase is Must Fix. (ref: ## Unactionable gates)
- [ ] G5. **Re-open parity citations** — If parity is on, open each cited <reference_impl> anchor behind a parity Must Fix; otherwise tick n/a.
- [ ] G6. **Quote any steering text** — Copy steering dispatch text verbatim for the guidance section; it never changes the verdict. (ref: ## Unsolicited dispatch guidance)

## Return
- [ ] O1. **Write findings on FAIL** — Run `mkdir -p <findings_folder>`, then write review_<i>.md in the contract format; every Must Fix names its file. On PASS tick n/a.
- [ ] O2. **Save this report** — On every outcome, blocker included: `mkdir -p <findings_folder>`, then write work_report_<k>.md, k = next free integer there.
- [ ] O3. **Return the fixed lines** — Return `verdict: PASS` alone, or the three FAIL lines exactly; any guidance section goes above them.
```

The template is 22 items (S1–S7, I1–I3, F1–F2, X1, G1–G6, O1–O3), measured at 661 words with its header (`awk` over this block). Every description is 25 words or fewer (checked with `wc -w`).

## Thinning plan

| Section | Remove | Shorten | Keep verbatim | Est. after |
|---|---|---|---|---|
| Frontmatter | — | — | all | 96 |
| Intro | `Edit`-omission rationale (`:10`, keep the one-clause rule) | role paragraph | "stay index-agnostic" rule | 90 |
| `## Resolved values` | preamble `:16`; `<app_dir>` (unused); `<repo_root>` body → "per CLAUDE.md → checkout root" | each row to one clause; docs/parity rows to "read only when the phase is on" | token names; `<state_dir>` trailing-slash pathspec edge | **166 (drafted and measured, below)** |
| `## Invocation contract` | the caller quote in `:64` | key table to one line per key; `:68` to 30 words | both key blocks; the exact-verdict paragraph (`:66`) | 380 |
| `## Read first` | — | docs-tool paragraph to 2 sentences (`:75`) | fixture-precedence rule; `blocker:` rule, amended at `:77` from "write no findings file" to "write no `review_<i>.md`; still write your work report" | 205 |
| `## Process` | whole section (now S5–S7) | — | the diff command, moved into S7 | 0 |
| Index / per-finding / correspondence | correspondence bullets (X1 carries them) | Index bullets that only restate I1–I3 | readiness literal, entry form, layer-tag carve-out, site-anchor grammar; `:108` gains "`work_report_*.md` is not an orphan" | 440 |
| False positives | — | light | Must Fix definition (`:117`) | 180 |
| Missed checks | empty table + scaffolding (`:123–129`) | — | general rule `:121`, three triggers, guard carve-out `:137` | 230 |
| Unactionable gates | — | `:145` rationale to 2 sentences | the test, three boundaries, calibration | 300 |
| Parity spot-check | — | gate sentence | re-open rule | 90 |
| Unsolicited dispatch guidance | — | two "not steering" cases to one sentence each | heading and `(disregarded for verdict purposes)` literal | 150 |
| `## Output contract` | — | — | everything, except `:177`, which becomes "On PASS write only your work report." | 235 |
| **Thinned definition, without the template** | | | | **≈ 2 562** |
| **New `## Work report`** | | | embedded template | 661 |
| **Agent file after** | | | | **≈ 3 223** |

Draft of the largest cut, `## Resolved values` (662 → 166 words, `wc -w`):

```markdown
## Resolved values

Resolve these from `harness.config.json`; other placeholders resolve where they appear.

| Token | Resolve from |
|---|---|
| `<default_branch>` | `defaultBranch` — the base of every `git diff` here. Never a remembered name. |
| `<repo_root>` | A bare `git rev-parse --show-toplevel`, per `CLAUDE.md` → checkout root. In an autonomous run this is the run's own worktree. |
| `<layer_names>` | `layers[].name`, unchanged; also the permitted values of the `_(layer: …)_` tag. |
| `<layer_path_map>` | Every `layers[]` `path` + `conventions`, all in scope. Paths are repo-relative, like `git diff --name-only` output. |
| `<state_dir>` | `stateDir` (default `sdlc-harness/`). In a pathspec, strip the trailing slash: `sdlc-harness//*` matches nothing. |
| `<docs_root>` / `<docs_retrieval>` | `docs.root` / `docs.retrieval`, only when `phases.docs` is `true`. Retrieval off → ignore `mcp__harness-docs__search_docs`. |
| `<parity_vocabulary>` / `<reference_impl>` | `parity.referenceName` / `parity.referenceImplPath`, only when `phases.parity` is `true`; otherwise every parity clause is inert. |
| `<convention_symbols>` | The mandated identifiers named in the conventions documents of `<layer_path_map>`. |
```

The other "after" figures are estimates from line-level counts and were not drafted. The margin (about −1 200) survives a 50 % miss on every undrafted section.

**Shared base file.** One candidate would hold the `## Resolved values` rows (`<repo_root>`, `<state_dir>`, `<default_branch>`, docs/parity gating) and the docs-tool paragraph, shared with branch-reviewer, skeptic-reviewer, task-plan-reviewer, architecture-reviewer and business-parity-reviewer. For this agent alone it saves nothing: a base file read up front moves words rather than removing them. It pays off only if the per-agent copies are deleted in the same change. The `## Unsolicited dispatch guidance` body **cannot** move there: `dispatch_discipline_instructions.md` → `## The receiving side` requires it to live in each definition.

## Word-count ledger

| File | Today | After | Delta |
|---|---|---|---|
| `review-plan-reviewer.md`: thinning only | 4 421 | ≈ 2 562 | ≈ −1 859 |
| `review-plan-reviewer.md`: `## Work report` template added (the mechanism) | — | 661 | +661 |
| `review-plan-reviewer.md` (net) | 4 421 | ≈ 3 223 | ≈ −1 198 |
| `.claude/CLAUDE.md` | 1 695 | 1 695 | 0 |
| 3 conventions documents | 12 685 | 12 685 | 0 |
| 2 fixtures | 1 523 | 1 523 | 0 |
| `lessons.md` | 1 199 | 1 199 | 0 |
| **Up-front total** | **21 523** | **≈ 20 325** | **≈ −1 198 (−5.6 %)** |
| On demand: test-run rule | 732 | 732 | 0 |
| On demand: own sections via `ref:` | — | already loaded (same file) | 0 |

**Does the constraint hold? Yes**, but only because of thinning. The mechanism by itself adds 661 words, about 15 % of the agent's share. Thinning removes about 1 859, so the net is −1 198 on the agent file and −5.6 % on the total. If the template shipped as a separate file, the total would be the same plus one `Read`.

## Storage and lifecycle

| Question | Answer for this agent |
|---|---|
| Phases | B.2 and C2.2 only, in the semi-autonomous and autonomous flows (above). |
| Key | Use the existing `findings_folder` value. B.2's (`review_plan_reviews/<branch>/`) and C2.2's (`skeptic_review_plan_reviews/<branch>/`) already disambiguate the phase. Ledger ids (`Bm`, `C2m`) never reach the agent, and the supervised/semi-autonomous flows have none (lead 4). |
| Path | `<findings_folder>/work_report_<k>.md`, not `<state_dir>/work_reports/…`. |
| Index | **The agent computes it** with `Glob` as the next free integer. **Do not reuse `iteration`.** `cli/templates/state-dir/review_plan_reviews/README.md` documents that a second review round restarts B.2 at 0 and "**overwrites** the first round's `review_0.md`", because the folder is keyed by branch alone. |
| Committed? | Yes, with no extra work. B.3 and C2.3 pass `meta_findings_folder` "only if … exists and is non-empty" (core `:322`, `:401`), and `committer.md:37,40` stages that folder as a third path under the fixed subject `chore: add code review for <branch>`. That mode is excluded from subject reconciliation (`committer.md:89`), so lead 3 does not bite. Once every dispatch writes a report, the existence guard at B.3 (`:322`) and C2.3 (`:401`) is always true. **Delete it** and always pass `meta_findings_folder`. Lead 8 (PASS has no commit point) does not apply: a B.2 or C2.2 PASS is always followed by B.3 or C2.3, which stages the folder. The only exception is a blocker, which escalates before B.3, so that report stays untracked; this matches today's escalation path. Lead 11 is exactly this design. The only consumer of the folder's contents, the review's author, is handed `findings_file` by name, so it never opens the report. A report left at a separate path would dangle untracked past B.3. `plan_orchestration_instructions_autonomous.md:111` treats an untracked dangling artifact as a defect needing its own commit point. |
| Tools | It has `Write` and `Bash` but **no `Edit` tool**. In-place ticking is still possible, through `sed -i` (`settings.autonomous.json:39` allows `Bash(sed:*)`) or by re-`Write`ing the file per tick. **Chosen: one `Write` at O2**, because it means fewer calls (1 instead of 22) and keeps a reviewer from editing files in place. A corollary: with `Bash(sed:*)` allowed, the "tool-level read-only guarantee" claimed at `:10` is only as strong as the prose already, and adding `Edit` would not materially weaken it. The recommendation still does not add `Edit`. |
| PASS contract | **Changes.** In the agent: `:61` (the `findings_folder` row, "Where your own findings go"), `:64`, `:77` (blocker: "no findings file"), `:108` (orphan rule) and `:177` ("Do not save a file when PASS"). In the core: `:305` (the B.2 parenthetical), plus B.3 `:322` and C2.3 `:401` (the existence guard, deleted). Also `committer.md:37` ("passed on its first iteration wrote no findings and created no folder") and `plan_orchestration_instructions_autonomous.md:238`, which calls the meta folders "the only two plain consecutive `review_<i>.md` series"; the prose there must say that `work_report_*` files are not rounds. Finally, both state-dir READMEs (`cli/templates/state-dir/review_plan_reviews/README.md:7`, "a code review that was clean on the first pass leaves this directory empty", and its skeptic twin). That is 10 plugin sites plus 2 templates. `verdict: PASS` itself is unchanged. The scripted round count is safe: `fw_round_count` and `fw_next_review_index` (`cli/templates/scripts/lib/flow-walker-gates.sh:63,87`, used at `flow-walker.sh:384,443`) match only `review_*`, so the `work_report_` prefix keeps them correct. That prefix must not be changed to anything starting with `review_`. |
| Hooks | Every `PreToolUse` hook matches `Bash` only (`plugin/hooks/hooks.json`), so `Write` is not gated. `mkdir -p` is already in this agent's FAIL path. |
| Self-pollution | A report under `<state_dir>/…<branch>…` is dropped by this agent's own diff exclusion `':(top,exclude)<state_dir>/*<branch>*'` (`:83`), because pathspec `*` crosses `/`. Lead 5 does not apply to its own diff. I did not verify whether branch-reviewer and skeptic-reviewer use the same exclusion. |

## Risks and costs

- **Cost.** One extra `Glob` and one extra `Write` per dispatch, which is 2–20 extra tool calls per branch. The output is about 700 tokens per report. This is negligible next to the roughly 21 k words read.
- **Goal (a) is weak.** Nobody reads the report during the run: the orchestrator parses only the verdict (`:66`). With one `Write` at the end, ticks are retrospective by construction. Evidence value comes only from S3, S4, S6, S7, X1 and G1, which paste paths, counts, touched layers and quoted finding numbers. Make those fields mandatory, and treat a ticked item with an empty evidence field as the defect signal.
- **Goal (b) is plausible.** The likeliest misses are structural: X1 counts, I2's literal heading, G2's per-layer coverage. These map one-to-one onto items with checkable outputs.
- **Ref-starvation (lead 7).** G1, G3 and G4 carry the grading standard (severity definition, missed-check triggers, gate boundaries). If those moved off the up-front path, severity calls would drift. The plan keeps them in the definition, and the `ref:` points into the same, already-loaded file. The gate test without its three boundaries (`:145`) would over-fire, so the boundaries stay.
- **Orphan check (lead 9).** This agent is the source of that lead. If branch-reviewer or skeptic-reviewer put a report inside their own findings folder, `:108` fails their review unless the X1 exemption lands **first**, or in the same change.
- **PASS contract churn.** 12 sites change in lockstep. The same "only when it has findings to write" phrasing exists for 9 other reviewers (`grep` hits in `unit_loop_core.md:103`, `task_plan_writing_instructions_core.md:186–269`, and others). A cross-agent rollout touches all of them, so do it once, centrally.
- **Index overwrite already exists (lead 10).** `review_{iteration}.md` overwrites across rounds (README `:3`). This is not data loss: round 1 was already committed at B.3 or C2.3, so history keeps it. The harm falls on round-count consumers (`autonomous.md:238`) and on anyone reading the folder at HEAD. It is also unclear what produces a second Phase B round, because the core's Setup binds `<code_review_path>` without a suffix (`core:65`). The report index is collision-safe because it is a free integer.
- **Tests.** `grep` finds no `cli/test` file keyed on this agent's prose. `cli/src/generators/stateDir.ts:82,85` creates the two meta folders and would need no new directory under this proposal.

## Open questions

1. `## Missed checks` ships an empty, adopter-editable table (`:123–129`) inside a plugin file that adopters do not edit. Should every reviewer drop such scaffolding, or move it to the conventions documents?
2. Should the "PASS writes nothing" contract change once, for all 10 reviewers, to "PASS writes only the work report"? Or should reviewers write a report only on FAIL? The second option would lose evidence for the common case.
3. Is "the report lives inside the agent's existing output folder" a pattern that generalises? It holds wherever a committer already stages that folder; layer-reviewer's point-review folders are one candidate.
4. Should a shared reviewer base hold `## Resolved values` for the six whole-branch reviewers? It pays off only if the per-agent copies are deleted.
5. Should the orphan-check exemption for `work_report_*.md` be one shared rule for every reviewer that checks folder correspondence? Today that is this agent (`:108`); ui-tests-plan-reviewer and task-plan-reviewer may have equivalents.
6. Should the existing `review_{iteration}.md` overwrite across rounds be fixed alongside this change, using the same free-index rule?

## Review response

Every Must Fix and Should Fix from `docs/work-report-research/reviews/review-plan-reviewer.md` was accepted and applied, and none is rebutted. Nice to Have items 1–3 were applied. The verdict word is unchanged (Recommend with changes), but its grounding changed: the single end `Write` is now a choice rather than forced, a fifth change (the orphan exemption) was added, and the ledger now separates the mechanism's cost from the thinning saving.
