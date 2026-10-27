### Task 14 — Test the probe's preflight refusals and its `shasum` guard

**Goal:** Cover the probe's start-up: the preflight refusals and their order, and the `shasum` guard over the three main-checkout files. No `claude` launched, and no fixture aimed at this repository.

**Depends on:**
- **Task 1** — the `preflight` subcommand and the exit codes (`2` a preflight refusal, `3` a protected main-checkout file changed).
- **Task 2** — `sp_preflight`, `sp_snapshot_take`/`sp_snapshot_check`, the refusal line `sandbox-probe: refusing to start: <reason>`, the guard line `sandbox-probe: FAILED: <path> changed during the probe`, and the three test-only seams `SANDBOX_PROBE_UNAME`, `SANDBOX_PROBE_DOCTOR`, `SANDBOX_PROBE_AGENT_CLI`.

This task adds a suite; it changes no probe file. The git judges and the leg table are **Task 15's** suite, a separate file.

**How the probe is reached.** The probe resolves its own checkout from `${BASH_SOURCE[0]}` (Task 1), and every preflight check and the snapshot run against that checkout (`SP_MAIN`, Task 2). The three `SANDBOX_PROBE_*` seams replace `uname`, `doctor` and the agent CLI only, **not the root**. So a probe invoked at `WORKSPACE_ROOT` judges this repository whatever cwd the test passes, which `.claude/context/conventions.md` → `## The testing bar` forbids (*"No fixture is ever created inside this checkout, and no test is ever aimed at this repository."*). Every case in this suite therefore runs a **copy of the probe inside an adopted fixture**:
- Build the fixture with `createWatcherFixture(t)` from `./helpers/watcher.mjs` — `createFixture` plus a real `init`, as `cli/test/watcher-run-profile.test.mjs` uses it — so `scripts/lib/harness-run-lib.sh`, `scripts/autonomous-watcher.sh`, `harness.config.json` and `.claude/settings.autonomous.json` are the fixture's own. The helper skips the case when `bash` or `jq` is not on `PATH`.
- Copy `scripts/sandbox-probe.sh` and the whole `scripts/lib/sandbox-probe/` directory from `WORKSPACE_ROOT` into the fixture's `scripts/` (`INIT_SCRIPTS_DIR`), in process (`cp` with `recursive: true` from `node:fs/promises`), then commit them in the fixture, as `adoptedFixture` commits its adoption, so the fixture's tree is clean.
- Invoke `join(fixtureDir, 'scripts', 'sandbox-probe.sh')` with `runBash(fixtureDir, …)`, so `${BASH_SOURCE[0]}` resolves into the fixture and `SP_MAIN` is the fixture.

Every fixture is a throwaway git repository under `os.tmpdir()`, built by `createWatcherFixture`, and torn down in process.

### Targets

- `cli/test/sandbox-probe-shell.test.mjs` (new) — the suite.

**Work:**

- [ ] **Header** stating the rule: the probe refuses before creating anything, and its `shasum` guard fires on any change to the three main-checkout files. Name what is not covered: the sandboxed sessions themselves, which only a hand-run probe reaches, and the git judges and leg table, which `cli/test/sandbox-probe-git-and-legs.test.mjs` (Task 15) covers.
- [ ] **Preflight order.** Drive `preflight` through the **fixture's own copy** of the probe, with the three seams set so each refusal can be reached in turn:
  - a non-main checkout — a `git worktree add` of the adopted fixture under `os.tmpdir()`, holding the committed probe copy, invoked at that worktree's `scripts/sandbox-probe.sh`;
  - `SANDBOX_PROBE_UNAME=Linux`;
  - the fixture off its default branch — `git checkout -b` a second branch in the fixture before the call;
  - a stubbed `SANDBOX_PROBE_DOCTOR` printing a non-`PASS` line;
  - a stubbed agent CLI.

  Assert the exact refusal reason and exit 2, and that no `sandbox-probe.*` directory is left under the fixture's `TMPDIR` when the refusal precedes the snapshot.
- [ ] **The `shasum` guard.** In the adopted fixture, run `sp_snapshot_take` and `sp_snapshot_check` directly in a `bash -c` that sourced the **fixture's copies** of the libraries from `<fixtureDir>/scripts/lib/sandbox-probe/` (the form `cli/test/watcher-run-profile.test.mjs` → `watcherCall` uses), with the fixture as cwd and root. Mutate one of the three files — the fixture's `harness.config.json`, `.git/config` or `.claude/settings.autonomous.json`, one case each — between take and check. Assert the `FAILED: <path> changed` line names the fixture's path and exits 3, and that an unchanged set exits 0. This repository's three files are never read or written by any case.
- [ ] **The anchor rule.** Any `process.env` spread this suite writes blanks the main-checkout anchor in the same object (`[MAIN_REPO_ANCHOR_VARIABLE]: ''`, imported from `../dist/core/mainRepoAnchor.js`), as `cli/test/main-anchor-isolation.test.mjs` enforces over every `cli/test/*.mjs`. The preflight cases that need `SANDBOX_PROBE_*` seams pass them in an explicit env object that also blanks the anchor.

**Verification:**

- The suite's own run: `npm test --workspace cli -- test/sandbox-probe-shell.test.mjs`, from the repository root, one plain foreground command.
- Every fixture is built under `os.tmpdir()` and removed in process; grep the suite for any path under this checkout used as a fixture and find none.
- Grep the suite for `WORKSPACE_ROOT` and read each hit: it appears only as the copy source of the probe files. No case invokes the probe, or sources its libraries, at `WORKSPACE_ROOT`.
- No case launches `claude`.

**Deviations from plan:**
- The fixture's scripts directory is `INIT_SCRIPTS_DIR`, whose value is `harness-scripts` (`cli/src/config/model.ts`), not a literal `scripts/`; the probe copy is placed and invoked at `join(fixtureDir, INIT_SCRIPTS_DIR, 'sandbox-probe.sh')`.
- The preflight cases assert the probe's own `sandbox-probe: `-prefixed stderr lines (exactly one refusal line, or none on the passing case), not the whole stderr. Under the `bash` on this host's PATH, sourcing the copied `scripts/lib/sandbox-probe/session.sh` prints `session.sh: line 313: syntax error near unexpected token '<'` on every invocation of the entry point; that file is outside this task's targets and the `cli` layer, so the defect is reported rather than fixed. `cli/test/sandbox-probe-judge.test.mjs` → `assertRefusal` already tolerates library-sourcing noise the same way. The `shasum` guard cases source only `core.sh` and `preflight.sh` and still assert the whole stderr.
- Added beyond the plan: the worktree case also sets `SANDBOX_PROBE_UNAME=Linux`, so refusal 1 is shown to precede refusal 2; and a case where every check passes (exit 0, no probe line, no `sandbox-probe.*` left). Refusal 4 (a watcher run in flight) is not listed by the plan and is not covered.
- Each case's `TMPDIR` is its own `mkdtemp` under `os.tmpdir()`, read for a leftover `sandbox-probe.*` on every refusal, not only refusal 1, since `sp_preflight_refuse` releases the snapshot on the later ones too.
