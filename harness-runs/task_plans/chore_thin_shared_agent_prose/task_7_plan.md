### Task 7 — Thin the shared sentences of the `<layer_names>`, `<convention_symbols>` and `iteration` rows, identically in every copy

**Goal:** Shorten three sentences that the `## Resolved values` and `## Invocation contract` tables repeat across families — the `<layer_names>` "No substitution" sentence (fifteen agents), the `<convention_symbols>` closing clause (twelve agents) and the `iteration` row's two sentences (six agents) — writing one result per sentence into every copy.

**Depends on:** Task 6, which edits other rows of the same tables in seven of these files. This task changes only the three sentences named here.

**Where this task stops.** Kept byte-for-byte: `layers[].name`, `_(layer: …)_`, `findings_folder`, the bold "**No substitution of the names themselves**" label, and every agent-specific sentence after the shared one — each `<layer_names>` row's account of where the names appear, and each `<convention_symbols>` row's list of what to look for. Not touched: the unit-loop pair's `<layer_names>` row (`layer-implementer.md`, `layer-reviewer.md`), whose sentence continues "unchanged, because the layer reaches you as a dispatch argument…" and is that family's to thin; `docs-reviewer.md`'s and `test-fix-plan-writer.md`'s rows, which share no sentence; `conventions-reviewer.md`'s `iteration` row; and the two-word "Integer `i`." `iteration` rows in `architecture-reviewer.md` and `business-parity-reviewer.md`.

Each replacement gives the **old** text and the **new** text in their own fenced blocks; match the old text exactly and replace it whole.

### Targets

- `<layer_names>` sentence — `plugin/agents/architecture-reviewer.md`, `plugin/agents/branch-reviewer.md`, `plugin/agents/business-parity-reviewer.md`, `plugin/agents/conventions-reviewer.md`, `plugin/agents/conventions-writer.md`, `plugin/agents/docs-writer.md`, `plugin/agents/qa-tester.md`, `plugin/agents/review-plan-reviewer.md`, `plugin/agents/skeptic-reviewer.md`, `plugin/agents/statistics-plan-writer.md`, `plugin/agents/task-plan-reviewer.md`, `plugin/agents/task-plan-writer.md`, `plugin/agents/ui-tests-plan-reviewer.md`, `plugin/agents/ui-tests-plan-writer.md`, `plugin/agents/user-review-fix-plan-writer.md`.
- `<convention_symbols>` clause — `architecture-reviewer.md`, `branch-reviewer.md`, `business-parity-reviewer.md`, `docs-writer.md`, `layer-implementer.md`, `layer-reviewer.md`, `qa-tester.md`, `review-plan-reviewer.md`, `skeptic-reviewer.md`, `task-plan-reviewer.md`, `task-plan-writer.md`, `ui-tests-plan-writer.md`.
- `iteration` row — `architecture-reviewer.md`, `business-parity-reviewer.md`, `layer-reviewer.md`, `review-plan-reviewer.md`, `task-plan-reviewer.md`, `ui-tests-plan-reviewer.md`.

**Work:**

- [ ] **`<layer_names>` sentence**, in its fifteen files. Old fragment → new (what follows it in each row stays):

```markdown
**No substitution of the names themselves** — the configured names travel through this file unchanged.
```

```markdown
**No substitution of the names themselves.**
```

- [ ] **`<convention_symbols>` clause**, in its twelve files. Delete the clause and keep the sentence's full stop. Old fragment → new:

```markdown
; this file names none of them.
```

```markdown
.
```

  So "Read them off the conventions documents `<layer_path_map>` names; this file names none of them." becomes "Read them off the conventions documents `<layer_path_map>` names.", and the "Read it off …" and "Read them off the same conventions document; …" forms lose the same clause.

- [ ] **`iteration` row, first sentence**, in its six files. Old fragment → new:

```markdown
Integer supplied by the caller — the index your findings file is named with and titled by; do not re-derive it.
```

```markdown
Integer from the caller — the index your findings file is named and titled with; never re-derive it.
```

- [ ] **`iteration` row, second sentence**, in the five files other than `layer-reviewer.md`. Delete it, with its leading space, so the cell ends at "never re-derive it.". Old fragment:

```markdown
 At the gates that resolve it that way, it is the next free index in `findings_folder`.
```

  `layer-reviewer.md` keeps its own second sentence ("The unit loop resolves it as the next free index in `findings_folder`, which every layer of the unit shares.") — it tells a multi-layer reviewer why the folder is shared, which the dropped one does not.

- [ ] Before saving each file, confirm the deleted text was description only — that the names pass through unchanged is what "No substitution" already says; that this file names no symbol is visible by reading it; how a gate picks the index is the caller's — and that no table cell lost its closing `|`.

**Verification:**

- The copies match: `git grep -l -F -e '**No substitution of the names themselves.**' -- plugin/agents` lists the fifteen `<layer_names>` files plus `test-fix-plan-writer.md` (whose row already had this form); `git grep -l -F -e 'Integer from the caller — the index your findings file is named and titled with; never re-derive it.' -- plugin/agents` lists exactly the six `iteration` files.
- The old text is gone: `git grep -l -F -e 'travel through this file unchanged.' -e '; this file names none of them' -e 'Integer supplied by the caller' -e 'At the gates that resolve it that way' -- plugin/agents` lists nothing.
- The tables still parse: in each edited file, every edited row still begins with `|` and ends with `|`, and `git diff --stat -- plugin/agents` shows no file with more insertions than deletions.
- Each edited file is shorter: record `wc -w` for each before your first edit; after the edit each figure is lower.
