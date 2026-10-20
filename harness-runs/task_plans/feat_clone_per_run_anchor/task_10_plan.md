### Task 10 — Move the six registry and inbox commands to the canonical clause, with "run copy" wording

**Goal:** Make each command that finds the run registry or the inbox under `<MAIN_REPO>` resolve the main checkout from the launcher's anchor first and from today's first `git worktree list` entry second, using the one canonical clause in place of every bare or piped `git worktree list` spelling. Move the commands' run's-own-copy prose to **run copy** in the same pass.

**Depends on:**

- **Task 1**, which allow-lists `Bash(printenv HARNESS_MAIN_REPO)`.
- **Task 3**, which exports the variable to every session the watcher launches.

These commands usually run in a supervised session in the main checkout, where the read prints nothing and the fallback answers exactly as today.

**The canonical clause, byte for byte as Tasks 9, 11 and 12 carry it:**

```
the path a bare `printenv HARNESS_MAIN_REPO` prints, else the first `worktree ` line of a bare `git worktree list --porcelain`
```

Each step 1 reads *"Resolve `<MAIN_REPO>` as "* followed by the clause, then its existing remainder (*"; the registry is …"*, *"Never hardcode the path."*, *"Inbox = …"*). The piped spelling `git worktree list --porcelain | head -1 | sed 's/^worktree //'` goes.

**The wording rule.** Prose that means the run's own copy says **run copy**: *"that run's **worktree** clarifications dir"*, *"resumes the same engine in the same worktree"*, *"a running run's **worktree**"*, *"a local run's worktree"*, *"the watcher reuses-or-recreates the worktree"*, *"creates the sibling worktree"*, *"the directory the sibling worktrees are created in"*. Keep:

- the path placeholder `<worktree>` and the registry field `worktree`, which are names (`.claude/context/plugin.md` → `## The placeholder vocabulary`);
- every script name;
- every quoted command or `jq` filter;
- every heading;
- **all of `branch-prompt.md`'s step 4 Collision guard.**, byte for byte. The collision guard is the layout switch's (task prompt → `## Not in this branch`), and its check (b)'s `git worktree list` is the one stated exception to the anchor closure in these files (story index scope register row 23).

### Targets

- `plugin/commands/branch-prompt.md`
- `plugin/commands/branch-user-review.md`
- `plugin/commands/branch-status.md`
- `plugin/commands/branch-answer.md`
- `plugin/commands/branch-pause.md`
- `plugin/commands/branch-resume.md`

**Work:**

- [ ] **The two inbox writers.** Rewrite step 1 of `branch-prompt.md` and of `branch-user-review.md` to the clause, keeping *"Never hardcode the path."* and the inbox sentence. Apply the wording rule to the rest of each file, outside `branch-prompt.md`'s step 4. In `branch-prompt.md` that covers the `<work_root>` and `<project_name>` rows' descriptions, the watcher sentence and the slug warning. `branch-user-review.md`'s registry-read and `cleanup-merged-worktrees.sh` / `create-worktree.sh --existing` sentences keep their names.
- [ ] **The two registry readers.** Rewrite step 1 of `branch-status.md` and of `branch-answer.md` to the clause, then apply the wording rule. `branch-status.md`'s *"its `worktree` is the run's local mirror"* keeps the field name and says the mirror is the run copy. *"If the `worktree` was removed"* keeps the field name.
- [ ] **Pause and resume.** Rewrite step 1 of `branch-pause.md` and of `branch-resume.md` to the clause, then apply the wording rule, the `description:` frontmatter lines included (*"one PAUSE marker in a local run's worktree"* becomes *"in a local run's run copy"*). The `argument-hint:` and every other frontmatter key stay byte for byte.
- [ ] **Close.** Run `grep -n 'worktree list' plugin/commands/branch-prompt.md plugin/commands/branch-user-review.md plugin/commands/branch-status.md plugin/commands/branch-answer.md plugin/commands/branch-pause.md plugin/commands/branch-resume.md`. Every line printed carries `printenv HARNESS_MAIN_REPO`, except `branch-prompt.md`'s step 4.

**Verification:**

- The grep in the last Work bullet satisfies its invariant. `grep -rn "head -1 | sed 's/^worktree //'" plugin/commands` prints nothing.
- `git diff plugin/commands/branch-prompt.md` shows no line of step 4 **Collision guard.** changed.
- `grep -n -i 'worktree' <each of the six files>`: every remaining hit is the `<worktree>` placeholder, the `worktree` field, a script name, the clause, or `branch-prompt.md`'s step 4. Record any judgement call in the deviation notes.
- `git diff plugin/commands` changes no frontmatter key other than the two `description:` lines named above.
