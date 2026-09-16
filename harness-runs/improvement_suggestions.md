# Improvement suggestions

**What this is.** A human-triaged checklist of the harness and workflow problems that runs actually hit, kept so a recurring defect is diagnosed from how often it recurs across runs rather than rediscovered from scratch each time. **No agent reads this file.** Unlike the lessons ledger beside it, whose rules bind planning and review work, these are maintenance items with no value to an agent implementing a change, so this ledger is on no agent's reading list.

**How entries arrive.** Each run writes exactly one intake file at `improvement_observations/<branch>.md`, once, at the end of the run; a human folds those intakes into this file. One intake file per branch is the design: a single shared append target across parallel runs is a reliable generator of merge conflicts, which is the cost this split avoids.

**This ledger is appended to and never rewritten.** A closed entry stays in place with its outcome appended rather than being deleted, and an entry is cross-referenced by quoting its problem statement rather than by position, because entries are inserted as intake is folded in. The file accumulates over the whole life of the project and is the only copy of that history.

**Entry shape.** One line per item plus its attribution line, in one of three states — `[ ]` open, `[x]` done, `[~]` won't do:

```markdown
- [ ] **[the problem, in one line]** — [the suggested direction, optional]
      _(observed by: [branch], [branch] · category: [category])_
```

**Categories.** A folded entry keeps the category its intake assigned it. The vocabulary is the intake module's rather than this file's, and is one of `tooling-gap`, `silent-failure`, `flow-efficiency`, `optimization`, `agent-contract`, `shared-state`, `convention`. What each one covers is defined in `${CLAUDE_PLUGIN_ROOT}/instructions/improvement_observations_instructions.md` → `## The entry format`, which is the definition of record: re-glossing the names here would give them a second owner to drift from.

---

## Resuming a paused run

_The entry below is a worked example, not an observation from this project — delete it, or replace it with the project's own first entry._

- [ ] **A phase's artifacts are regenerated from scratch after a resume, because the progress ledger is the only resume state** — commit each phase's artifacts as that phase finishes, so a resumed run finds them instead of redoing them
      _(observed by: feat/search_result_pagination · category: flow-efficiency)_

_[Add headings of your own as themes emerge — one per recurring theme — and file each entry under the heading it belongs to.]_

_Written by `autonomous-sdlc-harness init`, and yours from there on: a re-run never touches a ledger that already exists._
