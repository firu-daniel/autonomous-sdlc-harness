### Task 15 — Restate Gate 15 for job mode and the runner workflow

**Goal:** Gate 15 in `docs/development.md` → `## 5. Verifying a change` gains job mode, its two tables restated from the probe, and the instructions the prompt's goal 3 asks for: committing `scripts/sandbox-probe-runner.yml` to the Gate 12 repository, running it, and reading the uploaded evidence. It **names the heading** the runner's results go under, `## 9. The GitHub-hosted runner legs` in `docs/sandbox-verification.md`. **No measured result is stated**: every runner expectation is an expectation.

**Depends on:**

- **Task 1's two tables.** `bash scripts/sandbox-probe.sh --list` prints the leg table, now with `job-layout` (CS6), `runner-install` (IS1–IS4), `runner-pid` (PN1–PN3) and `runner-privs` (NN1, NN2) between `loopback` and `headless-parity`. `bash scripts/sandbox-probe.sh --list --job` prints `<leg>\t<job rows>` for the eleven job legs.
- **Task 5's command forms:** `run --job <checkout> [--runner-controls <file>] [--leg <name>]...` and `preflight --job <checkout>`.
- **Task 3's preflight**, and **Task 2's footprint and sweep**.
- **Task 14's workflow:** its `Switch to the configured default branch` step, its two inputs `probe_commit` and `cli_version`, its artifact `sandbox-probe-evidence` with a 3-day retention holding `sandbox-probe-out/` (`controls.tsv`, `run.stdout`, `run.stderr`, `exit.txt`) and the kept evidence directory, and its `runs-on` expression.

**Where this task stops.** It edits `docs/development.md` only, inside Gate 15. The rows of record are Task 23's. `cli/test/sandbox-probe-git-and-legs.test.mjs` compares both restated tables with the probe; that test is Task 16's.

### Targets

- `docs/development.md`

**Work:**

- [ ] **The opening paragraph** (`**Gate 15 — the unattended sandbox probe (macOS and Linux).**`) gains a few sentences, the rest kept as written:
  - **What job mode measures:** `run --job <checkout>` measures the checkout it runs in under the base profile a `harness-run.yml` job builds. No clone is cut and no per-run profile rendered.
  - **The four differences** from the clone layout: launch line, profile check, preflight, placeholder sweep.
  - **Job mode's preflight:** a main checkout that is not the probe's own, on its `defaultBranch`, with no tracked change. `doctor --remote-job` exits 0 and passes the four sandbox checks; refusals 4, 5 and 6's `SETTINGS_PROFILE` half do not apply.
  - **Its footprint:** the probe branch in the checkout and on its origin, published with no upstream; the checkout's `HEAD`; and the job-mode placeholder manifest under `RUNNER_TEMP`. Each is restored or removed at teardown, after the job's own `job-sweep`.
- [ ] **The leg table** (`| Leg | Rows | Expected | Recorded in |`) is restated from `--list`, row for row. Directly after it comes a second table, `| Leg | Job rows |`, restated from `--list --job`, with one sentence before it: the clone-only rows do not carry over, and a job leg prints them `not run`, *clone layout only*. Row ids are comma-and-space-joined, as in the first table.
- [ ] **A new block, `**Job mode, on a local fresh clone (CS6).**`** CS6 is taken locally, on macOS too, from a fresh `git clone` made outside the sibling glob, adopted without `--force` so `git status --porcelain` stays empty. This departs from CS6's own `init --force`, which rewrites tracked files job mode's preflight refuses. **The clone must sit on the configured `defaultBranch`**, because job-mode preflight check 3 refuses any other branch, and a bare `git clone` lands on the remote's default branch instead: in this repository `harness.config.json` → `defaultBranch` is `dev` while GitHub's default is `main`, which carries no `scripts/` (`scripts/publish-main.sh`). So the clone line names `--branch dev`; the block says to substitute the adopting repository's own `defaultBranch` elsewhere. Each command alone in a fenced block, one per line, the exit status read by its own line:

  ```
  git clone --branch dev <origin url> <job>
  npm ci --prefix <job>
  npm run build --prefix <job>
  HARNESS_SELF_ADOPT=1 node <job>/cli/dist/cli.js --cwd <job> init --no-analyze --plugin-root-entries
  git -C <job> status --porcelain
  bash scripts/sandbox-probe.sh run --job <job> --leg job-layout
  echo "exit $?"
  ```
