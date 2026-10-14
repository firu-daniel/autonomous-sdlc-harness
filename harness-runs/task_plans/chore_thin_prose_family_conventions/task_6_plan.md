### Task 6 — Thin `harness-analyze.md`'s step 4 lead, `(4a)`, `(4b)` and `(4c)`

**Goal:** Cut step 4's lead and its `(4a)`, `(4b)` and `(4c)` blocks in `plugin/commands/harness-analyze.md` to direct instructions stated once.

**Depends on:** Task 5, which edited `## Context` and steps 1–3 of the same file. Step 4 cites step 1's on-disk `shared_document` rule and step 3's write block and closed-block rule, which Task 5 kept.

**Where this task stops.** It changes only the text from the line `4. **Classify every document…` down to the line before `   **(4d) The corpus pass — the set as a whole, two fixed iterations.**`. It does not touch anything above or below that range, or any other file.

Apply the replacements below exactly, in order. Each **Old** block is an exact substring of `plugin/commands/harness-analyze.md` at `25e2382a` — sometimes only part of a line, sometimes several hard-wrapped lines with their indentation — and you replace exactly that substring with the **New** block, which carries its own line breaks and indentation. If an Old block is not found exactly once, change nothing more in that file and return a blocker naming the file and the replacement id.

`plugin/commands/harness-analyze.md` is hard-wrapped Markdown: a numbered step's first line has no indent and every continuation line of that step, and every later paragraph inside it, is indented three spaces; a bullet inside a step is `   - ` with five-space continuations. Each New block is already wrapped and indented that way. Paste it as given; do not re-wrap the paragraphs around it.

**Frozen text in this range:** in `(4b)`, *"— a path that resolves only from inside the application directory is"*, which HA17 keeps. **Anchors and behaviour that must not move:**
- the labels `(4a)`, `(4b)` and `(4c)`, which `plugin/agents/conventions-reviewer.md`, `docs/development.md` Gate 8 and `docs/analyze.md` cite;
- `(4a)`'s two-part untouched-skeleton test, the asked default, the newly named path classified by absence, the default flipping to `skip` after an accepted proposal, the marker removal and footer obligation, the wave order and the divergence-collection rule;
- `(4b)`'s per-section classification and its two prompt-line quotations (`cli/templates/claude/CLAUDE.md` carries the lines they quote), the survey and harvest inputs, the reconciliation, the by-reference binding to `plugin/agents/conventions-writer.md` → `## The document` and `## House rules` with its adaptation, the corpus-finding dispositions per role and section, the setup-pending banner rule and the routing-table exception;
- `(4c)`'s full review field list with the three `prior_*` fields forwarded verbatim, the single fix dispatch, *"No verdict, no cap, no re-review, and no adjudication on this axis"* and the closed-block coverage.

### Targets

- `plugin/commands/harness-analyze.md` → step 4's lead, `(4a)`, `(4b)` and `(4c)`.

**Work:**

- [ ] **Step 4's lead and `(4a)`.** Apply HA12–HA16: the lead keeps the one-whole-document rule and what a re-run does after an interruption; the skip-default paragraph, the marker sentence, the wave paragraph and the divergence paragraph keep every rule and drop the reason after it.
- [ ] **`(4b)`, the survey and the binding.** Apply HA17 and HA18. HA17 keeps every input, the repo-relative path rule and the reconciliation, and states the conflict-line route in one sentence. HA18 keeps the by-reference binding, the merge scope, the adaptation list and the `demand_set` exclusion with its citation, and drops the two paragraphs of reasoning `docs/analyze.md` → `## 12` (g) already records.
- [ ] **`(4b)`, corpus findings.** Apply HA19: one disposition sentence covers the `skip` section and the generated remainder alike, each named; the `fixable` / `context` split, the decline-on-merits route and the recording duty stay.
- [ ] **`(4c)`.** Apply HA20–HA23: the review field list and the forwarding rule stay whole; the reasons for forwarding, for sending `harvested_sources`, for the closed block and for not reviewing the session's own targets go.
- [ ] **Rule inventory, then the probe.** Confirm each item under **Anchors and behaviour that must not move** still has a home, restoring anything missing in its shortest form. Then run `bash scripts/scratch-run.sh harness-runs/scratch/conventions_family_check.mjs plugin/commands/harness-analyze.md` as one plain foreground command.

