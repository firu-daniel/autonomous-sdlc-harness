# Work report research — branch-reviewer

## Verdict

**Recommend with changes.** The definition is 6 175 words. About 1 480 of them are redundant: restatements, rationale and an unused `<app_dir>` binding. About 930 more are steps buried in paragraphs that a checklist states more plainly. The steps also produce evidence that can be re-run: Pass 0 hit counts, exported-symbol caller counts, `<reference_impl>` methods read and citation checks.

The changes needed:
- **Embed the template** in the agent definition, so the template costs no extra `Read` and there is no copy step.
- **Write the report at two checkpoints, not per tick**: after Pass 0, then before returning. The two whole-file `Write`s are chosen for cost. `sed -i` ticking is allowed in unattended runs, but it is rejected because it works around the deliberate tool-level read-only guarantee (`:10`).
- **Store it inside the per-finding folder** the committer already stages whole (`<code_review_findings_dir>/work_report_<k>.md`), not under a new `<state_dir>/work_reports/` tree.
- **Keep the grading checklist and severity rubric up front.**
- **Leave the `:222` "not written into any saved file" literal intact.**

The hard constraint holds. The agent-owned up-front load drops from 7 698 to about 5 900–6 165 words (−20 % to −23 %).

## Read tree

Measured with `wc -w` in this repository (layers `cli`, `plugin`, catch-all `general`).

| File | Up-front / on-demand | Words |
|---|---|---|
| `plugin/agents/branch-reviewer.md` | up-front | 6 175 |
| `.claude/CLAUDE.md` (auto-loaded; template `cli/templates/claude/CLAUDE.md` = 1 320) | up-front | 1 695 |
| **Every** conventions doc in `<layer_path_map>` (`branch-reviewer.md:68`): `.claude/context/cli.md` + `conventions.md` + `plugin.md` | up-front | 2 647 + 5 864 + 4 174 = 12 685 |
| `<state_dir>/lessons.md` (`:71`; here `harness-runs/lessons.md`, template `cli/templates/state-dir/lessons.md` = 442) | up-front | 1 199 |
| `plugin/samples/sample_code_review.md` (`:147`; up-front in effect: `:73` makes an unreadable fixture a `blocker:` and forbids writing "from memory") | up-front | 1 146 |
| `plugin/samples/sample_code_review/finding_1.md` (`:147`) | up-front | 377 |
| Task prompt + story index (`:89`, dispatch inputs) | up-front | variable |
| `<state_dir>/task_plans/<branch>/task_<N>_plan.md` (`:89`, "only where … unclear") | on demand | variable |
| `<reference_impl>` methods, read in full (`:92`, parity on only) | on demand | variable |
| Per-unit `review_*.md` under `per_task_findings_root` (Pass 2, `:128`) | on demand | variable (empty in autonomous, `plan_orchestration_instructions_autonomous.md:167`) |
| `unit_loop_core.md` → `## The test-run rule` (`:145`) | on demand | 732 |
| `<docs_root>`, `mcp__harness-docs__search_docs` (`:69-70`, docs on only) | on demand | variable |
| Adjust re-dispatch only (`core.md:308`): `<findings_file>`, plus the existing index and `finding_<N>.md` files it adjusts | up-front (adjust only) | variable |
| `layer-reviewer.md`, `skeptic-reviewer.md`, `review-plan-reviewer.md`, `code_review_instructions.md`, `plan_orchestration_instructions_core.md` (named for context only, `:12`, `:14`, `:226`, `:155`, `:42`) | not read | 3 997 / 5 373 / 4 421 / 1 041 / 16 609 |

**Up-front total per dispatch (this repo): 6 175 + 1 695 + 12 685 + 1 199 + 1 523 = 23 277**, plus the task prompt and the story index. The **agent-owned share** that this research can change is the definition plus the two samples: **7 698**.

**Read-list conflict (lead 13): none.** `.claude/CLAUDE.md` → `## Context files` sends a reviewer to `context/conventions.md`, the layer docs and `harness-runs/lessons.md`. The definition (`:68`, `:71`) already requires all of them, so the two lists are the same set and the count above covers it.

## Dispatch sites and phases

