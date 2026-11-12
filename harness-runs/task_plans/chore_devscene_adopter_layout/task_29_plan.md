### Task 29 — Respell `docs/development.md`, gates 6, 8 and 12 included

**Goal:** Make the development guide carry the new names everywhere. Gate 6 states the respelled command-spelling rule. Gate 8 has the analyze command's two bare lines. Gate 12 drops the *"`scripts` … by default"* wording, and its observation table matches the respelled Gate 12 scripts.

**Depends on:**
- Task 17, whose `scripts/check-command-spelling.sh` matches `(^|[^A-Za-z0-9_.}/:-])/(branch-([a-z-]*[a-z]|\*)|analyze)([^A-Za-z0-9_./-]|\.([^A-Za-z0-9_/-]|$)|$)`. It excludes `examples/notes-app/devscene/` and exempts exactly the two lines `/analyze --dry-run` and `/analyze` here.
- Task 16, whose `scripts/lib/gate12-sandbox-round/core.sh` FR3 description reads `… line of the Run DevScene step log …`. `cli/test/gate12-sandbox-round-docs.test.mjs` holds this document's Gate 12 table rows equal to `core.sh`'s descriptions.
- Tasks 1, 6 and 15, which make the other names true.

**Where this task stops.** Dated gate rounds are respelled silently (`## Context` → *Dated records are respelled, silently*). That covers their `harness pause` / `harness run` / `harness stop` / `harness trigger 6` / `harness control` titles, quoted output lines and config names. No sentence says a name changed. A fenced command stays fenced. The roadmap legend in §6 keeps every row number.

### Targets

- `docs/development.md`

**Work:**

- [ ] Gate 6, its 6d paragraph: the `**The check**` sentence's pattern reads exactly as Task 17's `PATTERN`. The carve-out list names `examples/notes-app/devscene/` and the `init.ts` measured line. The offer-file citation reads `cli/templates/claude/devscene-task-offer.md`.
- [ ] Gate 8: the fenced block's two lines read `/analyze --dry-run` and `/analyze`, each alone on its line, as the exemptions require. Every other mention of the command reads `/devscene:analyze`.
- [ ] Gate 12: delete *", `scripts` for the second by default"* from the `<stateDir>` and `<scriptsDir>` sentence, leaving *"… are the values the scratch repository's own `devscene.config.json` carries."*. In its observation table and narrative, apply rows 11 and 12 of `## Context`'s spelling table. The FR3 row's text equals `core.sh`'s FR3 description, as the task's dependency states.
- [ ] Everywhere else: apply rows 1–12 as they occur (§5's gates, the §6 roadmap rows that name the analyze command and the markers, the *"A third debt"* paragraph). That paragraph's opening sentence stays byte-identical, because an exemption covers it.

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|harness-scripts|harness-task-offer|harness-no-offer|harness-analyze|harness-read-mention|harness-watcher@|harness:unfilled|harness:setup-pending|harness-poll-state|Run the harness|harness (run|pause|stop|control|trigger)( [^a-z ]|[^ a-z]| [a-z]+_)|harness <action>|harness [$][{][{]|for the second by default' -- docs/development.md` prints nothing.
- `git grep -nxE '/analyze( --dry-run)?' -- docs/development.md` prints exactly the two gate-8 lines.
- `git grep -nF 'line of the Run DevScene step log' -- docs/development.md scripts/lib/gate12-sandbox-round/core.sh` prints the FR3 text in both files.
