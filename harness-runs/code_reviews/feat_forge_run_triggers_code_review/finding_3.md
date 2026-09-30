### 3. The five commands that run `adopt` or `adopt --list` give no instruction for exit 1

> **Self-contained per-finding file** for the `feat_forge_run_triggers` code-review index (`harness-runs/code_reviews/feat_forge_run_triggers_code_review.md`). The implementer reads only this file. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**Files:**

- `plugin/commands/branch-answer.md`, `plugin/commands/branch-pause.md`, `plugin/commands/branch-resume.md` and `plugin/commands/branch-user-review.md`, each in the bullet "**Runs started on GitHub are adopted first.**", at the line "- exit 3 or 4: report its message and carry on with the registry as it stands."
- `plugin/commands/branch-status.md`, the bullet "**Runs started on GitHub, not yet adopted.**", at the line "- exit 3: report its message."

**Problem.** `cli/templates/scripts/remote-run.sh` can end `adopt` and `adopt --list` with exit 1 on three paths:

- the sending-verb gate's "cannot resolve '$root/harness.config.json' (or execution.target is outside its enum)";
- `verb_adopt`'s "cannot resolve '$root/harness.config.json'";
- `verb_adopt`'s "cannot read the registry '$registry'".

The header's exit map says the same ("1 usage error, or the library or the configuration could not be resolved"). Each command's exit-status list stops at 0, 2, 3 and 4 (`branch-status`: 0, 2 and 3). An agent executing one of these commands has no instruction for 1, and each list opens with "Handle its exit status as follows". The consequence is small: the likely reading is to report and carry on. No command decision turns on it, so this is Should Fix. It is still a hole in a wire the command states exhaustively.

**Fix.**

- [ ] In each of the four syncing commands, change `- exit 3 or 4: report its message and carry on with the registry as it stands.` to `- exit 1, 3 or 4: report its message and carry on with the registry as it stands.`
- [ ] In `plugin/commands/branch-status.md`, change `- exit 3: report its message.` to `- exit 1 or 3: report its message.`

The edit is prose-only in plugin commands, so no test run is owed. The manifest gate is unaffected.
