# Story: Refuse an unattended run on a machine that cannot sandbox it

## Context

`feat_unattended_bash_sandbox` turned the unattended profile's sandbox on with `failIfUnavailable: true` and added the named opt-out `sandbox.optOut` (`{ "reason": "<non-blank>" }`, decided in one place by `cli/src/config/model.ts` → `sandboxOptedOut`). Today an unsandboxable host is found out only after the watcher has launched the session, through Claude Code's own exit. This branch moves that answer ahead of the launch and makes it actionable. One CLI module owns the table of what the sandbox needs on each platform. `doctor` gains a `sandbox-prerequisites` check that reads the host through that table, and `doctor --remote-job` runs it on the runner. The run library mirrors the table and the opt-out for the shell side. The watcher refuses a fresh local launch on a host with a definite missing piece, unless the opt-out was taken. The `harness-run.yml` job installs `bubblewrap` and `socat`, and writes the `bwrap` AppArmor profile where one is needed, before its `doctor --remote-job` preflight. That preflight then refuses the job on whatever is still missing. The docs that point at roadmap item 20 are closed last.

**The prerequisite table, stated once here so every task reads it the same way.** The owner is `cli/src/doctor/sandboxPrerequisites.ts`, written by Task 1. Every value below is that module's, and the tasks after Task 1 import it or mirror it. They never retype it.

- **Host kinds**, from the platform and the kernel release string. `darwin` is `macos`: Seatbelt, nothing to install. Any other platform than `darwin` or `linux` is `unsupported`, a definite missing piece. On `linux`, a release matching `microsoft` case-insensitively is WSL. It is `wsl2` when the release also matches `microsoft-standard` or `wsl2` case-insensitively, else it is `wsl1`, a definite missing piece: the agent's message is "Sandboxing requires WSL2". Any other `linux` release is `linux`.
- **Binaries**, on `linux` and `wsl2` only, in this order: `bwrap` from the package `bubblewrap` (filesystem isolation), then `socat` from the package `socat` (relays network traffic to the sandbox proxy). A binary that does not resolve on the process's `PATH` is a definite missing piece. The install commands are `sudo apt-get install <packages>` (Ubuntu/Debian) and `sudo dnf install <packages>` (Fedora). Each names only the missing packages, in table order.
- **AppArmor**, on `linux` and `wsl2` only. It never refuses anything. The sysctl `kernel.apparmor_restrict_unprivileged_userns` is read from `/proc/sys/kernel/apparmor_restrict_unprivileged_userns`. Absent, or `0` once trimmed, is `clear`. `1` is `allowed` when `/etc/apparmor.d/bwrap` reads and grants `userns` to `/usr/bin/bwrap`. Every other state is `uncertain`: `1` with no such profile, an unreadable file, or any other value. A profile under another name may already grant `userns`, so the absence of this one is not proof. `uncertain` is reported, never as a pass, and the fix it names is that profile followed by `sudo systemctl reload apparmor`.
- **Missing-piece ids**, the wire every mirror agrees on, in this order: `bwrap`, `socat`, `wsl1`, `unsupported-platform`. A `wsl1` or `unsupported` host reports its one id and no binary ids.

**The opt-out rule the shell mirrors.** The opt-out is taken exactly when `sandbox.optOut.reason` is a string that holds more than whitespace, as JavaScript's `String.prototype.trim` defines whitespace. Every other state counts as **not opted out**, so the refusal stands: no `optOut`, a blank or non-string `reason`, a boolean `optOut`, or an unreadable or unparseable file. The shell reads the opt-out from the **main checkout's** `harness.config.json`, never from a run copy's, which the sandbox can rewrite.

**Where each refusal happens.** A fresh **local** launch is refused by the watcher (`process_inbox_file`), after the branch-owning-record rejections and before the machine lane. The refusal goes through `fail_before_launch`: the record becomes `failed`, the drop is archived as `failed_<ts>_<name>` and one `failed` notification is sent. Nothing retries it. A drop the watcher sends to GitHub (`execution.target` `github-actions`) is not judged by the local host. A **remote job** is refused by its existing `Preflight with doctor` step, under which `sandbox-prerequisites` fails on a definite missing piece. Resumes of parked or paused runs and job mode keep relying on `failIfUnavailable`. A refusal names the install fix and never offers the opt-out. Under a taken opt-out, nothing refuses: `sandbox-prerequisites` passes as not required, and `profile-sandbox` already warns about the opt-out.

