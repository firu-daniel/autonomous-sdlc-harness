### 3. `branch-prompt.md`'s opening paragraph still names the run copy `<work_root>/<project_name>-<branch>`, not the `<sanitized_branch>` form the branch added

**File:** `plugin/commands/branch-prompt.md`. The paragraph after `## Resolved values`, which opens "This is the file-drop trigger for a **fresh autonomous task run**", contains "creates the sibling run copy `<work_root>/<project_name>-<branch>`".

This branch adds a `<sanitized_branch>` row to the command's `## Resolved values` table: *"`<branch>` with every `/` replaced by `-` — the suffix of a sibling run copy's directory name"*. Step 4's collision guard now uses `<work_root>/<project_name>-<sanitized_branch>`. That matches `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_worktree_dir`, which builds the name from `hr_sanitize_branch` (`${branch//\//-}`).

The opening paragraph's description of what the watcher creates was not changed. It still gives the directory as `<work_root>/<project_name>-<branch>`, so one file now names the same directory in two ways. They diverge whenever `<branch>` contains a `/`. Step 3 allows that, because it uses a user override verbatim as `<branch>`.

`.claude/context/plugin.md` → `## The placeholder vocabulary` says a placeholder's *"spelling is its identity"*. The paragraph is descriptive and no step runs a command from it. So the error is real, but no consumer decision depends on it.

**Fix:** in that paragraph of `plugin/commands/branch-prompt.md`, replace

```
creates the sibling run copy `<work_root>/<project_name>-<branch>`,
```

with

```
creates the sibling run copy `<work_root>/<project_name>-<sanitized_branch>`,
```

Change nothing else. The `<sanitized_branch>` row already declares the token.

No code or test file is edited, so this fix runs no test.
