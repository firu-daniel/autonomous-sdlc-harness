# Story: Close the four probe defects the first Linux container run found (PD20–PD23)

## Context

The first Linux run of `scripts/sandbox-probe.sh` (2026-10-29, `docs/sandbox-verification.md` §0 *The probe's first Linux run (2026-10-29)*) found four defects in Gate 15's own recipe and judge, recorded as PD20–PD23 in `docs/sandbox-verification.md` §5 and owed with no branch. #170 asks for them to be fixed before the container legs run again after #212. This branch fixes them and **does not take that run**. It is a follow-up in the sandbox3b1 family (#212, #219, #220, #221).

Three tasks, single-layer each, in bottom-up ship order: `cli`, then two `general` tasks, the catch-all last.

- **Task 1 (`cli`)** settles PD23. `feat_sandbox_probe_job_mode` (#194, merged as #230 on this branch's base) already put the three shapes in the judge's Linux set: `scripts/lib/sandbox-probe/judge.sh` → `SP__LINUX_SANDBOX_STRINGS` holds `Read-only file system`, `Permission denied` and `Device or resource busy`. So PD23 comes down to checking those shapes against the evidence, as the task prompt says. **The decision, from the evidence, is to keep all three and add none:**
  - `Permission denied` comes from a `dd` onto a `/null` placeholder. F9's fix (#217, #224) removed only the run copy's trio placeholders (§5 AP2). AP5, taken 2026-10-31 on the second round's head `fc5aab79`, still reads `<main>/.mcp.json`, `<main>/.claude/settings.local.json`, `<main>/scripts/.git`, `<clone>/.mcp.json`, `<clone>/.claude/settings.local.json`, `<clone>/.git/hooks` and `<main>/harness-runs/.mcp.json` as `/null (tmpfs, ro,nosuid,nodev)` inside the sandbox. CS1's and GW2's `dd` met those placeholders.
  - `Device or resource busy` comes from a rename onto a path that exists and is mounted read-only over itself, such as `<clone>/.git/config`, the registry (RG2) or its directory (RG3). F9 did not touch that mount.
  - The `inter-device move failed: … unable to remove target: Device or resource busy` line is the rename across to the main checkout. The `Device or resource busy` string already matches it.

  The judge's code does not change. The gap is in the tests: `cli/test/sandbox-probe-judge.test.mjs` has fixtures for the first two shapes and none for the inter-device line. Task 1 adds that fixture, with its no-platform twin, so the macOS grade is shown unchanged.
- **Task 2 (`general`)** owns `docs/development.md`. It brings Gate 15's *A Linux run, in a local container* up to date:
  - PD20: the VM's AppArmor sysctl, as a departure the record names.
  - PD21: a placeholder `~/.ssh/config`.
  - PD22: the evidence copied out before the container exits, `${PIPESTATUS[0]}`, `useradd -m -s /bin/bash probe`, and the git credential cached before the first probe clone.

  It also carries the changes that apply into the recipes that reuse the container's lines.
- **Task 3 (`general`)** owns `docs/sandbox-verification.md`. It rewrites the Follow-up cells of PD20–PD23 so each reads fixed by this branch, says what changed, and says the next container run confirms it. **No measured result is invented.**

**Constraints that bind every task.** The macOS legs, the macOS judge table and every recorded verdict stay as they are. No profile, generator, wrapper, guard, watcher or `harness-run.yml` behaviour changes. No profile the probe measures gets `allowNestedUserNamespaces` or `enableWeakerNestedSandbox`. Bash 3.2 floor. Every anchor is found by quoted text, heading or symbol, never by line number. Every command the recipe adds sits in a fenced block, one command per line (`harness-runs/lessons.md` → *Adopter-facing documentation*).

**Top risks:**
- **An invented result in the record.** PD20–PD23's rows could claim a confirmation no run has made. Task 3 guards this: each row says *not yet confirmed by a run*, and its verification greps for any new dated observation.
- **A recipe line that leaks a credential.** Copying the evidence out of the container could copy the Claude Code OAuth credential with it. Task 2 copies `~/.claude/projects` and never the whole `~/.claude`.
- **A recipe line that silently reports the wrong exit.** `${PIPESTATUS[0]}` needs bash, so Task 2 changes the `useradd` line in the same edit as the exit-status lines.
- **A PD23 change that moves a recorded grade.** A shape added or dropped could change what a recorded run grades to. Task 1 changes no judge code and pairs its new Linux case with a no-platform twin.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom.

- **Only the committing role flips a marker** to `[x]`, as that task's commit lands. In every flow that dispatches one, that role is the `committer` agent. In the supervised flow, which dispatches none, it is the orchestrator itself.
- **No implementer changes a marker** here, or edits any other line of this section, in an index a run is iterating.
- **`[ ]` markers anywhere else are informational only.** That includes the sub-step bullets inside the per-task files. They are never the iteration source, and the committer never touches them.

Each entry resolves 1:1 to a self-contained `harness-runs/task_plans/fix_sandbox_probe_linux_recipe_gaps/task_<K>_plan.md`. They are ordered bottom-up by ship sequence, with the catch-all layer last.

1. [x] **Task 1** — Pin PD23's inter-device refusal shape with a judge fixture and its no-platform twin _(layer: cli)_ _(points: 10)_
2. [x] **Task 2** — Bring Gate 15's container recipe up to date for PD20, PD21 and PD22's four fixes _(layer: general)_ _(points: 20)_
3. [ ] **Task 3** — Record PD20–PD23 as fixed by this branch in `docs/sandbox-verification.md` §5, with confirmation owed to the next container run _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Every other recipe in `docs/development.md` that copies this container's lines gets the same changes where they apply. That includes *The suite on Linux, by hand* and *The absent-path check, by hand*, which reuse its clone lines."* The register also covers the record the task prompt's goal 3 names: *"PD20–PD23's rows in `docs/sandbox-verification.md` §5 read as fixed by this branch."*

**Derivation entry 1: the container's literal lines and the PD rows (command).** Re-run verbatim, from the checkout root:

```
git grep -nE 'useradd -m|sbx-probe-linux|echo "exit |PIPESTATUS|apparmor_restrict_unprivileged_userns|\.ssh/config|PD2[0-3]|credential\.helper|What the recipe places' -- docs
```

**Derivation entry 2: the recipes that reuse the container by name (command).** Re-run verbatim, from the checkout root:

```
git grep -nE "A Linux run, in a local container|The absent-path check, by hand|Gate 15.s container" -- docs README.md ARCHITECTURE.md
```

**Derivation entry 3: standing-artifact rows (procedure).**
- **First step, runnable:** `git grep -nE 'Gate 15|sandbox-probe|PD2[0-3]|judge\.sh|container recipe' -- harness-runs/lessons.md harness-runs/improvement_suggestions.md harness-runs/README.md`
- **Artifact:** the lessons ledger, the improvement-suggestions log and the run-artifact README under `harness-runs/`.
- **Traversal:** each file's headings in file order, then the entries under each.
- **Decision rule:** an entry is reached when it names Gate 15, its container recipe, the probe judge's Linux table, or PD20–PD23.
- **Executed on this branch's base:** the first step printed nothing, and the traversal reached no entry, so this entry contributes no row.

**Closure invariant:** every site that derivation entries 1 and 2 reach appears as a row below, and so does every entry that derivation entry 3 reaches.
- A site is a section, paragraph, table row or fenced block, named by its anchor.
- A hit inside a site a row already names is that row's, including the lines Tasks 2 and 3 add inside their own sections.
- After the branch, a re-run must reach no site outside this table.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/development.md` → *A Linux run, in a local container*: its opening paragraph ("A Linux run is taken in a throwaway Docker container on this machine's colima VM") | — | entry 2 | `change` | Task 2: PD20's sysctl sentence |
| 2 | `docs/development.md` → *A Linux run, in a local container*: the "On the host:" block (`colima start`, `docker run --rm -it --name sbx-probe-linux …`) | — | entry 1, `sbx-probe-linux` | `change` | Task 2: PD20's read and set lines |
| 3 | `docs/development.md` → *A Linux run, in a local container*: the "As root in the container:" block (`useradd -m probe`) | — | entry 1, `useradd -m` | `change` | Task 2: PD22 item 3 |
| 4 | `docs/development.md` → *A Linux run, in a local container*: the "As `probe`, clone the repository" block (`git config --global credential.helper 'cache --timeout=7200'`) | — | entry 1, `credential\.helper` | `change` | Task 2: PD21's placeholder, then PD22 items 2 and 4 in a new run block after it |
| 5 | `docs/development.md` → *A Linux run, in a local container*: the paragraph "`git status --porcelain` must print nothing … **What the recipe places in the container, and how it is removed**" and its bullets ("**The git credential** is a fine-grained GitHub token") | — | entry 1, `What the recipe places`, `credential\.helper` | `change` | Task 2: the credential's prompt is now the dry-run push's, and a bullet is added for the `~/.ssh/config` placeholder |
| 6 | `docs/development.md` → the paragraph "An expected refusal whose text carries none of the refusal strings the judge knows prints `not run`" | — | entry 1, `PD2[0-3]` | `no-change` | Still true: PD23's shapes are in the judge's table since `feat_sandbox_probe_job_mode`, and the rule for any other string stands. Task 1 adds a fixture and no shape, and the evidence check is recorded in the PD23 row (Task 3) |
| 7 | `docs/development.md` → *The absent-path check, by hand*: the paragraph "To take it on a branch's head before merge" and its three clone lines | — | entry 2 | `change` | Task 2: its `run --leg headless-parity` cuts and pushes a probe clone, so the recipe's credential line follows its clone lines (PD22 item 4) |
| 8 | `docs/development.md` → *The absent-path check, by hand* → "**Copy both output directories to the host before leaving the container.**" (`docker cp sbx-probe-linux:<out> <host dir>`) | — | entry 1, `sbx-probe-linux` | `no-change` | It already copies its own two output directories out before the container exits. PD22's copy-out is for `run`'s evidence directory and `~/.claude/projects`, and Task 2 adds that as a step of its own |
| 9 | `docs/development.md` → *The refusal subcommand and the hand rows*: the "As `probe`, from the checkout:" block (`bash scripts/sandbox-probe.sh refusal`, `echo "exit $?"`) | — | entry 1, `echo "exit ` | `change` | Task 2: PD22 item 2 |
| 10 | `docs/development.md` → **DP1–DP7, by hand.**: the DP5 bullet ("the AppArmor answer, with the `kernel.apparmor_restrict_unprivileged_userns` sysctl's value as the stamp read it") | — | entry 1, `apparmor_restrict_unprivileged_userns` | `no-change` | DP5 records whatever value the stamp reads. The VM's departure that sets it is named at the host block (row 2) and recorded per row 11 |
| 11 | `docs/development.md` → **Recording a Linux run.** ("the `echo "exit $?"` line after every `run` and `refusal`") | — | entry 1, `echo "exit ` | `change` | Task 2: the exit line reads `${PIPESTATUS[0]}`, and the VM's sysctl reading and the copied-out evidence are recorded |
| 12 | `docs/development.md` → **Job mode, on a local fresh clone (CS6).**: its block (`echo "exit $?"`) | — | entry 1, `echo "exit ` | `no-change` | It runs on the host, not in the container, and its `run` line is not piped, so `$?` is the probe's own status |
| 13 | `docs/development.md` → **Gate 15 — the unattended sandbox probe (macOS and Linux).** (its opening paragraph) | — | entry 2 | `no-change` | It points at *A Linux run, in a local container* and states nothing the four fixes change |
| 14 | `docs/development.md` → **The suite under jq 1.6, by hand.** | — | entry 2, `Gate 15.s container` | `no-change` | It reuses the absent-path check's clone lines and then runs `npm ci` and `npm test` only. It cuts no probe clone and pushes nothing, so it needs no credential (PD22 item 4). It keeps no probe evidence (item 1) and pipes nothing (item 2). It runs as the `probe` user the recipe creates, so it inherits item 3 from row 3 |
| 15 | `docs/development.md` → **The suite on Linux, by hand.** | — | entry 2 | `no-change` | As row 14 |
| 16 | `docs/cli.md` → the paragraph "On Ubuntu 24.04 and later, `kernel.apparmor_restrict_unprivileged_userns` is `1`" | — | entry 1 | `no-change` | It is the adopter's host prerequisite, met by an AppArmor profile, which is the restricted case and belongs to the runner (#194). The container's VM departure is Gate 15's alone |
| 17 | `docs/cli.md` → §6 residual 12 ("Debian 12 in Gate 15's container") | — | entry 2 | `no-change` | A dated statement of where a measurement was taken |
| 18 | `docs/remote-execution.md` → **The job installs them.** | — | entry 1, `apparmor_restrict_unprivileged_userns` | `no-change` | `harness-run.yml`'s install step on a runner. The task prompt forbids any `harness-run.yml` behaviour change, and the restricted case is the runner's |
| 19 | `docs/sandbox-placeholder-upstream-report.md` → its setup bullets (`kernel.apparmor_restrict_unprivileged_userns: 0`) | — | entry 1 | `no-change` | It records the setup that was measured. Editing it would falsify the report |
| 20 | `docs/sandbox-placeholder-upstream-report.md` → its "The container:" bullet (`docker run --rm -it --name sbx-probe-linux …`) | — | entry 1 | `no-change` | As row 19 |
| 21 | `docs/sandbox-verification.md` → §0 **The probe's first Linux run (2026-10-29).**: its opening paragraph | — | entries 1 and 2 | `no-change` | A dated record of a run. Editing it would falsify the record |
| 22 | `docs/sandbox-verification.md` → §0, that run's `docker run` block | — | entry 1, `sbx-probe-linux` | `no-change` | As row 21 |
| 23 | `docs/sandbox-verification.md` → §0, that run's `run` stamp block (`sandbox-probe: stamp: kernel.apparmor_restrict_unprivileged_userns: 0`) | — | entry 1 | `no-change` | As row 21 |
| 24 | `docs/sandbox-verification.md` → §0, that run's departure bullet "**The AppArmor sysctl.**" | — | entry 1 | `no-change` | As row 21. It is the departure PD20's fix now names in the recipe |
| 25 | `docs/sandbox-verification.md` → §0, that run's departure bullet "**`useradd -m -s /bin/bash probe`**" | — | entry 1, `useradd -m` | `no-change` | As row 21 |
| 26 | `docs/sandbox-verification.md` → §0, that run's paragraph "The probe kept the streams of 13 legs with a non-pass line" | — | entry 1, `PD2[0-3]` | `no-change` | As row 21 |
| 27 | `docs/sandbox-verification.md` → §0 **The absent-path check (2026-10-29).** → its "**Stamp.**" bullet | — | entries 1 and 2 | `no-change` | As row 21 |
| 28 | `docs/sandbox-verification.md` → §4 row S1 | — | entry 1, `\.ssh/config` | `no-change` | A macOS row. PD21 is the container's |
| 29 | `docs/sandbox-verification.md` → §4 row S2 | — | entry 1, `\.ssh/config` | `no-change` | As row 28 |
| 30 | `docs/sandbox-verification.md` → §5 row F9 ("The same placeholders refuse a sandboxed write with `Permission denied`") | — | entry 1, `PD2[0-3]` | `no-change` | Still true: AP5 (2026-10-31) still reads the non-trio placeholders. Its citation of PD23 stands |
| 31 | `docs/sandbox-verification.md` → §5 **The probe's own defects (2026-10-27 to 2026-11-02).**: its opening paragraph | — | entries 1 and 2 | `no-change` | A dated account of which run found which defect, and still true |
| 32 | `docs/sandbox-verification.md` → §5 row PD20 | — | entries 1 and 2 | `change` | Task 3 |
| 33 | `docs/sandbox-verification.md` → §5 row PD21 | — | entry 1 | `change` | Task 3 |
| 34 | `docs/sandbox-verification.md` → §5 row PD22 | — | entry 1 | `change` | Task 3 |
| 35 | `docs/sandbox-verification.md` → §5 row PD23 | — | entry 1 | `change` | Task 3 |
| 36 | `docs/sandbox-verification.md` → §5 **The route's re-take (owed).**: its opening paragraph | — | entry 2 | `no-change` | A dated record of measurements |
| 37 | `docs/sandbox-verification.md` → §5, the first AP table's "**Stamp.** 2026-10-30" | — | entry 1 | `no-change` | As row 36 |
| 38 | `docs/sandbox-verification.md` → §5 "**2026-10-30: AP1–AP5 are measured**" | — | entry 2 | `no-change` | As row 36 |
| 39 | `docs/sandbox-verification.md` → §5 "**2026-10-30, Session 1:**" and its "**Stamp.**" | — | entries 1 and 2 | `no-change` | As row 36 |
| 40 | `docs/sandbox-verification.md` → §5 Session 1's "**The container.**" bullet | — | entry 1 | `no-change` | As row 36 |
| 41 | `docs/sandbox-verification.md` → §5 Session 2's "**Stamp.**" ("the same lines as session 1's") | — | entry 1 | `no-change` | As row 36 |
| 42 | `docs/sandbox-verification.md` → §5 **The round's head, taken 2026-10-31.**: its paragraph and its "Session 1's stamp" block | — | entries 1 and 2 | `no-change` | As row 36 |
| 43 | `docs/sandbox-verification.md` → §5 **AP7's session, the control.**: its stamp block | — | entry 1 | `no-change` | As row 36 |
| 44 | `docs/sandbox-verification.md` → §5 **The second round's head, taken 2026-10-31.**: its "Session 3's stamp" block | — | entry 1 | `no-change` | As row 36. Its AP5 row is the evidence Task 1 decides PD23 from |
| 45 | `docs/sandbox-verification.md` → §5 **Session 4, AP7's control.**: its stamp block | — | entry 1 | `no-change` | As row 36 |
| 46 | `docs/sandbox-verification.md` → §6, the point "**How the Linux sandbox treats a `denyWrite` entry containing `*`:**" ("is Gate 15's container recipe") | — | entry 2 | `no-change` | A pointer to the recipe, and still true |
| 47 | `docs/sandbox-verification.md` → §8 **What this section is.** | — | entry 2 | `no-change` | A pointer to the recipe, and still true |
| 48 | `docs/sandbox-verification.md` → §8 "**Stamp.** 2026-10-29" ("set to `0` for the run (§5 PD20)") | — | entry 1 | `no-change` | A dated record of the run |
| 49 | `docs/sandbox-verification.md` → §8 row CS1 (Linux) | — | entry 1, `PD2[0-3]` | `no-change` | A measured row. Nothing is re-taken on this branch, and no result is invented |
| 50 | `docs/sandbox-verification.md` → §8 row S1 (Linux) | — | entry 1 | `no-change` | As row 49. Its `not run` stands until the next container run |
| 51 | `docs/sandbox-verification.md` → §8 row S2 (Linux) | — | entry 1 | `no-change` | As row 50 |
| 52 | `docs/sandbox-verification.md` → §8 row GW2 | — | entry 1, `PD2[0-3]` | `no-change` | As row 49 |
| 53 | `docs/sandbox-verification.md` → §8 row DP1 | — | entry 1 | `no-change` | A hand row's own check and record |
| 54 | `docs/sandbox-verification.md` → §8 row DP5 | — | entry 1 | `no-change` | As row 53. It records the sysctl value as the stamp read it |
| 55 | `docs/sandbox-verification.md` → §9 row IS1 | — | entry 1 | `no-change` | The runner's row. The restricted case belongs to #194 |
| 56 | `docs/sandbox-verification.md` → §9 row IS3 | — | entry 1 | `no-change` | As row 55 |
| 57 | `docs/sandbox-verification.md` → §9 row S1 (runner) | — | entry 1 | `no-change` | As row 55. The runner workflow's placeholder is the model Task 2's container placeholder mirrors |
