# Work report research — docs-reviewer

## Verdict

**Recommend with changes.** `docs-reviewer` already writes a findings file on every reviewing dispatch, PASS included (`plugin/agents/docs-reviewer.md:108`), and both callers commit the `reviews/<slug>/` folder with the doc (`plugin/instructions/docs_orchestration_instructions_autonomous.md:75`, `plugin/instructions/docs_phase_instructions.md:44`). The report should therefore be **embedded as a trailing `## Work report` section of `review_<i>.md` and written once, with evidence lines**. It should not be a separate file under `<state_dir>/work_reports/…`. That needs no new path, no commit-list change, no hook exemption and no storage key. The agent's own up-front load drops from 2 530 to about 1 892 words. Required changes:
- (1) Embed the template in the agent definition, so nothing is copied.
- (2) Use one end-of-run `Write`, with evidence in place of tick timing. In-place ticking is possible (`sed -i` is allowed), but I choose against it: see Storage → Tools.
- (3) Keep check 2's detector regexes and the value-vs-coordinate test inline, not behind a `ref:`.
- (4) Fix the existing catalog `i=0` overwrite before reports inherit it.
- (5) Write every path in evidence repo-relative.
- (6) Add a one-line ignore rule to `docs-writer.md` → fix round. The docs-writer report must adopt this (see `## Cross-report requirements for docs-writer`).

## Read tree

`harness.config.json` here has `phases.docs: false` (`harness.config.json:52`), so in this repository every dispatch takes the disabled no-op. All counts below are **this repository's measured files**, as a stand-in for a docs-enabled adopter. The adopter template equivalents are `cli/templates/claude/CLAUDE.md` 1 320 and `cli/templates/claude/context/conventions.md` 974 before `harness-analyze` fills it.

| File | Up-front / on-demand | Words |
|---|---|---|
| `plugin/agents/docs-reviewer.md` | up-front | 2 530 |
| `plugin/agents/docs-writer.md` (whole file, "Read … before you grade", `:55`; unreadable → `blocker:`, `:57`) | up-front | 3 483 |
| `.claude/CLAUDE.md` (auto-loaded) | up-front | 1 695 |
| `.claude/context/conventions.md`. `.claude/CLAUDE.md:40` routes "**Any implementation, review or planning**" to it, and the row is always generated (`cli/src/generators/claudeContext.ts:470`) | up-front (lead 13) | 5 864 |
| `harness.config.json` (`phases.docs`, `phases.parity`, `layers`, `stateDir`; `docs-reviewer.md:12`, `:16`, `:24`) | up-front | 154 |
| `doc_path` (the doc under review; the writer targets ~100–150 lines, `docs-writer.md` → `## Research methodology` item 6) | up-front, variable | ~1 000–1 500 |
| `existing_doc` (catalog, only when passed, `:36`) / scoped branch diff `diff_ref` (update, `:46`) | up-front, variable | variable |
| Boundary-owning layer's `layers[].conventions` doc, for operation spelling and stored-data vocabulary (checks 3–4, `:80-81`): here `.claude/context/cli.md` 2 647 or `plugin.md` 4 174 | on demand | 2 647–4 174 |
| Application, backend and `<reference_impl>` source (checks 1, 3–7) | on demand | n/a |
| Lessons ledger | not cited by this agent, and CLAUDE.md routes it to branch-level work only | — |

**Lead 13: the CLAUDE.md read list wins.** It is auto-loaded and is a direct instruction, and the agent definition neither forbids nor replaces it. The larger set is counted.

**Fixed up-front total: 13 726** (2 530 + 3 483 + 1 695 + 5 864 + 154), before the document and diff. The writer contract is 25 % of it, and the agent's own file is 18 %.

## Dispatch sites and phases

| Caller | Step | Mode | Dispatches |
|---|---|---|---|
| `docs_orchestration_instructions_autonomous.md` → `## Per-entry loop`, step 2 (`:69`) | per checklist entry | `catalog` | 1 plus up to 3 re-reviews (`:70`) per entry |
| same file → `## Final entry — INDEX` (`:84`) | INDEX doc | `catalog` | 1–4 |
| `docs_phase_instructions.md` → `## Loop` step 2 (`:40`) | per survey target, plus `missed_docs` ripple targets (`:43`) | `update` | 1–4 per target |

