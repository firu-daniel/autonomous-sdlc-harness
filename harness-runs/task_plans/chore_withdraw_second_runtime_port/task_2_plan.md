### Task 2 — Withdraw the row in `ROADMAP.md`, add `Withdrawn` to the legend and renumber the index

**Goal:** `ROADMAP.md` no longer lists **Second-runtime reference port** as outstanding work. Its row says the item is withdrawn and links the decision record, the legend has a value for that state, and the index priorities run without a gap.

**Depends on:** Task 1, which creates `docs/second-runtime-port-decision.md` at exactly that path. That record carries the reasoning and states the legend decision this task applies. This task links to the file and does not restate its content. The row gets one sentence plus the link, nothing more.

**Legend decision (fixed in the story index's `## Context`; apply it, do not reopen it):** add `Withdrawn` to the status legend and set this row's status to `Withdrawn`. The index lists only outstanding work, and until now the only rows missing from it were `Done` ones. A row missing from the index while its status says `Open` would contradict itself, and `Done` would be false.

### Targets

- `ROADMAP.md`: the lead paragraph, the `**Status:**` legend line, `## Index`, and the row in `## Engines, environments and integrations`.

**Work:**

- [ ] **Legend and lead paragraph.**
  - The `**Status:**` line becomes `` `Open` · `In progress` · `Done` · `Withdrawn` ``.
  - The lead paragraph says the tables *"include what is already done"*. Extend it to include what was withdrawn, for example *"include what is already done and what was withdrawn"*. Leave the rest of the paragraph as it is.
- [ ] **Index.**
  - Delete the entry `| 8 | [Second-runtime reference port](#engines-environments-and-integrations) |`.
  - Renumber every entry below it down by one, keeping their order. **Engine / provider abstraction** becomes 8, and every later entry moves up one place through to the last. No other index entry changes text.
- [ ] **The row.**
  - Keep the Feature cell `Second-runtime reference port`.
  - Replace the description with one sentence that summarises the decision, bolding **withdrawn** the way the **Docs-catalog retrieval** row words its verdict, followed by the link. For example: *"**Withdrawn** by maintainer decision on 2026-09-24: the planning loop is already an orchestrator-walked graph whose committed progress ledgers are its durable state, and a port would add code-enforced routing no run has needed while moving the planning phase onto per-token API billing ([`docs/second-runtime-port-decision.md`](docs/second-runtime-port-decision.md))."*
  - Set the status cell to `Withdrawn`.
  - The row keeps its position in the table.
- [ ] **Leave these unchanged:** the **Engine / provider abstraction** row (task prompt → `## Out of scope`), the **Engine seam design** `Done` row, and the **Docs-catalog retrieval** row.

**Verification:**

- `grep -n -E "^\| [0-9]+ \| " ROADMAP.md`: the priorities run 1, 2, 3 … to the last entry, each exactly once, with no gap and no repeat. No entry names `Second-runtime`. (Invariant: the last number equals the number of index entries.)
- The acceptance grep from the task prompt, run verbatim from the checkout root: `grep -rn -i "second-runtime\|reference port\|langgraph\|langchain" --exclude-dir=node_modules --exclude-dir=harness-runs --exclude-dir=.git .`. Every `ROADMAP.md` hit is the withdrawn row, and no hit describes the item as planned. Every hit must be a site in the story index's `## Scope register`.
- The roadmap-number derivation from the register (entry B), run verbatim from the checkout root: `grep -rn -E "ROADMAP\.md|[Pp]riority [0-9]+|this file's priorities|[Rr]oadmap (item|items|row|priority|entry) [0-9]+|ROADMAP_ITEM = [0-9]+" --exclude-dir=node_modules --exclude-dir=harness-runs --exclude-dir=.git --exclude-dir=dist .`. Every hit must be a site in the story index's `## Scope register`, rows 3–6 or 24–50, with no hit outside them. Each of those rows is `no-change` because its number resolves against `docs/development.md` → `## 6. The roadmap this tree defers to` (row 23) and not against a `ROADMAP.md` priority, or, in row 24's case, against neither. So the renumbering breaks no citation. A hit outside those rows is a new citation: decide it under entry B's decision rule before committing.
- The row's link resolves: `ls docs/second-runtime-port-decision.md` from the checkout root.
- `git diff ROADMAP.md` touches only the legend, the lead paragraph, the index numbers, the deleted index entry and the one row. The **Engine / provider abstraction** row's text is byte-identical.
- `bash scripts/run-gates.sh`, run without a pipe. Each `FAIL` line must be a gate whose printed output names no file this task changed.
