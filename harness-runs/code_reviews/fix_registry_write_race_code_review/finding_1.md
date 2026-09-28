### 1. Two waiters can break one stale lock together, rename a lock one of them has re-taken, and lose a write

> **Self-contained per-finding file** for the `fix_registry_write_race` code-review index (`harness-runs/code_reviews/fix_registry_write_race_code_review.md`). The implementer reads only this file to apply the fix. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**File:** `cli/templates/scripts/lib/harness-run-lib.sh` (`hr_registry_lock`), at the block opened by `if [ "$m" -gt 0 ] && [ "$now" -gt 0 ] && [ $((now - m)) -ge 10 ]; then`, and the `THE RUN REGISTRY.` section comment's paragraph beginning `# STALENESS IS THE LOCK DIRECTORY'S AGE, NEVER A PID.`

**The problem.** Any number of waiters can run the breaker at once, and the breaker renames the lock path before it knows whose lock it holds. It takes three steps:

1. It judges the lock stale from the lock directory's mtime (`m=$(hr_lane_mtime "$lock")`, then `date`, then the `-ge 10` test).
2. **Only then** does it read the `owner` it will compare against (`seen`).
3. It renames the lock aside (`mv "$lock" "$stale"`) and reads the moved owner (`moved`). It restores the directory only when `moved != seen` **and** `[ ! -e "$lock" ]`. Otherwise it empties the directory and removes it.

The section comment says restoration covers *"a second breaker that re-took the lock between the judgement and the rename"*. It does not, in two ways. This is the story plan's first named top risk, *"two breakers of one stale lock"*, and the writers do reach this point together. Every waiter polls every 0.05 s, so every waiter crosses the 10 s age within the same second. The waiters are the watcher's main loop, its `( … ) &` engine subshell and `remote-run.sh`.

- **The re-take lands before step 2.** Holder X crashes and leaves `<file>.lock` with owner X. That is expected: the header notes that the stall watchdog kills the engine subshell mid-write. Waiters A and B both pass step 1. B renames X's lock aside, removes it, loops, `mkdir`s a fresh lock and writes owner B. A reaches step 2 after that and reads `seen = B`. A renames B's live lock aside, reads `moved = B`, finds `moved == seen` and deletes B's lock.
- **The re-take lands after step 2, and a third waiter polls.** A and B both read `seen = X`. B breaks X's lock and re-takes it with owner B. A renames B's live lock aside, which frees the path. Before A reaches `[ ! -e "$lock" ]`, a third waiter C polls, and its `mkdir "$lock"` succeeds. A finds `moved (B) != seen (X)`, but the lock path exists, so A skips the restore and deletes B's lock. Moving the `seen` read above step 1 does not close this path.
- **The rename lands in B's owner-write window.** If A renames B's lock after B's `mkdir` and before B's `printf … >"$lock/owner"`, B's owner write fails. B's cleanup `rmdir "$lock"` can then remove the directory A has just restored, and B's write returns 1.

In the first two paths, two writers hold the lock at once. The second `mv` over `registry.json` drops the first writer's key. That is the lost update this branch exists to close, and neither writer reports it.

All three paths have one cause: a breaker renames a lock that is live. Each restore check runs after the rename has already freed the path, so no check placed there can close the window. The fix is to make sure a breaker never renames a live lock.

Test `(c)` in `cli/test/registry-writer.test.mjs` has only one breaker, so it cannot reach any of these paths.

**Fix.** Allow one breaker at a time behind a second `mkdir` mutex, `<file>.lock.break`. The breaker judges the lock's age again **under** that mutex, then renames the lock. This removes the restore logic entirely.

Under the mutex:

- A lock another breaker has re-taken since the first judgement has a fresh mtime, so the second judgement leaves it alone. That covers B's own `mkdir`-to-owner window, because `mkdir` stamps the directory's mtime.
- The lock path cannot be freed and re-taken between the second judgement and the rename. Only a breaker frees it, and breakers are serialized, or the lock's own holder frees it, and the stale rule treats that holder as dead.

A breaker the watchdog kills while it holds the mutex leaves the mutex behind. So a mutex 10 s old is removed by the next waiter.

- [ ] In `hr_registry_lock`, change the `local` line to drop `seen moved` and add `bm`:

  ```bash
    local lock="${1-}.lock" token="${2-}" polls=0 start="" now m stale bm
  ```

- [ ] Replace the whole block from `if [ "$m" -gt 0 ] && [ "$now" -gt 0 ] && [ $((now - m)) -ge 10 ]; then` through its closing `fi` (the one directly above `sleep 0.05`) with:

  ```bash
      if [ "$m" -gt 0 ] && [ "$now" -gt 0 ] && [ $((now - m)) -ge 10 ]; then
        if mkdir "$lock.break" 2>/dev/null; then
          # One breaker at a time: judge the age again under the mutex, so a
          # lock re-taken since the judgement above is fresh and left alone.
          m=$(hr_lane_mtime "$lock")
          now=$(date +%s 2>/dev/null) || now=0
          case "$now" in '' | *[!0-9]*) now=0 ;; esac
          if [ "$m" -gt 0 ] && [ "$now" -gt 0 ] && [ $((now - m)) -ge 10 ]; then
            stale="$lock.stale.${token##*.}"
            if mv "$lock" "$stale" 2>/dev/null; then
              rm -f "$stale/owner" 2>/dev/null || :
              rmdir "$stale" 2>/dev/null || :
            fi
          fi
          rmdir "$lock.break" 2>/dev/null || :
          polls=$((polls + 1))
          continue
        fi
        # Another breaker holds the mutex. One the watchdog killed inside it
        # left it behind: a mutex 10 s old is removed here.
        bm=$(hr_lane_mtime "$lock.break")
        if [ "$bm" -gt 0 ] && [ $((now - bm)) -ge 10 ]; then
          rmdir "$lock.break" 2>/dev/null || :
        fi
      fi
  ```

  Leave the lines above and below it (the `mkdir "$lock"` take, the wait ceiling, `sleep 0.05`, the stderr line) as they are.

- [ ] Amend the `THE RUN REGISTRY.` section comment in the same edit, so the header describes the code and claims only what it keeps. In the paragraph beginning `# STALENESS IS THE LOCK DIRECTORY'S AGE, NEVER A PID.`, replace the sentence *"Breaking renames the lock aside before emptying it, as `hr_lane_acquire` does, and restores it when the `owner` it moved is not the one it judged stale — a second breaker that re-took the lock between the judgement and the rename."* with this text, rewrapped to the file's comment width:

  > BREAKERS ARE SERIALIZED, AND NONE RENAMES A LIVE LOCK. A waiter that judges the lock stale takes a second `mkdir` mutex, `<file>.lock.break`, judges the lock's age again under it, and only then renames the lock aside and empties it, as `hr_lane_acquire` does. A lock re-taken since the first judgement is fresh, so the second leaves it alone. Between the second judgement and the rename, nothing but a breaker or the lock's own holder frees the path: breakers are serialized, and the holder of a lock that old is dead by the stale rule. The watchdog can kill a breaker inside the mutex, so a mutex 10 s old is removed by the next waiter. That removal is the one window left open. Two waiters that judge one abandoned mutex old together can both remove it, and the second can remove the fresh mutex the first has just taken. Two breakers then judge the lock at once, so reaching it takes a breaker killed inside the mutex, a stale lock and three concurrent writers.

