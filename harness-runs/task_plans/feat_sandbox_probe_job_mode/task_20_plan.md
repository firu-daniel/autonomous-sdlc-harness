### Task 20 — Test the runner controls file, the runner stamp, the runner legs' grades and N4's runner arm

**Goal:** A new suite holding the runner legs to their contracts:

- **The controls file** is read whole, and an absent key is `unrecorded`, never a guess.
- **The stamp** names the image.
- **Every grade:**
  - passes only on the reading it names;
  - fails only on the one that shows the leak or the missing package;
  - prints `not run` for a permission-layer refusal (PD9), a failed control, an absent canary or an unrecorded key.
- **N4's runner arm** follows the prompt's rule. The clone-layout N4 grade is byte-for-byte unchanged without the fifth argument.

**Depends on:**

- **Task 7 (`legs-runner.sh`):**
  - `sp_runner_controls_read <file>` returns 1 for an unreadable file or one with no `<key>\t<value>` line;
  - `sp_runner_control <key>` prints the value, or `unrecorded` with status 1;
  - `sp_runner_stamp` prints `sandbox-probe: stamp: runner <key>: <value>` for `image-os`, `image-version`, `uname-r`, `bwrap-version`, `probe-commit` and `cli-version`;
  - `sp__is1_grade <sysctl-before>`; `sp__is2_grade <bwrap-before> <socat-before> <bwrap-after> <socat-after> <bwrap-version>`; `sp__is3_grade <sysctl-before> <profile-before> <profile-after>`; `sp__is4_grade <bwrap-start> <prereq line>`.
- **Task 8 (`legs-runner-isolation.sh`):**
  - `SP_RUNNER_CANARY_NAME=SBX_PROBE_CANARY`;
  - `sp__pn_read_grade <stream> <command>`: a count of 1 or more → `fail`; `No such file or directory` or `Permission denied` → `pass`; `0` → `not run`;
  - `sp__pn3_grade <stream> <command> <agent pid> <probe pid>`;
  - `sp__nn1_grade <stream> <command> <sudo-control>`: a control not `exit 0` → `not run`; ran without error → `fail`; errored → `pass`;
  - `sp__nn2_grade <stream> <command>`: `NoNewPrivs:` `1` → `pass`, `0` → `fail`.
- **Task 10 (`legs-network.sh`):** `sp__net_n4_grade <stream> <command> [<control exit> <control line> [<runner control>]]`. With a fifth argument starting `http `: a response → `fail`; a network, sandbox or `unrecognised` refusal, or a curl error → `pass`. Any other fifth falls through to today's comparison, adding `; the workflow's control: <value>` to the evidence.

**Where this task stops.** One new suite. The leg functions' sessions are reached only by a hand-run or a runner run.

### Targets

- `cli/test/sandbox-probe-runner-legs.test.mjs` (new)
- `cli/test/fixtures/sandbox-probe/runner-*.jsonl` (new): one stream fixture per graded shape below

**Work:**

- [ ] **The header** opens with the rule above. Its left-out note: no session, sudo or `/proc` read is real; every stream is a fixture. Each case runs a `bash -c` through `runBash` sourcing `core.sh`, `platform.sh`, `judge.sh`, `controls.sh`, `session.sh`, `legs-network.sh`, `legs-runner.sh` and `legs-runner-isolation.sh` from `WORKSPACE_ROOT/scripts/lib/sandbox-probe/`, with `SP_PLATFORM` set to `linux`.
- [ ] **`test('the runner controls file and the stamp')`**:
  - a file with every key reads back each value whole, a value with spaces included;
  - an unknown key is ignored, and a repeated key keeps its last value;
  - an absent key prints `unrecorded` with status 1;
  - an empty file, or one with no tab, makes `sp_runner_controls_read` return 1;
  - `sp_runner_stamp` prints the six lines in order, an absent one as `unrecorded`, and nothing when no file was read.
- [ ] **`test('IS1–IS4')`**: each grade's `pass`, `fail` and `not run` arm, with `unrecorded` in each argument position giving `not run` naming the key. IS3's three consistent pairs (`1 absent present`, `1 present present`, `0 absent absent`) pass, and `1 absent absent` fails.
- [ ] **`test('PN1–PN3 and NN1–NN2')`**, from stream fixtures:
  - a count `1` → `fail`, whose evidence carries the count and never a variable's value;
  - `grep: /proc/123/environ: No such file or directory` → `pass`;
  - `… Permission denied` → `pass`;
  - `0` → `not run`;
  - a `don't ask mode` refusal → `not run`;
  - `ls /proc` holding the probe's PID → `fail`, and holding neither → `pass`;
  - NN1 with `exit 1` as the control → `not run`; NN1 errored with `sudo: The "no new privileges" flag is set, which prevents sudo from running as root.` and an `exit 0` control → `pass`; NN1 ran → `fail`;
  - NN2's `NoNewPrivs:\t1` → `pass`, and `\t0` → `fail`.
- [ ] **`test("N4's runner arm")`**, on the existing N4 fixtures plus new ones:
  - a fifth argument `http 400` with a response body in the result → `fail`;
  - `http 400` with `curl: (7) …` → `pass`;
  - `http 400` with a permission-layer refusal → `not run`;
  - `no answer: curl exit 28` → the same verdict as the four-argument call, with the evidence extended;
  - the four-argument call's verdict and evidence are byte-identical to what `sandbox-probe-remote-legs.test.mjs`'s existing N4 cases assert, re-asserted here on one fixture.

**Verification:**

- This suite passes: `npm test --workspace cli -- test/sandbox-probe-runner-legs.test.mjs`, from the repository root, as one plain foreground command.
- Read the counts and the exit status, not a summary line.

**Deviations from plan:**

- IS1 has no `fail` arm: `sp__is1_grade` records the sysctl it read and never fails, so the IS1 case asserts `pass` (on `1` and `absent`) and `not run` only.
- The absent canary is a leg-level skip in `sp_leg_runner_pid`, not a grade argument, so it is asserted on the leg (`SP_JOB_MODE=1`, canary unset: three `not run` lines; no session is reached). Two further leg cases hold `sp_leg_runner_install` to an unrecorded key (IS4 `not run` naming `bwrap-start`) and to no controls file.
- Added beyond the plan: a missing controls file returns 1; NN1 with an `unrecorded` control is `not run`; N4's runner arm with a sandbox refusal (`n4-refused`) passes.
</content>
</invoke>
