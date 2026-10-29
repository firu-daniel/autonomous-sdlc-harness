### Task 6 — Ship the absent-path check as `scripts/sandbox-absent-path-check.sh`, with the trio and a sweep phase

**Goal:** Put the task prompt's `measure.sh`, the script behind the 2026-10-29 absent-path check, into the tree as a reproducible hand tool. The maintainer runs it in Gate 15's container on this branch's head to confirm or refute the route. Extend it in two ways:

- It reads the clone's three `.git` trust files whether or not the profile names them. After Task 4 they are not entries on a bubblewrap host, and the measurement must still show whether anything creates them.
- A `sweep` phase applies the library's sweep to what phase D left and reads again.

This repository runs no Linux sandbox in an unattended run, so this task writes the tool and runs nothing that needs one.

**Depends on:** Task 5, which makes `scripts/lib/harness-run-lib.sh` carry Task 2's functions. The script sources that file and calls them by these contracts:

- `hr_placeholder_manifest_write <manifest> <path>...` records the absent arguments.
- `hr_placeholder_sweep_var <manifest>...` removes only a 0-byte, read-only, self-owned regular file at a listed path, and sets `HR_PLACEHOLDER_REMOVED` and `HR_PLACEHOLDER_KEPT`.
- `hr_wrapper_main_of <script_dir>` prints the wrappers' main checkout or returns 1.
- `hr_run_copy_check_var <main> <copy>` returns 0 for a trusted clone, or 1 with `HR_RUN_REFUSAL` set.

Task 9 documents how to run it, and Task 8 records what it measured.

### Targets

- `scripts/sandbox-absent-path-check.sh` (new)

**Work:**

- [ ] Start from the task prompt's `measure.sh` (`harness-runs/task_prompts/fix_linux_sandbox_deny_placeholders_task_prompt.md`, the `<details>` block) and keep its phases, inspector, session launch line and report.
  - Open the file with `#!/usr/bin/env bash`, a `# sandbox-absent-path-check.sh — …` header stating what it measures (#212, `docs/sandbox-verification.md` → §5 F9), and a usage block.
  - It names no location on any machine:
    - `M` is the main checkout two levels above the script, `cd -P`.
    - `C` and `P` are resolved as `measure.sh` resolves them, but from `M`'s sibling-glob probe clones and the lane's `run-profiles/*/*.json`. Each is still overridable by `C=` and `P=`.
    - The output directory is `${SBX_ABSENT_OUT:-${TMPDIR:-/tmp}/sbx-absent-path}`.
  - The inspector and the `inspect-ex.sh` copy are written there, never into the clone or the main checkout.
- [ ] The inspected list is the profile's exact `denyWrite` entries plus three more, each added only when the profile does not already name it:
  - the clone's `.git/commondir`, `.git/config.worktree` and `.git/objects/info/http-alternates`;
  - `.mcp.json` in each `--add-dir` root the session line passes.

  The stamp file adds `git --version` and the head commit of `M` to `measure.sh`'s lines.
- [ ] `run` also writes the manifest before phase A: `hr_placeholder_manifest_write "$O/manifest.absent"` over the profile's exact entries and the two `--add-dir` `.mcp.json` paths, sourcing `$M/scripts/lib/harness-run-lib.sh`.
- [ ] A new `sweep` subcommand, run after `run`:
  - Call `hr_placeholder_sweep_var "$O/manifest.absent"` and write each removed and kept line to `$O/sweep.txt`.
  - Take an `outside after-sweep` reading.
  - Append three lines:
    - `hr_wrapper_main_of "$M/scripts"`'s exit status and output;
    - `hr_run_copy_check_var "$M" "$C"`'s exit status and `HR_RUN_REFUSAL`;
    - `git -C "$C" status --short --branch`'s exit status.
  - `report` adds an `after-sweep` column and a `## Sweep` section, and the usage line lists `run | sweep | after-teardown | report`.
  - **Say what `sweep` changes.** `measure.sh`'s header says nothing is written into the clone or the main checkout, and that stays true of `run`, `after-teardown` and `report` only. The header and the usage block state that `sweep` changes both:
    - it deletes each recorded 0-byte, read-only leftover in the clone and in the main checkout, `M/<scriptsDir>/.git` included;
    - its `hr_run_copy_check_var "$M" "$C"` syncs the clone's branch into `M` (`hr_copy_sync_in_var`), moving that branch's ref in the main checkout.

    Add one line in the usage block: run `sweep` only on a disposable probe clone and a main checkout whose probe branch may move.
- [ ] Bash 3.2 parse floor:
  - No `${var,,}`, no `mapfile`, and no empty-array expansion under `set -u`.
  - A `case` refusal with exit 1 and the usage line for an unknown subcommand, as `measure.sh` has.
  - A comment stating that the script is Linux-only by purpose (`stat -c`, `date -Is`, `/proc/self/mountinfo`), and that it refuses with exit 2 and one line when `uname -s` is not `Linux`.

**Verification:**

- `bash -n scripts/sandbox-absent-path-check.sh` exits 0.
- `bash scripts/sandbox-absent-path-check.sh` with no argument prints the usage line and exits 1. Off Linux, `bash scripts/sandbox-absent-path-check.sh run` refuses with exit 2 and writes nothing.
- `grep -nE '/Users/|/home/|/private/' scripts/sandbox-absent-path-check.sh` finds nothing.