**What this branch must not touch.** This repository's own `scripts/` copies, the root `scripts/autonomous-watcher.sh` and `scripts/lib/harness-run-lib.sh`, are `init`'s output and files that run outside the sandbox. A branch that changes them is refused by the watcher's surface check, so every shell change lands in `cli/templates/` only. The copies here are re-rendered by a supervised self-adopt run after merge (`Manual setup required` below). The guards, the deny floor, the `pre-push` hook and everything `feat_unattended_bash_sandbox` added stay as they are. The supervised profile is out of scope. Measuring what breaks under the sandbox is roadmap item 21.

**Top risks:** The first is drift between the three copies of the table: the TypeScript owner, the run library's mirror and the workflow's install step. Task 3's suite holds the shell mirror equal to the owner over an input matrix. Task 5's suite holds the install step's package list and profile text equal to the owner's exports. The second is a refusal that fires where it must not: a false opt-out reading that lets an unsandboxable run through, or an `uncertain` AppArmor answer that refuses a launch. Task 3's opt-out matrix covers the edge reasons, among them `"null"`, a non-breaking space, a byte-order mark and a boolean `optOut`. Task 1's matrix pins `uncertain` as never a missing piece. The third is host dependence in the suite: on a Linux host without `bubblewrap`/`socat`, the existing watcher suites would hit the new refusal and two `doctor --remote-job` exit-0 cases would read the new failure. Task 4 overrides the probe by default in the shared watcher test helper, and Task 2 makes the two `doctor.test.mjs` cases host-aware.

**Manual setup required:**

- After merge, re-render this repository's self-adopted outer-loop scripts with a supervised forced self-adopt run. That covers `scripts/autonomous-watcher.sh` and `scripts/lib/harness-run-lib.sh`, so this checkout's own watcher carries the refusal. Commit them as `#136` did. No run can edit them (Tasks 3 and 4).
- To check it on GitHub, release a version from a `dev` carrying this branch through `bash scripts/release.sh <version>` (`docs/development.md` → `## 7. Releasing`). Re-render the target repository's workflows with `npx autonomous-sdlc-harness@<version> init --upgrade-workflows`, then commit and push every path its report prints to that repository's default branch. The first real run of the install step is a post-release follow-up, and roadmap item 21's full-run leg runs it (Tasks 5 and 7).
- Optional, if a Linux host or container without `bubblewrap`/`socat` is available: run `npx autonomous-sdlc-harness doctor --remote-job` there and confirm that `sandbox-prerequisites` fails naming both packages (Task 2).

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom, and the committer flips each one to `[x]` as that task's commit lands. **Only the committing role flips a marker.** That is the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. An implementer never changes a marker here, and never edits any other line of this section, in an index a run is iterating. `[ ]` markers anywhere else, such as sub-step bullets inside the per-task files, are informational progress markers for the implementer. They are never the iteration source, and the committer does not touch them.

Each entry resolves 1:1 to a self-contained `harness-runs/task_plans/feat_unattended_sandbox_preflight/task_<K>_plan.md` file. The entries are ordered bottom-up by ship sequence in the configured layer order, with the catch-all layer last.

1. [x] **Task 1** — Declare the sandbox prerequisite table in `cli/src/doctor/sandboxPrerequisites.ts` _(layer: cli)_ _(points: 15)_
2. [ ] **Task 2** — Add `doctor`'s `sandbox-prerequisites` check and its live host probe _(layer: cli)_ _(points: 20)_
3. [ ] **Task 3** — Mirror the prerequisite table and `sandboxOptedOut` in the run library _(layer: cli)_ _(points: 20)_
4. [ ] **Task 4** — Refuse a fresh local launch on a host that cannot sandbox it _(layer: cli)_ _(points: 15)_
5. [ ] **Task 5** — Install the sandbox prerequisites in the `harness-run.yml` job before its preflight _(layer: cli)_ _(points: 15)_
6. [ ] **Task 6** — Describe the check, the refusal and the opt-out's exemption in `docs/cli.md`, `docs/config.md` and `docs/watcher.md` _(layer: general)_ _(points: 15)_
7. [ ] **Task 7** — Close roadmap item 20 in `docs/remote-execution.md`, `docs/development.md` and `ROADMAP.md` _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"**Close roadmap item 20 in the docs that point at it.** `docs/cli.md` §6 → "**What a host needs.**", `docs/remote-execution.md` §8's runner paragraph, every other "roadmap item 20" reference (search for it), `ROADMAP.md`'s "`doctor` sandbox checks" row, and `doctor`'s rows in `docs/cli.md` §7 describe the check, the refusal and the install step as they now are."*