- [ ] **A new block, `**The GitHub-hosted runner legs, in the Gate 12 repository.**`**
  - **When:** at the release #170 step 4 cuts, through `bash scripts/release.sh <version>` (`## 7. Releasing`), from a `dev` carrying `feat_sandbox_probe_job_mode` and `chore_sandbox_gate12_full_run_leg` (#195), in that step's one Gate 12 round. Not at 0.6.7, whose `harness-run.yml` has neither `Install the sandbox prerequisites` nor `Sweep the sandbox placeholders`. The Gate 12 repository is first re-rendered at that version with `init --upgrade-workflows`, as `docs/remote-execution.md` → `### Upgrading` gives it.
  - **What to commit:** copy `scripts/sandbox-probe-runner.yml` to that repository's default branch as `.github/workflows/sandbox-probe-runner.yml`, by hand. It never runs in this repository.
  - **Which branch it measures:** the workflow checks out GitHub's default branch, then switches to `harness.config.json` → `defaultBranch` when the two differ, refusing and naming both when the configured branch is not on origin, because job-mode preflight accepts only the configured one (Task 14).
  - **Its inputs:** `probe_commit` is the commit the release was cut from, so the probe's run library and the release's scripts are the same code. `cli_version` is the release.
  - **The commands**, each alone in a fenced block, one per line:

    ```
    gh workflow run sandbox-probe-runner.yml -R firu-daniel/harness-gate12 -f probe_commit=<sha> -f cli_version=<version>
    gh run list -R firu-daniel/harness-gate12 --workflow sandbox-probe-runner.yml
    gh run download <run id> -R firu-daniel/harness-gate12 -n sandbox-probe-evidence -D <dir>
    ```
  - **Reading the evidence:**
    - `run.stdout` holds the result lines;
    - `run.stderr` holds the stamp lines, including `mode: job …` and the `runner …` lines (image, kernel, `bwrap --version`, probe commit, CLI version), the `job-sweep:` lines and the evidence directory's path;
    - `controls.tsv` holds every host reading, whole;
    - `exit.txt` holds the exit status;
    - the `sandbox-probe-evidence.*` directory holds the non-passing legs' streams.

    Record each row into `docs/sandbox-verification.md` → `## 9. The GitHub-hosted runner legs`, beside its stamp. Remove the downloaded directory once recorded: the kept streams can quote what a session read. **The artifact expires after 3 days.** An expired artifact means the evidence is gone, not that the run passed, and the round is run again.
  - **What the runner owes,** in one line per runner leg, from Task 1's expectations: IS1–IS4, PN1–PN3, NN1–NN2, CS6, N4's metadata-service control, LB1–LB5 in both forms, BG9 and the carried-over legs.
- [ ] **Two existing paragraphs.**
  - *"An expected refusal whose text carries none of the refusal strings the judge knows prints `not run` …"* gains: PD23's `Permission denied` and `Device or resource busy` shapes are in the table since `feat_sandbox_probe_job_mode`, and the rule stands for any other string.
  - **The rows this probe does not take, named so the list is complete.**:
    - the GitHub-hosted runner legs leave the deferral: they are job mode's, taken by the workflow above in #170 step 4's Gate 12 round;
    - CS6 leaves the hand rows: job mode takes it;
    - CS5 stays a hand row;
    - the full run on the real job stays owed on `chore_sandbox_gate12_full_run_leg`.

**Verification:**

- The restated tables match the probe, read back line by line against `bash scripts/sandbox-probe.sh --list` and `bash scripts/sandbox-probe.sh --list --job`: each leg's rows, expected and recorded-in fields, and each job leg's rows.
- `grep -n '## 9. The GitHub-hosted runner legs' docs/development.md` finds the heading named in the new block.
- Every command this task adds for a person to run sits alone on its line inside a fenced block. Prose may name a form such as `run --job <checkout>`, but never carries a command to copy. `grep -n 'gh workflow run\|gh run download\|gh run list' docs/development.md` shows each only on a fenced line.
</content>
</invoke>
