### Task 18 — Test the glob-deny and registry legs' grading and RG3's restore

**Goal:** A new suite, `cli/test/sandbox-probe-glob-registry-legs.test.mjs`, holds the `glob-deny` and `registry` legs to their contracts:

- the target derivation, which finds clone paths covered only by a `*` entry and never a path under the clone's `.git`;
- the recorded grade of GW1 and GW2;
- RG1–RG3's grades;
- `sp__rg_restore`, which puts a moved registry directory back with no recursive removal, on the leg's own path and through `sp_teardown`'s pending-restore step.

Every grading function drives a permission-refused fixture to `not run`.

**Depends on:**

- **Task 6** (`scripts/lib/sandbox-probe/legs-glob.sh`):
  - **`sp__gw_targets <profile> <clone>`** reads only its arguments and the filesystem. It walks the profile's `sandbox.filesystem.denyWrite` entries containing `*`, in order. Each candidate is `<clone>/<the text after the entry's first "*/">`, kept when it matches the entry as an unquoted `case` pattern and dropped when it is `<clone>/.git` or under it. It sets:
    - `SP__GW_EXISTING`, the first existing candidate, or `<candidate>/sbx_gw1_new` for a directory;
    - `SP__GW_ABSENT`, the first absent candidate whose parent exists;
    - `SP__GW_EXISTING_ENTRY` and `SP__GW_ABSENT_ENTRY`.

    It returns status 1 when nothing is kept.
  - **`sp__gw_grade <stream> <dd command>`** sets `SP_VERDICT` and `SP_EVIDENCE`:
    - `sandbox` → `pass`, `refused: …`;
    - a non-error `ran` → `pass`, `written: the open for writing succeeded, so no entry protected the path: …`;
    - `permission` or `file-tool` → `not run`;
    - the judge's own `not run`, `unrecognised` included → `not run`.
- **Task 7** (`scripts/lib/sandbox-probe/legs-registry.sh`):
  - **`sp__rg1_grade <stream> <dd command> <registry path> <sum unchanged: 1|0>`**:
    - the `dd` must be `sandbox`, the `Edit` `file-tool` (or `permission` with a refusal), and the sum unchanged;
    - `fail` on a `dd` that ran, an `Edit` that ran, or a changed sum;
    - `not run` on an unreached call, the Edit tool's `File has not been read yet` included.
  - **`sp__rg2_grade <stream> <direct mv command> <helper command> <inode unchanged> <sum unchanged>`**:
    - (b)'s helper line is `sbx_rg2_mv landed` or `sbx_rg2_mv refused: <message>`;
    - `fail` on a changed inode or sum, or `landed`;
    - `not run` when (b) was refused at the permission layer or printed no line;
    - otherwise `pass`.
  - **`sp__rg3_grade <stream> <mv command> <moved: 1|0> <sum unchanged: 1|0>`**:
    - `fail` when moved, with evidence ending `the probe restored it`, or `…could not restore it`;
    - `not run` when refused at the permission layer or not issued;
    - otherwise `pass`, `refused: <the mv's message line>`, whatever its text.
  - **`sp__rg_restore <dir>`** acts only when `<dir>.aside` exists:
    1. remove a zero-byte `<dir>/registry.json`;
    2. `rmdir` `<dir>` when it is empty;
    3. `mv <dir>.aside <dir>`.

    It skips steps 1 and 2 when `<dir>` is absent. It returns status 1 naming what is left, and raises exit 5 through `sp_exit_raise 5`.
  - **`session.sh` → `sp_restore_register <function> <arg>` / `sp_restore_clear`**, the pending-restore slot (`SP__RESTORE_FN`, `SP__RESTORE_ARG`). `sp_teardown` runs `"$SP__RESTORE_FN" "$SP__RESTORE_ARG"` after `sp__td_stop_pids` and before its clone loop, when the slot is set and the function is defined. A non-zero status goes through `sp__td_fail`, raising exit 5. The step then clears the slot. `sp_leg_registry` registers `sp__rg_restore <dir>` before the `registry-rg3` session, and clears it after its own restore succeeds.
- **Task 3** (`judge.sh`). On Linux, `Read-only file system` is layer `sandbox`. An expected `sandbox` call that errors with no known string is layer `unrecognised`, verdict `not run`.

**Where this task stops.** No case launches a session. The legs' session wiring is exercised only by a hand-run probe.

### Targets

- `cli/test/sandbox-probe-glob-registry-legs.test.mjs` (new)
- `cli/test/fixtures/sandbox-probe/gw-refused.jsonl` (new)
- `cli/test/fixtures/sandbox-probe/gw-written.jsonl` (new)
- `cli/test/fixtures/sandbox-probe/gw-permission.jsonl` (new)
- `cli/test/fixtures/sandbox-probe/rg-session.jsonl` (new)
- `cli/test/fixtures/sandbox-probe/rg3-refused.jsonl` (new)