### Replacements

**HA12** — `plugin/commands/harness-analyze.md`: replace

```text
4. **Classify every document, then dispatch, then review each written one once, then review the corpus as a
   set. This step sends every dispatch in the run.** Every write is **one whole document**, never a document assembled in place — the
   writer's obligation on every dispatch it receives. Each document is therefore either untouched or complete
   and an interrupted run still lands on document boundaries, but the finished set is **no longer a prefix**
   of the announced order, and a document written but not yet reviewed is indistinguishable from a reviewed
   one, so a re-run classifies it as filled and asks.
```

with

```text
4. **Classify every document, then dispatch, then review each written one once, then review the corpus as a set.
   This step sends every dispatch in the run.** Every write is **one whole document**, never a document
   assembled in place — the writer's obligation on every dispatch it receives — so an interrupted run still
   lands on document boundaries, though no longer on a prefix of the announced order. A document written but not
   yet reviewed reads as filled, so a re-run asks about it.
```

**HA13** — `plugin/commands/harness-analyze.md`: replace (the Old block begins with its 3-space indentation)

```text
   **After an accepted `layers` proposal, the asked default flips to `skip`.** In a no-argument run whose
   proposal was applied, every document in the set that the proposal did **not** newly name is still asked,
   with **`skip`** its default answer instead of `merge`, and `--yes` takes that default with the rest:
   registering one layer must not rewrite documents nobody asked to touch, and a skip is no write at all.
   Nothing else moves — an untouched skeleton is still `action: write` without asking, a `conventions` path
   the accepted proposal newly names is still `action: write` by the absence of a file, and outside an
   accepted proposal the ask keeps `merge` as its default. Which documents the proposal newly named is
   answerable at classification time only because step 1 re-derives the set — *"The set is re-derived once,
   after step 5's `layers` proposal is applied"*.
```

with (the New block begins with its 3-space indentation)

```text
   **After an accepted `layers` proposal, the asked default flips to `skip`.** In a no-argument run whose
   proposal was applied, every document in the set that the proposal did **not** newly name is still asked, with
   **`skip`** its default answer instead of `merge`, and `--yes` takes that default with the rest. Nothing else
   moves — an untouched skeleton is still `action: write` without asking, a `conventions` path the accepted
   proposal newly names is still `action: write` by the absence of a file, and outside an accepted proposal the
   ask keeps `merge` as its default.
```

**HA14** — `plugin/commands/harness-analyze.md`: replace (the Old block begins with its 3-space indentation)

```text
   Every write removes that document's `<!-- harness:unfilled -->` line and replaces the footer with a
   provenance line naming the mode and what the pass read — the writer's obligation on a `merge` dispatch as
   much as on a `write` (a leftover marker is precisely what a merge would leave, and it makes a filled
   document read as an untouched skeleton to the next run's own two-part test and to `doctor`), and graded by
   the reviewer's first check.
```

with (the New block begins with its 3-space indentation)

```text
   Every write removes that document's `<!-- harness:unfilled -->` line and replaces the footer with a
   provenance line naming the mode and what the pass read — the writer's obligation on a `merge` dispatch as
   much as on a `write`, graded by the reviewer's first check.
```

**HA15** — `plugin/commands/harness-analyze.md`: replace (the Old block begins with its 3-space indentation)

```text
   **Then send, in the order step 3 fixes.** First — **when this run writes it** — the shared
   cross-layer document's own write→review→fix chain, completed before anything else leaves, so its finished
   text is available as `shared_document`; a run that does not write it starts at the next clause and carries
   step 1's on-disk value instead. Then every remaining document in **three waves — all writes, then all
   reviews, then all fixes — one message per wave, so each wave runs concurrently**, each dispatch filling the
   argument block step 3 spells out. Concurrency is an efficiency choice: a run that serializes the waves
   produces the same documents and the same report.
```

with (the New block begins with its 3-space indentation)

