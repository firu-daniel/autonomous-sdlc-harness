### Task 2 — `harness-control.yml` installs `claude` and fetches the plugin only when the comment needs the agent

**Goal:** Stop a comment job spending an install and a clone on a comment that never reaches an agent session: a commenter the actor check refuses (round 10, (xv)(d′), control jobs `37584084036` and `37584023156`), and an exact-form command. Do it by running Task 1's check as its own step before the three comment-only steps, exposing its answer as a step output, and gating those steps on it (task prompt, issue 2: *"run it first as its own step and expose an output"*).

**Depends on:** Task 1, which adds `remote-run.sh control --needs-agent`. This task relies on exactly this contract, restated here so you do not have to guess it:
- **exit 0**: a mention that passes `control`'s gates 1 to 3, so the act step would start a session. The line is `remote-run.sh: control: needs-agent: yes, …`.
- **exit 2**: no session would start. That covers an ignored comment, an exact-form command and a gate refusal. The line is `remote-run.sh: control: needs-agent: no, <reason>`.
- **exit 3**: the permission call failed, so the answer is unknown.
- **exit 1**: a usage or event error. This includes an older `remote-run.sh` that does not know the flag (`unknown option '--needs-agent'`).
- **No side effects.** The mode posts, dispatches and writes nothing, and makes at most one `gh` call, the permission call.

**Only exit 2 means "skip".** Every other outcome installs, as today: an older script, a failed permission call, a failed step. This task owns the workflow file and its test only. The script is Task 1's, and the adopter documentation is Tasks 3 and 4's.

### Targets

- `cli/templates/github/workflows/harness-control.yml` — the new step, the three steps' `if:`, and the header.
- `cli/test/workflow-templates.test.mjs` — the control-workflow assertions and the file's header comment.

**Work:**

- [ ] **The new step.** Insert it after `Read the configuration`, which sets `SCRIPTS_DIR`, and before `Set up Node`:

  ```yaml
      - name: Decide whether the comment needs the agent
        id: needs
        if: github.event_name == 'issue_comment'
        continue-on-error: true
        run: |
          status=0
          bash "$SCRIPTS_DIR/remote-run.sh" control --needs-agent || status=$?
          if [ "$status" -eq 2 ]; then
            echo "agent=no" >> "$GITHUB_OUTPUT"
          else
            echo "agent=yes" >> "$GITHUB_OUTPUT"
          fi
  ```

  It takes no `env:` of its own: the job-level `GH_TOKEN`, `HARNESS_REMOTE_STOP`, `HARNESS_RUN_ACTORS` and `HARNESS_TRIGGER_ALLOWED_BOTS` are what the check reads, and no secret reaches it. Keep the file's three rules: no expression inside `run:`, every expression spaced, and no plain scalar carrying `: ` or ` #`.
- [ ] **Gate the three comment-only steps.** Change each `if:` of `Set up Node`, `Install the claude CLI when absent` and `Fetch the pinned plugin` to `if: github.event_name == 'issue_comment' && steps.needs.outputs.agent != 'no'`. Use `!= 'no'`, never `== 'yes'`, so an empty output (a failed step) still installs. Leave their run bodies byte for byte: `Install the claude CLI when absent` must keep mirroring `harness-run.yml`'s body. Leave the act step unchanged: `bash "$SCRIPTS_DIR/remote-run.sh" control || [ $? -eq 2 ]`.
- [ ] **Header.**
  - `WHAT IT DOES.`: a comment job first asks `remote-run.sh control --needs-agent`. Every decision still lives in that script, and the act step re-checks everything.
  - Add a `THE AGENT CHECK.` paragraph after `THE PLUGIN.`:
    - what the check runs: `control`'s gates 1 to 3, after the exact form is told apart from a mention;
    - that only its exit 2 writes `agent=no`;
    - that every other outcome installs, as before: an older script, a failed permission call, a failed step;
    - that a mention by an admitted commenter costs one extra permission call;
    - that the check is a saving, not the authority, as `THE PREFILTER.` says of the `if:`.
  - Amend `THE PLUGIN.`'s last sentences: the three comment-only steps run only when the check did not answer `no`. An exact-form command now skips them. A failed install still never blocks one, because they stay `continue-on-error`.
  - Add `control --needs-agent` and its exit-2 meaning to the `DECLARED MIRRORS` row for `remote-run.sh (the scriptsDir copy)`.
- [ ] **`cli/test/workflow-templates.test.mjs`.**
  - `control runs remote-run.sh control and nothing else of the family`: the calls are now exactly two, the agent check and the act step, both `remote-run.sh control`. Assert that list, and that exactly one body carries `control --needs-agent`.
  - `controlStepRun()`: select the act step's body by the step name `Act on the comment, review, close or deletion` (`ACT_STEP`), not by the substring `remote-run.sh" control`, which now matches two bodies.
  - The comment-only-steps test:
    - the new step comes before `Set up Node`, with `id: needs`, `if: github.event_name == 'issue_comment'` and `continue-on-error: true`;
    - each of `COMMENT_STEPS` carries exactly `if: github.event_name == 'issue_comment' && steps.needs.outputs.agent != 'no'`, and is still `continue-on-error`.
  - Update the file header's `harness-control.yml` sentence: "`remote-run.sh control` its only call into the script family", and the `Set up Node` … `if:` clause.
- [ ] **A behavioural case for the new step**, in the style of the existing `under bash -e -o pipefail …` test. Take the new step's `run: |` body from the template's text. For each stub exit 0, 1, 2 and 3, write a throwaway `remote-run.sh` that exits it after checking its arguments are `control --needs-agent` (exit 99 otherwise). Run the body with `bash -e -o pipefail -c`, with `SCRIPTS_DIR` and `GITHUB_OUTPUT` pointing at temp paths. Assert that the step exits 0 every time, and that `GITHUB_OUTPUT` holds exactly `agent=no` for exit 2 and `agent=yes` for 0, 1 and 3. Tear the temp directory down in process.

**Verification:**

- Run the edited suite as one plain foreground command from the repository root: `npm test --workspace cli -- test/workflow-templates.test.mjs`. Every case passes, including the unchanged `the claude CLI install mirrors harness-run.yml`, `control carries no template token …` and the plain-scalar check over all four files.
- **End to end over both tasks:** the new step's body runs the real `remote-run.sh` Task 1 shipped. Its arguments are the exact `control --needs-agent` Task 1's suite asserts, and the behavioural case above proves the 0 / 2 / 3 / 1 mapping. On GitHub, Gate 12 (xv)(d′) and (xiv)(j) steps 1 and 10 observe it (Task 4).
- Read the rendered `if:` lines once more for `: ` or ` #` in a plain scalar. There must be none: `&&`, `!=` and quoted `'no'` carry neither.
