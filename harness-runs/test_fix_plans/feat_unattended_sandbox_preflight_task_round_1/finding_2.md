### 2. The legacy-run migration case with a fresh drop fails in its one watcher pass

**Site:** `cli/test/run-copy-migration.test.mjs` → `test('a new drop beside a legacy run gets a clone, and the sweep removes only the legacy worktree', …)` (near line 181), and the `await f.tick();` it makes. That pass runs through `cli/test/helpers/watcher.mjs` → `createWatcherFixture` → `async tick(env = {}, { sandboxProbe = DEFAULT_SANDBOX_PROBE } = {})`, bounded by `TICK_TIMEOUT_MS` (`const TICK_TIMEOUT_MS = 60_000;`). The drop reaches `cli/templates/scripts/autonomous-watcher.sh` → `process_inbox_file`, and the branch's new preflight sits there: `if [ "$remote" != 1 ] && ! hr_sandbox_opted_out "$MAIN_REPO" && ! hr_sandbox_prereq_probe_var; then`.

**Failing test:** `cli/test/run-copy-migration.test.mjs` — `a new drop beside a legacy run gets a clone, and the sweep removes only the legacy worktree`

**The failure, quoted from the log:**

```
        not ok 974 - a new drop beside a legacy run gets a clone, and the sweep removes only the legacy worktree
```

The gate wrapper (`scripts/run-gates.sh` → `gate`) keeps only the `not ok` lines and the last 25 lines of the suite's output, and deletes its own log afterwards. The assertion message is therefore not in the log, and which assertion failed cannot be read from it. It is new this round: no earlier round exists.

**Diagnosis, from the current tree.** The two sibling cases in the same file pass: `a parked legacy worktree run resumes …` and `a paused legacy worktree run resumes …`. They build the same `legacyFixture` and call the same `f.tick()`. This case differs in two ways only:

1. **It is the only case in the file whose pass sees a fresh local drop** (`${NEW}_task_prompt.md`). That drop takes the path the branch changed: `process_inbox_file` now calls `hr_sandbox_opted_out "$MAIN_REPO"`, and through it `hr_config_load`, then `hr_sandbox_prereq_probe_var`. `tick` overrides the probe with `DEFAULT_SANDBOX_PROBE` (`HR_SANDBOX_HOST=macos; HR_SANDBOX_MISSING=; HR_SANDBOX_REFUSAL=; return 0`), and the gate host is macOS, where the library's own probe also answers 0. The preflight should therefore let the drop through. Other suites drive a fresh drop through the same `tick` and pass (for example `cli/test/watcher-sandbox-refusal.test.mjs`), which also argues against a refusal here. Reading the code finds no defect in the preflight on this path.
2. **Its one pass does the most work of any case in the file.** The pass resumes the legacy run, which commits through `commit-on-branch.sh` and pushes through `push-branch.sh`. It also creates a clone for `feat_new` and launches a second session. Both stubs sleep before their bodies run (`helpers/watcher.mjs` header, choice 1), and `tick` then `wait`s for both. All of this has to finish inside the 60-second `TICK_TIMEOUT_MS` bound. The gate's suite ran for 2,342 seconds across 2,264 tests, with the doctor and watcher suites running cases concurrently (`cli/test/helpers/concurrency.mjs`). On a host that loaded, this pass is the one in the file most likely to exceed the bound. If it does, `cli/test/helpers/fixture.mjs` → `runBounded` kills the pass's process group and rejects with `runBash timed out after 60000 ms: bash -c …`, and the case fails on that error.

The evidence favours (2). The fix is chosen by the message the case reports, because each candidate cause produces a different one.

**Fix.**

- [ ] **The message reads `runBash timed out after 60000 ms: bash -c …`.** The bound is too tight for a two-launch pass. (A `the watcher pass exited <status>` message is a watcher error, not this; it falls under the last branch.) In `cli/test/helpers/watcher.mjs`:
  - widen `tick`'s options to `{ sandboxProbe = DEFAULT_SANDBOX_PROBE, timeoutMs = TICK_TIMEOUT_MS } = {}` and pass `timeoutMs` to `runBash`;
  - document the option in `tick`'s own doc comment;
  - amend header choice 4 to say that a case whose single pass launches more than one session may pass a larger bound, and that the bound stays below the suite's `--test-timeout` (`cli/package.json` → `scripts.test`, 1 800 000 ms).

  In `cli/test/run-copy-migration.test.mjs`, call `await f.tick({}, { timeoutMs: 180_000 });` in this case only. Add a one-line comment saying the pass launches two sessions and pushes once, so it takes the larger bound. No assertion changes.
- [ ] **The message reads `the new run was never launched` (or `runs[NEW]?.copy_kind` is not `clone`), and the watcher log quoted in it says `this machine cannot sandbox an unattended run`.** The test-only probe override did not reach the inbox pass. Find out how it was lost: `tick`'s script defines `hr_sandbox_prereq_probe_var` after `. "$1" status`, so a launch path that re-sources the library in a new process would drop it. Make the override reach the pass the same way `cli/test/watcher-stall-reset-payloads.test.mjs` → `localStall` does. Do not add an environment switch to the watcher or the library; the `helpers/watcher.mjs` header, choice 5, forbids one.
- [ ] **Any other message.** The diagnosis above does not cover it. Fix what the message names, at the site it names, and record the message in this file's deviation note.

None of these branches deletes, skips or loosens an assertion in the case.

## Already passing

- **(a) What was checked:** the named test `a new drop beside a legacy run gets a clone, and the sweep removes only the legacy worktree`, by running its file `cli/test/run-copy-migration.test.mjs` (all three cases) before any edit.
- **(b) Evidence:** `npm test --workspace cli -- test/run-copy-migration.test.mjs`, from the repository root, Node v20.19.5, on an otherwise idle host: `ok 3 - a new drop beside a legacy run gets a clone, and the sweep removes only the legacy worktree`, `duration_ms: 12671.862375`; file totals `# tests 3`, `# pass 3`, `# fail 0`. The two sibling cases took `3987.907042` and `3510.886709` ms. No failure message was produced, so none of the three Fix branches is selected by a message. The named test's pass is unloaded: its one pass ran at roughly a fifth of `TICK_TIMEOUT_MS` (60 000 ms) and about three times either sibling, which is consistent with diagnosis (2) — a timeout only under the gate's concurrent, 2 342-second suite load — but a single-file run cannot reproduce that load, so this close does not rule (2) out. Phase G's next suite run re-tests it; if it fails again with `runBash timed out after 60000 ms`, the first Fix branch applies as written.
- **(c)** No code file was edited.
