### 2. Two shipped-template comments still cite `docs/cli.md` §6 for residual content that moved, and one of them is a hit from §7's own recorded search that the record leaves out

**Files:**
- `cli/templates/scripts/autonomous-watcher.sh`, the header comment of `effective_max_parallel_runs`: "runs of one repository share the main checkout's sandbox placeholders" / "(docs/cli.md §6). Job mode runs one run and is never clamped."
- `cli/templates/scripts/push-branch.sh`, the comment that opens "The watcher family's own git calls in a run's copy no longer go through this" and ends "THE WATCHER FAMILY'S GIT IN A RUN'S COPY; `docs/cli.md` §6)."

**Problem.** Both comments cite `docs/cli.md` §6 for content that Task 5 moved into `docs/sandbox-record.md` → `## 6. The residuals`:

- **The watcher comment.** It explains the clamp: concurrent runs share the main checkout's sandbox placeholders. That is residual 12's **What can run.** point. The record's own §7 bullet *"The watcher's clamp log lines still cite `docs/cli.md §6` for residual 12's content"* names its search: `git grep -nF "cli.md §6)" -- cli/templates/scripts`. That search hits this comment line as well as the two log lines. The bullet and roadmap item 32 (`docs/development.md` → `## 6. The roadmap this tree defers to`) name only the two log lines. The bullet keeps them unchanged because they are runtime output, and that reason does not apply to a comment. So when item 32 is carried out, this comment is left citing `docs/cli.md` §6.
- **The push-branch comment.** It cites `docs/cli.md` §6 for the watcher family's own git calls in a run's copy: no hook, never the record's `config.worktree`, and refusing a tree that changes a protected path. That statement was the opening of residual 1. `grep -c "watcher family" docs/cli.md` now returns `0`, while `docs/sandbox-record.md` residual 1 opens with it.

Both sections still exist, and the pointer paragraph routes a reader on, so neither citation is broken. But neither section holds the statement the comment cites any more. Task 1 repointed the cli layer's numbered citations in these same template trees but did not reach these two, because neither carries a residual number.

**Fix.** Use the short citation form the story plan fixes for shell comments, `docs/sandbox-record.md residual N`, and change nothing else on either line.

1. In `cli/templates/scripts/autonomous-watcher.sh`, in the comment above `effective_max_parallel_runs`, replace `# (docs/cli.md §6). Job mode runs one run and is never clamped.` with:

   ```
   # (docs/sandbox-record.md residual 12). Job mode runs one run and is never
   # clamped.
   ```

2. In `cli/templates/scripts/push-branch.sh`, replace `# THE WATCHER FAMILY'S GIT IN A RUN'S COPY; \`docs/cli.md\` §6).` with:

   ```
   # THE WATCHER FAMILY'S GIT IN A RUN'S COPY; `docs/sandbox-record.md`
   # residual 1).
   ```

Do not edit the self-adopted copies under `scripts/`. Per the story plan's **Manual setup required**, they follow at the post-merge re-render. Do not touch the two clamp log lines either, which stay roadmap item 32's.

This fix runs no test: no test under `cli/test/` asserts on either comment.
