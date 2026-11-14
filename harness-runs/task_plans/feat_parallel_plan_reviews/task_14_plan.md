### Task 14 — Restate the semi-autonomous task-plan fork and the two entry commands that order the gates

**Goal:** Remove the three remaining statements outside the cores that a plan-review gate runs before another — in the semi-autonomous fork and in the two command files a user reads before starting a plan loop — and carry the walker's held binding into the semi-autonomous `<escalate>` value.

**Depends on:** Task 12, whose core sends a round's gates as one set in one message and passes a gate's `error:` / `blocker:` to the walker, which holds it until the set is in and then prints `binding: <escalate>` with one `held: <gate> <error|blocker>` line per held gate.

**Where this task stops.** Each edit is a sentence; no binding table row changes its meaning beyond the held-binding clause, no heading moves, and no step is renumbered. The fix-plan command's sentence describes what its loop does and states no rule: the rule — both gates dispatched together once step 6 has cleared, the round closed at the join — is the fix-plan core's, restated by **Task 15**, and this sentence must agree with the story index's `## Context` paragraph on that loop.

### Targets

- `plugin/instructions/task_plan_writing_instructions_semi_autonomous.md` → the `<escalate>` row, `## What this fork does NOT redefine` (the `## Loop` bullet).
- `plugin/commands/branch-start-plan-semi-autonomous.md` (the paragraph opening *"A fourth agent, `business-parity-reviewer`"*).
- `plugin/commands/branch-start-user-review-fix-plan.md` (the paragraph opening *"This is a **separate supervised flow**"*).

**Work:**

- [ ] Semi-autonomous fork: in the `<escalate>` row's parenthesis, *"an agent returning `error:` / `blocker:`, report the blocker alone"* gains: for a plan gate, every blocker the walker's `held:` lines name. The `## Loop` bullet's *"(`task-plan-writer`, the business-parity gate, the architecture gate, `task-plan-reviewer`, the verdict parse)"* becomes the writer, the round's three gates dispatched as one set, and the verdict parse.
- [ ] `branch-start-plan-semi-autonomous.md`: *"and it runs **ahead of** the architecture gate"* becomes: and it reviews each round's draft at the same time as the architecture gate and the plan review.
- [ ] `branch-start-user-review-fix-plan.md`: *"the flow runs a `business-parity-reviewer` gate (plan-review mode) over the drafted fixes — … — then an `architecture-reviewer` gate (plan-review mode) over it — …"* becomes both gates run together over the drafted fixes in each round, each keeping its own catch clause, still *"looping back to the `user-review-fix-plan-writer` on FAIL until both gates PASS"*.

**Verification:**

- `grep -n "ahead of\*\* the architecture" plugin/commands/branch-start-plan-semi-autonomous.md` and `grep -n "then an \`architecture-reviewer\` gate" plugin/commands/branch-start-user-review-fix-plan.md` find nothing.
- `grep -n "held:" plugin/instructions/task_plan_writing_instructions_semi_autonomous.md` shows the `<escalate>` row.
- Both command files' frontmatter is byte-identical (`git diff` shows no change above the closing `---`).