The docs phase runs only through **Override H**, which exists only in the autonomous forks (`plan_orchestration_instructions_autonomous.md:207-211`, `user_review_fixes_instructions_autonomous.md` → `## Override H`). The catalog command is also autonomous only (`plugin/commands/branch-start-docs-autonomous.md`). **No supervised or semi-autonomous flow dispatches this agent.** The docs phase has **no ledger entry** (`autonomous_pause_and_ledger.md:141`, `:153`).

## Prose classification

Word counts come from `sed -n 'a,bp' | wc -w` on `plugin/agents/docs-reviewer.md`, and each row sums to its section's measured count.

| Section (lines) | Total | ACTION | REFERENCE | WIRE | REDUNDANT | Notes |
|---|---|---|---|---|---|---|
| Frontmatter (1–6) | 84 | 0 | 0 | 84 | 0 | `name`/`tools`/`description` are read by the agent registry |
| Intro + no-edit (8, 10) | 82 | 20 | 22 | 0 | 40 | The "tool-level rather than prose" rationale at `:10` |
| Disabled-phase gate (12) | 102 | 30 | 0 | 0 | 72 | The return shape is the wire rule, and its single kept copy is `## Output contract` (`:116`). `:12` keeps only the trigger and a pointer (see thinning) |
| `## Resolved values` (14–25) | 460 | 0 | 280 | 0 | 180 | The `<repo_root>` row repeats CLAUDE.md's "Checkout root" block and `:65` |
| `## Invocation contract` (26–58) | 359 | 92 | 50 | 175 | 42 | The dispatch blocks (`:34-51`), the names-are-wire sentence and the `blocker:` rule (`:57`) are wire; `:55` (read the writer contract) is ACTION |
| `## Project layout` (59–66) | 165 | 0 | 90 | 0 | 75 | Near-verbatim copy of `docs-writer.md` → `## Project layout`, which the reviewer already reads; `:65` duplicates CLAUDE.md |
| `## What to verify` (67–95) | 841 | 330 | 361 | 90 | 60 | Checks 1–13 are ACTION. The detector regexes (`:70`, `:73`) are WIRE: `scripts/check-typos.sh:77` exempts this file for `[Ll]ines?`. `reachable? ✅ / ❌` and `⚠️ unverified` are writer-quoted literals. The value-vs-coordinate test (`:74-79`) is the grading standard |
| `## Unsolicited dispatch guidance` (96–105) | 296 | 60 | 110 | 66 | 60 | The heading is named in the `dispatch_discipline_instructions.md:68` roster; `(disregarded for verdict purposes)` and `context_notes:` are wire |
| `## Output contract` (106–118) | 141 | 21 | 0 | 120 | 0 | The return field names and the omit-`findings_file:`-when-disabled signal are what both callers parse |
| **Total** | **2 530** | **553** | **913** | **535** | **529** | |

Of `docs-writer.md` (which this agent reads in full as its grading contract), the reviewer grades against five sections, measured with their headings: `## Entry-point hints` 84 (`:77-80`), `## Research methodology` 734 (`:81-91`), `## Mode 1` 55 (`:93-100`), `### Write / update` 156 (`:115-121`) and both template sections 562 (`:123-181`), **1 591** in total. It does not need the remaining 1 892 words: frontmatter/intro, `## Resolved values`, `## Invocation contract`, `## Project layout`, `### Survey` and `## Output contract`.

## Draft work report template

One template covers both modes, with non-applicable items ticked `[x] n/a`. There is no PASS/FAIL split, because both outcomes write the findings file. The two no-file paths, the disabled phase (`:116`) and a `blocker:` (`:57`), write no report. The template is embedded at the end of `docs-reviewer.md`, and the agent appends it as the last section of `findings_path`.

Evidence fields carry **counts only**. Each anchor failure and each coordinate is listed once, in the findings body, so the writer never sees the same defect twice (see the risks table). Paths are repo-relative (lead 12): the catalog passes every path absolute (`docs_orchestration…:30`, `:68`), and the file is committed.

