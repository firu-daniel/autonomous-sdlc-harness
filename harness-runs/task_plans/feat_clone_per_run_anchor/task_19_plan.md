### Task 19 — Re-render the worked example's profile for the anchor rule and the reworded `_README` lines

**Goal:** Keep the live worked example's generated profile identical to what `init` now renders, with `/workspace/notes-app` substituted as the example's root. Then correct any figure its README states about that file. The profile is live, not part of the frozen capture (`.claude/context/conventions.md` → `## Documents of record`), and a change to a token-carrying `cli/templates/` file owes this directory the rendered artifact (`examples/notes-app/README.md` → *"The capture is frozen; the fixture is live"*).

**Depends on:**

- **Task 1**, which appends one `permissions.allow` entry, `Bash(printenv HARNESS_MAIN_REPO)`, and one `_README` line naming `printenv HARNESS_MAIN_REPO` to every rendered profile, after the browser and retrieval fragments. Both are built in code from `cli/src/core/mainRepoAnchor.ts`.
- **Task 5**, which rewords, under the run-copy rule, the sentences after the colon in five `_README` lines of `cli/templates/claude/settings.autonomous.json`: those beginning `THE CHECKOUT AND ITS SIBLING WORKTREES BOTH`, `EVERY WRAPPER IN`, `THE OUTER-LOOP SCRIPTS AN AGENT RUNS`, `THREE COMMANDS RUN OUTSIDE THE SANDBOX` and `TWO RESIDUALS`. It also rewords one sentence of `settings.autonomous.qa.json`'s `_README`, which the example renders because its `phases.qa` is on with `qa.driver` `web-playwright`.

Nothing else in the rendered file changes.

### Targets

- `examples/notes-app/.claude/settings.autonomous.json`
- `examples/notes-app/README.md` — the figures paragraph only, and only if a figure it states changed.

**Work:**

- [ ] **Render the expected values instead of retyping them.**
  - Build the CLI (`npm run build`).
  - Run `init` with the compiled CLI against a throwaway fixture under the system temp directory, shaped like the example: the same `harness.config.json` keys `phases`, `qa`, `scriptsDir`, `stateDir` and `projectName`.
  - From its `.claude/settings.autonomous.json`, take the new allow entry and its position, the new `_README` line and its position, and the reworded `_README` lines. The fixture's own root stands where the example has `/workspace/notes-app`.
- [ ] **Apply exactly those parts to the example's profile.** Substitute the fixture root with `/workspace/notes-app`, its parent with `/workspace`, and the sibling glob with `/workspace/notes-app-*`, as the example's README describes. Leave every other line byte-identical.
- [ ] **Recount and correct the README only if needed.** In `examples/notes-app/README.md`, find the paragraph stating the profile's `/workspace`-rooted occurrence and line counts (`grep -n '/workspace' examples/notes-app/README.md`). Re-count each figure after the re-render, the way the paragraph defines it. The anchor rule names no path, so the figures should not move; update a number only where the recount differs. The paragraph's wording and its account of how the substitution was made stay as they are.

**Verification:**

- `jq -e . examples/notes-app/.claude/settings.autonomous.json > /dev/null` exits 0.
- `jq -r '.permissions.allow[]' examples/notes-app/.claude/settings.autonomous.json | grep -x 'Bash(printenv HARNESS_MAIN_REPO)'` prints the rule once, and `jq -r '._README[]' examples/notes-app/.claude/settings.autonomous.json | grep 'printenv HARNESS_MAIN_REPO'` prints one line.
- `git diff examples/notes-app/.claude/settings.autonomous.json` touches only the allow entry, the new `_README` line and the reworded `_README` lines named above. Read the diff to confirm.
- `grep -c '/workspace' examples/notes-app/.claude/settings.autonomous.json` and `grep -o '/workspace' examples/notes-app/.claude/settings.autonomous.json` (count the lines of its output) give the line and occurrence totals the README states.
- `grep -rn '/Users/\|/home/' examples/notes-app/.claude` finds nothing: the self-containment gate (`.claude/context/conventions.md` → `## The testing bar`).
