# Task plan review — iteration 1

All four Must Fix findings from iteration 0 are resolved in the revised files:
- `pasteReason` and the two-spelling doc comments are handled in `task_2_plan.md`.
- The `docs/cli.md` anchor is corrected in `task_10_plan.md`.
- The `line` / `contains` exemption kinds and the exactly-one-line rule are in `task_11_plan.md` and `task_13_plan.md`.

The scope-register derivations were re-run. Entries 1 and 2 were re-run verbatim, and entry 3 was re-walked over `harness-runs/lessons.md`. Every file and ledger rule they reach is a row, so the closure invariant holds.

## Must Fix

1. **Task 10 tells the implementer to keep a `docs/cli.md` sentence that Tasks 1 and 2 make false** — `task_10_plan.md`.
   The `docs/cli.md` paste-line bullet says to rewrite one sentence. It then says: *"Keep the paragraph's next sentence, 'That the prefixed form *succeeds* as a first message is the part not established', and everything after it."* That kept sentence goes on: *"the only measurement in this tree is headless and negative on both spellings (`docs/development.md` §6)"*.

   This branch adds two headless measurements:
   - Task 1's watcher first-message probe, recorded in the comment opening `# THE SPELLING OF THESE THREE IS MEASURED, NOT ASSUMED.`
   - Task 2's `claude -p` re-measurement, recorded in the paragraph opening `Headless first-message leg, re-measured:`

   Task 11 then copies both into the §6 paragraph that sentence cites. So "the only measurement in this tree" is false after this branch whatever either probe returns. "negative on both spellings" is also false if either prefixed leg succeeds. Task 2 already deletes the same claim from `init.ts`, because it removes `ANALYZE_COMMAND_QUALIFIED` and its doc comment ("the only measurement in this tree is headless and negative on both spellings"). Task 10 would keep that claim in the document that describes `init.ts`. The result is the kind of contradiction with §6 that deliverable 4 exists to prevent.
   **Fix:** In `task_10_plan.md`:
   - Add Tasks 1 and 2 as sources of record in `**Depends on:**`: the comment block that opens `# THE SPELLING OF THESE THREE IS MEASURED, NOT ASSUMED.` in `cli/templates/scripts/autonomous-watcher.sh`, and the `Headless first-message leg, re-measured:` paragraph in `cli/src/commands/init.ts`.
   - Replace "Keep ... everything after it" with this instruction. Rewrite the clause *"the only measurement in this tree is headless and negative on both spellings"* so it says what those two records say. Alternatively, point to `docs/development.md` §6 without restating a result. Either way, keep the clauses after it (the hand-run gate, "dropped rather than respelled", and the both-arms sentence) unchanged.
   - Add a Verification bullet: `grep -n 'headless and negative on both spellings' docs/cli.md` returns nothing.

2. **The README's "Interactive only" measurement bullet is not scheduled, though its truth depends on Task 2's re-measurement** — `task_12_plan.md`.
   Under **Before you run it**, `README.md` carries *"**Interactive only.** Step 3 answers `Unknown command` in a headless `claude -p` session. The measurement is [`docs/development.md`](docs/development.md) §6."* After Task 12, step 3 shows `/autonomous-sdlc-harness:harness-analyze`. The bullet then makes a claim about exactly the spelling Task 2 re-measures headless (`claude -p "/autonomous-sdlc-harness:harness-analyze"`), and it cites the §6 paragraph Task 11 rewrites.

   Task 12 aligns only the bullet under `### Measured while building that evidence, and not fixed here` ("the headless result as re-measured, or as last measured if it was not re-run"). It also aligns `llms.txt`'s summary line to that bullet. It names no step for the **Interactive only** bullet. So if the re-measurement shows the prefixed form resolving headless, the README keeps two bullets that disagree with each other and with §6. Deliverable 4 requires the README's measurement text and §6 to say the same thing. Step C's *"see **Interactive only**"* cites the bullet by its bold lead, so the lead is a wire.
   **Fix:** In `task_12_plan.md`, add a Work step (or a sub-bullet of the measurement-bullet step, to stay within the 5-bullet ceiling). The step rewrites the **Interactive only** bullet's sentence so it states §6's headless result for step 3's spelling: as re-measured, or as last measured and not re-run. It keeps the bold lead `**Interactive only.**` byte-identical, keeps the §6 link, and adds no bare spelling. If the re-measurement shows step 3 working headless, the step also says what happens to the bullet and to step C's *"see **Interactive only**"* pointer. Add a Verification bullet that reads the rewritten bullet against Task 11's closed §6 paragraph.

## Should Fix

1. **Scope register row 89 still limits the lessons-ledger rule to `README.md` without saying why** (story index, `## Scope register` row 89). This carries over from iteration 0. It is neither addressed nor recorded under `## Rejected findings`.
   Several tasks rewrite adopter-facing lines that keep a command inline:
   - Task 6: the `**Usage:**` lines ("type `/autonomous-sdlc-harness:branch-prompt` and then keep typing …")
   - Task 10: `docs/cli.md`'s `/harness-analyze <target>` in the step-2 paragraph, and `examples/notes-app/README.md`
   - Task 12: `README.md`'s "`/branch-prompt` itself"

   Either the reason cell says why those lines describe syntax or name a route rather than telling a reader what to run, or the owning tasks fence the lines the rule covers.

2. **Task 12's `ARCHITECTURE.md` rewrites do not mention the file's sentence-marker rule** (`task_12_plan.md`). `ARCHITECTURE.md` says *"An unmarked declarative sentence about the system is a defect in this file"*, and every sentence in the two paragraphs Task 12 rewrites carries `**[shipped]**` or `**[designed]**`. The replacement sentences (the sweep ran, gate 6d exists, the route is measured) need a marker each. Add that to the `ARCHITECTURE.md` Work bullet.

3. **Task 1's verification rationale names a test that does not check the watcher** (`task_1_plan.md`). It says `cli/test/outer-loop-scripts.test.mjs` compares the written watcher against the template byte for byte. That suite's byte assertions are on `lib/harness-run-lib.sh` (`LIB_TEMPLATE`), and `docs/outer-loop-verification.md` states that the other outer-loop files' byte-identity is checked by hand. `bash scripts/test.sh` exiting 0 is still the right gate, but the sentence overstates what it proves. Drop the rationale, or add `cmp` against a fixture `init` writes.

## Nice to Have

- Tasks 2 and 10 cite `docs/development.md` → `## 5. Verifying a change` → gate 6 for the spelling rule, but that paragraph does not exist until Task 11 lands. The citation resolves at the end of the branch, so this is only a transient dangling pointer between commits. The layer order forces it.
