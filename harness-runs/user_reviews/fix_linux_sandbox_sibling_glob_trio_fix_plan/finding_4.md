### 4. Claude Code's built-in protected-path placeholders can be left in a run copy after a killed session, and nothing records or states them

**File:** `docs/cli.md` §6 → residual 12, **Linux placeholders: the interim position on a bubblewrap host**, its **Leftovers.** bullet ("A session killed mid-call leaves each absent entry it was mounting behind as a `-r--r--r--` empty file")
**Also:** `cli/templates/scripts/commit-on-branch.sh` → the call "hr_commit_paths_var \"$main_top\" \"$top\" \"$wt_gitdir\" \"$branch\" \"$old_tip\" auto always", which you read only to confirm the staging claim.

**What was observed** (the user's session 2, 2026-10-30, Claude Code 2.1.314, bubblewrap 0.8.0):
- With git working in the clone, sandboxed `git status` there listed 21 untracked paths that exist outside the sandbox under no profile entry: `.bash_profile .bashrc .claude/agents .claude/commands .claude/hooks .claude/launch.json .claude/loop.md .claude/output-styles .claude/routines .claude/scheduled_tasks.json .claude/skills .claude/workflows .gitconfig .gitmodules .idea .mcp.json .profile .ripgreprc .vscode .zprofile .zshrc`.
- After the killed session D, the plain shell's `git status` listed untracked paths whose first ten match that list. The rest, and the files' types and modes, are unmeasured, because the check script truncates.
- No manifest records them.

**The decision the user set, and how it falls.** The sweep covers these paths only if all three of the following hold:
- (a) the list is fixed and readable at launch, or derivable without guessing;
- (b) each leftover is 0-byte and read-only, the test `hr_placeholder_leftover_var` already applies;
- (c) a real file the run made at one of those paths is never removed.

Otherwise they are accepted and documented.

- **Sources tried for Claude Code's own list.**
  - The installed Claude Code bundle, outside this checkout: the plan writer's attempt to read it was refused by the session's permission layer.
  - The repository: `git grep` for `ripgreprc`, `scheduled_tasks` and `launch.json` finds nothing outside `harness-runs/`.
  - No web source exists for an unattended run.
  - The 21-path list above is one session's reading, which the user ruled out as a source.
- **So condition (a) fails.** The list is neither readable at launch nor derivable without guessing. Condition (b) is also unmeasured: no reading shows the modes of D's leftovers.
- **The outcome is *accept*.** Do **not** add any built-in path to the manifest. Do not hard-code the 21 paths anywhere in the watcher or the library.

If a later round can read the bundle's list at launch, recording each absent built-in path in the manifest at launch is the follow-up. Leave it out of this round.

**Fix.**

1. **`docs/cli.md` §6, residual 12.** Add a point after **Leftovers.**, or as a sub-bullet of it, in that item's measured/derived style:
   - **Measured** (2026-10-30, Claude Code 2.1.314, bubblewrap 0.8.0, `docs/sandbox-verification.md` §5, the control row Finding 6 adds): Claude Code mounts placeholders at its own protected paths in the session's cwd. Sandboxed `git status` in a run copy lists them as untracked. A killed session can leave some of them on disk in the run copy, and no manifest records them.
   - **Why they are accepted rather than swept:**
     - Claude Code's own list is not readable from the run, and the sweep may remove only a path a manifest recorded as absent before the session.
     - Removing by a guessed list could delete a real file the run made, such as a `.gitmodules` or `.claude/skills`.
     - They are untracked clutter, not a breach: each is a placeholder the session mounted, and no code outside the sandbox loads it from a run copy. **Derived**, from the per-run profile and the wrappers' pins. Cite the wrappers' pinned `core.hooksPath` and `submodule.recurse=false` and the profile's own `.claude/settings*.json` and `.mcp.json` entries, as `docs/cli.md` §6 already does elsewhere.
   - **They cannot be committed by accident.** `commit-on-branch.sh` commits exactly the paths it is given, through `hr_commit_paths_var`, never `git add -A` or `git add .`. The watcher's own artifact commits go through `hr_commit_placed`, one path each.

     Confirm this against the code before writing it. Grep `cli/templates/scripts/commit-on-branch.sh` and `cli/templates/scripts/lib/harness-run-lib.sh` for `add -A` / `add .`. The only hit expected is a comment in `commit-on-branch.sh`'s reproduce-by-hand recipe, `git -C "$d" add -A && git -C "$d" commit -qm seed`, which builds a throwaway fixture and is not a code path. If you find any other staging site, stop and report it instead of writing the sentence.
   - **Job mode.** The same holds for a job's own checkout, which is the session's cwd there. Say so in one clause: the lesson ledger requires every execution mode to be stated.
   - **Unmeasured.** Name what is still unmeasured: the full post-kill list, and each leftover's type and mode. Finding 5's script change measures them at the owed re-take.
2. No code change in the watcher or the library.

Finding 6 adds the matching §6 point in `docs/sandbox-verification.md` and the upstream report's observation. This finding owns `docs/cli.md` only.
