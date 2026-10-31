# Work report research — conventions-reviewer

## Verdict

**Recommend with changes.** There should be no report file at all. That is not because the agent lacks a write path: it has `Bash`, so `cat` or `sed` redirection could write one. The reasons are these:
- The agent's `tools:` allowlist omits `Write` and `Edit` on purpose. That omission is its read-only guarantee (`plugin/agents/conventions-reviewer.md:13`), and `.claude/context/plugin.md` → `## Frontmatter` makes widening past the output surface a finding.
- A `/autonomous-sdlc-harness:harness-analyze` run has no committer behind it, so a file would be untracked litter (`docs/analyze.md:217`, §12 (d2)).

The checklist should be **embedded in the agent definition** and **returned inline** as a final `work_report:` field after `summary:`. Its one named consumer is step 6 of `harness-analyze`, under the sibling report's **combined caller edit**, which this report adopts. Goal (a) is weak here, because the record exists only in the session. Goal (b) is real: the agent runs 15 + 6 checks, each with its own exemptions.

Most of the up-front saving does not depend on the report:
- narrowing the read of `conventions-writer.md` to the four sections the reviewer grades against, plus the writer's checklist;
- cutting about 1 180 redundant words of rationale.

## Read tree

| File | Up-front / on-demand | Words |
|---|---|---|
| `plugin/agents/conventions-reviewer.md` | up-front | 5 893 |
| `plugin/agents/conventions-writer.md`, read whole ("Read … before you grade", `:15`) | up-front | 5 108 |
| `.claude/CLAUDE.md`, auto-loaded. Measured on the raw template `cli/templates/claude/CLAUDE.md` with `{{routingRows}}` unrendered, so it is a **lower bound**; this repository's rendered copy is 1 695 | up-front | ≥ 1 320 |
| `document_path` (`pass: document`) | up-front, variable | here 2 647–5 864 |
| `shared_document` (`pass: document`, unless `none`, `:53`, `:59`) | up-front, variable | here 5 864 |
| Every `corpus_documents` member (`pass: corpus`, `:116`), here `cli.md` + `conventions.md` + `plugin.md` + `CLAUDE.md` | up-front, variable | here 14 380 |
| `prior_prompts` / `prior_rule_block`, strings carried in the dispatch | up-front, variable | n/a |
| Cited files in `scope` and `harvested_sources` (check 3, `:91`) | on demand | n/a |
| `${CLAUDE_PLUGIN_ROOT}/agents/` listing (check 12, C2; `:109`, `:120`) | on demand, Glob | n/a |
| Commit-subject probe over the plugin tree + `<scripts_dir>` (`:93`) | on demand | n/a |
| `docs/analyze.md` (10 788), `docs/development.md` (52 247) | cited as rationale, never read; not on an adopter's disk | — |
| Lessons ledger | not cited | — |

**Fixed up-front total today: 12 321** (5 893 + 5 108 + 1 320), and 12 696 with this repository's `CLAUDE.md`.

**Lead 13 (read-list conflict).** The routing row "Any implementation, **review** or planning" points at `.claude/context/conventions.md` (`.claude/CLAUDE.md:40`). Its source is `cli/src/generators/claudeContext.ts:470`. Obeying it costs 974 words (the adopter skeleton) or 5 864 (here). This is an **extra-read cost, not a wrong-grade bug**, for two reasons:
- `:34` bars only resolving *values* from a conventions document.
- That file is a graded subject anyway, and when it is still an unfilled skeleton, `:59` neutralises it.

The definition wins. Count the larger set only as a worst case.

## Dispatch sites and phases

| Caller | Step | Pass | Dispatches per run |
|---|---|---|---|
| `plugin/commands/harness-analyze.md` → `(4c)` (`:344-379`) | after each delegated document's write | `document` | 1 per written document, never repeated (`:79`) |
| same → `(4d)` Iteration 1 (`:455-458`) | after all documents | `corpus`, `iteration: 1` | 0–1. Skipped when there are fewer than two members or no `fixable` member (`:451`) |
| same → `(4d)` Iteration 2 (`:476`) | over the narrowed set | `corpus`, `iteration: 2` | 0–1 |

- **No branch flow, ledger or unit loop dispatches this agent.** `dispatch_discipline_instructions.md:70` excludes it from the roster for that reason.
- The dispatch is a closed block (`harness-analyze.md:374-379`).
- The caller already takes the named field: "Take the reviewer's `findings:` return" (`:365-368`), and "Take its `findings:` and group them" (`:458`).

## Prose classification

Section totals come from `sed -n 'a,bp' plugin/agents/conventions-reviewer.md | wc -w`. The splits are estimates against those totals.