```text
   **Then send, in the order step 3 fixes.** First — **when this run writes it** — the shared cross-layer
   document's own write→review→fix chain, completed before anything else leaves, so its finished text is
   available as `shared_document`; a run that does not write it starts at the next clause and carries step 1's
   on-disk value instead. Then every remaining document in **three waves — all writes, then all reviews, then
   all fixes — one message per wave, so each wave runs concurrently**, each dispatch filling the argument block
   step 3 spells out. A run that serializes the waves produces the same documents and the same report.
```

**HA16** — `plugin/commands/harness-analyze.md`: replace (the Old block begins with one space, which is part of it)

```text
 They are session state, spent by
   (4d.0) and by nothing else: the session does not re-read the written documents, so a divergence that is not
   in a return is not in the run.
```

with (the New block begins with one space, which is part of it)

```text
 They are session state, spent by
   (4d.0) and by nothing else.
```

**HA17** — `plugin/commands/harness-analyze.md`: replace (the Old block begins with its 3-space indentation)

```text
   **Both sections are written from step 2's `project`-target survey** — the paragraph from what that survey
   says the project is and who uses it, the table's rows from the name patterns it found, its third column
   from the real file names it lists, and where a row's pattern column names a directory, that directory is
   the owning layer's `layers[].path` from `<layer_path_map>`, repo-relative like every path in
   `harness.config.json`, so the pattern column and the example column beside it cannot name different
   directories — **and from step 2's repo-level harvest inventory, which is an input here too**: that
   inventory is exactly the adopter's own always-loaded file, per-area convention documents and contributor
   guides, and this target writes into the always-loaded file itself. Every path either section writes is
   repo-relative and resolves from the repository root, the same root `layers[].path` does — a path that
   resolves only from inside the application directory is wrong in this file even where the example beside it
   is right. **This session reconciles the two itself**, this being the one target with no writer to hold the
   rule: code decides what *is*, so a harvested claim the survey contradicts is **not** written into
   `.claude/CLAUDE.md`, while a claim about intent the code can neither corroborate nor contradict is carried
   over **attributed to its source**. Nothing here comes from a writer return, because no writer is dispatched
   for this target. And `.claude/CLAUDE.md` carries no `## Not determined` section to hold a contradiction, so
   one found here is reported as this target's **conflict line in step 6, from this session's own record** —
   the same report clause a writer's `conflicts:` field supplies for a delegated document.
```

with (the New block begins with its 3-space indentation)

```text
   **Both sections are written from step 2's `project`-target survey** — the paragraph from what that survey
   says the project is and who uses it, the table's rows from the name patterns it found, its third column from
   the real file names it lists, and where a row's pattern column names a directory, that directory is the
   owning layer's `layers[].path` from `<layer_path_map>` — **and from step 2's repo-level harvest inventory,
   which is an input here too**. Every path either section writes is repo-relative and resolves from the
   repository root, the same root `layers[].path` does — a path that resolves only from inside the application
   directory is wrong in this file even where the example beside it is right. **This session reconciles the two
   itself**: code decides what *is*, so a harvested claim the survey contradicts is **not** written into
   `.claude/CLAUDE.md`, while a claim about intent the code can neither corroborate nor contradict is carried
   over **attributed to its source**. `.claude/CLAUDE.md` carries no `## Not determined` section, so a
   contradiction found here is reported as this target's **conflict line in step 6, from this session's own
   record**.
