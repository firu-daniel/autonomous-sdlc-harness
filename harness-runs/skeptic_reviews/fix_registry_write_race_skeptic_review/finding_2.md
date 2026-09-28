### 2. `docs/development.md` cites `cli/test/test-timeout.test.mjs` as proof of a `--test-timeout` behaviour the test never reaches

> **Self-contained per-finding file** for the `fix_registry_write_race` skeptic-review index (`harness-runs/skeptic_reviews/fix_registry_write_race_skeptic_review.md`). The implementer reads only this file to apply the fix. The committer flips this finding's checkbox in the index's `## Phase 2 Readiness — Ordered Fix List`, never here.

**File:** `docs/development.md` → `**Gate 4 — `init` against a throwaway fixture.**`, the paragraph opening `**A hung case cannot hold the gate.**`, at the parenthetical `(`cli/test/helpers/fixture.mjs` → choice 6, proven by `cli/test/test-timeout.test.mjs`)`.

**The problem.** The paragraph states a runner behaviour as a fact of record:

> *"under Node 20.19.5 it kills the file's process without aborting the test's signal"*

It then cites `cli/test/test-timeout.test.mjs` as its proof. That test cannot reach the behaviour, for three reasons:

- **The runner's timeout never expires in it.** The child runs under `--test-timeout=${CHILD_TEST_TIMEOUT_MS}`, which is `30_000`. The hung call inside it is `runBash(…, { timeoutMs: ${CHILD_BOUND_MS}, signal: t.signal })`, with `CHILD_BOUND_MS = 2_000`. `runBash`'s own timer fires at 2 s, kills the group and rejects with `runBash timed out after 2000 ms: …`. The case then fails on that rejection, 28 s before the runner's timeout would expire.
- **Its assertions pass the same way on any Node version.** It asserts `not ok … - a watch loop that never returns` and `/timed out|cancelled/`, and `runBash`'s rejection satisfies both. The test would pass unchanged whether or not a runner timeout aborts `t.signal`, and whichever process it kills.
- **Its own header claims only the `runBash` half.** It says the `runBash` bound "is what reaps", and it states the Node behaviour as an assumption.

So the cited source does not support the claim. `.claude/context/conventions.md` → `## Documents of record` requires a measured fact to state what was measured, the command and the exact message, *"so a later version that behaves differently is detectable"*. A maintainer who upgrades Node will read *"proven by `cli/test/test-timeout.test.mjs`"* as the detector for that change, and it detects nothing. The code-review index accepted this citation as the reproducing test.

The same paragraph also says the bound covers *"every watcher run in `cli/test/watcher-remote-job.test.mjs`"*. That file's own header excludes one case: *"The case "a job killed mid-run leaves running / continue" spawns and kills its own group, and is not bounded here."* That case calls `spawn` directly, not `runBash`.

Neither misstatement changes what the code does, so this is Should Fix.

**Fix.** Make the paragraph claim only what its sources show.

- [ ] Replace `(`cli/test/helpers/fixture.mjs` → choice 6, proven by `cli/test/test-timeout.test.mjs`)` with:

  > (`cli/test/helpers/fixture.mjs` → choice 6; no case in the suite drives that expiry — `cli/test/test-timeout.test.mjs` bounds its hung child at 2 seconds, inside its own 30-second `--test-timeout`, so it proves the `runBash` bound below and not this)

- [ ] In the next sentence, replace `and every watcher run in `cli/test/watcher-remote-job.test.mjs`` with:

  > and every watcher run in `cli/test/watcher-remote-job.test.mjs` except *"a job killed mid-run leaves running / continue"*, which spawns and kills its own process group

This fix edits no test file, so it runs no test. The full suite runs later, in the Run gates phase.
