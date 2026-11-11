### Task 5 — Respell the workflow generator, its recorded 0.6.1 `if:` line and digest, and the 0.6.1 fixture's `if:` line

**Goal:** Respell the old names in `cli/src/generators/githubWorkflows.ts`, and carry out clarification answer Q2 (b): respell the recorded 0.6.1 job `if:` line in `UNPARSEABLE_CONTROL_IF_LINE`, change the fixture's bytes to match, and re-record the `'0.6.1'` digest so that `init`'s repair still recognises the fixture.

**Depends on:** Task 1, which renames `WORKFLOW_CONTROL_FILE` to `'devscene-control.yml'` and sets the new handle, marker and prefix. This module already imports `WORKFLOW_CONTROL_FILE`. Task 2, whose renamed templates this module reads.

**Where this task stops.** `cli/test/trigger-workflow-init.test.mjs` recomputes the fixture's digest and asserts that it equals `UNPARSEABLE_CONTROL_RELEASES['0.6.1']`. That suite is Task 7's, and it ships after Task 6. The gate script's fixture note (`scripts/check-rendered-workflows.mjs`) is Task 17's. The Gate 14 description in `docs/development.md` is Task 21's.

### Targets

- `cli/test/fixtures/harness-control-0.6.1.yml`: the job-level `if:` line only. The file name stays (`## Context` → *What keeps its current spelling*).
- `cli/src/generators/githubWorkflows.ts`

**Work:**

- [ ] Fixture: in the one line that begins, after its indentation, `if: (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@sdlc-harness')`, make three changes: `'@sdlc-harness'` to `'@dev-scene'`, `'<!-- sdlc-harness'` to `'<!-- devscene'` and `'sdlc-harness: '` to `'devscene: '`. Keep the indentation, the LF line endings and every other byte of the file, its comment lines and `name: harness-control` included. The line must still be a plain scalar carrying `': '` inside a quoted literal, which is the shape GitHub could not parse. So gate 14b still refuses the fixture.
- [ ] `UNPARSEABLE_CONTROL_IF_LINE`: set it to the fixture's new `if:` line exactly as trimmed. That is the current constant with the same three substitutions, and nothing else changed. `classifyControl` compares `line.trim()` against it, so it must be byte-identical to the trimmed fixture line.
- [ ] `UNPARSEABLE_CONTROL_RELEASES['0.6.1']`: replace the digest with the SHA-256 hex of the edited fixture's bytes, LF-normalised as `classifyControl` normalises them. For example, `shasum -a 256 cli/test/fixtures/harness-control-0.6.1.yml` on the LF file. Rewrite the doc comment above it to say what the bytes now are: 0.6.1's shipped control workflow (git blob `1b4f0fc33200d876e4089ebe4013120e48a45335`, the control workflow template from `a4ae3c8` through `31a2d55`) with its job-level `if:` line respelled to the current handle, marker and state-label prefix. Do not respell the template path inside that git-object note into a path that did not exist at those commits.
- [ ] `unparseableControlRoute`: build the file name from `WORKFLOW_CONTROL_FILE` instead of the literal `harness-control.yml`, so that the route `init` and `doctor` print reads *"replaces a devscene-control.yml that 0.6.1 wrote …"*. Leave the rest of the sentence byte-identical.
- [ ] Respell every remaining old file name in this module's comments: the header's four workflow names, choices 2–6, the `Declared mirror` paragraph (`cli/templates/github/workflows/devscene-run.yml`), the `IN_FLIGHT_RUNS_NOTE` comment, the `UNPARSEABLE_CONTROL_IF_LINE` and `ControlRepair` doc comments, and the `GithubWorkflowsOptions` / `WorkflowUpgrade` / `GithubWorkflowsResult` field comments. Leave `IN_FLIGHT_RUNS_NOTE`'s string value unchanged; it names no workflow file.

**Verification:**

- `grep -nE "sdlc-harness|harness-(trigger|run|control|resume)\.yml" cli/src/generators/githubWorkflows.ts` prints nothing.
- `git diff -U0 -- cli/test/fixtures/harness-control-0.6.1.yml` shows exactly one changed line, the job `if:`. Its new text, trimmed, equals the `UNPARSEABLE_CONTROL_IF_LINE` literal.
- The SHA-256 of the edited fixture equals the new `'0.6.1'` value.
- `grep -nE "@sdlc-harness|<!-- sdlc-harness|sdlc-harness: " cli/test/fixtures/harness-control-0.6.1.yml` lists only comment lines, never the `if:` line.
