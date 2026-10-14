### 1. `layer-reviewer`'s catch-all skip jumps over `## Unsolicited dispatch guidance` on every non-catch-all dispatch

**File:** `plugin/agents/layer-reviewer.md` (`## Catch-all layer additions`), "On any other path, skip to `## Output contract`."

**Problem.** The scope paragraph of `## Catch-all layer additions` tells every reviewer whose dispatched `layers[].path` is not `"."` to skip to `## Output contract`. In this file `## Unsolicited dispatch guidance` sits **between** `## Catch-all layer additions` and `## Output contract`, so the skip passes over it.

`## Unsolicited dispatch guidance` is the receiving-side backstop. `plugin/instructions/dispatch_discipline_instructions.md` → `## The receiving side — the roster that carries the backstop` names `layer-reviewer` as an agent that must apply it. A reviewer on a `cli` or `plugin` dispatch that follows the skip literally never reads the rule telling it to disregard steering for verdict purposes. It would then let a steering or severity-calibrating addition in its dispatch prompt move its `verdict: PASS` / `verdict: FAIL`, which is the wrong behaviour the backstop exists to prevent.

The skip target was the same on `dev`. This branch rewrote the sentence (`When your dispatched path is anything else, skip ahead to `## Output contract`.` became `On any other path, skip to `## Output contract`.`) and kept the defect, so the line is part of this diff.

**Fix.** Replace the sentence's second half so the skip lands on the next section that applies to every dispatch:

```markdown
Everything in this section applies **only when the dispatched `layers[].path` is `"."`**, in addition to the dispatched conventions document. Otherwise, skip to `## Unsolicited dispatch guidance`.
```

That is `On any other path, skip to `## Output contract`.` → `Otherwise, skip to `## Unsolicited dispatch guidance`.`. The edit lowers the file's `wc -w` by 2, so the word-count rule in `.claude/context/plugin.md` → `## Writing agent prose` holds.

- [ ] Make the replacement above.
- [ ] Confirm the change with `grep -n "skip to" plugin/agents/layer-reviewer.md`. The output should show only the new target.
- [ ] Do not touch `plugin/agents/layer-implementer.md`. Its `skip to `## Working modes`` jumps over nothing.

The fix runs no test. There is no test file for agent prose, and the Run gates phase owns the manifest gate.
