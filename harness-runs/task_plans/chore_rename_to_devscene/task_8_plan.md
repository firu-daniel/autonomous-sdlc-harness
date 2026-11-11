### Task 8 — Respell the `doctor` suite

**Goal:** `cli/test/doctor.test.mjs` expects every remedy, label, machine path and command name `doctor` now prints under the new names, and passes against the renamed CLI.

**Depends on:** Tasks 1–7. The suite pins `doctor`'s messages from `cli/src/doctor/checks.ts` and `cli/src/commands/doctor.ts` (Task 2, `CLI = 'npx devscene'`, the `/devscene:branch-resume` and `/devscene:branch-qa-test` remedies), and `ANALYZE_COMMAND` and the machine directory and launchd label (Task 1). It plants the retrieval cache through `cli/test/helpers/fixture.mjs` (Task 7, `<cacheHome>/devscene/retrieval`). It also pins the `STALE_PIN` line, which the watcher and workflow templates spell as `devscene@<version> doctor` (Tasks 4 and 5).

### Targets

- `cli/test/doctor.test.mjs`

**Work:**

- [ ] Constants: `MACHINE_DIR = 'devscene'`, `SEEDED_LABEL = 'com.devscene.watcher.seeded-by-the-doctor-suite'`, `ANALYZE_COMMAND = '/devscene:harness-analyze'`, `REMEDY = 'npx devscene init'`, and the two layer-gap remedy strings (`/devscene:harness-analyze` and `npx devscene config set layers`).
- [ ] Assertions: every `/npx autonomous-sdlc-harness …/` regular expression and `includes('…')` literal becomes its `devscene` spelling. That covers `init`, `init --force`, `config set layers`, `doctor --check-github`, `/devscene:branch-resume`, `/devscene:branch-qa-test` and `devscene@${STALE_PIN} doctor`. A bare `includes('autonomous-sdlc-harness')` becomes `includes('devscene')`, and the retrieval-cache `rm(join(cacheHome, …))` becomes `devscene`.
- [ ] Comments naming the product, such as the `setup-analysis` note and the `/devscene:harness-analyze layers` record, respelled. The negative assertion `!line.includes('`npx devscene doctor --check-github` asks GitHub')` is respelled too, so it still tests something.
- [ ] Run the suite: `npm test --workspace cli -- test/doctor.test.mjs` from the checkout root, as one plain foreground command.

**Verification:**

- `doctor.test.mjs` passes.
- `git grep -n -F 'autonomous-sdlc-harness' -- cli/test/doctor.test.mjs` prints nothing.
