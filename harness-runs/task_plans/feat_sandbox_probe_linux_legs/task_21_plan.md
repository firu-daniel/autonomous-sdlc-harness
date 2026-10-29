### Task 21 — Add the Linux rows of record, each *not yet measured*, and point the existing Linux rows at the legs that take them

**Goal:** `docs/sandbox-verification.md` gains a row for every row a Linux run of the probe takes, each marked *not yet measured*. A new id is used only where none exists. **No measured result is invented.** Each row states its Linux expectation beside its macOS baseline, so the later record can say *same* or *different* rather than re-argue it. The four Linux rows that already exist (TD4, T3, WF5, BG9) are pointed at the legs that now take them.

**Depends on:** Task 11, which restates Gate 15 with the container recipe, the Linux expectations table and the hand rows. This record cites Gate 15 rather than repeating them. The legs and rows are Task 2's:

- **The existing legs, unchanged ids**, run on Linux:
  - `gates`: T3 and W7 on Linux;
  - `mktemp`: TD4 on Linux;
  - `scratch` (SR1, SR2) and `retrieval` (MC1);
  - `wrappers` (CS4, P3, CW2, P1c, CW5, P1b, CW6);
  - `wrappers-refresh` (R0–R4);
  - `planted-config` (C1, CW3, C2, K2, CW4, CS15) and `planted-files` (CS12, CS13, CS14, L1, L2);
  - `write-protection` (CS1, CS2, CS7, W6, W8) and `git` (CS3, CL5);
  - `network` (N1–N5), `retry` (RT1), `repo-settings` (RS1), `credentials` (S1, S2, S4, S5);
  - `invalid-profile` (CS8) and `headless-parity` (HP1).
