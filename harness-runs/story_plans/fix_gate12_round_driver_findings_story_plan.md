# Story: Fix the three Gate 12 round driver defects round 13 found

## Context

This branch fixes three defects in `scripts/gate12-sandbox-round.sh` that its first real use found. That use was Gate 12 round 13, on `firu-daniel/harness-gate12`, on 2026-11-05. The first defect stops the driver from starting: the preflight refuses an origin given as an SSH host alias for github.com. The other two misgrade a row. FR3 passes a run whose pushes were refused, because `push-branch.sh` exits 0 on every refusal and `Push the branch` then concludes `success`. FR6 fails a park that had nothing to restore, because `remote-run.sh restore` prints its `placed <n> planning file(s)` line only when `PLACED + KEPT` is non-zero. The driver is hand-run, is not a `cli/templates/` file and never runs in this repository, so nothing here reaches an adopter. **The driver takes no measurement and records no result**, and every row in `docs/sandbox-verification.md` §10 stays *not yet measured*.

**The two design choices the prompt leaves to the plan, and why each is taken.**

- **Finding 1 keeps the host check and resolves the alias with `ssh -G`. It does not compare only the `<owner>/<name>`.** A slug-only comparison would accept `git@gitlab-alias:<o>/<n>.git` whenever the slug matched, and `plant` and `default-branch` push to `origin` through git. So a matching slug on another host is a repository other than `--repo`, and the check exists to refuse exactly that. `ssh -G <alias>` prints the configuration ssh would use for that host, `hostname` included, and opens no connection. The preflight accepts `git@<alias>:<o>/<n>[.git]` only when that `hostname` is `github.com`, and keeps refusing every other shape. That is the ledger's rule for a trust check that meets a new shape (`harness-runs/lessons.md` → `## Trust checks`, *"accept only its provably inert shape … and keep refusing every other shape"*). Task 1 owns it.
- **Finding 3 decides whether a planning file was saved by reading the parked job's `harness-state` artifact. It does not infer that from the absent `placed` line.** A missing `placed` line means only that the restore placed and kept nothing. Read alone, that would let FR6 pass a restore that dropped the bundle's planning drafts, which is the defect the clause is there to catch. The bundle's drafts sit under `planning/` at the artifact's root: `Save the state bundle` writes `$RUNNER_TEMP/harness-state`, `Upload the state bundle` uploads that directory, and `hr_remote_bundle_restore` reads `<bundle>/planning/`. The driver already has the reader, `g12_artifact` in `scripts/lib/gate12-sandbox-round/runs.sh`, so no new reader is added. The artifact is read **only** when the restore printed no `placed` line, so a run that placed drafts is graded exactly as before. Task 2 owns it.

**The FR3 note changes, so the `--list` table changes by one row.** FR3's note in `core.sh` says the row is *"graded on the job: line of the Run the harness step log"*. That stops being true once the row also fails on a wrapper's refusal line. Task 2 rewrites that note, and Task 5 re-derives the restated table in `docs/development.md` from `--list`. No other row's note changes (goal 3). FR6's note, *"the state bundle saved by the parked job and restored by the next, graded from the full run that grade --full-run names"*, stays true and is not touched.

**Wrapper refusal spellings.** `push-branch.sh` and `commit-on-branch.sh` each print a refusal in two spellings. One is `<script>: refusing to push: <reason>` / `<script>: refusing to commit: <reason>`. The other is `<script>: <reason> — refusing to push` / `… — refusing to commit`, for example `detached HEAD — refusing to push` and `branch '<b>' is protected — refusing to push`. Both mean nothing was pushed or committed, so FR3 fails on either. The prompt's two named prefixes are the first spelling, and that is the spelling round 13 logged. `push-branch.sh`'s other non-zero outcomes, such as `push failed for <branch> …`, are not refusals. FR3 does not grade on them, and this branch does not widen it to.

