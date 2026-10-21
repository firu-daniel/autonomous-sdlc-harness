`fix_run_gates_sandbox_tmpdir` makes `scripts/run-gates.sh`, and so `scripts/test.sh`, run inside the unattended sandbox. `chore_sandbox_manual_verification` measured that every status-graded gate fails sandboxed on macOS (`run-gates: 24 failed, 4 passed`). The cause: `run-gates.sh` creates its log with `mktemp -t harness-gates`, and macOS `mktemp -t` ignores `TMPDIR`. It always uses the per-user `/var/folders/…/T`, which the sandbox does not let a command write: `mktemp: mkstemp failed on /var/folders/…/harness-gates.…: Operation not permitted`. Inside the sandbox `TMPDIR` is `/tmp/claude-501`, which is writable (`docs/sandbox-verification.md` → the gates row; `<home>/Work/harness-sandbox-tests/sandbox-verification-issues.md` #2).

It starts from a `dev` that carries `chore_sandbox_manual_verification`.

## The goal

1. Create the log under `${TMPDIR:-/tmp}` with an explicit template (`mktemp "${TMPDIR:-/tmp}/harness-gates.XXXXXX"`).
2. Sweep `cli/templates/scripts/`, `scripts/` and `plugin/` for every other `mktemp -t`, every bare `mktemp` or `mktemp -d` with no template, and every hard-coded temp path a sandboxed caller reaches, and fix each one the same way. The bare calls are in `remote-run.sh` (the `errfile=$(mktemp)` calls, `status_tmp=$(mktemp -d)`, the `tmp=$(mktemp -d)` and `control_tmp=$(mktemp -d)` calls), `publish-main.sh` and `release.sh`. First measure, sandboxed, whether macOS bare `mktemp` honours `TMPDIR`, and record the result. If it does, those calls need no change and the record says why.
3. Re-run the gates row sandboxed, with the launch line the record gives. Any gate that still fails only sandboxed is a new row with its own follow-up.

## Constraints

- `scripts/run-gates.sh` passes unsandboxed on the final tree, as before.
- Every changed call works with both BSD (macOS) and GNU (Linux) `mktemp`. Today's call fails on Linux even unsandboxed. This was measured 2026-10-21 in a `debian:stable-slim` container (GNU coreutils 9.7): `mktemp -t harness-gates` exits 1 with `mktemp: too few X's in template 'harness-gates'`. With `TMPDIR=/var/tmp`, the explicit template creates `/var/tmp/harness-gates.XXXXXX`, and bare `mktemp` and `mktemp -d` both honour `TMPDIR`. The Linux sandbox has never been measured (`docs/sandbox-verification.md` → the Linux row). Record the Linux gates row as not run rather than inferring it from macOS.
