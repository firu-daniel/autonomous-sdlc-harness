### Task 6 — Add `flow-walker-concurrency.test.mjs`: simultaneous recording and the stale lock

**Goal:** Prove the property a per-gate driver relies on — several sessions recording their gates' outcomes at the same moment all land, none is lost, and exactly one of them prints the round's result — and that a lock left behind by a killed call does not wedge the walk.

**Depends on:** Task 3, whose walker serialises `start` and `next` on the directory `<state_dir>/.flow_walker_state.lock` (taken with `mkdir`, kept empty, removed on every exit path, treated as stale once `find <lock> -maxdepth 0 -mmin +1` prints it, waited for at most 120 s), prints `action: wait` while gates are out and the round's result at the set's last outcome. Task 4, whose `helpers/walker.mjs` exports `runConcurrently(dir, steps, options)` — every step's file planted first, then every `next` issued at once, resolving to each call's `{ status, stdout, stderr, action }` in step order with no status asserted — and `walkerStatePath(dir)`.

**Where this task stops.** One new suite; no helper or walker edit. The lock's literal mechanism is pinned only where a driver can observe it: the outcomes, the single result, and that no lock directory survives.

### Targets

- `cli/test/flow-walker-concurrency.test.mjs` (new)

**Work:**

- [ ] Header: the rule — *recording is safe under concurrent calls: every outcome of simultaneous `next` calls lands, exactly one call prints the round's result, and no call leaves the lock behind* — and the fixture rule, as the other walker suites state it.
- [ ] Case `(1) three outcomes recorded by simultaneous next calls all land, and exactly one prints the round's result`: after the set is printed, `runConcurrently` with the three gates' `PASS` (or two `PASS` and one `FAIL`, in a second sub-case); assert every status is 0, exactly one action carries a `round:` line (the others are `action: wait`), the result is the one the verdicts imply, `current` then prints that result, and `<state_dir>/.flow_walker_state.lock` does not exist. Repeat the simultaneous recording over several fresh fixtures in a loop (state the count in the case and why: a race that lands one time in many would pass a single run), never with `--test-name-pattern`.
- [ ] Case `(2) a lock older than a minute is broken, and the call proceeds`: create the lock directory by hand, set its modification time two minutes back with `utimes`, then record one outcome: exit 0, the expected `wait` action, and no lock directory left. Case `(3) a fresh lock held by another call is waited for, never broken`: create the lock directory with the current time, start one `next` without awaiting it, remove the directory after a short delay, and assert the call then exits 0 with its action — bounded by a timeout well under the walker's 120 s, stated in the case.

**Verification:**

- `npm test --workspace cli -- test/flow-walker-concurrency.test.mjs` passes, from the repository root, as one plain foreground command — the task's own test file.
- With the lock acquisition in `next` removed from `cli/templates/scripts/flow-walker.sh` and reverted after — the mutation applied to the template alone, as `cli/test/run-analytics-tokens.test.mjs`'s header records its own — case `(1)` fails at least once across its repetitions; the header records it as `run red once on feat_parallel_plan_reviews`. `git diff --stat cli/templates` is empty afterwards. Where the session cannot run the mutation, record it as not run, never as red.
