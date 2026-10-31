# Story: Run analytics on jq 1.6, and the notes-app profile re-rendered

## Context

This branch fixes two problems that came in with run analytics (`c573db24`, `ce42229e`). Both were found while #212 was being verified.

**Run analytics fails on jq 1.6.** `cli/templates/scripts/lib/run-analytics-report.jq` → `latency_row` takes a parameter named `$label`. `label` is a keyword in jq 1.6 (`label $name | … break $name`), so jq 1.6 rejects the whole program at compile time: `syntax error, unexpected label, expecting IDENT`. jq 1.7 relaxed that rule, and Homebrew's and macOS's own `jq` are 1.7 or newer, which is why the suite passes on macOS. `doctor` declares a **jq 1.5** floor (`cli/src/doctor/checks.ts` → `JQ_MIN_MAJOR` / `JQ_MIN_MINOR`), and Debian 12 and Ubuntu 22.04 ship 1.6. On those hosts every run's analytics fail quietly, and that includes the job-mode path that commits the session's analytics on the run's branch. The local watcher and the remote job run the same program, so one fix covers both execution modes. The same fix has to land in two places: the template under `cli/templates/scripts/lib/` (the `cli` layer) and this repository's self-adopted copy under `scripts/lib/` (the `general` layer). Nothing re-syncs the copy, so it is edited to stay byte-identical with the template.

**How the floor is enforced rather than assumed, and what that costs.** No jq older than the host's is reachable from this repository's tests. Getting one means fetching a binary or a distribution package over the network. That is outside every gate `scripts/run-gates.sh` runs, and outside what an unattended run may do, and vendoring a per-platform binary would break the no-runtime-dependency and self-containment rules. The branch therefore adds two things:
- **Task 2: an always-on source guard**, `cli/test/jq-floor.test.mjs`. It scans every shipped `.jq` program for the two syntax classes jq 1.7 relaxed and jq 1.5/1.6 reject: a jq keyword used as a `$` binding, a `.` field name or an object key, and an `if` without an `else`.
- **Task 4: a documented by-hand route**, in `docs/development.md` → Gate 4. It runs the whole suite under Debian 12's jq 1.6 in Gate 15's Linux container. Because the suite inherits `PATH`, that run also passes every other jq program the tests reach through jq 1.6: the trust-file guard's payload parse (`cli/test/git-trust-file-guard.test.mjs`), the watcher's per-run profile render (`cli/test/watcher-run-profile.test.mjs`) and the analytics suites.

The source guard covers only the `.jq` files. The jq programs embedded in shell assets are covered only by the by-hand run. The source guard is a tree-reading test, so Task 3 registers it in `harness.config.json` → `treeGuards`.

**The notes-app profile has drifted from what `init` renders.** `init` now write-protects the main checkout's `scripts/run-analytics.sh` in three places: a `sandbox.filesystem.denyWrite` path, an `Edit(//…/scripts/run-analytics.sh)` deny rule, and a segment of the `WHAT RUNS OUTSIDE THE SANDBOX` `_README` line. The live fixture `examples/notes-app/.claude/settings.autonomous.json` has none of the three. #224 also rewrote three generated `_README` lines without re-rendering the fixture. Task 5 re-renders the fixture, takes exactly those entries and lines, reports any other difference without taking it, and updates the counts and description in `examples/notes-app/README.md`. The fixture's capture (its `.claude/CLAUDE.md`, its `.claude/context/` documents and its `sdlc-harness/` artifacts) is frozen and is not touched (`.claude/context/conventions.md` → `## Documents of record`).

