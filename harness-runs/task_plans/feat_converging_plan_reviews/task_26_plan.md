### Task 26 — Add `gate-in-round` to `check-flow-graph.sh` and restate its FAIL-cycle check for round nodes

**Goal:** Make `scripts/check-flow-graph.sh` reject a graph whose failing gates have no decision point to close their round, hold the graph's `paths.revision_note` and the core's literal revision-note path together, keep `fail-cycle-capped` and `cap-matches-core` correct for the round node, and restate the two schema READMEs that describe the format.

**Depends on:** Task 25, whose `schemas/flow-graph-check/flow-graph-check-gate-in-round.json` (a format-2 graph with `plan_round` removed, so three gates' `FAIL` edges route forward with no round node) is this check's fixture, and whose schema defines the `round` kind (`gates`, `writer`, `counter`, `convergingFrom`, `plan`, `revisionNote`, `outcomes` `PASS` / `FAIL`). Task 2 (the format-2 template graph the default run checks). Task 11 (the core keeps `` `iteration >= 5` ``, `caps at 5 revisions` and `5-revision caps`, which `cap-matches-core` reads).

**Where this task stops.** `package.json` is Task 25's. This script reads the plugin documents at run time and copies none of them; that stays.

### Targets

- `scripts/check-flow-graph.sh`
- `schemas/flow-graph-check/README.md`
- `schemas/README.md`

**Work:**

- [ ] `THE CONTRACT`: add `8. gate-in-round — every dispatch node with a findingsFolder whose FAIL edge routes to a node and carries no increment is listed in the gates of exactly one round node, and every round node's gates and writer name dispatch nodes.` (one line per id, as `--negatives` reads them). Restate item 3, `fail-cycle-capped`, to say a round node's computed `FAIL` edge is an outcome edge like any other — it is already in the edge set the `graph_jq` program builds from `.outcomes`, so the definition changes and the program does not, unless the implementer finds otherwise, in which case the program changes with the text.
- [ ] Implement `gate-in-round` in `graph_jq` (one `gate-in-round\t<detail>` line per offending node, naming it), keeping every other check's output unchanged; `reaches-terminal` already counts an `onCap` `<escalate>` on any node's outcomes, the round node's included — confirm, and say so in item 2 if the wording needs it.
- [ ] `cap-matches-core` (item 7): unchanged anchors; confirm they still yield a value against Task 11's restated sizing sentence, and leave the item's text alone if they do.
- [ ] `schemas/flow-graph-check/README.md`: the fixture list gains `gate-in-round` and the format-2 note; `schemas/README.md`: *"its dispatch and terminal nodes"* becomes *dispatch, round and terminal nodes*.
- [ ] Extend `findings-folder-in-core` (item 6) to the second graph path its core also spells: when the graph carries `paths.revision_note`, render it with `{state_dir}` → `<state_dir>`, `{branch}` → `<branch>` and `{round}` → `<iteration>`; its directory part (`<state_dir>/plan_revisions/<branch>/`) must be a backticked path in the core's `## Setup (once per session)` step 2 table (Task 11's *Revision notes folder* row), and the full rendered path (`<state_dir>/plan_revisions/<branch>/task_plan_revision_<iteration>.md`) must appear as a fixed substring of the core's `## Loop` section (Task 11's dispatch blocks and revision prompt carry it inside `revision_note: …` / `Revision note: …` lines, so the match is not backtick-delimited). Each miss is one `findings-folder-in-core\trevision_note '<path>' is not in <core> …` line. Restate item 6's text to name both paths. No new contract id, so no new fixture: the existing `flow-graph-check-findings-folder-in-core.json` still fails with its own id. This holds Task 2's graph declaration and Task 11's literal together, as item 6 already does for `findingsFolder`.

**Verification:**

- `bash -n scripts/check-flow-graph.sh` exits 0 (syntax only; the script is not run).
- `grep -n "gate-in-round" scripts/check-flow-graph.sh` shows the new `THE CONTRACT` line `8. gate-in-round — …` and its emitting branch inside the `graph_jq` program (a `gate-in-round\t…` output line).
- `grep -n "revision_note\|plan_revisions" scripts/check-flow-graph.sh` shows the restated item 6 text and the extended `findings-folder-in-core` implementation reading `paths.revision_note`.
- `grep -n "gate-in-round\|format 2\|formatVersion" schemas/flow-graph-check/README.md` shows the fixture-list entry and the format-2 note; `grep -n "dispatch, round and terminal nodes" schemas/README.md` matches.
- Running the gate is not this task's: whether the template graph passes and whether each of the eight fixtures fails with its own check id are Run-gates gates 3e (`bash scripts/check-flow-graph.sh`) and 3f (`--negatives`), run once per Run gates round in Phase G (`plugin/instructions/unit_loop_core.md` → `## The test-run rule`, point 4).
