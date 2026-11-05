`chore_gate12_unroutable_sandbox_rows` decides what becomes of five row clauses of `docs/sandbox-verification.md` → `## 10. The full-run leg and the Gate 12 sandbox round`. None of them can be reached through the shipped `harness-run.yml` and watcher without changing behaviour. For each clause, either its premise is closed upstream, and the row is rewritten so that its expected result is read from the source, or the row gets a test seam that reaches it. The branch makes that call clause by clause. It does not take the measurements.

It starts from a `dev` that carries `feat_gate12_sandbox_round_driver`, which found the gap and left these clauses as hand steps. Read what that branch wrote first:

- `docs/development.md` → **Gate 12** → **The sandbox series round (#170 step 4) — not yet run.**, step 7's **The hand steps of this leg, and why the driver cannot take them.** and **RJ2 is refused before its launch check, settled from the source.**, and step 8's **JS3N is a hand step.**;
- the hand-run script `scripts/gate12-sandbox-round.sh` and its library under `scripts/lib/gate12-sandbox-round/`, and the gate's restatement of its `--list` row table, which marks each of these clauses `hand` or names it as having no route.

Those paragraphs state the reasons below. This prompt only points at them and at their sources. It does not record any decision.

> ⚠️ **Find every anchor in this prompt by its quoted text, heading or symbol, never by line number.**

## The five clauses

### 1. SB2, the `PAUSE_PROGRESS.md` arm

- **Row and source check:** SB2, `sandbox1c2` §2: `PAUSE_PROGRESS.md` replaced by a link to a token file outside the state directory, giving one `skipped <path>: <linked> is a symbolic link` line, no link and no token in the artifact.
- **Why no route exists:**
  - A committed link is moved aside before the session runs, so it never reaches `Save the state bundle`. `run_job` in `cli/templates/scripts/autonomous-watcher.sh` tests `[ -f "$state_abs/$HR_REMOTE_PAUSE_FILE" ]`. That test follows the link. A planted branch's job launches `resume none`, so the note is not this run's, and the watcher calls `hr_remote_move_aside` on it, which puts it under `autonomous_logs/remote_superseded/`. The bundle does not carry that directory. The watcher header's *"THE PAUSE NOTE belongs to the run that wrote it"* block describes the move.
  - The session cannot make the link itself. `cli/templates/claude/settings.autonomous.json` → `permissions.allow` has no `ln` entry, and under `"defaultMode": "dontAsk"` a call that matches no `allow` entry is refused without a prompt.
  - This holds for the row's own link, which points at a regular token file. A dangling link, or a link to a directory, fails `-f` and is not moved aside. The row plants neither, and its token clause needs a readable target.

### 2. SB2, the `autonomous_logs/remote_status.json` variant

- **Row and source check:** SB2's variant, `sandbox1c2` §2: `autonomous_logs/remote_status.json` linked, expecting `remote-run.sh: save: skipped …` and an artifact `status.json` that is the registry-derived one (decision `stop`).
- **Why no route exists:**
  - The watcher writes this file itself, after any committed link would have been placed. The watcher header's *"IT WRITES `remote_status.json`"* block: it writes before the spawn, after every successful control poll, and once more when the run leaves `running`.
  - Each of those writes goes through `hr_remote_status_write` in `cli/templates/scripts/lib/harness-run-lib.sh`, which *"replaces <out_json> by rename"*. So a committed link has been replaced by a regular file by the time the bundle is saved.
  - The session cannot make the link, for the reason in clause 1 (`permissions.allow`, `"defaultMode": "dontAsk"`).

### 3. SB3

- **Row and source check:** SB3, `sandbox1c2` §3: the session's *uncommitted* rewrite of `stateDir` in `harness.config.json` is not followed. The expected evidence is the `trusted configuration at <commit> names '<trusted>'; using '<trusted>'` line, with `<commit>` equal to `HARNESS_GITHUB_DEFAULT_COMMIT`.
- **Why no route exists:**
  - The session cannot rewrite the file. `cli/src/generators/writeProtection.ts` → `protectedPaths` carries `join(repoRoot, CONFIG_FILENAME)`, so `harness.config.json` is write-protected in the job's base profile, and `"defaultMode": "dontAsk"` refuses the write without a prompt.
  - A committed rewrite is no substitute. It is a job surface (`jobSurfacePaths`), which `cli/templates/github/workflows/harness-run.yml` → `Refuse a branch that changed the job's own files` refuses before anything from the branch runs.

### 4. JS3N

- **Row and source check:** JS3N, `sandbox1c` §3, negative arm. JS3's default-branch set-up, plus a job surface committed by the session before the stall: the reset is refused, and the run ends `failed` with a notification naming the path.
- **Why no route exists:**
  - The session cannot write a job surface. `jobSurfacePaths` is derived from `placeholderProtectedPaths`, which is `protectedPaths` at the placeholder roots (`cli/src/generators/writeProtection.ts`). So every job surface is write-protected in the session, refused under `"defaultMode": "dontAsk"`.
  - A job surface pushed on the branch instead is refused at `Refuse a branch that changed the job's own files`. That is row JS1, not JS3N, and the watchdog never runs.

### 5. RJ2, the launch-check clause

- **Row and source check:** RJ2, `sandbox1e4` §10 item 2: a branch whose profile fails the launch check (`sandbox.enabled: false`, no opt-out marker) launches nothing, and the job records `failed` with the `not launching` reason.
- **Why no route exists — settled from the source, not conditional on a measurement:**
  - `protectedPaths` carries `join(repoRoot, PROFILE_PATH)`, and `jobSurfacePaths` keeps every checkout-relative entry. So a branch that plants `.claude/settings.autonomous.json` changes a job surface.
  - `Refuse a branch that changed the job's own files` therefore refuses that branch before the watcher's launch check ever runs.
  - `scripts/gate12-sandbox-round.sh grade` prints RJ2 `not run`, with that refusal as its evidence.

## What the branch must answer, for each clause

For each of the five, RJ2 included: is the clause's premise closed upstream, as the sources above show?

- **If it is closed upstream:** rewrite the row so that its **Expected** says what the source guarantees, and its **Read from** names that source by path and symbol. Rewrite the hand-step paragraph in `docs/development.md` and the `scripts/gate12-sandbox-round.sh` row table to match.
- **If the row must stay observable:** add the test seam that reaches it, name the seam in the row's **Read from**, and give `scripts/gate12-sandbox-round.sh` the plant that uses the seam.

A rewrite that makes the clause unreachable by construction is an acceptable answer. Say so in the row rather than dropping it.

## Constraints

- **Any seam is opt-in, off by default, and behind an environment variable rather than a configuration key** (`harness-runs/lessons.md` → *"A feature that ships as "not yet measured" ships the seam that will measure it"*). An adopter who does not set it sees no change, and the job's profile, its job-surface set and the refusal step behave exactly as they do today.
- **No measured result is invented.** The rows stay *not yet measured*, except where a row is rewritten to be read from the source. That row then says it is read from the source, not observed.
- **Nothing runs against GitHub in this branch's own tests.** They drive a `gh` stub, as `feat_gate12_sandbox_round_driver`'s do. Nothing runs in this repository, which cannot host its own remote runs (`docs/development.md` → **This repository cannot host its own remote runs.**).
- **The rows' Read from columns are the contract.** A clause is graded on exactly what its **Read from** names. A rewrite changes the **Read from** column and the grade together, never one without the other.
- `scripts/run-gates.sh` passes.
