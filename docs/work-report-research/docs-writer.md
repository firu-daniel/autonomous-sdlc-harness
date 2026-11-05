# Work report research — docs-writer

## Verdict

**Recommend with changes.** A work report is a good fit for the two **writing** dispatch shapes (`mode: catalog`, `mode: update`, and their fix rounds). The agent has `Write` and `Edit`, so it can tick as it goes. Its most often violated rules are mechanical and checkable: the line-number ban, grep-verified quotes, repo-relative paths, and the every-layer reachability search. Each can be an item that demands count evidence.

The changes needed:
- **No report on `mode: survey`, on the disabled-phase no-op, on `blocker:`, or on the docs-phase INDEX write.** The first three are contractually "write nothing" (`plugin/agents/docs-writer.md:113`, `:14`, `:67`). The INDEX write has no paired review.
- **Store the report as a separate `write_<i>.md` in the slug's review folder**, `<state_dir>/docs_catalog/reviews/<slug>/`, which the callers already commit.
- **The caller passes the writer the same `iteration` it will hand the following review**, so `write_<i>` precedes `review_<i>`.
- **Prerequisite:** the catalog loop must adopt next-free indexing (`docs_orchestration_instructions_autonomous.md:69`, `:84`). Until it does, neither file is collision-safe.

The hard constraint holds: the agent's own share drops from 3 483 to about 2 632 words (an estimate), template included. `docs-reviewer` reads this whole file, so the same cut applies to every review dispatch.

## Read tree

This repository has `phases.docs: false` (`harness.config.json` → `phases`), so `docs-writer` never runs here. Its files are measured as a stand-in adopter: layers `cli`, `plugin` and `general` (`.`).

| File | Up-front / on-demand | Words |
|---|---|---|
| `plugin/agents/docs-writer.md` (frontmatter + body) | up-front | 3 483 |
| `.claude/CLAUDE.md` (auto-loaded; template `cli/templates/claude/CLAUDE.md` = 1 320) | up-front | 1 695 |
| `harness.config.json` (`layers`, `docs.root`, `stateDir`, `phases`, `parity`, per `docs-writer.md:20-29`) | up-front | 154 |
| **Every** `layers[].conventions`: `.claude/context/cli.md` 2 647 + `plugin.md` 4 174 + `conventions.md` 5 864. These are up-front because `<convention_symbols>`/`<impl_stack>` are read "off the conventions documents `<layer_path_map>` names" (`docs-writer.md:28-29`), across the "**entire** map" (`:23`) | up-front | 12 685 |
| Dispatch payload: `entry` blob, or branch diff + `INDEX.md` + docs tree (survey), or diff + current `output_path` (update) | up-front, variable | n/a |
| INDEX dispatch inputs: the checklist, every doc under `<docs_root>/features/` and `concepts/`, `parity_gaps.md`, `needs_review.md` (`docs_orchestration…:84`) | up-front on the INDEX dispatch, variable, large (the whole corpus) | n/a |
| `existing_doc` (catalog refresh/merge, `docs-writer.md:97`) | up-front when passed | variable |
| `findings_file` `<state_dir>/docs_catalog/reviews/<slug>/review_<i>.md` (fix round, `docs-writer.md:63`) | up-front on fix rounds | variable |
| Application, backend and `<reference_impl>` source reached by the trace | on demand (the research itself) | n/a |
| `plugin/agents/docs-reviewer.md`: named as "the consumer" (`docs-writer.md:65`), never told to read | not read | (2 530) |

The agent does not cite the lessons ledger, the samples, or `dispatch_discipline_instructions.md`.

**Read-list conflicts (lead 13).** CLAUDE.md's table routes "Any implementation, review or planning" to `conventions.md` and each layer to its own document (`.claude/CLAUDE.md` → `## Context files`). The agent definition already asks for all three, so the agent's set is the larger one, and it is the one counted. The lessons-ledger row ("Planning or reviewing at branch level") does not cover this agent.

**Up-front total per dispatch, this repo:** 3 483 + 1 695 + 154 + 12 685 = **18 017** words, plus the variable payload. **The agent's own share is 3 483**, and that is all this research can change.

## Dispatch sites and phases

