### Task 9 — Declare `execution.keepAwake` in the schema and `docs/config.md` §5, and mirror the changed templates into `scripts/`

**Goal:** Finish the configuration key's four-place contract (schema, model, check, `docs/config.md` §5), and bring this repository's self-adopted `scripts/` copies of the two changed templates back to byte identity.

**Depends on:**

- **Task 1**, which put `keepAwake?: boolean` in `HarnessExecution` (`cli/src/config/model.ts`), `DEFAULTS.execution.keepAwake: true`, and the `checkBoolean` entry in `cli/src/config/check.ts`.
- **Task 2**, which finished `cli/templates/scripts/lib/harness-run-lib.sh`.
- **Task 4**, which finished `cli/templates/scripts/autonomous-watcher.sh`.

This task copies those two template files and edits neither.

**Where this task stops.** The prose in `docs/cli.md`, `docs/watcher.md` and `docs/remote-execution.md` is **Task 10**'s. This task adds no negative schema fixture: none exists for `execution.progressComments` either, and the check module's refusal is covered by Task 1's case.

### Targets

- `schemas/harness.config.schema.json` — `properties.execution.properties.keepAwake` and the `execution` description.
- `docs/config.md` — the `execution.keepAwake` row in `## 5. Key reference`.
- `docs/config.md` — the paragraph opening *"Remote execution splits along the same line."*: its sentence naming the one committed `execution` key besides `target` (Scope register row 31).
- `scripts/autonomous-watcher.sh` — byte copy of `cli/templates/scripts/autonomous-watcher.sh`.
- `scripts/lib/harness-run-lib.sh` — byte copy of `cli/templates/scripts/lib/harness-run-lib.sh`.

**Work:**

- [ ] **The schema property.** Add it after `progressComments`: `"keepAwake": { "type": "boolean", "default": true, "description": "Whether a run the local run watcher launches holds this host awake for the life of its engine process: on macOS through caffeinate -s -i -w, which holds on AC power only; on Linux through a logind sleep and lid-switch block lock, taken only while the host is on mains power. false holds nothing. Never held in a GitHub Actions job, on a GitHub Actions runner or under WSL2, where nothing can keep Windows awake. Read at run time from the main checkout by the run watcher, and by doctor's keep-awake check; an absent key is true." }`. Extend the `execution` object's description: replace *"Also holds one reporting switch, progressComments, read by the run job."* with *"Also holds two switches: progressComments, read by the run job, and keepAwake, read by the run watcher."*
- [ ] **The `docs/config.md` §5 row**, directly after `` `execution.progressComments` ``: `` | `execution.keepAwake` | boolean | `true` | … | ``. Its last cell says four things. A run the local watcher launches holds the host awake for its engine's life, on macOS AC power and Linux mains power only, so on battery a closed lid still suspends the run until wake. `false` turns the hold off, and the watcher's `status` line says so. Nothing is held in a GitHub Actions job or under WSL2. It is read at run time from the main checkout, never a run copy, and `doctor`'s `keep-awake` check reports it. The cell ends with a pointer to [`cli.md`](cli.md) §6, **What a host needs.**, for what each host needs. It carries no command: the fenced `config set` line is Task 10's, in that paragraph. **In the same file**, reword the sentence *"The one committed `execution` key besides `target` is `execution.progressComments`, because it decides what a run reports on its pull request rather than how or where the run executes."* in the paragraph opening *"Remote execution splits along the same line."*, which this branch falsifies. The new text names both committed sibling keys: `execution.progressComments`, because it decides what a run reports on its pull request, and `execution.keepAwake`, because it decides how a run executes on this host — whether the local watcher holds it awake — rather than what it reports. Neither is about **where** a run executes or **how** a remote one is set up, which is why both are committed keys rather than repository variables. Drop the old *"rather than how or where the run executes"* justification, since `keepAwake` is about how a run executes. Leave the rest of the paragraph unchanged.
- [ ] **The mirror.** Copy both templates over their `scripts/` counterparts byte for byte, keeping each file's mode. `scripts/` is this repository's self-adopted `init` output, kept identical to `cli/templates/scripts/` (task prompt, *Constraints*). Change nothing else under `scripts/`.

**Verification:**

- `jq -e '.properties.execution.properties.keepAwake | .type == "boolean" and .default == true' schemas/harness.config.schema.json` prints `true`, which also shows the file still parses as JSON.
- `jq -e '.properties.execution.additionalProperties == false' schemas/harness.config.schema.json` prints `true`, so the property was added inside the closed object, not beside it.
- `cmp cli/templates/scripts/autonomous-watcher.sh scripts/autonomous-watcher.sh` and `cmp cli/templates/scripts/lib/harness-run-lib.sh scripts/lib/harness-run-lib.sh` both exit 0.
- `git grep -n 'execution.keepAwake' -- docs/config.md` hits the new row and the reworded *"Remote execution splits along the same line."* paragraph.
- `git grep -n 'The one committed `execution` key besides' -- docs/config.md` has no hit.
