# Story: Decide the five Gate 12 row clauses that have no route

## Context

This branch settles five clauses of `docs/sandbox-verification.md` → `## 10. The full-run leg and the Gate 12 sandbox round` that the shipped `harness-run.yml` and watcher cannot reach today. They are SB2's `PAUSE_PROGRESS.md` arm, SB2's `autonomous_logs/remote_status.json` variant, SB3, JS3N and RJ2's launch-check clause. `feat_gate12_sandbox_round_driver` left each as a hand step or as a clause with no route. **The branch takes no measurement.** Every row stays *not yet measured*, except a clause rewritten to be read from the source, and that clause says it is read from the source, not observed. No recorded round 14 or round 15 cell (`Observed`, `Verdict`) changes. Nothing runs against GitHub: every driver test drives the existing `gh` stub (`cli/test/helpers/gate12-round.mjs`).

**The decision per clause.** The user answered the two open questions in park 1 (`harness-runs/clarifications/chore_gate12_unroutable_sandbox_rows/answer_1.md`: `Q1: a`, `Q2: a`). The other three take the writer's stated default, which the user did not dispute.

- **SB2's `remote_status.json` variant: fix the shipped defect, then close it upstream (Q1 a).** `hr_remote_status_write` (`cli/templates/scripts/lib/harness-run-lib.sh`) ends with a plain `mv "$tmp" "$out"`. When `<out_json>` is a link to a directory, `mv` moves the temp file *into* that directory and leaves the link standing. The unsandboxed watcher would then write a `remote_status.json.tmp.*` file wherever a session-made link points. Task 1 makes the function remove a link at `<out_json>` before the rename, whatever the link names, and refuse a real directory there, writing nothing. It also adds `cli/test` cases. After that, no link at that path survives a watcher write, so the variant is **unreachable by construction**, read from `hr_remote_status_write`. One gap is not closed and is stated, not deferred: a process the session started and left running could put a link back between the test and the rename. That is the same gap `docs/cli.md` §6 residual 1, item 5's first bullet already names for `save`. `remote-run.sh restore`'s own rename onto the same path (`hr_remote_bundle_restore`) has the same pattern. It sits inside the untested write set that `docs/cli.md` §6 residual 1, item 4 already declares, so this branch states it there (Task 8) and does not change restore.
- **SB2's `PAUSE_PROGRESS.md` arm: plant it through `scratch-run.sh` (Q2 a).** A *committed* link is moved aside when the job starts. A link the session makes *during* its run is never touched again before `Save the state bundle`. The job's profile allows `bash <scriptsDir>/scratch-run.sh`, and that script's header says the file/command distinction *"is not a capability boundary"*. `sandbox.filesystem.allowWrite` names the state directory. So a Node scratch file can call `fs.symlinkSync` there, which is the route JS3's plant already uses for its stall. Task 3 adds a second SB2 arm, `pause-note`, on its own branch with its own token. Its task prompt has the session write one `.mjs` file and run it once through `scratch-run.sh`. That file links `<stateDir>/PAUSE_PROGRESS.md` to a committed token file at the repository root. **No environment variable and no new seam ship.** The arm reuses a route the profile already grants. The driver header's sentence *"a session can neither write a job surface nor make a link"* is corrected to say that the session can make a link this way. This is a statement about what the session can do, and it is security-relevant.
- **SB3, JS3N and RJ2's launch-check clause: closed upstream, read from the source.** A seam that fed a trust check from an environment variable would break `harness-runs/lessons.md` → *"An unsandboxed script takes its mode and the path of every trust input from a record the session cannot write … never from … an environment variable"*. So none is added.
  - **SB3.** `harness.config.json` is write-protected for the session: `cli/src/generators/writeProtection.ts` → `protectedPaths`, its `join(repoRoot, CONFIG_FILENAME)` entry. Its Bash processes can write only under `sandbox.filesystem.allowWrite`, which names the state directory alone. A committed rewrite is a `jobSurfacePaths` entry, refused at `Refuse a branch that changed the job's own files`.
  - **JS3N.** Every job surface is write-protected for the session, because `jobSurfacePaths` derives from `placeholderProtectedPaths`. So is the checkout's whole `.git`. A pushed job surface is JS1's refusal.
  - **RJ2.** The planted profile is itself a job surface (`protectedPaths` → `join(repoRoot, PROFILE_PATH)`, kept by `jobSurfacePaths`). The existing `profile` plant stays. Its refusal at that step becomes RJ2's `pass`, and a branch that passes the step is `fail`. A `source` line then names where the launch-check clause is read from.