```markdown
## Work report — docs-reviewer
mode: <catalog|update> · slug: <slug> · iteration: <i> · follows: <review_<n>.md | none> · branch: <branch> · every path repo-relative

- [ ] DR1. **Read the writer contract** — Read `docs-writer.md` methodology, mode and template sections; blocker if unreadable. Evidence: sections read.
- [ ] DR2. **Read the dispatch inputs** — Read `doc_path`; plus `existing_doc` (catalog) or `diff_ref` (update). Evidence: repo-relative paths read, never absolute.
- [ ] DR3. **Resolve every anchor, both halves** — Check each anchor and prose path exists from root and its symbol greps inside it. Evidence: `<k>/<n> resolved`.
- [ ] DR4. **Classify every line-number detector hit** — Run both detectors; mark each hit value or coordinate; coordinates go in findings. Evidence: `hits h, values v, coordinates c`. (ref: docs-reviewer.md → ## What to verify, check 2)
- [ ] DR5. **Verify backend surface and reachability** — Open each named operation; check payload, response, `reachable?` marker across every layer path including `.`. Evidence: operations checked.
- [ ] DR6. **Route data-shape claims by layer** — Check each stored-data, field and enum claim against its own layer's source. Evidence: claims checked per layer.
- [ ] DR7. **Check gating, optimistic and sync claims** — Compare against the business-logic unit and the syncing listener.
- [ ] DR8. **Judge research depth and provenance** — Confirm the writer traced stored-data writers beyond the hints; shallow is FAIL.
- [ ] DR9. **Check parity pointers** — Pointers resolve under the reference implementation; divergences defensible. `n/a` when `phases.parity` is false.
- [ ] DR10. **Test unverified markers and omissions** — Each `⚠️ unverified` is not a grep away; no central flow, operation or data set missing.
- [ ] DR11. **Check merge/supersede** — Catalog with `existing_doc` only: old still-true content folded in. Otherwise `n/a`.
- [ ] DR12. **Check diff reflected, content preserved** — Update only: every observable diff change captured, untouched true content intact. Otherwise `n/a`.
- [ ] DR13. **Name ripple documents** — Update only: list other documents the diff affects as `missed_docs`. Otherwise `n/a`. Evidence: slugs or `none`.
- [ ] DR14. **Screen the dispatch for steering** — Quote any steering in the return, never here or as a finding. Evidence: `none` or item count.
- [ ] DR15. **Set the verdict** — FAIL only with a concrete correction per finding. Evidence: `result: <PASS|FAIL>, <n> findings`.
```

The template is 395 words without fences and 397 with them, by `wc -w`. DR15 deliberately uses `result:` and not a pasted `verdict:` line. A future grep of committed reviews for `^verdict:` therefore cannot double-count, and nothing parses review-file contents today: both callers parse only the return (`docs_orchestration…:69`, `docs_phase…:40`).

The `follows:` header field also settles an **ambiguous ownership** that exists today. `docs_phase_instructions.md:41` puts "open the new findings file with a one-line note naming the branch and the index it follows" in the orchestrator's Review step, but `docs-reviewer.md` never mentions such a note. A note the orchestrator writes before dispatch is clobbered by the reviewer's `Write`, and a prepend after the reviewer returns is never stated. Moving the note into the reviewer's own header gives it a certain owner.

## Thinning plan

**`plugin/agents/docs-reviewer.md`**: 2 530 → ~1 497 body, plus the 395-word template, ≈ **1 892**. The "After" column is **estimated by subtraction**. Where a cell includes kept-verbatim text, its measured sub-count is given so the margin can be checked.

