### Task 5 — Grade the write-protection and git legs' Linux refusals, and print the parity script's Linux expectations

**Goal:** Make the legs that branch on a refusal's layer or text read a Linux session correctly. There are four of them:

- **The `write-protection` leg's dd grade** passes a `Read-only file system` refusal and prints `not run` for an `unrecognised` one.
- **The same leg's rename helper lines** are classified by one new function, which knows the Linux string.
- **The `git` leg's CS3 fetch** prints `not run`, naming the text, for an `unrecognised` refusal.
- **The parity script and CS8 (a)'s grade.** The parity script `run --leg headless-parity` prints Linux expectations on Linux, and CS8 (a)'s grade names an `unrecognised` refusal for what it is.

On macOS every verdict, every evidence string and every printed byte stays as today.

**Two more legs read a curl error as data**, N3's and N4's grades in `legs-network.sh`. They are not in this list because they need the opposite handling: an `unrecognised` result must fall through to their own curl-line logic, not become `not run`. That is **Task 22**'s.

**Depends on:**

- **Task 3** (`scripts/lib/sandbox-probe/judge.sh`). On Linux, `sp_judge_call <stream> sandbox|network <command>` files a `Read-only file system` line under layer `sandbox`. An error carrying no known string gets `SP_LAYER=unrecognised`, `SP_VERDICT="not run"` and `SP_EVIDENCE="no refusal string this judge knows on Linux, so not graded: …"`.
- **Task 2.** `SP_PLATFORM` is `linux` on a Linux run and on `print-parity-script` with `SANDBOX_PROBE_UNAME=Linux`. It is empty or `macos` otherwise.

**Where this task stops.** It changes grading and printed text only, and launches nothing new. It does not edit `legs-network.sh`; Task 22 does. Task 17 tests the `write-protection` and `git` changes. Task 14 tests the parity script's Linux text.

### Targets

- `scripts/lib/sandbox-probe/legs-protection.sh`
- `scripts/lib/sandbox-probe/legs-settings.sh`

**Work:**

- [ ] **`legs-protection.sh` → `sp__wp_dd_grade`** gains an `unrecognised)` arm: `SP__WP_DD_V="not run"` and `SP__WP_DD_E="$SP_EVIDENCE"`. Its `sandbox` arm already passes, and Task 3 makes `Read-only file system` reach it on Linux.
  - **`sp__git_cs3_fetch`** gains the same `unrecognised)` arm, with `SP__GIT_FETCH_V="not run"` and `SP__GIT_FETCH_E="$SP_EVIDENCE"`, ahead of its catch-all.
  - **`sp__git_cl5_grade`** needs no change: the judge's `not run` survives its `case`. Its `could not lock config file` check reads the same on GNU git.
- [ ] **`legs-protection.sh` → `sp__wp_mv_class <helper line>`** (new). It prints exactly one class and reads only its argument. The checks run in this order:
  1. a line ending ` landed` → `landed`;
  2. a line carrying ` stage failed: ` → `stage-failed`;
  3. `Operation not permitted` → `refused`;
  4. when `"${SP_PLATFORM:-}" = linux`, `Read-only file system` → `refused`;
  5. otherwise `unrecognised` on Linux and `other` on macOS.

  `sp__wp_judge_row` replaces its inline `case "$line"` on the rename with this class:
  - `landed` and `other` produce today's two `why` texts and stay `fail`;
  - `stage-failed` produces today's `notrun` text;
  - `refused` produces nothing;
  - `unrecognised` adds `rename onto <t>: no refusal string this judge knows on Linux: <the line after its sbx_wp_mv <i> prefix>` to `notrun`.
- [ ] **`legs-protection.sh` → `sp__wp_judge_row`'s pass sentence.** When `SP_PLATFORM` is `linux`, it reads `<n> target(s): every dd and rename refused by the sandbox (Operation not permitted or Read-only file system), every inode and shasum unchanged, no new name created`. On macOS it is byte-identical to today's.
  - The file header records both changes and `sp__wp_mv_class`'s signature.
- [ ] **`legs-settings.sh` → `sp_print_parity_script`.** When `"${SP_PLATFORM:-}" = linux`, two step sentences change:
  - step 2's ending `expect a <sandbox_violations> refusal:` becomes `expect a network refusal: CONNECT tunnel failed, response 403, or a <sandbox_violations> line:`;
  - step 4's ending `expect Operation not permitted:` becomes `expect a sandbox refusal: Read-only file system, or Operation not permitted:`.

  Every other line, and the whole output with `SP_PLATFORM` empty or `macos`, is byte-identical to today's. The comment above the function names the platform switch.
- [ ] **`legs-settings.sh` → `sp__cs8a_grade`.** Where it now reports `on <bad> the call was not issued: …` for any judge `not run`, a judge `not run` whose `SP_LAYER` is `unrecognised` instead sets `SP__CS8A_V="not run"` and `SP__CS8A_E="on <bad> the call errored with no refusal string this judge knows on Linux: $SP_EVIDENCE"`. The other arms are unchanged.

**Verification:**

- The type check passes.
- By hand: before editing, save the output of `bash scripts/sandbox-probe.sh print-parity-script` to a file under `$TMPDIR`. After the edit, the same command's output is byte-identical to it (`cmp`). Run once more with `SANDBOX_PROBE_UNAME=Linux` set, the output differs from the saved one in steps 2 and 4 only.
- `grep -n '"Operation not permitted"' scripts/lib/sandbox-probe/legs-protection.sh` finds the rename test only inside `sp__wp_mv_class`.
- `git diff scripts/lib/sandbox-probe/legs-protection.sh` shows no change to any `sp_judge_call` expectation argument.

**Deviations from plan:**

- The by-hand `cmp` bullet was not run as written: the permission layer refused both `bash scripts/sandbox-probe.sh print-parity-script > "$TMPDIR/parity_before.txt"` and the `SANDBOX_PROBE_UNAME=Linux bash scripts/sandbox-probe.sh print-parity-script` prefix form (`Permission to use Bash has been denied because Claude Code is running in don't ask mode`). The claim rests instead on `bash scripts/scratch-run.sh harness-runs/scratch/task5_probe.py`, which copies `scripts/` into a temp directory under `harness-runs/scratch/`, restores the two edited libraries from `HEAD` there, and compares `print-parity-script` output byte for byte: `macOS byte-identical: True 2363` (the HEAD and working-tree outputs, with `SANDBOX_PROBE_UNAME` unset), and with `SANDBOX_PROBE_UNAME=Linux` the output differs from the HEAD output on lines 21 (step 2) and 33 (step 4) only, both 49 lines long. The same probe drove `sp__wp_mv_class` over five helper lines under `SP_PLATFORM` empty, `macos` and `linux`, and `sp__wp_dd_grade`, `sp__git_cs3_fetch` and `sp__cs8a_grade` with a stubbed `unrecognised` judge result; each printed the class or verdict this plan specifies.
</content>
</invoke>
