# Story: Gate 12's full-run leg and the sandbox series round

## Context

This branch writes the **full-run leg** into the hand-run gates, and folds the sandbox series' remote and after-the-release checks into one ordered Gate 12 round, so one release and one reset of `firu-daniel/harness-gate12` take them all. It changes documents of record only. It runs nothing, measures nothing and records no result: every row it adds reads *not yet measured*. The task prompt is `harness-runs/task_prompts/chore_sandbox_gate12_full_run_leg_task_prompt.md`. Its sections `## The goal`, `## The owed checks`, `## The round's order` and `## Constraints` are the source each task copies its expectations from, word for word where a one-line expectation is given. Anchors in that prompt are found by quoted text or heading, never by line number.

All four tasks are `general`-layer documentation edits under `docs/`. No file under `cli/`, `plugin/`, `scripts/`, `schemas/` or `.claude/` is touched. The prompt's constraint *"No profile, generator, wrapper, guard, watcher or `harness-run.yml` behaviour changes"* binds every task. A defect an implementer notices while reading the shipped sources is **not** fixed here. It is named in that unit's return as a candidate follow-up task prompt. Each task owns its files outright, and no file is edited by two tasks. The ship order is: the measurement rows first, then the gate that cites them, then the two record documents that point at both.

**Shared anchors.** These strings are fixed here so that every task spells them the same way. A task citing one that a later task creates writes it byte-identical to this list:

- The Gate 12 observation for the full-run leg, in `docs/development.md` → `## 5. Verifying a change` → **Gate 12**, opens with the bold lead **`(xvi) The full-run leg: one task through `harness-run.yml`, end to end.`** (Task 2).
- The round's block, in the same gate, opens with the bold lead **`The sandbox series round (#170 step 4) — not yet run.`** It numbers its steps 1–10 in the prompt's `## The round's order` order (Task 2).
- The new section of `docs/sandbox-verification.md` is **`## 10. The full-run leg and the Gate 12 sandbox round`**, placed directly after `## 9. The GitHub-hosted runner legs`. §9 keeps its heading byte for byte, because sandbox3b2 named it stable (Task 1).
- The row ids in that §10 are:
  - **FR1–FR4**: the four bullets of the prompt's goal 1, in order. FR1 is also `sandbox1e4` §10 item 1, and FR2 is `sandbox2`.
  - **FR5**: `sandbox1c` §2.
  - **FR6**: `sandbox1c2` §1.
  - **FR7**: `sandbox2d` §7.
  - **JS1, JS3, JS3N, JS4**: `sandbox1c` §1, §3's positive arm, §3's negative arm, and §4.
  - **SB2, SB3, SB4**: `sandbox1c2` §2 (its variant inside the row), §3 and §4 (its optional half inside the row).
  - **RJ2, RJ3**: `sandbox1e4` §10 items 2 and 3.

  No id in that set is used in the file today. The runner legs keep their existing §9 rows and gain none.
- The **Read from** of each FR row. Task 1 writes these into §10's rows, and Task 2's observation (xvi) restates them byte for byte for the same ids. Step names are `cli/templates/github/workflows/harness-run.yml`'s; `run_profile_check` and the `not launching` lines are `cli/templates/scripts/autonomous-watcher.sh`'s:
  - **FR1**: observation (xvi): the `Run the harness` step log, whose watcher launch line carries `--settings`, with `run_profile_check` passing and no `not launching` line.
  - **FR2**: observation (xvi): the `Install the sandbox prerequisites` and `Preflight with doctor` step logs.
  - **FR3**: observation (xvi): the `Run the harness` and `Push the branch` step logs.
  - **FR4**: observation (xvi): the committed `<stateDir>/run_analytics/<branch>/run-analytics.json`, whose per-call records carry `permission_denied`, beside the `Run the harness` step log. No shipped surface carries the denied call's input off the runner (`docs/cli.md` §6, residual 1, item 5).
  - **FR5**: observation (xvi): the `Refuse a branch that changed the job's own files` and `Record the default branch's commit` step logs.
  - **FR6**: observation (xvi): the first job's `Save the state bundle` step log and the next job's `Restore the previous job's state` step log.
  - **FR7**: observation (xvi): the resumed job's `Run the harness` step log and the committed index.
