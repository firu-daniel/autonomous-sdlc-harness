### 2. `layer-implementer` forked the harness-doctrine sentence that closes `## Minimal prose`

**File:** `plugin/agents/layer-implementer.md` (`## Minimal prose — every line carries a rule`, last paragraph), "This rule binds whether or not the adopter's rules document"

**Problem.** On `dev`, `## Minimal prose — every line carries a rule` closed with this sentence:

> This rule is stated here because it is harness doctrine rather than a project convention; where the adopter's own rules document restates it (the file `layers[].conventions` names), nothing above depends on that restatement.

Two other agents carry the same sentence, differing only in its first two words ("The rubric" for "This rule"). In both it sits in the **Your own checklist is not downgradable.** paragraph:
- `branch-reviewer.md`
- `skeptic-reviewer.md`

Two more carry its clauses with a different ending:
- `ui-tests-plan-reviewer.md` ("… nothing here depends on that restatement, and …")
- `task-plan-writer.md` (inside a longer sentence)

Task 3 rewrote `layer-implementer`'s copy as:

> This rule binds whether or not the adopter's rules document (the file `layers[].conventions` names) restates it.

**Proof.**
- `git grep -l -F "nothing above depends on that restatement" dev -- plugin/agents` lists `branch-reviewer.md`, `layer-implementer.md`, `skeptic-reviewer.md` and `task-plan-writer.md`. Against `HEAD` it lists the same files without `layer-implementer.md`.
- `git grep -n -F "is stated here because it is harness doctrine rather than a project convention; where the adopter's own rules document restates it" -- plugin/agents` shows the surviving copies in `branch-reviewer.md`, `skeptic-reviewer.md` and `ui-tests-plan-reviewer.md`, and no longer in `layer-implementer.md`.

**Why it is wrong.** `.claude/context/plugin.md` → `## Writing agent prose` → **Each rule is stated once.**: "A block several agents carry is one wording, copied byte-for-byte into every copy; where copies differ only in a word, keep the difference and nothing else." The copies here differ only in their subject words, so the rule binds this sentence. The story index's `## Context`, point (2), forbids the same drift.

The `## Scope register` has no row for this sentence. Row 87 covers a different sentence: the line-coordinate paragraph in `## Scope`, which still reads "This rule is harness doctrine and is stated here in full rather than cited; …". The D3 rule keeps a piece only when it is found **verbatim** outside the family, so a copy differing only in its subject words escaped it. The code review's Findings 4 and 5 fixed two copies of this same class. This one is not among them. A later sweep that greps the doctrine sentence to update every copy will now miss `layer-implementer`.

**Fix.** In `plugin/agents/layer-implementer.md`, at the end of `## Minimal prose — every line carries a rule`, replace

```markdown
This rule binds whether or not the adopter's rules document (the file `layers[].conventions` names) restates it.
```

with the `dev` wording:

```markdown
This rule is stated here because it is harness doctrine rather than a project convention; where the adopter's own rules document restates it (the file `layers[].conventions` names), nothing above depends on that restatement.
```

Edit nothing else. In particular, leave the `## Scope` paragraph's "This rule is harness doctrine and is stated here in full rather than cited; …" unchanged, because it is a separate cross-family copy (register row 87). The edit adds about ten words. `layer-implementer` stays far below its `Before` figure of 6246 in the story index's `## Up-front word counts`. Do not edit the story index.

- [ ] Make the replacement above.
- [ ] Re-run `git grep -l -F "nothing above depends on that restatement" -- plugin/agents`. It must list `layer-implementer.md` again, alongside `branch-reviewer.md`, `skeptic-reviewer.md` and `task-plan-writer.md`.

The fix runs no test.
