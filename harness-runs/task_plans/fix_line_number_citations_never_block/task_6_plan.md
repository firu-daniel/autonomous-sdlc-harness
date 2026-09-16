### Task 6 — Anchor `<reference_impl>` citations in the task-plan writer and reviewer, and the UI-test reviewer's source wording

**Goal:** Bring `<reference_impl>` citations under the same anchor rule as every other citation (story index `## Context`, decision 3), close `task-plan-reviewer`'s two coordinate routes, and fix `ui-tests-plan-reviewer`'s one coordinate-shaped finding requirement.

**Depends on:** Task 2, which writes C3 into `plugin/agents/layer-reviewer.md`; this task carries it byte-identical into `task-plan-reviewer.md`, as Tasks 3 and 4 do into theirs. The parity reviewers' matching wording — *"traces to a cited `<reference_impl>` source anchor"* — is Task 5's in `business-parity-reviewer.md`; this task uses the same term, **source anchor: the path plus the symbol, with a quoted substring where the symbol spans more than the behaviour, and a line range only as a hint**, and does not edit that file.

C3:

```text
**Guard carve-out.** Pointer resolution binds a cited path, symbol, heading or quoted substring that does not resolve; a line coordinate — stale, missing or present — never binds it, and is gradable however it is enumerated, including where it is enumerated as a `<state_dir>/lessons.md` entry.
```

**Why the reference tree is in scope although it does not change during a run.** `task-plan-reviewer.md` step 3's *"the line range supports the claim"* is a verdict that turns on a coordinate being right, and the writer's example `<reference_impl>/<path/to/source_file>:142-178` is what teaches a plan to cite that way. The deferral marker `// TODO: @claude add a follow up task for this: <feature> — <reference_impl> <file>:<lines>` is written into source code, a durable artifact, so it may carry no coordinate at all.

**The route analysis this task acts on.** `task-plan-reviewer` has two routes: step 3's line-range test, and *"a plan that re-plans a ledger mistake is a Must Fix"*, which a `lessons.md` entry about citations would turn into a coordinate Must Fix. The closing clauses are the new step 3 (*"verify the anchor resolves and the anchored source supports the claim"*) and C3. Step 3's resolution test is scoped to `<reference_impl>` sources, which exist before the plan is written, so it creates no trigger over the plan's own targets.

**Route analysis — what C3 does in this file.** `task-plan-reviewer.md` has no `**Your own checklist is not downgradable.**` guard and no pointer-resolution rule for plan citations, so C3's first half (*"Pointer resolution binds a cited path, symbol, heading or quoted substring that does not resolve"*) has nothing to modify here and **adds no trigger**; it is carried byte-identical only so the carrier set stays one text. Only its second half — *"a line coordinate — stale, missing or present — never binds it, and is gradable however it is enumerated, including where it is enumerated as a `<state_dir>/lessons.md` entry"* — does work in this file: it closes the ledger route. A task plan cites things that do not resolve yet by design — a `### Targets` entry marked `(new)`, a per-task file quoting text the task is about to write, a `## Scope register` row anchored on a substring a `change` row replaces — and **none of these is ever a finding under C3**. That is why C3 is placed in `## Read first`, directly after the bullet list that ends with the `<state_dir>/lessons.md` ledger bullet it qualifies, and **not** inside any `(Must Fix)` check group, where its first half would read as a new Must Fix trigger and break the prompt's `## Out of scope` (*"Close the coordinate routes and nothing else"*). The implementer must not add any anchor-resolution Must Fix to this file.

Its `## Scope register` bullet grading a coordinate in a `Site` cell as Should Fix already agrees and is not edited. `ui-tests-plan-reviewer` has **no** route — its Must Fix triggers name ids, backend names, capabilities, sections and correspondence, and its ledger use is lifecycle and calibration behaviour classes — so it gets no grading clause; its one edit is that a finding it writes names *"the source line that settles it"*.

### Targets

- `plugin/agents/task-plan-writer.md` — `## Resolved values` intro; the steps 2–4 gate note; `## Process` steps 2, 4 and 9.
- `plugin/agents/task-plan-reviewer.md` — `## Read first` ledger bullet, and C3 as a paragraph directly after that section's bullet list; `## Process` step 3; `### Reference-implementation parity` threshold bullet; `### Completeness`; the Must Fix template.
- `plugin/agents/ui-tests-plan-reviewer.md` — `### Asserted attribute values agree with the source` second bullet.