| Section (lines) | Total | ACTION | REFERENCE | WIRE | REDUNDANT | Notes |
|---|---|---|---|---|---|---|
| Frontmatter (1–6) | 83 | 0 | 0 | 83 | 0 | Registry fields |
| Intro (8–17) | 361 | 40 | 120 | 40 | 161 | `:13` (117 words) restates the description, `## Output contract` and the §12 rationale. `:15`'s list duplicates the writer file the agent is told to read |
| `## Resolved values` (19–34) | 585 | 0 | 330 | 0 | 255 | The `<app_dir>` row ("no step … consumes"). The `<repo_root>` row duplicates CLAUDE.md. The `<scripts_dir>` probe sentence is repeated in check (7) |
| Invocation, document (36–62) | 637 | 0 | 180 | 330 | 127 | Field tables and "names are the wire" (`:40`). The fixture-gate aside at `:61` is redundant |
| Invocation, corpus + counts + stop (63–81) | 489 | 60 | 120 | 250 | 59 | Stop and blocker (`:79`, `:81`) |
| `## What to verify` (83–112) | 2 232 | 700 | 1 150 | 70 | 312 | ACTION is each check's headline and "Concrete correction", which the agent copies into its findings. Exemptions are the grading standard (lead 7) |
| Corpus pass (114–150) | 1 094 | 300 | 560 | 60 | 174 | False positives (a)–(c) are the grading standard (zero findings over a good corpus, `:148`) |
| `## What you do not do` (152–160) | 149 | 0 | 80 | 0 | 69 | The no-verdict rationale repeats `:13` |
| `## Output contract` (162–179) | 218 | 0 | 18 | 200 | 0 | Byte-stable fields (`:164`) |
| `## House rules` (181–185) | 45 | 10 | 10 | 0 | 25 | "Minimal prose" is an instruction to authors |
| **Total** | **5 893** | **1 110** | **2 568** | **1 033** | **1 182** | |

**`conventions-writer.md`, as the reviewer grades against it.** Four sections are needed, 2 638 words in total:

| Section | Words | Why the reviewer needs it |
|---|---|---|
| `## Scope` | 243 | The reconciliation rule cited at `:144` |
| `## The document` | 1 906 | Banner, prompts, rule block, provenance, the census, stack and intent tests, `## Not determined`, and the declined-line literal (`:130`) |
| `## The fix dispatch` | 237 | The bounded-merge correction (`:136`), which false positive (b) mirrors, and the corpus-declined literal duty (`:138`), which check (11) mirrors |
| `## House rules` | 252 | The line-number shapes (`:166`) that check (8) depends on, because check 8 names none itself; the repo-relative path rule (`:168`) for check (14); the `.claude/**` / `qa_test_scenarios.md` ban (`:170`) for check (15) |

Not needed: frontmatter and intro 199, `## Resolved values` 750, `## Invocation contract` 881 and the fields of `## Output contract`. If the sibling plan lands, the writer's embedded checklist at the end of `## Output contract` (385 words) is **added** to the read, so the reviewer sees what the writer ticks.

## Draft work report template

The template is embedded at the end of `conventions-reviewer.md` and emitted as the last return field. It is not copied to disk; the reasons are in `## Verdict`. On an item that does not apply, the agent writes `[n/a]` with a reason, and `[x] clean` is a valid tick. The `→` evidence is required only where an item shows it. Section labels are bracketed text, so they cannot be read as dispatch fields.

