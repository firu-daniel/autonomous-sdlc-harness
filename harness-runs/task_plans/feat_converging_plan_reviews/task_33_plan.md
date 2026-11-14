### Task 33 — Pin a withheld restore as an FR6 pass in `gate12-sandbox-round-full-run.test.mjs`

**Goal:** The Gate 12 full-run suite extracts Task 7's withheld line out of `verb_restore` and pins Task 32's grader passing FR6 on it, so a later change to either the line or the grader that breaks the withheld outcome fails a test.

**Depends on:** Task 32 (`scripts/lib/gate12-sandbox-round/grade-full-run.sh` → `g12_fr6_restore`, the grader this case pins) and Task 7 (`cli/templates/scripts/remote-run.sh` → `verb_restore`'s withheld line, which this suite extracts). Ordered directly after Task 32 in the readiness list.

**Why this is its own task.** The edit sits under `cli/`, so it is the `cli` layer's (`.claude/context/conventions.md` → `## The layers`: *"A change whose files sit under `cli/` or `plugin/` belongs to that layer and never to `general`"*), while the grader it pins is a `general` file. It ships after the grader rather than with the `cli` tasks because the test consumes the grader (contract before consumer, `.claude/context/conventions.md` → `### The order files are created, so a half-built feature is still coherent`).

**The contracts this task consumes, restated.**
- Task 7's withheld line, in `cli/templates/scripts/remote-run.sh` → `verb_restore`'s `0)` arm, printed after the unchanged restored and placed/kept lines: `echo "remote-run.sh: withheld $HR_REMOTE_PLANNING_WITHHELD planning file(s) for $branch; the checkout tracks its story index, so the committed round stands"`, only when `HR_REMOTE_PLANNING_WITHHELD` is non-zero. The placed/kept line stays byte-identical, so the suite's existing extraction of it still matches.
- Task 32's grader, `g12_fr6_restore`: when the restore's log holds no `placed [0-9]+ planning file\(s\)` line but holds a `withheld [0-9]+ planning file\(s\)` line, FR6 is `pass` with evidence `run <id> restored the bundle of run <parked>; withheld <n> planning file(s)`. With neither line, the `fail` evidence reads `… carries no placed <n> planning file(s) line and no withheld <n> planning file(s) line, but run <parked>'s bundle holds <count> planning file(s)`.

**Where this task stops.** It edits only this one test file. The grader and the FR6 contract documents (`docs/sandbox-verification.md`, `docs/development.md`) are Task 32's; the restore's behaviour and its line are Task 7's; this checkout's `scripts/remote-run.sh` is Task 27's (the suite reads the template, `REMOTE_RUN = 'cli/templates/scripts/remote-run.sh'`).

### Targets

- `cli/test/gate12-sandbox-round-full-run.test.mjs` — its header comment, the extracted restore lines, `fullRun`'s options, one new FR6 case, and the existing no-line `fail` case's evidence assertion.

**Work:**

- [ ] Extract the withheld line out of `verbRestore` at test time, as the suite reads its other lines: `const [WITHHELD_OPEN, WITHHELD_FOR, WITHHELD_TAIL] = extract(verbRestore, /echo "(remote-run\.sh: withheld )\$HR_REMOTE_PLANNING_WITHHELD( planning file\(s\) for )\$branch(; the checkout tracks its story index[^"]*)"/, 'verb_restore withheld line');` and `const WITHHELD = \`${WITHHELD_OPEN}2${WITHHELD_FOR}${B}${WITHHELD_TAIL}\`;` (two, matching `PLANNED_BUNDLE`'s two files).
- [ ] Add a `withheld = false` option to `fullRun` (and its JSDoc) that appends `[STEP.restore, WITHHELD]` after the restored line.
- [ ] Add `test('FR6: a withheld line over a bundle holding two planning files is pass naming the withheld count', …)`: `stage(fixture, fullRun({ placed: false, withheld: true }))`, then `fr6.result` is `pass` and `fr6.evidence` includes `withheld 2 planning file(s)` and `restored the bundle of run ${PARKED}`.
- [ ] The existing `FR6: no placed line over a bundle holding two planning files is fail naming the count` case keeps its fixture and its count assertion; its first evidence substring becomes Task 32's restated text, `carries no placed <n> planning file(s) line and no withheld <n> planning file(s) line`.
- [ ] Restate the header comment: *"a restore with no placed line passes FR6 only when the parked job's bundle holds no planning file"* becomes *"a restore with neither a placed nor a withheld line passes FR6 only when …"*, and the `cli/templates/scripts/remote-run.sh` source bullet names `verb_restore`'s restored, placed, **withheld** and wrote lines.

**Verification:**

- `npm test --workspace cli -- test/gate12-sandbox-round-full-run.test.mjs` passes — this task's own edited test file, including the new withheld case and the unchanged-fixture no-line `fail`, `expired` and `not run` cases.
- `grep -n "verb_restore withheld line" cli/test/gate12-sandbox-round-full-run.test.mjs` finds the extraction; `grep -n "withheld: true" cli/test/gate12-sandbox-round-full-run.test.mjs` finds the new case's fixture.
