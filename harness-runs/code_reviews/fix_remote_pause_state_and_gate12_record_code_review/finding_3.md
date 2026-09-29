### 3. `branch-resume`'s expired-bundle report says the planning writer starts again even for a run that had finished planning

**File:** `plugin/commands/branch-resume.md` → `## Steps` step 3, the `pause_reason: expired` bullet — "so the resumed run's planning writer starts again from the committed ledger."

Task 4 extended the report so it names the lost planning drafts. That part is correct. The clause it adds after them is not conditional: "any planning drafts not yet committed that it carried are lost, so the resumed run's planning writer starts again from the committed ledger." Only a run that expired **mid-planning** has uncommitted drafts. Once P1/P3 converge, `plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Override 4` commits the planning family, the bundle's copies are only duplicates of tracked files, and the resumed run carries on from the ledger with no writer dispatch. **Who gets it wrong:** an operator resuming an expired run that was already implementing. The command tells them their plan will be re-written, which does not happen.

`docs/remote-execution.md` → `## 4.` → **The bundle expires.** already words the same point conditionally: "a planning phase whose drafts were lost runs its writer again from the committed ledger". The command should match it.

**Fix:** in that bullet, replace

```
     stall counts, its clarification history and any planning drafts not yet committed that it carried are
     lost, so the resumed run's planning writer starts again from the committed ledger.
```

with

```
     stall counts, its clarification history and any planning drafts not yet committed that it carried are
     lost; a run that was still planning runs its planning writer again from the committed ledger.
```

Keep the bullet's other lines and its indentation as they are. This is a single prose edit to a command. It runs no test.
