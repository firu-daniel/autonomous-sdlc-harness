### Task 8 — Name the walker in the cli package's adopter-facing text

**Goal:** Three pieces of text in the cli package enumerate the outer-loop set or say who its allow-listed members are run by. Make each of them name the walker, its gate library and the flow graph: the package README, the templates' `scripts/` README, and the unattended profile template's `_README`. Otherwise an adopter reading their `scriptsDir` meets a file no document mentions.

**Depends on:** Task 5, which ships `flow-walker.sh` (`0o755`, `agentInvocable: true`, granted in the profile's three forms), `lib/flow-walker-gates.sh` (`0o644`, sourced only) and `flows/task_plan_writing.graph.json` (`0o644`, data) into `scriptsDir`. It also widens `agentInvocable`'s meaning to *a dispatched agent or the orchestrating session*. This task describes those facts and changes none of them.

### Targets

- `cli/README.md`: the sentence enumerating *"the **outer-loop** shell assets — the run watcher, … the docs-retrieval server launcher and the library they share"*.
- `cli/templates/scripts/README.md`: the paragraph opening *"**The other family in this directory is not generated.**"*.
- `cli/templates/claude/settings.autonomous.json`: `_README` entry 7, opening *"THE OUTER-LOOP SCRIPTS AN AGENT RUNS ARE LISTED THE SAME THREE WAYS"*, which today says only the scripts *"a dispatched agent is itself the thing that runs"* are listed.

**Work:**

- [ ] `cli/README.md`: add the flow walker and its gate library to the outer-loop enumeration, and state in half a sentence that the planning flow's graph ships beside them under `flows/`. The enumeration already omits the scratch runner; add it in the same edit, since the sentence is being corrected anyway.
- [ ] `cli/templates/scripts/README.md`: add the walker, its library and `flows/task_plan_writing.graph.json` to the not-generated family. In one added sentence of the same shape as the existing *"**One of them runs a file it is given:**"*, say that the walker is run by the orchestrating session, prints the next routing step of the planning flow, and keeps machine-local state at `<state_dir>/.flow_walker_state`.
- [ ] `settings.autonomous.json` `_README` entry 7: change *"Only the ones a dispatched agent is itself the thing that runs are listed here"* so it covers the orchestrating session too, naming the flow walker as the one such script, which sits on the unattended planning path for the same reason the commit wrappers are in `allow` rather than `ask`. Edit `_README` text only. The `permissions` block and every `{{…}}` token are untouched, because the entries come from the rows.

**Verification:**

- `node -e "JSON.parse(require('fs').readFileSync('cli/templates/claude/settings.autonomous.json','utf8'))"` exits 0: the template still parses.
- `bash scripts/test.sh` exits 0. `cli/test/profile.test.mjs` renders this template, and a stray `{{` in the new text would fail its every-token-has-a-value check (`cli/src/core/templating.ts`).
- `git grep -n "flow-walker" cli/README.md cli/templates/scripts/README.md cli/templates/claude/settings.autonomous.json` reaches all three files. Each command an adopter is meant to run in the new text sits in a fenced block, one command per line, per the lessons ledger's *Adopter-facing documentation* rule.

**Deviations from plan:**
- `bash scripts/test.sh` exited 1, not 0: gate 4 (`npm test`, which includes `cli/test/profile.test.mjs`) passed, and the only failing gates were `1a plugin manifest` (unquoted `${CLAUDE_PLUGIN_ROOT}` in `plugin/hooks/hooks.json` commands, under `--strict`) and `6a no machine paths` (hits only in `harness-runs/` artifacts and the worktree's `.git` pointer file). No file this task touches shows up in either gate's output. So the "exits 0" claim rests on gate 4 passing, not on the whole script exiting 0.
- The new text names files and does not give an adopter any command to run, so it needs no fenced block.
