### Task 12 — Re-render the worked example's fence, task offer and profile `_README` line

**Goal:** Keep the live worked example's rendered files identical to what `init` now renders from the templates this branch changed, with the example's own values in place. The example's `.claude/CLAUDE.md` fence section, `.claude/harness-task-offer.md` and `.claude/settings.autonomous.json` are renders of token-carrying `cli/templates/` files. A change to such a template owes this directory the rendered artifact (`examples/notes-app/README.md` → *"The capture is frozen; the fixture is live"*; `.claude/context/conventions.md` → `## Documents of record`).

**Depends on:**

- **Task 1**, which changes `cli/templates/claude/CLAUDE.md` → `## Where a change request runs`, item **4. Opt-out.**, and `cli/templates/claude/harness-task-offer.md`: the phrase *"at the main worktree's root"* and the `## Answer 4 — write the marker, then do the work` bullets. Both carry the `{{pluginName}}` token.
- **Task 5**, which rewords the `_README` line beginning `THE MAIN CHECKOUT IS READ FROM ONE ENVIRONMENT VARIABLE:`. `cli/src/generators/permissionProfile.ts` appends that line to every rendered profile.

Nothing else in those templates changed.

**Where this task stops.** This repository's own root `.claude/CLAUDE.md` and `.claude/harness-task-offer.md` are re-rendered by the maintainer (story index → `Manual setup required`), not here. In `examples/notes-app/.claude/CLAUDE.md`, only the `## Where a change request runs` section is the template's rendered text. Every other section there is the frozen capture and stays byte-identical.

### Targets

- `examples/notes-app/.claude/CLAUDE.md` — the `## Where a change request runs` section, item 4 only.
- `examples/notes-app/.claude/harness-task-offer.md` — the phrase *"at the main worktree's root"* and the answer-4 bullets.

`examples/notes-app/README.md` is **not** a target. See **Check the README's counts** below: a recount that differs stops the task.
- `examples/notes-app/.claude/settings.autonomous.json` — the one `_README` line beginning `THE MAIN CHECKOUT IS READ FROM ONE ENVIRONMENT VARIABLE:`.

**Work:**

- [ ] **Render the expected text instead of retyping it.**
  - Build the CLI (`npm run build`).
  - Run the compiled CLI's `init` against a throwaway fixture repository under the system temp directory. Shape the fixture like the example: the same `harness.config.json` keys `phases`, `qa`, `scriptsDir`, `stateDir` and `projectName` as `examples/notes-app/harness.config.json`.
  - From the fixture's rendered `.claude/CLAUDE.md`, `.claude/harness-task-offer.md` and `.claude/settings.autonomous.json`, take the new item 4, the offer's replacement for *"at the main worktree's root"* and its answer-4 bullets, and the new `_README` line.
- [ ] **Apply exactly those parts to the example.** In `settings.autonomous.json`, substitute the fixture's root with `/workspace/notes-app` wherever the line names a path. The anchor line names none, so it should transfer verbatim. Leave every other line of all three files byte-identical.
- [ ] **Check the README's counts; never edit the README.** `examples/notes-app/README.md` states `/workspace` occurrence and line counts for the profile (`grep -n '/workspace' examples/notes-app/README.md`). Recount after the re-render. The changed line names no path, so no figure should move. If a recount differs from what the README states, **stop**: revert nothing, edit no README, and return a `blocker:` naming the figure, the README's stated value and the recounted value, so the plan can add the README as a target.

**Verification:**

- `jq -e . examples/notes-app/.claude/settings.autonomous.json > /dev/null` exits 0.
- `grep -n -F 'git worktree list | head -1' examples/notes-app/.claude/CLAUDE.md examples/notes-app/.claude/harness-task-offer.md` finds nothing.
- `grep -c -F "at the main worktree's root" examples/notes-app/.claude/harness-task-offer.md` prints `0`.
- `git diff examples/notes-app/` touches only item 4 of the fence, the *"at the main worktree's root"* phrase and answer 4 of the offer, and the one `_README` line, and does not touch `examples/notes-app/README.md`. Read it to confirm that no captured section of `CLAUDE.md` moved.
- `grep -rn '/Users/\|/home/' examples/notes-app/.claude` finds nothing (`.claude/context/conventions.md` → `## The testing bar`, the self-containment gate).