| Section | Remove | Shorten | Keep verbatim (measured) | After (est.) |
|---|---|---|---|---|
| Frontmatter | — | — | all (84) | 84 |
| Intro + no-edit | the tool-level rationale | merge into one sentence: "the only file you write is `findings_path`" | — | 50 |
| Disabled-phase gate | the rationale, and the return shape duplicated from `:116` | "If `phases.docs` is not `true`: read nothing, write nothing, return as `## Output contract` → docs phase disabled." | — | 20 |
| `## Resolved values` | the `<repo_root>` derivation (CLAUDE.md owns it) and the meta-intro | the `<layer_path_map>` row | the `<state_dir>` and `<reference_impl>` rows, and the catch-all `"."` definition | 255 |
| `## Invocation contract` | the "costs a round" rationale (`:53`) | `:55` to a pointer, now that DR1 is an item | the dispatch blocks (`:34-51`, 74), the `blocker:` rule (`:57`, 63), and the names-are-wire + write-exactly-`findings_path` rule (`:30`, 82) | 230 |
| `## Project layout` | `:65`, and the restatement of the writer's own layout | to three one-line bullets | "backend normally outside every `layers[].path`" | 60 |
| `## What to verify` | the imperative halves of checks 1–13 (now DR3–DR13) | each check to its definition or standard | the colon detector (`:70`, 79), the value test (`:72-79`, 123), the no-nitpick rule (`:94`, 16), and "every layer path including `.`" | 400 |
| `## Unsolicited dispatch guidance` | the duplicated "never changes verdict / never blocks" tail, merged | the four steering classes to one line | the heading, `(disregarded for verdict purposes)`, the `context_notes:` channel, and the placement above the fixed return | 220 |
| `## Output contract` | — | — | all (141); **add** "append `## Work report` as the last section; number findings `F1…Fn`; every path repo-relative" (~25 + ~12) | 178 |

**Shared base file: not proposed.** The only cross-reviewer block is `## Unsolicited dispatch guidance`, and `dispatch_discipline_instructions.md:72` says that "the rule body lives in those definitions", with an agent-side pointer barred. See open question 3.

