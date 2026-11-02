`fix_sandbox_probe_linux_recipe_gaps` closes the four probe defects the first Linux container run found in Gate 15's own recipe and judge: PD20–PD23 in `docs/sandbox-verification.md` §5. All four are recorded as owed with no branch. #170 asks for them to be fixed before the container legs are run again after #212. It does not take that run.

This is a follow-up in the sandbox3b1 family. The earlier ones are #212 (3b1b), #219 (3b1c), #220 (3b1d) and #221 (3b1e).

> ⚠️ **Find every anchor in this prompt by its quoted text, heading or function name, never by line number.**

## What to read first

- `docs/sandbox-verification.md`:
  - §5, the rows **PD20**, **PD21**, **PD22** and **PD23**. Each states the defect and the fix it owes.
  - §0, *The probe's first Linux run (2026-10-29)*, and its list of departures from Gate 15. Three of those departures exist only because of PD20 and PD22.
- `docs/development.md` → `## 5. Verifying a change` → Gate 15, *A Linux run, in a local container*. This is the recipe the fixes go into.
- `scripts/lib/sandbox-probe/judge.sh`: the Linux layer table and the code that matches `Read-only file system` on Linux.
- `cli/test/sandbox-probe-judge.test.mjs`.

## The four defects

### PD20: the colima VM's AppArmor sysctl

On a colima VM running Ubuntu 24.04, `kernel.apparmor_restrict_unprivileged_userns` is `1`, and the sandbox cannot start in the container: `bwrap` as `probe` failed with `setting up uid map: Permission denied`, and `--security-opt apparmor=unconfined` does not lift it. The recipe does not say so. The first Linux run set the sysctl to `0` on the VM, as a departure.

**The fix:** the recipe names the sysctl, reads its value on the VM, and gives the `colima ssh -- sudo sysctl -w kernel.apparmor_restrict_unprivileged_userns=0` line. It is marked as a departure the record names, not a silent prerequisite. The restricted case, where an AppArmor profile is installed for `bwrap`, belongs to the GitHub-hosted runner (#194), not to the container.

### PD21: no `~/.ssh/config`

S1 and S2 print `not run` in the container: `/home/probe/.ssh/config does not exist on this machine, so a refusal could not be told from its absence`.

**The fix:** the recipe creates a placeholder `~/.ssh/config` as `probe` before the run. The placeholder holds no key or host entry.

### PD22: the recipe loses or mis-states four things

1. **Evidence.** `--rm` removes the probe's evidence directory under `/tmp` and the sessions' logs under `~/.claude/projects/`. The first run's evidence was copied out by hand with `docker exec … tar`; its HP1 logs were lost. The recipe copies both out before the container exits.
2. **The exit status.** Once output is piped to a log, `echo "exit $?"` reads `tee`'s status. The recipe reads `${PIPESTATUS[0]}`.
3. **The user's shell.** `useradd -m probe` gives Debian's `/bin/sh`. The recipe uses `useradd -m -s /bin/bash probe`.
4. **The credential.** Cutting the probe clone pushes its branch, so `run --leg headless-parity` needs the git credential, as `run` does. The recipe caches the credential before the first clone.

Every other recipe in `docs/development.md` that copies this container's lines gets the same changes where they apply. That includes *The suite on Linux, by hand* and *The absent-path check, by hand*, which reuse its clone lines.

### PD23: the judge's missing Linux refusal shapes

The judge's Linux layer table lacks three refusal shapes the run met at protected paths, so the rows that met only these printed `not run` (CS1, GW2):

- `Permission denied`: a `dd` onto an F9 placeholder (`dd: failed to open '<main>/.mcp.json': Permission denied`).
- `Device or resource busy`: a rename onto a protected path inside the run copy (`mv: cannot move '<clone>/.git/sbx_wp_mv_28' to '<clone>/.git/config': Device or resource busy`).
- `inter-device move failed: … unable to remove target: Device or resource busy`: a rename from the clone onto the main checkout.

PD23's own row warns that F9's fix (#217, #224) may change the `Permission denied` shape. The F9 placeholders are gone now, so that shape may no longer occur at all. **The plan decides each shape from the evidence**, `docs/sandbox-verification.md` §0, §5 F9 and the AP1–AP5 re-take (#222), and does not add a shape the current code can no longer produce. Each shape added is filed under the layer that produced it, as the table already does for `Read-only file system`, and gets a fixture in `cli/test/sandbox-probe-judge.test.mjs`.

**Overlap with #194.** #194 (`feat_sandbox_probe_job_mode`, queued 2026-11-01) says the PD23 shapes are added before its runner run. Before planning, read `scripts/lib/sandbox-probe/judge.sh` on the current `dev`. If #194 has merged with the shapes, PD23 here reduces to checking them against the evidence above.

## The goal

1. Gate 15's container recipe carries PD20's sysctl step as a named departure, PD21's placeholder and PD22's four fixes.
2. The judge knows the PD23 shapes the evidence supports, with fixtures.
3. PD20–PD23's rows in `docs/sandbox-verification.md` §5 read as fixed by this branch. Each says what changed, and that the next container run confirms it. **No measured result is invented.**

## Constraints

- **The macOS legs and the recorded verdicts don't change.** The macOS judge table is untouched. Fixtures show that every recorded verdict still grades the same way.
- **No profile, generator, wrapper, guard, watcher or `harness-run.yml` behaviour changes.**
- **Do not set `allowNestedUserNamespaces` or `enableWeakerNestedSandbox`** in any profile the probe measures.
- Bash 3.2 floor. `bash scripts/typecheck.sh` and `scripts/run-gates.sh` pass.
