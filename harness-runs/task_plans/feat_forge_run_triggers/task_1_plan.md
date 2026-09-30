### Task 1 — Declare the issue-trigger names and the `forgeTriggerApplies` predicate

**Goal:** Give every GitHub name the issue trigger uses one owner in `cli/src/remote/githubActions.ts`, and give the configuration model the one predicate that says whether the trigger applies. Everything later in this branch imports these or declares itself a mirror of them. This is the contract-before-consumer step (`.claude/context/conventions.md` → `### The order files are created, so a half-built feature is still coherent`).

**Where this task stops.** It declares names and one predicate and changes one sentence of the configuration check, and nothing reads the names yet. The workflow template is Task 12's, the generator that writes it Task 13's, the `doctor` checks Tasks 14 and 15's, and the shell mirrors (`remote-run.sh`, the template's header) belong to the tasks that write those files. The schema's `forge` description is Task 19's, because it sits in the catch-all layer.

### Targets

- `cli/src/remote/githubActions.ts` — the new names, and the module header's mirror list.
- `cli/src/config/model.ts` — `forgeTriggerApplies`, and the `forge` doc comments that say nothing reads the key.
- `cli/src/config/check.ts` — the `forge` `checkEnum` consequence sentence.
- `cli/test/remote-names.test.mjs` — cases for the new names.
- `cli/test/config-command.test.mjs` — a case for the new consequence sentence, only if an existing case asserts the old one (see Work).

**Work:**

- [ ] `githubActions.ts`: add, each with a one-line doc comment in the file's existing style:
  - `WORKFLOW_TRIGGER_FILE = 'harness-trigger.yml'`, and `WORKFLOW_TRIGGER_PATH = \`${WORKFLOWS_DIR}/${WORKFLOW_TRIGGER_FILE}\``;
  - `TRIGGER_LABEL_VARIABLE = 'HARNESS_TRIGGER_LABEL'`, the repository variable naming the label that starts a run;
  - `DEFAULT_TRIGGER_LABEL = 'harness'`, the label when that variable is unset or empty;
  - `TRIGGER_ALLOWED_BOTS_VARIABLE = 'HARNESS_TRIGGER_ALLOWED_BOTS'`, the comma-separated bot logins that may start a run, empty by default;
  - `TRIGGER_DISPATCH_EVENT_TYPE = 'harness-task'`, the `repository_dispatch` `event_type` the trigger workflow listens to.

  In the module header's **Shell and YAML mirrors** paragraph, add `cli/templates/github/workflows/harness-trigger.yml` to the mirror list; Task 12 creates that file and declares the mirror from its side. Extend the *"Except in `generators/repoRoot.ts`, nothing here is consulted unless … `remoteExecutionApplies(config)`"* sentence so that it says the trigger names are consulted only where `forgeTriggerApplies(config)` holds.
- [ ] `model.ts`: add `export function forgeTriggerApplies(config: HarnessConfig): boolean`, returning `config.forge === 'github' && remoteExecutionApplies(config)`. Give it a doc comment in `remoteExecutionApplies`' form. It is declared once because every consumer must agree: the trigger-workflow generator (Task 13), `doctor`'s `forge` and `remote-github` checks (Tasks 14 and 15), and, as the shell mirror, `hr_forge` plus `hr_execution_target` read by `remote-run.sh trigger` (Tasks 2 and 7). An absent `forge` is `false`, because an undecided key starts nothing. Rewrite the `FORGE_KINDS` and `DEFAULTS` doc comments where they say or imply that nothing reads `forge`: the key now has a reader for `github`, while `gitlab` and `none` write nothing. Keep the reasoning that the key has no default.
- [ ] `check.ts`: replace the `forge` `checkEnum` consequence sentence, *"The key is optional and nothing reads it in this release; …"*. The new sentence says that `github`, with `execution.target` `github-actions`, makes `init` write the issue-trigger workflow; that `gitlab` writes nothing in this release; that `none` records that the repository has no forge integration; and that an unset key is a decision not yet made. Update the header paragraph that lists what an unfilled `forge` costs, if it says nothing reads the key.
- [ ] `remote-names.test.mjs`: assert `WORKFLOW_TRIGGER_PATH` joins `WORKFLOWS_DIR` and `WORKFLOW_TRIGGER_FILE`, and pin the literal values of `TRIGGER_LABEL_VARIABLE`, `DEFAULT_TRIGGER_LABEL`, `TRIGGER_ALLOWED_BOTS_VARIABLE` and `TRIGGER_DISPATCH_EVENT_TYPE`. They are wires the YAML and shell mirrors spell byte for byte, so a rename must fail here first. Assert `forgeTriggerApplies` over the four cases that matter: `forge` absent → false; `github` with `execution.target` absent → false; `github` with `github-actions` → true; `none` with `github-actions` → false. Import it from `../dist/config/model.js`, as the file already imports from `dist`.
- [ ] Grep `cli/test` for the old consequence text: `grep -rn "nothing reads it in this release" cli/test`. If a case asserts it, update that case in its own file and name the file in your return. If none does, add no case.

**Verification:**

- `npm test -- test/remote-names.test.mjs` from `cli/` passes, and so does any file the grep above made you edit.
- `grep -n "nothing reads it in this release" cli/src/config/check.ts` finds only the `design.source` `checkEnum` consequence sentence (*"… set \"none\" to say the project has no design source of truth at all …"*), which this branch leaves untouched (Task 19's *Where this task stops*, scope register row 13); no hit sits inside the `forge` `checkEnum` call. `grep -rn "nothing reads it in this release\|nothing reads this key" cli/src --exclude=check.ts` finds no line that speaks of `forge` — in particular none in `cli/src/config/model.ts`'s `FORGE_KINDS` or `DEFAULTS` doc comments.
- `grep -n "forgeTriggerApplies" cli/src/config/model.ts` shows one `export function` and the doc comment naming its consumers.
