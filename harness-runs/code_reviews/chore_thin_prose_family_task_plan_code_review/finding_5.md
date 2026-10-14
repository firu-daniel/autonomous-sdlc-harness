### 5. Restore the committing-role clause in the writer's readiness lead-paragraph rule

**Severity:** Nice to Have

**Site:** `plugin/agents/task-plan-writer.md` → `## Process` step 7 → (a), the bullet *"The section's lead paragraph states that this list is the **single source of truth** for the implementation loop; …"*.

**Problem.** Task 3's plan said to keep this bullet's three statements. The thinning trimmed two clauses that sibling definitions carry in the same words:
- **The supervised-flow clause.** The baseline read *"the orchestrator itself in the supervised flow, which dispatches none"*. `plugin/agents/layer-implementer.md` still carries that exact clause, and the writer now ends at *"in the supervised flow"*.
- **The checkbox clause.** The baseline closed the informational-markers statement with *"— the committer never touches them"*. `plugin/agents/user-review-fix-plan-writer.md` still does.

No consumer decision turns on either clause, because the meaning survives. Restoring them only re-aligns the wording with the sibling copies.

**Fix.**

- [ ] In that bullet, replace *"the orchestrator itself in the supervised flow — so no implementer changes a marker"* with:

  ```markdown
  the orchestrator itself in the supervised flow, which dispatches none — so no implementer changes a marker
  ```

- [ ] In the same bullet, replace *"are informational only."* at its end with:

  ```markdown
  are informational only — the committer never touches them.
  ```

**Verification.**
- `grep -c -F 'in the supervised flow, which dispatches none' plugin/agents/task-plan-writer.md` is non-zero.
- `grep -c -F 'the committer never touches them' plugin/agents/task-plan-writer.md` is non-zero.