```

**HA18** — `plugin/commands/harness-analyze.md`: replace (the Old block begins with its 3-space indentation)

```text
   **The two sections this session composes are bound by the writer's own content rules, by reference.** Read
   `${CLAUDE_PLUGIN_ROOT}/agents/conventions-writer.md` → `## The document` and `## House rules` before
   composing them and apply both to what you compose. **It binds on `write` and on `merge` alike** — the
   classification above is per section with merge the default — and on a merge it binds the lines this session
   **composes or rewrites**, the adopter's carried-over prose being governed by the reconciliation rule above
   instead. A binding reaching only a first write would exempt the common case, and a merge synthesizes as
   readily as a write. **Named, never restated:** a second copy of those rules here is the duplication the
   single-writer design exists to avoid, and the two copies then drift. **The one adaptation** — this target is
   two sections rather than a document, so the obligations presupposing a document contract (the skeleton
   banner, the `**What belongs here**` answers, the rule block to keep, the `<!-- harness:unfilled -->` marker,
   the `## Not determined` section, the one-whole-document write and the skeleton-footer replacement, both of
   which the clauses above answer for this target instead) do not apply here, as the clauses above already
   state — **and neither does `demand_set` coverage: this target has no `demand_set` scope of its own**
   (`${CLAUDE_PLUGIN_ROOT}/agents/conventions-reviewer.md` → `## The corpus pass — what to verify`, which
   excludes check (5) over this member for that reason), and answering the demand set here would put the
   conventions documents' content into the one file loaded on every turn. What binds is the **content** half,
   which no document contract conditions. **It does not reach step 5's applied-proposal re-render:** that
   routing table is rendered from the `layers` array rather than composed, so it carries no rule, no intent
   claim and no provenance obligation with a subject in it, the writer's content rules have nothing to bind
   there, and step 5 needs no clause of its own. What this closes: a claim about intent the code can neither
   corroborate nor contradict is carried over **attributed to its source** and a clause with no source in the
   repository is not written — the rule stated above for the *harvest* now binds what this session composes
   itself.
```

with (the New block begins with its 3-space indentation)

```text
   **The two sections this session composes are bound by the writer's own content rules, by reference.** Read
   `${CLAUDE_PLUGIN_ROOT}/agents/conventions-writer.md` → `## The document` and `## House rules` before
   composing them and apply both to what you compose. **It binds on `write` and on `merge` alike**; on a merge
   it binds the lines this session **composes or rewrites**, the adopter's carried-over prose being governed by
   the reconciliation rule above instead. **Named, never restated.** **The one adaptation** — this target is two
   sections rather than a document, so the obligations presupposing a document contract (the skeleton banner,
   the `**What belongs here**` answers, the rule block to keep, the `<!-- harness:unfilled -->` marker, the
   `## Not determined` section, the one-whole-document write and the skeleton-footer replacement) do not apply
   here — **and neither does `demand_set` coverage: this target has no `demand_set` scope of its own**
   (`${CLAUDE_PLUGIN_ROOT}/agents/conventions-reviewer.md` → `## The corpus pass — what to verify`). What binds
   is the **content** half: a claim about intent the code can neither corroborate nor contradict is carried over
   **attributed to its source**, and a clause with no source in the repository is not written. **It does not
   reach step 5's applied-proposal re-render:** that routing table is rendered from the `layers` array rather
   than composed.
```

**HA19** — `plugin/commands/harness-analyze.md`: replace (the Old block begins with its 3-space indentation)

```text
   **Corpus findings against this file, and who applies them.** `.claude/CLAUDE.md` is a member of (4d)'s
   corpus set on either classification and never role-less — **`role: fixable`** when this session wrote or
   merged either section, **`role: context`** when it wrote neither — spelled there as (4d) spells it. The
   corpus pass grades it; the check subset that applies is the reviewer's own
   (`${CLAUDE_PLUGIN_ROOT}/agents/conventions-reviewer.md` → `## The corpus pass — what to verify`). A corpus
   finding naming this `document_path` is, on **`fixable`**, **applied by this session and never dispatched**:
   no writer may touch this file (`${CLAUDE_PLUGIN_ROOT}/agents/conventions-writer.md` → `## Scope`), and there
   is no writer return to build a report row from. **It is applied only inside a section this run itself wrote
   or merged**; a finding landing in a section this run classified **`skip`** is **not applied and is carried to
   step 6 as outstanding**, naming the finding and that the section is the adopter's own skip answer — the same
   disposition a `role: context` finding takes, for the same reason (`docs/analyze.md` §12(c): a pass that
   overrode a skip would make `skip` mean *"not yet"* rather than *"no"*). A finding landing anywhere else in the
   file — the generated routing table, the ledger-path block, the agent-authoring section, the `## Where a change request runs` section — is likewise **not
   applied and is carried to step 6 as outstanding**, naming the finding and that the line is `init`'s output
   rather than this run's. On **`context`** it is applied by nobody and carried to step 6 as outstanding — the
   disposition (4d) gives every `role: context` finding, the adopter's own skip answer not being overridden by a
   pass that ran after it. **A corpus finding this session declines on the merits** — not one the fence above bars it from
   applying — is reported as this target's **conflict line in step 6, from this session's own record**, the
   clause above carrying it for the same reason: this file has no `## Not determined` section to hold one.
   Recording it is a **duty, not a permission**, exactly as it is for the writer, and step 6 is this target's
   only durable record of one.
