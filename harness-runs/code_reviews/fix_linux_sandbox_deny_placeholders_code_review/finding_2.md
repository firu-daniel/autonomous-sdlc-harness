### 2. Re-render the notes-app profile's write-protection `_README` line, which still says the per-run copy's exact entries hold on Linux

**Site:** `examples/notes-app/.claude/settings.autonomous.json` → the `_README` line *"WHAT RUNS OUTSIDE THE SANDBOX CANNOT BE WRITTEN FROM INSIDE IT"*, substring `by exact path, which holds on Linux too. A run's own edit`. Also `examples/notes-app/README.md` → the paragraph *"The one edit the kept artifacts carry, and where it landed."*, substring `` `Bash` rows. The file now carries 163``.

**Problem.** This branch rewrote that `_README` line in `cli/src/generators/writeProtection.ts` → `applyWriteProtection`. It dropped *"which holds on Linux too"* and added the bubblewrap placeholder sentence for `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates`. `.claude/context/conventions.md` → `## Documents of record` makes the notes-app's `.claude/settings.autonomous.json` a **live** file, re-rendered whenever a token-carrying `cli/templates/` file changes. The story index's scope register rows 7 and 8 assign this re-render to Task 10. Task 10's recorded disposition (`harness-runs/task_plans/fix_linux_sandbox_deny_placeholders/task_10_plan.md` → `## Disposition`) shows that both `Edit` attempts were refused by the tool layer's `.claude/` write guard. Nothing under `examples/notes-app/` changed on this branch.

The live fixture therefore still tells a reader that the per-run copy's exact entries hold *"on Linux too"*. On a bubblewrap host the branch now leaves those three entries out of `denyWrite` on purpose, so that statement is now false and contradicts what `init` renders today.

**Fix.** Apply exactly the splice Task 10's disposition records, and change nothing else. The `run-analytics.sh` drift that disposition notes predates this branch and is out of scope here.

1. In `examples/notes-app/.claude/settings.autonomous.json`, replace the single occurrence of

   ```
   by exact path, which holds on Linux too. A run's own edit
   ```

   with

   ```
   by exact path. On a host sandboxed by bubblewrap, Claude Code enforces an exact entry for a path that does not exist by mounting a placeholder at that path, which breaks git in the run copy and can be left on disk, so the per-run copy there leaves the run copy's .git/commondir, .git/config.worktree, .git/objects/info/http-alternates out of `denyWrite`: their `Edit` rules stay, and the watcher refuses to launch or resume a run copy carrying one. A run's own edit
   ```

   The file is JSON, so the backticks stay as written: this string is the value of a `_README` entry, not Markdown.

2. In `examples/notes-app/README.md`, replace the single occurrence of

   ```
   `Bash` rows. The file now carries 163
   ```

   with

   ```
   `Bash` rows. A later re-render of the write-protection `_README` line, through the same three clauses, added the Linux placeholder statement for the three `.git` trust files and changed no entry. The file now carries 163
   ```

3. Check the result. `git diff --stat -- examples/notes-app` lists exactly these two files. `jq -e . examples/notes-app/.claude/settings.autonomous.json` exits 0.

If the tool layer refuses the write to `examples/notes-app/.claude/settings.autonomous.json` again, record the refusal as this item's disposition. The operator applies the same two replacements by hand with the one-paste remedy in `task_10_plan.md` → `## Disposition` (d).

- **Deviations from plan:** Fix step 2 (the `examples/notes-app/README.md` splice) was not applied: its sentence records a re-render of the fixture's `_README` line, and that re-render was refused (see `## Disposition`), so writing it alone would record an edit that did not land. Fix step 3's check (`git diff --stat -- examples/notes-app`, `jq -e .`) was not run against an edited fixture, since none landed; `git status` shows nothing under `examples/notes-app/` changed. Before the edit, `grep -c` confirmed that each of the two target substrings occurs exactly once.

## Disposition

- **(a) Attempted:** an `Edit` replacing the substring `by exact path, which holds on Linux too. A run's own edit` in `examples/notes-app/.claude/settings.autonomous.json` with the Fix step 1 replacement text, two attempts with the same edit. The README splice (Fix step 2) depends on that edit and was not attempted.
- **(b) Refusal, quoted, both attempts:** `Permission to use Edit has been denied because Claude Code is running in don't ask mode.`
- **(c) Why no permission entry lifts it:** the target is under a `.claude/` directory. The tool layer's `.claude/**` write guard covers that class and is evaluated before the permission profile. Profile read: `.claude/settings.json` holds only `enabledPlugins` and `extraKnownMarketplaces`, with no `permissions` key. `.claude/settings.local.json` does not exist. The run's `--settings` profile `~/.local/state/autonomous-sdlc-harness/run-profiles/users-daniel-work-autonomous-sdlc-harness/fix_linux_sandbox_deny_placeholders.json` exists, and its `permissions` key begins with an `allow` list (`Bash(git status:*)`, …). The filtered read of its `Edit` / `.claude` entries was refused, so those entries are not reported. This is the same refusal Task 10 recorded (`harness-runs/task_plans/fix_linux_sandbox_deny_placeholders/task_10_plan.md` → `## Disposition`).
- **(d) Operator remedy:** run the one-paste block in `harness-runs/task_plans/fix_linux_sandbox_deny_placeholders/task_10_plan.md` → `## Disposition` (d) from the checkout root. It applies exactly Fix steps 1 and 2 of this finding, byte for byte, and then runs Fix step 3's two checks. The result should show `git diff --stat` listing only `examples/notes-app/.claude/settings.autonomous.json` and `examples/notes-app/README.md`, followed by `json-ok`.
