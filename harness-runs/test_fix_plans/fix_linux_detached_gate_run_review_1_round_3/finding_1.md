### 1. `(l)` fails because the `bwrap` stub leaves a 0-byte `scripts/.git`, and the unsandboxed `--wait` collector reads it before the supervisor sweeps it

**Site:**
- `cli/test/launch-sandboxed-gates.test.mjs`:
  - the `bwrap` stub `BWRAP_STUB`, at its post-exit conversion line `'for p in ${made[@]+"${made[@]}"}; do rm -f "$p"; : > "$p"; chmod 444 "$p"; done',` (near line 103, navigation hint only);
  - the stub's doc comment above `const BWRAP_STUB = [`, the sentence `and the 0-byte 0444 file bubblewrap leaves on the host once it exits.` (near line 71);
  - the file header's sentence `The stub emulates bubblewrap's placeholder` (near line 16);
  - the collector `async collect(target, label = LABEL)` in `launcherFixture` (near line 226), which runs `run-test-suite.sh --wait` on the host, outside any sandbox.
- The code that refuses: `cli/templates/scripts/run-test-suite.sh` (self-adopted copy `scripts/run-test-suite.sh`), the line `root="$(hr_repo_root "$script_dir")" || refuse "'$script_dir' is not inside a git repository"`. It calls `hr_repo_root` in `cli/templates/scripts/lib/harness-run-lib.sh`, which runs `git -C "$dir" rev-parse --show-toplevel`.
- The sweep that closes the window: `cli/templates/scripts/launch-sandboxed-gates.sh`, `hr_placeholder_sweep_paths_var ${placeholders[@]+"${placeholders[@]}"}` in the `--supervise` branch. It runs only after `bwrap` (here, the stub) has exited.

**Failing test:** `cli/test/launch-sandboxed-gates.test.mjs`: `(l) the vector binds the target's .git read-only after every denyWrite entry, closing the omit trio`

**Failure, as the log reports it:**

```
not ok 359 - (l) the vector binds the target's .git read-only after every denyWrite entry, closing the omit trio
  ---
  duration_ms: 7673.672
  location: 'cli/test/launch-sandboxed-gates.test.mjs:610:1'
  failureType: 'testCodeFailure'
  error: |-
    status 2
    --stdout--

    --stderr--
    run-test-suite.sh: '/private/tmp/claude-501/harness-fixture-bz7ilK/scripts' is not inside a git repository

    + actual - expected

      [
    +   2,
    +   ''
    -   0,
    -   'pass\n'
      ]
  code: 'ERR_ASSERTION'
  ...
  stack: |-
    TestContext.<anonymous> (cli/test/launch-sandboxed-gates.test.mjs:615:10)
```

Line 615 is the case's second assertion: `assert.deepEqual([verdict.status, verdict.stdout], [0, 'pass\n'], output(verdict));`, on the result of `f.collect(f.dir)`.

**Diagnosis.**

1. **Class: new this round.** `(l)` is absent from `review_1_round_1.log` and `review_1_round_2.log`. It belongs to the same family as the earlier rounds' failures, though: round 1 failed `(g)(h)`, and round 2 failed `(q)` and `(m)`. This is the first round whose log carries the assertion detail, thanks to the `scripts/run-gates.sh` → `gate()` excerpt that round 2's Finding 1 added.
2. **This is not a timeout.** The case failed after 7.7 s. The launcher had already answered `[3, 'pending\n']`, because the first assertion at line 613 passed. The `--wait` collector then got a refusal with exit 2. So the round-2 cause, the unscaled 30 s start window, does not explain this failure.
3. **The refusal comes from the host-side collector, and it is caused by a `.git` placeholder under `scripts/`.**
   - The fixture's base profile write-denies `<main>/scripts/.git`, one `.git` at each level of `scriptsDir` (`docs/cli.md`, the paragraph `**Everything that runs outside the sandbox is write-protected on both sides**`). In the fixture that path is absent, so the launcher pins it with `--ro-bind /dev/null <dir>/scripts/.git` and lists it in `LSG_PLACEHOLDERS`.
   - While the gate command runs, the stub makes that path a symlink to `/dev/null`. Git's discovery skips over that.
   - Once the command exits, the stub runs `rm -f "$p"; : > "$p"; chmod 444 "$p"` for every placeholder. That turns `<dir>/scripts/.git` into an **empty 0444 regular file**.
   - The file stays there until the supervisor's `hr_placeholder_sweep_paths_var`, which runs only after the stub has exited.
   - In that window, any `git -C <dir>/scripts rev-parse --show-toplevel` fails. This branch measured that exact failure, `exit 128 fatal: invalid gitfile format`, when it wrote the stub (commit `1a301e00`). Its plan note `harness-runs/task_plans/fix_linux_detached_gate_run/task_4_plan.md` → **Deviations from plan** → **The placeholder emulation** records the same message, `'…/scripts' is not inside a git repository`, for a 0-byte `scripts/.git`.