Ship order: the `cli` tasks first (the program fix, then the guard that proves it), then the `general` tasks (the self-adopted copy and the guard's registration, the documented route, the fixture).

**Top risks:**
- **A second post-1.5 construct.** Fixing `$label` alone could leave another construct that jq 1.6 or 1.5 also rejects. Task 1 audits both analytics programs against the floor, and Task 2's guard keeps the two relaxed syntax classes out from now on. Neither proves the programs run on jq 1.6, so the manual container run below is still owed before merge.
- **The fixture write is refused.** An unattended run is refused writes under `examples/notes-app/.claude/` by the tool layer's `.claude/**` guard, and #212 was refused that way twice. Task 5 checks what reached the disk, not the tool's exit. If the write is refused, it records a one-paste operator remedy and does not skip the edit.
- **The fixture picks up more than this branch owes.** A re-render can bring in more than the run-analytics entries and #224's three lines. Task 5 compares the render with the fixture line by line and takes only what is named.

**Manual setup required:**
1. **Before merge: the suite on jq 1.6** (depends on Tasks 1–3; the route is the one Task 4 documents). In Gate 15's container (`docs/development.md` → *A Linux run, in a local container*), run as `probe`:
   - `apt-get install -y jq`, then check that `jq --version` prints `jq-1.6`.
   - Clone this branch and point a local `dev` at it, as *The absent-path check, by hand* describes: `git clone --branch fix_run_analytics_jq16 …`, then `git checkout -B dev`.
   - `npm ci`, then `npm test --workspace cli`.

   Record the `jq --version` line and the `# pass` / `# fail` counts in the pull request. Any failure that names `run-analytics`, `git-trust-file-guard` or the watcher's profile render blocks the merge.
2. **Only if Task 5's fixture write is refused:** paste the operator remedy recorded in `harness-runs/task_plans/fix_run_analytics_jq16/task_5_plan.md` → `## Disposition`, from the main checkout's root, and commit the two files it changes.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom.

- **Only the committing role flips a marker** to `[x]`. That is the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. An implementer never changes a marker here, and never edits any other line of this section, in an index a run is iterating.
- `[ ]` markers anywhere else, such as sub-step bullets in the per-task files, only track progress. They are never the iteration source, and the committer does not touch them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_run_analytics_jq16/task_<K>_plan.md`. Entries are ordered bottom-up by ship sequence, with the catch-all layer last.

1. [x] **Task 1** — Rename `latency_row`'s `$label` parameter and audit both run-analytics `jq` templates against the 1.5 floor _(layer: cli)_ _(points: 10)_
2. [x] **Task 2** — Add `cli/test/jq-floor.test.mjs`, a source guard for the jq syntax 1.5 and 1.6 reject _(layer: cli)_ _(points: 20)_
3. [x] **Task 3** — Bring the self-adopted `scripts/lib/` jq programs level with the templates and register the jq-floor guard _(layer: general)_ _(points: 10)_
4. [ ] **Task 4** — Document Gate 4's by-hand run under Debian 12's jq 1.6 and what the floor guard does not cover _(layer: general)_ _(points: 10)_
5. [ ] **Task 5** — Re-render the notes-app profile's `run-analytics.sh` entries and #224's three `_README` lines, and update its README record _(layer: general)_ _(points: 15)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt (two clauses, one per half of the branch):
- *"If the repository has, or can cheaply gain, a way to run the jq programs under an older jq in its tests, use it, so the floor is enforced rather than assumed. Say what it costs if not."*
- *"re-render the fixture the same way, take the `run-analytics.sh` entries and their `_README` segment, and check for any other difference between the render and the fixture. Change nothing else. Then update the count and description `examples/notes-app/README.md` keeps for that file."*

**Derivation entry A: corpus files stating a jq version floor (command).** Re-run verbatim from the checkout root:
`git grep -l -E -e 'jq.{0,2} 1\.[56]' -- docs README.md cli/README.md plugin/hooks/README.md examples/notes-app/README.md`

**Derivation entry B: notes-app files naming run analytics or the profile (command).** Re-run verbatim from the checkout root:
`git grep -l -e 'run-analytics' -e 'settings.autonomous.json' -- examples/notes-app`

**Derivation entry C: files naming the tree-guard key (command).** Re-run verbatim from the checkout root:
`git grep -l -e 'treeGuards' -- harness.config.json docs`

**Standing-artifact rows.** None of this plan's targets is covered by a standing matrix under `harness-runs/`, so no procedure entry is owed. The lessons ledger names no surface this branch changes.

**Closure invariant:** every site that entries A, B and C reach appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/development.md` → Gate 4 (*"This gate needs `jq` 1.5 or newer on `PATH`"*) | — | entry A | `change` | Task 4: the by-hand jq 1.6 run and what the source guard does not cover |
| 2 | `docs/cli.md` → the `doctor` `jq` check paragraph (*"A `jq` **older than 1.5** is worse to diagnose"*) | — | entry A | `no-change` | describes the configuration loaders' 1.5 constructs and `doctor`'s floor check. The floor stays 1.5 and the loaders are not touched |
| 3 | `docs/flow-graph-walker.md` → `### The runtime — bash 3.2 and \`jq\` 1.5` | — | entry A | `no-change` | the flow walker's own floor decision. The walker is not touched |
| 4 | `docs/guard-verification.md` → *"A `jq` older than 1.5 does not make the guards quiet"* | — | entry A | `no-change` | a measured fact about the guards' configuration load under a pre-1.5 stand-in. Unaffected |
| 5 | `docs/remote-execution.md` → the prerequisites sentence (*"`jq` 1.5 or newer"*) | — | entry A | `no-change` | a prerequisite list. The floor is unchanged |
| 6 | `examples/notes-app/.claude/settings.autonomous.json` | — | entry B | `change` | Task 5: the `run-analytics.sh` entries and #224's three `_README` lines |
| 7 | `examples/notes-app/README.md` → *"The one edit the kept artifacts carry, and where it landed."* | — | entry B | `change` | Task 5: the re-render record, the counts and the description |
| 8 | `examples/notes-app/sdlc-harness/code_reviews/feat_note_updated_at_code_review/finding_2.md` | — | entry B | `no-change` | part of the frozen capture. Editing it would falsify the record (`.claude/context/conventions.md` → `## Documents of record`) |
| 9 | `harness.config.json` → `treeGuards` | — | entry C | `change` | Task 3: the `test/jq-floor.test.mjs` entry |
| 10 | `docs/cli.md` → the `tree-guards` `doctor` check rows | — | entry C | `no-change` | describes the check in general terms and lists no repository's entries |
| 11 | `docs/config.md` → the `treeGuards` key row and `<tree_guards>` token | — | entry C | `no-change` | defines the key. Adding an entry changes no part of its contract |
