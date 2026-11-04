### Task 8 — PD28's fixtures: replace the judge's PD28 pin and the CL5 readings cases

**Goal:** Replace the two fixtures that pinned PD28's undecided state (the shape kept out of the judge's Linux table, CL5's verdict unchanged by its readings) with fixtures pinning the decision: the shape is a Linux sandbox refusal, and CL5 passes on it only when the lock path read as the placeholder inside the session.

**Depends on:** Task 4, which ships this interface:

- `scripts/lib/sandbox-probe/judge.sh` → `SP__LINUX_SANDBOX_STRINGS` gains a fourth and last member, the exact string `could not lock config file .git/config: File exists`. `sp__linux_refusal_names` prints `Read-only file system, Permission denied, Device or resource busy, could not lock config file .git/config: File exists`.
- `scripts/lib/sandbox-probe/legs-protection.sh` → `sp__git_cl5_grade <stream> <exact command> [<lock before> <lock inside> <lock after>]`. On Linux, when the result carries that shape, it grades `pass` only when before is `absent`, inside starts with `c` and carries `1, 3`, and after is `absent`. Otherwise it grades `not run`, with evidence saying the `File exists` refusal is the sandbox's only where the lock path read as its `/dev/null` placeholder inside the session. The evidence always ends with `; .git/config.lock read: before the session <b>, inside the session <i>, after it <a>`. With `SP_PLATFORM` empty nothing changes.

Task 4 owns the scripts, and this task only tests them.

### Targets

- `cli/test/sandbox-probe-judge.test.mjs`
- `cli/test/sandbox-probe-protection-legs.test.mjs`

**Work:**

- [ ] `sandbox-probe-judge.test.mjs`: replace the test `PD28: on Linux, File exists is not a known sandbox refusal, and the Linux table is unchanged` with one titled `PD28: on Linux, CL5's File exists lock refusal is a sandbox refusal, and the Linux table names it`. It has three subtests. **(a)** On Linux, the existing `cl5-file-exists` fixture judged `sandbox` for `git config sbx.probe true` is `pass`, quoting `Exit code 255: error: could not lock config file .git/config: File exists` as the judge quotes a sandbox line (follow the PD23 cases' `assertJudged` form). **(b)** With no platform it keeps its macOS grade, which is whatever the judge prints today for that fixture without `SANDBOX_PROBE_UNAME`, read once and pinned. **(c)** `sp__linux_refusal_names` prints the four-member string above. Rewrite the header sentence that says CL5's `File exists` stays out of the Linux table, so it states the decision and cites §5 PD28.
- [ ] `sandbox-probe-protection-legs.test.mjs`: replace the test `PD28: on Linux, CL5 carries the .git/config.lock readings only on File exists, its verdict unchanged` with one titled `PD28: on Linux, CL5's File exists refusal passes only where the lock path read as the placeholder inside the session`. Its subtests on Linux: the placeholder readings (`absent` / `crw-rw-rw- 1 nobody nogroup 1, 3 Nov  3 19:07 .git/config.lock` / `absent`) give `pass`. A lock present before the session (`-rw-r--r-- 1 probe probe 0 … .git/config.lock` before) gives `not run`. A regular file inside gives `not run`. A lock left after gives `not run`. Every subtest's evidence ends with the three readings verbatim. Add a no-platform subtest that the same stream keeps its macOS verdict and carries no readings. Keep `PD28: sp__git_lock_reading prints absent or the first line of ls -ld` unchanged. Rewrite the header's PD28 sentence to match.
- [ ] `sandbox-probe-protection-legs.test.mjs` → the test `sp__linux_refusal_names: the Linux pass sentence names the judge’s whole set`: keep its title byte for byte, and change its `assert.equal(run.stdout, 'Read-only file system, Permission denied, Device or resource busy')` to the four-member string Task 4 ships, `Read-only file system, Permission denied, Device or resource busy, could not lock config file .git/config: File exists`. This is the second pin of the old three-member table. The first is subtest (c) of the PD28 test in `sandbox-probe-judge.test.mjs` above.
- [ ] Reuse each file's existing fixtures, helpers and sourcing order. Add a stream fixture under `cli/test/fixtures/sandbox-probe/` only if no existing one carries the `File exists` result, and then write it with `@FIXTURE_ROOT@` for every path, as the suite's header requires.

**Verification:**

- `npm test --workspace cli -- test/sandbox-probe-judge.test.mjs` passes.
- `npm test --workspace cli -- test/sandbox-probe-protection-legs.test.mjs` passes.
- `git grep -n "Permission denied, Device or resource busy'" -- cli/test` prints nothing: no test still pins the three-member table, where the closing quote right after `busy` marks the old string's end.
- `git grep -n 'File exists is not a known sandbox refusal' -- cli/test` prints nothing, and both new titles are present byte for byte, because Task 13 cites them in `docs/sandbox-verification.md` §5 PD28.

**Deviations from plan:**

- Judge subtest (a): the plan says the Linux pass quotes `Exit code 255: error: could not lock config file .git/config: File exists`, but the judge quotes a Linux sandbox line without the `Exit code` prefix (`judge.sh` → `sp__layer`, the `sp__linux_refusal_line` arm), exactly as the PD23 pass cases do. Pinned the line `error: could not lock config file .git/config: File exists`; the `Exit code 255: …` form is the no-platform subtest (b)'s `fail` evidence. Both pins verified by the passing run of `npm test --workspace cli -- test/sandbox-probe-judge.test.mjs`. A direct `bash scripts/sandbox-probe.sh judge …` read of the macOS grade was refused (don't-ask mode); subtest (b)'s value rests on reading `sp__judge_matched` and that test run.
- Protection-legs PD28 test: the replaced test's `Operation not permitted carries no readings clause` subtest was dropped, as the plan's subtest list does not carry it; `sp__git_cl5_grade: a permission-layer refusal of CL5’s git config is not run` still pins that stream's macOS pass.
- The `main-anchor-isolation` tree guard was run with its output piped to `tail`, against the foreground no-pipe rule; it passed (`# tests 2`, `# pass 2`, `# fail 0`).