| Site | Flow | Mode | Count per branch |
|---|---|---|---|
| `plan_orchestration_instructions_core.md` → `### B.1 Generate the review plan` (`:273-283`) | semi-autonomous + autonomous plan run | two-pass (`per_task_findings_root` always passed) | 1 |
| same → `### B.2` FAIL arm (`:308`): `Adjust the code-review index at … per findings at <findings_file>.` | same | adjust re-dispatch | 0–4 (cap `iteration >= 5`) |
| `code_review_instructions.md` → `## Flow` step 2 (`:21`), step 4 re-spawn with a focused prompt (`:30`) | supervised `/autonomous-sdlc-harness:branch-review` | single-pass | 1 + user-driven re-spawns |

Ledger ids: `Bg` and `Bm` (`autonomous_pause_and_ledger.md:79-80`) exist only in autonomous runs, and the agent never sees them. The user-review fix flows do not dispatch it. The docs flow excludes it (`plugin/commands/branch-start-docs-autonomous.md:30`).

## Prose classification

The counts are words in `plugin/agents/branch-reviewer.md`. Each section was measured with `sed -n | wc -w` and split by sub-paragraph (paragraph counts are in the method notes below the table). The total is 6 173 of the file's 6 175 words.

| Section (lines) | ACTION | REFERENCE | WIRE | REDUNDANT | Notes |
|---|---|---|---|---|---|
| Frontmatter (1–6) | 0 | 0 | 94 | 0 | `name`, `tools`, `description` read by the dispatcher |
| Intro (7–15) | 35 | 61 | 0 | 193 | `:10` no-`Edit` rationale (53) and `:14` skeptic-overlap essay (103) are rationale. Keep "run every check to the letter" |
| `## Resolved values` (16–33) | 30 | 506 | 0 | 227 | `:18` placeholder meta (108) is redundant. The `<app_dir>` half of `:23` is redundant: "no step in this file consumes `<app_dir>`". The table rows are reference, and every row can drop to one line. The `<state_dir>` trailing-slash rule (`:26`) must stay |
| `## Invocation contract` (35–64) | 60 | 164 | 87 | 94 | The B.1 block (`:44-50`) and the `Adjust …` sentence (`:64`) are wire, mirrored from core. `:62` restates `## Output contract` |
| `## Read first` (66–73) | 70 | 210 | 15 | 132 | `:70` repeats "navigation, never evidence" from `:69`. `blocker:` is wire |
| `### Pass 1` (77–94) | 257 | 296 | 30 | 13 | The step-1 `git diff` pathspecs and the "N run-artifact files excluded…" line are wire. The step-5 grading text (missing behaviour = Must Fix, miscited authorization = Must Fix) is the standard and stays |
| `### Pass 0` (96–122) | 130 | 286 | 55 | 120 | The sweep table is a per-row check. The "stub, expected to be edited" explanation (`:108`, `:120`) is mostly redundant |
| `### Pass 2` (124–134) | 115 | 80 | 0 | 66 | `:134` rationale for do-not-promote |
| `## Findings format` (136–149) | 87 | 200 | 180 | 174 | Paths, filename shape, the site-anchor definition and checkbox discipline are wire. `:140-141` and `:149` are largely restated in `## Output contract` |
| `## Common findings` (151–183) | 48 | 459 | 0 | 23 | The **grading checklist**. It stays up-front (lead 7) |
| Grading rubric (184–194) | 0 | 353 | 0 | 124 | Severity ladder, guard carve-out, prose-volume rule. Its "harness doctrine … restatement" sentences (`:190`, `:194`) are redundant |
| `## Unsolicited dispatch guidance` (196–204) | 30 | 161 | 30 | 75 | `(disregarded for verdict purposes)` and the heading are wire (shared by 10 agents, `dispatch_discipline_instructions.md:68`) |
| `## Output contract` (206–226) | 65 | 215 | 282 | 241 | The readiness heading, the entry format, the `_(layer: …)_` tag and `Pass 2 carried over N items, skipped M (already covered) and K (stale).` are wire. So is `:222`'s clause that this line is "not written into any saved file": the caller reads it from the message (`core.md:283`), and `:62` calls it load-bearing. Parts of `:217` and `:223-226` restate `## Findings format` and `## Invocation contract` |
| **Total** | **927** | **2 991** | **773** | **1 482** | |

