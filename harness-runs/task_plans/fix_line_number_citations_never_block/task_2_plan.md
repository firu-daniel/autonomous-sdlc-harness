### Task 2 — Rewrite the citation-lifetime paragraph, the supervised dispatch wording and `layer-reviewer`'s severity clauses and findings template

**Goal:** Settle how long a finding lives in the one paragraph the implementer loads, and make the per-unit reviewer's severity clauses and findings template agree with it: every artifact anchors on a symbol, heading or quoted substring; a durable artifact carries no line coordinate; a point-in-time artifact may add one beside its anchor as a hint, never in its place.

**The decisions this task writes (story index `## Context`, decisions 1 and 2).** Keep the two classes, enumerate the durable one instead of defining it by "the round", delete the disproven gloss *"consumed within its own round"*, and add the rule that nothing in either class depends on a line number. The five texts below are the canonical ones. **C1, C2 and C3 are carried byte-identical by Task 3** (`branch-reviewer.md`, `skeptic-reviewer.md`), and **C3 by Tasks 4 and 6** (`review-plan-reviewer.md`, `task-plan-reviewer.md`); this task owns none of those files and edits none of them.

C1 — replaces the whole `- **Should Fix** — …` bullet under `## Checklist`:

```text
- **Should Fix** — the code or claim is wrong or unclear but no consumer decision turns on it; and a line coordinate in a durable artifact — an instruction file, an agent definition, a catalog document, a standing tracked artifact under `<state_dir>`, a code comment — stale or not, or a citation in any artifact that locates its site by a line coordinate alone, repaired by replacing the coordinate with a symbol anchor.
```

C2 — replaces the whole `- **Nice to Have** — …` bullet:

```text
- **Nice to Have** — style, wording, ordering; and a stale line hint beside an anchor that resolves, in a point-in-time artifact (a plan, a review, a finding, a QA report).
```

C3 — replaces the whole `**Guard carve-out.** …` paragraph:

```text
**Guard carve-out.** Pointer resolution binds a cited path, symbol, heading or quoted substring that does not resolve; a line coordinate — stale, missing or present — never binds it, and is gradable however it is enumerated, including where it is enumerated as a `<state_dir>/lessons.md` entry.
```

C4 — replaces the `layer-implementer.md` paragraph that opens *"New citations you write name a symbol, heading or quoted substring, never a line number"*:

```text
New citations you write name a symbol, heading or quoted substring, and nothing you write depends on a line number: a durable artifact — an instruction file, an agent definition, a catalog document, a standing tracked artifact under `<state_dir>/`, a code comment — carries no line coordinate, while a point-in-time artifact — a plan, a review finding, a per-finding fix file — may add one beside its anchor as a navigation hint, never in its place. A renamed symbol fails loudly, because the grep returns nothing; a shifted line fails silently. This rule is harness doctrine and is stated here in full rather than cited; where the adopter's own rules document restates it (the file `layers[].conventions` names), nothing here depends on that restatement.
```

C5 — the site-anchor clause, defined here because `layer-reviewer.md`'s findings file is the first finding contract in ship order; **Tasks 3, 4, 5 and 7 carry it byte-identical** in the per-finding contracts they own:

```text
the site anchor (the repo-relative path plus the symbol, heading or short quoted substring that locates the change, with a quoted substring beside any symbol whose body spans more than the change and a bare path only when the change is the whole file; a line number may follow as a navigation hint, and nothing depends on it)
```

### Targets

- `plugin/agents/layer-implementer.md` — the citation paragraph after `**Reuse beats invention.**`, and `## Working modes` → `### Supervised mode`.
- `plugin/instructions/plan_orchestration_instructions.md` — the single-layer dispatch bullet and the dispatch-prompt checklist.
- `plugin/agents/layer-reviewer.md` — `## Resolved values` intro, `## Checklist`, `## Output contract` → `### 3. At least one Must Fix`.

**Work:**

- [ ] `layer-implementer.md`: replace the citation paragraph with C4, and in `### Supervised mode` replace *"the `<reference_impl>` source line(s) that fix the behaviour"* with *"the `<reference_impl>` source anchors that fix the behaviour"*. Leave `## Minimal prose — every line carries a rule` and the `### Name the consumer, then place the evidence` line-number probe untouched: the first is prose-volume doctrine whose membership list already matches C4, and the second protects existing coordinate citers without requiring one.
- [ ] `plan_orchestration_instructions.md`: replace *"(include relevant line numbers if known)"* with *"(anchor it by symbol, heading or quoted substring; a line number only as a hint beside the anchor)"*, and replace both *"relevant source line(s) of the reference implementation"* occurrences — in the single-layer dispatch bullet and in the dispatch-prompt checklist — with *"relevant source anchors of the reference implementation"*.
- [ ] `layer-reviewer.md` → `## Checklist`: replace the Should Fix bullet with C1, the Nice to Have bullet with C2 and the `**Guard carve-out.**` paragraph with C3, byte for byte. Leave the `**Prose volume — the receiving side.**` paragraph as it is.
- [ ] `layer-reviewer.md` → `### 3. At least one Must Fix`: change the template's first finding line to ``1. **<title>** — `<file>` (`<symbol>`) — "<quoted substring>"``, change its description line's *"plus the `<reference_impl>` source line when"* to *"plus the `<reference_impl>` source anchor when"*, and add one sentence directly above the fenced template: *"Each finding's location is"* followed by C5 and a full stop. In the `## Resolved values` intro, replace `` `<file>` / `<line>` / `<title>` / `<full_path>` (the findings-file template) `` with `` `<file>` / `<symbol>` / `<quoted substring>` / `<title>` / `<full_path>` (the findings-file template) ``.

**Verification:**

- Grep `plugin/agents/layer-implementer.md`, `plugin/agents/layer-reviewer.md` and `plugin/instructions/plan_orchestration_instructions.md` for `<file>:<line>`, `#L<line>`, `line numbers if known`, `source line`, `consumed within its own round` and `anything read after the round that produced it`, and find no hit in any of them.
- With the Grep tool in fixed-string mode, search `plugin/agents/layer-reviewer.md` for each of C1, C2, C3 and C5 exactly as fenced above and get one hit each — the text is what Tasks 3 through 7 compare against.
- Dead pointers still block against the new wording: read `## Checklist` and confirm a finding anchored `` `src/data/search/searchServce.ts` (`fetchRecentSearches`) `` (no such path) is Must Fix under *"a pointer's target does not exist"* and C3's *"a cited path, symbol, heading or quoted substring that does not resolve"*, and that `## Catch-all layer additions` still carries, unedited, *"A routing-table row dispatches an agent whose file does not exist on disk."*
- C4's durable and point-in-time lists name the same members as C1 and C2 — durable: instruction file, agent definition, catalog document, standing tracked artifact, code comment; point-in-time: plan, review, finding, QA report (C4 names a review finding and a per-finding fix file as instances of those).
