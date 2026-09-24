### 4. The shipped planning graph names a `plugin/` path. The checker's header says the design avoids exactly that, and every other template cites the plugin through `${CLAUDE_PLUGIN_ROOT}`

**File:** `cli/templates/scripts/flows/task_plan_writing.graph.json` (`description`) — "The routing of plugin/instructions/task_plan_writing_instructions_core.md as data"

**Problem.** `init` copies this graph byte for byte into the adopter's `scriptsDir`. Its `description` cites the planning core by this repository's own layout, `plugin/instructions/task_plan_writing_instructions_core.md`. That path does not exist in an adopting repository, because the plugin is installed elsewhere.

Two things in the tree say this should not happen:
- **The checker names the rule.** `scripts/check-flow-graph.sh` → `core_for_flow` says *"Held here, not in the graph, so a file shipped to adopters never names a plugin/ path."*. The shipped graph breaks that invariant in its second key.
- **Every other template follows it.** Everything else under `cli/templates/` that cites a plugin instruction writes it `${CLAUDE_PLUGIN_ROOT}/instructions/<file>`. Examples: `cli/templates/state-dir/review_plan_reviews/README.md`, `cli/templates/state-dir/dispatch_additions/README.md`, `cli/templates/state-dir/improvement_suggestions.md`. `grep -rnoE "(CLAUDE_PLUGIN_ROOT\}|plugin)/instructions/[a-z_]+\.md" cli/templates` finds this graph as the only `plugin/instructions/` hit.

The same `description` string is copied verbatim into the self-adopted mirror and into the 11 fixtures that are copies of the graph. Per their READMEs, each fixture differs from the graph by one change only, so all of them must change with it.

**Fix.** In each of these 13 files, replace the substring `The routing of plugin/instructions/task_plan_writing_instructions_core.md as data` with `The routing of ${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_core.md as data`, and change nothing else in the file:

- [ ] `cli/templates/scripts/flows/task_plan_writing.graph.json`
- [ ] `scripts/flows/task_plan_writing.graph.json` (the mirror; it must stay byte-identical to the template)
- [ ] `schemas/flow-graph-check/flow-graph-check-cap-matches-core.json`
- [ ] `schemas/flow-graph-check/flow-graph-check-fail-cycle-capped.json`
- [ ] `schemas/flow-graph-check/flow-graph-check-findings-folder-in-core.json`
- [ ] `schemas/flow-graph-check/flow-graph-check-ledger-id-known.json`
- [ ] `schemas/flow-graph-check/flow-graph-check-reachable-from-start.json`
- [ ] `schemas/flow-graph-check/flow-graph-check-reaches-terminal.json`
- [ ] `schemas/flow-graph-check/flow-graph-check-run-mode-id-known.json`
- [ ] `schemas/negative/flow-graph-schema-ask-without-resume.json`
- [ ] `schemas/negative/flow-graph-schema-skip-construct-mixed.json`
- [ ] `schemas/negative/flow-graph-schema-unknown-binding.json`
- [ ] `schemas/negative/flow-graph-schema-unknown-outcome.json`

The token is text inside a JSON string. `init` renders only `{{…}}` tokens and copies this file verbatim, so `${…}` passes through unchanged, as it does in the state-dir READMEs above.

**Verification:**
- `grep -rlF 'plugin/instructions/task_plan_writing_instructions_core.md as data' cli scripts schemas` prints nothing.
- `cmp cli/templates/scripts/flows/task_plan_writing.graph.json scripts/flows/task_plan_writing.graph.json` exits 0.
- `bash scripts/check-flow-graph.sh` and `bash scripts/check-flow-graph.sh --negatives` both exit 0.
- `npm run validate:flow-graph` and `npm run validate:flow-graph:negative` both exit 0.
- From `cli/`, `node --test test/outer-loop-scripts.test.mjs test/flow-walker.test.mjs test/flow-walker-ui-and-reentry.test.mjs` passes.
