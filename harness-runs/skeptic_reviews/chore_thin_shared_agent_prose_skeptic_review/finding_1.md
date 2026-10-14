### 1. Task 10's precedence sentence makes three agents stop reading documents they read before, so the unit loop loses the cross-layer rules and business-parity-reviewer loses the lessons ledger

**Site anchors** (the same sentence in each file):

- `plugin/agents/layer-implementer.md` → `## Read first`, the line `Where the auto-loaded \`CLAUDE.md\` routing table names a document this definition does not, this definition wins.`
- `plugin/agents/layer-reviewer.md` → `## Read first`, the same line.
- `plugin/agents/business-parity-reviewer.md` → the read list that ends with the `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule` bullet, the same line directly after it.

**Problem.** The task prompt's goal 3 asks for the sentence only in definitions "whose read list is narrower than the generated `CLAUDE.md` routing table". Its example is an explicit exclusion: `test-fix-plan-writer.md`'s "Never read all of them up front". The story plan's derivation entry P1 used a looser rule: `change` when the list *omits* a document the table routes the agent to. That rule also caught three agents whose definitions say nothing about the routed document. For these three, before this branch, the two read lists **added together**. The branch's own research input says so in each case:

- `docs/work-report-research/layer-implementer.md`: "**Which read list wins.** The larger set wins. `CLAUDE.md` is auto-loaded and its routing row is unconditional, so `conventions.md` is read alongside the dispatched document even though the agent's `## Read first` names only the dispatched one."
- `docs/work-report-research/layer-reviewer.md`: "The two lists are additive rather than contradictory, so the larger set is counted, and CLAUDE.md wins by inclusion."
- `docs/work-report-research/business-parity-reviewer.md`: "The agent definition never mentions the lessons ledger, but CLAUDE.md routes branch-level reviewers to it. The larger set wins …"

The new sentence turns that silence into an exclusion. Story plan rows 213, 219 and 220 record the result as their reason: "reviews at branch level without the lessons ledger", "reads only the dispatched layer's document". That breaks the task prompt's first constraint, "**Behaviour does not change.** Every rule an agent or orchestrator follows today still holds after the edit".

**Runtime symptom, and why it is reachable.**

- **Unit loop (`layer-implementer`, `layer-reviewer`).** Every unit dispatched to a non-catch-all layer now reads only that layer's document. The harness puts every cross-layer rule in the shared document and nowhere else. `plugin/agents/conventions-writer.md` says: "A rule governing more than one layer is owned by the shared cross-layer document. A layer document states this layer's own consequence of it and cites the owner — never restates the rule". The shared document "additionally owns the cross-layer flow, the testing bar, the commit-message policy". The generated layer template `cli/templates/claude/context/layer.md` says "the rules that span all of them live in the cross-layer conventions document". In this repository, `.claude/context/cli.md` says of `.claude/context/conventions.md` that it is the file "which this file assumes has been read". Its own provenance note records that its restatements of `## The testing bar` and `## What accompanies a new unit of each kind` were replaced by citations of the shared document. So a `cli`-layer or `plugin`-layer unit, in this repository or in any adopter's, is now implemented and reviewed without the testing bar or the what-accompanies-a-change rules. Those are exactly what the layer reviewer grades a missing accompanying test against. The catch-all path is unaffected, because it reads every document. Every other layer's path is affected.
- **`business-parity-reviewer`.** It runs at branch level (`<state_dir>/business_parity_branch_reviews/<branch>_parity_review.md`), which is where the `CLAUDE.md` row "**Planning or reviewing at branch level** — the lessons ledger" sends it. Now it no longer reads the ledger. `plugin/agents/skeptic-reviewer.md` → `## Read first` still treats ledger entries as "routine checks for the earlier reviewers" and puts them out of its own scope. So a ledger entry that touches parity is now checked by neither reviewer.

The other seven recipients keep the sentence. Each one's definition already states the narrowing: `test-fix-plan-writer` says "Never read all of them up front"; `user-review-fix-plan-writer` says "You do NOT preload the full context set"; `conventions-writer` says "You never open a conventions document to resolve a value of your own"; `conventions-reviewer` says "read only the members the dispatch sends"; `statistics-plan-writer` says "You do NOT read the conventions documents"; and both UI-test agents say "you do not need every layer's conventions document in depth". The sentence settles a real conflict for those seven, so this finding does not touch them.

**Fix.** Delete the precedence sentence, together with the blank line that separates it from the next paragraph, in exactly three files. Change nothing else:

- `plugin/agents/layer-implementer.md`
- `plugin/agents/layer-reviewer.md`
- `plugin/agents/business-parity-reviewer.md`

The line to delete, verbatim:

```
Where the auto-loaded `CLAUDE.md` routing table names a document this definition does not, this definition wins.
```

Each file loses words, so no agent's up-front figure rises. Leave the story plan as it is: it is a point-in-time artifact.

- [ ] Delete the line, and one of the blank lines around it, in the three files above.
- [ ] Verify: `git grep -l -F -e 'this definition wins.' -- plugin/agents` lists exactly these seven files: `conventions-reviewer.md`, `conventions-writer.md`, `statistics-plan-writer.md`, `test-fix-plan-writer.md`, `ui-tests-plan-reviewer.md`, `ui-tests-plan-writer.md` and `user-review-fix-plan-writer.md`.

No test run is involved. This is a prose edit to agent definitions, and the Run gates phase covers the tree.