**Work:**

- [ ] `task-plan-writer.md`: replace step 2's *"Cite specific files and line ranges (e.g. `<reference_impl>/<path/to/source_file>:142-178`)."* with *"Cite each source by path and symbol, with a quoted substring where the symbol spans more than the behaviour (e.g. `<reference_impl>/<path/to/source_file>` (`<symbolName>`)); a line range may follow as a navigation hint, and nothing depends on it."*; replace the gate note's *"you cite no `<reference_impl>` line anywhere in it"* with *"you cite no `<reference_impl>` source anywhere in it"*; replace step 9's *"Every threshold / constant has a `<reference_impl>` source line."* with *"Every threshold / constant has a `<reference_impl>` source anchor."*
- [ ] `task-plan-writer.md`: in step 4's marker replace `— <reference_impl> <file>:<lines>` with `— <reference_impl> <file> (<symbol>)`, and in the `## Resolved values` intro replace `` `<file>` / `<lines>` `` with `` `<file>` / `<symbol>` ``. The other quoters of the marker (`task-plan-reviewer.md`, `business-parity-reviewer.md`, `skeptic-reviewer.md`, `task_plan_writing_instructions_core.md`, `task_plan_writing_instructions_semi_autonomous.md`) elide its tail as `…` and need no edit — re-derive that with `grep -rn 'follow up task for this' plugin` before closing.
- [ ] `task-plan-reviewer.md`: replace step 3's *"verify the citation is real and the line range supports the claim"* with *"verify the anchor resolves and the anchored source supports the claim"*; replace the threshold bullet's *"traces to a cited `<reference_impl>` source line"* with *"traces to a cited `<reference_impl>` source anchor"*; replace the template's *"with the reference source line when the parity phase is on"* with *"with the reference source anchor when the parity phase is on"*; replace both *"cite the ledger line"* (in `## Read first` and in `### Completeness`) with *"quote the ledger entry"*.
- [ ] `task-plan-reviewer.md` `## Read first`: add C3 as its own paragraph directly after the bullet list — after the `<state_dir>/lessons.md` ledger bullet and before the *"**A cited path you cannot read is a finding, not a fallback.**"* paragraph. Do **not** place it in `### Completeness (Must Fix)` or any other `(Must Fix)` check group, and add nothing else: no anchor-resolution trigger, no guard (see the C3 route analysis above).
- [ ] `ui-tests-plan-reviewer.md`: replace *"the asserted literal and the source line that settles it"* with *"the asserted literal and the source anchor that settles it"*.

**Verification:**

- Grep all three targets for `line range`, `line ranges`, `source line`, `ledger line`, `<lines>` and `:142-178`: no hit.
- With the Grep tool in fixed-string mode, search `task-plan-reviewer.md` for C3 exactly as fenced above: one hit, and it sits in `## Read first`, above `## Process` — not under any `### … (Must Fix)` heading.
- Grade a plan that creates a file against the edited reviewer: take `plugin/samples/sample_story/task_1_plan.md`, whose `### Targets` names `recentSearchRecord.ts` (new), and a per-task file that quotes text its task is about to write; read every `(Must Fix)` check group and C3 and confirm no clause makes either a Must Fix — the only sentences that make an unresolved citation a finding remain step 3's, scoped to `<reference_impl>` sources.
- Read step 3 in the edited reviewer and confirm a plan citing `` `<reference_impl>/search/recent_searches_panel.dart` (`RecentSearchesPanel`) `` with no line range passes the citation test, while a citation to a symbol absent from that file fails it (*"verify the anchor resolves"*).
- The deferral marker in step 4 carries no `:` coordinate: grep `task-plan-writer.md` for `<file>:` and find no hit.
- `claude plugin validate --strict plugin` prints `✔ Validation passed`.

**Deviations from plan:**
- The first `**Verification:**` bullet (no `line range` hit in the three targets) conflicts with the step-2 replacement text the `**Work:**` bullet prescribes verbatim (*"a line range may follow as a navigation hint, and nothing depends on it"*). Implemented the prescribed text; the one remaining `line range` hit is that sentence in `task-plan-writer.md` step 2, and every other pattern in that bullet returns no hit.
- Evidence downgrade: `claude plugin validate --strict plugin` was refused by the permission layer (two attempts, "This command requires approval"), so the manifest gate was not executed. The edits touch agent body text only, no frontmatter or manifest; that claim rests on reading the diff, not on the validator.
