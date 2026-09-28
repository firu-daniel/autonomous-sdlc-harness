# Review plan meta-review — iteration 0

## Must Fix
1. **Finding 1's fix does not close the lost write it names, and the header text it prescribes states a guarantee the code will not hold** — refers to review finding #1. File to change: `harness-runs/code_reviews/fix_registry_write_race_code_review/finding_1.md`.
   The finding itself is valid. Verified against `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_registry_lock`: `seen` is read inside the `if [ "$m" -gt 0 ] && … -ge 10 ]; then` block, after `m=$(hr_lane_mtime "$lock")`, so the interleaving it describes is real. The fix is where the problem is. It moves the `seen` read above the age judgement and then asserts that *"the existing `moved != seen` branch restores it"*. That branch restores only when `[ ! -e "$lock" ]`. A's `mv "$lock" "$stale"` frees the lock path while B still believes it holds the lock. The finding names three waiters that cross the stale age together: the main loop, the engine subshell and `remote-run.sh`. So this interleaving is still open after the fix:
   - X is stale. A and B both read `seen = X`.
   - B breaks X's lock, re-takes it and writes owner B.
   - A renames B's live lock aside.
   - Before A reaches `[ ! -e "$lock" ]`, a third waiter C polls. Its `mkdir "$lock"` succeeds.
   - A's `moved (B) != seen (X)`, but the lock now exists, so A skips the restore. It then runs `rm -f "$stale/owner"` / `rmdir "$stale"` on B's lock.
   - B and C now hold the lock at the same time. The later `mv` over `registry.json` drops the earlier writer's key, and neither writer reports it. This is the same silent lost update, now reached through a third waiter.

   A second path through the same window: A renames B's lock after B's `mkdir` but before B writes its owner. B's `printf … >"$lock/owner"` then fails, B's cleanup `rmdir "$lock"` can remove the directory A just restored, and B's write returns 1.

   Two things follow. First, the prescribed header amendment (*"restores it when the `owner` it moved is not the one it read before judging the age — a second breaker that re-took the lock at any point after that read"*) would make the `THE RUN REGISTRY.` section comment state a guarantee the code does not keep. `.claude/context/cli.md` → `## What "done" means here` makes that a reviewer's finding. Second, the proposed case `(e)` only gives the race a chance, as the finding admits. It cannot tell a partial close from a full one, so the fix loop would land this Must Fix for the plan's first named top risk with the risk still open and a test that passes.
   **Fix:** In `finding_1.md`, do one of the following:
   - (a) Make the fix close the window. For example, serialize breakers behind a separate `mkdir "$lock.break"` mutex, and have the holder re-read the lock's `owner` and mtime **under** that mutex before it renames anything. Then a breaker that finds the lock re-taken, or no longer stale, leaves it alone. The mutex needs its own bounded staleness rule, because the watchdog can kill a breaker too. Any equivalent that never renames a live lock is fine.
   - (b) If the author judges the remaining window acceptable, rewrite the fix so it claims only what it achieves. The prescribed header amendment then has to name the residual window: a third writer taking the lock between the breaker's rename and its restore check. The finding's description must stop saying the restore branch covers the re-take.

   With either option, update the `(e)` sub-step and the new `## Three non-obvious choices` line so they do not present case `(e)` as evidence that the race is closed. Also update the index's readiness entry and pointer title in `harness-runs/code_reviews/fix_registry_write_race_code_review.md` if the fix's short title changes.

## Should Fix
_None._

## Nice to Have
1. **The `general` layer's clean pass leans on the lessons ledger only** — refers to "Structure". File to change: `harness-runs/code_reviews/fix_registry_write_race_code_review.md` (Context).
   The diff touches `docs/development.md`, `docs/remote-execution.md` and `docs/watcher.md`. The Context's clean-pass rationale for them cites `harness-runs/lessons.md` only. A one-line statement drawn from `.claude/context/conventions.md` → `## Documents of record` would make the general-layer pass explicit. That rule says a measured fact states what was measured, the command and the exact message. It fits the new Gate 4 paragraphs, including the *"under Node 20.19.5"* behaviour claim and the *"Not yet measured."* repeat-seam paragraph.
