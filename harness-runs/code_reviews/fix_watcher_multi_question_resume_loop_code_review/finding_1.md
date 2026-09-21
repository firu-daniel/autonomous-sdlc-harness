### 1. The watcher's resume-clause comment claims Override 2(a) quotes the clause, which nothing does, and it puts the `Override 2(a)` label into the watcher

**File:** `cli/templates/scripts/autonomous-watcher.sh` (`spawn_engine`), "The clause's wording is quoted by the engine's Override 2(a); change both together." The same line is in this repository's mirror, `scripts/autonomous-watcher.sh` (`spawn_engine`). The two files must stay byte-identical.

**Problem.** Task 1 added this sentence to the comment above `local resume_clause=""`:

```
  # only after this run exits — the consume-then-archive contract). The clause's
  # wording is quoted by the engine's Override 2(a); change both together.
```

Two things are wrong with it:

1. **The quote it points at does not exist.** `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 2 — resumability` case (a) says "every such pair, which are the ones the resume prompt names". It quotes none of the clause text. A grep for `This is a RESUME`, `consume ALL` or `every question file of this park` over `plugin`, `cli/src` and `docs` finds nothing. A maintainer who changes the clause is told to make a matching edit to a quote that is not there.
2. **It falsifies a stated invariant in the plugin's mode contract.** `plugin/instructions/mode_contract.md` → `### Sanctioned cross-fork anchors` → Class (i) → *Reason* says that `grep -in "override 2"` over the shipped tree "returns hits only under `plugin/instructions/` and `plugin/commands/`, and **none** in `<scripts_dir>/autonomous-watcher.sh`, which never uses the label at all. So no move here is watcher-gated." On `dev` that grep finds nothing in `cli/templates`, `scripts` or `docs`. On this branch it finds exactly this comment, in both copies. A future relocation of Override 2 re-derives its citers by grep, as that section requires. It would find a shipped adopter template telling it to "change both together", which contradicts the contract's finding that the move is not watcher-gated.

The consume-then-archive explanation before the sentence is correct and enough on its own. The engine keys on the answer files the clause names, not on the clause's wording.

**Fix.** Delete the last sentence and close the comment after "contract).". Make the same edit in both files so they stay byte-identical. The block becomes:

```
  # On a RESUME, name every top-level answer file the watcher just unblocked so
  # the engine consumes all of them (the planning fork detects the resume from
  # those top-level answer_<n>.md files; the watcher archives exactly that set
  # only after this run exits — the consume-then-archive contract).
  local resume_clause=""
```

- [ ] Edit `cli/templates/scripts/autonomous-watcher.sh`.
- [ ] Apply the identical edit to `scripts/autonomous-watcher.sh`.
- [ ] Confirm that `cmp scripts/autonomous-watcher.sh cli/templates/scripts/autonomous-watcher.sh` prints nothing and `grep -rin "override 2" cli/templates scripts docs` prints nothing.
