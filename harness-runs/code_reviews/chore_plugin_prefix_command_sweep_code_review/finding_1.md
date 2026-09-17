### 1. Gate 6d's documented carve-outs omit two exemption classes the script actually holds

**File:** `docs/development.md` (`## 5. Verifying a change` → gate 6, the paragraph opening "**A fourth command checks that every slash spelling of a plugin command carries the plugin prefix**") — "with their mirrors in `scripts/autonomous-watcher.sh`, **only** while the measured route is `bare`"

This paragraph is the contract for `scripts/check-command-spelling.sh`. The branch wrote it first, by Task 11, so the check would follow a written contract. Its carve-out list ends with the third watcher class: "the three watcher strings `ENGINE_COMMAND_TASK`, `ENGINE_COMMAND_USER_REVIEW` and `ENGINE_COMMAND_DOCS` with their mirrors in `scripts/autonomous-watcher.sh`, **only** while the measured route is `bare`."

The script's `EXEMPTIONS` table goes further. Its group `# (c) the watcher first-message strings, while the measured route is \`bare\`` also exempts two more classes of bare spelling:

- **The header comment that maps each inbox file name to its engine command.** That is three lines in each watcher copy, six entries in all. Example: `'cli/templates/scripts/autonomous-watcher.sh|line|#   <branch>_task_prompt.md   -> /branch-start-plan-autonomous'`, with the same line in `scripts/autonomous-watcher.sh`.
- **The three engine-command cells of the table in `docs/watcher.md` → `## 1. The loop in one page`.** Example: `'docs/watcher.md|contains|| \`<branch>_task_prompt.md\` | \`/branch-start-plan-autonomous\` |'`.

Neither class is a "watcher string" or its "mirror in `scripts/autonomous-watcher.sh`". So the written contract is narrower than the check it describes. Two readers get it wrong:

- **A maintainer who meets `/branch-start-plan-autonomous` in `docs/watcher.md`'s table.** The contract says the carve-out covers only the strings and their mirror. This reader concludes the table cell is a sweep miss and respells it. The exemption entry then covers no line, and the gate fails with `stale exemption`. The contract gave them no way to foresee that.
- **A maintainer who later switches the route to `prefixed`.** The contract names only the three strings and their mirror as losing the carve-out. This reader respells those and leaves the header mapping comment and the `docs/watcher.md` table bare. Those lines are still exempted, so the gate stays green, and the tree ends up with two spellings for one route. That is the drift this gate was added to prevent.

**Fix:** extend the carve-out clause so it names every class the exemption table holds. In the paragraph above, replace

> and the three watcher strings `ENGINE_COMMAND_TASK`, `ENGINE_COMMAND_USER_REVIEW` and `ENGINE_COMMAND_DOCS` with their mirrors in `scripts/autonomous-watcher.sh`, **only** while the measured route is `bare`.

with

> and the three watcher strings `ENGINE_COMMAND_TASK`, `ENGINE_COMMAND_USER_REVIEW` and `ENGINE_COMMAND_DOCS` with their mirrors in `scripts/autonomous-watcher.sh`, together with the three lines of each watcher copy's header comment that map an inbox file name to those strings and the three engine-command cells of the table under `docs/watcher.md` → `## 1. The loop in one page`, **only** while the measured route is `bare`.

Leave the script unchanged: its `EXEMPTIONS` table is already correct, and the prose is what is being brought into line with it. The replacement text has no bare slash spelling, so gate 6d stays green. Confirm by running `bash scripts/check-command-spelling.sh` afterwards: it should exit 0 with no output.
