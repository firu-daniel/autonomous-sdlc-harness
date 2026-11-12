### 1. The Gate 12 full-run and SB2 graders match `devscene run<branch>` with no space, so they never find a run

**File:** `scripts/lib/gate12-sandbox-round/grade-full-run.sh` (`g12_full_run_jobs`) — `--arg t "devscene run$branch"`; and `scripts/lib/gate12-sandbox-round/grade-state.sh` (`g12_sb2_restore_clause`) — `--arg t "devscene run$G12_SB2_BRANCH"`

When Task 16 respelled row 12 of the spelling table (`harness <verb>` in a run title → `devscene <verb>`), the space between the verb and the branch was dropped at these two sites. The old code read `--arg t "harness run $branch"`. The new code reads `--arg t "devscene run$branch"`.

The workflow template titles every run `devscene ${{ inputs.action }} ${{ inputs.branch }}` (`cli/templates/github/workflows/devscene-run.yml` → `run-name:`), so a real title is `devscene run feat_x`. The jq filter `select(.displayTitle == $t)` compares that title with `devscene runfeat_x`, and nothing ever matches. As a result:

- `g12_full_run_jobs` always takes its `if [ -z "$G12_FR_JOBS" ]` arm. Every FR row of `grade --full-run` grades `not run`, even when the full run is on GitHub.
- `g12_sb2_restore_clause` never finds the next job. SB2's restore clause always grades `not run`.

The suites already pin the spaced form, so they now disagree with the scripts. `cli/test/gate12-sandbox-round-full-run.test.mjs` cans `displayTitle: \`devscene run ${B}\`` and expects FR1–FR7 `pass` (its case *"a parked, resumed and completed run is FR1-FR7 pass…"*). `cli/test/gate12-sandbox-round-grade.test.mjs` cans `displayTitle: \`devscene run ${b}\``. The sibling sites Task 16 respelled correctly in the same directory also keep the space: `scripts/lib/gate12-sandbox-round/plant.sh` (`--arg t "devscene run $branch"`) and `scripts/lib/gate12-sandbox-round/runs.sh` (header, `` `devscene run` ``).

The missing space also shows up in three comments and two messages at the same sites, which state the wrong title to a reader.

**Fix:** restore the single space after `run` at all seven places. Change nothing else.

In `scripts/lib/gate12-sandbox-round/grade-full-run.sh`:

```bash
# header comment, two lines
# `devscene run <branch>` jobs through runs.sh, and, for FR4, the committed run-analytics.json. A
# THE JOBS. Oldest first, those whose title is `devscene run <branch>`:

# g12_full_run_jobs
  G12_FR_JOBS="$(jq -r --arg t "devscene run $branch" \
...
    g12_arm_set "not run" "no devscene run $branch run on $branch"
```

In `scripts/lib/gate12-sandbox-round/grade-state.sh`:

```bash
# The next job is the first `devscene run <branch>` run created after the planted one.
...
  next="$(jq -r --arg t "devscene run $G12_SB2_BRANCH" --argjson id "$G12_SB2_ID" \
...
    g12_arm_set "not run" "no later devscene run $G12_SB2_BRANCH run"
```

After the edit, `git grep -nE 'devscene (run|pause|stop|control|trigger)[$<A-Za-z_{]' -- scripts/lib/gate12-sandbox-round` prints nothing.
