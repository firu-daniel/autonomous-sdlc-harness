### Task 6 — Re-take the probe on the fixed run form and record F17 and rows WS1–WS5 in `docs/sandbox-verification.md`

**Goal:** Record in the document of record what stopped the Run gates worker from starting sandboxed on macOS, on which Claude Code version, through which probe, and what this branch changed. Each fact carries the command and the exact message, so a later version that behaves differently can be detected.

**Depends on:** Task 1's probe, invoked as `bash scripts/gate-worker-start-probe.sh` from the checkout root. It prints one `== gwsp: <leg> ==` block of full readings and one `gwsp: <leg>: <verdict> — <evidence>` line for each of `env` (`info`: `claude --version`, `uname -sr`, `sw_vers -productVersion`, `$BASH_VERSION`, date), `sandbox`, `nohup`, `detach`, `launch-line` (the pre-fix `nohup` launch line, verbatim, with stderr captured), `run-form` (the fixture's copy of `cli/templates/scripts/run-test-suite.sh` as shipped) and `tmpdir`. Also Task 2, whose template launches the worker as `( trap '' HUP; export RUN_TEST_SUITE_WORKER="$label"; exec bash … ) … 2>>"$start_file" &`, writes `<label>.start`, and cites this document's §5 F17 and rows WS1–WS3 in its `WHY NOT NOHUP` header paragraph. The ids this task writes must therefore be exactly F17 and WS1–WS5. And Task 5, which made `scripts/run-test-suite.sh` byte-identical to that template.

**Where this layer stops.** This task writes `docs/sandbox-verification.md` only, and touches no script. A probe reading that contradicts Task 2's gate (for example `run-form` not reading `pass`) is recorded as measured and reported in this task's return. It is never smoothed over.

### Targets

- `docs/sandbox-verification.md` — the `**Since then.**` paragraph, §5's F table (a new F17, and F6's Follow-up cell), a new row block after `**The Run gates run form, the background limit and a headless turn's end.**`, and BG2's Verdict cell.

**Work:**

- [ ] Run `bash scripts/gate-worker-start-probe.sh` once from this session, which is sandboxed under this run's per-run profile. Keep its whole output as this task's evidence. Every `== gwsp: … ==` block feeds a row below.
- [ ] Add the row block **`**The Run gates worker start.**`** after the BG block. Give it a `**Stamp.**` line built from the `env` and `sandbox` legs: the date, Claude Code version, macOS version, GNU bash version, and "headless, sandboxed, in an implementer session of `fix_gate_worker_sandbox_start`'s unattended run, under its per-run profile". Then a setup paragraph: the probe's fixture under the state directory's `scratch/`, its departures (`commands.test` `true`, `typecheck` `<none>`, `RUN_TEST_SUITE_WAIT_SLICE` 10), and the trigger, quoting the task prompt's observations on 2.1.323 and 2.1.325 and the 2.1.322 runs before them. Then a `| # | Check | Expected | Observed | Verdict |` table:
  - **WS1** — `nohup` run in the call, against `( trap '' HUP; exec true )`.
  - **WS2** — the two detached arms, graded on disk.
  - **WS3** — the pre-fix launch line, with the worker's stderr whole.
  - **WS4** — the run form of the fixed template, `pending` then `pass`, with no `<label>.start` left.
  - **WS5** — `$TMPDIR`, its canonical form, and both `mktemp` readings. This row bears on the prompt's symlink candidate and its `mktemp: mkdtemp failed on /var/folders/…/T/…` symptom. It is recorded, not fixed by this branch.

  Every Observed cell carries the command and the exact message, written with `<home>` / `<run copy>` in place of any path on this machine, and `/var/folders/…` elided as the prompt elides it.
- [ ] Add **F17** to §5's F table. Failure: on the stamped Claude Code version, inside an unattended macOS session's sandbox, the run form's `nohup`-launched worker never started (WS1–WS3's message), so every local run parked at Phase G round 1 with `the detached run of <label> did not start`. Rows: WS1–WS5. Follow-up: **fixed by `fix_gate_worker_sandbox_start`**. Say what changed: the subshell launch, HUP still ignored on entry, `$!` still the worker's PID, the worker still sandboxed, no profile or `excludedCommands` entry added, and the wire strings and exit codes unchanged. Say that `<label>.start` now keeps a worker's start-up stderr and the run form's marker line. Name the probe and how a person re-takes it: from a session, `! bash <main>/scripts/gate-worker-start-probe.sh`, or from a terminal for the unsandboxed control. Weigh the task prompt's three changelog candidates against the readings, each as measured, refuted, or not reached by the start-up path. Record the execution modes: a GitHub-hosted job's gates run through the launcher's `--no-detach`, which detaches nothing.
- [ ] Append to F6's Follow-up cell one sentence: the `nohup … &` launch shape it names was replaced by F17's. Append to BG2's Verdict cell one sentence: on the version F17 stamps, the `nohup` spelling no longer starts inside a sandboxed call on macOS (WS2), while the `trap '' HUP` spelling does. Both appended sentences sit after the existing text, which stays as it is.
- [ ] Append to the `**Since then.**` paragraph one sentence naming F17 and its fix, so the record's opening points at it. Write no wall-clock figure taken in this session anywhere in the new text (lessons ledger: *"A wall-clock figure in a document of record is never one a run measured inside its own session"*).

**Verification:**

- Every WS row's Observed cell quotes a reading that appears in this task's probe output, and every probe leg's summary line is reflected in exactly one WS row or in the Stamp.
- `grep -nE '^\| (F17|WS[1-5]) ' docs/sandbox-verification.md` lists F17, WS1, WS2, WS3, WS4 and WS5, each on exactly one line.
- Grep the new text for an absolute path under the home directory or `/Users/`, and find none.