- The `sandbox1h` rows are not sandbox rows, so they live where their documents of record keep them: `docs/development.md`'s **Regenerating this repository's adoption after a `cli/templates/` change** block (Task 2), `docs/cli.md` §3 and §5 (Task 4), and `docs/outer-loop-verification.md` §1.5 (Task 4). Each one is marked *not yet measured* and cites the round's step 4 or step 9.

**Cross-cutting rules, stated once.**

- **No measured result is invented.** Every Observed or Verdict cell this branch writes reads *not yet measured*.
- **No line number appears in any citation.** Cite a heading, a bold lead or a quoted substring.
- **Every command the gate hands the maintainer sits in a fenced block, one command per line**, and nothing is pasted inline in prose (`harness-runs/lessons.md` → *Adopter-facing documentation*).
- **An artifact the round reads from expires.** `harness-state` is kept as long as the repository's artifact-retention setting allows: `cli/templates/github/workflows/harness-run.yml` sets `retention-days: 400`, which GitHub caps at the repository's own maximum (its `WHY retention-days IS SET.` comment). On the Gate 12 repository that came to 90 days in Gate 12 round 2, an observation of that repository, not a figure the template sets. `sandbox-probe-evidence` is kept 3 days (`retention-days: 3` in `scripts/sandbox-probe-runner.yml`). An artifact found expired is recorded as expired and the step re-run. Expiry never counts as an absence or a pass (`harness-runs/lessons.md` → *Unattended control loops*).
- **A defect a leg finds is recorded and becomes a follow-up task prompt.** The gate proposes nothing as pending work (`harness-runs/lessons.md` → *Evidence and measurement*).
- **No committed file may spell a location on the machine that wrote it.** That includes the Gate 15 container user's home. Write `<home>`, `~/…` or a placeholder.

**Top risks:**
- **The full-run leg cites a surface that does not show what the leg claims.** The worst case is goal 1's *"the `permission_denials` … quoted"*. The raw `<stateDir>/autonomous_logs/<branch>.stream.jsonl` stays on the runner and is not among the state bundle's sources (`docs/cli.md` §6, residual 1, item 5). The committed `run_analytics/<branch>/run-analytics.json` carries one record per call, with `permission_denied`, the tool and the context, but not the call's input. Task 2 guards this. It cites the shipped source behind every "read from" it writes, and states plainly that no shipped surface carries the denied call's input off the runner.
- **A row or pointer quietly turns *not yet measured* into a claim.** Each task's verification greps its own new rows for the phrase.
- **The ten-step order loses a dependency.** Examples are the 0.6.7 adoption before the `<version>` upgrade, and the default-branch leg last among the job legs. Task 2 copies the prompt's `## The round's order` step for step, with each step's reason.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom.

- **Only the committing role flips a marker** to `[x]`, as each task's commit lands. That is the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none.
- **No implementer changes a marker here, or edits any other line of this section**, in an index a run is iterating.
- **`[ ]` markers anywhere else are informational only.** Sub-step bullets inside the per-task files are progress markers for the implementer. They are never the iteration source, and the committer does not touch them.

Each entry below resolves 1:1 to `harness-runs/task_plans/chore_sandbox_gate12_full_run_leg/task_<K>_plan.md`.

1. [x] **Task 1** — Add `docs/sandbox-verification.md` §10, the full-run leg's and the round's rows, all *not yet measured* _(layer: general)_ _(points: 20)_
2. [x] **Task 2** — Write Gate 12 observation (xvi), the full-run leg, and the sandbox series round into `docs/development.md` _(layer: general)_ _(points: 20)_
3. [ ] **Task 3** — Point `docs/remote-execution.md`'s unmeasured records at the round and add its Gate 12 rows _(layer: general)_ _(points: 15)_
4. [ ] **Task 4** — Record the `sandbox1h` checks as *not yet measured* in `docs/cli.md` and `docs/outer-loop-verification.md` _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt:

> *"`chore_sandbox_gate12_full_run_leg` writes the **full-run leg** into the hand-run gates: one task run end to end through `harness-run.yml` on the Gate 12 repository, after a release, and what that run must show about the sandbox. It also folds in the remote and after-the-release checks the sandbox series still owes, in one ordered Gate 12 round, so one release and one reset take them all."*

> *"Each check the round makes gets a row in `docs/sandbox-verification.md`, in the runner section sandbox3b2 named or beside it, marked *not yet measured*. Checks that are not sandbox rows (the `init` and `restart-watcher.sh` ones) get their rows where their own documents of record keep them, as listed per check below, also *not yet measured*."*

**Derivation entry — corpus sites (command).** Re-run it verbatim from the checkout root:

```
git grep -o -E "post-release follow-up, not yet run|The step has not yet run on GitHub|not yet run on GitHub|the check on a real job follows the first release|full run on the real job|chore_sandbox_gate12_full_run_leg|full-run leg|follows a link it meets is not measured|Fourteen observations|An adopter's .--force. still re-renders|were written inside directories the managed .gitignore block ignores|is named in the run's notes|Every repository already has one|Where a wrapper's body comes from|^### 1\.5 .restart-watcher\.sh.|^## 6\. What is not verified here|^## 9\. The GitHub-hosted runner legs|§9 holds the rows" -- docs ROADMAP.md README.md ARCHITECTURE.md
```

**Derivation entry — the prompt's records (procedure).**
- **Artifact:** the task prompt `harness-runs/task_prompts/chore_sandbox_gate12_full_run_leg_task_prompt.md`.
- **Traversal:** the bold check leads of `## The owed checks`, in file order (`sandbox1c`, `sandbox1c2`, `sandbox1e4` §10, `sandbox2`, `sandbox2d` §7, `sandbox1h`). Under each one, first its `record:` parenthesis, then any record its bullets name. Then goal 4 of `## The goal`.
- **Decision rule:** every document-and-section a record or goal 4 names is a candidate site. A check whose lead names no record (`sandbox2d` §7) reaches the `docs/sandbox-verification.md` section goal 4 names.

