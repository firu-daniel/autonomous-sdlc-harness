### 9. An interrupt during preflight leaves the probe's temp area behind: no trap covers `SP_TMP` until `sp_setup` installs one

**File:** `scripts/lib/sandbox-probe/preflight.sh` (`sp_snapshot_take`) — `SP_TMP="$(mktemp -d "${TMPDIR:-/tmp}/sandbox-probe.XXXXXX")" || SP_TMP=""`. The trap it lacks is in `scripts/lib/sandbox-probe/session.sh` (`sp__install_trap`). `sp_setup` calls it first, just before `sp__register_clone "$SP_BRANCH"`.

`sp_preflight` creates `SP_TMP` at check 1, through `sp_snapshot_take`, and writes `snapshot.tsv` into it. The `EXIT` / `INT` / `TERM` teardown trap is installed later, by `sp_setup`, just before it cuts the probe clone. Between those two points the probe runs preflight checks 2 to 6. Those checks include the `doctor` run and the agent CLI's `--version` call, which are the slow steps a person is most likely to interrupt. Then it runs `sp_setup`'s configured reads and its branch-taken check. A refusal anywhere in that window is cleaned up: `sp_preflight_refuse` calls `sp_snapshot_release`, and `run)` calls `sp_teardown` after a failed `sp_setup`. A Ctrl-C, a `TERM`, or a `set -u` abort in that window is not cleaned up. The shell exits with no trap, and `<TMPDIR>/sandbox-probe.XXXXXX/snapshot.tsv` stays behind. The `preflight` subcommand has the same gap for its whole run, because it never calls `sp_setup`.

So the probe falls short of the story index's `Top risks:` entry *"A probe that leaves something behind"*. It also falls short of `preflight.sh`'s own header. That header names `SP_TMP` as the only thing created after check 1, and promises only that *"a refusal leaves nothing behind"*: interrupts and early exits are not covered. Clones and branches are not affected, because every one of them is registered after `sp__install_trap` has run. Only the temp area is exposed.

**Fix.** In `sp_snapshot_take`, right after the `if [ -z "$SP_TMP" ]; then … fi` block that follows the `mktemp -d` line, install an interim trap that releases the temp area:

```bash
  # Until sp_setup's sp__install_trap replaces these, an interrupt or an early exit still releases SP_TMP.
  trap 'sp_snapshot_release' EXIT
  trap 'sp_snapshot_release; exit 130' INT
  trap 'sp_snapshot_release; exit 143' TERM
```

Nothing else changes:

- `sp__install_trap` re-runs `trap` for all three signals, so `sp_setup` replaces these handlers with the full teardown before it creates anything else. Its `SP__TRAP_SET` guard is its own variable and does not see these handlers.
- `sp_snapshot_release` is idempotent. It returns 0 once `SP_TMP` is empty, so the `EXIT` handler is a no-op after an explicit release (the `preflight` subcommand's own `sp_snapshot_release`, or `sp_preflight_refuse`'s).
- Only `snapshot.tsv` is ever in `SP_TMP` during the window, so the non-recursive `rmdir` inside `sp_snapshot_release` is enough.
- `130` and `143` are the `128 + n` statuses that `sp__on_signal` already uses for `INT` and `TERM`.

In the header comment of `preflight.sh`, change *"so a refusal leaves nothing behind"* to *"so a refusal, an interrupt or an early exit leaves nothing behind"*.
