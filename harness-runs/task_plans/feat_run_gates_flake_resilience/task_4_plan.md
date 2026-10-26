### Task 4 — Document `HARNESS_TEST_TIME_SCALE` in `docs/development.md` → Gate 4

**Goal:** Document the multiplier where this repository documents running its tests, `docs/development.md` → `## 5. Verifying a change` → **Gate 4 — `init` against a throwaway fixture.** Add one line on when to raise it, and correct the one sentence in that gate that states a bound which now scales.

**Depends on:** Tasks 1, 2 and 3. Task 1 ships `cli/test/helpers/timing.mjs`, which reads `HARNESS_TEST_TIME_SCALE` once at load:
- unset, the default is `2`;
- a decimal number above 0 and at most `5` is the scale;
- `1` keeps every bound at its written value;
- anything else, including an empty value, `0` or a value over 5, fails every importing file's load, with the value quoted.

Every ceiling goes through `scaleBound(base) = Math.ceil(base * scale)`. Tasks 2 and 3 move the suites' ceilings onto it. This task describes those facts and changes no code. It is the **catch-all** task, and it ships last because it documents what the `cli` tasks built.

### Targets

- `docs/development.md`, the two Gate 4 sites in the story index's `## Scope register`: row 2 (the new paragraph) and row 3 (the **A hung case cannot hold the gate.** paragraph).

**Work:**

- [ ] **The new paragraph, after the `HARNESS_TEST_CONCURRENCY=1 npm test` block** in **Where the time goes.**, and before *"Rehearsing it by hand…"*. Add a bold-led paragraph, **The time limits scale.**, followed by a fenced block holding the one command `HARNESS_TEST_TIME_SCALE=4 npm test` on its own line (`harness-runs/lessons.md`: a command an adopter runs sits in a fenced block, one per line). The paragraph says:
  - every "until X happens" ceiling in the suite (a polled wait's budget, a `runBash` `timeoutMs`, the watcher `tick` bound) is multiplied by `HARNESS_TEST_TIME_SCALE`, read once from `cli/test/helpers/timing.mjs`;
  - a ceiling costs a passing run nothing;
  - windows a case waits out on purpose, and durations that are the behaviour under test, are not scaled, and that helper's header lists them;
  - the default is `2`, `1` restores the written values, and the cap is `5`, so the largest scaled bound stays below `--test-timeout=1800000`;
  - the one line on when to raise it: *raise it on a slow machine or a small CI runner, such as a 2-vCPU hosted runner, when timing-bound cases fail in a full run but pass when their file runs alone.*

  Cite no wall-clock figure. This branch measured none, and none may be taken in a session (`harness-runs/lessons.md` → *"A wall-clock figure in a document of record is never one a run measured inside its own session"*).
- [ ] **The **A hung case cannot hold the gate.** paragraph.** Amend the parenthesis *"`cli/test/test-timeout.test.mjs` bounds its hung child at 2 seconds, inside its own 240-second `--test-timeout`"* so it says the 2-second bound is fixed and the 240-second child timeout is scaled by `HARNESS_TEST_TIME_SCALE`. Then add one clause to the sentence ending *"…leaving no watcher behind"*: the watcher bounds it names are scaled too, and they stay below the suite's `--test-timeout` at the cap. Leave every other sentence in that paragraph unchanged.

**Verification:**

- Re-run both of the story index's `## Scope register` derivation commands verbatim. Every hit is either a register row or one of the new Gate 4 lines carrying `HARNESS_TEST_TIME_SCALE`, and no hit falls outside them.
- The default (`2`), the cap (`5`), the identity value (`1`) and the helper path stated in the new paragraph match `cli/test/helpers/timing.mjs` → `DEFAULT_TIME_SCALE`, `MAX_TIME_SCALE` and its header, as read from the file rather than from this plan.
- The new command sits alone in its own fenced block, and the paragraph's raise-it line names both a slow machine and a small CI runner.
