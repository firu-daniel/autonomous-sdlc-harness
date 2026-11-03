### 1. `(g)(h)` launcher run test fails after the review-round launcher changes

**Site:** `cli/test/launch-sandboxed-gates.test.mjs`, the case `test('(g)(h) a started run is pending, collected by --wait, under the expected vector, and its placeholders swept'` (near line 387, navigation hint only), and the launcher it drives, `cli/templates/scripts/launch-sandboxed-gates.sh` (byte-identical to the self-adopted copy `scripts/launch-sandboxed-gates.sh`), step 6's new block `hr_registry_foreign_copy_var "$registry" "$main"` and its library function `hr_registry_foreign_copy_var()` in `cli/templates/scripts/lib/harness-run-lib.sh` (mirrored in `scripts/lib/harness-run-lib.sh`).

**Failing test:** `cli/test/launch-sandboxed-gates.test.mjs` — `(g)(h) a started run is pending, collected by --wait, under the expected vector, and its placeholders swept`

**Failure, as the log reports it:**

```
== gate 4 — init against a throwaway fixture
  FAIL  4 npm test (exit 1)
        not ok 351 - (g)(h) a started run is pending, collected by --wait, under the expected vector, and its placeholders swept
...
        # tests 3310
        # pass 3304
        # fail 1
        # skipped 5
```

The log carries **no assertion detail** for test 351: the gate runner kept only the `not ok` line and the tail of the TAP stream, so which of the case's assertions failed is not recorded. Everything this finding needs from the log is quoted above.

**Diagnosis.**

1. **The case passed earlier on this branch.** The lane's `task_round_2.verdict` is `pass`; since that round, the only code changes are the review-round commits `08afd3af` (Finding 2 — the clone arm reads its per-run profile path from the run registry's `run_profile`), `645bce2d` (Finding 4 — header comment only) and `8e3175bf` (Finding 1 — step 6 refuses the main checkout as the target unless the run registry shows job mode). So the failure is new relative to the passing task round, most likely introduced by one of those three commits — or a timing failure under load (the suite ran for about 40 minutes: `# duration_ms 2394738`).

2. **What `(g)(h)` exercises that its siblings do not.** Cases `(l)`, `(m)` and `(q)` also launch the main checkout as the target and collect a `pass`, and all three passed in this run. `(g)(h)` is the only case that:
   - asserts `r.stderr` is exactly `''` on the launch (`assert.deepEqual([r.status, r.stdout, r.stderr], [3, 'pending\n', ''], …)`);
   - installs the `setsid` stub (`launcherFixture(t, { setsid: true })`) and asserts `setsid.txt` holds exactly `bash <dir>/scripts/launch-sandboxed-gates.sh --supervise <dir> gates_round_1`;
   - asserts the whole `bwrap` argv equals `expectedVector(...)` with **no run registry present** (`(q)` writes one first);
   - waits for every placeholder to be swept, then compares `snapshotTree(f.dir)` before and after and requires that nothing outside `sdlc-harness/test_run_logs/` changed.

3. **What the static reading of the new code shows.** With no `sdlc-harness/autonomous_logs/registry.json` in the fixture, `hr_registry_foreign_copy_var` takes `[ -e "$file" ] || [ -L "$file" ] || return 0` and writes nothing; `hr_state_path` only prints a path. Neither the step-6 block nor the step-8 branch (the `else` arm is clone-only) creates a file, prints to stderr or adds a vector element on this path. The static reading therefore identifies **no** deterministic cause in the three commits for this case, which leaves two live candidates: (a) a stderr line or tree change the new step-6 block emits on the macOS / bash 3.2 host the run used (e.g. `hr_canonical_path_nogit` or `hr_state_dir` writing a diagnostic to stderr, which only `(g)(h)` asserts against), or (b) a timing bound in the case's poll loops (`f.until(...)`, `f.collect(...)`, `POLL_LIMIT = scaleBound(600)`) exceeded under the 40-minute suite's load.

**Fix.**

- [ ] Establish which assertion of `(g)(h)` fails in the current tree before changing anything; the log does not say.
- [ ] If the failing assertion is the launch's `r.stderr === ''` or the snapshot comparison: trace the extra stderr line or the changed path to the step-6 job-mode block (`hr_state_path` / `hr_registry_foreign_copy_var`) or whatever emits it, and make that path silent and write-free when the registry is absent. Apply the same edit to `cli/templates/scripts/launch-sandboxed-gates.sh` / `cli/templates/scripts/lib/harness-run-lib.sh` **and** their self-adopted copies `scripts/launch-sandboxed-gates.sh` / `scripts/lib/harness-run-lib.sh`, keeping each pair byte-identical as commits `08afd3af` and `8e3175bf` did.
- [ ] If the failing assertion is the vector comparison (`assert.deepEqual(argv, expected)`): reconcile `expectedVector` in the test with `lsg_bwrap_args_var` in the launcher for the main-checkout target with no registry — fix whichever side diverges from the launcher header's stated vector (THE BWRAP VECTOR), never by loosening the comparison.
- [ ] If the failing assertion is a timeout in `f.until(...)` or `f.collect(...)`: find what makes the supervisor's collect or sweep slow on this path and fix it in the launcher; widen a bound only if the run is correct and merely slow, through `scaleBound` as the file already does, and say why in the case.
- Do not delete, skip or weaken any assertion of `(g)(h)` to make it pass.

## Already passing

- **(a) Named test and file run:** `(g)(h) a started run is pending, collected by --wait, under the expected vector, and its placeholders swept`, in `cli/test/launch-sandboxed-gates.test.mjs` (the whole file, which compiles the CLI first through `pretest`).
- **(b) Command and result:** `npm test --workspace cli -- test/launch-sandboxed-gates.test.mjs`, run from the repository root on HEAD `6348b7f4` (macOS host, Darwin 24.6.0): `ok 7 - (g)(h) a started run is pending, collected by --wait, under the expected vector, and its placeholders swept` (`duration_ms: 3387.626166`); file totals `# tests 16`, `# pass 16`, `# fail 0`, exit 0. Run in isolation, the case passes on the three review-round commits, so no assertion of it fails deterministically in the current tree; the Phase G failure is consistent with diagnosis candidate (b), a poll bound exceeded under the full suite's load (`# duration_ms 2394738`), which this single-file run cannot reproduce or refute.
- **(b′) Re-run on re-dispatch (layer `general`, path `.`):** same command, same HEAD `6348b7f4`, same host: `ok 7 - (g)(h) a started run is pending, collected by --wait, under the expected vector, and its placeholders swept` (`duration_ms: 3520.373208`); file totals `# tests 16`, `# pass 16`, `# fail 0` (`# duration_ms 42626.096791`), exit 0. Whole-tree `bash scripts/typecheck.sh`: `PASS: typecheck`. No tree guard selected: the only changed path is this file, which no `treeGuards[].covers` glob matches.
- **(c)** No code file was edited; this section is the only write.
