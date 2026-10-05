### Task 8 — `doctor` warns about a workflow copy written before the allow-list, naming what it does and the route

**Goal:** An adopter whose committed workflows predate `HARNESS_RUN_ACTORS` learns from `doctor` what each old copy does until they upgrade, and which command moves it. This needs no `--check-github`, because the evidence is local.

**Depends on:**
- **Task 1.** `cli/src/remote/githubActions.ts` exports `carriesRunActors(workflowText: string): boolean`. It is `true` when the text carries `vars.HARNESS_RUN_ACTORS`, and `RUN_ACTORS_VARIABLE` names the variable in the messages.
- **Tasks 4 and 5.** Their templates carry that text, so a fixture `init` writes today passes. Without them every fixture would warn.

**Where this task stops.** This task adds one warning to `REMOTE_EXECUTION_CHECK` and one to `FORGE_CHECK`, and edits no other check. **Task 12** documents both in `docs/cli.md`, and **Task 11** writes the `### Upgrading` prose they point at. The routes differ by file, and the messages must not merge them:
- `harness-run.yml` moves with `init --upgrade-workflows`.
- `harness-trigger.yml` and `harness-control.yml` carry no pin and move with the scripts, through `init --force`. Each template's `WHO WRITES IT` header says so.

### Targets

- `cli/src/doctor/checks.ts`: `REMOTE_EXECUTION_CHECK`, `FORGE_CHECK`, and both doc comments.
- `cli/test/doctor.test.mjs`: new cases in the `remote-execution` and `forge` suites.

**Work:**

- [ ] **`REMOTE_EXECUTION_CHECK`.** The check already reads `WORKFLOW_RUN_PATH`'s text to grade its pin. When that text was read and `!carriesRunActors(text)`, add a **warning** to the check's own findings, worded:

  > `.github/workflows/harness-run.yml` was written before `HARNESS_RUN_ACTORS`: its run job launches for any writer's dispatch or re-run, and its collect job passes the scripts no list, so a review round's authors are held to an unset list (the repository owner alone, or nobody in an organisation-owned repository) once the scripts are re-rendered; `<upgradeWorkflowsCommand(this CLI's version)>` re-renders it after a .bak (docs/remote-execution.md, section 7, Upgrading).

  - Use `upgradeWorkflowsCommand` from `cli/src/generators/githubWorkflows.ts` for the command. Never spell it.
  - An unreadable file adds nothing new; it is already a note.
  - Keep the existing pin warning. Where both fire, both are listed.
- [ ] **`FORGE_CHECK`.** Only where `forgeTriggerApplies(config)` and the file is present, read `WORKFLOW_TRIGGER_PATH` and `WORKFLOW_CONTROL_PATH`. Name each one that lacks the variable in one **warning**:

  > <files> <was/were> written before `HARNESS_RUN_ACTORS` and pass the scripts no list: with scripts written at the same time every writer may still start and command a run, and with the scripts re-rendered every start and command is held to an unset list — the repository owner alone, or nobody in an organisation-owned repository; `<CLI> init --force` replaces both workflows and the scripts after a .bak (docs/remote-execution.md, section 7, Upgrading).

  - The check's worst grade stays `warn`.
  - A read that throws is skipped. `FORGE_CHECK` already reports a missing file its own way.
- [ ] **The two doc comments.** Extend each with its new warning and the reason it is local evidence: the workflows are what GitHub runs, and only their text says whether the list reaches the scripts.
- [ ] **`doctor.test.mjs`.**
  - `remote-execution` suite: in a remote-on fixture, remove the `HARNESS_RUN_ACTORS:` lines from `.github/workflows/harness-run.yml`. Assert a warn naming `HARNESS_RUN_ACTORS` and `init --upgrade-workflows`. The untouched fixture asserts no such text.
  - `forge` suite: in a forge-on fixture, remove the line from `harness-control.yml` only. Assert a warn naming that file alone and `init --force`, and an untouched fixture naming neither.
  - Grep the suite for cases that write their own trigger or control text, such as `cli/test/fixtures/harness-control-0.6.1.yml` or hand-built YAML, and assert the `forge` grade. Where such a case now also warns, update its expected grade or add the variable line to its text. Record which you chose in the case's comment.

**Verification:**

- `bash scripts/typecheck.sh` exits 0.
- Run the edited `cli/test/doctor.test.mjs` from `cli/` with `npm test -- test/doctor.test.mjs`, under the conditions in `unit_loop_core.md` → `## The test-run rule` (3). The new cases pass, and every existing `remote-execution` and `forge` case still passes.
- Grep `checks.ts` for `--upgrade-workflows` and `init --force` as string literals in the new text. The first comes from `upgradeWorkflowsCommand`, never a literal. `--force` follows the file's existing spelling for that route; reuse whatever constant or helper the module already uses for `init --force`, if one exists.

**Deviations from plan:** The forge warning agrees its verb with the file count (`was ... and passes` for one file, `were ... and pass` for two); the plan text gave only the plural `pass`. The one existing case that rewrites a forge workflow (the `harness` trigger-label fallback case in the remote-github suite) keeps its text and now asserts the forge pass, since the edit leaves the `HARNESS_RUN_ACTORS` line in place.
