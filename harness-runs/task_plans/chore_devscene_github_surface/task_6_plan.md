### Task 6 — Respell the workflow names in the rest of `cli/src` and in `cli/README.md`

**Goal:** Respell every remaining old workflow file name in `cli/src`: the `doctor` help text, `init`'s flag summary and the module comments that cite a workflow or its template. Also respell the package README.

**Depends on:** Task 1 (the constants these modules import, so every message built from them already says `devscene-*.yml`, `@dev-scene`, `devscene` and `devscene: `), Task 2 (the renamed templates these comments cite as `cli/templates/github/workflows/devscene-run.yml` and siblings) and Task 5 (the generator, whose choices these comments cite).

**Where this task stops.** It changes only literal text: comments, the help line and the flag summary. Message texts already built from the Task 1 constants need no edit. The suites that assert these texts (`cli/test/doctor.test.mjs`, `cli/test/init.test.mjs`) are Tasks 8 and 9's.

### Targets

- `cli/src/commands/doctor.ts`
- `cli/src/commands/init.ts`
- `cli/src/core/writer.ts`
- `cli/src/core/yamlScalar.ts`
- `cli/src/doctor/checks.ts`
- `cli/src/doctor/sandboxPrerequisites.ts`
- `cli/src/machine/paths.ts`
- `cli/src/retrieval/runtime.ts`
- `cli/README.md`

**Work:**

- [ ] Printed text. In `commands/doctor.ts`, change the help line *"harness-run.yml and harness-resume.yml, which secret names are set …"* to name `devscene-run.yml` and `devscene-resume.yml`. In `commands/init.ts`, change the `--upgrade-workflows` `summary` (*"… when harness-run.yml was rendered for another"*) to `devscene-run.yml`, and respell the two doc comments naming `harness-run.yml` and `harness-control.yml`.
- [ ] `core/writer.ts`: respell the four re-run-table rows (`.github/workflows/devscene-run.yml`, `…/devscene-resume.yml`, `…/devscene-trigger.yml`, `…/devscene-control.yml`) and the paragraph after them. `core/yamlScalar.ts`: respell its header's `harness-run.yml` and `harness-resume.yml`.
- [ ] `doctor/checks.ts`: respell every workflow file name in the doc comments of the `remote-execution`, `remote-github` and forge checks. Leave every message built from `WORKFLOW_*` constants as it is, and leave the `sdlc-harness/` comment near the `stateDir` normalisation unchanged. `doctor/sandboxPrerequisites.ts`: respell the cited template path to `cli/templates/github/workflows/devscene-run.yml`.
- [ ] `machine/paths.ts` and `retrieval/runtime.ts`: respell each declared-mirror comment's template path to `cli/templates/github/workflows/devscene-run.yml`.
- [ ] `cli/README.md`: respell the two paragraphs that name the workflow files.

**Verification:**

- `grep -rnE "@sdlc-harness|!-- ?sdlc-harness|sdlc-harness(: |%3A)|harness-(trigger|run|control|resume)\.yml" cli/src cli/README.md` prints nothing.
- `grep -rnE "sdlc-harness([^/]|$)" cli/src` prints only `stateDir`-default lines (`config/model.ts`, `generators/claudeContext.ts`, `generators/harnessConfig.ts`, the `doctor/checks.ts` normalisation comment), none of which names a label.