Method: paragraph-level counts, for example `:14` = 123, `:23` = 174, `:92` = 225, `:214` = 218, `:216` = 202. Each paragraph was split by judgement. The class splits are estimates; the section totals are measured.

## Draft work report template

Embed this as a fenced block in the definition, under `## Work report`, with a three-line instruction:
- the path is `<code_review_findings_dir>/work_report_<k>.md`;
- `Write` the report after P6 and again before returning;
- evidence is repo-relative, with no absolute, home or worktree path, no date and no environment output.

The index Context already carries the date (`:213`), so the header omits it.

```markdown
# Work report — branch-reviewer — <branch> — <first|adjust>
Mode: <single-pass|two-pass|adjust>   (mark items outside the mode `n/a`)

- [ ] R1. **Read every conventions doc** — List each `layers[].conventions` path read; an unreadable one ends the dispatch with `blocker:`. (ref: branch-reviewer.md → ## Read first)
- [ ] R2. **Read ledger and format samples** — Read `<state_dir>/lessons.md`, `sample_code_review.md`, `sample_code_review/finding_1.md`; note the ledger entry count.
- [ ] P1. **Diff with run artifacts excluded** — Run the step-1 `--stat` / `--shortstat` pair; carry the exclusion count into the index Context.
- [ ] P2. **Segment the changed files** — List the feature-area segments you will review in order.
- [ ] P3. **Read task prompt and story index** — Read both for intent; open a per-task file only where intent is unclear.
- [ ] P4. **Grep sweep on added lines** — Run each filled sweep regex over every layer path; paste hits per class, or `stub empty`.
- [ ] P5. **Caller-check new exports** — List each new exported symbol with its caller count outside its file; zero callers → Must Fix.
- [ ] P6. **Review each segment from hunks** — Per segment: `git diff -U15`, then draft findings before moving on; paste draft count per segment.
- [ ] P7. **Read reference methods whole** — Parity on only: list each `<reference_impl>` method read top to bottom. (ref: branch-reviewer.md → ### Pass 1 step 5)
- [ ] P8. **Verify every cited authorization** — Open each cited prompt point or deferred marker; list `real` or `miscited → Must Fix`.
- [ ] P9. **Cross-segment sweep** — Check duplication, orphaned code, flow gaps, drift across segments; de-duplicate drafts.
- [ ] P10. **Apply ledger and checklist** — Run every lessons entry and `## Common findings` group as a named check; grade by consequence.
- [ ] P11. **Two-leg test each divergence** — Parity on only: Leg 1 wholly a bug, Leg 2 no precedent outside catch-all; else Must Fix.
- [ ] P12. **Split undecidable items into questions** — Any fix needing a choice goes to `## Questions`, with no finding file.
- [ ] Q1. **Reconcile per-unit findings** — Two-pass only: latest `review_*.md` per unit, Should/Nice only; record `carried=N covered=M stale=K`.
- [ ] Q2. **Keep carried-over severity** — Two-pass only: never promote a carried item; drop unit attribution.
- [ ] W1. **Write index in fixed order** — Context, byte-identical readiness heading, entries `[ ]` with `_(layer: …)_` tag, ship-ordered; Must/Should/Nice pointers impact-sorted; call-outs.
- [ ] W2. **One finding file per pointer** — Write `finding_<N>.md` per `### N. Title`, asking no forbidden test run; paste pointer count vs file count.
- [ ] A1. **Adjust only what findings name** — Adjust re-dispatch only: list each meta-finding addressed; no regeneration, no renumbering.
- [ ] X1. **Report dispatch steering** — Quote steering verbatim under the return's `## Unsolicited dispatch guidance`; if none, write `none` here and omit the section.
- [ ] X2. **Return the fixed summary** — Return index path, folder path, finding count, the two-pass reconciliation line; `## Questions` and steering sections above it.
```

**Modes: one template, with `n/a` ticks.**
- Single-pass marks Q1–Q2 `n/a`. Two-pass runs every item.
- Adjust runs R1–R2, A1, W1, W2, X1 and X2, and marks the rest `n/a`.
- Parity off marks P7 and P11 `n/a`.
- A `blocker:` writes no report, as today (`:73`).

**Order.** It follows `:81-90`: the diff and segmentation first, then the task prompt, then Pass 0.

**The `:222` literal is never saved.** Q1 records the three counts as `carried=N covered=M stale=K`, not as the `Pass 2 carried over …` sentence. The sentence stays in the return only, so `:222` is unchanged and so is the caller (`core.md:283`).

## Thinning plan

All of this is `plugin/agents/branch-reviewer.md`. The other up-front files are adopter content, or samples that `review-plan-reviewer` grades against, so they stay unchanged.

How to read the "after" column: today's words, minus REDUNDANT, minus the ACTION words that move into the template (ACTION kept verbatim stays), minus the stated shortening of REFERENCE.

| Section | Remove | Shorten | Keep verbatim | Est. after (subtraction) |
|---|---|---|---|---|
| Frontmatter | — | — | all | 94 |
| Intro | `:10` rationale, `:14` essay | Role + "distinct from layer-reviewer" to two sentences | "Run every check to the letter" | 289 − 193 − 25 − 11 = 60 |
| `## Resolved values` | `:18`, `<app_dir>` | One line per token (REF 506 → 300) | `<state_dir>` pathspec slash rule, `<docs_retrieval>` absent-tool rule | 763 − 227 − 30 − 206 = 300 |
| `## Invocation contract` | `:62` | Key table (80 → 50) | B.1 block, `Adjust …` sentence, empty-root no-op | 405 − 94 − 60 − 30 = 221 |
| `## Read first` | Steps (→ R1–R2), `:70` duplication | Docs/search rule (105 → 60) | `blocker:` rule | 427 − 132 − 70 − 45 = 180 |
| `### Pass 1` | Step mechanics except step 5 (187 ACTION → P1–P9) | Steps 1–4 and 6 REF (141 → 90) | Step-1 commands + exclusion line, all of step 5 (`:92`, 225) | 596 − 13 − 187 − 51 = 345 |
| `### Pass 0` | Stub explanation, `(a)`/`(b)` step prose (60 ACTION) | `(b)` REF (50 → 30) | Sweep table (incl. its 70 ACTION), "candidate, never automatic" | 591 − 120 − 60 − 20 = 391 |
| `### Pass 2` | `:134` rationale, steps (→ Q1–Q2) | — | Three reconcile outcomes as one line each | 261 − 66 − 115 = 80 |
| `## Findings format` | Restatements of `## Output contract`; 37 ACTION words → W1/W2 | — | Paths, round-suffix shape, site-anchor definition, implementability test (`:143`), checkbox discipline | 641 − 174 − 37 = 430 |
| `## Common findings` + rubric | Doctrine-restatement sentences (`:190` 33, `:194` 32) + 23 redundant | — | All checklist groups (incl. 48 ACTION), severity ladder, carve-out, prose-volume rule | 1 007 − 88 = 919 |
| `## Unsolicited dispatch guidance` | Repetition in `:200-204` (75), 30 ACTION → X1 | REF 161 → 140 | Heading, `(disregarded for verdict purposes)` | 296 − 75 − 30 − 21 = 170 |
| `## Output contract` | `:208` "do not paste … will not read it" (15); `:214` restated sort and committing-role prose (48); `:217` sentences 2–4 restating the finding-file contents (52); `:226` (20); `:223-224` cut to one line each (45); 15 ACTION → W1 | — | `:212-213` heading order, `:214` readiness heading + entry format + layer tag, `:215`, all of `:216` (two-leg test and the "untrusted until both legs pass" clause), `:221-222` return lines incl. the `Pass 2 carried over …` literal and its "not written into any saved file" clause | 803 − 180 − 15 = 608 |
| `## Work report` (new) | — | — | Template (518, `wc -w`) + 3-line instruction (≈ 60) | 578 |
| **Total** | | | | **≈ 4 376** |

