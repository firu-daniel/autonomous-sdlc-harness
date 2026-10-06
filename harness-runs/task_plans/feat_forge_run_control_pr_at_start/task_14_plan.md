### Task 14 — Schema and `docs/config.md`: `execution.progressComments`, and `forge`'s description

**Goal:** Close the four-place contract for the new key: the schema property, then the `docs/config.md` §5 row, beside the model field and check Task 1 shipped. Correct the schema's and the reference's description of `forge`, which still says a completed run opens the draft pull request.

**Depends on:** Task 1, which shipped the model field `HarnessExecution.progressComments?: boolean`, `DEFAULTS.execution.progressComments: true`, and the check entry (`EXECUTION_KEYS` gains `progressComments`, checked by `checkBoolean`). The schema written here must agree with those key for key: the name `progressComments`, the type boolean, and the default `true`. The key's run-time reader is Task 2's `hr_progress_comments <root>` (0 on, true or absent; 1 off; 2 unreadable), and its consumer is Task 9's `remote-run.sh report progress`.

**Where this task stops.** The schema and the configuration reference only. The behaviour the key switches is documented in `docs/github-run-control.md` §5 (**Task 15**). Adding a negative fixture under `schemas/negative/` is not owed: a non-boolean value is already refused by the type, and `check.ts` names it (Task 1's suite).

### Targets

- `schemas/harness.config.schema.json` — `properties.execution` (its `description` and a new `properties.progressComments`), and `properties.forge.description`.
- `docs/config.md` — `## 5. Key reference` (the `forge` row and a new `execution.progressComments` row after `execution.target`'s), and the §2 sentence beginning *"Remote execution splits along the same line."*

**Work:**

- [ ] Schema, `execution.properties.progressComments`: `{"type": "boolean", "default": true, "description": "Whether a run that executes on GitHub Actions with forge 'github' keeps one progress comment on its pull request, edited as the run passes its four main phases (for a task run planning, implementation, branch review and done; for a user-review round fix plan, fix implementation, branch review and done). false posts none; every other lifecycle comment is unchanged. Read at run time from the run's branch; an absent key is true."}`. Widen `execution.description` by one clause: the section also holds this one reporting switch, read by the run job. `additionalProperties: false` stays, which is why the property must be declared here.
- [ ] Schema, `forge.description`: replace *"and a completed run opens a draft pull request"* with *"and the run's draft pull request opens when the run starts and is marked ready for review when it completes"*. Change nothing else in the sentence.
- [ ] `docs/config.md` §5, the new row: `| execution.progressComments | boolean | true | … |`, condensed from the schema description, stating that it applies only where `execution.target` is `"github-actions"` and `forge` is `"github"`, that `false` posts no progress comment and leaves every other lifecycle comment as it is, and that the reader is the run job's `remote-run.sh report progress` through the run library, linking [`github-run-control.md`](github-run-control.md) → §5. Its *Default* cell is `true`, matching `DEFAULTS.execution.progressComments`.
- [ ] `docs/config.md`, the `forge` row: *"and a completed run gets a draft pull request"* becomes *"and the run's draft pull request opens when the run starts and is marked ready for review when it completes"*, and *"`push-branch.sh` still opens no pull request — the run workflow opens it after the run."* becomes *"… — the run workflow opens it when the run's job starts."*. The §2 sentence that says the *how* of remote execution is repository variables and secrets, with *"None of them is a `harness.config.json` key"*: add that `execution.progressComments` is the one committed `execution` key besides `target`, because it decides what a run reports on its pull request rather than how or where the run executes.

**Verification:**

- `jq '.properties.execution.properties.progressComments' schemas/harness.config.schema.json` prints the object above. `jq -r '.properties.forge.description' schemas/harness.config.schema.json` no longer contains `completed run opens`.
- `jq '.properties.execution.properties' schemas/harness.config.schema.json` shows exactly two properties, `progressComments` and `target`. Read them against `cli/src/config/check.ts` → `EXECUTION_KEYS`: the same two keys.
- Grep `docs/config.md` for `completed run gets a draft` and `opens it after the run` and find neither, and find one row whose key cell is `execution.progressComments`.