**`plugin/agents/docs-writer.md`** (this agent's grading contract): the docs-writer research owns its text. For this agent, **narrow the pointer at `:55`** to the five sections listed under Prose classification (1 591 instead of 3 483 words). This is a conditional saving: it is only real if the agent reads by section (`Grep -A`, or `Read` with offset/limit), because a pointer that names headings does not stop a whole-file read.

## Word-count ledger

Up-front:

| File | Today | After | Delta |
|---|---|---|---|
| `docs-reviewer.md` body | 2 530 | ~1 497 | −1 033 |
| Work report template (embedded) | 0 | 395 | +395 |
| **Agent-owned subtotal** | **2 530** | **~1 892** | **−638** |
| `docs-writer.md` (whole-file read; plus the 15-word ignore line from the cross-report requirements) | 3 483 | 3 498 | +15 |
| `.claude/CLAUDE.md` | 1 695 | 1 695 | 0 |
| `.claude/context/conventions.md` (lead 13) | 5 864 | 5 864 | 0 |
| `harness.config.json` | 154 | 154 | 0 |
| **Fixed up-front total** | **13 726** | **~13 103** | **−623** |
| *Conditional:* `docs-writer.md` read narrowed to five sections (the ignore line sits at `:63`, outside them) | 3 483 | 1 591 | −1 892 |
| *Fixed total with narrowed read* | 13 726 | ~11 196 | −2 530 |

If the docs-writer report's own thinning lands (3 483 → ~2 456, `docs-writer.md` report → `## Thinning plan`), a whole-file read falls by a further ~1 000 words. Its new `## Work report` block (~375) is part of that figure, and this reviewer does not need it. On demand nothing changes: no new text moves behind a `ref:`, and DR4's ref points into the agent's own already-loaded file.

**Constraint holds: yes**, by −623 even without the conditional narrowing. The REDUNDANT cuts (~529) and the moved ACTION prose pay for the 395-word template.

## Storage and lifecycle

| Question | Answer for docs-reviewer |
|---|---|
| Phases / flows | The docs-catalog engine (per entry plus INDEX) and the Override H docs phase in both autonomous forks. Never supervised or semi-autonomous. |
| Count per branch | Catalog: (entries + 1) × 1–4. Docs phase: (targets + ripple targets) × 1–4. |
| Storage key (leads 4, 11) | **`findings_path` as handed**: `<state_dir>/docs_catalog/reviews/<slug>/review_<i>.md`. The docs phase has no ledger id and the agent cannot see the run phase. A per-agent `work_reports/…/report_<index>` would collide across slugs unless the slug were added, and adding it recreates `reviews/<slug>/`. **Lead 11 applies directly.** Its only consumer is the writer's fix round, which is covered by the ignore line. |
| Index (lead 10) | The caller computes it (`:30`, "never one you compute yourself"). The docs phase uses the next free index (`docs_phase_instructions.md:41`); **the catalog does not**, starting at `i=0` (`docs_orchestration…:69`, `:84`). The INDEX entry is always present (`docs_orchestration…:33`, slug `index`) and the docs phase never reviews it (`docs_phase…:45`). So **any second catalog run** rewrites `reviews/index/review_0.md`, and so does an `existing:` refresh of a feature slug. The wrapper commits the result as an ordinary modification. The embedded report would inherit this, so the catalog should use next-free too. |
| Committed? (lead 3) | Yes, with no change. Catalog step 6 stages the `reviews/<slug>/` findings (`:75`), and the docs phase stages "review findings" (`docs_phase_instructions.md:44`). Both commit through `commit-on-branch.sh`, and **the committer agent is not involved**, so lead 3 does not arise. |
| PASS (leads 2, 8) | A PASS findings file is already written and committed, so neither lead applies. Only the disabled-phase and `blocker:` paths write nothing, and they stay report-free. |
| Tools (lead 1) | The `cp` half is **n/a**, because the template is embedded. The frontmatter has no `Edit` tool (`:4`), but in-place ticking is still possible: `Bash(sed:*)`, `Bash(cat:*)` and `Write` are on the unattended allow list (`cli/templates/claude/settings.autonomous.json:36-51`). **I choose a single end-of-run `Write`** for three reasons. It costs zero extra calls, because the report rides in the findings `Write` the agent already makes. Tick timing cannot be verified anyway (lead 6). And `docs-reviewer.md:10` makes the missing `Edit` a deliberate read-only guarantee, which a `sed -i` habit would erode in spirit. |
| Hooks | Every guard in `plugin/hooks/hooks.json` matches `Bash` only, so `Write` is not intercepted. |
| Evidence leakage (lead 12) | The catalog hands every path absolute (`docs_orchestration…:30`, `output_path` `:68`, `existing_doc` `:52`), and the review file is committed. Absolute paths in evidence would differ on every run and expose the home directory, which the harness already treats as a defect class ("machine-path check", `improvement_observations_instructions.md:38`). The fix is the header clause plus DR2's "repo-relative, never absolute". **The same rule should cover the findings body**, which has no such rule today; it is one clause added to `## Output contract`. The template has no timestamps and no env output. |
| Diff hygiene (lead 5) | `diff_ref` excludes `<state_dir>/*<branch>*` and `<state_dir>/docs_catalog/reviews/*` (`docs_phase_instructions.md:28-32`). The branch-level reviewers exclude `docs_catalog/reviews/*` too (`branch-reviewer.md:83`, `skeptic-reviewer.md:87`, `architecture-reviewer.md:109`, `business-parity-reviewer.md:100`, `review-plan-reviewer.md:83`). Reports embedded in reviews are therefore never graded as change-set content. A report location with no `<branch>` and outside `reviews/` would leak. |
| Orphan check (lead 9) | n/a: no meta-reviewer walks `docs_catalog/reviews/`. |
| Shared folder | `reviews/<slug>/` would hold two report shapes keyed on the same `<i>`: the writer's `write_<i>.md` (a separate file) and this agent's section inside `review_<i>.md`. In each pair `write_<i>` precedes `review_<i>`. The catalog `i=0` bug hits both files. |

## Cross-report requirements for docs-writer

The docs-writer report must adopt the following. I measured each figure here.

1. **Ignore line, +15 words.** Add this sentence to `docs-writer.md:63` (fix round), after "apply its Must Fix items": *"Ignore any `## Work report` section in it; that is the reviewer's record, not findings."* (15 words). Its W3 should say "findings only, never `## Work report`". Count the +15 in the writer's ledger. This line replaces the parenthetical I had put in the heading: an instruction to another agent placed in data saves nothing if the writer is never told.
2. **W9: zero coordinates, not zero hits.** Its W9 says "Grep … for line-number shapes; require zero hits" (`docs-writer.md` report `:88`). Against the broad shape detector (`docs-reviewer.md:73`), that pushes the writer to damage values, which `:77` calls "usually damage, not success". W9 must instead run the colon detector (`grep -nE ':[0-9]+'`, `docs-reviewer.md:70`) and classify every hit with the value-vs-coordinate test. Its evidence should be `hits h, coordinates 0`, never "0 hits".
3. **`write_<i>.md`: keep it a separate file and keep the reviewer independent.** For the writer, open question 1's "embed in the committed artifact" would mean the product doc, so a separate `write_<i>.md` in `reviews/<slug>/` is right. Its staging clause in both callers (`docs-writer.md` report `:149`) is the writer's change. **DR1/DR2 do not read `write_<i>.md`.** DR3 (anchors) and DR4 (detectors) re-run the checks that W8/W9 self-report, so they already check them independently. Reading the writer's self-assessment would add ~30 reviewer words plus a ~350-word read per dispatch, and it would anchor the reviewer on the writer's claims. My answer to the docs-writer report's open question 4 is therefore **no**.
4. **Finding ids.** Its W3 records "finding ids applied", but the reviewer defines no ids today (`:108`). The ids are supplied by my `## Output contract` addition, "number findings `F1…Fn`" (inside the +37 counted above).

## Risks and costs

| Risk / cost | Assessment |
|---|---|
| Token cost | About +400–600 output words per dispatch, carried in the same `Write`; no extra tool calls. |
| Goal (a) evidence | Tick timing is not claimed. The value lies in the counts: DR3 `k/n resolved`, DR4 `hits h, values v, coordinates c` (check 2 leaves no trace of its classification today), DR5 operations checked, DR13 `missed_docs`. They can be fabricated, but they can be spot-checked against the doc. |
| Goal (b) | A moderate gain. DR4 ("classify every hit, never drive to zero") and DR5 ("every layer path including `.`") are the two rules most likely to be skipped. |
| Writer misreads the report as findings | **The biggest risk.** The writer applies "its Must Fix items" (`docs-writer.md:63`) from a file whose format the reviewer never defines (`:108`), so unticked or `n/a` items could cost a round against the 3-round cap. Mitigations: count-only evidence (no duplicate defect lists), the ignore line (cross-report requirement 1), and numbered findings. |
| Ref-starvation (lead 7) | Avoided: check 2's regexes and value test, and check 3's every-layer rule, stay inline. DR4's single `ref:` points into the same file. |
| Actions split from rationale | Low. The checks are already terse, and their standards stay under the same numbering. |
| Prose that tooling keys on | `scripts/check-typos.sh:77` exempts this file for `[Ll]ines?`, so the regex must stay. No `cli/test` asserts on this agent's text (a grep of `cli/` finds no match). The heading `## Unsolicited dispatch guidance` is named in the roster at `dispatch_discipline_instructions.md:68`. Both callers parse the return field names. |
| Duplicate checklist | The saving holds only if the imperative halves of `## What to verify` are actually cut, not kept beside the template. |

## Open questions

1. Should the synthesis make "**embed in the run artifact the caller already commits**" the default wherever a findings file exists? It must not mean a product artifact: for writers whose output is a product doc, a separate file in the committed folder is the analogue (`write_<i>.md`).
2. Should there be a section-scoped reading convention that agents actually honour, for agents that read sibling contracts in full as grading standards? For this agent it is the largest saving (−1 892), but a soft one.
3. Can `## Unsolicited dispatch guidance` (~300 words × 10 agents, `dispatch_discipline_instructions.md:68`) move into a shared reviewer-base file? That would need the clause at `:72` revisited.
4. Is the catalog `i=0` overwrite (`docs_orchestration…:69`, `:84`) fixed independently of work reports?
5. Should one minimal findings format (`F1…Fn`, each with claim, contradicting file and correction, then `## Work report` last) be pinned in `docs-reviewer.md` → `## Output contract`? It would also satisfy docs-writer's W3.
6. Cross-report dependency: the ignore line, the W9 detector rule and finding ids (`## Cross-report requirements for docs-writer`) must land together with both reports, or the misreading risk returns.

## Review response

All Must Fix and Should Fix findings and all Nice to Have items are applied. Bug claim 1 is confirmed and folded into Storage → Index. Bug claim 2 is accepted and reworded as ambiguous ownership. No finding was rebutted. One figure differs from the review: Nice to Have 1 gives the five-section sum as 1 588. My re-measurement with headings is 1 591 (`sed -n` over `:77-80`, `:81-91`, `:93-100`, `:115-121`, `:123-181` of `docs-writer.md`, `wc -w`: 84 + 734 + 55 + 156 + 562), and 1 591 is used.
