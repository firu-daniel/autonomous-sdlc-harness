### Task 2 — Make `sdlc-harness` the default trigger label, keeping `harness` working until a re-render

**Goal:** With no `HARNESS_TRIGGER_LABEL` set, labelling an issue `sdlc-harness` starts a run (acceptance 9; decided by the maintainer, 2026-10-01). `harness` is a generic word a repository may already use for something else, and `sdlc-harness` matches the `@sdlc-harness` command handle. A repository wired by the previous release keeps working with `harness` until it re-renders, however its scripts and workflow got out of step.

**Depends on:** Task 1, only for the mirror-table layout it extends; no name of Task 1's is read here.

**The upgrade path this task implements.** The committed `harness-trigger.yml` carries no version pin, so `init --upgrade-workflows` never re-renders it (`docs/remote-execution.md` → `### Upgrading`). A repository wired by the previous release therefore keeps a workflow whose `if:` falls back to `harness` and whose `env:` passes `HARNESS_TRIGGER_LABEL: ${{ vars.HARNESS_TRIGGER_LABEL }}`, empty when the variable is unset. The rule:

- The **new** workflow always passes a non-empty label: `HARNESS_TRIGGER_LABEL: ${{ vars.HARNESS_TRIGGER_LABEL || 'sdlc-harness' }}`, the same fallback as its `if:`. Its job therefore never relies on the script's default.
- The **script**, when `HARNESS_TRIGGER_LABEL` is empty, accepts either `DEFAULT_TRIGGER_LABEL` or `LEGACY_TRIGGER_LABEL`. Only the previous release's workflow passes an empty label, and that workflow's `if:` already ran the job for `harness`. So an old workflow keeps starting runs on `harness` whether or not `init --force` has replaced the scripts, and a new workflow is never woken by `harness` unless the variable names it.
- `init --force` replaces the workflow and the scripts together, after their `.bak`s; from then on the default is `sdlc-harness`. Setting `HARNESS_TRIGGER_LABEL` to `harness` keeps the old name under either.

**Where this task stops.** How `doctor --check-github` reports a label that does not match the committed workflow's fallback is Task 18's, which reads `LEGACY_TRIGGER_LABEL` from here. The adopter-facing statement of the upgrade path is Task 26's. The state labels are Task 3's.

### Targets

- `cli/src/remote/githubActions.ts` — `DEFAULT_TRIGGER_LABEL` and the new `LEGACY_TRIGGER_LABEL`.
- `cli/templates/scripts/remote-run.sh` — the mirror assignments, the `trigger` label match, the header's `trigger` paragraph, the mirror table and the REPRO.
- `cli/templates/github/workflows/harness-trigger.yml` — the `if:` fallback, the job's `HARNESS_TRIGGER_LABEL` env line, and the header.
- `cli/test/remote-names.test.mjs`, `cli/test/remote-trigger.test.mjs`, `cli/test/trigger-workflow-init.test.mjs`, `cli/test/workflow-templates.test.mjs`, `cli/test/doctor.test.mjs` — every assertion spelling the old default.

**Work:**

- [ ] **`githubActions.ts`**: `DEFAULT_TRIGGER_LABEL = 'sdlc-harness'`. Add `LEGACY_TRIGGER_LABEL = 'harness'`, documented as the previous release's default, which the trigger still accepts when its workflow passes no label. `init`'s `gh label create ${DEFAULT_TRIGGER_LABEL} …` line (`cli/src/commands/init.ts` → `reportGithubSteps`) and `doctor`'s `forge` and `remote-github` texts already read the constant, so they change with it; edit neither file here.
- [ ] **`remote-run.sh`**: `DEFAULT_TRIGGER_LABEL='sdlc-harness'`, plus `LEGACY_TRIGGER_LABEL='harness'` and its `MIRRORS OF` row. In `verb_trigger`, keep `trigger_label="${HARNESS_TRIGGER_LABEL:-$DEFAULT_TRIGGER_LABEL}"`. When `HARNESS_TRIGGER_LABEL` is empty and the event's label equals `LEGACY_TRIGGER_LABEL`, set `trigger_label` to it, so the comment's wording and the `--remove-label` both name the label actually applied. Any other label is still ignored with one line and no `gh` call. Restate the header's `HARNESS_TRIGGER_LABEL` line, and add one paragraph stating the rule above. Update the REPRO event and its `--remove-label` line to `sdlc-harness`.
- [ ] **`harness-trigger.yml`**: `if: github.event_name == 'repository_dispatch' || github.event.label.name == (vars.HARNESS_TRIGGER_LABEL || 'sdlc-harness')`, and the job `env:` line `HARNESS_TRIGGER_LABEL: ${{ vars.HARNESS_TRIGGER_LABEL || 'sdlc-harness' }}`, spaced after its opening braces (`TWO RULES EVERY EDIT KEEPS`). In the header, `THE EVENTS` names `sdlc-harness` as the unset default and says the job passes the label it matched. `DECLARED MIRRORS` names `DEFAULT_TRIGGER_LABEL (\`sdlc-harness\`)`.
- [ ] **Tests.**
  - `remote-names.test.mjs`: the literal values `sdlc-harness` and `harness`, and both shell assignment lines.
  - `workflow-templates.test.mjs`: the `if:` assertion keeps building its expected line from the imported constant, and a new assertion covers the `env:` line in the same way.
  - `trigger-workflow-init.test.mjs`: `LABEL_COMMAND` becomes `gh label create sdlc-harness --description "Start a harness run from this issue"`.
  - `doctor.test.mjs`: every literal `harness` label in the trigger cases — `answerTriggerGh`'s default label answer, the `the label \`harness\` exists` and `no label \`harness\` exists … gh label create harness` expectations, and the `(default \`harness\`)` forge line — becomes `sdlc-harness`.
  - `remote-trigger.test.mjs`: events and `--remove-label` assertions use `sdlc-harness`. Three cases are new:
    - `HARNESS_TRIGGER_LABEL` empty and the label `harness` → started, and the removal names `harness`;
    - `HARNESS_TRIGGER_LABEL=sdlc-harness` and the label `harness` → ignored, with no `gh` call;
    - `HARNESS_TRIGGER_LABEL=harness` and the label `harness` → started.
- [ ] Header of `remote-trigger.test.mjs`: one sentence stating the legacy rule it now enforces.

**Verification:**

- `npm test -- test/remote-names.test.mjs test/remote-trigger.test.mjs test/trigger-workflow-init.test.mjs test/workflow-templates.test.mjs test/doctor.test.mjs` from `cli/` passes.
- `bash -n cli/templates/scripts/remote-run.sh` exits 0.
- `git grep -n "'harness'" -- cli/src cli/templates/scripts/remote-run.sh cli/templates/github/workflows/harness-trigger.yml` has no hit outside the two `LEGACY_TRIGGER_LABEL` assignments: no other code line still spells the old default.
