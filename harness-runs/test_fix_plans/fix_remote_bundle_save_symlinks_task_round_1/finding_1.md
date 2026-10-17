### 1. Bare `/branch-start-plan-autonomous` spellings in `docs/copilot-foundry-research.md` fail gate 6d

**Site:** `docs/copilot-foundry-research.md`. There are two lines:

- The §2 list item opening `3. **Plugin packaging and asset resolution**` contains the substring `` (`ENGINE_COMMAND_TASK="/branch-start-plan-autonomous"` in `cli/templates/scripts/autonomous-watcher.sh`) `` (line 43 at the time of writing, as a hint only).
- The bullet opening `- **Asset resolution (§2.3).**` contains the substring `` A headless first message naming `/branch-start-plan-autonomous` may need the commands carried as skills instead. `` (line 119 at the time of writing, as a hint only).

**Failing test:** `scripts/check-command-spelling.sh`, which run-gates reports as `6d plugin command spellings carry the prefix`.

**Failure (from the log):**

```
  FAIL  6d plugin command spellings carry the prefix (exit 1)
        check-command-spelling: docs/copilot-foundry-research.md:43 — bare command spelling; write /autonomous-sdlc-harness:<name>
        check-command-spelling: docs/copilot-foundry-research.md:119 — bare command spelling; write /autonomous-sdlc-harness:<name>
```

**Class:** first round, because no earlier logs were given. The file came onto this branch through its base (commit `d008baca`, "Copilot and Foundry integration research (#112)") and not through this branch's own change. It is still this branch's to fix, because gate 6d scans the whole tree.

**Diagnosis:** `scripts/check-command-spelling.sh` matches every slash spelling of a plugin command that lacks the `/autonomous-sdlc-harness:` prefix. The only lines it lets through are those its in-script `EXEMPTIONS` table covers. That table is a closed carve-out set, and `docs/development.md` §5 gate 6 (the paragraph opening `**A fourth command checks that every slash spelling of a plugin command carries the plugin prefix**`) enumerates it in prose. Neither line in `docs/copilot-foundry-research.md` is in that set:

- Line 43 quotes the watcher's literal assignment `ENGINE_COMMAND_TASK="/branch-start-plan-autonomous"`, which carries the bare spelling.
- Line 119 names the bare command in running prose.

Neither line needs the literal to make its point. Each one names the watcher's first-message string, and that string has a variable name.

**Fix:** respell both lines so they name the variable rather than its bare value. Do not add exemptions: adding one would also mean extending the carve-out enumeration in `docs/development.md` §5 gate 6.

- [ ] Line 43: replace `` (`ENGINE_COMMAND_TASK="/branch-start-plan-autonomous"` in `cli/templates/scripts/autonomous-watcher.sh`) `` with `` (the `ENGINE_COMMAND_TASK` string in `cli/templates/scripts/autonomous-watcher.sh`) ``.
- [ ] Line 119: replace `` A headless first message naming `/branch-start-plan-autonomous` may need the commands carried as skills instead. `` with `` A headless first message naming the plan engine's command (the watcher's `ENGINE_COMMAND_TASK`) may need the commands carried as skills instead. ``.
- [ ] Leave the rest of each line untouched. Afterwards, `grep -nE '(^|[^A-Za-z0-9_.}/:-])/(branch-|harness-analyze)' docs/copilot-foundry-research.md` should print nothing.

Do not edit `scripts/check-command-spelling.sh` or `docs/development.md`.
