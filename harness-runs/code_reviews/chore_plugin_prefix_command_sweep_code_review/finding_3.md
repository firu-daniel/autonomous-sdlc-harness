### 3. The README says every command in the tree carries the prefix, while the gate-6d carve-outs still document bare spellings

**File:** `README.md` (the bullet under `### Measured while building that evidence, and not fixed here` that opens "**Pasting a command with an argument is not yet measured.**") — "Every command in this tree is documented with the plugin prefix."

That sentence is unqualified, and it is false by this branch's own design. Several places deliberately keep a documented bare spelling, and gate 6d exempts each one on purpose:

- the `docs/development.md` §5 gate 8 fenced block (`/harness-analyze --dry-run` and `/harness-analyze`)
- the engine-command table in `docs/watcher.md` → `## 1. The loop in one page`
- the watcher's header mapping comment and `ENGINE_COMMAND_*` lines in both watcher copies
- the measured-subject quotes in `docs/development.md` §6, `cli/src/commands/init.ts` and `docs/outer-loop-verification.md`

Who gets it wrong: a contributor who reads the README, then finds `/harness-analyze` in the gate-8 block or `/branch-start-plan-autonomous` in the `docs/watcher.md` table. The README says there are no bare spellings, so they "correct" one. The exemption entry that covered that line now covers nothing. `scripts/check-command-spelling.sh` reports `stale exemption` and gate 6d fails. For the watcher rows, the change also breaks from the measured `bare` route.

**Fix:** qualify the sentence by pointing at the owner of the carve-outs, without restating them. Replace

> Every command in this tree is documented with the plugin prefix.

with

> Every command in this tree is documented with the plugin prefix, outside the carve-outs [`docs/development.md`](docs/development.md) §5 gate 6 names.

Leave the rest of the bullet unchanged. The new text has no bare slash spelling. Run `bash scripts/check-command-spelling.sh` and `bash scripts/check-llms-txt.sh`: both should still exit 0.
