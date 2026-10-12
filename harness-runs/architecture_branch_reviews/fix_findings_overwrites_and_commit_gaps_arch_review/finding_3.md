### 3. Qualify the supervised QA flow's teardown halt list to the unmarked `qa-tester` `error:`

**Severity:** Should Fix
**Layer:** plugin

**Site.** `plugin/instructions/qa_test_instructions.md`, the dev-server ownership paragraph opening *"You own this server. **You tear it down in step 5**"*. The stale clause is:

> … on any halt (server-start failure, qa-tester `error:`, user abort).

**Problem.** This file's `### 3.` and `### 4.` were updated by this branch to treat the per-test line `error: blocked — test <T>: <one-line cause>` as a continue-and-report outcome, never a halt. They discriminate on that literal prefix alone. The teardown paragraph still lists a bare `qa-tester` `error:` as a halt. A reader taking that example literally would tear the dev server down on a blocked test, while step 3 is still dispatching the remaining tests.

The rule this follows is the same as Finding 2: every quoting site of a changed return wire changes together (`.claude/context/conventions.md` → `### The order files are created, so a half-built feature is still coherent`; `.claude/context/plugin.md` → `## Wires: dispatch in, return out`). This is graded Should Fix because the same file's steps 3–4 state the continue rule explicitly, which limits the risk.

**Fix.** Replace

> qa-tester `error:`

in that parenthetical with

> an unmarked qa-tester `error:` (the per-test `error: blocked — ` line is not a halt)

Leave the rest of the paragraph unchanged.
