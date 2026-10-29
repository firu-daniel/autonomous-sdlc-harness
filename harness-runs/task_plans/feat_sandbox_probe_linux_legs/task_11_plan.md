### Task 11 — Restate Gate 15 for macOS and Linux: the leg table, the container recipe, the Linux expectations beside their macOS baselines, the refusal subcommand and the hand rows

**Goal:** Gate 15 (`docs/development.md` → `## 5. Verifying a change`, the paragraph opening `**Gate 15 — the unattended sandbox probe (macOS).**`) becomes the instructions a maintainer follows to run the probe on Linux, in a local container on this machine's colima VM. It gains:

- **the container recipe**, which says plainly what credentials it places in the container and how they are removed;
- **every Linux leg**, each with its expected result and its macOS baseline;
- **the `refusal` subcommand and the hand rows;**
- **how to record a Linux run.**

**It records no measured result.**

**Depends on:** Tasks 1–10, which ship what this task describes.

- **Task 2's `--list`** prints 21 legs in this order: `gates`, `mktemp`, `scratch`, `retrieval`, `wrappers`, `wrappers-refresh`, `planted-config`, `planted-files`, `write-protection`, `git`, `network`, `retry`, `repo-settings`, `credentials`, `invalid-profile`, `glob-deny`, `registry`, `detached`, `loopback`, `headless-parity`, `refusal`.
  - `gates` carries `T2,W7,T3`, `mktemp` carries `TD2,TD4`, and their expected texts are new. Task 2's file gives the five new legs' rows and texts.
  - A default `run` skips the Linux-only legs (`glob-deny`, `registry`, `detached`, `loopback`, `refusal`) off Linux. `run --leg <one>` off Linux prints `not run`. `refusal` runs only as `bash scripts/sandbox-probe.sh refusal`.
- **Preflight refusal 2** admits macOS and Linux and refuses anything else with `this probe measures the macOS and Linux sandboxes and 'uname -s' is '<x>'`.
- **The refusal subcommand's preflight** needs four things: a Linux host; `doctor` passing `profile-sandbox`, `profile-write-protection` and `profile-main-anchor` but **not** `sandbox-prerequisites`; and `bwrap` or `socat` missing from `PATH`.
- **The stamp.** `run` and `refusal` print `sandbox-probe: stamp: <key>: <value>` lines on stderr after preflight (Task 1).
- **The judge** (Task 3). PD18 is fixed. On Linux, `Read-only file system` is a sandbox refusal, and an expected refusal carrying no known string prints `not run`, naming the text.

`cli/test/sandbox-probe-git-and-legs.test.mjs` compares the leg table this task restates with `--list` row for row, so the table must match it exactly.

**Where this task stops.** It edits Gate 15 only. `docs/sandbox-verification.md` is Task 21's: this task names its §8 as where the Linux rows are recorded, but writes nothing there. No other gate and no `## 6` roadmap row changes.

### Targets

- `docs/development.md`, Gate 15's entry: its opening paragraph, its leg table, and the paragraphs up to and including `**The rows this probe does not take, named so the list is complete.**`

**Work:**

- [ ] **The heading, the opening paragraph and the leg table.**
  - **The heading** becomes `**Gate 15 — the unattended sandbox probe (macOS and Linux).**`. The opening paragraph says the probe runs on macOS and on Linux, and that a Linux run is taken in the container below. It states that refusal 2 refuses any other platform.
  - **A sentence for the `refusal` subcommand and the Linux-only legs**, beside the existing `run` / `headless-parity` sentence: `run` skips the Linux-only legs off Linux, and `refusal` is a subcommand of its own with its own preflight, stated in full as above.
  - **The table** under `| Leg | Rows | Expected | Recorded in |` is restated from `bash scripts/sandbox-probe.sh --list`, one row per line, in its order:
    - the leg name in backticks, as today;
    - the rows `, `-joined;
    - the expected and recorded-in texts verbatim.
  - **The fenced command block** gains `bash scripts/sandbox-probe.sh refusal` on a line of its own.