**Ship order.** The two driver tasks (`general`, under `scripts/`) come first. The two test tasks (`cli`, under `cli/test/`) follow, because each one drives a driver change that must already be in the tree, or its cases fail for the wrong reason. The documentation task (`general`) closes the branch, because it restates what the driver now prints. This is the order `feat_gate12_sandbox_round_driver` shipped the driver in, and it is contract before consumer (`.claude/context/conventions.md` → `### The order files are created, so a half-built feature is still coherent`).

**The constraints every task carries:**
- The driver stays hand-run, never runs in this repository, and records no result. Nothing under `cli/templates/` and no wrapper, watcher, workflow or run-library behaviour changes. A defect an implementer notices there is named in its return as a candidate follow-up, never fixed here.
- The Bash floor is 3.2: no associative array and no `${var,,}`. Lower-case with `tr`, as `preflight.sh` already does. Every library file stays sourced and sets no shell option.
- Every log string a test cans is read at test time out of the shipped file that prints it, never retyped, wherever a fixed substring can be extracted. That is the rule both round-driver suites' headers already state.
- No fixture is created inside this checkout, and no test reaches the network or a real `ssh`.

**Top risks:**
- **A widened preflight that accepts another host.** An alias check that trusts the URL's shape, or that passes an alias beginning with `-` to `ssh` as an option, would let the driver push to a repository other than `--repo`. Task 1 validates the alias as a bare host token before calling `ssh -G`, and accepts only a resolved `hostname` of `github.com`. Task 3 pins an alias that resolves elsewhere, an alias that resolves to github.com but names another slug, and a leading-dash alias, which is refused before `ssh` is called.
- **FR6 widened into a pass that hides a dropped draft.** If the planning-file test were taken from the log alone, a restore that silently dropped drafts would pass. Task 2 reads the parked job's artifact, and Task 4 pins three outcomes. A bundle holding a planning file with no `placed` line is `fail`. An expired artifact is `expired`, never a pass (`harness-runs/lessons.md` → *"State held only in an expiring store … must be reported plainly as expired"*). Round 13's zero-plan restore is `pass`.
- **FR3 graded on a step's exit status rather than on what the step reports.** `Push the branch` concludes `success` on a refusal (`cli/templates/scripts/push-branch.sh` → **EVERY FAILURE PATH IS NON-FATAL (exit 0)**). That is the ledger's *"never on the call's exit status"* rule (`## Evidence and measurement`). Task 2 reads the step's log for the refusal line, and Task 4 replays round 13's two jobs, which must grade `fail`.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below top to bottom. **Only the committing role flips a marker to `[x]`**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker here, or edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else, such as sub-step bullets inside a per-task file, are informational only. They are never the iteration source, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_gate12_round_driver_findings/task_<K>_plan.md`.

1. [x] **Task 1** — Accept an SSH host alias that `ssh -G` resolves to github.com in the preflight's origin check _(layer: general)_ _(points: 10)_
2. [x] **Task 2** — Fail FR3 on a wrapper's refusal line, and grade FR6's `placed` clause only where the parked bundle holds a planning file _(layer: general)_ _(points: 20)_
3. [x] **Task 3** — Test the preflight's host-alias acceptance and its refusals _(layer: cli)_ _(points: 10)_
4. [ ] **Task 4** — Test FR3's wrapper refusals and FR6's zero-plan restore, replaying round 13 _(layer: cli)_ _(points: 20)_
5. [ ] **Task 5** — Align FR3 and FR6 in `docs/development.md` and `docs/sandbox-verification.md` §10, and re-derive the FR3 `--list` row _(layer: general)_ _(points: 15)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Align the FR6 text in `docs/development.md` (xvi) and `docs/sandbox-verification.md` §10."* — together with goal 3, *"The `--list` table in `docs/development.md` is unchanged unless a row's note changes, and it is re-derived from `--list` if one does."* The register also covers FR3's text in the same two documents. Finding 2 changes what FR3 is graded on, so FR3's restated note changes, and its Expected / Read from text has to say the same thing the driver grades.

**Derivation entry A — the FR6 `placed` clause (command).** Re-run verbatim from the checkout root: `git grep -n -F 'planning file(s)' -- docs/development.md docs/sandbox-verification.md`

**Derivation entry B — every FR3 statement (command).** `git grep -n -E '\| FR3 \||\*\*FR3\*\*|row FR3' -- docs/development.md docs/sandbox-verification.md`

**Derivation entry C — every FR6 statement (command).** `git grep -n -E '\| FR6 \||\*\*FR6\*\*|row FR6' -- docs/development.md docs/sandbox-verification.md`

**Derivation entry D — the preflight's accepted origin forms (command).** `git grep -n -E 'remote\.origin\.url|git@github\.com:' -- docs/development.md docs/sandbox-verification.md`

**Derivation entry E — the driver's documentation set (command).** `git grep -l -F 'gate12-sandbox-round' -- '*.md' ':!harness-runs/**'`. Every file it lists must be a file some row below names.

No standing tracked artifact under `harness-runs/` carries a row for these checks, so no procedure entry is owed.

**Closure invariant:** every site each derivation entry reaches appears as a row below. Every hit of entries A–D is a row, and every file entry E lists is the file of at least one row.

| # | Site | Copy | Evidence (what the derivation matched) | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/development.md` → **The rows the driver takes, and how.** table, row `FR3` | — | entry B, `\| FR3 \|` | `change` | Task 5: re-derived from `--list` after Task 2 rewrites FR3's note |
| 2 | `docs/development.md` → **The rows the driver takes, and how.** table, row `FR6` | — | entry C, `\| FR6 \|` | `no-change` | FR6's `--list` note does not change (goal 3) |
| 3 | `docs/development.md` → **The owed checks.**, the `sandbox1c2` §1, step 6, row FR6 bullet (*"the next job logs `restored the bundle of run <id>` and `placed <n> planning file(s)`"*) | — | entries A and C | `change` | Task 5: it states the expectation the round grades FR6 on, which now carries the zero-plan condition |
| 4 | `docs/development.md` → observation (xvi), the `**FR3**` bullet | — | entry B, `**FR3**` | `change` | Task 5 |
| 5 | `docs/development.md` → observation (xvi), the `**FR6**` bullet | — | entries A and C, `**FR6**` | `change` | Task 5: the FR6 alignment the prompt names |
| 6 | `docs/sandbox-verification.md` → `## 10.`, table row `FR3` | — | entry B, `\| FR3 \|` | `change` | Task 5 |
| 7 | `docs/sandbox-verification.md` → `## 10.`, table row `FR6` | — | entries A and C, `\| FR6 \|` | `change` | Task 5: the FR6 alignment the prompt names |
| 8 | `docs/development.md` → **Round 3 — 2026-09-29, CLI 0.4.2.** (`placed … planning file(s)` as logged) | — | entry A | `no-change` | a dated round record of what was measured (`.claude/context/conventions.md` → `## Documents of record`) |
| 9 | `docs/development.md` → Round 5's finding 1, *"A run whose branch name was used before inherits that earlier run's state."* | — | entry A | `no-change` | a dated round record of what was measured |
| 10 | `docs/development.md` → **Round 12 — 2026-10-09, the hardened workflows before their release.**, the record quoting run `37917550853`'s `placed 9 planning file(s)` | — | entry A | `no-change` | a dated round record of what was measured |
| 11 | `docs/development.md` → the lineage check's *"Passes when its `Restore the previous job's state` step logs `remote-run.sh: skipped <n> finished run(s) of <slug>_2 from before its current lineage`"* step | — | entry A | `no-change` | the pass condition of a different Gate 12 observation, which the driver does not grade |
| 12 | `docs/sandbox-verification.md` → `## 3. The wrappers`, row `C1` (a scratch repository whose `.git/config` sets `core.sshCommand`) | — | entry D, `git@github.com:` | `no-change` | a push-wrapper probe row, not the driver's origin check; no document states the driver's accepted origin forms, which `preflight.sh`'s header owns (Task 1) |