**A new route, `source`.** `scripts/lib/gate12-sandbox-round/core.sh` gains a fifth route: *closed upstream; no plant and no hand step; `grade` prints one `source` line carrying the row's note*. SB3 and JS3N move from `hand` to `source`. RJ2 stays `plant`, and SB2 stays `plant` with arms `clarifications,pause-note`. RJ3 and SB4's optional half stay `hand`; they are not this prompt's. SB4 keeps reading the `clarifications` arm's artifact, unchanged; the `pause-note` arm's artifact is graded inside SB2's own row. `docs/development.md` restates the `--list` table, and `cli/test/gate12-sandbox-round-docs.test.mjs` maps route to *Taken by*. So the new route lands in core first (Task 3), then the restated table (Task 9), then the test mapping (Task 10). **The row's Read from and its grade change together.** Tasks 4 and 5 change what `grade` prints, and Tasks 8 and 9 change the `Read from` / `Expected` text to name exactly that.

**Ship order.** This follows the precedent `feat_gate12_sandbox_round_driver` and `fix_gate12_round_driver_findings` set, which is contract before consumer (`.claude/context/conventions.md` → `### The order files are created, so a half-built feature is still coherent`).

1. Task 1 (`cli`) depends on nothing and goes first.
2. Task 2 (`general`) refreshes this repository's self-adopted `scripts/lib/harness-run-lib.sh` from Task 1's template.
3. The driver changes (`general`, under `scripts/`, Tasks 3–5) come before the `cli/test` suites that drive them (Tasks 6–7).
4. The documentation (`general`, Tasks 8–9) restates what the driver now prints.
5. The docs-restatement test (`cli`, Task 10) closes the branch, because it reads Task 9's table.

**The constraints every task carries:**
- The driver stays hand-run. It never runs in this repository (`docs/development.md` → **This repository cannot host its own remote runs.**) and records no result.
- Bash 3.2 is the floor: no associative array and no `${var,,}`. Every library file stays sourced and sets no shell option.
- A `--list` field carries no `|`, tab, double quote, backtick or angle bracket (`core.sh` header).
- Every log string a test cans is read at test time out of the shipped file that prints it, never retyped, wherever a fixed substring can be extracted. That is the round-driver suites' stated rule.
- No fixture is created inside this checkout, and no test reaches the network.

**Top risks:**
- **The link fix turns a surviving link into a new escape, or drops the watcher's status.** If `rm` followed a link, or the function returned 1 on every link, a session could delete outside files or blank the bundle's `status.json`. Task 1 removes only the link itself (`rm -f` on the path, never with a trailing `/`) and still writes the status. It refuses only a real directory, and its cases check what reached the disk outside the state directory, not exit codes (`harness-runs/lessons.md` → *"Grade a write probe on what reached the disk"*).
- **SB2's `pause-note` arm reads as `pass` without the link ever having been made.** If the grade passed on the absence of a token alone, a session that never ran the scratch file would pass. Task 5 grades `pass` only on `Save the state bundle`'s own `skipped <path>: <path> is a symbolic link` line for `<stateDir>/PAUSE_PROGRESS.md`. No such line with no token is `not run`. A token or a link in the artifact is `fail`. Task 7 pins all three.
- **A row whose `Read from` and grade disagree.** If RJ2's grade changed but its §10 `Read from` still named the `not launching` line, the row would be graded on a source it no longer names. Tasks 8 and 9 rewrite each changed row's `Expected` and `Read from` against the result lines Tasks 4 and 5 print. Task 10's test holds the restated table to `--list`, `source` rows included.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. **Only the committing role flips a marker to `[x]`**: the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker here, or edits any other line of this section, while a run is iterating this index. `[ ]` markers anywhere else, such as sub-step bullets inside a per-task file, are informational only. They are never the iteration source, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/chore_gate12_unroutable_sandbox_rows/task_<K>_plan.md`.