**A range rather than a point.** If no REFERENCE is shortened, only the REDUNDANT words are cut, and the 629 ACTION words not kept verbatim move to the template, the definition comes to 6 175 − 1 482 − 629 + 578 = **4 642**. So the definition lands between **≈ 4 380 and ≈ 4 640**.

**A shared base file** (a reviewer base carrying `## Unsolicited dispatch guidance`, the docs-navigation rule and the `<repo_root>` rule, for 10 reviewers) is **not recommended**. `dispatch_discipline_instructions.md` → `## The receiving side` says that "the rule body lives in those definitions", which is a deliberate choice that each agent loads only its own file. Loading a base file per dispatch also saves nothing per agent, because it moves words rather than cutting them.

## Word-count ledger

| File | Today | After | Delta |
|---|---|---|---|
| `branch-reviewer.md` (incl. embedded template) | 6 175 | ≈ 4 380–4 640 | −1 535 to −1 795 |
| `sample_code_review.md` + `finding_1.md` | 1 523 | 1 523 | 0 |
| Separate template file | 0 | 0 (embedded) | 0 |
| **Agent-owned up-front** | **7 698** | **≈ 5 900–6 165** | **−1 535 to −1 795 (−20 % to −23 %)** |
| Adopter up-front (CLAUDE.md, 3 conventions docs, lessons) | 15 579 | 15 579 | 0 |
| **Total up-front** | **23 277** | **≈ 21 480–21 740** | **−1 535 to −1 795** |
| On demand (`## The test-run rule`) | 732 | 732 | 0 |