**Derivation entry C1 — prerequisite and item-20 prose (command).** Re-run verbatim from the checkout root: `git grep -n -i -E 'roadmap item 20|bubblewrap|socat|WSL1|failIfUnavailable|sandbox-prerequisites' -- docs README.md ARCHITECTURE.md ROADMAP.md cli/README.md cli/templates plugin examples/notes-app/README.md ':!cli/templates/scripts' ':!cli/templates/github'`. The shell and workflow templates are excluded because they are source whose comments are code-level docs. Their edits are owned by Tasks 3, 4 and 5 and are not register sites.

**Derivation entry C2 — the item's own row and the shipped paragraph (command).** `git grep -n -E '^\| 20 \||Items 3, 4, 13 and 14 have shipped|sandbox checks' -- docs/development.md ROADMAP.md`

**Derivation entry C3 — prose stating which checks `--remote-job` moves, or what the job's preflight stops on (command).** `git grep -n -E 'fail where|into failures|doctor --remote-job.{0,20}as a preflight' -- docs README.md cli/README.md`

**Derivation entry C4 — `doctor`'s check table, where the new row goes (command).** `git grep -n -E '^\| .(profile-sandbox|profile-write-protection). \|' -- docs/cli.md`

**Derivation entry C5 — the watcher's guard order (command).** `git grep -n -E 'The guards, in one order' -- docs README.md`

**Derivation entry P1 — standing-artifact rows (procedure).** **First step, runnable:** `grep -nE '^## |^- ' harness-runs/lessons.md`. **Artifact:** that standing ledger. **Traversal:** its topic headings in file order, then the one-line rules under each, in order. **Decision rule:** a rule is reached when it governs a kind of change this plan makes: a command an adopter runs, written in a doc, or an unattended refusal or retry.

