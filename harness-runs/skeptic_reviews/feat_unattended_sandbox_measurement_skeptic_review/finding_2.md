### 2. CW2 is judged on the clone's own ref, which a sandboxed commit in a clone is designed to move, so the clone's copy prints `fail` on its expected outcome

**File:** `scripts/lib/sandbox-probe/legs-wrappers.sh` (`sp__wr_own`) — `sp__wr_commit_held "$SP_STREAM" "$cw2" "$before"`; the judge it calls, `sp__wr_commit_held` — `sp_judge_ref "$SP_CLONE" "refs/heads/$SP_BRANCH" "$3" unchanged`; row `CW2` in `docs/sandbox-verification.md`.

**The problem.** The task prompt (goal item 2, **wrappers**) says *"The clone's own copies stay sandboxed (P3, R4, CW2, on the clone)"*. `sp__wr_own` grades CW2 with `sp__wr_commit_held`. That function returns `pass` only when the **clone's** `refs/heads/<branch>` is unchanged, and `fail` with *"the commit landed: …"* when it moved. CW2 is printed through `sp_row_result --direct`, so that `fail` is printed whatever the control did.

On the clone layout, a sandboxed commit by the clone's own copy is designed to land on the clone's ref:

- `scripts/commit-on-branch.sh` header, **WHY THE MAIN CHECKOUT'S COPY RUNS OUTSIDE THE SANDBOX**: *"a sandboxed commit in a clone lands on the clone's own ref alone"*, and *"A run copy's own `commit-on-branch.sh` sits in a sandbox-writable tree and is never excluded: in a clone it cannot move the main checkout's branch"*.
- The clone's copy places its main checkout from its own location: `main_top="$(hr_wrapper_main_of "$script_dir")"`. `hr_wrapper_main_of` returns any checkout whose `.git` is a directory with no `commondir`, and a `git clone --shared` clone is one. `scripts/lib/harness-run-lib.sh` → `hr_main_repo` says the same: *"Inside a clone it answers the clone itself. It never reads HARNESS_MAIN_REPO"*. So `--repo <clone>` is that copy's own main checkout, and the commit is an ordinary one in the clone.
- `docs/sandbox-verification.md` row `CL4` measured sandboxed `git commit` succeeding in a clone once the sibling-glob `.git` rules were gone. Row `CS3`, which this same probe measures in `sp_leg_git`, expects *"sandboxed ordinary git works in the probe clone under the real per-run profile"*, the commit included.

So when the clone behaves as designed and as CS3 expects, the CW2 call exits 0, the clone's ref moves, and the probe prints `CW2 fail "the commit landed: rev-parse refs/heads/<branch> <a>..<b> (moved)"`. The person running Gate 15 would record a protection failure for the designed behaviour. The boundary the header actually promises is the **main checkout's** `refs/heads/<branch>`, and nothing reads it. CW2's own row also says *"Record whether `refs/heads/<branch>` moved"* rather than grading it.

CW5 and CW6 are unaffected. Both call the main checkout's copy, whose clone arm syncs into `<main>/.git` first, and a sandboxed run cannot write there.

**Fix.**

1. In `scripts/lib/sandbox-probe/legs-wrappers.sh` → `sp__wr_own`, add `main_before` to the `local` line. Right after `tip="$SP__WR_TIP"`, record the main checkout's ref:

```bash
  main_before="$(git -C "$SP_MAIN" rev-parse --verify -q "refs/heads/$SP_BRANCH" 2>/dev/null)" || main_before=""
```

   Then replace the two CW2 lines (`sp__wr_commit_held "$SP_STREAM" "$cw2" "$before"` and the `sp_row_result --direct wrappers CW2 …` after it) with:

```bash
  # CW2 on the clone layout: the clone's own copy places the clone as its main checkout, so a sandboxed commit
  # lands on the clone's own ref by design (commit-on-branch.sh header); the boundary is the main checkout's ref.
  if ! sp__wr_called "$SP_STREAM" "$cw2"; then
    sp_row_result --direct wrappers CW2 "not run" "$SP__WR_WHY" "$departure"
    return 0
  fi
  layer="$SP_LAYER: $SP_LAYER_EVIDENCE"
  sp_judge_ref "$SP_CLONE" "refs/heads/$SP_BRANCH" "$before" unchanged
  clone_ev="clone $SP_EVIDENCE"
  sp_judge_ref "$SP_MAIN" "refs/heads/$SP_BRANCH" "$main_before" unchanged
  if [ "$SP_VERDICT" = pass ]; then
    sp_row_result --direct wrappers CW2 pass \
      "stayed sandboxed: <main> $SP_EVIDENCE; $clone_ev; call answered by $layer" "$departure"
  else
    sp_row_result --direct wrappers CW2 fail \
      "the clone's own copy moved the main checkout's branch: <main> $SP_EVIDENCE; $clone_ev; call answered by $layer" "$departure"
  fi
```

   Add `layer clone_ev` to the same `local` line.

2. In the same file's header, after *"plus an uncommitted edit to that file, so a commit that ran would move the ref."*, add: *"CW2 is the exception: the clone's own copy commits on the clone's own ref by design, so CW2 is judged by the main checkout's `refs/heads/<branch>`, and the clone's ref is recorded."*

3. In `docs/sandbox-verification.md`, row `CW2`, Expected cell, append: *"On the clone layout (the probe's, `<clone>` for `<worktree>`): the clone's own copy places `<clone>` as its main checkout, so a sandboxed commit lands on `<clone>`'s own `refs/heads/<branch>` alone (`commit-on-branch.sh` header) and `<main>`'s `refs/heads/<branch>` is unchanged. A moved `<main>` ref is a `fail`; the clone's ref is recorded, not graded."*

   This departs from the story index's `## Scope register` row 23, which marks rows P3, CW2, CW5 and CW6 `no-change` because the person running the gate writes the result into the Observed cell. The departure is needed because CW2's current Expected cell describes the worktree layout (`Operation not permitted` under `<main>/.git/worktrees/<name>/`) while the probe measures CW2 on the clone layout. Left as it is, the row's expected result would contradict the probe's verdict rule from step 1.

No test drives `sp_leg_wrappers`, because it launches `claude`. This fix edits no test file and runs none.
