# Task plan review — iteration 2

## Must Fix

1. **Scope register: derivation entry 1 misses a site that Task 4 makes false** — fix in the story index (`chore_remove_legacy_worktree_arm_story_plan.md`) → `## Scope register`, and in `task_9_plan.md`.
   `docs/outer-loop-verification.md` opens with this paragraph: *"These are the only shipped assets that mutate a repository — `git commit`, `git push`, `git worktree remove`, `git branch -D`, `kill` — so a claim about them that nothing re-runs is exactly the shape that regresses silently."* Today the only shipped call to `git worktree remove` is the sweep's legacy arm (`cli/templates/scripts/cleanup-merged-worktrees.sh`, the `elif` arm running `git -C "$main_repo" worktree remove --force "$wt"`). Task 4 removes that arm, so after this branch the paragraph names a worktree-removal operation that no shipped asset performs. That is a document still describing the worktree arm as shipping, which the scope predicate rules out (*"The documents above no longer describe a worktree arm that ships."*). Derivation entry 1's pattern never reaches this sentence: its only hit in the file is the `Owed a re-drive on the clone layout.` paragraph (row 12). No row covers it, and Task 9's `**Work:**` touches only that later paragraph in this file.
   Widening entry 1 with the alternative `worktree remove` makes it reach exactly one new site, this one. Its other new hit is `docs/watcher.md` → the `cleanup-merged-worktrees.sh: removing the copy` row, which is already row 19. I re-ran the widened command below. It printed every existing row's site plus `docs/outer-loop-verification.md` at the opening "only shipped assets that mutate a repository" sentence, and nothing else.
   **Fix:**
   - Story index, `## Scope register`: replace derivation entry 1's command with this strictly wider one, and update its exclusion paragraph if needed:
     ```
     git grep -n -i -E 'legacy (linked )?worktree|worktree run|legacy run|no worktree run is left|both layouts|run started before clones|worktree arm|worktree remove' -- ':!harness-runs' ':!cli/templates/scripts' ':!cli/src' ':!cli/test' ':!scripts' ':!githooks'
     ```
   - Story index, `## Scope register`: add a row for `docs/outer-loop-verification.md` → the opening paragraph *"These are the only shipped assets that mutate a repository — … `git worktree remove` …"*. Evidence: `entry 1, worktree remove`. Disposition: `change`. Owner: Task 9 — drop `git worktree remove` from the list, because no shipped asset runs it once the sweep's worktree arm is gone. Optionally add a note that it did until `chore_remove_legacy_worktree_arm`. The rows' dated cells stay.
   - `task_9_plan.md`: add the change to the existing `docs/outer-loop-verification.md` `**Work:**` bullet so the bullet count stays at 4. Add a `**Verification:**` check that `grep -n 'worktree remove' docs/outer-loop-verification.md` prints no line saying a shipped asset runs it.

## Should Fix

_None._

## Nice to Have

_None._
