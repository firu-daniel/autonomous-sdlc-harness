# Skeptic Review: feat_sandbox_probe_linux_legs

## Context

**Branch:** `feat_sandbox_probe_linux_legs`
**Date:** 2026-10-28
**Reviewed:** the whole branch diff, adversarially, against `defaultBranch` `dev`. This run copy has no local `dev`, so the diff was taken against its remote-tracking ref: `git diff origin/dev...HEAD`. It covers 50 changed files:

- **The probe.** `scripts/sandbox-probe.sh` and `scripts/lib/sandbox-probe/*`, including:
  - the new `platform.sh`;
  - the five Linux-only leg libraries: `legs-glob.sh`, `legs-registry.sh`, `legs-detached.sh`, `legs-loopback.sh` and `legs-refusal.sh`.
- **Gate 15** in `docs/development.md`, with its container recipe.
- **The record:** `docs/sandbox-verification.md` and its new §8.
- **The suites** under `cli/test/`.

33 run-artifact files excluded from the reviewed diff.

**De-duplicated against:**
- `harness-runs/code_reviews/feat_sandbox_probe_linux_legs_code_review.md`, Findings 1–3: BG9's 20 s bound, LB5's retyped loopback host, and the "on macOS" header line;
- `harness-runs/architecture_branch_reviews/feat_sandbox_probe_linux_legs_arch_review.md`, Finding 1: the loopback-host literals.

`phases.parity` is `false`, so no parity review exists and check 2's parity leg is inert.

**What was verified first-hand.**

- **Wiring (check 1).** Every new leg function is reached through the run loop's `sp_leg_${leg//-/_}` dispatch, and `sp_leg_refusal` through the `refusal)` arm. `sp_stamp`, `sp_leg_row_for`, `sp_leg_platform_skip`, `sp_restore_register`/`sp_restore_clear`, `sp__td4_grade` and `sp__wp_mv_class` each have a caller.
- **RF1's launch path.** RF1's stream file is created by `sp_session`'s redirection even when the agent CLI refuses at startup, so RF1 can grade a startup refusal rather than reading "did not launch".
- **Citations (check 3).** These anchors resolve and say what the code claims:
  - `scripts/autonomous-watcher.sh` → `THE PER-RUN PROFILE` and the sandbox-preflight block that `spawn` runs (`hr_sandbox_opted_out` / `hr_sandbox_prereq_probe_var`);
  - `LOOPBACK_ALLOWED_HOST` in `cli/src/generators/sandboxProfile.ts`;
  - the TD3 row's `too few X's` message;
  - BG2's 1524 s;
  - `doctor --remote-job`;
  - `init --no-analyze` with `HARNESS_SELF_ADOPT`;
  - the watcher's `this machine cannot sandbox an unattended run` log line;
  - the marketplace name used in the recipe.
- **The `unrecognised` arm.** Every legacy caller that expects a `sandbox` or `network` refusal reads it as `not run`. N3 and N4 read it as their data.
- **RG3's restore** runs from outside the sandbox before teardown's clone loop. It acts only on an `.aside` it moved.
- **WF5's grade** matches `hr_lane_mtime`'s two `stat` arms.
- **The `cli` layer — clean pass.** The diff touches the `cli` layer only in its suites: four new (`cli/test/sandbox-probe-platform.test.mjs`, `sandbox-probe-refusal-leg.test.mjs`, `sandbox-probe-glob-registry-legs.test.mjs`, `sandbox-probe-detached-loopback-legs.test.mjs`), seven modified (`sandbox-probe-gates-legs`, `-git-and-legs`, `-judge`, `-protection-legs`, `-remote-legs`, `-shell`, `-wrappers-legs`), and 22 new stream fixtures under `cli/test/fixtures/sandbox-probe/*.jsonl`. Graded against `.claude/context/cli.md` → `## What "done" means here` and `.claude/context/conventions.md` → `## The testing bar`, rule by rule:
  - *A test file opens with the rule it exists to enforce, and names what it leaves out and why.* Each new suite's header carries a `**The rule these tests exist to enforce: …**` line before any case, followed by a `Left out` paragraph: the platform suite leaves out a real `bwrap --version` line (every stamp command is a stub); the refusal, glob/registry and detached/loopback suites leave out the legs' session wiring (`sp_leg_glob_deny`, `sp_leg_detached`, `sp_leg_loopback`, …) because no case launches a session. Holds.
  - *No fixture is created inside this checkout; each is under `os.tmpdir()` and removed in process.* Each new suite's `caseDir` builds its directory with `mkdtemp(join(tmpdir(), 'harness-sp-…-'))` and registers `t.after(() => rm(dir, { recursive: true, force: true, … }))`. The `.jsonl` stream fixtures are read-only inputs addressed through `FIXTURES`, never written. Holds.
  - *No test reaches the network or launches the agent CLI.* The platform suite stubs every command the stamp runs on a prepended `PATH` and points `SANDBOX_PROBE_AGENT_CLI` at the stub `sbx-stub-agent-cli`. The `curl … http://127.0.0.1:8765/…` and `http://localhost:8765/…` constants in the detached/loopback suite are command strings passed to the grading functions, which match them byte-equal against the stream fixture; nothing executes them. Holds.
  - *Assertions are made against the stated contract.* Grading cases assert the literal `SP_VERDICT` / `SP_EVIDENCE` pair (`graded` → `assert.deepEqual`, `assertJudged`), and the stamp cases assert the exact `sandbox-probe: stamp: <key>: <value>` lines in their fixed order. The story plan's first `Top risks:` entry (each Linux fixture run once with `SANDBOX_PROBE_UNAME=Linux` and once without, the macOS verdict unchanged) is met in `sandbox-probe-judge.test.mjs` → `the Linux refusal string and the unrecognised layer, on Linux only`, where every `judgeOnLinux` case on `linux-erofs` and `linux-unrecognised` has a `judge` twin with `SANDBOX_PROBE_UNAME` blanked, and in the `Darwin` / `Linux` pairs in `sandbox-probe-shell.test.mjs` and `sandbox-probe-git-and-legs.test.mjs`. Holds.

  No `cli` finding results.

**Headline.** One net-new finding, a Should Fix. The probe's stated footprint rule is false for a Linux run, because the `registry` leg writes into the main checkout's live run-registry directory. No Must Fix.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.**

- The orchestrator walks the `[ ]` entries below top to bottom.
- The committing role flips each one to `[x]` as that fix's commit lands.
- `[ ]` markers anywhere else, such as sub-step bullets in a per-finding file, are informational only. The committer never touches them.

Each entry resolves to `harness-runs/skeptic_reviews/feat_sandbox_probe_linux_legs_skeptic_review/finding_<K>.md`.

1. [x] **Finding 1** — Name the Linux `registry` leg's writes beside the main checkout's run registry as an exception to the probe's footprint statement, in Gate 15 and in `scripts/sandbox-probe.sh`'s header _(layer: general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. The probe's footprint statement says it touches nothing outside its temp area, clone and branch, but the Linux `registry` leg writes beside the main checkout's live run registry and may move its directory
→ [finding_1.md](feat_sandbox_probe_linux_legs_skeptic_review/finding_1.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false`, so there is no reference implementation to diverge from and no divergence to call out.