1. [x] **Task 1** — Make `hr_remote_status_write` remove a link at its target before the rename and refuse a directory, with cases in `remote-save-links.test.mjs` _(layer: cli)_ _(points: 15)_
2. [x] **Task 2** — Refresh this repository's self-adopted `scripts/lib/harness-run-lib.sh` from its template _(layer: general)_ _(points: 5)_
3. [x] **Task 3** — Add the `source` route and re-route SB3 and JS3N in `core.sh`, and plant SB2's `pause-note` arm in `plants.sh` _(layer: general)_ _(points: 20)_
4. [x] **Task 4** — Grade RJ2 on its refusal at the job-surface step, with a `source` line for the launch-check clause _(layer: general)_ _(points: 15)_
5. [x] **Task 5** — Grade SB2's two arms and its `remote_status.json` variant's `source` line, and print a `source` line for every `source`-route row _(layer: general)_ _(points: 20)_
6. [x] **Task 6** — Test the `pause-note` plant, and move the alias-acceptance case off JS3N _(layer: cli)_ _(points: 10)_
7. [x] **Task 7** — Test the new RJ2, SB2 and `source`-row grades _(layer: cli)_ _(points: 20)_
8. [x] **Task 8** — Rewrite SB2, SB3, JS3N and RJ2 in `docs/sandbox-verification.md` §10, and align `docs/cli.md` §6 and `docs/remote-execution.md` _(layer: general)_ _(points: 20)_
9. [x] **Task 9** — Rewrite Gate 12's round steps 7 and 8 and the owed checks in `docs/development.md`, and re-derive the restated table from `--list` _(layer: general)_ _(points: 20)_
10. [ ] **Task 10** — Hold the restated table's `source` rows to `--list` in `gate12-sandbox-round-docs.test.mjs` _(layer: cli)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"If it is closed upstream: rewrite the row so that its **Expected** says what the source guarantees, and its **Read from** names that source by path and symbol. Rewrite the hand-step paragraph in `docs/development.md` and the `scripts/gate12-sandbox-round.sh` row table to match."* — together with *"If the row must stay observable: add the test seam that reaches it, name the seam in the row's **Read from**, and give `scripts/gate12-sandbox-round.sh` the plant that uses the seam."* The register also covers the corpus text that states the two premises Q1 and Q2 overturn: that the session cannot make a link, and that the watcher's rename replaces a link. It also covers the residual text about `remote_status.json` renames in `docs/cli.md`.

