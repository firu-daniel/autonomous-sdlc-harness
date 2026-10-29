### 4. The worked example's owed re-render (Task 12) is missing from the story's `## Manual setup required`, so nothing before merge says it is still owed

**File:** `harness-runs/story_plans/fix_clone_main_repo_resolution_story_plan.md` → `## Context` → **Manual setup required:** — "Re-render this repository's root `.claude/CLAUDE.md` fence section"

Goal 5 of the task prompt requires that `examples/notes-app/.claude/` be re-rendered from the changed templates. `.claude/context/conventions.md` → `## Documents of record` says that the files `init` rendered into the example, `.claude/settings.autonomous.json` among them, are **live** and are re-rendered whenever a token-carrying `cli/templates/` file changes.

Task 12 did not do this. The tool layer refused every `Edit` under `examples/notes-app/.claude/**`, as recorded in `harness-runs/task_plans/fix_clone_main_repo_resolution/task_12_plan.md` → `## Disposition`, items (a)–(c). Its readiness entry was nevertheless flipped to `[x]`. On this branch tip, three files still carry the pre-branch text:

- `examples/notes-app/.claude/CLAUDE.md`, item 4: "the **main worktree's** root".
- `examples/notes-app/.claude/harness-task-offer.md`: `git worktree list | head -1 | awk '{print $1}'`.
- `examples/notes-app/.claude/settings.autonomous.json`, the `_README` line: "fall back to the first git worktree list entry when it prints nothing".

The story's **Manual setup required:** list names the root `.claude/` re-render and the AN5–AN6 hand run, but not this. A maintainer working from that list before merge would merge with the example's live files out of step with the templates.

**Fix:** in `harness-runs/story_plans/fix_clone_main_repo_resolution_story_plan.md` → `## Context` → **Manual setup required:**, add this bullet directly after the bullet that begins `- **Re-render this repository's root \`.claude/CLAUDE.md\` fence section`:

```markdown
- **Apply the worked example's re-render that Task 12 could not write.** `examples/notes-app/.claude/CLAUDE.md` item 4, `examples/notes-app/.claude/harness-task-offer.md` and the `THE MAIN CHECKOUT IS READ FROM ONE ENVIRONMENT VARIABLE` `_README` line of `examples/notes-app/.claude/settings.autonomous.json` still carry the pre-branch text, because the tool layer refused every agent `Edit` under `examples/notes-app/.claude/**`. Run the paste in `harness-runs/task_plans/fix_clone_main_repo_resolution/task_12_plan.md` → `## Disposition`, item (d), from the checkout root in a session that may write there, and confirm the transcription as that item directs. Do this on the branch before merge.
```

Edit nothing in that file's `## Phase 2 Readiness — Ordered Fix List`.
