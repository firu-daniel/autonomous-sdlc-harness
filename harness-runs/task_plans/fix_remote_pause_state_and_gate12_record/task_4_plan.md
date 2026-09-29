### Task 4 — Name the lost planning drafts in `branch-resume`'s expired-bundle report

**Goal:** When `/autonomous-sdlc-harness:branch-resume` meets a remote record synced as `paused` with `pause_reason: expired`, it tells the user what the expired bundle took with it. From Task 1 on, a bundle also carries the untracked planning drafts, so that report must name them. Otherwise an expired mid-planning run re-runs its writer with nobody told why (`harness-runs/lessons.md` → *"State held only in an expiring store must be reported plainly as expired, and never treated as absent or as a fresh start."*).

**Depends on:** Tasks 1 and 2.

- Task 1 makes the bundle carry the untracked planning drafts at `planning/<path under state_dir>`: the story index, the per-task directory, the UI-test plan and the four plan-review findings folders.
- Task 2 makes `remote-run.sh restore` warn, for an expired bundle, that *"the park-loop, auto-resume and stall counts, the clarification history and any planning drafts not yet committed that it carried are lost"*.

This task brings the command's own sentence into line with that wording. It changes no script.

### Targets

- `plugin/commands/branch-resume.md` → step 3, the bullet opening *"**Remote record** synced as `paused` with `pause_reason: expired`"*.

**Work:**

- [ ] Extend that bullet's closing clause. It currently reads *"say that its carried park-loop, auto-resume and stall counts and its clarification history are lost"*. It should also name **any planning draft it carried that had not yet been committed**, and say that the resumed run's planning writer therefore starts again from the committed ledger. Change nothing else in the file: no frontmatter key, no step number, no other bullet. Use no literal adopter value; the file already speaks in `<state_dir>` / `<branch>` placeholders.

**Verification:**

- `grep -rn "clarification history" plugin/` reaches this bullet with the drafts named beside it, and reaches no other plugin file that enumerates what an expired bundle loses. If one does, name it in the task's return as a deviation rather than editing it here.
- The file's frontmatter (`description:`, `argument-hint:`) is byte-identical to before. The command body still carries its `## Resolved values` table unchanged.
- The wording agrees with `remote-run.sh`'s `::warning::` text as Task 2 states it above, and with `docs/remote-execution.md` → **The bundle expires.** as Task 5 rewrites it. All three name the same four losses.