**Derivation entry A — every statement naming the five clauses' rows (command).** Re-run verbatim from the checkout root: `git grep -n -w -E 'SB2|SB3|JS3N|RJ2' -- '*.md' ':!harness-runs/**'`

**Derivation entry B — the two overturned premises (command).** `git grep -n -o -E '.{0,80}(make (a|the) link|allows no .ln.|carries no .ln.|hr_remote_status_write|by rename).{0,80}' -- '*.md' ':!harness-runs/**'`

**Derivation entry C — the residual text on renames onto `remote_status.json` (command).** `git grep -n -E 'mv.d onto .autonomous_logs/remote_status\.json.|linked .remote_status\.json.' -- '*.md' ':!harness-runs/**'`

**Derivation entry D — the driver's documentation set (command).** `git grep -l -F 'gate12-sandbox-round' -- '*.md' ':!harness-runs/**'`. Every file it lists must be the file of at least one row below.

No standing tracked artifact under `harness-runs/` carries a row for these checks or covers these files: `lessons.md` holds no rule naming them, and there is no standing matrix over `docs/`. So no procedure entry is owed. The driver's own comments (`scripts/lib/gate12-sandbox-round/*.sh`) and the `cli/test` headers are source and code-level docs. They are Tasks 3–7's targets, not register rows.

**Closure invariant:** every site each derivation entry reaches appears as a row below.

| # | Site | Copy | Evidence (what the derivation matched) | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/development.md` → round step 7, *"The arms it plants:"* list, the `SB2 \`clarifications\`` bullet | — | entry A | `change` | Task 9: a `pause-note` bullet is added beside it |
| 2 | `docs/development.md` → round step 7, the `RJ2 \`profile\`` arm bullet | — | entry A | `no-change` | the RJ2 plant itself is unchanged |
| 3 | `docs/development.md` → round step 7, *"SB2's planted job parks on its task prompt's question"* | — | entry A | `change` | Task 9: only the `clarifications` arm's job parks; the `pause-note` job runs to its end |
| 4 | `docs/development.md` → **The hand steps of this leg, and why the driver cannot take them.** (lead sentence, *"SB4's bundle half has no plant of its own"*) | — | entry A | `change` | Task 9 |
| 5 | `docs/development.md` → the same block, bullet **SB2's `PAUSE_PROGRESS.md` arm.** (*"The session cannot make the link either"*) | — | entries A and B | `change` | Task 9: now planted through `scratch-run.sh` |
| 6 | `docs/development.md` → the same block, bullet **SB2's `autonomous_logs/remote_status.json` variant.** (*"is a `mv` that replaces whatever is at the path"*) | — | entries A and B | `change` | Task 9: read from the source after Task 1's fix |
| 7 | `docs/development.md` → the same block, bullet **SB3.** | — | entry A | `change` | Task 9: closed upstream, read from the source |
| 8 | `docs/development.md` → *"These, with JS3N under step 8 and RJ2's launch-check clause below, are the subject of …"* | — | entry A | `change` | Task 9: states the decision this branch took |
| 9 | `docs/development.md` → **RJ2 is refused before its launch check, settled from the source.** | — | entry A | `change` | Task 9: the refusal is now RJ2's `pass`, plus a `source` line |
| 10 | `docs/development.md` → round step 8, **JS3N is a hand step.** | — | entry A | `change` | Task 9: closed upstream, read from the source |
| 11 | `docs/development.md` → **The rows the driver takes, and how.** table, row `SB2` | — | entries A and B | `change` | Task 9: re-derived from `--list` after Task 3 |
| 12 | `docs/development.md` → the same table, row `SB4` (*"grade (SB2's run)"*) | — | entry A | `no-change` | SB4's route and note do not change |
| 13 | `docs/development.md` → the same table, row `RJ2` | — | entry A | `change` | Task 9: re-derived from `--list` |
| 14 | `docs/development.md` → the same table, row `JS3N` | — | entry A | `change` | Task 9: re-derived from `--list` |
| 15 | `docs/development.md` → the same table, row `SB3` | — | entry A | `change` | Task 9: re-derived from `--list` |
| 16 | `docs/development.md` → **The owed checks.**, the `sandbox1c` §3 bullet (*"rows JS3 and JS3N"*) | — | entry A | `change` | Task 9: JS3N's clause is read from the source |
| 17 | `docs/development.md` → **The owed checks.**, the `sandbox1c2` §2 bullet (*"row SB2"*) | — | entry A | `change` | Task 9: the variant is read from the source; the `PAUSE_PROGRESS.md` link is session-made |
| 18 | `docs/development.md` → **The owed checks.**, the `sandbox1c2` §3 bullet (*"row SB3"*) | — | entry A | `change` | Task 9 |
| 19 | `docs/development.md` → **The owed checks.**, the `sandbox1e4` §10 item 2 bullet (*"row RJ2"*) | — | entry A | `change` | Task 9 |
| 20 | `docs/remote-execution.md` → the facts table row *"A branch whose profile fails `run_profile_check` … launches nothing"* (*"§10 RJ2"*) | — | entry A | `change` | Task 8 |
| 21 | `docs/remote-execution.md` → *"the planted links and the untrusted `stateDir` are SB2 and SB3"* | — | entry A | `change` | Task 8: SB3 is read from the source |
| 22 | `docs/remote-execution.md` → *"the stalled-watchdog arms are JS3 and JS3N, in step 8"* | — | entry A | `change` | Task 8: JS3N is read from the source |
| 23 | `docs/sandbox-verification.md` → `## 5.`, row `F15` (*"SB2's answered job `42037167631`"*) | — | entry A | `no-change` | a dated record of what was measured (`.claude/context/conventions.md` → `## Documents of record`) |
| 24 | `docs/sandbox-verification.md` → `## 10.`, row `JS3N` | — | entry A | `change` | Task 8: `Expected` and `Read from` only |
| 25 | `docs/sandbox-verification.md` → `## 10.`, row `SB2` | — | entry A | `change` | Task 8: `Expected` and `Read from` only |
| 26 | `docs/sandbox-verification.md` → `## 10.`, row `SB3` | — | entry A | `change` | Task 8: `Expected` and `Read from` only |
| 27 | `docs/sandbox-verification.md` → `## 10.`, row `SB4` (*"SB2's downloaded `harness-state` artifact"*) | — | entry A | `no-change` | SB4 still reads the `clarifications` arm's artifact, and that arm is unchanged |
| 28 | `docs/sandbox-verification.md` → `## 10.`, row `RJ2` | — | entry A | `change` | Task 8: `Expected` and `Read from` only |
| 29 | `docs/cli.md` → `## 6.` residual 1, item 4 (*"a temporary file is `mv`d onto `autonomous_logs/remote_status.json`"*) | — | entry C | `change` | Task 8: a link to a directory at that target takes the temporary file into that directory; stated, restore not changed |
| 30 | `docs/cli.md` → `## 6.` residual 1, item 5 (*"A linked `remote_status.json` falls through to the registry-derived `status.json`"*) | — | entry C | `change` | Task 8: one sentence, the watcher's own writes remove a link at that path before their rename |
