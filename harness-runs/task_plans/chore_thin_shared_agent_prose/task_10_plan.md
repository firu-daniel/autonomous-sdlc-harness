### Task 10 — Add the read-list precedence sentence to the ten agents whose read list is narrower than the `CLAUDE.md` routing table

**Goal:** Settle the conflict between the generated `CLAUDE.md` routing table — which sends every implementation, review or planning agent to the shared conventions document, and every branch-level planner or reviewer to the lessons ledger — and the agent definitions that deliberately read less, by adding one identical sentence to each such definition saying its own read list wins.

**Depends on:** Task 9, and through it Tasks 2–8. Each recipient's word count must stay at or below its figure at `b7ebf1f0`; the sentence adds 16 words, and the thinning those tasks landed in each recipient is what pays for them.

**Where this task stops.** The sentence goes into agent definitions only. Do **not** add it to `.claude/CLAUDE.md`, to its template `cli/templates/claude/CLAUDE.md`, or to `cli/src/generators/claudeContext.ts` — the task prompt bars all three, because not every agent needs it. Change nothing else in any recipient.

**The routing table it answers.** The generated `CLAUDE.md` → `## Context files (read on demand)` table has three kinds of row: **Any implementation, review or planning** → the shared cross-layer conventions document; one row per layer → that layer's document; **Planning or reviewing at branch level** → the lessons ledger. A definition is narrower when, for the work it does, it reads fewer of those documents than the rows route it to.

### Targets

The ten recipients, each with the reason it is narrower and where the sentence goes:

| Agent | Why its list is narrower than the table | Where the sentence goes |
|---|---|---|
| `plugin/agents/layer-implementer.md` | Reads only the dispatched layer's conventions document; the table adds the shared one for any implementation. | `## Read first`, as its own paragraph directly before "**A cited path you cannot read is a finding, not a fallback.**" |
| `plugin/agents/layer-reviewer.md` | Same, for review. | Same place. |
| `plugin/agents/test-fix-plan-writer.md` | Reads one layer's document, only when a fix reaches it — "Never read all of them up front". | `## Read on demand (no auto-loaded context)`, directly before "**A cited path you cannot read…**" |
| `plugin/agents/user-review-fix-plan-writer.md` | Same — "Never read all of them up front; that is the waste this section exists to avoid." | Same section, same place. |
| `plugin/agents/ui-tests-plan-writer.md` | Reads only the surface layer's document. | `## Read first`, directly before "**A cited path you cannot read…**" |
| `plugin/agents/ui-tests-plan-reviewer.md` | Same, for review. | Same place. |
| `plugin/agents/statistics-plan-writer.md` | "You do NOT read the conventions documents". | `## Read first`, directly before "**A cited path you cannot read…**" |
| `plugin/agents/business-parity-reviewer.md` | Reviews at branch level (implemented-solution mode) but its read list omits the lessons ledger the table's last row routes to. | `## Read first`, directly before "**A cited path you cannot read…**" |
| `plugin/agents/conventions-writer.md` | "You never open a conventions document to resolve a value of your own", with one read relaxation on a corpus fix. | `## Resolved values`, as its own paragraph directly after the one beginning "**No row above resolves from a conventions document.**" |
| `plugin/agents/conventions-reviewer.md` | On iteration 2 it reads "only the members the dispatch sends". | As its own paragraph directly after the one beginning "**On `iteration: 2`**, read only the members the dispatch sends". |

**Not recipients, and why** — recorded so the list is checkable rather than assumed:

- `architecture-reviewer`, `branch-reviewer`, `review-plan-reviewer`, `skeptic-reviewer`, `task-plan-writer`, `task-plan-reviewer` — each reads every conventions document and the lessons ledger, so nothing in the table is outside its list.
- `committer` — the generated `CLAUDE.md` itself already narrows it ("the committer reads exactly one section of one of them").
- `docs-writer`, `docs-reviewer` — name no read list narrower than the table and do no branch-level review.
- `qa-tester` — reads every conventions document and runs tests rather than planning or reviewing.
- `qa-tester-mobile-maestro`, `qa-tester-mobile-mcp` — stubs that read no plan and do no implementation, review or planning; they carry none of the thinned blocks, so the sentence would raise their word count.

**Work:**

- [ ] Insert exactly this sentence, as its own paragraph with one blank line on each side, at the place the table names in each of the ten recipients:

```markdown
Where the auto-loaded `CLAUDE.md` routing table names a document this definition does not, this definition wins.
```

- [ ] Check each recipient's word count against its figure at `b7ebf1f0` (the `Definition` column of the story index's `## Up-front word counts` table, reproduced here so this file stands alone): `layer-implementer` 6287, `layer-reviewer` 4043, `test-fix-plan-writer` 2411, `user-review-fix-plan-writer` 4095, `ui-tests-plan-writer` 5766, `ui-tests-plan-reviewer` 4530, `statistics-plan-writer` 2941, `business-parity-reviewer` 6158, `conventions-writer` 5108, `conventions-reviewer` 5893. If any recipient would exceed its figure, stop and report a blocker naming it rather than cutting other prose to make room — the cut would be outside this task's scope.

**Verification:**

- `git grep -l -F -e 'routing table names a document this definition does not, this definition wins.' -- plugin/agents` lists exactly the ten recipients, and `git grep -c` of the same string reports 1 in each.
- `git diff b7ebf1f0 -- .claude/CLAUDE.md cli/templates/claude/CLAUDE.md cli/src/generators/claudeContext.ts` is empty.
- `wc -w` on each of the ten recipients is at or below its figure in the list above.
- Each insertion sits where the table says: reading each recipient, the sentence is inside the named section, next to the named paragraph, and nowhere else.
