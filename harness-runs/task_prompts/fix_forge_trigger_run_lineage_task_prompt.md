`fix_forge_trigger_run_lineage` stops a remote run from treating an **earlier, unrelated run that happened to use
the same branch name** as its own past. Gate 12 round 5 (2026-10-01, CLI 0.5.0, `firu-daniel/harness-gate12`)
labelled an issue titled `feat: invoices`; the trigger derived `feat_invoices`, a name rounds 3 and 4 had used and
whose branch the teardown had deleted. The fresh run then **restored a two-day-old state bundle, placed its 7 planning
drafts, and reviewed and committed them as its own plan**, and the issue comment linked a failed run from the day
before instead of the one just dispatched. Both come from the same gap: every run lookup keys on the branch name and
the `harness run <branch>` title, and nothing bounds it to the lineage the current branch belongs to.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** The approaches below
> are **candidates, not instructions** — verify each against the real code and GitHub's documentation before planning
> it, and say so in the plan if a better one exists or if one of them is wrong.

---

## What happened (the evidence)

- Issue #6, labelled 08:01:29Z. `remote-run.sh trigger` cut `feat_invoices` from `origin/main`, committed
  `chore: add task prompt for feat_invoices` and dispatched run `36833810996` with `resume: none`.
- That job's step `Restore the previous job's state` logged:

      remote-run.sh: restored the bundle of run 36569531374 into /home/runner/work/harness-gate12/harness-gate12
      remote-run.sh: placed 7 planning file(s) for feat_invoices; kept 0 the checkout already carries

  Run `36569531374` was a `harness run feat_invoices` from 2026-09-29, on a branch deleted since. The bundle carried
  `story_plans/feat_invoices_story_plan.md`, `task_plans/feat_invoices/task_1..5_plan.md` and
  `task_plan_reviews/feat_invoices/review_0.md`.
- The session then said `Resuming the planning phase: an unreviewed plan draft is on disk`, started the planning
  walker at its review entry, reviewed the inherited drafts (and the inherited `review_0.md`), extended them and
  committed them as `chore: Add task plan for feat_invoices`. P1 converged seven minutes after the ledger commit.
  The prompt happened to be the same text as the earlier round's, so the outcome looked right; **a different issue
  whose title folds to a reused name would be planned from another task's drafts.**
- The issue comment named `https://github.com/firu-daniel/harness-gate12/actions/runs/36671710773` — a **failed**
  `harness run feat_invoices` from 2026-09-30 — not `36833810996`.
- Control case, same session: issue #7 with the same title derived `feat_invoices_2`, a name with no run history; its
  comment named the right run, and its restore step logged
  `remote-run.sh: no previous bundle for feat_invoices_2; this is its first job`.

## Root causes

1. **`remote-run.sh` → `previous_bundle_run`** selects "the newest finished `harness run <branch>` run, other than
   this job's own, carrying a state artifact", and `verb_restore` restores it "on every --resume kind, `none`
   included, because a reused branch keeps its clarification history". It cannot tell a reused branch (same
   lineage, kept on purpose) from a recreated one (a new branch that merely shares a name). The job-mode restore then
   places the bundle's `planning/` drafts.
2. **`remote-run.sh` → `trigger_run_url`** takes the first of the five newest runs on the branch titled
   `harness run <branch>`, with no lower bound on `createdAt`. A run from an earlier lineage that is newer than the
   just-dispatched one is impossible, but one older than it is matched whenever the new run is not yet listed — which
   is exactly the window the lookup loop exists to wait out.
3. **The branch-name rule (`hr_derive_branch` in `scripts/lib/harness-run-lib.sh`, `docs/github-issue-trigger.md`
   → `## 2. The branch name` → "What counts as taken")** counts artifacts on the default branch, protected branches,
   branches on `origin`, local branches and registry records — but **not workflow-run history**. A branch that was
   abandoned and deleted without merging leaves no artifact on the default branch, so its name is free again while
   its runs and their state artifacts (retained up to 90 days here) are still listed under it.

`branch-status` shows the same symptom, harmlessly: its "earlier runs" table for `feat_invoices` listed every run
from rounds 3 and 4 as this run's history.

## The behaviour wanted

- **A run's state comes only from its own lineage.** A job that `start` (trigger or local `remote-run.sh start`) has
  just created restores nothing from runs that predate the branch's current creation; a resume of a genuinely reused
  branch still restores its own bundle and clarification history, as today.