- **The Linux-only legs:** `glob-deny` (GW1, GW2), `registry` (RG1–RG3), `detached` (BG9, WF5), `loopback` (LB1–LB5), and `refusal` (RF1–RF3), through `sandbox-probe.sh refusal`.
- **The hand rows in Gate 15:** RF4 (the watcher archives a drop as failed and cuts no clone) and DP1–DP7 (`doctor`'s `sandbox-prerequisites` line under each host state).

**Where this task stops.** It edits `docs/sandbox-verification.md` only. Every other prose site this branch reaches is in the story index's `## Scope register`, with its disposition.

### Targets

- `docs/sandbox-verification.md`

**Work:**

- [ ] **A new `## 8. The Linux legs (owed)`**, after §7's last paragraph (*"The per-run profile at the sweep (2026-10-27)."*) and preceded by a `---` rule as the other sections are. It opens with:
  - **what the section is:** the rows a Linux run of `scripts/sandbox-probe.sh` takes in a local container (Gate 15 in `docs/development.md`), each owed;
  - **a `**Stamp.**` line to be filled by the person taking the rows:** date, the `sandbox-probe: stamp:` lines the probe printed, the `docker run` line, the probe's exit status from the `echo "exit $?"` line, and the probe branch;
  - **two reading rules:**
    - a Linux sandbox refusal is expected to read `Read-only file system` where macOS read `Operation not permitted`;
    - a row whose refusal text the judge did not recognise prints `not run` naming it, and the string is added from the kept evidence, not argued here.
- [ ] **The table's columns** are `| # | Check | Expected on Linux | macOS baseline | Observed | Verdict |`. In every row, Observed is **not yet measured.** and Verdict is `not yet measured`. The rows for sandbox3a's legs come first, in leg-table order, one per row id, each with a `#` cell reading `<id> (Linux)` (for example `CS1 (Linux)`):
  - **The Check cell** reads `<id> on Linux, as its row (§<n>)`, naming the section the macOS row is in, plus any Linux departure. W7's departure is none. CL5 adds that `docs/cli.md` §6 calls the runtime's `.git` refusal *"unmeasured"* on Linux.
  - **The Expected cell** is as the macOS row's, with `Read-only file system` for `Operation not permitted`. Exceptions:
    - N3 is measured, not assumed;
    - N4 is graded by comparison with the unsandboxed control;
    - CS7's `Edit` refusal rests on `dontAsk` and the absence of an allow rule;
    - CS8 (a) is recorded and (b) graded;
    - HP1 is taken only where the container's terminal allows interactive sessions.
  - **The macOS baseline cell** quotes the row's latest verdict and its date and run, for example `pass (run 3, 2026-10-28)`. N3 is `fail: F8 (runs 2 and 3)`. CS8 is `(a) marker written, F7; (b) pass (run 3)`. RG1–RG3 are `pass (2026-10-20, by hand)`.
- [ ] **Then the new ids**, in this order:
  - **GW1 and GW2.** A dd onto a clone path only a `*` entry covers, on a scratch per-run profile without the clone's exact entries: existing when the session starts, and absent. Expected: recorded as refused or written, the generated `_README`'s residual. Baseline: none.
  - **LB1–LB4.** The two forms on the two profiles, each with its `--noproxy '*'` twin and the proxy variables' host and port. Expected: recorded, not graded; S and SR lead one to expect a host-loopback listener unreachable, which is to be measured. Baseline: F8, the `127.0.0.1` form only.
  - **LB5.** A listener a sandboxed call starts, called from outside. Expected: recorded, the interactive-test shape `docs/cli.md`'s *"`qa` is unmeasured."* describes. Baseline: none.
  - **RF1–RF3.** The `refusal` subcommand's rows, as Task 2's leg table states them. Baseline: none.
  - **RF4.** The watcher's archive of a drop as `failed_<ts>_<name>`, with no clone cut, from Gate 15's hand step.
  - **DP1–DP7.** `doctor`'s and `doctor --remote-job`'s `sandbox-prerequisites` line under each state:
    - DP1: both packages present;
    - DP2: `bwrap` absent;
    - DP3: `socat` absent;
    - DP4: neither;
    - DP5: the AppArmor answer;
    - DP6: the `probe` user against root;
    - DP7: a taken `sandbox.optOut`.

    Each row's Expected comes from `docs/cli.md`'s `sandbox-prerequisites` bullet: a warning without `--remote-job` and a failure with it for a definite missing piece, a warning in both modes for an uncertain AppArmor answer, and a pass as not required under a taken opt-out.
- [ ] **The existing rows, in place.**
  - **TD4's Expected cell.** It changes from `as TD2, on Linux` to TD3's result. The task prompt says, under *"Three expectations must not be copied"*: *"TD4's expectation is TD3's, not TD2's."* The cell reads: *as TD3 (row TD3, Linux unsandboxed), now sandboxed: bare `mktemp` and `mktemp -d` honour the session's `TMPDIR`; `mktemp -t harness-gates` exits 1 with `mktemp: too few X's in template 'harness-gates'`; the explicit form `mktemp <TMPDIR>/harness-gates.XXXXXX` is written under the session's `TMPDIR`. A call refused at the permission layer, the control included, is `not run`.* This is the expectation Tasks 2, 4 and 11 grade and describe TD4 against. The record then states one expectation for TD4, not TD2's copied one beside Gate 15's.
  - **TD4, T3, WF5 and BG9.** Each row's Observed changes from its `no Linux host …` reason to **not yet measured**, naming the leg that takes it: `mktemp`, `gates`, `detached`, `detached`. Each Verdict becomes `not yet measured`. BG9's Observed also says the leg takes BG2's shape only, so BG1 and BG3–BG8 on Linux stay untaken. WF5's says the leg takes the GNU `stat -c %Y` arm of `hr_lane_mtime` in a sandboxed process, not WF2–WF4's whole shape.
  - **The three stamp lines** that name these rows as not taken change in step, each to `… owed: the <leg> leg takes it (§8)`:
    - *The temporary directory*'s `TD4 not taken`;
    - *The Run gates wait form*'s `WF5 not run`;
    - *The Run gates run form, the background limit and a headless turn's end*'s `BG9 not taken`.
  - **PD18's Follow-up cell** becomes: fixed by `feat_sandbox_probe_linux_legs`, where the `ran` arm quotes `Exit code <n>: <the message under it>`; not yet confirmed by a run.
- [ ] **§6 and the opening.**
  - **§6's bullet** *How the Linux sandbox treats a `denyWrite` entry containing `*`* stays **not run**. It names the leg or hand row that takes each point it lists:
    - the glob: GW1, GW2;
    - the `failIfUnavailable` refusal: RF1;
    - the worktree-record and ordinary-git checks: `CS3 (Linux)`, `CL5 (Linux)`;
    - TD4, T3: `mktemp`, `gates`;
    - WF5, BG9: `detached`.

    It replaces *"which this run did not do unasked"* with a pointer to Gate 15's container recipe, which says what is placed and how it is removed.
  - **The opening `**Since then.**` paragraph** gains one sentence: §8 holds the rows a Linux run in a local container takes, all owed.

**Verification:**

- `grep -cE '^\| [A-Z]+[0-9]+[a-z]? \(Linux\) \|' docs/sandbox-verification.md` matches every sandbox3a row id the Linux run takes, plus RG1–RG3. Read the ids back against Task 2's leg table, not against a count.
- Every row added or edited in §8 carries **not yet measured** in its Observed and Verdict cells, and none carries a measured value: `grep -nE '^\| (GW|LB|RF|DP)[0-9]' docs/sandbox-verification.md` shows each new id once, each with `not yet measured`.
- `grep -n 'no Linux host with' docs/sandbox-verification.md` finds no line in rows TD4, T3, WF5 or BG9.
- `grep -nE '^\| TD4 \|' docs/sandbox-verification.md` shows a row whose Expected cell names TD3 and `too few X's`, and does not carry `as TD2`.
- **Deviations from plan:** §8's first block carries no `T3 (Linux)` or `TD4 (Linux)` row although the `gates` and `mktemp` legs list them: T3 and TD4 are already Linux rows (§5), edited in place by this task, and *"A new id is used only where none exists"*; §8's lead paragraph names them, with WF5 and BG9, as keeping their own §5 rows. Baselines cite the record's latest run per row, which for rows run 2 re-passed (§0 *The probe's second run*: every row run 1 passed passed again) reads `runs 1 and 2` where Gate 15's table says `run 1`.
- No line in §0–§7 other than those this task names changed: `git diff` shows hunks only in the Since-then paragraph, the three stamp lines, rows TD4 (its Expected, Observed and Verdict cells), T3, WF5, BG9 and PD18, the §6 bullet, and the new §8.
</content>
</invoke>