**Closure invariant:** every site each derivation entry reaches appears as a row below. A site two entries reach is one row whose evidence names both.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `ROADMAP.md` → the "OS-level sandbox in the autonomous profile" row | — | C1, `bubblewrap` | `no-change` | It describes the sandbox block the previous branch shipped. Host prerequisites are the next row's subject |
| 2 | `ROADMAP.md` → the "`doctor` sandbox checks" row | — | C1, `bubblewrap`; C2, `sandbox checks` | `change` | Task 7 |
| 3 | `cli/templates/claude/settings.autonomous.json` → the `_README` line "THE SANDBOX IS STRICT" | — | C1, `failIfUnavailable` | `no-change` | What it says about `failIfUnavailable` is still true. The new refusal lives in the watcher and `doctor`, not in the profile, and everything that branch added stays |
| 4 | `cli/templates/claude/settings.autonomous.json` → the `_README` line "THE NETWORK-CLIENT DENIES ARE A SECOND LAYER" | — | C1, `socat` | `no-change` | It names `socat` as a denied network client, not as a host prerequisite |
| 5 | `cli/templates/claude/settings.autonomous.json` → the deny entry `Bash(socat:*)` | — | C1, `socat` | `no-change` | That deny-floor entry stays (a constraint). The sandbox runtime starts `socat` itself, never through the Bash tool |
| 6 | `cli/templates/claude/settings.autonomous.json` → `"failIfUnavailable": true` | — | C1, `failIfUnavailable` | `no-change` | It stays as the backstop for every answer the refusal leaves to it |
| 7 | `docs/cli.md` §6 → the paragraph "The unattended profile runs every Bash command…" | — | C1, `failIfUnavailable` | `no-change` | Its statement of `failIfUnavailable` stays true. The host paragraph after it carries the change |
| 8 | `docs/cli.md` §6 → "**What a host needs.**" | — | C1, `bubblewrap`, `roadmap item 20` | `change` | Task 6 |
| 9 | `docs/cli.md` §6 → the per-run profile paragraph "It lives at `${XDG_STATE_HOME…`" (**The launch check**) | — | C1, `failIfUnavailable` | `no-change` | It describes `run_profile_check`, which this branch does not change. The host check is a separate guard, described in rows 8 and 30 |
| 10 | `docs/cli.md` §7 → the `profile-sandbox` grading bullet ("refusing to launch an unsandboxed run is roadmap item 20") | — | C1, `roadmap item 20` | `change` | Task 6 |
| 11 | `docs/config.md` §5 → the `sandbox.optOut` row | — | C1, `failIfUnavailable`, `WSL1` | `change` | Task 6. A taken opt-out now also exempts the host from the refusal and from `sandbox-prerequisites` |
| 12 | `docs/remote-execution.md` §8 → "**GitHub-hosted runners that work:**" | — | C1, `bubblewrap`, `roadmap item 20` | `change` | Task 7 |
| 13 | `docs/sandbox-verification.md` → the bullet "`enabled` and `failIfUnavailable` are `true`" | — | C1, `failIfUnavailable` | `no-change` | A measured record of the profile's shape, still true |
| 14 | `docs/sandbox-verification.md` → row `CS8` | — | C1, `failIfUnavailable` | `no-change` | A measured record. It is edited only by a re-measurement |
| 15 | `docs/sandbox-verification.md` → row `TD4` | — | C1, `bubblewrap` | `no-change` | A Linux measurement not yet run, which is roadmap item 21's |
| 16 | `docs/sandbox-verification.md` → the bullet "**How the Linux sandbox treats a `denyWrite` entry containing `*`:**" | — | C1, `bubblewrap` | `no-change` | Linux measurement, which is roadmap item 21's |
| 17 | `docs/sandbox-verification.md` → the bullet "An empty `--settings` file starts a session with **no sandbox and no error**" | — | C1, `failIfUnavailable` | `no-change` | It records that the empty-profile follow-up moved to the watcher's launch check, which stays true. It is not this branch's prerequisite refusal |
| 18 | `docs/watcher.md` §2 → **The launch check** bullet "the sandbox is on and strict" | — | C1, `failIfUnavailable` | `no-change` | It describes `run_profile_check`, which is unchanged. The host check goes into row 30's guard order |
| 19 | `plugin/hooks/allow-qa-credentials-read.sh` → the never-safe client list carrying `socat` | — | C1, `socat` | `no-change` | That is a guard's network-client refusal, unrelated to host prerequisites |
| 20 | `ROADMAP.md` → index row `\| 20 \| [Cross-repo tasks]…` | — | C2, `^\| 20 \|` | `no-change` | This is ROADMAP's own priority 20, not `docs/development.md`'s item 20 |
| 21 | `ROADMAP.md` → index row `\| 38 \| [`doctor` sandbox checks]…` | — | C2, `sandbox checks` | `no-change` | The index names the feature and links to its row. Status lives in row 2's table row |
| 22 | `docs/development.md` §6 → the row `\| 20 \|` | — | C2, `^\| 20 \|` | `change` | Task 7 |
| 23 | `docs/development.md` §6 → the paragraph "**Items 3, 4, 13 and 14 have shipped**" | — | C2 | `change` | Task 7 |
| 24 | `docs/cli.md` §7 → the opening paragraph "Checks a wired repository…" ("turns five checks' warnings into failures") | — | C3, `into failures` | `change` | Task 6 |
| 25 | `docs/cli.md` §7 → the `profile-main-anchor` grading bullet ("a warning, and never a failure") | — | C3, `into failures` | `no-change` | It is about `profile-main-anchor` alone, which this branch does not change |
| 26 | `docs/cli.md` §7 → the paragraph "**`--remote-job`** grades the permission profile…" | — | C3, `fail where` | `change` | Task 6 |
| 27 | `docs/remote-execution.md` §1 → step 4 "**The job's setup**" | — | C3, `doctor --remote-job` as a preflight | `change` | Task 7 |
| 28 | `docs/cli.md` §7 → the check table row `profile-sandbox` | — | C4 | `no-change` | The row stays as it is |
| 29 | `docs/cli.md` §7 → the check table row `profile-write-protection` | — | C4 | `change` | Task 6. The new `sandbox-prerequisites` row is inserted directly after it, in `CHECKS` order |
| 30 | `docs/watcher.md` §1 → step 3 "**The guards, in one order.**" | — | C5 | `change` | Task 6 |
| 31 | `harness-runs/lessons.md` → *"Every command an adopter is meant to run sits in a fenced block, one command per line"* | — | P1, governs the commands rows 8 and 12 add | `no-change` | It is applied, not edited: Tasks 6 and 7 put every install and reload command in its own fenced block |
| 32 | `harness-runs/lessons.md` → *"Every automatic retry in an unattended path is bounded by a count or a deadline"* | — | P1, governs the refusal | `no-change` | It is applied, not edited: Task 4's refusal archives the drop as failed and sends one notification. It never defers and never retries |
| 33 | `docs/remote-execution.md` §4 → the paragraph "**The permission profile.**" (the sentence "`doctor --remote-job` then runs as a preflight…") | — | C3, `fail where`, `doctor --remote-job` … as a preflight | `change` | Task 7. The preflight now also stops the job on a host that cannot start the sandbox, and `sandbox-prerequisites` is a further check that fails under `--remote-job` |