**Work:**

- [ ] **The header** states the rule the suite enforces: **the glob leg measures only paths a `*` entry alone covers, outside the clone's `.git`, and records either outcome; and RG2 and RG3 are graded on the registry's own state, and a moved directory is restored with no recursive removal.**
  - It sources `core.sh`, `platform.sh`, `judge.sh`, `controls.sh`, `preflight.sh`, `session.sh`, `legs-protection.sh` and the two leg files in a `bash -c` through `runBash`, with `SP_PLATFORM=linux` unless a case says otherwise.
  - Its temporary trees are `mkdtemp`s under `os.tmpdir()`, removed in process when each case ends.
- [ ] **The fixtures**, hand-written in the existing shape and unsubstituted except where a case says so:
  - **`gw-refused`:** a `dd` with result `Exit code 1\ndd: failed to open '…': Read-only file system`.
  - **`gw-written`:** a `dd` with a non-error result `0+0 records in\n0+0 records out\n0 bytes copied`.
  - **`gw-permission`:** a `dd` refused `Permission to use Bash … has been denied`.
  - **`rg-session`:** RG1's `dd`, refused by EROFS; a `Read` and an `Edit` of the registry, the `Edit` refused with `File is in a directory that is denied by your permission settings.`; RG2 (a)'s `mv`, refused at the permission layer; RG2 (b)'s helper, printing `sbx_rg2_mv refused: mv: cannot move '…' to '…': Device or resource busy`.
  - **`rg3-refused`:** the `mv` of the directory with an error result carrying `Device or resource busy`.
- [ ] **`sp__gw_targets`.** The case builds a fake work root holding `proj-sbx/` (the clone), with an existing `githooks/` directory and a `.claude/` directory lacking `settings.local.json`. It writes a profile whose `denyWrite` holds, in this order:
  1. `<root>/proj-*/.git/config`;
  2. `<root>/proj-*/githooks`;
  3. `<root>/proj-*/.claude/settings.local.json`;
  4. an exact `<root>/proj-sbx/.mcp.json`.

  It asserts:
  - `SP__GW_EXISTING` is `<clone>/githooks/sbx_gw1_new`, from entry 2 — `.git/config` was dropped;
  - `SP__GW_ABSENT` is `<clone>/.claude/settings.local.json`;
  - a profile with no `*` entry returns status 1.
- [ ] **The grades:**
  - `sp__gw_grade` gives `pass` refused, `pass` written, and `not run` for the permission fixture;
  - `sp__rg1_grade` on `rg-session` with sum unchanged gives `pass`, and with sum changed gives `fail`;
  - `sp__rg2_grade` on `rg-session` with inode and sum unchanged gives `pass`, quoting the busy message; with inode changed it gives `fail`;
  - `sp__rg3_grade` on `rg3-refused` with moved `0` gives `pass`, `refused: …Device or resource busy`; with moved `1` it gives `fail`; with the permission fixture it gives `not run`.
- [ ] **`sp__rg_restore`:**
  - a temp `logs.aside/registry.json` holding text, with a `logs/registry.json` of zero bytes, is restored: `logs/registry.json` holds the text again and `logs.aside` is gone, status 0;
  - a `logs/` holding an extra non-empty file returns status 1, leaves both directories in place, and prints a `sandbox-probe:` line naming what is left;
  - with no `.aside` it does nothing, status 0;
  - with a `logs.aside/` and no `logs/` (an interrupt between the `mv` and the `mkdir`), it moves `logs.aside` back to `logs`, status 0;
  - **the teardown path.** It builds a temp `logs.aside/registry.json` holding text and a zero-byte `logs/registry.json`, then calls `sp_restore_register sp__rg_restore <tmp>/logs`. It then calls `sp_teardown` **without** calling `sp__rg_restore` itself, so the call stands in for an interrupt between the session and the leg's own restore. `logs/registry.json` holds the text again, `logs.aside` is gone, and `SP__RESTORE_FN` is empty afterwards. A second case registers and then calls `sp_restore_clear` before `sp_teardown`, and the `.aside` is left untouched: teardown never restores what is not pending. Both drive `sp_teardown` with an otherwise empty probe state, in the way `cli/test/sandbox-probe-evidence.test.mjs` already drives it, sourcing `preflight.sh` for `sp_snapshot_check`.

**Verification:**

- `npm test --workspace cli -- test/sandbox-probe-glob-registry-legs.test.mjs` passes, run from the repository root as one plain foreground command.
- The suite reads fixed fixture files and its own temporary trees, never a tree of repository files, so it owes no `treeGuards` entry (`unit_loop_core.md` → `## The test-run rule` point 8's boundary).
</content>
</invoke>
