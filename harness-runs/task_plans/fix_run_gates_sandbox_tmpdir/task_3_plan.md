### Task 3 — Record the `mktemp` measurements and the owed sandboxed gates re-run in `docs/sandbox-verification.md`

**Goal:** Make the sandbox record say:

- what macOS and GNU `mktemp` were measured to do with `TMPDIR`, with each command and its exact output;
- that F2's fix has landed and how;
- that the sandboxed gates re-run on this branch's tree is owed to a person;
- that the Linux rows are **not run**, never inferred from macOS.

**Depends on:** Task 2, and through it Task 1. After those two tasks:

- `scripts/run-gates.sh` creates its log with `log="$(mktemp "${TMPDIR:-/tmp}/harness-gates.XXXXXX")"`;
- `scripts/publish-main.sh` and `scripts/release.sh` create their directories with `mktemp -d "${TMPDIR:-/tmp}/publish-main.XXXXXX"` and `mktemp -d "${TMPDIR:-/tmp}/release-bump.XXXXXX"`;
- `cli/templates/scripts/remote-run.sh` and its byte-identical copy `scripts/remote-run.sh` create every temporary with `mktemp [-d] "${TMPDIR:-/tmp}/remote-run.<function>.XXXXXX"`, where they used a bare `mktemp` / `mktemp -d` before;
- `cli/test/shipped-scripts-mktemp.test.mjs` guards `cli/templates/scripts/` against a bare or `-t` call.

This task records those facts and changes no script.

**How the record is written** (`.claude/context/conventions.md` → `## Documents of record`): a measured fact states what was measured, the command and the exact message. Write `<dir>` for the scratch directory and `/var/folders/…/T` for the per-user temp directory, the spelling the file already uses. Write no path under the home directory: gate 6a fails on one. Cite by heading and row id, never by line number.

### Targets

- `docs/sandbox-verification.md`.

**Work:**

- [ ] **Take TD1, the macOS unsandboxed measurement.** Take it yourself if your Bash calls allow it. Use four exact calls, with `<dir>` a writable scratch directory you create for the purpose and remove afterwards:
  - `TMPDIR=<dir> mktemp`
  - `TMPDIR=<dir> mktemp -d`
  - `TMPDIR=<dir> mktemp -t harness-gates`
  - `TMPDIR=<dir> mktemp "<dir>/harness-gates.XXXXXX"`

  Record `sw_vers -productVersion` and the date. If the calls are refused, record instead the planning measurement the story index's `## Context` carries, stated as taken there: 2026-10-21, macOS 15.7.4, unsandboxed. Its results were: bare `mktemp`, `mktemp -d` and `mktemp -t harness-gates` all under `/var/folders/…/T`; the explicit template under `<dir>`. Name that provenance in the Observed cell. Either way, state in the row whether the session that took it was sandboxed. The planning one was not: its own `TMPDIR` was `/var/folders/…/T/`.
- [ ] **Add a `**The temporary directory.**` block to `## 5. Failures and their follow-ups`**, after the F table and before `**The gates row.**`. It carries a one-line stamp and this table, with the same columns as the gates row (`# | Check | Expected | Observed | Verdict`):
  - **TD1**, macOS unsandboxed, the four calls above. Verdict **settled**: bare `mktemp` and `mktemp -d` ignore `TMPDIR` on macOS as `-t` does, so they were changed rather than left alone. State the reason in the row. The sandbox limits where a write may land, not which directory `mktemp` picks, so the same calls fail sandboxed as F2 did. TD2 confirms it.
  - **TD2**, macOS sandboxed, the same four calls. A session launched per `## 0. Method`, cwd = a run copy, through `--allowedTools "Bash(mktemp:*)"`. Expected: the three bare and `-t` forms refused with `mktemp: mkstemp failed on /var/folders/…: Operation not permitted`, and the explicit form written under the session's `TMPDIR` (`/tmp/claude-<uid>`). Observed and Verdict: **not run — owed.**
  - **TD3**, Linux, GNU coreutils 9.7 in a `debian:stable-slim` container, 2026-10-21, unsandboxed, taken by the maintainer (from the task prompt):
    - `mktemp -t harness-gates` exits 1 with `mktemp: too few X's in template 'harness-gates'`, so `run-gates.sh`'s old line failed on Linux even unsandboxed;
    - with `TMPDIR=/var/tmp`, the explicit template creates `/var/tmp/harness-gates.<suffix>`;
    - bare `mktemp` and `mktemp -d` both honour `TMPDIR`.

    Verdict **settled**.
  - **TD4**, Linux sandboxed. Observed and Verdict: **not run**, for §6's reason (no Linux host with `bubblewrap`, `socat` and a signed-in Claude Code), not inferred from TD2.
- [ ] **Row F2.** Keep its Failure and Rows cells as they are, and add `TD1–TD4, T2` to Rows. Rewrite its Follow-up cell to say that `fix_run_gates_sandbox_tmpdir` (`sandbox1f`):
  - creates the log with `mktemp "${TMPDIR:-/tmp}/harness-gates.XXXXXX"`;
  - gives every bare `mktemp` / `mktemp -d` in `remote-run.sh` (template and copy), `publish-main.sh` and `release.sh` the same explicit template;
  - guards the shipped scripts with `cli/test/shipped-scripts-mktemp.test.mjs`.

  End the cell with: owed, T2.
- [ ] **Under `**The gates row.**`**, keep T1's cells as the 2026-10-14 record and add two rows beside it:
  - **T2**: `bash scripts/test.sh` as one exact call, on this branch's final tree, from a session launched with the launch line `### The clone layout (owed)` gives, cwd = a run copy. Expected: no gate fails on its temporary file. Every gate that fails sandboxed and passes unsandboxed on the same tree gets its own new row here and its own F row with a follow-up. Observed and Verdict: **not run — owed.**
  - **T3**: the same on Linux. **not run**, for TD4's reason.
- [ ] **The other three spots:**
  - **The headline bullet** (*"`run-gates.sh` fails every status-graded gate sandboxed."*): keep it as the defect found. Add that `fix_run_gates_sandbox_tmpdir` changed the call, and that T2, the sandboxed re-run, is owed.
  - **`## 6. The unresolved points, settled or not` → the Linux bullet:** add that TD4 and T3 are not run for the same reason.
  - **The `**Who reads this:**` line:** add *the temporary-file calls of `scripts/run-gates.sh` and the outer-loop scripts* to what a reader changing would come here for.

**Verification:**

- `git grep -nE '\| (TD[1-4]|T[23]) \|' -- docs/sandbox-verification.md` reaches each of TD1–TD4, T2 and T3.
- In those rows:
  - TD2 and T2 read **not run — owed**;
  - TD4 and T3 read **not run**;
  - no Linux row carries a pass or a fail.
- TD1's Observed cell names its command, its date, its macOS version, whether it was sandboxed and who took it.
- TD3's Observed cell quotes `mktemp: too few X's in template 'harness-gates'` verbatim.
- Row F2's Follow-up cell names `fix_run_gates_sandbox_tmpdir`, the explicit-template form and T2. T1's own cells are byte-identical to before (`git diff -- docs/sandbox-verification.md` touches no T1 cell).
- `git diff -- docs/sandbox-verification.md` adds no path under the home directory, no `/var/folders` segment beyond `/var/folders/…/T`, and no line-number citation.