- [ ] Add two cases to `cli/test/registry-writer.test.mjs` next to `(c)`:
  - `'(e) many writers arriving at one stale lock all survive, and no lock directory is left behind'`:
    - Build the registry and the aged lock exactly as `(c)` does: `freshRegistry()`, `hr_registry_init`, `mkdirSync(lock)`, an `owner` file, then `touch -t 200001010000` on the lock.
    - Start `WRITERS` concurrent `libCall('hr_registry_set "$@"', [file, BRANCH, \`key_${i}\`, \`v_${i}\`])` with `Promise.all`, as `(a)` does.
    - Assert that every writer exited 0, that every `key_i` equals `v_i` (the same `missing` check as `(a)`), and `assertNothingLeftBeside(dir)`.
  - `'(f) a break mutex left by a killed breaker is aged out, and the stale lock behind it is broken'`:
    - Build the registry and the aged lock as `(c)` does.
    - Then `mkdirSync(\`${lock}.break\`)` and age it with the same `touch -t 200001010000` call.
    - Run one `libCall('hr_registry_set "$@"', [file, BRANCH, 'status', 'running'])`.
    - Assert that it exited 0, that `readRegistry(file).runs[BRANCH].status` is `'running'`, and `assertNothingLeftBeside(dir)`.
- [ ] In the same file's header, rename `## Two non-obvious choices` to `## Three non-obvious choices` and add this item 3:

  > 3. **Case (e) gives many breakers one stale lock at once, but it does not show the race closed.** Whether two breakers interleave is scheduling, as in case (d), so a pass shows only that the rounds did not hit the window. The closure rests on the construction stated in the library's `THE RUN REGISTRY.` section: one breaker at a time judges the age again under the break mutex, and a re-taken lock is fresh. Case (f) covers that mutex's own staleness rule.

  This test file is the one this fix edits, so it is the only test the fix runs. The full suite runs later, in the Run gates phase.

**Deviations from plan:**

- Implementation: the `hr_registry_lock` block, the `local` line, the section comment and the two test cases landed as specified. The library header's write-exception 2 fence now names the `.break` mutex beside the `.stale.*` move-aside, so the fence covers every path the code writes.
- Evidence downgrade: cases `(e)` and `(f)` in `cli/test/registry-writer.test.mjs` were **not executed** by the implementer. Neither `.claude/context/cli.md` nor `.claude/context/conventions.md` states a single-file test command. The claim that they pass rests on reading the code, not on a run. They are deferred to the Run gates phase. `bash scripts/typecheck.sh` ran and printed `PASS: typecheck`. It does not cover `cli/templates/`.