```
work_report:
[both axes]
- [ ] W1. **Values present, dispatch legal** — Confirm every required value for this `pass`; on absence, re-dispatch or bad `iteration`, return a blocker and stop. (ref: ## Invocation contract)
- [ ] W2. **Root derived, writer contract read** — Bare `git rev-parse --show-toplevel`; read the writer's Scope, The document, The fix dispatch, House rules; resolve no value from conventions documents.
[document axis]
- [ ] D1. **Document contract and prompts** — Banner, real example, no unfilled marker, provenance line, `## Not determined`; every `prior_prompts` line answered. (ref: check 1)
- [ ] D2. **Rule block survives** — Compare the supplied `prior_rule_block` only; `none`/`n/a` raise nothing.
- [ ] D3. **Provenance supports each rule** — Grep the asserted construct per cited file within scope ∪ `harvested_sources`; apply the history/intent, build-output and greenfield sub-rules. (ref: check 3) → rules checked / unsupported.
- [ ] D3a. **Commit-subject closure** — `conventions` target only: re-run the probe; → emitted subjects outside list ∪ exclusions.
- [ ] D4–D8. **Contradiction, demand, vocabulary, excluded, coordinates** — Run checks 4–8; check 6 skipped on `shared_document: none`.
- [ ] D9–D11. **Census, stack, intent, Not determined** — Apply both line tests, intent sourcing, collapse rule, declined-line literal. (ref: checks 9–11)
- [ ] D12–D13. **Actors and process** — Actor names resolve under `${CLAUDE_PLUGIN_ROOT}/agents/`; no work-grouping rule outside the `conventions` carve-out.
- [ ] D14. **Paths resolve from root** — `test -e` each location token, five classes exempt; greenfield n/a. → unresolved count.
- [ ] D15. **No forbidden write** — No rule writing under `.claude/**` or cataloguing in `qa_test_scenarios.md`.
[corpus axis]
- [ ] K0. **Set read, unfilled excluded** — Read every member sent (iteration 2: only those); name any unfilled member in `summary:`. → members read.
- [ ] K1–K6. **C1–C6 between members** — Raise only cross-member defects; skip checks 1–15 on members already document-passed.
- [ ] K7. **Project member** — Checks 3,4,7,8,9,10,12,13,14,15 over its two composed sections only.
- [ ] K8. **False positives dropped** — Discard findings matching (a) demand-set answers, (b) unbounded merge corrections, (c) unfilled evidence.
[close]
- [ ] Z1. **Findings actionable** — Each has evidence anchor (no line coordinate), concrete correction and the misled reader; else drop it.
```

**How the two axes are handled.** The agent emits only its own axis's section, plus W and Z. The checks themselves, with their headlines, exemptions and concrete corrections, **stay as numbered prose** in the definition, because the agent copies each correction into its findings. The items point into that already-loaded prose, so no `ref:` leads to a file that has not been read.

## Thinning plan

| File | Remove | Shorten | Keep verbatim | Est. after |
|---|---|---|---|---|
| `conventions-reviewer.md` | The REDUNDANT 1 182 words: `:13`'s rationale down to one sentence; the `<app_dir>` row; the `<repo_root>` row (point to CLAUDE.md); check (7)'s duplicated probe sentence; the `docs/analyze.md` / Gate 8 asides at `:61`, `:90`, `:148`; the verdict rationale in `## What you do not do`; "Minimal prose" | REFERENCE trimmed only at the edges (2 568 → ~2 250). ACTION is **kept** (1 110), because the check prose and its corrections stay | Frontmatter, both dispatch tables, the stop condition, the id space, false positives (a)–(c), and `## Output contract` plus one `work_report:` line | 83 + 950 + 2 250 + 1 110 + template ≈ **4 393 + template** |
| `conventions-writer.md` (as read) | Read instruction at `:15` narrowed to `## Scope`, `## The document`, `## The fix dispatch`, `## House rules`, plus the writer's checklist if the sibling plan lands | — | The writer file is unchanged by this plan | 2 638 (narrowing alone) |
| `.claude/CLAUDE.md` | — | — | Unchanged | ≥ 1 320 |
| `harness-analyze.md` | — | — | No separate sentence. This report adopts `docs/work-report-research/conventions-writer.md` → `## Combined caller change`: forward `findings:` only, a no-forwarding rule for `work_report:`, and step 6 printing each reviewer report reduced to its unticked and `n/a` items (≈ 90 words caller-side, shared with the sibling) | — |

**Dependency on the sibling plan.** Both plans touch `conventions-writer.md`. Any rule the reviewer grades must keep its home in the four narrowed sections, and the writer's checklist may only point into them. The sibling's draft does this: its items carry `ref: ## The document` and `ref: ## Resolved values`, and its `## Verdict` keeps the content-contract REFERENCE in place. Its W13 self-check, however, restates House-rules content (line-number shapes, repo-relative paths, the `.claude/**` write ban), so `## House rules` must not be shortened to template-only. If the two plans cannot be landed together, the narrowing waits for the joint thinning (sibling open question 3).

## Word-count ledger

The embedded template measures **373 words** (`wc -w`).

| Up-front | Before | After: narrowing only | After: both plans | Notes |
|---|---|---|---|---|
| `conventions-reviewer.md` (incl. template) | 5 893 | ~4 766 | ~4 766 | This plan |
| `conventions-writer.md` (as read) | 5 108 | 2 638 | ~2 458 | Narrowing −2 470 is this plan's. The sibling's cuts inside the four sections (Scope −93, The document −348, fix dispatch −72, House rules −52 = −565) plus its +385 checklist (net −180) are **the sibling's**, counted once here and not in its own −1 132 figure, which assumes a whole-file read |
| `.claude/CLAUDE.md` | ≥ 1 320 | ≥ 1 320 | ≥ 1 320 | Lower bound |
| **Fixed up-front total** | **12 321** | **~8 724** | **~8 544** | |