**Closure invariant:** every site either entry reaches appears as a row below. Rows 20–22 are the new sites this branch creates, which neither entry can reach before they exist; row 23 is a reached site added in revision round 0.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `ROADMAP.md` → the `` `doctor` sandbox checks `` row ("the remote job's step that installs the prerequisites before its preflight (not yet run on GitHub)") | — | command, `not yet run on GitHub` | `no-change` | Still true after this branch, which runs nothing. The roadmap row names state, not where the leg is written |
| 2 | `docs/cli.md` → `## 3. The re-run contract`, the `<stateDir>/README.md` row ("is named in the run's notes") | — | command; procedure, `sandbox1h` record `docs/cli.md` §3 | `change` | Task 4 |
| 3 | `docs/cli.md` → `## 3. The re-run contract`, the `.gitignore` row ("Every repository already has one.") | — | command; procedure, `sandbox1h` §2's fresh-`init` comment | `change` | Task 4 |
| 4 | `docs/cli.md` → `## 5. The wrapper-script contract`, **Where a wrapper's body comes from** | — | command; procedure, `sandbox1h` record `docs/cli.md` §5 | `change` | Task 4 |
| 5 | `docs/cli.md` → `## 6.` → residual 1, item 5 ("Whether `actions/upload-artifact` follows a link it meets is not measured") | — | command; procedure, `sandbox1c2` record | `change` | Task 4 |
| 6 | `docs/development.md` → **Regenerating this repository's adoption after a `cli/templates/` change** → **The two wrappers keep their hand-set lines.** ("An adopter's `--force` still re-renders both wrappers from detection") | — | command; procedure, `sandbox1h` record | `change` | Task 2 |
| 7 | `docs/development.md` → the same block → **The `.bak` files are removed by hand once the review is done.** ("were written inside directories the managed .gitignore block ignores …") | — | command; procedure, `sandbox1h` §2 | `change` | Task 2 |
| 8 | `docs/development.md` → **Gate 12** opening paragraph ("Fourteen observations, after a setup that is itself the first.") | — | command | `change` | Task 2. The count is already stale against (i)–(xv), and (xvi) is added |
| 9 | `docs/development.md` → **Gate 15** → **The GitHub-hosted runner legs, in the Gate 12 repository.** ("from a `dev` carrying `feat_sandbox_probe_job_mode` and `chore_sandbox_gate12_full_run_leg` (#195), in that step's one Gate 12 round") | — | command, `chore_sandbox_gate12_full_run_leg` | `change` | Task 2 |
| 10 | `docs/development.md` → **Gate 15** → **The rows this probe does not take, named so the list is complete.** ("the full run on the real job stays owed on `chore_sandbox_gate12_full_run_leg`") | — | command, `full run on the real job` | `change` | Task 2 |
| 11 | `docs/development.md` → `## 6. The roadmap this tree defers to`, row 20 ("the install step **has not yet run on GitHub**, and its first real run is item 21's full-run leg") | — | command, `not yet run on GitHub`, `full-run leg` | `no-change` | Still true, because nothing is measured. Row 21 still owns the leg, and the gate sits beside it in §5, not in the legend |
| 12 | `docs/outer-loop-verification.md` → `### 1.5 `restart-watcher.sh`` | — | command; procedure, `sandbox1h` §3 record | `change` | Task 4 |
| 13 | `docs/remote-execution.md` → `## 6. What is not verified here`, the behaviour table (the "Gate 12 rows") | — | command; procedure, `sandbox1e4` §10 record | `change` | Task 3 |
| 14 | `docs/remote-execution.md` → `## 8. Choosing a runner` → **The step has not yet run on GitHub.** | — | command; procedure, `sandbox2` record | `change` | Task 3 |
| 15 | `docs/remote-execution.md` → `## 11. Security` → **The post-session steps on a job that passed.** ("the check on a real job follows the first release that carries them") | — | command; procedure, `sandbox1c2` record | `change` | Task 3 |
| 16 | `docs/remote-execution.md` → `## 11. Security` → **The check on a real GitHub job is a post-release follow-up, not yet run.** | — | command; procedure, `sandbox1c` record | `change` | Task 3 |
| 17 | `docs/sandbox-verification.md` → opening **Since then.** paragraph ("§9 holds the rows the probe's job mode takes on a GitHub-hosted runner, all owed.") | — | command, `§9 holds the rows` | `change` | Task 1 |
| 18 | `docs/sandbox-verification.md` → `## 9. The GitHub-hosted runner legs` (the heading) | — | command; procedure, goal 4 | `no-change` | sandbox3b2 named this heading stable (*"this heading keeps its name when the rows are filled"*). §10 is added beside it rather than renaming it |
| 19 | `docs/sandbox-verification.md` → §9 **What this section is.** ("The full run on the real job is not this section's: it is `chore_sandbox_gate12_full_run_leg`'s.") | — | command, `full run on the real job` | `change` | Task 1 |
| 20 | `docs/sandbox-verification.md` → `## 10. The full-run leg and the Gate 12 sandbox round` (new) | — | procedure, goal 4 and `sandbox2d` §7 | `change` | Task 1 |
| 21 | `docs/development.md` → **Gate 12** → **(xvi) The full-run leg: one task through `harness-run.yml`, end to end.** (new) | — | procedure, goal 1 | `change` | Task 2 |
| 22 | `docs/development.md` → **Gate 12** → **The sandbox series round (#170 step 4) — not yet run.** (new; also `sandbox1e4` §10's "as a new round in `docs/development.md`") | — | procedure, goals 2–3 and `sandbox1e4` record | `change` | Task 2 |
| 23 | `docs/cli.md` → `## 6.` → **Residuals, stated rather than hidden:** → residual 1, item 1 ("The bootstrap's configured commands, `commands.depInstall` and `commands.build`, run against a run's own manifest") | — | procedure, `sandbox1c` §4 bullet (the `Bootstrap the checkout` known residual) | `no-change` | JS4 cites it as the known residual; nothing this branch writes falsifies it, and the branch changes no bootstrap behaviour |
