# Work report research — conventions-writer

## Verdict

**Recommend with changes.** A checklist helps with this agent's most-missed rules:
- grep before citing;
- no line numbers;
- remove the `<!-- harness:unfilled -->` marker;
- quote the `prior_*` fields before overwriting;
- keep actors as roles and cite cross-layer rules to the shared document;
- run the census, stack, process and intent tests on every line.

A per-run report **file** does not fit, for three reasons:
- The agent's own fence bars any write outside `document_path`, "including into `<state_dir>`" (`plugin/agents/conventions-writer.md:70`).
- The dispatching command has no branch, ledger, committer or commit point (`plugin/commands/harness-analyze.md:191`).
- The caller builds its report "from this return alone" (`conventions-writer.md:160`).

The changes:
- Embed the template in `## Output contract`.
- Return it inline as a new final field, `work_report:`. Step 6 is its named consumer, as the design's wire rule requires: "every value a return carries is one the report or the next dispatch consumes" (`docs/analyze.md` → `## 8`, `:133`).
- Cut about 1 300 redundant body words.
- Leave the content-contract REFERENCE prose in place, because `conventions-reviewer` grades against it (`plugin/agents/conventions-reviewer.md:15`).

The hard constraint holds. The dispatched prompt (the body) goes from 4 990 to about 3 920 words. The full file goes from 5 108 to about 3 976.

## Read tree

These figures are measured in this repository, which has self-adopted the harness. Its layers are `cli`, `plugin`, and `general` (whose document is `.claude/context/conventions.md`).

