---
description: Read this repository's own code and fill the conventions documents and the always-loaded project file that setup could only write as skeletons.
argument-hint: "[<target>] [--existing|--greenfield] [--dry-run] [--yes] [--apply-layers]"
---

# Scope: Fill this repository's conventions documents and always-loaded project file from its own code

## Resolved values

The tokens below are not ordinary **path placeholders** (`<target>` and `<json>`, which this file's own text
resolves — `<target>` in `## Context`, `<json>` in step 5): they resolve from the adopting repository's
`harness.config.json`, `<shared_conventions_path>` from it where a layer names that document and from the
literal in its own row otherwise. They are declared here once, and after this table the body uses each one as
an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<layer_path_map>` | config value | Every `layers[]` entry's `path` together with its `conventions` — the directory that layer's source lives in, and the document this command writes for it. The **entire** map is in scope: a no-argument run covers every document in it, and each layer's evidence is gathered from its own `path`. |
| `<layer_names>` | config value | `layers[].name`. **No substitution of the names themselves** — the configured names travel through this file unchanged. They are the targets `$ARGUMENTS` may name, beside the three reserved words. |
| `<app_dir>` | config value | `appDir` — the app's directory inside the checkout, repo-relative. Mode detection in step 1 reads it: source present outside that directory's harness-generated paths is what makes the mode `existing`. |
| `<state_dir>` | config value | `stateDir` — the run-artifact tree. **Excluded from evidence gathering:** it is the harness's own tree, and a rule derived from it describes this package rather than the adopter's code. |
| `<scripts_dir>` | config value | `scriptsDir` — the directory the generated wrapper scripts live in. **Excluded from evidence gathering** for the same reason; this file invokes none of them. |
| `<githooks_dir>` | config value | `githooksDir` — the directory the committed git hooks live in. **Excluded from evidence gathering** for the same reason. |
| `<project_name>` | config value | `projectName` — the name the always-loaded project file's `# ` heading carries. The `project` target writes the paragraph beneath that heading, never the heading itself. |
| `<parity_vocabulary>` | config value | `parity.referenceName` — the name of the reference implementation this project is kept in parity with. Read **only** when `phases.parity` is `true`. |
| `<shared_conventions_path>` | config value, with a literal fallback | The `conventions` target's document, which `<layer_path_map>` cannot resolve on its own — the case that target exists for is the one where **no** `layers[]` row names it. It is the `layers[].conventions` value naming the shared cross-layer document where a layer points at it, and otherwise the literal `.claude/context/conventions.md`, spelled out here because this body is Markdown and cannot import the CLI's `SHARED_CONVENTIONS_PATH` constant. **This row is the only place in this file that path is spelled.** The document set of a no-argument run derives from it: every `layers[].conventions` value, normalized and deduplicated, plus this document whether or not a layer names it — the same derivation `autonomous-sdlc-harness init` states when it resolves the analyze offer and `doctor` states in its `setup-analysis` check. |

---

## Context

`autonomous-sdlc-harness init` detects a layout from file existence alone and writes the conventions documents
as skeletons. This command is the other half: it reads this repository and turns those skeletons into this
project's actual rules, and fills the two skeleton sections of the always-loaded project file. It is not the
host tool's own project-file initializer — that one writes a single always-loaded file from the codebase,
while this one fills the per-layer conventions documents `<layer_path_map>` points at and refuses to guess
what it could not determine. The setup verb it completes is written in full, `autonomous-sdlc-harness init`,
never a bare `init`.

**Usage:** `/harness-analyze` with no argument runs every target; `$ARGUMENTS` may name one target plus flags,
e.g. `/harness-analyze <target> --existing`.

**Targets are read from `harness.config.json` at invocation time, and this file enumerates none of them:** the
`<layer_names>` values, plus the reserved `project` (the always-loaded file), `conventions` (the shared
cross-layer document at `<shared_conventions_path>`, part of every no-argument run whether or not a `layers[]`
row names it) and `layers` (the layer profile). Refuse an unknown target and print the resolved list. A layer
whose name is one of the three reserved words **loses the bare word** to the reserved meaning: name that layer
in the refusal, and cover its document in the no-argument run.

**Supervised, first-session command.** It is not part of any unattended flow. Step 5's hand-off shells the
harness CLI out of the session, which the generated permission profile does not allow-list, so that call is
**expected to ask for permission** and a person is expected to be there to approve it — on a path that already
needs an explicit yes or `--apply-layers`.

Three standing prohibitions:

- **It never edits `harness.config.json`.** It reaches that file through exactly two
  `autonomous-sdlc-harness config set` keys — `config set layers` for a layer-profile change, and
  `config set detection.review` for step 5's verdict record — that verb being the one writer that validates
  the result and takes a `.bak`, on each key alike.
