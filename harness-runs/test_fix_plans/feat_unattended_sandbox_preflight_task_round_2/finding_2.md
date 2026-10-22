### 2. The legacy-run migration case with a fresh drop fails again under suite load

**Site:** `cli/test/run-copy-migration.test.mjs` → `test('a new drop beside a legacy run gets a clone, and the sweep removes only the legacy worktree', …)` (near line 181) and its single `await f.tick();` (near line 188). That pass runs through `cli/test/helpers/watcher.mjs` → `createWatcherFixture` → `async tick(env = {}, { sandboxProbe = DEFAULT_SANDBOX_PROBE } = {})`, which calls `runBash(…, { timeoutMs: TICK_TIMEOUT_MS, signal: t.signal })`, bounded by `const TICK_TIMEOUT_MS = 60_000;`. Its rationale is in the module header, choice 4 (`` `tick` is bounded at {@link TICK_TIMEOUT_MS} ``).

**Failing test:** `cli/test/run-copy-migration.test.mjs` — `a new drop beside a legacy run gets a clone, and the sweep removes only the legacy worktree`

**The failure, quoted from the log:**

```
        not ok 974 - a new drop beside a legacy run gets a clone, and the sweep removes only the legacy worktree
```

The gate wrapper keeps only the `not ok` lines and the tail of the suite's output, so the assertion message is not in the log. The failure is **persisting**: round 1's log carries the same line, as round 1's Finding 2.

**Diagnosis, from the current tree.** Round 1's Finding 2 ruled out the sandbox preflight on this path. That ruling stands, and the round-1 run showed it. `tick` overrides `hr_sandbox_prereq_probe_var` with `DEFAULT_SANDBOX_PROBE`, the gate host is macOS (where the library's own probe also answers 0), and the round-1 single-file run of this file passed the case: `ok 3`, `duration_ms: 12671.862375`, with no failure message. That run would have failed with `the new run was never launched` if the override had not reached the inbox pass.

What remains is the bound. This case's single pass does the most work of any case in the file. It resumes the legacy run, which commits through `commit-on-branch.sh` and pushes through `push-branch.sh`, then creates a clone for the new drop and launches a second session. Each stub sleeps before its body (module header, choice 1), and `tick` `wait`s for both. In isolation that took 12.7 s, about three times either sibling (3.99 s and 3.51 s). Under the gate's suite load it has now failed in two consecutive rounds (2,342 s and 2,199 s suite runs, with suites running concurrently per `cli/test/helpers/concurrency.mjs`). A pass that exceeds 60 s is killed by `cli/test/helpers/fixture.mjs` → `runBounded`, which rejects with `runBash timed out after 60000 ms: bash -c …`. Round 1's close recorded that its isolated run *"cannot reproduce that load, so this close does not rule (2) out"*, and that if the case failed again the first fix branch would apply. It has failed again, so this finding asks for that branch's fix.

**Fix.** No assertion in the case is deleted, skipped or loosened.

- [ ] In `cli/test/helpers/watcher.mjs`, widen `tick`'s options to `{ sandboxProbe = DEFAULT_SANDBOX_PROBE, timeoutMs = TICK_TIMEOUT_MS } = {}` and pass `timeoutMs` to `runBash` in place of the literal `TICK_TIMEOUT_MS`. Every existing caller keeps the 60 s bound.
- [ ] Document `timeoutMs` in `tick`'s own doc comment, which today documents only `sandboxProbe`.
- [ ] Amend header choice 4 in the same edit (`.claude/context/cli.md` → `## What "done" means here`: a change either satisfies its module's header or amends it). The new text should say that a case whose single pass launches more than one session may pass a larger bound, and that any bound stays below the suite's `--test-timeout` (`cli/package.json` → `scripts.test`, 1 800 000 ms), so a hung pass still fails by naming its command.
- [ ] In `cli/test/run-copy-migration.test.mjs`, change this case's pass to `await f.tick({}, { timeoutMs: 180_000 });`. Add a one-line comment saying the pass resumes one run (commit and push) and launches a second, so it takes the larger bound. Leave the two sibling cases' `f.tick()` calls unchanged.

**On a single-file run of this case.** Under `## The test-run rule` point 1 this unit may run the named file. The isolated pass is already on record from round 1 and showed nothing about the load the case fails under. A second isolated pass adds no evidence, so it does not make the fix unnecessary.

**If the gates still report this case after this fix**, the bound is not the cause. The next round's plan then needs the case's assertion message, which the gate wrapper does not keep.

- **Deviations from plan:** None in the fix itself. Evidence note: the claim that the 180 000 ms bound clears the failure under suite load was not executed here — the isolated `npm test --workspace cli -- test/run-copy-migration.test.mjs` run passed all three cases (`# pass 3`, `# fail 0`; this case `ok 3`, `duration_ms: 12890.687875`) but cannot reproduce the gate's concurrent load. That claim rests on the Run gates phase's `commands.test` run.
