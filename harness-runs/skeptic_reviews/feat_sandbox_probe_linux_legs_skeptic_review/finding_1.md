### 1. The probe's footprint statement says it touches nothing outside its temp area, clone and branch, but the Linux `registry` leg writes beside the main checkout's live run registry and may move its directory

**Files:**
- `docs/development.md` → Gate 15's opening paragraph (`**Gate 15 — the unattended sandbox probe (macOS and Linux).**`), "It changes nothing outside its own temp area, the probe clone and the probe branch, except the evidence directory"
- `scripts/sandbox-probe.sh`, the header, "It changes nothing outside its own temp area, the probe clone and the probe branch, but one evidence directory:"

**Severity:** Should Fix. **Layer:** general.

**The problem.** Both places state the probe's footprint as a rule: nothing changes outside its own temp area, the probe clone and the probe branch, apart from the kept evidence directory. This branch adds the `registry` leg (`scripts/lib/sandbox-probe/legs-registry.sh`). A default `run` takes it on every Linux host: the run loop in `scripts/sandbox-probe.sh` skips the Linux-only legs only when `SP_PLATFORM` is not `linux`. By design, that leg writes into the **main checkout's** `<main>/<stateDir>/autonomous_logs/`, which is outside all three areas:

- `sp__rg_session` copies the registry to `$dir/sbx_rg2_sib` with `cp -p -- "$reg" "$sib"`. Its session's control writes `$dir/sbx_rg1_ctl`, and its RG2 (b) helper stages `$dir/sbx_rg2_copy`. Here `dir` is `${SP_REGISTRY%/*}`, the live registry's directory.
- RG2 (a) issues `mv $sib $reg` onto the live `registry.json`. If the sandbox does not refuse it, the live file is replaced.
- `sp__rg3_session` issues `mv $dir $dir.aside`, then `mkdir $dir` and a `dd` onto a new `registry.json`. If the rename is not refused, the main checkout's whole `autonomous_logs` directory is moved aside until `sp__rg_restore` puts it back.

The leg removes or restores each of these. The footprint sentence is still false for a Linux run, and the plan used the same rule to keep RF4 and DP1–DP7 out of the probe (story plan, `## Context` → **Hand rows.**).

**Why it matters.** The shasum guard covers only `harness.config.json`, `.git/config` and `.claude/settings.autonomous.json`, not the registry. Preflight refusal 4 checks only that no watcher run is in flight when the probe starts. On a Linux host where a watcher runs, that watcher can tick during RG3 and recreate `autonomous_logs/registry.json` while the directory is aside. If it does, `sp__rg_restore` refuses ("is left and not an empty directory, so ... was not moved back; restore it by hand") and the real registry stays at `autonomous_logs.aside`.

So a maintainer who reads "changes nothing outside its own temp area, the probe clone and the probe branch" can reasonably run `bash scripts/sandbox-probe.sh run` on a Linux workstation rather than in the throwaway container. The only warning is in a different place: the registry row of the *What a Linux run expects* table says "run it only in the throwaway container". The footprint sentence a reader meets first contradicts it.

**Proof.**
- `scripts/lib/sandbox-probe/legs-registry.sh` → `sp__rg_session`: `local dir="$1" reg="$SP_REGISTRY" sib="$1/sbx_rg2_sib" copy="$1/sbx_rg2_copy" ctl="$1/sbx_rg1_ctl"`, and `sp_leg_registry` calls it with `dir="${SP_REGISTRY%/*}"`.
- `scripts/lib/sandbox-probe/legs-registry.sh` → `sp__rg3_session`: `c_mv="mv $dir $dir.aside"`.
- `scripts/sandbox-probe.sh` → the `run)` arm: `if sp_leg_linux_only "$sp_leg" && [ "${SP_PLATFORM:-}" != linux ]; then continue` is the only skip, so on Linux `registry` runs by default.
- `docs/sandbox-verification.md` → `**The run registry.**` places the registry at `<main>/harness-runs/autonomous_logs/registry.json`, the main checkout and not the probe clone.

**Fix.** Make both statements name the exception. Change no code.

- [ ] In `docs/development.md`, in Gate 15's opening paragraph, replace

  ```
  **It changes nothing outside its own temp area, the probe clone and the probe branch, except the evidence directory it keeps under `TMPDIR` when a leg does not pass and prints last**,
  ```

  with

  ```
  **It changes nothing outside its own temp area, the probe clone and the probe branch, except the evidence directory it keeps under `TMPDIR` when a leg does not pass and prints last, and, on Linux, the main checkout's run registry directory: the `registry` leg writes files beside `registry.json` and RG3 may move the directory aside, the probe removing what it wrote and restoring the directory, which is why a Linux run is taken only in the throwaway container below**,
  ```

- [ ] In `scripts/sandbox-probe.sh`, in the header, directly after the line

  ```
  # a sandbox-probe-evidence.* directory under TMPDIR, kept only when a leg does not pass.
  ```

  insert

  ```
  # On Linux the registry leg is the exception: it writes beside <main>/<stateDir>/autonomous_logs/registry.json
  # and RG3 may move that directory aside; it removes what it wrote and restores the directory
  # (lib/sandbox-probe/legs-registry.sh → THE RESTORE RULE), so take a Linux run only in the throwaway container.
  ```

No suite asserts on either sentence (`grep -rn "changes nothing outside its own temp area" cli/test` finds none). The fix edits no test file, so it runs no test. The type check (`commands.typecheck`) parses the shell, and the full suite runs in the Run gates phase.
