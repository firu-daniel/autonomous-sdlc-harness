### Task 17 — Re-render the worked example's profile for the registry entry and the restated target sentence

**Goal:** Keep the live worked example's generated profile identical to what `init` now renders, with `/workspace/notes-app` substituted as the example's root. Then correct the figures its README states about that file. The profile is live, not part of the frozen capture (`.claude/context/conventions.md` → `## Documents of record`).

**Depends on:**

- **Task 12**, which adds one entry to `protectedPaths` after the `harness.config.json` entry. It is `<repoRoot>/<stateDir>/autonomous_logs/registry.json`, kind `file`, reason ``the unsandboxed wrappers' clone trust check reads which run copy each branch has from it``. It renders three ways:
  - one `sandbox.filesystem.denyWrite` entry;
  - two `permissions.deny` rules, `Edit(/<path>)` and `Write(/<path>)` in the `//` absolute form;
  - one more `<path> - <reason>` clause in the `_README` line beginning `WHAT RUNS OUTSIDE THE SANDBOX CANNOT BE WRITTEN FROM INSIDE IT`.
- **Task 13**, which replaces the last sentence of the template `_README` line beginning `THREE COMMANDS RUN OUTSIDE THE SANDBOX, EACH IN ONE SPELLING`, the one about which targets the wrappers refuse.

Nothing else in the rendered file changes.

### Targets

- `examples/notes-app/.claude/settings.autonomous.json`
- `examples/notes-app/README.md` (the figures paragraph only)

**Work:**

- [ ] **Render the expected values instead of retyping them.**
  - Build the CLI (`npm run build`).
  - Run `init` with the compiled CLI against a throwaway fixture under the system temp directory, shaped like the example: the same `harness.config.json` keys `phases`, `scriptsDir`, `stateDir` and `projectName`.
  - From its `.claude/settings.autonomous.json`, take the new `denyWrite` entry and its position, the two new deny rules and their position, the changed protection `_README` line, and the restated sentence. The fixture's own root stands where the example has `/workspace/notes-app`.
- [ ] **Apply exactly those parts to the example's profile.**
  - Substitute the fixture root with `/workspace/notes-app`, its parent with `/workspace`, and the sibling glob with `/workspace/notes-app-*`, as the example's README describes. The registry path renders under the example's own `stateDir`.
  - Leave every other line byte-identical.
- [ ] **Recount and correct the README.** In `examples/notes-app/README.md`, find the paragraph stating the profile's `/workspace`-rooted occurrence and line counts (`grep -n '/workspace' examples/notes-app/README.md`). Re-count each figure after the re-render, the same way the paragraph defines it, and update the numbers only. The paragraph's wording, and its account of how the substitution was made, stay as they are.

**Verification:**

- `jq -e . examples/notes-app/.claude/settings.autonomous.json > /dev/null` exits 0.
- `jq -r '.sandbox.filesystem.denyWrite[]' examples/notes-app/.claude/settings.autonomous.json | grep 'autonomous_logs/registry.json'` names the registry path under the example's own `stateDir`, with no duplicate line. `jq -r '.permissions.deny[]' examples/notes-app/.claude/settings.autonomous.json | grep 'registry.json'` lists both the `Edit(/…)` and the `Write(/…)` rule for that same path.
- `git diff --stat examples/notes-app/.claude/settings.autonomous.json` touches only the `denyWrite` list, the deny rules and the two `_README` lines named above. Read the diff to confirm.
- `grep -c '/workspace' examples/notes-app/.claude/settings.autonomous.json` and `grep -o '/workspace' examples/notes-app/.claude/settings.autonomous.json` (count the lines of its output) give the line and occurrence totals the README now states.
- `grep -rn '/Users/\|/home/' examples/notes-app/.claude` finds nothing. That is the self-containment gate (`.claude/context/conventions.md` → `## The testing bar`).
