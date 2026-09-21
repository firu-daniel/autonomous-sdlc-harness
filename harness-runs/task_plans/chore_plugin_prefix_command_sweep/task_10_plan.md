### Task 10 — Sweep `docs/analyze.md`, `docs/cli.md`, `docs/config.md`, `schemas/` and `examples/notes-app/README.md`

**Goal:** The reference documents, the schema's `description` strings, the negative-fixture README and the example project's README spell every plugin command `/autonomous-sdlc-harness:<name>`. Where these files quote `init`'s or `doctor`'s output, they now match what those commands print after Tasks 2–4.

**Depends on:** Tasks 1, 2, 3 and 4.

Tasks 1 and 2 are here as **sources of record** for the one `docs/cli.md` measurement clause below. This branch adds two headless first-message measurements, so after it this tree holds more than one:
- Task 1's watcher first-message probe, recorded in `cli/templates/scripts/autonomous-watcher.sh` in the comment block whose first line is `# THE SPELLING OF THESE THREE IS MEASURED, NOT ASSUMED.`, above `ENGINE_COMMAND_TASK=`.
- Task 2's `claude -p` re-measurement of both analyze spellings, recorded in `cli/src/commands/init.ts` in the `ANALYZE_COMMAND` doc comment, in the paragraph opening `Headless first-message leg, re-measured:` (or `not re-run` with the verbatim refusal).

Task 11, which runs after this task, copies both records into `docs/development.md` §6. Task 2 also deleted `ANALYZE_COMMAND_QUALIFIED` and its doc comment's claim that "the only measurement in this tree is headless and negative on both spellings", so `docs/cli.md` must not keep that claim either.

Tasks 2, 3 and 4 are here for the output strings. After those tasks, `init`'s closing pointer, the stub footers, the setup banner, the `flat` fallback warning, the preset warnings and `doctor`'s remedies all print `/autonomous-sdlc-harness:harness-analyze`. The `init` closing pointer's pasteable line is still `claude "/autonomous-sdlc-harness:harness-analyze"`. Task 2 also removed the paste line's introducing reason (the `pasteReason` constant, *"It is spelled with the plugin prefix because a first message is matched exactly, where a session's command picker matches the name above."*), and kept the `pasteUnconfirmed` clause (*"That first-message form is not confirmed on the version measured here; the name above, typed into an open session, is the route that is."*). Where a sentence here quotes one of those outputs, respell it to match. Do not re-describe the output.

**Where this task stops.** This task changes spelling only, except for two wording changes in `docs/cli.md`'s paste-line paragraph below: the paste-line sentence, which follows Task 2's wording change in `init`, and one measurement clause, which this branch's own measurements (Tasks 1 and 2) make false and which becomes a pointer to §6. It states no measured result of its own and no decision of record: the measurement record and the spelling rule are Task 11's, in `docs/development.md`. Everything under `examples/notes-app/.claude/` and `examples/notes-app/sdlc-harness/` is a frozen capture and is not touched. `examples/notes-app/README.md` is this tree's prose *about* that capture, not part of it, so it is swept.

### Targets

- `docs/analyze.md`
- `docs/cli.md`
- `docs/config.md`
- `schemas/harness.config.schema.json`
- `schemas/negative/README.md`
- `examples/notes-app/README.md`

**Work:**

