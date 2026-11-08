### 1. `open` and `deliver` now make the job-token GitHub calls under `contents: read`, but the only precedent cited for that ran under `contents: write`, and roadmap item 35 does not measure the narrower grant

**Sites:**
- `cli/templates/scripts/remote-run.sh`, the `deliver` paragraph of the header: "The conversion needs only the `pull-requests: write` grant the flip already holds, the same one `round` runs `--undo` under".
- `docs/remote-execution.md` → **CI on the final tip.**: "The conversion needs no permission beyond the `pull-requests: write` the flip already uses."
- `docs/github-run-control.md` → `## 8. What is not verified here`, the row "The job's token may mark a pull request ready for review and convert it back to draft (`gh pr ready`, and its undo form)".
- `docs/development.md` → `## 6.`, roadmap row `35`.

**Problem.** Before this branch, the `Open the draft pull request` and `Open the pull request and report` steps ran in the `run` job, which holds `contents: write`, `actions: write`, `issues: write` and `pull-requests: write`. Gate 12 round 12 measured that set and graded every leg from the full `gh run view --log`. Its stated reason was that `open` and `deliver` are `continue-on-error`, so a refusal there leaves the step green (`docs/development.md`, **Round 12 — 2026-10-09**: "The risk the round looked for is a permission now too narrow, which shows only on GitHub, as a failed step").

This branch moves both steps into new jobs, `open` and `deliver`, that hold `contents: read` (`cli/templates/github/workflows/harness-run.yml` → `# THE PERMISSIONS.`, the `open` and `deliver` rows, and `cli/test/workflow-templates.test.mjs` → "the run-name title, the runner line and the permissions"). The job's token now makes these calls under `contents: read`:
- `gh pr create`, in `open` and in `deliver`, when `HARNESS_GIT_TOKEN` is unset (the default setup);
- the `gh pr ready` flip and its retry;
- the `gh pr ready --undo` re-toggle;
- the round-thread replies and resolves (`deliver_round_threads`);
- the comments and labels.

**The justification does not hold.** The design says the narrower grant suffices because `round` already runs `--undo` under the same grant. But `round`'s `--undo` is `remote-run.sh` → `forge_report`, in the `round)` arm: "if gh_call pr ready \"$FORGE_PR\" --repo \"$FORGE_REPO\" --undo". It runs only from the `collect` job (`harness-run.yml`: `contents: write`) and from the `control` job (`harness-control.yml`: `contents: write`, the header's "contents: write        push a review round"). The ready flip that Gate 12 (xiv) legs (d) and (e) observed also ran under `contents: write`, in the old `run` job. No job in this tree has ever run `gh pr ready`, its undo form or `gh pr create` with the job's token under `contents: read`. So the cited precedent shows these calls work with `contents: write` present. It does not show they work without it.

**Why it matters.** The task prompt's Constraints require "No grant in the `# THE PERMISSIONS.` table becomes narrower than its listed step needs … so verify on GitHub". The plan defers every GitHub check to roadmap item 35. That row measures the re-toggle and the flip only "with `HARNESS_GIT_TOKEN`". It never measures the path where `HARNESS_GIT_TOKEN` is unset, and nothing checks the `open` and `deliver` logs for a `403`.

If GitHub needs more than `pull-requests: write` for any of these calls, two things happen:
- An adopter with no `HARNESS_GIT_TOKEN` gets a pull request that is never opened, or never flipped ready.
- The re-toggle never fires `ready_for_review`.

Each failure is one `::warning::` line in a green, `continue-on-error` step. The maintainer who takes roadmap item 35 as written would sign off without looking at either case.

**Fix.** Do not change any grant. Make the claims match the evidence, and make roadmap item 35 measure the narrower grant.

1. In `cli/templates/scripts/remote-run.sh`, the `deliver` paragraph of the header, replace:

   ```
   # on every run. The conversion needs only the `pull-requests: write` grant the
   # flip already holds, the same one `round` runs `--undo` under, and starts none
   # of the harness's own workflows (`WORKFLOW_CONTROL_FILE` listens to
   ```

   with:

   ```
   # on every run. The conversion runs under the `pull-requests: write` grant the
   # flip holds, beside `deliver`'s `contents: read`; `round`'s `--undo` and every
   # earlier flip ran beside `contents: write`, so that this grant suffices is
   # unmeasured (`docs/development.md` → roadmap item 35). It starts none
   # of the harness's own workflows (`WORKFLOW_CONTROL_FILE` listens to
   ```

2. In `docs/remote-execution.md` → **CI on the final tip.**, replace the sentence "The conversion needs no permission beyond the `pull-requests: write` the flip already uses." with: "The conversion runs under the `pull-requests: write` the flip uses, beside the `deliver` job's `contents: read`. Every earlier flip, and `round`'s conversion, ran beside `contents: write`, so whether this grant suffices is not yet measured; roadmap item 35 takes it ([`development.md`](development.md) → `## 6.`)."

3. In `docs/github-run-control.md` → `## 8. What is not verified here`, the row "The job's token may mark a pull request ready for review and convert it back to draft (`gh pr ready`, and its undo form)": append to its third cell, after "leg (e) the conversion to draft", the sentence: " Both legs ran in a job holding `contents: write`; `deliver` now holds `contents: read`, which roadmap item 35 measures ([`development.md`](development.md) → `## 6.`)".

4. In `docs/development.md` → `## 6.`, roadmap row `35`, insert before "; and, for the record only, since the design does not rely on it," the clause:

   ```
   ; that the `open` and `deliver` jobs, under their `contents: read` grant, finish with no `403` and no `Resource not accessible by integration` in their full `gh run view <id> --log` — Gate 12 round 12's pass rule, because both steps are `continue-on-error` and a refusal leaves them green — once with `HARNESS_GIT_TOKEN` unset (the job's token runs `open`'s `gh pr create`, and `deliver`'s ready flip, round-thread replies and resolves, comments and labels) and once with it set (the job's token runs `deliver`'s `gh pr ready --undo`); a refusal is a follow-up fix that restores `contents: write` on that job
   ```

No test changes. These are comment and documentation edits only, so the fix runs no test.
