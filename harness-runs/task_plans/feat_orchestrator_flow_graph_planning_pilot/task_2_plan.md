### Task 2 — Add a `phases.*` reader to the outer-loop library

**Goal:** Give the outer-loop shell library one typed reader for the three phase toggles, `hr_phase_enabled <repo_root> <phase>`. The walker can then evaluate a `phases.*` gate against the **live** `harness.config.json` at the moment it reaches that gate. Today every outer-loop script reads configuration only through `cli/templates/scripts/lib/harness-run-lib.sh`, and no reader there covers `phases`.

**Where this task stops.** This task adds the reader and nothing that calls it. The walker's gate library that calls it is **Task 3**. This checkout's own mirror at `scripts/lib/harness-run-lib.sh` is refreshed by **Task 15**, not here, because that file is the `general` layer's.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh`: extend the single `jq` load program in `hr_config_load`, add the reader, and extend the header's reader list and its `REPRO` block.

**Work:**

- [ ] Emit three more scalar keys from the one `jq` program in `hr_config_load`, in the same `s("<key>"; try … catch null)` form the neighbouring keys use: `phases.parity`, `phases.qa` and `phases.docs`. Add no second `jq` process: the header's *"one `jq` per process"* cache note is the reason. A boolean `false` is emitted as the string `false`. An absent key or a `null` is not emitted at all, which is the existing `s()` behaviour.
- [ ] Add `hr_phase_enabled <repo_root> <phase>` beside the typed readers under the `# Typed readers.` banner. It follows the library's three-state contract (`# THE THREE-STATE ANSWER`):
  - returns 0 when the value is `true`;
  - returns 1 when it is `false` or unset (*"an unset flag is false"*, the rule `plugin/instructions/autonomous_pause_and_ledger.md` §1.3 writes on the ledger's `phases:` line);
  - returns 2 when the configuration is unresolvable, when `<phase>` is not one of `parity` / `qa` / `docs`, or when the stored value is neither `true` nor `false` (a value the schema forbids, which the reader refuses to guess about).

  It prints nothing. Bash 3.2 and jq 1.5 are the floors (`# BASH 3.2 IS THE FLOOR`, `# JQ 1.5 IS THE FLOOR`), the `hr_` prefix is the naming rule, and the file still sets no shell option (`.claude/context/conventions.md` → `## Shell assets`).
- [ ] Extend the header's `# THE SAME THREE STATES REACH EVERY TYPED READER` list with `hr_phase_enabled`. Add three `REPRO` lines, each against a throwaway fixture: `true` → 0, key absent → 1, `"phases": {"qa": "yes"}` → 2.

**Verification:**

- Source the library in a throwaway `git init` fixture carrying a `harness.config.json` (never this checkout), and run each `REPRO` line added above. Each exit status matches the line's own stated answer.
- `bash cli/test/…` is not the gate here, because no suite calls the reader yet. `npm test` stays green, since `cli/test/outer-loop-scripts.test.mjs` executes the library directly (its header's choice 3: *"running it directly must define its functions and do nothing else"*).
- Grep the file for a second `jq -n` invocation and find exactly the existing one.