**Constraint holds: yes**, even at the cuts-only end of the range: 4 642 < 6 175.

## Storage and lifecycle

- **Path: `<code_review_findings_dir>/work_report_<k>.md`** (for example `code_reviews/<branch>_code_review/work_report_0.md`), not `<state_dir>/work_reports/<branch>/<phase>/branch-reviewer/`. This is lead 11's "a file inside a folder a commit already stages whole".
  - The committer's `review_plan_file` mode stages the **whole** per-finding folder `${plan_path%.md}/` without an existence guard (`committer.md:113`). B.3 therefore commits the report with **no committer change**. That mode is excluded from subject reconciliation (`committer.md:89`), so the "other paths staged" problem (lead 3) does not arise.
  - The brief's proposed tree would sit outside B.3's two or three explicit paths. It would stay untracked: tolerated by the engine (`plan_orchestration_instructions_autonomous.md:281`) but lost at PR time.
  - Rejected: a trailing `## Work report` section of the index. `review-plan-reviewer` grades the index's heading order (`review-plan-reviewer.md:92`), and the fix loop and committer key off that file.
- **Storage key (lead 4).** The round-suffixed folder name already separates review rounds (`_code_review_2/`). `branch-reviewer` runs only in Phase B and in supervised `/autonomous-sdlc-harness:branch-review`, so no phase id is needed, and the key also works in supervised and semi-autonomous runs.
- **Index `k`, collision-safe (lead 10).** The caller does not compute it: the adjust re-dispatch (`core.md:308`) passes no `iteration`. The agent takes the next free `k` with `Glob work_report_*.md`. A new round gets a new folder, and every adjust re-dispatch finds the previous reports and takes the next number. Nothing resets `k` or overwrites an earlier report, unlike a caller `iteration` reset per loop. All reports for a round land in the single B.3 commit.
- **Clean-zero-findings case.** Today no folder is created, and the committer warns and skips. With a report, the folder holds only the report and is committed. Both are fine.
- **Tools (lead 1, as corrected).**
  - The agent has `Write` but no `Edit` (`:4`).
  - `sed -i` and `cat` are allowed (`settings.autonomous.json:36-45`), so ticking in place is possible. It is rejected because it would work around the deliberate tool-level read-only guarantee (`:10`: "Do not treat it as an oversight to work around").
  - Embedding the template avoids both `cp` and an extra `Read`.
  - There are two whole-file `Write`s, after P6 (Pass 0 done and segments reviewed) and before return, chosen for cost (see Risks).
- **PASS writes nothing (leads 2 and 8): n/a.** This agent has no PASS verdict and always writes the index, which B.3 always commits. The only no-write path is `blocker:`, and it stays report-free.
- **Evidence leakage (lead 12).**
  - The template instruction bans absolute, home and worktree paths, timestamps and environment output.
  - The header carries no date.
  - `:208` tells the agent to `Write` *to* absolute paths. That is the tool argument, not report content, and the instruction keeps the two apart.
