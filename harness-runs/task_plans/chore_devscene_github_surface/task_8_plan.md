### Task 8 — Respell the `doctor` suite

**Goal:** Make `cli/test/doctor.test.mjs` assert the new names in `doctor`'s workflow and label checks, the `gh label create` remedy included.

**Depends on:**
- Task 1: every `doctor` message naming a workflow, the trigger label or the handle is built from `WORKFLOW_*_FILE` / `WORKFLOW_*_PATH` (`devscene-*.yml`), `DEFAULT_TRIGGER_LABEL` (`devscene`) and `COMMAND_HANDLE` (`@dev-scene`). So the remedy now reads `` `gh label create devscene` `` and the pass line reads *"GitHub knows devscene-trigger.yml and devscene-control.yml, and the label `devscene` exists"*.
- Task 2: the trigger template's fallback `(vars.HARNESS_TRIGGER_LABEL || 'devscene')`, which this suite rewrites to simulate an earlier release.
- Task 5: `unparseableControlRoute`'s *"replaces a devscene-control.yml that 0.6.1 wrote"*.
- Task 6: the `doctor` help line naming `devscene-run.yml` and `devscene-resume.yml`.

**Where this task stops.** It edits only this suite. `cli/src/doctor/checks.ts` is unchanged by this task.

### Targets

- `cli/test/doctor.test.mjs`

**Work:**

- [ ] Respell every workflow file name and `.github/workflows/…` path the suite writes, stubs or asserts. That includes the `gh workflow list` / `workflow view` stub answers and the workflow `name` list (`['devscene-run', 'devscene-resume', 'devscene-trigger', 'devscene-control']`).
- [ ] Respell the trigger-label literals:
  - the stubbed label listings (`{ name: 'devscene' }`, `'{"name":"devscene"}'`);
  - the pass-line assertions (*"… and the label `devscene` exists"*, *"cannot tell whether the label `devscene` exists"*);
  - the missing-label remedy (*"no label `devscene` exists, so nobody can apply it: `gh label create devscene`"*);
  - the forge-workflow pass line (*"HARNESS_TRIGGER_LABEL label (default `devscene`) starts a task run"*);
  - the doc comment on the trigger-read helper.
- [ ] In the earlier-release case, rewrite `(vars.HARNESS_TRIGGER_LABEL || 'devscene')` into `(vars.HARNESS_TRIGGER_LABEL || 'harness')`. Change its failure message to *"carries no devscene fallback"*. Expect *"re-renders it and the scripts to `devscene`"*. The `'harness'` side is `LEGACY_TRIGGER_LABEL` and stays.
- [ ] Respell every handle and marker literal the suite asserts, such as the mention-credential warning's `` `@dev-scene` ``. Leave `const STATE_DIR = 'sdlc-harness'` and the `'.sdlc-harness'` dot-named-`stateDir` case unchanged.

**Verification:**

- `npm test --workspace cli -- test/doctor.test.mjs` passes.
- `grep -nE "@sdlc-harness|!-- ?sdlc-harness|sdlc-harness(: |%3A)|harness-(trigger|run|control|resume)([^-a-z]|$)|label[^.]{0,20}sdlc-harness|'sdlc-harness' \}|\"sdlc-harness\"" cli/test/doctor.test.mjs` prints nothing.
- `grep -n "sdlc-harness" cli/test/doctor.test.mjs` prints only the `STATE_DIR` constant and the dot-named `stateDir` case.
