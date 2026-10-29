### 1. Skeptic review quotes an absolute home path (gate 6a)

**Site:** `harness-runs/skeptic_reviews/fix_clone_main_repo_resolution_skeptic_review.md`, the bullet beginning `- **Check 2 (runtime address).**`, at the substring `` is the single line `<absolute path>/.git/objects` `` (around line 25, as a navigation hint only).

**Failing test:** none — `6a no machine paths` (gate 6, self-containment, in `scripts/run-gates.sh`, function `machine_path_hits`)

**Failure (from the log, home directory rewritten):**

```
  FAIL  6a no machine paths (printed output, which is the finding)
        ./harness-runs/skeptic_reviews/fix_clone_main_repo_resolution_skeptic_review.md:25:- **Check 2 (runtime address).** This clone's own `.git/objects/info/alternates` is the single line `<home>/Work/autonomous-sdlc-harness/.git/objects`. The main checkout's registry records `fix_clone_main_repo_resolution` as `copy_kind` `clone` at exactly this checkout's toplevel. `hr_worktree_dir`'s `<work_root>/<projectName>-<branch with / → ->` composes to the same path. So F3, F6 and F7 compose to a valid answer here.
```

**Diagnosis:** New this round (round 1). Gate 6a runs `grep -rn "$HOME" .` over the checkout, excluding only `node_modules`, `dist`, `.git`, `test_run_logs`, `scratch` and `__pycache__`; `harness-runs/skeptic_reviews/` is not excluded and the file is tracked (committed in `9b26502d` and touched again in `7efa68d4`). The skeptic reviewer recorded the literal contents of this clone's `.git/objects/info/alternates`, which is the main checkout's absolute objects path under the home directory. A grep of the current tree confirms this is the only hit under `harness-runs/` outside the excluded directories. The fix is to the artifact text, not to the gate: the gate is doing its job.

**Fix:**

- [ ] In `harness-runs/skeptic_reviews/fix_clone_main_repo_resolution_skeptic_review.md`, in the `**Check 2 (runtime address).**` bullet, replace the backticked absolute path with a machine-independent form, e.g. `` is the single line `<home>/Work/autonomous-sdlc-harness/.git/objects` `` or, preferably, `is a single line naming the main checkout's own .git/objects directory`. Leave the rest of the sentence and the bullet unchanged, so the check's evidence and conclusion stand.
- [ ] Do not add an exclusion to `machine_path_hits` in `scripts/run-gates.sh`, and do not touch any other file.
- [ ] Afterwards, a `grep -rnF` of the home directory over `harness-runs/skeptic_reviews/` prints nothing.