- **It never declines on size or duration.** A large repository is sampled and the sample is disclosed in
  step 6; size is never a reason to stop.
- **It writes no rule it cannot attribute.** What a rule was read off travels with it, and what could not be
  settled goes to `## Not determined` rather than into a rule.

The decisions this file applies, and what each was chosen over, are recorded in the harness repository's
docs/analyze.md — at that repository's root, outside the plugin — and are not restated here.

## Steps

1. **Resolve and announce, before writing anything.** Take the target set from `$ARGUMENTS`; with no argument
   it is every target, in the order `layers`, `project`, `conventions`, then each `layers[]` row in order —
   the profile first, because every target after it is one of its rows — **skipping any row whose
   `conventions` value names a document an earlier target in this run already covered. Every configuration
   this CLI generates carries a catch-all row pointing at `<shared_conventions_path>`, so that row is normally
   the `conventions` target under another name: one document, one write, per run.** Take the mode from
   `--existing` or `--greenfield`; with neither, detect it: source present outside `<app_dir>`'s
   harness-generated paths means `existing`.

   Also derive this run's **document set**: every `layers[].conventions` value the target set reaches,
   normalized and deduplicated, plus `<shared_conventions_path>` when the target set contains `conventions`,
   which every no-argument run does. **Dispatch is keyed by document, not by target**, so the dedup rule above
   now holds by construction rather than by a walk: two targets naming one document produce one dispatch, and
   step 6 names the pair once.

   **What a run that does not itself write the shared cross-layer document sends as `shared_document`.** Two
   run shapes do not write it: `/harness-analyze <layer>` for a layer whose own `conventions` is some other
   document, and any run — no-argument or single-target — in which (4a) classified that document `skip`. The
   discriminator is **whether this run writes it**, never whether the document set contains it; (4a) settles
   that for the whole set before any dispatch leaves, so the value is decided by the time one goes out. In both
   shapes the anchor is whatever already sits on disk, and the field carries a **value in every case**:
   `shared_document: <shared_conventions_path>` when a file exists there **and does not carry
   `<!-- harness:unfilled -->`**; `shared_document: none` when no file exists there **or** it is still an
   unfilled skeleton. The unfilled case is `none` rather than a path because an unfilled skeleton is the CLI's
   template prose: anchoring the run's vocabulary on it makes the writer borrow the template's words and the
   reviewer raise naming findings against them. `none` is a **value and never an omitted key** — the writer's
   and the reviewer's stop condition fires on a missing value, so an omitted field halts the dispatch instead
   of relaxing it. A run that **does** write it sends `none` on that document's own dispatch, for the reason
   it always does — whether the run reached it as the `conventions` target or as a layer whose `conventions`
   names it, which every generated configuration's catch-all row does.

   **The set is re-derived once, after step 5's `layers` proposal is applied.** The `layers` target runs first
   in the announced order, so its outcome is settled before any document leaves, and a `conventions` path an
   accepted proposal newly names **joins the document set here** — classified by (4a) with every other
   document and dispatched in step 4's waves like any other. The set step 4 classifies is the set as it stands
   **after** the proposal, never the set as it stood before it; when a proposal is applied, reprint the
   announcement's document set and dispatch plan with the addition named.

   Print the target list (naming, for a skipped row, the target that covers its document), the mode with how
   it was decided, the planned action per target, and the **dispatch plan**: per document, which agent writes
   it, and which targets this session keeps for itself.
   Under `--dry-run`, gather (step 2) and stop there, reporting the mode and how it was decided, the
   repo-level harvest inventory, the demand set, the `project`-target survey, the document set and the
   dispatch plan (per document, which agent would write it with which `action`, and which targets the session
   would keep) — and **no per-layer rule-deriving evidence**, because no writer is dispatched and each writer
   gathers that from its own `scope`.
