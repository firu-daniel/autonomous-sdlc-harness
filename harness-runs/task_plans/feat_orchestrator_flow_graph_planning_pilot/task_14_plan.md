### Task 14 — Wire the flow-graph checks into `scripts/run-gates.sh` and `docs/development.md` §5

**Goal:** Make `bash scripts/run-gates.sh`, which `commands.test` runs, run the flow-graph gates on every invocation: the schema validation, the schema negatives, the seven static checks and the check negatives. Document them in `docs/development.md` → `## 5. Verifying a change`, whose gates are the definition of done for this tree. A reviewer reading a green run has then read the flow graph's checks too.

**Depends on:** Task 13 and Task 12. **Task 13** writes `scripts/check-flow-graph.sh`: no argument checks the planning graph, `--negatives` proves each of its seven checks against its fixture in `schemas/flow-graph-check/`, and the exits are 0 clean / 1 findings on stderr / 2 usage. **Task 12** adds the `package.json` scripts `validate:flow-graph` (the graph plus the seven `schemas/flow-graph-check/flow-graph-check-*.json` fixtures validate) and `validate:flow-graph:negative` (the four `schemas/negative/flow-graph-schema-*.json` documents are each read and rejected).

**Where this task stops.** It wires and documents. It changes no check, and it adds no hand-run gate.

### Targets

- `scripts/run-gates.sh`: the `== gate 3 — configuration schema` block.
- `docs/development.md`: the `**Gate 3 — configuration schema.**` paragraph.

**Work:**

- [ ] In `scripts/run-gates.sh`, extend gate 3 with four arms through the existing `gate` helper, which grades each by its exit status and never through a pipe:
  - `gate "3c flow graph validates" npm run validate:flow-graph`
  - `gate "3d flow-graph negative fixtures are refused" npm run validate:flow-graph:negative`
  - `gate "3e flow graph static checks" bash scripts/check-flow-graph.sh`
  - `gate "3f each flow-graph check refuses its fixture" bash scripts/check-flow-graph.sh --negatives`

  Rename the echo heading to `== gate 3 — configuration and flow-graph schemas`. The header's *"six a process can run unattended"* count is unchanged: these are arms of an existing gate.
- [ ] In `docs/development.md` → `**Gate 3 — …**`, add the two `npm run` lines and the two `bash scripts/check-flow-graph.sh` lines to the fenced block, one command per line (the lessons ledger's *Adopter-facing documentation* rule). Follow it with one paragraph that says:
  - what each command asserts;
  - that `--negatives` fails when a fixture passes **or** fails on another check's id;
  - that the check ids are `scripts/check-flow-graph.sh`'s `THE CONTRACT` and are not restated here;
  - where the two fixture families live: the schema negatives in `schemas/negative/`, rejected by the schema, and the check fixtures in `schemas/flow-graph-check/`, schema-valid by design and rejected by the checker, one check each;
  - that the checker reads `plugin/instructions/run_mode_instructions.md`'s closed set, `plugin/instructions/autonomous_pause_and_ledger.md` §1.3's task-engine template and the planning core's `## Setup` table and cap sentences at run time rather than copying any of them.

  Rename the paragraph's bold lead to match the new echo heading.

**Verification:**

- `bash scripts/run-gates.sh` exits with no **new** failure against the branch's merge base: arms 3c–3f print `ok`. Compare the `FAIL` lines against a run of the merge base's `scripts/run-gates.sh` from a scratch worktree, never from this checkout's own main folder. The acceptance line reads *"`bash scripts/run-gates.sh` prints no new failure"*.
- Break the planning graph's `FAIL`-edge `increment` in a scratch **copy**, point `check-flow-graph.sh` at it, and arm 3e's command exits 1. Revert.
- `bash scripts/check-llms-txt.sh` and `bash scripts/check-command-spelling.sh` still exit 0 after the `docs/development.md` edit.
