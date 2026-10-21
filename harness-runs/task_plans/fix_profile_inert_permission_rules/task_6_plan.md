### Task 6 — The pause step names the `Edit` rule that grants its file writes

**Goal:** `plugin/instructions/autonomous_pause_and_ledger.md` tells an agent that writing `PAUSE_PROGRESS.md` with the `Write` tool is allowed because *"`Write(/<worktree_glob>/**)` … is on the profile"*. After Task 3 no such rule exists. The grant is `Edit(/<worktree_glob>/**)`, which covers the `Write` tool. This task corrects the two places that say otherwise, so an agent reading the instruction is not sent looking for a rule that is gone.

**Depends on:** Task 3. That task removes `Write(/{{worktreeGlob}}/**)` and keeps `Edit(/{{worktreeGlob}}/**)` and `Read(/{{worktreeGlob}}/**)` in the generated profile's `permissions.allow`.

### Targets

- `plugin/instructions/autonomous_pause_and_ledger.md`: the `## Resolved values` row for `<worktree_glob>`, and §2.2's clean-tracked sub-step (a).

**Work:**

- [ ] `## Resolved values` → `<worktree_glob>` row: the worked rule *"`Write(/<worktree_glob>/**)`, two slashes in the rendered rule, never three"* becomes `Edit(/<worktree_glob>/**)`. Keep the cell's pointer to §2.2 sub-step (a) and every other word byte-identical. The token name and the table shape are wires.
- [ ] §2.2 sub-step (a): *"`Write(/<worktree_glob>/**)` and `Bash(echo:*)` are on the profile"* becomes `Edit(/<worktree_glob>/**)` (which covers the `Write` tool) and `Bash(echo:*)`. *"for `Read`, `Edit` and `Write` alike"* becomes *"for `Read` and `Edit` alike — a `Write` path rule is never consulted"*. Keep the slash-count explanation and the instruction to use the `Write` tool or `echo >>` unchanged.

**Verification:**

- Run `grep -n 'Write(' plugin/instructions/autonomous_pause_and_ledger.md`. It returns nothing.
- Run `grep -rn 'Write(/<worktree_glob>' plugin/`. It returns nothing, so no other plugin file quotes the old rule (the wire-rename sweep, `.claude/context/plugin.md` → `## Verifying a change in this layer`).
- The `## Resolved values` table still has its three columns and the `<worktree_glob>` token spelled byte-identically. Check it by reading the row, not by running a gate. The manifest gate runs once in the closing `commands.test`.