2. **Gather what the whole run shares, and what the targets this session writes itself need.** Never read
   `<state_dir>`, `<scripts_dir>` or `<githooks_dir>` as evidence about the adopter's code. The per-layer,
   rule-deriving evidence is **not** gathered here: the manifests and lockfiles that name the stack, the entry
   points, the files changed most recently and the shapes that recur are each writer's own gather, from its
   own `scope`, and `${CLAUDE_PLUGIN_ROOT}/agents/conventions-writer.md` states that obligation. What this
   step gathers is three things the whole run shares, plus the survey the one code-facing target this session
   still writes needs:

   - **The mode facts** — the mode and how it was decided (step 1), carried into every dispatch as `mode`.
   - **The repo-level harvest** of the adopter's own written material — a root always-loaded file, contributor
     guides, per-area convention documents — as an **inventory of source paths**, **`existing` mode only**:
     the reconciliation of each source against the code is per-document and the writer's. A `greenfield` run
     harvests nothing and every dispatch it sends carries `harvested_sources: none`.
   - **The demand set** — what the shipped agent definitions ask a conventions document for, derived once for
     the whole run and sent to every writer and reviewer. What it contains: the implementation stack's names
     in prose; the mandated logger, localization, theming and sizing accessors; the shared components and the
     directory they live in; the test-attribute convention an interactive test locates elements by, and the
     shared helper that applies it; the navigation module and the route and screen registries; the shared
     constant owners; the storage-key constants; the wire-surface types and how a serialized field name
     relates to the in-language property; which store is the source of truth for shared state and in what
     order a listener mirrors it; the test-runner and mocking idiom; the required set that accompanies a new
     unit of each kind; and the commit-message policy. Which definitions ask, and in what words, is
     re-derivable rather than listed here — `grep -rln "convention_symbols\|impl_stack"
     ${CLAUDE_PLUGIN_ROOT}/agents/`, then that hit's `## Resolved values` row — with one item that grep does
     not reach, the test-attribute convention, which the interactive-test agents ask for outside those two
     tokens and which is therefore named in the list above rather than left to the derivation.
   - **The `project`-target survey** — the `project` target's evidence, gathered for (4b) and distinct from
     the per-layer evidence each writer gathers from its own `scope`: a repo-wide file-name and layout survey
     across `<layer_path_map>`'s paths (never `<state_dir>`, `<scripts_dir>` or `<githooks_dir>`), plus
     whatever identifies what the project is and who uses it — the manifest's name and description, the root
     entry points, the top-level layout. Scope it to exactly what (4b)'s two sections need and no further: the
     project paragraph needs what the project is, who uses it and what an agent must know before touching a
     file; the file-naming table needs the recurring name patterns **and one real file per pattern** for its
     third column. On a repository too large to survey whole, sample it and record what was sampled and what
     was not — that record is the `evidence:` clause step 6 prints for the `project` rows.
3. **What is delegated, to whom, and in what order. This step sends nothing.** It is the reference **step 4
   fills**, and step 4 is the sole sender of every dispatch in this run — write, review and fix alike —
   because the `action` a write dispatch carries is decided by (4a), and a document (4a) classifies as `skip`
   must never have been dispatched. Send nothing from here.

   **Every conventions document is written by `conventions-writer`**
   (`${CLAUDE_PLUGIN_ROOT}/agents/conventions-writer.md`), the shared cross-layer one included. That file owns
   the document's content contract — the banner, the `**What belongs here**` answers, the stack-independent
   rule block, the real example, the shared document's own sections and the `phases.parity` gate on the parity
   one, provenance on every rule, and `## Not determined` — and this file does not restate it. What this step
   keeps is what the orchestrator decides.

   **Ordering, for the set the run actually has.** **When this run writes the shared cross-layer document** —
   every no-argument run in which (4a) did not classify it `skip`, a `/harness-analyze conventions` run, and a
   single-target run naming the layer whose `conventions` is that document, which every generated
   configuration's catch-all row is — `<shared_conventions_path>` is written first, in its own
   write→review→fix chain completed before any per-layer document is dispatched: it owns the cross-layer
   flow, the testing bar and the commit policy, and its finished text is then passed to every later writer as
   `shared_document`, the read-only vocabulary anchor that keeps five writers from naming one concept five
   ways. **When it does not** — a single-target run naming another layer, or any run in which it was
   classified `skip` — there is no first chain to run and no text to pass down: the run dispatches the
   remaining documents and takes its anchor off disk under step 1's rule (the path when that file is filled,
   `none` when it is missing or still unfilled).

   **The write dispatch's argument block**, exactly as the writer's `## Invocation contract` names the fields:
   `pass: document`, **always sent** — the writer's stop condition fires on a missing value, so an omitted
   `pass` halts the dispatch rather than defaulting to an axis;
   `target`; `document_path` (absolute); `action` (`write` or `merge`, from (4a)); `scope` — this layer's
   `layers[].path` for a layer target, and the **repository root** for the shared document, which governs
   every layer and is normally the catch-all row's document, whose `layers[].path` is `.`; `mode`;
   `excluded_paths` (`<state_dir>`, `<scripts_dir>`, `<githooks_dir>`); `harvested_sources`; `demand_set`;
   `shared_document`, **always sent** — the finished shared document's path, or `none` on the dispatch that
   writes it and in the on-disk cases step 1 names; and `parity`, only when `phases.parity` is
   `true`.

   **What governs the prompt beyond that block.** `/harness-analyze` does **not** activate
   `${CLAUDE_PLUGIN_ROOT}/instructions/dispatch_discipline_instructions.md`: that file's activation list is
   closed and this command is not on it, so activating would mean editing a policy every dispatching
   instruction core obeys, and its obligations have no write point here — a setup run in an adopter's
   repository has no branch, no committer and no run-control tree to record against. **What stands in its
   place: the block is closed.** Every dispatch this command sends — write, review and fix alike — carries
   **exactly** the fields named here and in (4c) and (4d) and no added prose: no `context_notes:` line, no
   "where to be suspicious", no severity or verdict calibration, no scope narrowing.

   **It binds (4d)'s two corpus dispatch shapes identically, and hardest on the corpus review**, which carries
   exactly the fields (4d) names — no named flaw classes, and no scope narrowing beyond the `corpus_documents`
   set itself. That reviewer's independence is the only check the corpus pass has, and a caller that hands it
   the divergences the run already knows about gets confirmation back rather than evidence — which is why a
   divergence the run already holds rides a **fix** dispatch and never the review one.