| File | Up-front / on-demand | Words |
|---|---|---|
| `plugin/agents/conventions-writer.md`, whole file | up-front | 5 108 |
| ↳ frontmatter (`:1-6`). The `description` appears in the parent's agent listing and is not part of the dispatched prompt | not in the dispatched prompt | 118 |
| ↳ body (`:7-170`) | up-front | 4 990 |
| `.claude/CLAUDE.md`, auto-loaded. A first-run adopter sees the template `cli/templates/claude/CLAUDE.md` (1 320) | up-front | 1 695 |
| `harness.config.json` (`layers`, `stateDir`, `scriptsDir`, `githooksDir`, `parity`, per `conventions-writer.md:14-25`) | up-front | 154 |
| `document_path` before the write. It must be read to quote `prior_*` (`:158`). Skeletons run 300–974 words (`cli/templates/claude/context/*.md`). A `merge` here reads `cli.md` 2 647, `plugin.md` 4 174 or `conventions.md` 5 864. On a newly named path the file is `absent` (`:120`) | up-front | 300–5 864 |
| `shared_document`, the vocabulary anchor (`:53`, `:116`), read on layer dispatches that carry a path. Here that is `conventions.md` | up-front on layer dispatches | 0 / 5 864 |
| `harvested_sources` (the adopter's README and other prose) | up-front unless `none` | variable |
| `demand_set`, `findings`, `prior_*`: dispatch payload | up-front | variable |
| Source under `scope`, which is the research itself | on demand | n/a |
| Commit-subject probe: the plugin's own tree and `<scripts_dir>`, read for subject strings only, on the shared-document dispatch only (`:22`) | on demand | variable |
| Sibling conventions documents and `.claude/CLAUDE.md`, on a `pass: corpus` fix only (`:29`) | on demand | 1 695–12 685 |
| `plugin/commands/harness-analyze.md` (`:35`, `:149`), `plugin/agents/task-plan-writer.md` and `plugin/instructions/qa_test_instructions.md` (`:170`) | cited, never told to read | — |

**Read-list conflict (lead 13).** `.claude/CLAUDE.md:40` tells "any implementation, review or planning" to read `context/conventions.md` (5 864 words). The definition says "You never open a conventions document to resolve a value of your own" (`:27`). The definition wins. The agent reads that file anyway as `shared_document` on layer dispatches.

**Up-front load per dispatch**, for a layer `merge` here: 4 990 + 1 695 + 154 + about 3 400 (the target) + 5 864 (the anchor) ≈ **16 100** words, plus the payload. Only the agent's own share, the **4 990-word body**, can change.

## Dispatch sites and phases

The only caller is `plugin/commands/harness-analyze.md`, a "Supervised, first-session command" outside every branch flow (`:50`). No instruction file dispatches this agent: grepping `plugin/instructions` finds only a quote, at `mention_reading.md:64`.

| Step | Shape | Count per run (this repo: 3 documents) |
|---|---|---|
| Shared cross-layer chain, sent first (`:164-171`, `:241-243`) | `pass: document`, write | 1 |
| Write wave (`:244-247`) | `pass: document`, write or merge, one per layer document | N−1 = 2 |
| Fix wave after the single review (`:365-368`) | `pass: document` + `findings` + `prior_*` | ≤ N = 3 |
| (4d.0) reconciliation (`:388-397`) | `pass: corpus`, shared document, `Layer-writer divergence — ` lines | ≤ 1 |
| (4d) iteration 1 and 2 fixes (`:455-468`, `:476`) | `pass: corpus` + `findings` | ≤ 2 per fixable document = 6 |

That is at most 13 dispatches per run. Re-runs are allowed, and they carry no run id.

## Prose classification

Section totals come from `sed -n 'a,bp' plugin/agents/conventions-writer.md | wc -w`. The split inside each section is an estimate, made line by line.

| Section (lines) | Words | ACTION | REFERENCE | WIRE | REDUNDANT | Notes |
|---|---|---|---|---|---|---|
| Frontmatter (1-6) | 118 | – | – | 58 | 60 | Not in the dispatched prompt. The 60 words are `description` repeating `:35`'s count sentence. Cutting them shortens the parent's agent listing, not this agent's load |
| Intro (8-10) | 81 | – | 30 | – | 51 | `:10` is design rationale (why this is not docs-writer) |
| `## Resolved values` preamble (12-15) | 68 | – | 25 | – | 43 | |
| Resolved table (16-25) | 543 | 90 | 250 | – | 203 | Cut the `<app_dir>` row, which states "no step … consumes" it (`:20`). Shrink the `<repo_root>` row (64 words) to one line, because `:45` and `:168` use the token. Cut only its shell-rule sentence, which restates CLAUDE.md. The `<scripts_dir>` probe (`:22`) is ACTION |
| No conventions read + corpus read relaxation (27-29) | 138 | 20 | 60 | – | 58 | "emphatically not a licence to write" restates `## Scope` |
| `## Invocation contract` intro (33-35) | 137 | – | 40 | 25 | 72 | Repeats the frontmatter counts. "Field names … silently breaks the caller's parse" is wire |
| Write-dispatch table (37-51) | 300 | – | 110 | 140 | 50 | The field names are wire |
| `shared_document: none` cases (53) | 89 | 29 | 60 | – | – | |
| Fix dispatches, both axes (55-57) | 165 | 30 | – | 60 | 75 | The corpus paragraph restates the document paragraph |
| Two findings origins (59-64) | 133 | 20 | 43 | 70 | – | `Layer-writer divergence — ` is wire, quoted at `harness-analyze.md:394`. The `C1`–`C6` ids are defined at `conventions-reviewer.md:118` onwards |
| Stop condition (66) | 57 | 40 | – | 17 | – | The blocker return is wire |
| `## Scope` (68-76) | 243 | 80 | 70 | – | 93 | `:72` restates `:70` and `:29`. The heading stays because `harness-analyze.md:316` cites it |
| `## The document` tests (78-100) | 628 | 120 | 420 | – | 88 | The census, stack, process and intent tests. The REFERENCE here is the reviewer's grading standard |
| Every-dispatch bullets (102-114) | 598 | 260 | 250 | 20 | 68 | The banner literal is wire |
| Shared-document divergence (116) | 187 | 50 | 50 | 15 | 72 | The corpus explanation is repeated at `:149` |
| Merge / absent document (118-120) | 240 | 80 | 70 | 30 | 60 | The values `prior_document: absent` and `n/a` are wire |
| Closing obligations + `## Not determined` (122-130) | 253 | 70 | 83 | 40 | 60 | `<!-- harness:unfilled -->` and `Reviewer finding not applied — ` are wire (also grepped in `docs/development.md:524`, `:540`) |
| `## The fix dispatch` (132-138) | 237 | 80 | 70 | 15 | 72 | `:138` repeats `:130` and `:134` |
| `## Output contract` fields (140-156) | 438 | – | 90 | 250 | 98 | The field names are byte-stable (quoted at `mention_reading.md:64`) |
| `prior_*` and why the fields carry text (158-160) | 202 | 40 | 80 | – | 82 | |
| `## House rules` (162-170) | 252 | 80 | 120 | – | 52 | |
| **Total** | **5 107** | **1 089** | **1 921** | **740** | **1 357** (body only: **1 297**) | |

## Draft work report template

The template is embedded at the end of `## Output contract`. It is returned as `work_report:`, **appended after `notes:`** as the last field, so no existing field moves (`:35` forbids reordering). There is one template for every dispatch shape. An item that does not apply gets `n/a` and a one-word reason. Evidence after `→` is mandatory wherever an item shows it. A `blocker:` return carries no report.

```markdown
work_report:
- [ ] W1. **Check required dispatch values** — Confirm pass, target, document_path, action, scope, mode, excluded_paths, harvested_sources, demand_set, shared_document; fix: findings, prior_*. Missing, or findings line lacking id/prefix → blocker. → `pass=… action=… target=…`
- [ ] W2. **Quote pre-write state first** — Read document_path before writing; quote prior_document/prompts/rule_block verbatim. No file → `absent`, `n/a`. Fix: re-emit handed values. → `prior_document=…`
- [ ] W3. **Gather evidence inside scope only** — Never excluded_paths; on a large repo sample and name what was not read. → `sampled: … / not read: …`
- [ ] W4. **Run commit-subject probe** — Shared cross-layer document only; account for every omitted subject. (ref: ## Resolved values) → `subjects=N, omitted=N`
- [ ] W5. **Reconcile harvested prose against code** — Contradicted → Not determined with both sides; uncorroborated intent → attributed. Merge: keep adopter rules, list contradictions.
- [ ] W6. **Grep each cited file first** — Grep the construct per code-shape rule; build-output claims off build config, never ignore rules; greenfield → n/a. → `rules=N, grepped=N`
- [ ] W7. **Apply census, stack, process, intent tests** — Per line; failures cut or moved to Not determined. (ref: ## The document)
- [ ] W8. **Keep banner, rule block, example** — Rewrite banner, answer What-belongs-here, keep rule block, real example, cover demand_set. Absent file: compose same shape, no marker.
- [ ] W9. **Bind roles, cite cross-layer owner** — Actors are roles, not adopter agents; multi-layer rule cites the shared document. Shared document adds flow, testing, commit policy; parity only if sent.
- [ ] W10. **Record shared-document divergences** — pass: document with a shared_document path only; lines go to the return, never the document.
- [ ] W11. **Apply or decline every finding** — Fix only; each declined → own `Reviewer finding not applied — ` line plus findings_declined; merge only other Not-determined lines. → `applied=N, declined=N`
- [ ] W12. **Write the document once, whole** — One Write of document_path; touch no other file.
- [ ] W13. **Self-check the written document** — Marker gone, footer replaced, Not determined present, no line numbers, paths repo-relative, no `.claude/**` write step. → `unfilled=0, line-refs=0`
- [ ] W14. **Measure every count, return text** — Each number from a command this dispatch; return fields carry lines verbatim. → `counts=N`
```

The template has 14 items and measures 385 words (`wc -w`).

## Thinning plan

| File | Remove | Shorten | Keep verbatim | Est. after |
|---|---|---|---|---|
| `conventions-writer.md` body | The body REDUNDANT column (≈ 1 297): the `<app_dir>` row; the shell-rule sentence of `<repo_root>`; `:10`; the count repeat at `:35`; `:57`; `:72`; `:138`; the rationale at `:145`, `:149` and `:158-160`; the second `<scripts_dir>` explanation in the process carve-out | ACTION sentences the template now carries and the reviewer does not grade: the W1 stop condition, W2 timing, W12, W14. Each becomes a clause (≈ −200) | Every heading the command cites (`## Scope`, `## The document`, `## House rules`, `## Output contract`, `## Invocation contract`); every WIRE literal and field name; every census, stack, process and intent test with its carve-outs | 4 990 − 1 297 − 200 + 385 + 40 (`work_report:` field line) ≈ **3 918** |
| `conventions-writer.md` frontmatter | 60 words of `description` | – | `name`, `tools`, `model` | 118 → 58 (parent listing only) |
| `plugin/commands/harness-analyze.md` | – | – | – | One combined edit, ≈ +90 words (see `## Combined caller change`) |
| `docs/analyze.md` (design note) | – | – | – | Add `work_report:` to the wire-reading field sets (`## 8`, `:133`), and record the inline-return choice beside (d2) (`## 12`, `:217`) |

**Effect on `conventions-reviewer`.** It reads this file too, and the effect depends on whether the sibling report's narrowing is adopted (`docs/work-report-research/conventions-reviewer.md` → Thinning plan):
- **(a) Narrowed** to `## Scope` + `## The document` (2 149 words): the reviewer gains only the cuts inside those two sections, 93 + 88 + 68 + 72 + 60 + 60 ≈ **441**, and reads ≈ 1 708. The template sits in `## Output contract`, so it never reaches the reviewer. That is a reason for placing it there.
- **(b) Not narrowed** (whole file, 5 108 words): the reviewer reads ≈ 3 976, which already includes the +385 template words. That is ≈ −1 132.

**No shared base file.** This read set belongs only to this agent and its reviewer, so a base file would add a read rather than remove one.

## Word-count ledger

| File (agent's own share, up-front) | Before | After | Delta |
|---|---|---|---|
| `conventions-writer.md` body (template embedded) | 4 990 | ≈ 3 918 | ≈ −1 072 |
| Separate template file | 0 | 0 | 0 |
| `.claude/CLAUDE.md`, `harness.config.json`, target, anchor | unchanged | unchanged | 0 |
| **Total up-front (dispatched prompt)** | **4 990** | **≈ 3 918** | **≈ −1 072** |
| Whole file including frontmatter (for reference) | 5 108 | ≈ 3 976 | ≈ −1 132 |
| On-demand (siblings on a corpus fix, probe, source) | unchanged | unchanged | 0 |

**Constraint holds: yes.** **Break-even:** the template plus the field line adds 425 words. With no ACTION shortening at all, the constraint holds as long as at least **426 of the 1 297** body REDUNDANT words are actually cut, which is about a third of the column. All of the saving comes from removing redundancy, not from the mechanism.

## Combined caller change (shared with conventions-reviewer)

This is one edit to `plugin/commands/harness-analyze.md` covering both agents' `work_report:` fields. It replaces the separate +40 (here) and +35 (`conventions-reviewer.md` → Thinning plan) sentences. Estimated cost: ≈ 90 words.

1. **Step 3, closed-block paragraph (`:192`)**, append:
   > No return field travels into another dispatch except as named: the reviewer's `findings:` into the writer's fix dispatch, the writer's three `prior_*` into its own fix and review dispatches, and its `shared_document_divergences:` into (4d.0). A `work_report:` field, from either agent, is never forwarded; step 6 is its only consumer.
2. **(4c) (`:365`) and (4d) iteration 1 (`:456-458`):** "Take the reviewer's `findings:` return" → "Take the reviewer's `findings:` field, and only that field". This blocks checklist lines from reaching the writer as findings, which is the sibling report's top risk.
3. **Step 6, review lines (`:566`)**, add after the declined-finding clause:
   > Per dispatch, each `work_report:` — the writer's from its write and fix returns, the reviewer's from its document-pass return — reduced to its unticked and `n/a` items with their evidence, or `complete` when every item is ticked.
4. **Step 6, corpus block (`:573`)**: add one bullet. Per iteration, print the corpus reviewer's `work_report:` and each corpus-fix writer's report, reduced the same way.
5. **`docs/analyze.md`**: add both fields to the field sets the wire reading covers (`## 8`, `:133`), and add one line beside (d2) (`## 12`, `:217`) recording that work reports are returned inline because the setup run has no committer.

The reduction in items 3 and 4 is what keeps step 6 readable. It already prints `action_taken:`, `evidence:`, every `not_determined_lines:` and `conflicts:` line per document (`:544-548`), the review lines and declined findings (`:566-571`), and the corpus block (`:573` onwards). A full report would add about 400 words per dispatch to that.

## Storage and lifecycle

- **Storage key (lead 4).** There is no branch, ledger or phase (`harness-analyze.md:191`). The nearest file key would be `<state_dir>/work_reports/harness-analyze/<target>/<pass>-<write|fix|reconcile>_<i>.md`. That key has three problems, so the inline return is used instead:
  - The agent can tell a reconcile dispatch apart only by the `Layer-writer divergence — ` prefix.
  - It is never told the corpus iteration (`:134`).
  - The index would be the next free integer, accumulating across re-runs with no run id. It is collision-safe, because each wave sends one dispatch per target (lead 10), but it is meaningless across runs.
- **Write permission (lead 1).** The tools include `Write` and `Edit`. The unattended allow list (no `cp`) does not matter here, because the command is supervised (`harness-analyze.md:50`). An end-of-dispatch inline return is a choice made because of `## Scope` (`:70`, cited by `harness-analyze.md:316`), not one forced by tooling.
- **Commit (leads 3, 8, 11).** There is no committer and no commit point; the adopter commits by hand. Embedding the report in the only artifact the agent writes, the conventions document, is ruled out:
  - every agent auto-reads that document;
  - the reviewer grades it line by line;
  - the acceptance greps over written documents (`docs/development.md:524-526`) would hit the report's literals.
- **Hooks.** `plugin/hooks/hooks.json` has a single `"matcher": "Bash"`, so no hook blocks a `Write`.
- **Lifecycle.** The report is held in session state until step 6 prints its reduced form. The durable record stays what it is today: the document's `## Not determined` section and its provenance lines.

## Risks and costs

- **Tool calls:** none extra with the inline return. A file ticked as the agent goes would cost about 14 Edits × ≤ 13 dispatches ≈ 180 calls per run.
- **Goal (a) is weak (lead 6).** The inline report is composed at the end, so when a box was ticked cannot be verified. Its value is in the evidence fields (W1, W2, W4, W6, W11, W13, W14), which step 6 can cross-check against `findings_applied:` and `not_determined:`.
- **Ref-starvation (lead 7) is the largest risk.** The REFERENCE prose in `## The document` is both the writer's rule and the reviewer's grading standard. If the writer skims it behind a `ref:`, its declined findings land permanently as `Reviewer finding not applied — ` lines in the adopter's document. That prose stays inline; only W4 and W7 carry `ref:`s.
- **Wire change.** `work_report:` is appended to a byte-stable return (`:142`). The combined caller change names its consumer and forbids forwarding it. No test keys on this agent's prose: `cli/test/` and `scripts/` have no match, and `cli/src/generators/claudeContext.ts:127` is a comment.
- **Leaks (lead 12).** `document_path` and `scope` arrive as absolute paths. Evidence must stay repo-relative, because step 6 echoes it to the user.
- **Closed block.** Dispatches carry "exactly the fields" (`harness-analyze.md:192-197`). The template therefore lives in the definition and never rides in the prompt.
- **Leads 2, 5 and 9:** not applicable. The writer always writes, the corpus review reads documents only, and there is no findings folder.

## Open questions

1. Should an inline `work_report:` field be the cross-agent pattern for every agent dispatched outside branch flows (setup commands, `harness-read-mention`), with files kept for branch flows only?
2. Step 6 already prints one evidence line, every `## Not determined` and conflict line, the review lines and the corpus block per document (`harness-analyze.md:544-585`). Is the reduced per-dispatch work-report block one block too many, and should only items with mismatched evidence be printed?
3. Should the thinning of `conventions-writer.md` and `conventions-reviewer.md` be planned as one change, with the reviewer's read narrowed in the same edit?
4. The `<scripts_dir>` probe (W4) is the only ACTION with long rationale. Should it move into a reference paragraph under `## Resolved values`, given that the reviewer re-runs it?

## Review response

Every Must Fix, Should Fix and Nice to Have was adopted. **No rebuttals.** One anchor in the review was adjusted. Must Fix 1 placed the wire rule at "§11 … `:133`", but `docs/analyze.md:133` falls under `## 8. How this is verified` (`grep -n '^## ' docs/analyze.md`: `## 8` at `:128`, `## 11` at `:173`). The report cites it as `## 8`, `:133`.
