### 2. Three reset blocks still clear `paused_by` and `usage_resume_at` in two writes, against the watcher header's "in one write"

> **Self-contained per-finding file** for the `fix_registry_write_race` code-review index (`harness-runs/code_reviews/fix_registry_write_race_code_review.md`). The implementer reads only this file to apply the fix. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**File:** `cli/templates/scripts/autonomous-watcher.sh`. The three sites are:

- `launch_run`: the lines `registry_set "$branch" paused_by ""` / `registry_set "$branch" usage_resume_at ""`
- `launch_remote_run`: the same two lines
- `run_job`: the same two lines, in the block under `# Fresh-launch defaults — launch_run's reused-key resets`

**The problem.** This branch rewrote the registry field-set comment in the watcher header, the block listing `paused_by` and `usage_resume_at`, to state a rule:

- `paused_by`: *"Written together with `usage_resume_at` in one write"*.
- `usage_resume_at`: *"written and cleared together with `paused_by`, in one write"*.

The branch converted the gate's own clears to that rule. These are the stale-tag sweep and the auto-resume clear in `usage_gate`, now `registry_set "$b" paused_by "" usage_resume_at ""`. The three reused-key resets above still clear the pair in two back-to-back calls, so the header's *"cleared … in one write"* is false at those sites. `.claude/context/cli.md` → `## What "done" means here` holds a change to its module's own header: the change either satisfies the rule the header states or amends the header in the same edit. No reader acts on the brief split state today, because these resets run in the watcher's own process before the engine is spawned. That is why this is a Should Fix and not a Must Fix. It is still the only place the header's new guarantee does not hold, and making the three sites match is cheaper than weakening the header.

**Fix.** At each of the three sites, replace the two lines

```bash
  registry_set "$branch" paused_by ""
  registry_set "$branch" usage_resume_at ""
```

with the one call

```bash
  registry_set "$branch" paused_by "" usage_resume_at ""
```

- [ ] `launch_run`
- [ ] `launch_remote_run`
- [ ] `run_job` (the fresh-launch defaults block)

Do not change the order of any other line in those blocks, and leave the header comment as it is. After this edit it is accurate.

No test file is edited by this fix, so it runs no test. The full suite runs later, in the Run gates phase.