4. **Why it fires at random, and only in the main-checkout cases.**
   - The inner `run-test-suite.sh --no-detach` writes `.verdict` before it exits. The stub's conversion and the supervisor's sweep come after that.
   - `collect` restarts `--wait` every second (`RUN_TEST_SUITE_WAIT_SLICE: '1'`). Each start runs `hr_repo_root "$script_dir"` first. Whether a start lands inside the conversion-to-sweep window is a matter of timing, and full-suite load widens that window. The supervisor runs a `find` and a few tests per placeholder, and the stub converts about 14 placeholders.
   - Only cases that launch **the fixture's main checkout** carry a `scripts/.git` placeholder: `(g)(h)`, `(q)`, `(l)` and `(m)`. These are exactly the four cases that have failed across the three rounds.
   - The clone cases `(k)` and `(n)` collect from a clone whose per-run profile denies only `protected.txt`. They have no `.git` placeholder, and they have not failed in any round.
   - It is therefore likely that rounds 1 and 2 hit this same window, but their logs carry no assertion, so this cannot be confirmed.
5. **The window is a gap in the emulation, not something a real caller sees.** The collector stands in for the session's own `--wait`. In a real run that call is sandboxed, and inside the session's sandbox every write-denied absent path, `<main>/scripts/.git` included, reads as the `/dev/null` character device (`docs/sandbox-placeholder-upstream-report.md`, the line beginning `- **2026-10-31, Claude Code 2.1.316, bubblewrap 0.8.0: unchanged.**`). The test's collector runs unsandboxed on the host, so it sees the stub's host-side leftover directly.
   - _Noted, not part of this finding:_ in job mode on a real bubblewrap host, the gate sandbox's host-side mount point at `<main>/scripts/.git` may exist as an empty file **for the whole gate run**, and an unsandboxed wrapper that places the main checkout from `scripts/` may meet it. That has not been measured on this branch. It is a question for review, not a failure this log names.

**Fix.**

- [ ] **Stop the stub from leaving a regular file at a `.git` leaf.** In `BWRAP_STUB`, change the post-exit loop so that a placeholder whose last path segment is `.git` has its `/dev/null` symlink removed (`rm -f "$p"`) and is **not** recreated as a 0-byte 0444 file. Every other placeholder keeps the current `rm -f "$p"; : > "$p"; chmod 444 "$p"` conversion.
  - Use only `case "${p##*/}" in .git) … ;; *) … ;; esac` inside the existing `for p in ${made[@]+"${made[@]}"}` loop. Keep it bash-3.2-safe.
  - This closes the window outright: no unsandboxed `git -C <dir>/scripts` ever meets an empty regular `.git`. It does not depend on timing.
- [ ] **Leave `(h)`'s sweep assertions as they are.** `assert.ok(placeholders.length > 0, …)` still holds. Every listed placeholder is still absent once the supervisor finishes: the `.git`-leaf one because the stub removed its link, every other one because the sweep removed its 0-byte file. The sweep is still exercised against the real leftover shape on every other placeholder (`.mcp.json`, `.claude/settings.local.json` and the root-level built-ins). `hr_placeholder_leftover_var` does not judge by leaf name.
- [ ] **Amend the stub's doc comment and the file header in the same edit,** as `.claude/context/cli.md` → `## What "done" means here` requires: a reviewer holds a change to its module's own header.
  - In the comment above `const BWRAP_STUB = [`, say that a `.git`-leaf placeholder is removed rather than left as the 0-byte 0444 file. Give the reason: this suite's `--wait` collector runs unsandboxed and places its root by `git rev-parse` from `scripts/`, so an empty regular `scripts/.git` between the stub's exit and the supervisor's sweep refused it (`'…/scripts' is not inside a git repository`). A real session's `--wait` is sandboxed and sees the `/dev/null` device there.
  - In the header paragraph beginning `Not covered, because no suite can show it`, add that the host-side leftover is not emulated for a `.git` leaf, for that reason.
- [ ] **Keep everything else.** Do not touch `STALE_BOUND_S`, the round-2 library override, `collect`'s poll, or any assertion of `(g)(h)`, `(q)`, `(l)` or `(m)`. Do not edit `run-test-suite.sh`, `harness-run-lib.sh` or `launch-sandboxed-gates.sh`. Their behaviour is not what failed, and `docs/cli.md` (the numbered point beginning `4. The wrappers' main checkout is placed from their own location`) makes the profile entry the only defence at `<main>/<scriptsDir>/.git`, so loosening `hr_repo_root` there is a security decision, not a test fix.
- Do not delete, skip or weaken any assertion, and do not retry `collect` on a refusal.
