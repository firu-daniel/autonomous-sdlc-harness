### Task 14 — Add the `doctor` check `forge`, the key's reporter

**Goal:** Give `forge` the reporter `ARCHITECTURE.md` → `## 8. Declaring a seam before building it` requires of a declared seam: something that observes the configured state and says so, including the state *not yet decided*. Today the configuration check speaks only when the key is present and outside its enum (`checkEnum` returns on an absent key), and `doctor` has no check of its own (`docs/development.md` → `## 6.`'s standing debt). The new check, `forge`, grades from local evidence only and asks GitHub nothing; Task 15 adds the GitHub half under `--check-github`.

**Depends on:**

- Task 1's `forgeTriggerApplies(config)` and `remoteExecutionApplies(config)` (`cli/src/config/model.ts`), and `WORKFLOW_TRIGGER_PATH`, `TRIGGER_LABEL_VARIABLE` and `DEFAULT_TRIGGER_LABEL` (`cli/src/remote/githubActions.ts`).
- Task 13, which makes `init` write `WORKFLOW_TRIGGER_PATH` exactly when `forgeTriggerApplies` holds, so this check's remedy *"re-run init"* is true.

**Where this task stops.** It reads files, one git ref and the configuration, and spawns no `gh`. Whether GitHub knows the trigger workflow, and whether the label exists, are Task 15's. It fails nothing: no `forge` state stops a run, because the inbox path works whatever the key says. So its worst grade is `warn`.

### Targets

- `cli/src/doctor/checks.ts` — `FORGE_CHECK`, registered in `CHECKS` directly after `REMOTE_GITHUB_CHECK`.
- `cli/test/doctor.test.mjs` — one case per graded state.

**Work:**

- [ ] **`FORGE_CHECK`**, id `forge`, title *"the configured forge, and what starts a run from it"*, with a doc comment in the style of `REMOTE_EXECUTION_CHECK`'s. The comment states that this is the key's reporter and why every state is named, the absent one included. Unevaluated when `ctx.repoRoot` or `ctx.config` is undefined, with the same sentences the neighbouring checks use.
- [ ] **The grades**, each a complete sentence naming the next step:
  - `forge` absent → `pass`: the decision is not yet made. Nothing starts a run from an issue. `npx autonomous-sdlc-harness config set forge github` (with `execution.target` `github-actions`) turns the issue trigger on, and `none` records that the repository has no forge integration.
  - `none` → `pass`: no forge integration. When `WORKFLOW_TRIGGER_PATH` exists anyway, add that it is present and unused, as `REMOTE_EXECUTION_CHECK` says of workflows left in place.
  - `gitlab` → `pass`: this release has no GitLab trigger. GitLab has no issue-label pipeline trigger and needs a webhook relay calling GitHub's `repository_dispatch` or a pipeline trigger (research T6). Nothing is written. Cite `docs/github-integration-research.md` → T6, which exists today, rather than a document a later task writes.
  - `github` with remote execution off → `warn`: no trigger workflow is written. A run started from GitHub always executes through `harness-run.yml`, because GitHub cannot reach this machine. Set `execution.target` `github-actions`, and to run such runs on your own hardware, register a self-hosted runner and name it in `HARNESS_RUNNER` (`docs/remote-execution.md` → `## 8. Choosing a runner`).
  - `github` with remote execution on and `WORKFLOW_TRIGGER_PATH` absent → `warn`: labelling an issue starts nothing. Re-run `init`, which writes it create-if-absent.
  - `github`, on, present, but `origin/<defaultBranch>` not carrying it → `warn`, reusing `REMOTE_EXECUTION_CHECK`'s push remedy from `core/defaultBranchPush.ts` (`WORKFLOW_SCOPE_COMMAND`, `defaultBranchPushCommand`, both reasons). GitHub runs an `issues` workflow only from the default branch (research T1). The same *not graded* notes as that check apply when `defaultBranch` is unusable or `origin/<defaultBranch>` is absent.
  - `github`, on, present and pushed → `pass`: labelling an issue with `HARNESS_TRIGGER_LABEL`'s label (default `harness`) starts a task run. Name what this cannot see — the label's existence and whether GitHub knows the workflow — and that `doctor --check-github` asks.

  Draft-pull-request output and comment park-and-ask are not graded, because nothing implements them yet. The `pass` text for `github` names them as the parts still to come, so the reporter never implies the whole coupling exists.
- [ ] **Registration**: add `FORGE_CHECK` to `CHECKS` directly after `REMOTE_GITHUB_CHECK`. Extend the module header's check inventory, if it lists checks, in the same edit.
- [ ] **`doctor.test.mjs`**: one case per grade above, each asserting the report line's grade and a distinguishing substring through the file's existing `reportLine` helper, driven against fixtures `init` wired with the configuration edited for the case. Where the file asserts the order of check ids (for example `ids[ids.indexOf('daemon-path') + 1]`), add one assertion that `forge` follows `remote-github`. If a case asserts a total check count or an exact `Summary:` line, update that case and say so in your return.

**Verification:**

- `npm test -- test/doctor.test.mjs` from `cli/` passes.
- `commands.typecheck` (`bash scripts/typecheck.sh`) exits 0.
- `grep -n "id: 'forge'" cli/src/doctor/checks.ts` shows one check, and `grep -n "FORGE_CHECK" cli/src/doctor/checks.ts` shows its definition and its one `CHECKS` entry.

**Deviations from plan:**

- Added one state the plan's grade list does not name: a `forge` value outside `FORGE_KINDS` passes as *not graded (see the config check)*, since that check already fails it and grading it twice would make one finding two. Not covered by a test case (the config check refuses writing such a value through `config set`).
- `grep -n "FORGE_CHECK"` shows a third line besides the definition and the `CHECKS` entry: the module header's choice 3 now names `FORGE_CHECK` beside `REMOTE_EXECUTION_CHECK` as a check that spawns no `gh`, and choice 1 names `forgeTriggerApplies` and `WORKFLOW_TRIGGER_PATH` among the imported owners.
