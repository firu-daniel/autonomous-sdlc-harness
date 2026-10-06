### Task 3 — `push-branch.sh` retries a push the remote refused, at most three attempts in all, and never a `[rejected]` one

**Goal:** A transient server-side refusal of a push gets bounded retries before the push is given up: `remote: fatal error in commit_refs` / `! [remote rejected] … (failure)` in Gate 12 round 8, finding 2. A push that lost a race to someone else's commit is never retried.

**The rule this task must keep.** `docs/github-run-control.md` → `## 2.` states: *"A push that loses a race fails loudly, and is never fetched, rebased or retried."* Git reports a lost race as `! [rejected] … (non-fast-forward)` or `(fetch first)`. Git reports a server-side refusal as `! [remote rejected] …`, and a transport failure with no ref line at all. So:
- a `[rejected]` line means not retried;
- any other failure is retried.

The script never fetches, never rebases and never forces.

**Where this task stops.** `push-branch.sh` keeps its contract for every caller: one call, exit `0` on every path, and only a fast-forward push. Its callers include the `committer` agent, the plugin's orchestrators, the watcher, `harness-run.yml`'s `Push the branch` step, and `hr_push_landed`. This task adds no exit code. Telling "the remote moved" from "the push was refused" after the fact is **Task 4's**: Task 4 does it in `hr_push_landed` by comparing refs, and never by parsing this script's output.

### Targets

- `cli/templates/scripts/push-branch.sh`: the push block, two constants, and the header paragraphs `EVERY FAILURE PATH IS NON-FATAL`, `WHAT IT NEVER DOES` and `REPRO`.
- `cli/test/push-branch-retry.test.mjs` (new): the retry behaviour against a throwaway bare origin.
- `cli/test/remote-start.test.mjs`, `cli/test/remote-collect.test.mjs` and `cli/test/watcher-remote-dispatch.test.mjs`: only to pass `PUSH_RETRY_DELAY_SECS: '0'` in the environment of each case whose origin refuses a push (`pre-receive` hooks and `rejectUpdates`). Those cases then do not wait the default delays.

**Work:**

- [ ] **The constants.**
  - `PUSH_ATTEMPTS=3`, the attempts in all.
  - `PUSH_RETRY_DELAY_SECS="${PUSH_RETRY_DELAY_SECS:-5}"`, shape-checked as a non-negative integer and replaced by `5`, with one line, when it is not one.

  Wait `PUSH_RETRY_DELAY_SECS` before the second attempt and three times that before the third: 5 s, then 15 s by default. The header names the variable as a test and tuning seam, read from the environment.
- [ ] **The loop.** For each attempt:
  1. run the existing push command (`git push`, or `git push --set-upstream origin <branch>` with no upstream), capturing its combined output;
  2. print the output, so the caller's log keeps git's own lines;
  3. on exit 0, print `push-branch.sh: pushed <branch> to origin` and stop;
  4. on a failure whose output has a line matching `^ ! \[rejected\]`, print `push-branch.sh: push failed for <branch>: origin has commits this branch does not (not retried)` and stop;
  5. on any other failure with attempts left, print `push-branch.sh: push failed for <branch> (attempt <n> of <PUSH_ATTEMPTS>); retrying in <s>s`, sleep, and go again;
  6. after the last attempt, print `push-branch.sh: push failed for <branch> after <PUSH_ATTEMPTS> attempts (see output above)`.

  Every path still exits 0. The `push failed for <branch>` prefix stays on every failure line, because logs and Gate 12 records quote it.
- [ ] **The header.**
  - `EVERY FAILURE PATH IS NON-FATAL`: a refused push is retried up to `PUSH_ATTEMPTS` before it is given up, and is still never fatal.
  - `WHAT IT NEVER DOES`: it never retries a `[rejected]` push, never fetches, never rebases. A push that lost a race fails loudly, which is the run-control rule of record.
  - `REPRO`: add two cases against the existing fixture.
    - A `pre-receive` hook that refuses its first call only, keyed on a counter file under the bare repository, gives exit 0 and a landed push after one "retrying" line.
    - A second clone's commit pushed first gives exit 0, a `(not retried)` line and one push attempt.
- [ ] **`push-branch-retry.test.mjs`.** Open with the rule this suite enforces: a refused push is retried at most `PUSH_ATTEMPTS` times in all, a `[rejected]` push never, and every path exits 0. Build each fixture under the system temp directory with `cli/test/helpers/fixture.mjs`. Run `init` first, so the installed `scripts/push-branch.sh` is the one exercised. Use a bare origin, and pass `PUSH_RETRY_DELAY_SECS: '0'`. Cases:
  - **Refused once, then accepted.** The hook refuses only its first call. Exit 0; origin's branch equals `HEAD`; exactly one `retrying` line.
  - **Always refused.** Exit 0; three attempts, counted by the hook's counter file; the `after 3 attempts` line; origin unchanged.
  - **The remote moved.** Another clone pushed a commit first. Exit 0; one attempt; the `(not retried)` line; origin still at the other clone's commit.
  - **A non-integer `PUSH_RETRY_DELAY_SECS`** (`x`) still pushes, after one line naming the fallback.
- [ ] **The suites whose origin refuses.** Grep for them:

  ```
  git grep -nE "pre-receive|rejectUpdates" -- cli/test
  ```

  In each case that a hit sets up, pass `PUSH_RETRY_DELAY_SECS: '0'` through that case's environment. Change no assertion, except any that counts push attempts or matches the old single failure line exactly. Name in your return each suite you edited and each you judged and left alone.

**Verification:**

- `npm test --workspace cli -- test/push-branch-retry.test.mjs`, from the repository root, passes. Run each further suite this task edited the same way, one file at a time.
- `bash scripts/typecheck.sh` exits 0.
- Grep `push-branch.sh` for `--force`, `fetch` and `rebase` in executable lines: none.
