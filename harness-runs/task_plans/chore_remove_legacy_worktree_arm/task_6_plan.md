### Task 6 — Reword the legacy-worktree-run prose in `cli/src` comments and the autonomous profile template

**Goal:** the CLI's own doc comments and the `_README` line of the shipped autonomous profile stop describing a legacy worktree run as something that exists, and describe a linked worktree as a checkout a person made by hand.

**Depends on:** Task 1 (the run-copy check refuses a linked worktree) and Task 2 (the watcher has no `worktree` copy kind). Prose only; no behaviour changes.

**Where this task stops.** Doc comments and one JSON string; no executable TypeScript and no profile entry changes. The rendered `examples/notes-app/.claude/settings.autonomous.json` is Task 10's; this repository's own `.claude/settings.autonomous.json` is re-rendered by hand after merge (story `## Context` → **Manual setup required** 1).

### Targets

- `cli/src/core/git.ts` — `worktreeList`'s doc comment (*"a legacy worktree run is listed there and nowhere else in git"*) and `repoRoot`'s (*"a worktree run must write into its own checkout"*).
- `cli/src/core/paths.ts` — `worktreeGlob`'s doc comment (*"skips a phase in a worktree run"*).
- `cli/src/doctor/checks.ts` — `WORKTREE_CHECK`'s doc comment (*"and a legacy worktree run, which is listed there and nowhere else in git"*).
- `cli/src/generators/writeProtection.ts` — the doc comment *"A legacy worktree run's record lies under it too; …"*.
- `cli/templates/claude/settings.autonomous.json` — the `_README` string opening *"FOUR COMMANDS RUN OUTSIDE THE SANDBOX, EACH IN ONE SPELLING"*.

**Work:**

- [ ] `git.ts` and `checks.ts`: drop the legacy-run clause; `git worktree list` is read for the one-live-copy rule and sync-in, which refuse a branch any checkout git lists — the main checkout or a linked worktree a person made — has checked out. `git.ts` `repoRoot`: *"a worktree run"* becomes a session in a linked worktree or a run copy. `paths.ts`: the glob matches sibling run copies (clones); reword *"a worktree run"* to a run copy.
- [ ] `writeProtection.ts`: the sentence becomes the record of a linked worktree a person made by hand, keeping the G2 citation and the conclusion that its commits go through the excluded `commit-on-branch.sh`.
- [ ] `settings.autonomous.json`: in the `_README` string, *"in a legacy worktree run, it cannot write the linked worktree's record (measured … rows G1 and G2)"* becomes *"in a linked worktree a person made by hand, it cannot write that worktree's record"* with the same measurement citation. Change no other byte of the file; keep it valid JSON and every `{{token}}` as it is.

**Verification:**

- `git diff -- cli/src` changes only lines inside `/** … */` or `//` comments.
- `git grep -n -i -E 'legacy (linked )?worktree|worktree run' -- cli/src cli/templates/claude` prints nothing.
- `git diff -- cli/templates/claude/settings.autonomous.json` shows exactly one changed line, inside the `_README` array.
- **Deviations from plan:** The plan's two `cli/src` verifications conflict. `cli/src/doctor/checks.ts` → `WORKTREE_CHECK` also carried the legacy-run clause in its two `warn`/`pass` message template literals (*"; a legacy worktree run is not listed either"*, *", and any legacy worktree run is among them"*), which the Targets list omitted. The task's Goal and the `git grep` check take priority, so those two trailing clauses were dropped. As a result `git diff -- cli/src` also changes two message-string lines. Only the text of the doctor output changes, not its logic or grading. `git grep -n -E "worktree list (did not answer|answers with)" -- cli/test plugin docs` found no test asserting on either message.
