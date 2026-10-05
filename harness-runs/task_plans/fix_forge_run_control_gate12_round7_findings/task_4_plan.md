### Task 4 — `doctor --check-github` fails on a harness workflow GitHub lists by its path

**Goal:** Make `doctor --check-github` catch a workflow file GitHub could not parse. Gate 12 round 7 observed that GitHub lists such a workflow with its `name` equal to its `path` — `.github/workflows/harness-control.yml` rather than `harness-control`. In that round `doctor` still printed `GitHub knows harness-trigger.yml and harness-control.yml`, because `gh workflow view` answers for an unparsed file too. The `remote-github` check therefore reads the repository's workflow listing once. Any harness workflow listed by its path is a `FAIL`, naming the file and the route to a fixed copy. This check would have caught finding 1 at the round's setup.

**Depends on:** Task 2. It consumes, from `cli/src/generators/githubWorkflows.ts`:
- `unparseableControlRoute(version: string): string`, the one sentence naming the route for `harness-control.yml`. It is complete sentences ending in one `.`, with no line break.
- `pinnedCliCommand(version: string): string`, already imported by `cli/src/doctor/checks.ts`.

This task restates both signatures and spells neither sentence itself.

**Where this task stops.** It adds one GitHub read to `remote-github` and nothing else. It does not change:
- `remote-execution`, the offline check;
- `forge`;
- any existing grade.

Offline detection of the local file is deliberately out of scope: `init` already repairs the file or warns about it (Tasks 2 and 3).

### Targets

- `cli/src/doctor/checks.ts`: `REMOTE_GITHUB_CHECK` and its doc comment, plus one new endpoint constant beside `PR_SETTING_ENDPOINT`.
- `cli/test/doctor.test.mjs`: the `remote-github` cases.

**Work:**

- [ ] **`checks.ts`, the read.**
  - Add `const WORKFLOWS_ENDPOINT = 'repos/{owner}/{repo}/actions/workflows?per_page=100';` beside `ARTIFACT_RETENTION_ENDPOINT`.
  - In `REMOTE_GITHUB_CHECK`, ask `['api', WORKFLOWS_ENDPOINT]` once, through the existing `ask`, directly after the `resume` workflow view.
  - Decide which paths to judge: `WORKFLOW_RUN_PATH` and `WORKFLOW_RESUME_PATH` always, plus `WORKFLOW_TRIGGER_PATH` and `WORKFLOW_CONTROL_PATH` when `forgeTriggerApplies(ctx.config)`.
  - Parse `workflows[]` entries that carry a string `name` and a string `path`, on the model of the file's existing `…Of` readers, such as `retentionDaysOf`.
  - Grade the answer:
    - **`undefined`** (gh did not spawn) → `return fail(noSpawn)`, as every other read does;
    - **`unknown`**, **`refused`**, or an answer in a shape not read → a warning: `cannot tell whether GitHub could parse the harness workflows: …`, built through `cannotTell` where it applies. *Cannot tell* is not *missing*;
    - **a judged path whose entry has `name === path`** → push one failure per file:

      > GitHub lists `<path>` by its path rather than its name, which it does for a workflow file it cannot parse, so that workflow runs for no event: <route>

      `<route>` is `unparseableControlRoute(version)` for `WORKFLOW_CONTROL_PATH`. For any other path it is a sentence built here: check the file with actionlint, or re-render it with `` `${pinnedCliCommand(version)} init --force` ``, which keeps a `.bak`, then commit it and push it to the repository's default branch.

      `version` is this CLI's own (`ownManifestString('version')`, or the value `REMOTE_EXECUTION_CHECK` already reads).
- [ ] **`checks.ts`, the confirmation.** `triggerKnown` (`; GitHub knows harness-trigger.yml and harness-control.yml, and the label … exists`) is printed only when neither forge workflow was failed by the read above. A file GitHub could not parse is not one it knows in any sense that matters.
- [ ] **`checks.ts`, the doc comment.** Extend the grading list in `REMOTE_GITHUB_CHECK`'s comment:
  - `fail` gains "a harness workflow GitHub lists by its path, which is how it lists a file it could not parse";
  - `warn` gains the listing read that cannot tell.

  State why the listing and not `gh workflow view`: the view answers for an unparsed file too, as Gate 12 round 7 observed.
- [ ] **`doctor.test.mjs`.**
  - Add `workflows: ['api', 'repos/{owner}/{repo}/actions/workflows?per_page=100']` to the read table, in call order after `resume`. Give it a healthy answer naming each harness workflow by its name — `harness-run`, `harness-resume`, `harness-trigger`, `harness-control`, each with its `.github/workflows/<file>` path. These are the templates' own `name:` values.
  - Update every case that asserts the exact invocation list or a call count, such as `a complete setup passes…` and the `failing` table's counts, for the added read.
  - Add these cases:
    1. On a `forge: github` fixture, `harness-control` listed with `name` `.github/workflows/harness-control.yml` → `FAIL remote-github`, naming that path, `if: >-` and `init --force`, and exit non-zero. The line does **not** carry `GitHub knows harness-trigger.yml and harness-control.yml`.
    2. `harness-run.yml` listed by its path → `FAIL` naming it and `init --force`.
    3. The listing exits non-zero → a `cannot tell whether GitHub could parse` warning, and no fail from this read.
    4. The listing answers non-JSON → the same warning.
    5. On a fixture without `forge`, a listed-by-path `harness-control.yml` is not judged.
  - Name the rule in the suite's `remote-github` header comment.

**Verification:**

- From `cli/`, run `npm test -- test/doctor.test.mjs`, the test file this task edits. It passes.
- `bash scripts/typecheck.sh` exits 0.
- Grep `cli/src/doctor/checks.ts` for the words `if: >-` and find them only inside `unparseableControlRoute`'s output, never as a literal in this module.
- Case 1 is the acceptance criterion's `gh`-stub case. Confirm that its stub answer reproduces round 7's observation (`name` equal to `path`), not a contrived shape.
