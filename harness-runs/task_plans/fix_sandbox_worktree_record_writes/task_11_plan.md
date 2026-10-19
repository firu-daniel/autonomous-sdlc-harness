### Task 11 — Re-render the worked example's profile for the third excluded wrapper

**Goal:** Keep the live worked example's generated profile identical to what `init` now renders, with `/workspace/notes-app` substituted as the example's root. Correct the figures its README states about that file. The profile is live, not part of the frozen capture (`.claude/context/conventions.md` → `## Documents of record`).

**Depends on:** Tasks 4 and 5, whose rendered output this task mirrors at the example's root `/workspace/notes-app`, with scripts directory `/workspace/notes-app/scripts`:

- **Task 4 changes three things in the profile:**
  - `sandbox.excludedCommands` becomes exactly `"bash /workspace/notes-app/scripts/commit-on-branch.sh:*"`, `"bash /workspace/notes-app/scripts/push-branch.sh:*"`, `"bash /workspace/notes-app/scripts/refresh-branch.sh:*"`, in that order;
  - in `sandbox.filesystem.denyWrite` and in the `Edit`/`Write` deny rules, `/workspace/notes-app/scripts/commit-on-branch.sh` moves into the first, unsandboxed-wrapper group, ahead of `push-branch.sh`;
  - in the `_README` line beginning `WHAT RUNS OUTSIDE THE SANDBOX CANNOT BE WRITTEN FROM INSIDE IT`, its reason becomes ``the main checkout's commit-on-branch.sh runs outside the sandbox``, in that same position.
- **Task 5 rewrites three `_README` lines in the template:** `THREE COMMANDS RUN OUTSIDE THE SANDBOX, EACH IN ONE SPELLING`, the network-allowlist line and the credentials line. They render here with `{{scriptsDirAbs}}` = `/workspace/notes-app/scripts`.

Nothing else in the file changes. The `allow` entries for `commit-on-branch.sh` are already present.

### Targets

- `examples/notes-app/.claude/settings.autonomous.json`
- `examples/notes-app/README.md` (the figures paragraph only)

**Work:**

- [ ] **Render the expected values instead of retyping them.** Build the CLI, then run `init` with the compiled CLI against a throwaway fixture under the temp directory, shaped like the example: the same `harness.config.json` keys `phases`, `scriptsDir`, `stateDir` and `projectName`. Take from its `.claude/settings.autonomous.json` the changed `excludedCommands` list, the `denyWrite` and deny-rule order around the three wrappers, the protection `_README` line, and the three Task 5 `_README` lines. The fixture's own root stands where the example has `/workspace/notes-app`.
- [ ] **Apply exactly those parts to the example's profile,** substituting the fixture root with `/workspace/notes-app`, its parent with `/workspace`, and the sibling glob with `/workspace/notes-app-*`. This is the substitution the example's README describes. Leave every other line byte-identical.
- [ ] **Recount and correct the README.** In `examples/notes-app/README.md`, the paragraph stating *"The file now carries 220 `/workspace`-rooted occurrences across 179 lines: 189 `/workspace/notes-app`, 33 of them the sibling worktree glob …; 30 home-directory ones …; and one bare `/workspace`"* is already one occurrence out (221 before this task). Re-count each figure after the re-render, the same way the paragraph defines it, and update the numbers only. The paragraph's wording and its account of how the substitution was made stay as they are.

**Verification:**

- `jq -e . examples/notes-app/.claude/settings.autonomous.json > /dev/null` exits 0.
- `jq -r '.sandbox.excludedCommands[]' examples/notes-app/.claude/settings.autonomous.json` prints exactly the three entries above, in that order.
- `git diff --stat examples/notes-app/.claude/settings.autonomous.json` touches only the `excludedCommands` list, the moved `denyWrite` and deny-rule lines, and the four `_README` lines named above. Read the diff to confirm.
- `grep -c '/workspace' examples/notes-app/.claude/settings.autonomous.json` and `grep -o '/workspace' examples/notes-app/.claude/settings.autonomous.json` (count the lines of its output) give the line and occurrence totals the README now states. `grep -rn '/Users/\|/home/' examples/notes-app/.claude` finds nothing, which is the self-containment gate (`.claude/context/conventions.md` → `## The testing bar`).