| Caller | Shape | Times per branch | Ledger id |
|---|---|---|---|
| `plugin/instructions/docs_orchestration_instructions_autonomous.md` → `## Per-entry loop` step 1 (`:68`) | `mode: catalog` | 1 per checklist entry | none: "no flow-progress ledger" (`:24`); the checklist box is the only state (`:58`) |
| same → step 3 Fix loop (`:70`) | catalog + `findings_file` | ≤ 3 per entry | none |
| same → `## Final entry — INDEX` (`:84`) | catalog, `doc_slug: index`, reviewed | 1 (+ fixes) | none |
| `plugin/instructions/docs_phase_instructions.md` → `## Loop` step 1 (`:36`) | `mode: survey` | 1 | Phase D; "**no** separate ledger entry" (`plan_orchestration_instructions_autonomous.md:218`) |
| same → step 2 Write (`:39`) + Fix loop (`:42`) | `mode: update` (+ `findings_file`) | per target × (1 + ≤ 3) | none |
| same → step 3 INDEX (`:45`) | `mode: update`, target = INDEX, **not reviewed** | ≤ 1 | none |

What activates the docs phase is Override H in `plan_orchestration_instructions_autonomous.md:207` and in `user_review_fixes_instructions_autonomous.md` (`:176` gate). The command `plugin/commands/branch-start-docs-autonomous.md:55` runs the catalog loop. **The supervised and semi-autonomous flows never dispatch `docs-writer`.** Worst case for a 50-entry catalog is 200 writer dispatches (`docs_orchestration…:34` sizing).

## Prose classification

Section word counts come from `sed -n 'a,bp' plugin/agents/docs-writer.md | wc -w`. The split within a section is estimated line by line.

| Section (lines) | Words | ACTION | REFERENCE | WIRE | REDUNDANT | Notes |
|---|---|---|---|---|---|---|
| Frontmatter (1-6) | 106 | – | – | 106 | – | `name`/`description`/`tools` are read by Claude Code |
| Intro (8-12) | 108 | – | 54 | – | 54 | The two-mode list at `:10-12` restates `## Invocation contract` |
| Disabled-phase gate (14) | 99 | 30 | – | – | 69 | The return shape is already in `## Output contract` (`:188`); the rest is rationale |
| `## Resolved values` (16-31) | 674 | 30 | 330 | – | 314 | Preamble `:18` (106) explains what is *not* listed. The `<repo_root>` row (`:26`, 133) restates CLAUDE.md → checkout root and `:75`. The `<state_dir>` dot-name rule is irrelevant to a reader. The parity-off clause in `:27` is restated in `:73`, `:87`, `:152` and `:175` |
| `## Invocation contract` (33-68) | 339 | 60 | 79 | 160 | 40 | The three dispatch blocks (145), the findings path and `blocker:` are wire. The fix-round rule (`:63`) and the unreadable-input rule (`:67`) are actions |
| `## Project layout` (69-76) | 174 | – | 100 | – | 74 | `:75` repeats the repo-root rule a third time |
| `## Entry-point hints…` (77-80) | 84 | 20 | – | – | 64 | One action ("discover beyond hints"); the rest is exhortation |
| `## Research methodology` (81-90) | 733 | 330 | 260 | 30 | 113 | Step 2's worked example (`:85`, 124 words) is the depth standard the reviewer grades on ("shallow/under-researched", `docs-reviewer.md:112`), so it stays as REFERENCE. In step 5 (`:88`, 318 words), the markers `⚠️ unverified` and `reachable? ❌` are wire (they feed the INDEX and `parity_gaps:`); the line-number shape list is reference; about 100 words restate the every-layer search |
| `## Mode 1` (93-98) | 54 | 40 | – | – | 14 | |
| `## Mode 2` intro (101-104) | 32 | – | – | – | 32 | |
| `### Survey` (105-114) | 215 | 90 | 60 | 15 | 50 | `targets: none` and the reason `anchor path moved` are wire |
| `### Write / update` (115-120) | 155 | 60 | 50 | – | 45 | The anchor-files exception is stated twice in one sentence |
| `## Template — feature` (123-160) | 466 | – | 49 | 330 | 87 | A file template the reviewer checks section by section. The parentheticals at `:146` and `:155` restate methodology step 5 |
| `## Template — concept` (161-179) | 95 | – | – | 95 | – | |
| `## Output contract` (182-188) | 145 | – | 15 | 130 | – | Return field names; `docs_orchestration…:68`, `docs_phase…:36` and `:45` parse these |
| **Total** | **3 479** of 3 483 (4 words in `---` rules) | **660** | **997** | **866** | **956** | |