**Constraint holds: yes.** The margin is about 3 597 words from this plan alone, or about 3 777 with both plans. Stated plainly: the report itself **adds** 373 words to the definition and 150–400 per dispatch to the return. The saving comes from the narrowed writer read (−2 470) and the cut rationale (−1 182), and both are available without any work report.

## Storage and lifecycle

- **Proposed path `<state_dir>/work_reports/<branch>/<phase>/<agent>/report_<index>.md`: not workable.**
  - There is no ledger phase and no run.
  - `<branch>` is whatever the adopter has checked out.
  - Nothing commits it (`docs/analyze.md:217`).
  - A write through `Bash` would break the guarantee the allowlist omission makes tool-level (`:13`).
- **Lead 1 (tools).** `harness-analyze` is supervised, so `cli/templates/claude/settings.autonomous.json` does not govern it. The choice of no file rests on the read-only guarantee and the missing committer, not on whether a tool exists to write one.
- **Inline return.** Needs no index, no key, no commit, no hook exemption and no orphan rule (leads 3, 8, 9 and 10 are all n/a). Step 6 keys each report by `document_path` on the document pass and by `iteration` on the corpus pass.
- **Dispatches per run:** N document passes plus at most 2 corpus passes.
- **Hooks:** none apply, since the agent writes nothing.
- **Lead 11 (embed in an artifact):** rejected. The only durable artifact is the adopter's document, and its `## Not determined` is graded by checks (9) and (11).
- **Lead 12 (leaks):** nothing is committed. Evidence stays repo-relative, because step 6 echoes it.

**No field vs. emitted field.** There were two options:
- **(i) Embedded checklist, no field.** Costs 373 words up-front and nothing per dispatch. It serves goal (b) only.
- **(ii) Emitted `work_report:`.** Adds 150–400 words per dispatch to the main session, which step 6 reduces to unticked and `n/a` lines. It satisfies the wire rule "every value a return carries is one the report or the next dispatch consumes" (`docs/analyze.md:133`) **only** with the combined caller edit.

This report chooses (ii), so that step 6 reports both agents the same way. (i) is the fallback if the caller edit is not taken.

## Risks and costs

| Risk | Assessment |
|---|---|
| Checklist lines reaching the writer as findings | **Low; the boundary is parsed by the model, not by code.** The caller already takes the named `findings:` field (`:365`, `:458`), and `work_report:` sits after a one-line `summary:`. There is still no automated test (no match in `cli/test`, `scripts`, `plugin/hooks`), so the combined edit's "that field only" wording and the bracketed labels close the residue. Escape cost: permanent `Reviewer finding not applied — ` lines in the adopter's document (`conventions-writer.md:130`) |
| Joint thinning with the writer (biggest) | If the sibling makes a graded rule template-only, or shortens `## House rules`, the narrowed read loses the grading standard for checks 8, 14 and 15. The rule: graded rules keep their home in the four sections, and the writer's checklist only points |
| Pressure to find something | Gate 8 requires zero findings over a good corpus (`:148`). Z1, K8 and the `[x] clean` tick counter this |
| Goal (a) | Unverifiable. The report is written at the end by construction (one final message). Only D3, D3a, D14 and K0 carry evidence |
| Ref-starvation (lead 7) | Avoided, because every `ref:` points into the agent's own loaded file |
| Main-session context | 150–400 words per dispatch, or about 1–3k over a run. `docs/analyze.md` §11 names this as the cost delegation avoids; the step-6 reduction limits what is printed, not what is received |
| Tool calls | None extra |
| Wire edits | One field in `## Output contract`; the combined `harness-analyze.md` edit; `docs/analyze.md` `## 8` field sets |

## Open questions

1. Should the synthesis allow an **inline-only report class** for agents with no commit point (this agent and `conventions-writer`)?
2. Should the reviewer's narrowed read and the writer's thinning land as **one change** (sibling open question 3), so that no graded rule becomes template-only?
3. Should the narrowed read be a standalone change? It is the largest saving and has nothing to do with reports.
4. Should `cli/src/generators/claudeContext.ts:470` scope "Any implementation, review or planning" so that setup-command agents are excluded?

## Review response

- **Must Fix 1, Must Fix 2 and Should Fix 1–6:** applied.
- **Should Fix 2:** applied by naming step 6 as the consumer through the combined edit. Option (i) is kept as the fallback.
- **Should Fix 3:** the risk is downgraded, but the "biggest risk" label moves to the joint-thinning dependency rather than being dropped.
- **Nice to Have 1 and 2:** applied.
- **Bug claim:** accepted. Lead 13 is reworded as a cost, not a defect.
- **Rebuttals:** none.