- **The trigger comment names the run the trigger dispatched**, or the filtered list when it cannot find it — never
  an older run.
- **Preferably, the trigger does not derive a name that already has run history at all**, so `feat: invoices` after
  an abandoned `feat_invoices` becomes `feat_invoices_2`, which is what the control case showed working.

## Candidate approaches

1. **Bound every lineage-sensitive lookup by the branch's creation.** The pause check already does this — the job
   logged `a 'harness pause feat_invoices' run was created at or after 1790842296 — dropped PAUSE` — so the pattern
   exists. For `trigger_run_url`, record the time just before the `workflow_dispatch` and require
   `createdAt >= that`. For `previous_bundle_run`, require the run's `createdAt` to be after the commit that placed
   the task prompt on the branch (`chore: add task prompt for <branch>`, the first commit `start` makes), or after the
   branch's fork point from the default branch. Check that the same bound does not break the legitimate cases:
   a resume after a pause, a user-review round on a reused branch, a chain of jobs, and a `--resume answer`.
2. **Count run history as "taken" in the name rule.** Add a `gh run list --workflow harness-run.yml --branch <name>
   --limit 1` probe to `hr_derive_branch`'s taken checks for callers that can ask GitHub (the trigger job always
   can). A failed listing is a refusal, as the rule already says for every other check. This alone fixes the trigger
   path but not a hand-dropped inbox task or `remote-run.sh start` given an explicit, reused name, so it complements 1
   rather than replacing it.
3. **Stamp the lineage into the bundle.** Write the branch's creating commit (or a lineage id) into `status.json` at
   `save`, and have `restore` refuse a bundle whose stamp differs from the branch's. More robust than timestamps, but
   older bundles carry no stamp: decide what an unstamped bundle means.

Establish whether the local watcher's inbox route and `branch-prompt` reach the same restore with a reused name when
`execution.target` is `github-actions`, and cover them if so.

## Smaller findings from the same round (fix in this branch)

- **`doctor --check-github` drops the trigger confirmation whenever `remote-github` has any other warning.** The
  check builds `triggerKnown` ("; GitHub knows harness-trigger.yml and the label `harness` exists") but appends it
  only to the `pass(...)` message; with an unrelated warning — here `HARNESS_PUSH_URL is not a repository secret` —
  the result is `warn(...)` and the confirmation vanishes. The `forge` line meanwhile says "`doctor --check-github`
  asks GitHub", which is the command that was just run. Gate 12 → (xiii)'s setup pass condition ("`remote-github`
  names the trigger workflow and the trigger label") therefore cannot be met unless every other remote secret is
  set. Carry the confirmation (or its own warning) on every outcome, or report it under `forge`.
- **The GitHub route's temporary directory in `branch-pause`, `branch-resume` and `branch-answer`.** Each says "Make
  a temporary directory with `mktemp -d`". In a supervised auto-mode session the agent first composed
  `T=$(mktemp -d); bash scripts/remote-run.sh fetch … "$T"; …; rm -rf "$T"`, which was denied; it then ran
  `mktemp -d` alone (landing in `/var/folders/...`, outside the repository), and `rm -rf` of that path was denied
  too, so it fell back to `rmdir`. Consider a fixed, gitignored location under `<state_dir>/scratch/` named by the
  command, created and removed with literal commands, so no substitution and no out-of-tree delete is needed. Keep
  the guarantee that nothing is left behind.

## Acceptance criteria

- A suite case with the `gh` stub: a branch whose run list holds an older `harness run <branch>` run with a state
  artifact, recreated by `start`, restores nothing and logs that this is its first job; the same branch resumed after
  a pause in its own lineage restores its own bundle.
- A suite case: `trigger_run_url` with an older matching run listed and the new one appearing on the second lookup
  returns the new run's URL; with the new one never appearing, the filtered list.
- If approach 2 is taken: a suite case where a name with run history derives `<name>_2`, and a failed run listing
  is a refusal. `docs/github-issue-trigger.md` → "What counts as taken" lists the new reason.
- `doctor --check-github` reports the trigger workflow and label state with and without other `remote-github`
  warnings, covered by a suite case.
- `docs/remote-execution.md` and the `remote-run.sh` header paragraphs for `restore` and `trigger` state the lineage
  bound. Gate 12 → (xiii) in `docs/development.md` gains a leg that re-labels an issue whose title folds to a name
  with run history and checks the restore line and the comment URL.