4. **Classify every document, then dispatch, then review each written one once, then review the corpus as a
   set. This step sends every dispatch in the run.** Every write is **one whole document**, never a document assembled in place — the
   writer's obligation on every dispatch it receives. Each document is therefore either untouched or complete
   and an interrupted run still lands on document boundaries, but the finished set is **no longer a prefix**
   of the announced order, and a document written but not yet reviewed is indistinguishable from a reviewed
   one, so a re-run classifies it as filled and asks.

   **(4a) The conventions documents** — every layer target, and the `conventions` target. **Classification
   runs over the whole document set first**, producing one classification per document, and **only then** does
   anything go out: no dispatch ever carries an unresolved `action`, and no skipped document is dispatched and
   retracted. A document still carrying **both** its `<!-- harness:unfilled -->` marker **and** its
   `**What belongs here**` block is an **untouched skeleton**: `action: write`, without asking. Anything else
   — hand-edited, or filled by an earlier pass — is **asked**, with **merge** the default (`action: merge` —
   keep the adopter's rules, add what is missing, list any contradiction in `## Not determined`) and **skip**
   always available; `--yes` takes those defaults without asking. A **skip** answer means **no dispatch at
   all** for that document.

   The set classified here is the set step 1 leaves **after** an applied `layers` proposal, and one member of
   it is settled differently: a `conventions` path such a proposal newly named has **no file on disk**, so the
   two-part untouched-skeleton test has nothing to apply and the path classifies as **`action: write` without
   asking** — the one classification decided by the absence of a file rather than by its content. It then
   rides the same waves, carries the same argument block and gets the same single **document-axis** review
   pass as every other document.

   **After an accepted `layers` proposal, the asked default flips to `skip`.** In a no-argument run whose
   proposal was applied, every document in the set that the proposal did **not** newly name is still asked,
   with **`skip`** its default answer instead of `merge`, and `--yes` takes that default with the rest:
   registering one layer must not rewrite documents nobody asked to touch, and a skip is no write at all.
   Nothing else moves — an untouched skeleton is still `action: write` without asking, a `conventions` path
   the accepted proposal newly names is still `action: write` by the absence of a file, and outside an
   accepted proposal the ask keeps `merge` as its default. Which documents the proposal newly named is
   answerable at classification time only because step 1 re-derives the set — *"The set is re-derived once,
   after step 5's `layers` proposal is applied"*.

   Every write removes that document's `<!-- harness:unfilled -->` line and replaces the footer with a
   provenance line naming the mode and what the pass read — the writer's obligation on a `merge` dispatch as
   much as on a `write` (a leftover marker is precisely what a merge would leave, and it makes a filled
   document read as an untouched skeleton to the next run's own two-part test and to `doctor`), and graded by
   the reviewer's first check.

   **Then send, in the order step 3 fixes.** First — **when this run writes it** — the shared
   cross-layer document's own write→review→fix chain, completed before anything else leaves, so its finished
   text is available as `shared_document`; a run that does not write it starts at the next clause and carries
   step 1's on-disk value instead. Then every remaining document in **three waves — all writes, then all
   reviews, then all fixes — one message per wave, so each wave runs concurrently**, each dispatch filling the
   argument block step 3 spells out. Concurrency is an efficiency choice: a run that serializes the waves
   produces the same documents and the same report.

   **Keep every `shared_document_divergences:` line these returns carry**, from the write returns and the
   document-axis fix returns alike — the only returns that carry one, `pass: corpus` returning `none` by the
   writer's own rule — exactly as `${CLAUDE_PLUGIN_ROOT}/agents/conventions-writer.md` → `## Output contract`
   returns them (`none` is an ordinary answer and contributes nothing). They are session state, spent by
   (4d.0) and by nothing else: the session does not re-read the written documents, so a divergence that is not
   in a return is not in the run.

   **(4b) The `project` target, `.claude/CLAUDE.md`.** That file carries neither half of (4a)'s test, so it is
   **classified per section, not per file**, and (4a)'s marker-and-footer sentence does not apply to it: there
   is no `<!-- harness:unfilled -->` line to remove, and the closing italic footer is left exactly as it is.
   This target fills two sections and no others — the **project paragraph** under the `# <project_name>`
   heading, and the **file-naming table** — and each carries its own italic prompt line naming this command
   (the paragraph's "writes this paragraph from the repository itself", the table's "fills this table from the
   repository's real file names"). **A section whose prompt line is still present verbatim is untouched:
   write it without asking. A section whose prompt line is gone was written by somebody: ask, with merge the
   default and skip always available** — the same two answers (4a) offers, decided per section. Each filled
   section ends with its own one-line provenance note (the mode, and what the pass read), which replaces the
   prompt line as that section's classification signal for the next run.

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

   The **setup-pending banner is not a classification input** — it records that setup offered the analysis,
   not which sections are filled. Its absence (an unforced `autonomous-sdlc-harness init` re-run over a
   pre-existing file writes no banner, and an adopter may delete the block by hand) changes nothing above and
   is never a reason to skip this target. Delete the banner, `<!-- harness:setup-pending -->` through
   `<!-- /harness:setup-pending -->` inclusive, **only** when every target of a no-argument run has completed;
   a single-target run leaves it alone.

   The rest of that file — the generated routing table, the ledger-path block, the agent-authoring section, the `## Where a change request runs` section —
   is not this target's to edit, with one exception, named here so this step and step 5 cannot be read as
   contradicting each other: step 5's applied-proposal path re-renders the routing table to match the new
   layer list. Outside that path the routing table is left as generated.

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

   Take the reviewer's `findings:` return. If it is `none`, that document is done. Otherwise re-dispatch
   `conventions-writer` **once**, with the same fields — `pass: document` among them — plus `findings`
   verbatim, and forward the same three `prior_*` fields on that fix dispatch too, so applying a finding
   cannot silently drop the rule block.
   **No verdict, no cap, no re-review, and no adjudication on this axis:** the writer applies what it judges
   genuine and records every finding it declines, and the run moves on. The corpus axis (4d) adds a **fixed**
   two iterations over the set as a whole — still no verdict, still no cap to converge against and no
   adjudication; there, the count is the terminator.

   Both dispatches defined here are covered by step 3's closed-block rule: they carry exactly the fields named
   above and no added prose — no `context_notes:` line, no named flaw classes, no severity or verdict
   calibration, no instruction about what to skip — for the reason step 3 records. The rule matters most here:
   the reviewer's independence is the only check this one-pass design has, and a caller that aims it produces
   confirmation rather than evidence.

   The two targets this session writes itself — `project` and the `layers` proposal — are **not** reviewed:
   there is no dispatch to hang a review on, a session reviewing its own work in its own context is not an
   independent read, and the `layers` proposal is reviewed by the person who says yes to it.

   **(4d) The corpus pass — the set as a whole, two fixed iterations.** It runs **last inside step 4**, after
   every document wave has completed **and** after (4b) has written its sections: `.claude/CLAUDE.md` is a
   member, so a pass that ran before (4b) would grade a skeleton.

   **(4d.0) Reconcile the shared cross-layer document first — one fix-only dispatch, and no review.** Before
   the corpus review below: when this run **wrote** the shared cross-layer document and the
   `shared_document_divergences:` set the layer wave collected is non-empty, dispatch `conventions-writer`
   once with `pass: corpus`, that document's **same write-dispatch values** (the write table step 3 spells
   out, **minus** `pass`, which this dispatch carries as `pass: corpus`), the three `prior_*` fields **taken
   verbatim from that document's own write return**, and `findings` = the collected lines, **each prefixed
   with the exact literal `Layer-writer divergence — `** so the writer reads a forwarded divergence rather
   than a reviewer finding — that prefix, and the absence of a corpus check id, is the discriminator its own
   `## Invocation contract` names. **Fix-only:** no review dispatch accompanies it, the one-pass rule stands
   for review, and step 3's closed-block rule binds it like every other dispatch.

   **The cap, in the receiving contract's own words** (`${CLAUDE_PLUGIN_ROOT}/agents/conventions-writer.md` →
   `## Invocation contract`): on the corpus axis a document takes at most one fix dispatch per corpus
   iteration, over the at most two iterations the caller runs, **plus** at most one fix-only reconciliation
   dispatch of the shared cross-layer document, sent before iteration 1 and counted outside both. This is that
   reconciliation dispatch, the third one that sentence admits; the shared cross-layer document is
   `role: fixable` like any other document this run wrote, so it takes the iteration fixes below in addition to
   this one. The count is therefore admissible on both sides rather than only on this one: a caller that
   exceeds it is refused by the writer's own stop condition.

   It runs **first** so the corpus review reads an already-reconciled shared document and its findings are
   net-new, rather than a re-discovery iteration 2 would then have to spend itself on.

   **Skipped, with the reason recorded for step 6**, in exactly two cases: this run did not write that
   document, so there is nothing in it this run may fix; or the collected set is empty. Those two are its
   whole gate — the set-size clause below governs the review iterations, not this dispatch.

   **A divergence the writer declines** lands on that document's `## Not determined` under the existing
   literal `Reviewer finding not applied — ` and in its `findings_declined:` return, exactly as a reviewer
   finding does. That literal is **not forked for a second origin** — one literal, one grep, one count; the
   origin rides inside the line, in the `Layer-writer divergence — ` prefix the report prints.

   **The corpus set** is assembled from this run's own record, one entry per member carrying `document_path`
   (absolute), `target`, `scope` and `role`.

   - **`target` takes one of exactly three values on this axis**, spelled as the reviewer's own `target`
     paragraph below its corpus dispatch table admits them: one of `<layer_names>`; `conventions` for the
     shared cross-layer document; or **`project`** for `.claude/CLAUDE.md`, whose `scope` is the
     **repository root** and whose evidence is step 2's `project`-target survey, not any layer's `path`.
     Send no fourth value: that paragraph is the closed set, and a value it does not admit changes the
     reviewer's `conventions` carve-out silently. It rides **inside** each member entry — there is no
     top-level `target` on this axis.
   - **`role: fixable`** — every document this run wrote (its write or fix return exists), plus
     `.claude/CLAUDE.md` when (4b) wrote or merged either section.
   - **`role: context`** — every document in this run's document set that (4a) classified `skip`: evidence a
     contradiction can be measured against, and **never** a fix target, because a skip is the adopter's answer
     and a pass that overrode it would make `skip` mean "not yet". **And `.claude/CLAUDE.md` when this session
     wrote neither section** — (4b) classifies that file per section with skip available on each, so a run in
     which the adopter skips both leaves it written by nobody this run: still on disk, still evidence, and
     nothing in it this run may fix.
   - **One exclusion from the set, the same one `${CLAUDE_PLUGIN_ROOT}/agents/conventions-reviewer.md` →
     `## Invocation contract` states for `shared_document`:** a document (4a) classified `skip` that **still
     carries `<!-- harness:unfilled -->`** is left out of `corpus_documents` entirely. An unfilled skeleton is
     template prose, and measuring this run's documents against it produces findings against the template —
     findings a writer then applies. The state is reachable: (4a)'s untouched-skeleton test is the marker
     **and** the `**What belongs here**` block, so a half-edited file carrying only the marker is *asked*, and
     can be answered `skip`. **Not a silent drop** — step 6 names the excluded document and the marker, which
     is what keeps this from being the drop the next bullet refuses. `.claude/CLAUDE.md` is never excluded by
     it: per (4b) that file carries no marker.
   - **`role` is that closed two-value set and nothing else.** A member carrying neither value is a malformed
     dispatch, and silently dropping it from the set is worse than sending it: that is how the one member with
     no writer loses its review-time rule-holder on exactly the re-run where no section was written.

   **The pass does not run at all** when the set holds fewer than two members, or no `fixable` member: a
   corpus of one has nothing to be incoherent with, and the run says so in step 6 rather than paying a
   dispatch.

   **Iteration 1 — one review dispatch, then a per-document fix fan-out.** Dispatch `conventions-reviewer`
   **once** with `pass: corpus`, `corpus_documents` (the set above), `mode`, `excluded_paths`,
   `harvested_sources`, `demand_set` and `iteration: 1`. The three `prior_*` fields and `shared_document` are
   **not sent** on this axis. Take its `findings:` and group them by the `document_path` each names:

   - A group whose member is `role: fixable` **and is not `.claude/CLAUDE.md`** — dispatch
     `conventions-writer` with `pass: corpus`, that document's **same write-dispatch values** (the write table
     **minus** `pass`, which this dispatch carries as `pass: corpus`), `findings` (its group, verbatim), and
     the three `prior_*` fields **taken verbatim from that document's own write return**, forwarded and never
     re-gathered, for the reason (4c) already gives. `shared_document` travels with those write-dispatch
     values as the writer's read-only anchor, but **the corpus-fix return carries
     `shared_document_divergences: none` by that axis's own rule**
     (`${CLAUDE_PLUGIN_ROOT}/agents/conventions-writer.md` → `## The document`): there is nothing to collect
     here, and (4d.0) — the only consumer — is already past, sent or skipped, before iteration 1.
   - A group whose member is `.claude/CLAUDE.md` is applied **by this session**, (4b) being that file's only
     writer.
   - A group whose member is `role: context` is **not dispatched**, and is carried to step 6 as an outstanding
     item naming the document, the finding and why it was not applied.

   The fixes go out as **one wave**, concurrently, like every other wave in this step.

   **Iteration 2 — narrowed, fixed, and skippable on its own evidence.** Its set is the members iteration 1's
   fixes **changed** — a `fixable` member whose fix return reports at least one finding applied, or
   `.claude/CLAUDE.md` where this session applied one — **plus** every member those findings' evidence cited.
   Dispatch the reviewer once more with that narrowed `corpus_documents` and `iteration: 2`, then fan out
   fixes exactly as iteration 1 does. **Iteration 2 does not run** when iteration 1 returned `findings: none`,
   or when every finding was declined so no member changed: the narrowed set is empty, and a second full
   corpus read is then a cost with no subject. **There is no third iteration and no verdict gates either one**
   — the reviewer emits none by design, so the count is the terminator.