```

with (the New block begins with its 3-space indentation)

```text
   **Corpus findings against this file, and who applies them.** `.claude/CLAUDE.md` is a member of (4d)'s corpus
   set on either classification and never role-less — **`role: fixable`** when this session wrote or merged
   either section, **`role: context`** when it wrote neither. The check subset that applies is the reviewer's
   own (`${CLAUDE_PLUGIN_ROOT}/agents/conventions-reviewer.md` → `## The corpus pass — what to verify`). A
   corpus finding naming this `document_path` is, on **`fixable`**, **applied by this session and never
   dispatched**: no writer may touch this file (`${CLAUDE_PLUGIN_ROOT}/agents/conventions-writer.md` →
   `## Scope`). **It is applied only inside a section this run itself wrote or merged**; a finding landing in a
   section this run classified **`skip`**, or anywhere else in the file — the generated routing table, the
   ledger-path block, the agent-authoring section, the `## Where a change request runs` section — is **not
   applied and is carried to step 6 as outstanding**, naming the finding and whether the line is the adopter's
   own skip answer or `init`'s output. On **`context`** it is applied by nobody and carried to step 6 as
   outstanding. **A corpus finding this session declines on the merits** — not one the fence above bars it from
   applying — is reported as this target's **conflict line in step 6, from this session's own record**.
   Recording it is a **duty, not a permission**, exactly as it is for the writer.
```

**HA20** — `plugin/commands/harness-analyze.md`: replace (the Old block begins with its 3-space indentation)

```text
   **(4c) The review, one pass per delegated document.** The review and fix dispatch shapes the waves above
   send are defined here and nowhere else in this file. Dispatch `conventions-reviewer`
   (`${CLAUDE_PLUGIN_ROOT}/agents/conventions-reviewer.md`) with `pass: document` — always sent, the
   reviewer's stop condition firing on a missing value exactly as the writer's does —
   `document_path`, `target`, `scope`, `mode`,
   `excluded_paths`, `harvested_sources`, `shared_document` (the same value the write dispatch carried —
   `none` when the document under review is it, and `none` in the on-disk cases step 1 names),
   `demand_set`, **and the three `prior_*` fields taken verbatim from that document's write return**:
   `prior_document` (`skeleton` | `filled` | `absent`), `prior_prompts` and `prior_rule_block`. This step
   **forwards** those three and does not gather them: the write replaced the document whole, the skeletons
   ship from the CLI package rather than from this plugin, and neither this session nor the reviewer can
   re-read what stood there — so the writer, the one party that saw the pre-write file, quotes it in its
   return and this step passes it through unaltered. Without them the reviewer's first two checks grade an
   artifact nobody can show it, and the `absent` case — the document composed at a `conventions` path an
   applied `layers` proposal newly named — is indistinguishable from a document whose rule block was dropped.
   `harvested_sources` is likewise the same inventory, spelled identically, that the write dispatch sent, and
   it is not optional: the writer is required to carry a prose-only rule over attributed to its source, that
   source is harvested repo-wide and so usually sits outside this document's `scope`, and a reviewer without
   the inventory raises a finding on every such rule — a finding the writer then declines, landing permanent
   `Reviewer finding not applied — ` noise in the adopter's document.