- **Hooks.** Every `PreToolUse` hook matches `Bash` only (`plugin/hooks/hooks.json`). `Write(/<repoRoot>/**)` and the worktree glob are allow-listed (`settings.autonomous.json:50-51`). Nothing blocks the write.
- **Self-review exclusion (lead 5).** Its own diff excludes `':(top,exclude)<state_dir>/*<branch>*'` (`:83`), which covers both storage options, so the agent never grades work reports. `review-plan-reviewer` *does* read the folder. That is a benefit, because it can check the evidence lines (P4, P5, P7, P8). It is also a risk, below.

## Risks and costs

- **Cost.** Two whole-file `Write`s of about 400–600 words each come to roughly 1.5k output tokens per dispatch, which is negligible next to a whole-branch review. Per-item ticking would need about 22 rewrites, around 13k output tokens, with no gain in verifiability.
- **Goal (a) is honest only through evidence.** Tick timing cannot be verified, and the agent can fill the whole report at the end. The value is in items that can be re-run:
  - P4: hit counts per class;
  - P5: caller counts per new export;
  - P7: the reference methods read;
  - P8: citations checked.

  P1's exclusion count already appears in the index Context (`:86`, `:213`), and Q1's counts in the return, so they add little. Without P4–P8 the report is ceremony.
- **The orphan rule in `review-plan-reviewer` (lead 9).** `review-plan-reviewer.md:108` makes an orphan detail file a Must Fix. Taken literally it covers only `finding_<N>.md`, but a meta-reviewer reading the folder may still flag `work_report_0.md`. That would trigger a spurious B.2 FAIL and a re-dispatch loop. This needs a one-line exemption there ("non-`finding_*` files are not findings"), a cross-file edit.
- **Ref-starvation (lead 7).** The pull is to shrink `## Common findings` and the rubric behind a `ref:`. That must not happen: they are the grading standard, and P10 points back into the same file, which is already loaded.
- **Separating an action from its rationale.** P11 (two-leg test) and P8 (citation check) are where the skeptic overlaps on purpose (`skeptic-reviewer.md:99`). A terse item without the "untrusted until both legs pass" text invites rubber-stamping, so `:216` stays verbatim.
- **Nothing in code keys on the prose.**
  - No `cli/test`, `scripts/` or hook greps `branch-reviewer.md`.
  - `skeptic-reviewer.md` restates, rather than cites, this file's sections. `business-parity-reviewer.md` and `architecture-reviewer.md` mention it only as "the split shape `branch-reviewer` emits".
  - The `:222` literal's only readers are `:62` and `core.md:283` (grep), and both are untouched.
  - The only self-references to update are `### Pass 0`, `### Pass 1` and `## Output contract` in the intro.

## Open questions

1. Should the report go inside the per-finding folder for the other split-format reviewers? This works only where the agent always writes a folder that a commit stages. Architecture and skeptic reviews have PASS-writes-nothing paths (`autonomous_pause_and_ledger.md:77`, `:82`: "PASS with no findings, no file written"), so lead 8 applies to them, and their PASS report needs another home.
2. Should `review-plan-reviewer` explicitly verify the evidence lines (re-run P4/P5)? That turns goal (a) from honour-system into a gate, at the cost of meta-review tokens.
3. Is the brief's `report_<index>` naming worth keeping consistent if storage moves into artifact folders? `work_report_<k>.md` avoids a clash with `finding_<N>.md` and `review_<N>.md`.
4. Supervised `/autonomous-sdlc-harness:branch-review` never commits the review. Is an uncommitted report acceptable there, as the review itself is?

## Review response

Every Must Fix, every Should Fix and every Nice to Have from `reviews/branch-reviewer.md` is applied. None is rebutted.
- **MF1.** Q1 records `carried=N covered=M stale=K`, and `:222` is kept verbatim and named as WIRE.
- **SF1–8.** Applied as follows:
  - lead 1 rationale restated;
  - the after column shown as a subtraction per row, with the headline given as a range;
  - X2 added, and W1/W2 extended;
  - order fixed;
  - the X1 omit rule kept;
  - the leak rule added and the date dropped;
  - adjust inputs added to the Read tree;
  - leads 10 and 13 stated;
  - the `## Output contract` cut list made exact.
- **NTH1–4.** Applied as follows:
  - the comparison claim cut;
  - `core.md` added to the "not read" row;
  - goal (a) reweighted to P4–P8;
  - open question 1 qualified.
