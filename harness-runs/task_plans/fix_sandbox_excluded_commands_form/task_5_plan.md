### Task 5 — Re-render the worked example's profile for the corrected form

**Goal:** `examples/notes-app/README.md` states that *"A change that adds or alters a token-carrying `cli/templates/` file still owes this directory the rendered artifact."* This branch changes what `init` renders into the example's `.claude/settings.autonomous.json` in two places:

- the generated `sandbox.excludedCommands` entries (Task 1);
- the token-carrying template's `TWO COMMANDS RUN OUTSIDE THE SANDBOX` `_README` line (Task 3).

So the example's profile must carry what `init` would now write for that project, under the README's own `/workspace` substitution. These are scope register rows 35 and 37.

**Depends on:**

- **Task 1.** Each `sandbox.excludedCommands` entry is `bash <repoRoot>/<scriptsDir>/<wrapper>.sh:*`, with no `Bash(…)` wrapper, push first and refresh second. In the example, `<repoRoot>/<scriptsDir>` is `/workspace/notes-app/scripts`.
- **Task 3.** The new text of the `_README` line beginning `TWO COMMANDS RUN OUTSIDE THE SANDBOX, EACH IN ONE SPELLING:` in `cli/templates/claude/settings.autonomous.json`, whose only token is `{{scriptsDirAbs}}`.

This task copies both and decides neither.

**Where this task stops.** The capture under `examples/notes-app/sdlc-harness/`, the example's `.claude/CLAUDE.md` and its `.claude/context/` are frozen (`examples/notes-app/README.md` → *"The capture is frozen; the fixture is live."*), and this task does not touch them. Every other byte of the profile stays as it is, including the `allow` entries in `Bash(bash …:*)` form, which are correct `permissions.allow` rules.

### Targets

- `examples/notes-app/.claude/settings.autonomous.json`: the `_README` line at row 35, and the `sandbox.excludedCommands` list at row 37.

**Work:**

- [ ] Replace the two `sandbox.excludedCommands` entries `Bash(bash /workspace/notes-app/scripts/push-branch.sh:*)` and `Bash(bash /workspace/notes-app/scripts/refresh-branch.sh:*)` with `bash /workspace/notes-app/scripts/push-branch.sh:*` and `bash /workspace/notes-app/scripts/refresh-branch.sh:*`, in that order.
- [ ] Replace the profile's `TWO COMMANDS RUN OUTSIDE THE SANDBOX` `_README` line with Task 3's template line, substituting `{{scriptsDirAbs}}` with `/workspace/notes-app/scripts`, the value the existing line already carries. Make no other change to that line.

**Verification:**

- `jq empty examples/notes-app/.claude/settings.autonomous.json` exits 0.
- `jq -r '.sandbox.excludedCommands[]' examples/notes-app/.claude/settings.autonomous.json` prints exactly the two new entries, and neither starts with `Bash(`.
- Compare the profile's `TWO COMMANDS` line with the template's after the `{{scriptsDirAbs}}` → `/workspace/notes-app/scripts` substitution. They match byte for byte.
- `git grep -n -e /Users/ -e /home/ -- examples/notes-app/.claude/settings.autonomous.json` has no hit. No machine path leaked in.
- `git diff --stat examples/notes-app` lists only `examples/notes-app/.claude/settings.autonomous.json`.