- [ ] **The container recipe.** A new paragraph after the evidence paragraph, opening `**A Linux run, in a local container.**`, followed by fenced blocks with one command per line and no `;` joins.
  - **The host.** `colima start`, then `docker run --rm -it --name sbx-probe-linux --security-opt seccomp=unconfined --security-opt apparmor=unconfined --security-opt systempaths=unconfined node:22-bookworm bash`.
    - Say why: Docker's default seccomp profile refuses the namespace calls bubblewrap makes, and its masked `/proc` stops bubblewrap mounting a fresh one (the task prompt's verified facts S and SR).
    - Say that the probe sets neither `allowNestedUserNamespaces` nor `enableWeakerNestedSandbox`. If no listed container shape lets the sandbox start, the record says so, and states what `enableWeakerNestedSandbox` would stop holding: the sandbox would bind-mount the container's own `/proc` instead of a fresh one.
    - `node:22-bookworm` meets the CLI's `engines` floor of `>=20.11.0` and carries `git`, `curl`, `python3` and `perl`, whose `shasum` the guard needs.
  - **As root in the container:**
    - `apt-get update`;
    - `apt-get install -y bubblewrap socat jq`;
    - `npm install -g @anthropic-ai/claude-code`;
    - `useradd -m probe`;
    - `su - probe`.
  - **As `probe`:**
    - clone the repository from its GitHub origin onto `dev`. Refusal 5 lists the remote, and the wrappers legs push the probe branch, so the checkout must reach its origin;
    - `npm ci`;
    - `npm run build`;
    - `HARNESS_SELF_ADOPT=1 node cli/dist/cli.js init --no-analyze`;
    - `git status --porcelain`, which must print nothing;
    - `claude plugin marketplace add <checkout>`;
    - `claude plugin install autonomous-sdlc-harness@autonomous-sdlc-harness`;
    - `node cli/dist/cli.js doctor`.
  - **What the recipe places, and how it is removed** — the maintainer's decision, made when they run the gate:
    - **The Claude Code credential** is the OAuth credential `claude` writes under `/home/probe/.claude/` when the maintainer signs in. `/logout` before leaving invalidates it, and the container's removal (`--rm`, no volume mounted) deletes the file.
    - **The git credential** is a fine-grained token with contents read and write on this one repository, held only in memory by `git config --global credential.helper 'cache --timeout=7200'`. It is revoked at GitHub afterwards.
    - Nothing from the host's `~/.ssh`, `~/.claude` or keychain is mounted.