5. **The `layers` target proposes and never writes.** Show the current and proposed `layers` arrays as a diff,
   and name what in the tree each added or changed row was read off. Keep **at least one** row with
   `path: "."`. Apply only on an explicit yes or `--apply-layers` — never on `--yes` alone — by running
   `npx autonomous-sdlc-harness config set layers '<json>'` and reporting its output; that verb validates the
   result and writes the `.bak`. **This step itself sends nothing.** On acceptance inside a no-argument run:
   the `layers` target has already run first, so next update the `project` target's routing table to match the
   new list. A `conventions` path the accepted proposal newly names **joins the run's document set** — step 1
   re-derives the set, (4a) classifies that path `action: write` because no skeleton exists at it
   (`autonomous-sdlc-harness init` is the only writer of one and is not re-run here, so the `document_path`
   does not exist when the dispatch goes out), and step 4 sends it in the same waves, with the same argument
   block and the same one-pass review, as every other document. The shape to compose a document with no file
   behind it is `${CLAUDE_PLUGIN_ROOT}/agents/conventions-writer.md` → `## The document`, whose third case is
   exactly that dispatch; this file does not restate it.

   **Record the verdict, in all three outcomes.** Once the propose/apply decision is settled, record what
   this target concluded by running `npx autonomous-sdlc-harness config set detection.review '<json>'` and
   reporting its output, where `<json>` is, on one line:

   `{"verdict": "<one of applied | considered-no-change | proposed-and-refused>", "rationale": "<one line: what was read, what was concluded, and — where a proposal was refused — what was proposed>", "at": "<YYYY-MM-DD>"}`

   The three verdicts are the three outcomes: **`applied`** after a successful `config set layers`;
   **`considered-no-change`** when this target examined the tree and proposes nothing;
   **`proposed-and-refused`** when a proposal was shown and the operator declined it. Three bounds hold on it.
   **Recording a refusal is not applying it** — the record says the profile was examined and the answer was
   no, `layers[]` is untouched on that arm and the run says so, and the record may never read as the change
   having landed. And on the refused arm the `rationale`
   **names the proposal that was refused**, because a proposal an operator has already answered, re-put
   unchanged by the next run, is what teaches them to stop reading it. And **any quantity the `rationale`
   states is the output of a command run in this session before this `config set` call — or it is omitted**:
   name what was read, the directory, the manifest, the file, rather than counting its contents, and state a
   count only where the count is the reason for the verdict, where it is run and not recalled. The rationale
   is composed from this session's own working text, and a figure carried over from there has never been
   checked. It is load-bearing because `doctor`'s `layer-profile` check
   (`cli/src/doctor/checks.ts` → `LAYER_PROFILE_CHECK`) reproduces the rationale verbatim as its evidence, so
   this record is read long after the run that wrote it. This call shells the CLI out of the
   session exactly as the `config set layers` call above it does, on `## Context`'s terms.

   **What that record clears, and what it does not.** `doctor`'s `layer-profile` check warns while the
   profile carries no row scoped below the repository root and its provenance does not account for that — the
   unrecognised-layout fallback, unrecorded, or a preset whose source root did not resolve — and this record is
   the one thing that clears it — which is what closes this hand-off's
   loop — while it deliberately does **not** silence `layer-drift`, which reads this record **for reporting
   only**, naming the verdict and its date in its warning, so a recorded verdict never stops `doctor`
   reporting a source directory no layer covers, including one added after the review. A verdict describes
   the profile at the moment it was reviewed; `layer-drift` is what notices the tree moving afterwards.