```

with (the New block begins with its 3-space indentation)

```text
   **(4c) The review, one pass per delegated document.** The review and fix dispatch shapes the waves above send
   are defined here and nowhere else in this file. Dispatch `conventions-reviewer`
   (`${CLAUDE_PLUGIN_ROOT}/agents/conventions-reviewer.md`) with `pass: document` — always sent —
   `document_path`, `target`, `scope`, `mode`, `excluded_paths`, `harvested_sources`, `shared_document` (the
   same value the write dispatch carried — `none` when the document under review is it, and `none` in the
   on-disk cases step 1 names), `demand_set`, **and the three `prior_*` fields taken verbatim from that
   document's write return**: `prior_document` (`skeleton` | `filled` | `absent`), `prior_prompts` and
   `prior_rule_block`. This step **forwards** those three and never gathers them: only the writer saw the
   pre-write file. `harvested_sources` is the same inventory, spelled identically, that the write dispatch sent,
   and it is not optional.
```

**HA21** — `plugin/commands/harness-analyze.md`: replace (the Old block begins with its 3-space indentation)

```text
   Take the reviewer's `findings:` return. If it is `none`, that document is done. Otherwise re-dispatch
   `conventions-writer` **once**, with the same fields — `pass: document` among them — plus `findings`
   verbatim, and forward the same three `prior_*` fields on that fix dispatch too, so applying a finding
   cannot silently drop the rule block.
   **No verdict, no cap, no re-review, and no adjudication on this axis:** the writer applies what it judges
   genuine and records every finding it declines, and the run moves on. The corpus axis (4d) adds a **fixed**
   two iterations over the set as a whole — still no verdict, still no cap to converge against and no
   adjudication; there, the count is the terminator.
```

with (the New block begins with its 3-space indentation)

```text
   Take the reviewer's `findings:` return. If it is `none`, that document is done. Otherwise re-dispatch
   `conventions-writer` **once**, with the same fields — `pass: document` among them — plus `findings` verbatim,
   and forward the same three `prior_*` fields on that fix dispatch too. **No verdict, no cap, no re-review, and
   no adjudication on this axis:** the writer applies what it judges genuine and records every finding it
   declines, and the run moves on. The corpus axis (4d) adds a **fixed** two iterations over the set as a whole
   — still no verdict and no adjudication; there, the count is the terminator.
```

**HA22** — `plugin/commands/harness-analyze.md`: replace (the Old block begins with its 3-space indentation)

```text
   Both dispatches defined here are covered by step 3's closed-block rule: they carry exactly the fields named
   above and no added prose — no `context_notes:` line, no named flaw classes, no severity or verdict
   calibration, no instruction about what to skip — for the reason step 3 records. The rule matters most here:
   the reviewer's independence is the only check this one-pass design has, and a caller that aims it produces
   confirmation rather than evidence.
```

with (the New block begins with its 3-space indentation)

```text
   Both dispatches defined here are covered by step 3's closed-block rule: they carry exactly the fields named
   above and no added prose — no `context_notes:` line, no named flaw classes, no severity or verdict
   calibration, no instruction about what to skip.
```

**HA23** — `plugin/commands/harness-analyze.md`: replace (the Old block begins with its 3-space indentation)

```text
   The two targets this session writes itself — `project` and the `layers` proposal — are **not** reviewed:
   there is no dispatch to hang a review on, a session reviewing its own work in its own context is not an
   independent read, and the `layers` proposal is reviewed by the person who says yes to it.
```

with (the New block begins with its 3-space indentation)

```text
   The two targets this session writes itself — `project` and the `layers` proposal — are **not** reviewed here;
   the `layers` proposal is reviewed by the person who says yes to it.
```

**Verification:**

- The probe run prints `WORDS plugin/commands/harness-analyze.md` with a negative `delta`, and its last line is `PASS`.
- `git grep -n -E '[^:a-z]/harness-analyze' -- plugin/commands/harness-analyze.md` prints nothing: every command name keeps its qualified spelling.
- `git grep -n -F -e 'A binding reaching only a first write' -e 'single-writer design exists to avoid' -e 'landing permanent' -- plugin/commands/harness-analyze.md` prints nothing.
- `git grep -n -F -e '"writes this paragraph from the repository itself"' -e '"fills this table from the' -- plugin/commands/harness-analyze.md` hits the `(4b)` line that quotes both prompt lines.
