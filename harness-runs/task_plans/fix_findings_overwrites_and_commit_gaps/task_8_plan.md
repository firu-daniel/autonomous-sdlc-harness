### Task 8 — Rewrite `layer-reviewer`'s description to its real dispatch sites

**Goal:** Fix defect 9. `plugin/agents/layer-reviewer.md`'s frontmatter `description:` ends "Invoked by the implement → review → commit unit loop (supervised, semi-autonomous and autonomous flows) — not for ad-hoc chats." That is wrong on two counts, and the description is also the text shown in the agent list:

- no supervised flow dispatches it (`plugin/instructions/plan_orchestration_instructions.md` opens: "no phases, no safety contract, no reviewer agents");
- it runs in the autonomous **user-review** flow but not the autonomous **plan** flow, which binds `<per_unit_review>` **`off`** (`plugin/instructions/plan_orchestration_instructions_autonomous.md` → `## Override F — per-unit review off`).

**Depends on:** Task 7, which edits the `iteration` row of the same file. This task touches the `description:` line only.

**The real dispatch sites**, verified from the binding tables:

- `layer-reviewer` is dispatched only by `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `### Per-unit review step`, which runs only where a fork binds `<per_unit_review>` **`on`**;
- `on`: `plan_orchestration_instructions_semi_autonomous.md`, `user_review_fixes_instructions_semi_autonomous.md` and `user_review_fixes_instructions_autonomous.md`;
- `off`: `plan_orchestration_instructions_autonomous.md`;
- the supervised item loops (`plan_orchestration_instructions.md`, and `user_review_fixes_instructions.md`, which runs it) dispatch no reviewer at all.

### Targets

- `plugin/agents/layer-reviewer.md` (frontmatter `description:` only)

**Work:**

- [ ] Replace the parenthesis "(supervised, semi-autonomous and autonomous flows)" with the real sites: the unit loop's per-unit review step, wherever per-unit review is on, which is the semi-autonomous plan and user-review flows and the autonomous user-review flow; never the autonomous plan flow or a supervised flow. Keep the rest of the description: what it reviews, that the layer arrives as a dispatch argument, read-only, PASS/FAIL, not for ad-hoc chats. Write it for selection, per `.claude/context/plugin.md` → `## Frontmatter`: what the agent does, read-only or not, who dispatches it, the gate it runs under.

**Verification:**

- `git grep -n 'supervised, semi-autonomous and autonomous flows' -- plugin/agents/layer-reviewer.md` returns nothing. The frontmatter still has exactly the keys `name`, `description`, `tools`, `model`, and `description:` stays a single line.
- `git grep -n -E 'per_unit_review>. [|] [*][*]' -- plugin/instructions` lists each fork's binding row (plus the user-review core's "Consumed by" row, which binds nothing). Every fork binding `on` is named by the new description, and the one binding `off` is excluded by it.
- `plugin/agents/layer-implementer.md`'s description, which also says "supervised, semi-autonomous and autonomous flows", is **not** edited: the supervised item loop does dispatch the implementer (`plan_orchestration_instructions.md` step 1's specialist table).
