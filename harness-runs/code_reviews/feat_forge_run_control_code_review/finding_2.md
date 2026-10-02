### 2. A failed run's issue comment tells the maintainer to re-apply `sdlc-harness` even when another label started the run

**Severity:** Must Fix

**Sites:**
- `cli/templates/scripts/remote-run.sh` → `forge_report`, the `failed)` arm's issue branch: `trigger_label="${HARNESS_TRIGGER_LABEL:-$DEFAULT_TRIGGER_LABEL}"` and the text `To start again, re-apply the label \`$trigger_label\` to this issue`.
- `cli/templates/scripts/remote-run.sh` → `forge_issue_var`, the loop that matches the provenance line (`prefix="Started from $FORGE_SERVER/$FORGE_REPO/issues/"`).

**Problem.** `forge_report failed` runs in three places. One is the `run` job of `harness-run.yml`, through the watcher's job-mode `notify()` and the `Notify a cancelled job` step. The other two are `remote-run.sh continue` in that job and `remote-run.sh poll` in `harness-resume.yml`. On an issue target it names the label to re-apply as `${HARNESS_TRIGGER_LABEL:-$DEFAULT_TRIGGER_LABEL}`. Neither `harness-run.yml`'s `run` job nor `harness-resume.yml`'s `poll` job maps `HARNESS_TRIGGER_LABEL` into its `env:`. Only `harness-trigger.yml` does. So in every place this comment is written, the variable is empty, and the comment always says `sdlc-harness`.

An adopter who set the repository variable `HARNESS_TRIGGER_LABEL` to their own label, which `docs/github-issue-trigger.md` → `## Turning it on, in short` step 5 offers, is told to re-apply `sdlc-harness`. Labelling the issue `sdlc-harness` starts nothing: `harness-trigger.yml`'s `if:` matches only `vars.HARNESS_TRIGGER_LABEL`. The maintainer follows the comment's instruction and nothing happens. That is the wrong outcome a lifecycle comment exists to prevent: the prompt's goal 5 requires that *"Each comment names the next action as a GitHub action"*, and here it names an action that does nothing.

The label that started the run is already recorded on the branch. `verb_trigger` writes the provenance line `Started from <issue URL> by @<login>, who applied the label \`<label>\` at <time>.` into the committed task prompt, and `forge_issue_var` already reads that line to find the issue number.

**Fix.**
- [ ] In `forge_issue_var`, next to `FORGE_ISSUE`, declare and reset a second global, `FORGE_TRIGGER_LABEL=""`. In the loop arm that sets `FORGE_ISSUE="$num"` (the `' by @'*)` case), also take the label from the same line: the text after the first occurrence of ``who applied the label ` `` (backtick included), up to the next backtick. Set `FORGE_TRIGGER_LABEL` to it only when it is non-empty and contains no backtick. Otherwise set it to empty. For example:
  ```bash
  ' by @'*)
    FORGE_ISSUE="$num"
    FORGE_TRIGGER_LABEL=""
    case "$line" in
      *'who applied the label `'*'`'*)
        label=${line#*'who applied the label `'}
        label=${label%%'`'*}
        [ -z "$label" ] || FORGE_TRIGGER_LABEL="$label" ;;
    esac ;;
  ```
  Add `label` to the function's `local` list. Update the function's header comment to say it also sets `FORGE_TRIGGER_LABEL`, the label that provenance line names.
- [ ] In `forge_report`'s `failed)` arm, replace `trigger_label="${HARNESS_TRIGGER_LABEL:-$DEFAULT_TRIGGER_LABEL}"` with `trigger_label="${FORGE_TRIGGER_LABEL:-${HARNESS_TRIGGER_LABEL:-$DEFAULT_TRIGGER_LABEL}}"`.
- [ ] In `cli/test/remote-report.test.mjs`, extend `pushBranch` with an optional `label` option, default `'sdlc-harness'`, and use it in the provenance string in place of the literal `sdlc-harness`. Add a case beside `failed on an issue names the run log and re-applying the trigger label`. It pushes `feat_x` with `label: 'ai-run'`, runs `report failed feat_x`, and asserts that the issue-7 comment matches ``/re-apply the label `ai-run`/`` and does not contain `` `sdlc-harness` ``. Then run that one file from `cli/` with `npm test -- test/remote-report.test.mjs`.

**Deviations from plan:** The new test case pushes `feat_l` rather than `feat_x`: `reportFixture` already pushes `feat_x`, so a second `pushBranch('feat_x', …)` would fail at `git checkout -b`. Implemented on `feat_l` with `label: 'ai-run'`.