6. **Report, in this order:** the mode and how it was decided; per target, the action taken (written / merged
   / skipped / proposed) and the evidence sampled, including what was **not** read on a large repository — a
   document two targets name is reported **once**, naming both;
   every `## Not determined` line collected across the documents; every conflict found between the adopter's
   existing prose and the code; the corpus pass's own outcome, including every outstanding cross-document
   item, in the shape the corpus block below sets out; and the next action —
   `npx autonomous-sdlc-harness doctor` to confirm nothing is left unfilled, and `/harness-analyze <target>`
   to redo one document. A run that wrote nothing says so explicitly. Report in the **announced target order
   regardless of completion order**, so concurrency changes nothing a reader sees.

   **The report is built from the returns for every delegated document, and from this session's own record for
   the targets it wrote itself; the session does not re-read the written documents.** For a document that went
   through a fix dispatch, take the fields from the **fix** return, which describes the document as it finally
   stands.

   - **A delegated document** — every conventions document step 4 dispatched: the **action taken** is the
     writer's `action_taken:` (`written` or `merged`); the **evidence sampled**, including what was not read
     on a large repository, is its `evidence:` line, printed per document as returned; every
     **`## Not determined` line** is its `not_determined_lines:`; every **conflict** between the adopter's
     existing prose and the code is its `conflicts:` line-set.
   - **A document (4a) classified `skip`** is reported **`skipped`** from that classification, naming the
     reason it was skipped and printing no evidence, `## Not determined` or conflict lines, because nothing
     was written.
   - **The `project` target** is reported **per section**, written or merged, from (4b)'s own per-section
     classification; its **evidence sampled** is step 2's `project`-target survey, printed as what that survey
     covered and what it did not on a large repository; its **conflict** clause is (4b)'s own reconciliation
     of the harvest inventory against that survey, this target having no writer and no `## Not determined`
     section.
   - **The `layers` target** is reported **`proposed`**, or applied when an explicit yes or `--apply-layers`
     ran `autonomous-sdlc-harness config set layers`, from step 5's own outcome — and **beside** that action
     value, never as a fifth one, the verdict step 5 recorded with its rationale. Where the
     `config set detection.review` call was **refused at the permission prompt or otherwise did not run**,
     say so in the same place: a silent run must never leave a reader to infer that something was recorded.

   That is where all four action values above come from — `written` / `merged` from a writer return or from
   (4b)'s own work, `skipped` from (4a), `proposed` from step 5.

   **The review lines are delegated-document rows only:** per document, whether it was **reviewed**, how many
   findings were applied (the fix return's `findings_applied:`) and how many were not, then every declined
   finding listed once with the writer's reason (`findings_declined:`). A skipped document, the `project` sections and the `layers` proposal carry
   no review line at all. Every declined finding also stands in that document's `## Not determined` under the
   literal `Reviewer finding not applied — `: the report is the run-time view, the document is the durable
   one.

   **The corpus block follows those rows, and is built from (4d)'s own returns — and, for the one member that
   has no writer and no fix return, from this session's own record:**

   - **Whether the corpus pass ran** — and where it did not, which of (4d)'s two stated reasons applied: fewer
     than two members, or no `fixable` member.
   - **Whether (4d.0)'s reconciliation dispatch ran or was skipped**, and on a skip which of its two reasons
     applied.
   - **Per iteration, how many findings were raised**, then per document how many were applied and how many
     were not — for a delegated member, that document's corpus fix return (`findings_applied:` and
     `findings_declined:`); for **`.claude/CLAUDE.md`**, this session's own record of what it applied and what
     it declined, that member having no writer and no fix return per (4b) — with every declined one listed once
     with the reason, the writer's or this session's, and the `Layer-writer divergence — ` prefix printed
     intact where the line carries one, that prefix being what names the finding's origin. A finding this
     session declined against `.claude/CLAUDE.md` is entered here **as** that target's step-6 conflict line
     from (4b), printed once — not once here and again among the `project` row's conflicts.
   - **A finding whose correction lands in a `role: context` member, one against a `.claude/CLAUDE.md` section
     (4b) classified `skip`, or one against `.claude/CLAUDE.md` landing outside the two sections (4b)
     composes**, is listed as **outstanding**, naming the document, the finding, and why nothing in it was this
     run's to fix — the adopter's own skip answer for the first two, `init`'s generated remainder for the third.
     None of the three is a declined finding: none was refused on the merits, so none is entered as a conflict
     line.
   - **Every document (4d) excluded from the set** for still carrying `<!-- harness:unfilled -->` — named, with
     the marker as the reason, so a corpus that read fewer documents than this run classified is visible rather
     than inferred. Not an outstanding item: nothing is owed on it beyond filling the skeleton.

   **An outstanding cross-document divergence is one of this run's results, not a next action.** Three shapes
   count: a finding landing in a `role: context` member; a divergence or corpus finding the writer declined;
   and a reconciliation (4d.0) held divergences for but could not send, this run not having written the shared
   cross-layer document. Each is reported **among the results above**, named as the run's outstanding item —
   and only then may `Next actions` name `/harness-analyze <target>` as its remedy. **A run that ends with
   none says so explicitly**, in the same place, as a run that wrote nothing does.