- [ ] **`docs/analyze.md`.** Qualify every `/harness-analyze`: the `**Who reads this:**` line, *"What that hand-off costs at run time, plainly"*, the dispatch-discipline paragraph and the `(d2)` paragraph. Keep every bold lead phrase byte-identical, because other files cite them.
- [ ] **`docs/cli.md`.** Qualify every `/harness-analyze`. That includes:
  - the `--analyze` flag row
  - *"The analysis is offered, and the offer defaults to yes"*
  - the four-numbered-steps paragraphs, including `/harness-analyze <target>`
  - the `findLayeredRoot` and candidate-root paragraphs
  - the `flat` fallback row
  - the `task-offer-rules`, `layer-profile` and `layer-drift` bullets in §7

  Where a sentence quotes a message `init` or `doctor` prints, confirm the quote now matches the source string Tasks 2–4 left.

  **The paste-line sentence (a wording change, not only a spelling).** In the paragraph opening *"The second step is the analyze command, in the vocabulary that command settles"*, rewrite the sentence *"It is spelled with the plugin prefix where the step above it is not, and the introducing sentence gives the reason: **the bare name is what a session's picker takes**, while a first message meets no picker and is matched exactly, so the bare form fails there with `Unknown command`."* Task 2 removed that reason from `init`'s printed introducing sentence (`pasteReason` is gone), so the doc must stop quoting it. The new sentence says the paste line and the step above it use the same qualified spelling, and cites `docs/development.md` → `## 5. Verifying a change` → gate 6 for the rule, which Task 11 records. 

  **The measurement clause (a wording change, not only a spelling).** The paragraph's next sentence reads *"That the prefixed form *succeeds* as a first message is the part not established: the only measurement in this tree is headless and negative on both spellings (`docs/development.md` §6), and the interactive form this line prints waits on the hand-run gate — if that comes back negative the line is dropped rather than respelled (`docs/analyze.md` §9)."* Keep its opening clause, up to and including the colon. Rewrite **only** the clause *"the only measurement in this tree is headless and negative on both spellings (`docs/development.md` §6)"*. It becomes a pointer that states no result, for example *"the headless first-message measurements this tree holds, of the analyze command and of the watcher's launch prompt, are recorded in `docs/development.md` §6"*. Do not restate what either probe returned: Task 1's and Task 2's records (see **Depends on**) are the facts, §6 is where Task 11 publishes them, and a restated result here would be a second copy that can disagree. Add no bare spelling. Keep everything after that clause byte-identical: *"and the interactive form this line prints waits on the hand-run gate"*, *"dropped rather than respelled"* with its `docs/analyze.md` §9 citation, and the next sentence, *"The printed sentence says so on **both** arms …"*. Task 2 kept `pasteUnconfirmed`'s statement and the two arms unchanged.
- [ ] **`docs/config.md`.** Qualify the `detection.review` row's *"written by `/harness-analyze`'s `layers` target"*.
- [ ] **`schemas/`.** In `harness.config.schema.json`, qualify the three `description` strings that name `'/harness-analyze'` (the `detection.review` object, `verdict`, `rationale`). Change no key and no constraint. In `schemas/negative/README.md`, qualify *"from a `doctor` run to `/harness-analyze`"*.
- [ ] **`examples/notes-app/README.md`.** Qualify the one bare occurrence, *"the closing offer to run `/harness-analyze` in the repository's first session"*. The offer names the same command, so the qualified spelling does not misstate the capture. Then rewrite the clause in rule 3 (*"An edited capture is no longer a capture"*) that says this file *"carries one bare occurrence above where it quotes the offer `init` put to the operator; `docs/development.md` §6 counts that occurrence and puts this file inside the prefix sweep for it"*. It now says this README spells the command qualified throughout, while the captured `.claude/` documents keep the bare spelling their run wrote, and it cites `docs/development.md` §6 for the sweep that ran. Keep the rest of rule 3 unchanged, including *"exactly one exception"*.

**Verification:**

- `grep -nE '(^|[^A-Za-z0-9_.}/:-])/(branch-([a-z-]*[a-z]|\*)|harness-analyze)([^A-Za-z0-9_./-]|$)' docs/analyze.md docs/cli.md docs/config.md schemas/harness.config.schema.json schemas/negative/README.md examples/notes-app/README.md` prints nothing.
- `grep -n 'where the step above it is not' docs/cli.md` returns nothing, and neither does `grep -n "the bare name is what a session's picker takes" docs/cli.md`.
- `grep -n 'headless and negative on both spellings' docs/cli.md` returns nothing.
- `grep -n 'dropped rather than respelled' docs/cli.md` and `grep -n 'says so on \*\*both\*\* arms' docs/cli.md` each still return the paste-line paragraph, so the clauses after the rewritten one survived.
- `git diff --stat -- examples/notes-app` lists `examples/notes-app/README.md` and no other path.
- `bash scripts/test.sh` exits 0. Gate 3 still validates the example configuration and refuses every negative fixture against the edited schema.