- [ ] **The Linux legs, beside their macOS baselines.** A paragraph opening `**What a Linux run expects, and the macOS result it compares against.**`, then a table separated from the leg table by prose, with the header `| Leg | Linux rows | Expected on Linux | macOS baseline (latest) |`. Each row:
  - **`gates`** (T3, W7): as T2 and W7. Baseline: T2 `pass` (2026-10-27, run 2) and W7 `pass`.
  - **`mktemp`** (TD4): **TD3's result, not TD2's.** Bare and `-d` are written under the session's `TMPDIR`, `-t` fails `too few X's`, and the explicit form is written. Baseline: TD2 `pass`, the bare, `-d` and `-t` forms refused with `mkstemp failed`. Different by design.
  - **The legs expected to behave as on macOS:** `scratch`, `retrieval`, `wrappers`, `wrappers-refresh`, `planted-config`, `planted-files`, `git`, `retry`, `repo-settings`, `credentials`. Wherever a macOS refusal reads `Operation not permitted`, the Linux one is expected to read `Read-only file system`. Each states its latest macOS verdict.
  - **`write-protection`:** as macOS, with `Read-only file system`. CS7's `Edit` refusal is expected to rest on `dontAsk` and the absence of an allow rule. Do not assume a deny rule (`docs/sandbox-verification.md` → §6 *Also observed*).
  - **`network`:**
    - N1, N2 and N5 as macOS;
    - N3 measured, not assumed. Baseline F8: the body came back;
    - N4 graded by comparison with the unsandboxed control. Baseline (run 3): session `curl: (7) … after 0 ms`, control `curl: (28) Connection timed out after 5006 milliseconds`, `pass`, no refusal string.
  - **`invalid-profile`:** (a) recorded and (b) graded, as macOS. Baseline: (a) the marker written (F7) and (b) `pass`.
  - **`headless-parity`:** when the container's terminal allows interactive sessions (`docker run -it`). Baseline: `pass`, 2026-10-28.
  - **`glob-deny`** (GW1, GW2): no macOS baseline, since no macOS row measures a glob-only path.
  - **`registry`** (RG1–RG3): baseline `pass`, 2026-10-20, by hand. RG3 tries to move the live registry's directory and is restored at once. Run it only in the throwaway container.
  - **`detached`** (BG9, WF5): baseline BG2 (survived its full 1524 s). BG9 takes BG2's shape only, not BG1–BG8. WF5 has no macOS result (WF2 is owed).
  - **`loopback`** (LB1–LB5): baseline F8. On macOS only the `127.0.0.1` form on the generated profile was measured.
  - **`refusal`** (RF1–RF3): no macOS baseline, since `bwrap` and `socat` are Linux packages.

  After the table, state that a Linux refusal string a leg did not recognise prints `not run` naming it. The person who ran the probe takes the strings from the first run's kept evidence, and adds them to `judge.sh`'s layer table in a follow-up.
- [ ] **The refusal subcommand, the hand rows and the record.** A paragraph opening `**The refusal subcommand and the hand rows.**`, with fenced steps.
  - **Remove one package as root** (`apt-get remove -y bubblewrap`), then, as `probe`, run `bash scripts/sandbox-probe.sh refusal` and then `echo "exit $?"`. Re-install, and repeat with `socat` removed.
  - **RF4, by hand, with `bwrap` absent:**
    1. drop a one-sentence throwaway task prompt into `<stateDir>/autonomous_inbox/`;
    2. run one watcher pass, `bash scripts/autonomous-watcher.sh tick`;
    3. record that the drop is archived as `failed_<ts>_<name>`, that the registry record is `failed`, that `watcher.log` carries `this machine cannot sandbox an unattended run`, and that no clone exists at the sibling path.
  - **DP1–DP7, by hand.** Record `doctor`'s and `doctor --remote-job`'s `sandbox-prerequisites` line, verbatim, under each state:
    - DP1: both packages present;
    - DP2: `bwrap` absent;
    - DP3: `socat` absent;
    - DP4: neither;
    - DP5: the AppArmor answer, with the sysctl's value as the stamp read it;
    - DP6: the `probe` user against root;
    - DP7: a taken `sandbox.optOut` in the container checkout's `harness.config.json`, removed again afterwards.
  - **Recording.** The stamp lines the probe prints, the `echo "exit $?"` line after every `run` and `refusal`, and the exact `docker run` line go into `docs/sandbox-verification.md` → §8 *The Linux legs (owed)*.
  - **PD19.** A fresh container's registry has no stale `pid`. If refusal 4 still fires, `jq '.runs' <stateDir>/autonomous_logs/registry.json` shows which record's `pid` answered.
- [ ] **`**The rows this probe does not take, named so the list is complete.**`** now says three things:
  - the local-container Linux legs are this gate's;
  - **the GitHub-hosted runner legs** stay owed under roadmap item 21 (§6), on `feat_sandbox_probe_job_mode`;
  - the full run on the real job stays owed on `chore_sandbox_gate12_full_run_leg`.

  The CS5, CS6 and CS8 sentences are unchanged.

**Verification:**

- The leg table's lines, with backticks removed and `, ` read as `,`, equal `bash scripts/sandbox-probe.sh --list`'s lines. Check by hand by diffing the two, the table's cells extracted with `sed`.
- `grep -n 'the Linux legs are owed under roadmap item 21' docs/development.md` finds nothing, and `grep -n 'feat_sandbox_probe_job_mode' docs/development.md` finds the rows-not-taken paragraph.
- Every command the recipe and the refusal paragraph give sits alone on its own line inside a fenced block (`harness-runs/lessons.md` → *Adopter-facing documentation*): `grep -nE '^[a-z].*; [a-z]' docs/development.md` finds no joined command inside Gate 15's fences.
- No sentence the task adds states a Linux result as measured: every Linux expectation is worded as expected, and every baseline names its date and run.

**Deviations from plan:**

- The `probe` block adds three lines the plan does not list: `git config --global user.name "<name>"` and `user.email "<email>"`, because the container has no commit identity and the wrappers legs commit; and a bare `claude` line to sign in before the `claude plugin` lines, where the credential paragraph says the maintainer signs in. The clone is spelled `git clone --branch dev https://github.com/firu-daniel/autonomous-sdlc-harness.git` (the `repository.url` in `cli/package.json`), so the in-memory token answers git's HTTPS prompt; the `credential.helper` line precedes it.
- The plan's `<stateDir>` is written as this repository's `harness-runs` in the RF4 drop path and the PD19 `jq` path, since Gate 15 is this repository's own gate.
- W6's baseline is 2026-10-28, run 3, not run 2: `docs/sandbox-verification.md` §0 *The probe's third run* lists W6 among the rows that passed again.
- Verification, leg table: the `sed` diff the plan names was refused at the permission layer (a compound command under `dontAsk`). It rests instead on `harness-runs/scratch/task11_leg_table_diff.mjs`, run through `bash scripts/scratch-run.sh`, which applies `cli/test/sandbox-probe-git-and-legs.test.mjs`'s own cell extraction to the table and compares it with `bash scripts/sandbox-probe.sh --list`: `doc rows 21, --list rows 21, differing 0`. That test file itself is deferred to the Run gates phase (it is in the suite `commands.test` runs, and this unit did not edit it).
- Verification, greps: `grep -n 'the Linux legs are owed under roadmap item 21' docs/development.md` printed nothing; `grep -n 'feat_sandbox_probe_job_mode'` found only the rows-not-taken paragraph; `grep -nE '^[a-z].*; [a-z]'` matched two prose lines in `## 5`'s opening, none inside Gate 15's fences.
</content>
</invoke>
