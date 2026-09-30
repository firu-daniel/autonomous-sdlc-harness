### Task 15 — Ask GitHub about the trigger workflow and its label under `doctor --check-github`

**Goal:** Extend `REMOTE_GITHUB_CHECK` so that, when the issue trigger applies, `doctor --check-github` asks GitHub the two things only it can answer. Does GitHub know `harness-trigger.yml`? Without it on the default branch, labelling starts nothing (research T1). And does the trigger label exist? Applying a label needs it to exist, and creating one needs write (T1).

**Depends on:**

- Task 14, which last edited `cli/src/doctor/checks.ts` and `cli/test/doctor.test.mjs`.
- Task 1's `forgeTriggerApplies`, `WORKFLOW_TRIGGER_FILE`, `WORKFLOW_TRIGGER_PATH`, `TRIGGER_LABEL_VARIABLE`, `DEFAULT_TRIGGER_LABEL` and `TRIGGER_ALLOWED_BOTS_VARIABLE`.

**Where this task stops.** It adds reads to an existing check. Every `gh` call goes through `remote/githubActions.ts` → `runGh` with a fixed argument vector and is a read, and every answer is graded through the check's existing `classifyGh` (*cannot tell* is never *missing*). Local evidence stays Task 14's `forge` check.

### Targets

- `cli/src/doctor/checks.ts` — `REMOTE_GITHUB_CHECK` and its doc comment.
- `cli/test/doctor.test.mjs` — `--check-github` cases with a stubbed `gh`.

**Work:**

- [ ] **The workflow**: when `forgeTriggerApplies(ctx.config)`, ask `gh workflow view harness-trigger.yml`, spelled from `WORKFLOW_TRIGGER_FILE`. A `refused` answer → `warn`: *GitHub does not know harness-trigger.yml, so labelling an issue starts nothing: push `WORKFLOW_TRIGGER_PATH` to the repository's default branch*. An `unknown` answer → the check's *cannot tell* warning.
- [ ] **The label**: the name is the `HARNESS_TRIGGER_LABEL` value from the variables the check already lists, or `DEFAULT_TRIGGER_LABEL` when it is empty or absent. Ask `gh label list --json name --limit 1000` and compare names exactly. Absent → `warn`: *no label `<name>` exists, so nobody can apply it: `gh label create <name>`*. A shape this check does not read, or no answer, → *cannot tell*. When `HARNESS_TRIGGER_ALLOWED_BOTS` is non-empty, add a note naming the listed bots, since each can start runs without a permission check.
- [ ] **The pass sentence and the doc comment**: when the trigger applies and both answers are clean, the `pass` text adds *GitHub knows harness-trigger.yml and the label `<name>` exists*. The function's doc comment lists the two new `warn`s under its grades. When the trigger does not apply, nothing new is asked and no sentence changes, so every existing `--check-github` case keeps its bytes.
- [ ] **`doctor.test.mjs`**: with the file's existing `gh` stub mechanism for `--check-github` and a fixture carrying `forge: github` and `execution.target: github-actions`, add cases:
  - both known → `pass` naming the label;
  - `workflow view harness-trigger.yml` refused → `warn` naming the push;
  - `label list` without the label → `warn` naming `gh label create harness`;
  - `HARNESS_TRIGGER_LABEL=go` in the variable listing and a label list holding `go` → `pass` naming `go`;
  - `forge` absent → the stub's log shows no `label list` and no `workflow view harness-trigger.yml`.

**Verification:**

- `npm test -- test/doctor.test.mjs` from `cli/` passes, with every earlier `--check-github` case unchanged.
- `commands.typecheck` (`bash scripts/typecheck.sh`) exits 0.
