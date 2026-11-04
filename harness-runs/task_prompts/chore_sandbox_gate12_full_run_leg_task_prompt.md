`chore_sandbox_gate12_full_run_leg` writes the **full-run leg** into the hand-run gates: one task run end to end through `harness-run.yml` on the Gate 12 repository, after a release, and what that run must show about the sandbox. It also folds in the remote and after-the-release checks the sandbox series still owes, in one ordered Gate 12 round, so one release and one reset take them all. It does not take the measurements.

This is the third of three branches that split the former sandbox3b:

- **sandbox3b1** (`feat_sandbox_probe_linux_legs`, #166): the Linux legs in a local container.
- **sandbox3b2** (`feat_sandbox_probe_job_mode`, #194): the clone-less probe mode and the GitHub-hosted runner legs.
- **sandbox3b3** (this one).

It starts from a `dev` that carries sandbox3b1 and sandbox3b2. Read what sandbox3b2 shipped first: its clone-less mode, its runner workflow, and the stable heading it named for the runner's results in `docs/sandbox-verification.md`.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.**

## Why it needs a release

A `harness-run.yml` job clones the marketplace repository at the release tag `autonomous-sdlc-harness--v<version>`, where `<version>` is the workflow's `HARNESS_CLI_VERSION` (the `Install the pinned plugin` step), and runs `init` and `doctor` as `npx --yes "autonomous-sdlc-harness@$HARNESS_CLI_VERSION"` from npm (`docs/remote-execution.md` → `### Upgrading`). The last release, 0.6.7, predates the whole sandbox series. So the round needs a release cut from a `dev` that carries the series, through `bash scripts/release.sh <version>` (`docs/development.md` → `## 7. Releasing`). #170 step 4 orders it.

## The goal

1. **The full-run leg**, in the gate. One task run end to end through `harness-run.yml` on the Gate 12 repository. The gate lists what it shows, each with its expected result and where it is read from:
   - the job cuts no copy, renders no per-run copy, writes nothing under the machine state directory, and `run_profile_check` passes on the base profile, which is passed unchanged as `--settings`;
   - `Install the sandbox prerequisites` runs on the hosted runner: what it installs, and that the preflight then passes;
   - every commit and push goes through the wrappers, and no sandboxed git write is refused in a way that stops the run;
   - the `permission_denials` of the calls the flow needs, quoted, so a call the profile refuses is seen in a real run and not only in a probe leg.
2. **The owed checks, folded into the same round.** They live in the maintainer's private checks files, which this run cannot read, so they are listed below in full. The gate names each by its source file and section (for the maintainer to open) and carries the one-line expectation given here.
3. **The runner legs from sandbox3b2**, placed in the round's order below.
4. **Rows.** Each check the round makes gets a row in `docs/sandbox-verification.md`, in the runner section sandbox3b2 named or beside it, marked *not yet measured*. Checks that are not sandbox rows (the `init` and `restart-watcher.sh` ones) get their rows where their own documents of record keep them, as listed per check below, also *not yet measured*.

The round is scoped to the sandbox series. Gate 12's other observations, the issue trigger (xiii) and run control from GitHub (xiv) among them, are not part of it; the gate says so, as earlier rounds stated their own scope.

## The owed checks

**`sandbox1c` — the job-surface refusal** (record: `docs/remote-execution.md` → `## 11. Security` → **The branch's own files are checked before the job trusts them.**, the "post-release follow-up, not yet run" bullet).
- §1: a run branch that commits `.claude/settings.json`, and separately `<scriptsDir>/remote-run.sh`, through plumbing (`hash-object` / `update-index` / `commit-tree` / `update-ref`) and pushes it is refused at `Refuse a branch that changed the job's own files`: job `failure`, an `::error::` naming each path, no bundle saved, no notification, nothing chained, `remote-run.sh sync` records `paused` with `pause_reason: killed` (if an older bundle exists) else `failed`; no later step runs a script from the branch's tree.
- §2: an honest branch passes that step; `Record the default branch's commit` writes `HARNESS_GITHUB_DEFAULT_COMMIT` and `HARNESS_DEFAULT_BRANCH_COMMIT`. **Taken by the full-run leg.**
- §3: with the GitHub default branch ≠ the configured `defaultBranch`, a stalled honest job (lowered `STALL_WARN_SECS` / `STALL_KILL_SECS`) has its watchdog run `doctor --job-surfaces=<branch>@…@…` from a temporary directory, pass, reset and resume from the ledger, not `failed`. Negative arm: with a job surface committed by the session before the stall, the reset is refused and the run ends `failed` with a notification naming the path.
- §4: a branch carrying a committed `.npmrc` with `node-options=--require=<marker>`, and separately a `node_modules/autonomous-sdlc-harness` whose bin writes a marker: no marker from the refusal step, `Install the claude CLI when absent`, `Generate the job's permission profile` or `Preflight with doctor`. `Bootstrap the checkout`'s own install and build reading them is the known residual (`docs/cli.md` §6, residual 1), not a failure.

**`sandbox1c2` — the state bundle and symbolic links** (record: the same section → **The post-session steps on a job that passed.**; `docs/cli.md` §6 residual 1, item 5).
- §1: an honest job's bundle prints `saved the bundle of <branch>`, no `skipped` line, the same layout and bytes as its sources; the next job logs `restored the bundle of run <id>` and `placed <n> planning file(s)`. **Taken by the full-run leg**, whose first job parks (below).
- §2: `PAUSE_PROGRESS.md` replaced by a link to a token file outside the state directory, plus a second link inside `clarifications/<branch>/`: one `skipped <path>: <linked> is a symbolic link` line each, the artifact holds no link (`find -type l`) and no token (`grep -r`), the step ends `success`, and the next job restores the rest. Variant: `autonomous_logs/remote_status.json` linked → `remote-run.sh: save: skipped …`, and the artifact's `status.json` is the registry-derived one (decision `stop`).
- §3: the session's *uncommitted* rewrite of `stateDir` in `harness.config.json` is not followed: the `trusted configuration at <commit> names '<trusted>'; using '<trusted>'` line, `<commit>` equal to `HARNESS_GITHUB_DEFAULT_COMMIT`, no token in the artifact.
- §4: no link and no token in §2's artifact. Optional: a throwaway workflow on the same runner image uploads a directory holding a link with the pinned `actions/upload-artifact` and records whether the artifact holds the bytes, a link or neither; and whether a background process the session started (`sleep 600 &`, its pid in a file) is still alive when `Save the state bundle` runs.

**`sandbox1e4` §10 — a real `run` job** (record: `docs/remote-execution.md`'s Gate 12 rows, as a new round in `docs/development.md`).
- Item 1 is the full-run leg itself.
- Item 2: a branch whose profile fails the check (e.g. `sandbox.enabled: false`, no opt-out marker) launches nothing; the job records `failed` with the `not launching` reason.
- Item 3, **local, from a mirror of the Gate 12 repository**: `remote-run.sh start <branch>`, then `review` on a run past review, each cuts a clone at `hr_worktree_dir`, pushes, dispatches and removes the clone, the branch it DWIM-created, the registry record it wrote and a registry directory it made; a pre-existing record is restored byte for byte; `ls <work_root>` shows no new copy.

**`sandbox2` — the install step** (record: `docs/remote-execution.md`, the **The step has not yet run on GitHub.** paragraph). **Taken by the full-run leg.**

**`sandbox2d` §7 — an answered park, remote.** A parked run answered through `/autonomous-sdlc-harness:branch-answer`'s GitHub route resumes in answer mode; if the round's `test_run_logs/…log` is not in the restored bundle, the architecture gate still passes on the index's quoted failure lines rather than returning a blocker. **Taken by the full-run leg**, whose park is answered this way.

**`sandbox1h` §1–§3 — after-the-release adopter checks**, run **locally in the Gate 12 repository's checkout**, not in a job (record: `docs/development.md` → **Regenerating this repository's adoption after a `cli/templates/` change**; `docs/outer-loop-verification.md` §1.5; `docs/cli.md` §3 and §5).
- §2, the hidden-`.bak` note: on a repository initialised by **0.6.7** with at least one changed `README.md` under a contents-ignored state-dir directory (`autonomous_inbox/`, `autonomous_logs/`, `clarifications/` or `scratch/`), `init --force` at `<version>` names each hidden `README.md.bak` in `== notes` with `docs/cli.md` §3's wording; `git status --short` does not list them, `--ignored` does. The `--quiet` row: after restoring the older README, the same run with `--quiet` prints no hidden-`.bak` line but still writes the `.bak` files (decided, not a defect). Also: a fresh `init` writes the managed `.gitignore` block's comment with the two new exception lines.
- §1, an adopter's forced run is unchanged: `init --force` at `<version>` with `HARNESS_SELF_ADOPT` unset shows no `kept by this self-adopt run` row in `== commands`, re-renders both wrappers from detection, and every state-dir README that already matches its template shows `= kept` with no `.bak`.
- §3: with the repository's daemon installed and idle, `HARNESS_CLI="npx autonomous-sdlc-harness@<version>" bash <scriptsDir>/restart-watcher.sh` exits 0 on macOS, with `daemon stop` / `daemon install` naming the repository's own label. The Linux arm needs a systemd host (exit 0, the `systemctl --user` lines printed, nothing restarted); the gate marks it *not run* where no such host is available.

## The round's order

The gate lays the round out in this order, because the steps depend on it:

1. **Release** `<version>` from a `dev` carrying sandbox3b1, sandbox3b2 and this branch.
2. **Reset** `firu-daniel/harness-gate12` to its seed.
3. **Adopt at 0.6.7 first**, then change one README under a contents-ignored state-dir directory. This is the old adoption `sandbox1h` §2 needs; re-adopting straight at `<version>` would skip it.
4. **Upgrade locally**: `init --force` at `<version>` → `sandbox1h` §2 (note, `git status`, then the `--quiet` row), then `sandbox1h` §1 on the now-current adoption. Then `init --upgrade-workflows`, and commit and push every path its report prints (`docs/remote-execution.md` → `### Upgrading`, with the gate's own setup for the push and the `workflow` scope).
5. **The runner legs from sandbox3b2**.
6. **The full-run leg** on an honest branch: one task, through `harness-run.yml`, whose first job parks on a question, answered through `branch-answer`'s GitHub route, and which then runs to "branch ready for review". It takes the goal-1 list, `sandbox1e4` §10 item 1, the `sandbox2` install step, `sandbox1c` §2, `sandbox1c2` §1 and `sandbox2d` §7.
7. **The adversarial legs**, each on its own throwaway branch: `sandbox1c` §1 and §4, `sandbox1c2` §2–§4, `sandbox1e4` §10 item 2.
8. **The default-branch leg**: set the repository's GitHub default branch to differ from its configured `defaultBranch`, take `sandbox1c` §3 (both arms), then set it back. Last of the job legs, so it disturbs none of the others.
9. **The local legs**: `sandbox1e4` §10 item 3 from a mirror, and `sandbox1h` §3 with the daemon installed and idle.
10. **Clean-up**: GitHub default branch confirmed restored, throwaway branches deleted, the repository reset to its seed. Never deleted.

## Constraints

- **No measured result is invented.**
- **Nothing runs in this repository**, which cannot host its own remote runs (`docs/development.md` → **This repository cannot host its own remote runs.**).
- **The Gate 12 repository is reset to its seed afterwards and never deleted.**
- **No profile, generator, wrapper, guard, watcher or `harness-run.yml` behaviour changes.** A defect becomes a follow-up task prompt.
- `scripts/run-gates.sh` passes.