The other up-front files (CLAUDE.md, the conventions documents and `harness.config.json`) are adopter content shared with every layer agent. They are outside this agent's thinning scope.

## Draft work report template

**Chosen design: one template, embedded in `docs-writer.md` under `## Work report`.**
- **Which dispatches.** Only writing dispatches that carry `iteration`. Items that do not apply are ticked `n/a`: W3 on a first write, W6 when parity is off, W7 when there is no `existing_doc`.
- **Embedded, not copied.** Embedding avoids `cp`, which is not allow-listed (lead 1), and avoids a second file read.
- **Write then `Edit`.** The agent `Write`s the report once after W1 and `Edit`s each tick. It has the `Edit` tool, so neither `sed -i` nor a single end-`Write` is needed. A single end-`Write` would remain the fallback if tick cost proves too high (see Risks).
- **INDEX rule.** On the catalog INDEX dispatch, W4–W7 and W12 are `n/a`, and W2 covers that dispatch's listed inputs.
- **Size.** 359 words, plus a 69-word `## Work report` section that gives the path rule, the INDEX rule and the evidence rule. Both are measured with `wc -w`.

```markdown
# Work report — docs-writer · <doc_slug> · iteration <i> (precedes review_<i>.md)

- [ ] W1. **Resolve root and configuration** — Run a bare `git rev-parse --show-toplevel`; read `layers`, `docs.root`, `phases.parity` from `harness.config.json`.
- [ ] W2. **Open every named input** — Read each conventions document, `existing_doc`, `findings_file` handed to you; any unreadable: return `blocker:`, write no document.
- [ ] W3. **Fix round: findings only** — `n/a` unless `findings_file`. Apply each Must Fix, never its `## Work report`; no re-research. Evidence: finding ids applied.
- [ ] W4. **Forward-trace every layer hop** — Read each hop, surface to backend, in configured layer order; never infer a hop from a name. Evidence: repo-relative path per hop. (ref: docs-writer.md → ## Research methodology)
- [ ] W5. **Provenance grep per stored-data set** — Grep each set across every `layers[].path`, including `.`, and the backend source. Evidence: set → repo-relative writer and reader paths.
- [ ] W6. **Parity cross-reference** — `n/a` when `phases.parity` is false. Compare `<reference_impl>`; record divergences and `parity_gaps`.
- [ ] W7. **Fold in `existing_doc`** — `n/a` unless `existing_doc`. Keep still-true content, correct drift, merge every named target. Evidence: targets merged.
- [ ] W8. **Write from the template** — Keep section order; apply each OMIT rule. Update: preserve still-true content, revise only what the diff changed. (ref: docs-writer.md → ## Mode 2)
- [ ] W9. **Grep-verify every anchor** — Each anchor is a symbol you read, a grep-matched quote, or a bare path. Evidence: verified count, `⚠️ unverified` count.
- [ ] W10. **Every path repo-relative** — Every path in the document, prose or anchor, resolves from the repository root, not the application directory.
- [ ] W11. **Classify colon-number hits** — Run `grep -nE ':[0-9]+'` on the document; remove coordinates, keep values. Evidence: `hits <h>, coordinates 0`. (ref: docs-writer.md → ## Research methodology)
- [ ] W12. **Reachability searched across all layers** — Mark `reachable? ❌` only after searching every layer path, including `.`. Evidence: operation count marked ❌.
- [ ] W13. **Return your mode's contract block** — Return the `## Output contract` block for your mode; never paste the document body.
```

**What changed after review, and why:**
- **The heading carries the pairing.** It is not a `key: value · …` line, so it does not echo the dispatch keys or the `targets:` separator (review Nice to Have 5).
- **Evidence is counts and repo-relative paths only (lead 12).** W1 records no root, and W11 records counts, not the command line, which would carry the absolute `output_path`.
- **W11 classifies hits rather than driving them to zero.** It uses only the colon detector, and the value-vs-coordinate test ("does removing it change a factual claim?", `docs-reviewer.md:77`) moves into `docs-writer.md` step 5 (about 25 words), so the `ref:` stays inside the loaded file. W11 carries no `[Ll]ines?` regex, so `scripts/check-typos.sh:77` needs no new exemption.
- **Finding ids** in W3 depend on the docs-reviewer research adding `F1…Fn` numbering to its output contract.

**Alternatives considered:**
- *A survey template.* Rejected: survey's `targets:` list is already an auditable artifact, and filing a report would break "Write nothing".
- *A per-mode template file under `plugin/samples/`.* Rejected: it costs a second up-front read.
- *Embedding the report in an already-committed artifact (lead 11).* The writer's only artifact is the product document. A section there would ship in the corpus and be graded as content. `review_<i>.md` is written after the writer, by another agent. A separate file inside the committed slug folder is the nearest analogue.

## Thinning plan — `plugin/agents/docs-writer.md`

All "after" figures are section-level estimates, not counts of a written draft.

| Section | Remove | Shorten | Keep verbatim | Today → est. after |
|---|---|---|---|---|
| Frontmatter | – | – | all | 106 → 106 |
| Intro | Two-mode list `:10-12` | Role sentence to one line | – | 108 → 40 |
| Disabled gate | Rationale sentences | To "If `phases.docs` is not `true`: research nothing, write nothing (no work report), return the disabled block of `## Output contract`." | – | 99 → 35 |
| Resolved values | Preamble `:18`; dot-name rule; repeated parity-off clauses | Each row to its config key and one use. `<repo_root>` stays an **inline** 35-word rule rather than a pointer to CLAUDE.md, because adopters may edit CLAUDE.md freely (`cli/templates/claude/CLAUDE.md` footer "yours from there on") | Token names and config keys | 674 → 320 |
| Invocation contract | Rationale in `:67` | `:35` to one sentence | The three dispatch blocks, the fix-round findings path, `blocker:`, the consumer line. **Adds:** `iteration` to the catalog and update blocks (+12) and the ignore line at `:63`, "Ignore any `## Work report` section in it; that is the reviewer's record, not findings." (+15) | 339 → 297 |
| Project layout | `:75`; parity restatement | To three bullets | – | 174 → 70 |
| Entry-point hints | The section | One sentence moved into methodology | – | 84 → 0 |
| Research methodology | Restated every-layer clauses (now W5/W12) | See subtraction below | Worked example (shortened), the line-number shape list, `⚠️ unverified`, `reachable? ❌`. **Adds** the value-vs-coordinate test (+25) | 733 → 486 |
| Mode 1 / Mode 2 intro | Mode 2 intro | Mode 1 to two sentences, keeping "keep what is still true, correct what drifted, fold in named merge targets" verbatim | – | 86 → 25 |
| Survey | Repeated rationale | – | new/update/both/ripple rules; `targets: none`; `anchor path moved` | 215 → 110 |
| Write / update | Doubled anchor-files exception | To one rule + one exception | – | 155 → 80 |
| Templates | Parentheticals at `:146`, `:155` (become a pointer to step 5) | – | Both template blocks' headings, order, OMIT rules and the `reachable? ✅ / ❌` literal | 561 → 475 |
| Output contract | – | Add one line: "writing modes with `iteration` also leave `write_<i>.md` (see `## Work report`)" | All fields | 145 → 160 |
| **New** `## Work report` | – | Section (69) + template (359) | – | 0 → 428 |
| **Total** | | | | **3 483 → ~2 632** |

**The two largest cuts:**
- **`## Resolved values`, 674 → 320.** Preamble 106 → 15 (−91); `<repo_root>` 133 → 35 (−98); `<state_dir>` 63 → 30 (−33); `<docs_root>` 57 → 30 (−27); `<reference_impl>` 67 → 35 (−32); `<layer_path_map>` 81 → 55 (−26); `<layer_names>` 40 → 30 (−10); `<convention_symbols>` 59 → 40 (−19); `<impl_stack>` 53 → 35 (−18). That is −354, giving 320.
- **`## Research methodology`, 733 → 486.** Step 1 (`:83`) 71 → 45 (−26); step 2 rule (`:84`) 105 → 60 (−45); worked example (`:85`) 124 → 110 (−14); step 3 40 → 25 (−15); step 4 36 → 20 (−16); step 5 (`:88`) 318 → 150 (−168); step 6 33 → 25 (−8). Then +20 for the hints sentence moved in, and +25 for the value test, giving 733 − 292 + 45 = 486.

**Survival check against `docs-reviewer`.** `docs-reviewer` grades against this file ("Read `docs-writer.md` before you grade … Every check below targets a rule that file actually states", `docs-reviewer.md:55`). Each of its checks is listed with the writer rule it grades and whether that rule survives the cuts:

| Reviewer check (`docs-reviewer.md` → `## What to verify`) | Writer rule it grades | Survives? |
|---|---|---|
| 1 Anchors resolve; prose paths from `<repo_root>` | Step 5 anchor forms + repo-relative rule | Kept (also W9, W10) |
| 2 No line numbers; value-vs-coordinate | Step 5 shape list | Kept verbatim; value test **added** (writer and reviewer now agree) |
| 3 Backend surface, `reachable?` searched in every layer | Template `### Backend surface`; `:146` parenthetical | Literal kept; parenthetical becomes a pointer to step 5. The reviewer's check 3 restates the every-layer search itself |
| 4 Data shapes, routed by layer | Template `:144` layer bullet | Kept |
| 5 Gating / optimistic / sync | Template business + local-state sections | Kept |
| 6 Research depth beyond hints | `## Entry-point hints` (84) + step 2 | Shortened to one sentence + the worked example. The substance survives; the exhortation goes |
| 7 Parity | Step 4 + OMIT rules | Kept |
| 8 `⚠️ unverified` honest | Step 5 marker | Kept |
| 9 No material omission | Template sections | Unchanged |
| 10 Merge/supersede | Mode 1 `:97` | Kept verbatim + W7 |
| 11 / 12 Diff reflected; preserved, not clobbered | `### Write / update` | Kept (one rule + one exception) |
| 13 Ripple | Survey ripple rule | Kept |

The reviewer will also read the W-items. W11 now matches its check 2, so the earlier "zero hits" conflict is gone.

**Shared base file?** Not worth it. The repo-root rule is the only cross-agent prose here, and it stays inline (see `<repo_root>` above). `docs-reviewer` shares the disabled-phase and `<state_dir>` rows, and its own research covers them.

## Word-count ledger

| Up-front file | Today | After (est.) | Delta |
|---|---|---|---|
| `plugin/agents/docs-writer.md` (template + `## Work report` 428 embedded; ignore line +15; `iteration` +12; value test +25) | 3 483 | ~2 632 | **−851** |
| `.claude/CLAUDE.md` | 1 695 | 1 695 | 0 |
| `harness.config.json` | 154 | 154 | 0 |
| Conventions documents (all three) | 12 685 | 12 685 | 0 |
| **Up-front total per writer dispatch** | **18 017** | **~17 166** | **−851 (−4.7 %; −24 % of the agent's own share)** |

| On-demand | Today | After | Delta |
|---|---|---|---|
| No new on-demand file: every `ref:` points into `docs-writer.md` itself, which is already loaded | 0 | 0 | 0 |

| Cross-agent: `docs-reviewer`'s read of `docs-writer.md` | Today | After (est.) | Delta |
|---|---|---|---|
| Whole-file read (`docs-reviewer.md:55`) on every review dispatch | 3 483 | ~2 632 | −851 |
| Of which: `## Work report` + template, which the reviewer does not need | 0 | 428 | +428 |

If the docs-reviewer research's narrowed read lands (five sections, 1 591 words today), that figure would replace the whole-file row. The `## Work report` section then falls outside the narrowed read.

**Constraint holds: yes.** The template mechanism costs 428 words, plus 52 words of added rules (ignore line, `iteration`, value test). The cuts remove about 1 330. The `ref:` targets stay in the loaded file, so nothing that functions as a grading standard is pushed out of view (lead 7).

## Storage and lifecycle

**Path.** `<state_dir>/docs_catalog/reviews/<slug>/write_<i>.md`, not `<state_dir>/work_reports/<branch>/<phase>/…`:
- Neither docs flow has a ledger id (`docs_orchestration…:24`; `plan_orchestration_instructions_autonomous.md:218`), so a `<phase>` key does not exist here (lead 4).
- `<slug>` is one document, so slugs never collide with each other.
- A new `work_reports/` root would also need changes to `cli/src/generators/stateDir.ts` (`docs_catalog` is at `:117` in its list) and `cli/test/init.test.mjs:141-147`.
- **Aligned with `docs-reviewer` research.** It embeds its report in `review_<i>.md` with `iteration: <i> · follows: …`. Both reports use `iteration <i>`, and the pairing is explicit: `write_<i>` precedes `review_<i>`.

**Index (lead 10).** The caller passes `iteration`, the value it is about to hand the following `docs-reviewer` (it already passes `iteration=i` there: `docs_orchestration…:69`, `docs_phase…:40`):
- First write: the caller's starting `i`. Fix round: `i+1`.
- This is a **one-field wire addition** at five dispatch sites:
  - catalog step 1 (`:68`) and its fix loop (`:70`);
  - catalog INDEX (`:84`);
  - docs-phase step 2 (`:39`) and its fix loop (`:42`).
- The agent does not derive it. Deriving it was the earlier draft's proposal, and it paired the write with the wrong review (review Must Fix 2).
- **Not collision-safe until the catalog caller is fixed.** The docs phase already resolves next-free (`docs_phase…:41`). The catalog "start[s] `i=0`" at `:69` and `:84`. A refresh of a slug that already holds `review_0..1` overwrites both `review_0.md` and `write_0.md`.
- **Prerequisite:** `:69` and `:84` adopt `docs_phase…:41`'s next-free rule.

**Docs-phase INDEX (`docs_phase…:45`).** It is not reviewed, so no `iteration` is passed and no report is written. There is nothing to stage.

**Commit.** Three explicit stage lists need "and the writer's `write_<i>.md`":
- catalog step 6 (`docs_orchestration…:73-75`);
- the catalog INDEX commit (`:84`);
- the docs-phase per-target commit (`docs_phase…:44`).

No committer agent is involved: both flows commit through `commit-on-branch.sh` with explicit paths (`docs_orchestration…:111`). So **lead 3 does not apply**: there is no subject reconciliation and no `staged:` signal.

**Clean tree.** The pause boundary is "clean **tracked**-tree" (`docs_orchestration…:92`), so an unstaged report would not block a pause. It would, however, be swept into a later commit or never committed. That is why the three stage-list clauses are required.

**Idempotency.** Override H counts on a Phase D re-run being idempotent ("unchanged doc re-write yields wrapper exit 3", `plan_orchestration_instructions_autonomous.md:218`). With next-free indexing, a re-run commits a new `write_<n>.md`, and it already commits a new `review_<n>.md` today. So the report adds no new non-idempotency, but it does not remove the existing one.

**Survey, disabled, blocker and docs-phase INDEX** write no report, so **leads 2 and 8 do not arise**: nothing sits uncommitted.

**Tools (lead 1, corrected).** The agent has `Read, Write, Edit, Bash, Glob, Grep` (`docs-writer.md:4`), so `Edit`-per-tick works natively. The template is embedded, so no `cp` is needed.

**Permissions and hooks.** The autonomous profile allows `Write(/{{repoRoot}}/**)` and `Edit(/{{repoRoot}}/**)` (`cli/templates/claude/settings.autonomous.json:48`, `:50`). Every hook in `plugin/hooks/hooks.json` is a `Bash` matcher, and none gates `Write`/`Edit`. W11's `grep` is read-only.

**Reviewers reading reports (leads 5 and 9).**
- Every diff reviewer explicitly excludes `docs_catalog/reviews/*` from its diff (`branch-reviewer.md:83`, `skeptic-reviewer.md:87`, `review-plan-reviewer.md:83`, `architecture-reviewer.md:109`, `business-parity-reviewer.md:100`), and so does the docs-phase diff (`docs_phase…:30-32`). No reviewer grades `write_<i>.md` as part of the change set.
- No orphan check covers `docs_catalog/`.
- `docs-reviewer` will not read `write_<i>.md`. That is the docs-reviewer research's decision: its DR3/DR4 re-run the checks W9/W11 self-report, independently of the writer.

**Leaks (lead 12).** Evidence is limited to counts and repo-relative paths, with no root, command line or timestamp. A re-run that reaches the same result writes an identical file body.

## Risks and costs

- **Tool calls.**
  - 13 items: about 12 `Edit` ticks plus 1 `Write` per writing dispatch.
  - A writer dispatch already runs dozens of `Read`/`Grep` calls, so the overhead is roughly 10–20 %.
  - Worst case for a 50-entry catalog: 200 dispatches × 13 ≈ 2 600 extra calls.
  - Fallback: tick at checkpoints instead, after research (W1–W7), after writing (W8), and after self-check (W9–W12).
- **Tick timing is unverifiable (goal a, lead 6).**
  - The agent can fill everything at the end. The value is in the evidence fields: W4 hop paths, W5 set → writers, W9 counts, W11 `hits <h>, coordinates 0`.
  - `docs-reviewer` re-runs DR3/DR4 independently, so false evidence surfaces as a FAIL rather than through the report.
  - W11 earns its place: `docs-writer.md:88` spends about 120 words policing line numbers, which suggests the rule is often broken.
- **Pulling actions away from their rationale.**
  - W5 and W12 ("every layer path, including `.`") lose the explanation of *why* the catch-all matters. The worked example is kept for that reason, and W4 refs it.
  - The shape list and the value test must stay in the file. W11 is harmful without the value test, which was the earlier draft's error.
- **The writer misreads the reviewer's `## Work report` as findings.** The ignore line at `:63` and W3's "never its `## Work report`" cover this.
- **Wire changes.**
  - `iteration` added at five dispatch sites.
  - One stage-list clause at three commit sites.
  - One optional output-contract line.
  - The catalog next-free fix at `:69`/`:84`, which is a prerequisite.
  - Nothing else keys on the moved prose: no test in `cli/test/` greps `docs-writer`, and `cli/templates/scripts/autonomous-watcher.sh:1945-1963` mentions the agent only in a comment and a prompt string.
- **Crash or resume.** An entry re-runs from scratch (`docs_orchestration…:58`). The re-run overwrites its own uncommitted `write_<i>.md`, which is harmless.
- **Low marginal value in practice.** The docs phase is off by default and best-effort (`docs_phase…:25`), and it is off in this repo.

## Open questions

1. Should **survey** get an inline 3-line checklist in `notes:` (ripples traced, moved paths grepped, `targets: none` reason)? That would be a small wire addition at `docs_phase…:36`.
2. The catalog `start i=0` (`docs_orchestration…:69`, `:84`) is now a **prerequisite** of this proposal. Should the synthesis treat it as a stand-alone bug fix, landing first?
3. Cross-agent: should every agent whose callers commit through explicit-path wrappers co-locate its report with the findings folder the caller already stages?
4. *(Answered by the docs-reviewer research: no.)* `docs-reviewer` does not read `write_<i>.md`; it re-runs the underlying checks independently.
5. The conventions documents (12 685 words, 70 % of the load) are read in full only to pick up `<convention_symbols>`/`<impl_stack>`. Could a targeted heading pointer replace the whole-document read? That would save far more than any template, and it is a cross-agent question.

## Review response

All three Must Fix, all ten Should Fix, and Nice to Have 1–6 are applied:
- **Must Fix 1:** W11 classifies hits, and the value test moved into the writer.
- **Must Fix 2:** the caller passes `iteration`, and the catalog fix is now a prerequisite.
- **Must Fix 3:** evidence is counts and repo-relative paths only.
- **Should Fix 1–10:** the docs-phase INDEX writes no report; there are three staging sites; the reviewer read-cost row and survival table are added; field names are aligned; W7 and W10 and the INDEX rule are added; W11 is now W13 and points at the output contract; figures are labelled as estimates and the subtractions shown; the INDEX inputs row is added; idempotency is stated; the REDUNDANT total is now 956.
- **Docs-reviewer cross-report requirements 1–4:** adopted.
  - The ignore line costs +15.
  - The new W11 means zero coordinates, not zero hits.
  - `write_<i>.md` stays a separate file, staged at three sites.
  - W3 relies on the reviewer's `F1…Fn` ids.

No finding is rebutted. The "after" total rose from ~2 456 to ~2 632 for four reasons:
- the `ref:` targets and the value test now sit inside this file;
- two items were added;
- the `<repo_root>` row stays inline;
- the methodology estimate was recomputed line by line (486, not 380).
