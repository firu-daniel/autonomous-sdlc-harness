### 2. `hr_push_landed` answers "refused" when its own fetch shows the push landed

**File:** `cli/templates/scripts/lib/harness-run-lib.sh` (`hr_push_landed`) — "git -C \"$worktree\" merge-base --is-ancestor \"$upstream\" \"$head\" && return 1"

The rewritten function's header says it answers `0` when "`HEAD` and `refs/remotes/origin/<branch>` resolve and are equal". The code checks equality only before its fetch:

```bash
  upstream=$(git -C "$worktree" rev-parse --verify --quiet "refs/remotes/origin/$branch") \
    && [ "$head" = "$upstream" ] && return 0
  git -C "$worktree" fetch --quiet origin "+refs/heads/$branch:refs/remotes/origin/$branch" || return 1
  upstream=$(git -C "$worktree" rev-parse --verify --quiet "refs/remotes/origin/$branch") || return 1
  git -C "$worktree" merge-base --is-ancestor "$upstream" "$head" && return 1
```

Suppose the fetch shows that origin's tip already equals `HEAD`. That happens when a push the server committed was still reported to the client as a failure, which is the shape of round 8's `remote: fatal error in commit_refs`, and when it was `push-branch.sh`'s last attempt there is no later attempt to refresh the tracking ref. A commit is its own ancestor, so `merge-base --is-ancestor` succeeds and the function returns `1`. `start` and `review` then report "the remote refused the push" and dispatch nothing, although the round or the prompt is on origin.

For `collect` that leaves the round stranded. The round file is committed on origin, so a re-run of `collect` finds its reviews already recorded in that round's marker and starts nothing, and the committed round never runs.

**Fix:** after the fetch, answer `0` on equality before the ancestry test:

```bash
  git -C "$worktree" fetch --quiet origin "+refs/heads/$branch:refs/remotes/origin/$branch" || return 1
  upstream=$(git -C "$worktree" rev-parse --verify --quiet "refs/remotes/origin/$branch") || return 1
  [ "$head" != "$upstream" ] || return 0
  git -C "$worktree" merge-base --is-ancestor "$upstream" "$head" && return 1
```

- [ ] In the function comment, change the `0` line to: "`0  landed: `HEAD` and `refs/remotes/origin/<branch>` resolve and are equal, before or after that fetch;`".
- [ ] Add a case to `cli/test/remote-start.test.mjs`, beside "a push of the prompt commit that origin rejects exits 4, calls no gh and leaves nothing local". Replace the fixture's `scripts/push-branch.sh` with a stub that pushes `HEAD` to `refs/heads/feat_x` by origin's **path** (`git -C "$1" push <origin path> HEAD:refs/heads/feat_x`), so the push lands without updating `refs/remotes/origin/feat_x`, and exits 0. Assert that `start` does not exit 4 and that its dispatch call is made. Run `npm test --workspace cli -- test/remote-start.test.mjs` from the repository root. That is the only test this fix runs.
