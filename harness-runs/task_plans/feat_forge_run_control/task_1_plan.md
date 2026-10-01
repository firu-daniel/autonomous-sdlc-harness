### Task 1 — Declare the run-control names and their shell mirrors

**Goal:** Give every name run control is built from one owner, `cli/src/remote/githubActions.ts`, and add their byte-for-byte mirrors to `cli/templates/scripts/remote-run.sh` now, so every later task spells each one through a variable rather than a literal. The rule is the module's own: *"every remote-execution name has one owner, and a copy anywhere else in `cli/src` imports it"* (its header). `cli/src/config/model.ts` → `forgeTriggerApplies` becomes, in its doc comment, the switch for the whole forge coupling, not the trigger alone.

**Where this task stops.** It declares names and mirrors and changes no behaviour. Nothing reads the new shell variables until Task 3 (`STATE_LABEL_PREFIX`, `RUN_STATES`, `COMMENT_MARKER`), Task 10 (`COMMAND_HANDLE`, `COMMAND_VERBS`) and Task 13 (`REVIEW_ROUND_STATE`). The workflow file is Task 15's, and the generator that writes it is Task 16's. The default trigger label is **not** changed here; that is Task 2's.

### Targets

- `cli/src/remote/githubActions.ts` — the new constants and the header's gating sentence.
- `cli/src/config/model.ts` — the doc comments of `forgeTriggerApplies` and `FORGE_KINDS`.
- `cli/templates/scripts/remote-run.sh` — the shell assignments and the header's `MIRRORS OF` table.
- `cli/test/remote-names.test.mjs` — the literal values and the shell mirrors.

**Work:**

- [ ] **`githubActions.ts`**, beside the trigger names, each with a one-line doc comment:
  - `WORKFLOW_CONTROL_FILE = 'harness-control.yml'` and `WORKFLOW_CONTROL_PATH = \`${WORKFLOWS_DIR}/${WORKFLOW_CONTROL_FILE}\``: the workflow that turns a comment command or a review into a harness action.
  - `COMMAND_HANDLE = '@sdlc-harness'`: the first word of a command comment, matched case-insensitively.
  - `COMMAND_VERBS = ['answer', 'pause', 'resume', 'stop', 'clear'] as const`, and `type CommandVerb = (typeof COMMAND_VERBS)[number]`.
  - `COMMENT_MARKER = '<!-- sdlc-harness'`: the prefix of the hidden line every harness comment carries. The whole line is `<!-- sdlc-harness event=<event> branch=<branch>[ question=<n>] -->`. A comment containing the prefix anywhere is never a command.
  - `REVIEW_ROUND_STATE = 'changes_requested'`: the `review.state` that starts a round, lowercase as the webhook payload carries it (research C1).
  - `STATE_LABEL_PREFIX = 'sdlc-harness: '`, `RUN_STATES = ['running', 'parked', 'paused', 'done', 'failed', 'stopped'] as const`, `type RunState`, and `STATE_LABELS: Readonly<Record<RunState, string>>`, a total record built from the prefix. Totality makes adding a state a compile error until every table is extended (`.claude/context/conventions.md` → *the shared constants have owners*).
- [ ] **The header**: the gated-tighter sentence names the new run-control names as consulted only where `forgeTriggerApplies(config)` holds, and the shell-and-YAML mirror list names `cli/templates/github/workflows/harness-control.yml`, which Task 15 creates. **`model.ts`**: `forgeTriggerApplies`'s doc says it switches on the whole forge coupling — the trigger and control workflows, lifecycle comments, state labels and the draft pull request. Its consumers are listed as the workflow generator, `doctor`'s `forge` and `remote-github` checks, and the shell mirror `hr_forge` plus `hr_execution_target` in `remote-run.sh`'s `trigger`, `control`, `report` and `deliver`. `FORGE_KINDS`'s *"`github` has a reader"* sentence is restated to match. The function's name and body are unchanged: it is imported in several places.
- [ ] **`remote-run.sh`**: after `TRIGGER_DISPATCH_EVENT_TYPE=…`, add the assignments, each a single-quoted literal:
  - `WORKFLOW_CONTROL_FILE='harness-control.yml'`;
  - `COMMAND_HANDLE='@sdlc-harness'`;
  - `COMMAND_VERBS='answer pause resume stop clear'`, space-separated;
  - `COMMENT_MARKER='<!-- sdlc-harness'`;
  - `REVIEW_ROUND_STATE='changes_requested'`;
  - `STATE_LABEL_PREFIX='sdlc-harness: '`;
  - `RUN_STATES='running parked paused done failed stopped'`, space-separated, in the TypeScript order.

  Add one `MIRRORS OF` row per name.
- [ ] **`remote-names.test.mjs`**: the path-join case gains `WORKFLOW_CONTROL_PATH`. A literal-values case asserts each new value. A mirror case reads `templates/scripts/remote-run.sh` and asserts each assignment line byte for byte, built from the imported constant (`COMMAND_VERBS.join(' ')`, `RUN_STATES.join(' ')`), so a rename on either side fails here first. Assert also that `STATE_LABELS[state] === STATE_LABEL_PREFIX + state` for every `RUN_STATES` member.

**Verification:**

- `npm test -- test/remote-names.test.mjs` from `cli/` passes.
- `bash -n cli/templates/scripts/remote-run.sh` exits 0.
- `git grep -n -e "'harness-control.yml'" -e "'@sdlc-harness'" -e "'sdlc-harness: '" -e "'<!-- sdlc-harness'" -- cli/src` has every hit inside `cli/src/remote/githubActions.ts`: no second owner of a literal in the package.
