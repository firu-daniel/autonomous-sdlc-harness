# Story: Fix Gate 12 round 7's run-control findings and record the round

## Context

Gate 12 round 7 (2026-10-05, CLI 0.6.1, `firu-daniel/harness-gate12`) re-ran observation (xiv), run control from GitHub, and found three defects. This branch fixes them in the task prompt's priority order and then writes the round's record.

- **Item 1 (High):** the `harness-control.yml` that 0.6.1 renders is not valid YAML, so GitHub runs it for no event.
- **Item 3 (Medium):** a run job's `resumed` report that lands after a stop un-stops the issue.
- **Item 2 (Low):** `status` early in a user-review round reports the previous engine's ledger as all ticked.
- **Item 4:** the round's record in `docs/development.md` and `docs/github-run-control.md`.

The work is cut into ten single-layer tasks: six in `cli`, then four in `general`, the catch-all, which ships last because it documents and gates what the `cli` tasks built. No task touches `plugin`. A grep of `plugin/` for `harness-control`, `forge_report` and the `status` reply finds only `plugin/docs/AUTONOMOUS_FLOW.md`'s inventory row, which none of these fixes falsifies.

**Item 1, and what this plan decided against the prompt's candidates.**
- **The fix (Task 1).** The control job's `if:` becomes a folded block scalar (`if: >-`) with its expression unchanged on one continuation line. That is the shape round 7 hand-patched, linted clean with `actionlint` 1.7.7, and saw GitHub list as `harness-control`.
- **No gate parses YAML today, and the CLI has no YAML parser.** The repository's conventions forbid a required runtime dependency, so `init` and `doctor` cannot parse YAML at run time. The two consequences are below.
- **The gate (Task 7) gets a dev-only parser.** It is `js-yaml`, declared as a **root-workspace devDependency**. `js-yaml` 3.15.1 is already in the lockfile as `ajv-cli`'s own dependency, so declaring it adds no download. Declaring it rather than resolving it transitively keeps the gate from breaking silently if `ajv-cli` ever drops it. At plan time, `js-yaml`'s `safeLoad` over the shipped template threw `incomplete explicit mapping pair; a key node is missed … at line 174, column 439`, and the other three templates parsed. That is the evidence the parse gate fails on 0.6.1's file. The gate's negative leg keeps it failing on that file.
- **The upgrade route (Task 2) is "any `init` repairs an unedited 0.6.1 copy".** Task 2 recognises 0.6.1's copy by its exact bytes: SHA-256 `dd014dc14bf19947182f4c95fa0bf011aba04fda354d9a6fa94242e86082bfa5` over LF-normalised text, git blob `1b4f0fc33200d876e4089ebe4013120e48a45335`, unchanged from `a4ae3c8` through `31a2d55 chore: bump version to 0.6.1`. When the copy matches, it re-renders it after a `.bak`. This happens on a plain `init`, so it also happens under `init --upgrade-workflows`, the route every release's `doctor` already sends adopters to. Of the prompt's three candidates, this one reaches the most adopters for the least risk:
  - `init --force` stays the blunt alternative. It regenerates every generated file.
  - Teaching `--upgrade-workflows` this file alone would miss an adopter who re-runs plain `init`.
  - An edited copy is never replaced. It is recognised by 0.6.1's exact `if:` line and gets a warning that names the hand fix.
- **Where the adopter sees the route.** The route's text has one producer, `unparseableControlRoute`, in `cli/src/generators/githubWorkflows.ts` (Task 2). `init`'s output carries it (Task 3), and so does `doctor --check-github` (Task 4). Task 4 adds one check: GitHub lists a workflow it could not parse with `name` equal to its `path`. The adopter docs carry the route too (Tasks 9 and 10).
- **Declined: an offline `doctor` check of the local file.** The prompt asks only for the `--check-github` check, and `init`'s repair or warning already reaches a local copy.

**Item 3 (Task 5).**
- **The guard.** `forge_report` in `cli/templates/scripts/remote-run.sh` applies its `remote_branch_stopped` guard to every event a job reports — `parked`, `park_loop`, `paused`, `resumed`, `round` and `failed` — rather than to `failed` alone. `stopped`, which the stop itself posts, never takes the guard.
- **A fresh run listing.** The guard re-lists the runs rather than reusing the invocation's cached listing, because `review` dispatches a run and then reports `round` in the same invocation.
- **A failed listing still reports**, as `failed` already does.
- **A `resumed` that a stop overtook says nothing**, which matches `failed`.
- **Declined: sending `resumed` before the slow setup steps.** The prompt says that alone is not a fix, and the guard closes the window.

**Item 2 (Task 6).** `control_status` stops pairing a `running` run with "every entry … is ticked".
- **A round has started.** When the ledger on origin reads fully ticked and the branch tip carries a `hr_user_review_subject` commit (`chore: add user review for <branch>`) newer than the ledger's last change, the reply says that a user-review round has started and its ledger is not written yet.
- **Still running, no round.** When the ledger reads fully ticked, no such commit is newer and the state is `running`, the reply says the run is still running with no open ledger entry.
- **Otherwise** the reply is unchanged.
- **Declined: reading the engine the newest run was dispatched with.** `fetch` reports no engine for a run in flight, and getting one would cost another call.

**Item 4 (Tasks 8 and 9).**
- **The Round 7 paragraph goes in verbatim.** Every sentence of it records 0.6.1 as observed, and its findings say they are carried to this branch, which is true. So no sentence becomes untrue, and no wording is adjusted.
- **Every earlier "What still owes a first recording" sentence goes.** The prompt's acceptance criterion says that only round 7's sentence stands, and today two stand: round 5's and round 6's. So Task 8 removes both, not only round 6's, and states that.

**Out of scope, per the prompt:** the version bump and the 0.6.2 release, and roadmap item 19.

Top risks: The likeliest failure is a repair that writes the fixed `harness-control.yml` but leaves it uncommitted. A run job's own `init` (`harness-run.yml`, the `init --plugin-root-entries` step) refuses a changed tracked file, so a repaired-but-uncommitted copy fails the next job; Task 3 guards this by putting the repaired path on the `git add` line of whichever block owns the commit, and its verification asserts that line. The second risk is the `report` guard adding a `run list` call that existing `gh`-stub suites do not expect, which only surfaces in Phase G's full run; Task 5 owns a grep of `cli/test` for exact call-sequence assertions on report paths and updates the suites it finds, rather than leaving them to the gate. The third is a parse gate that passes for the wrong reason — rendering nothing, or parsing the template rather than `init`'s output; Task 7's gate fails when the rendered set is not exactly the four workflows, and its negative leg must refuse 0.6.1's file for the run to be green.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. **Only the committing role flips a marker to `[x]`.** That is the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. No implementer changes a marker, or edits any other line of this section, in an index a run is iterating. `[ ]` markers anywhere else, such as the sub-step bullets inside the per-task files, are informational only, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_forge_run_control_gate12_round7_findings/task_<K>_plan.md`. The entries are ordered bottom-up by ship sequence, `cli` first, with the catch-all `general` layer last. Within `cli`, item 1 comes first, then item 3, then item 2, as the prompt asks.

1. [x] **Task 1** — Write `harness-control.yml`'s job `if:` as a folded block scalar _(layer: cli)_ _(points: 8)_
2. [x] **Task 2** — `init` repairs an unedited 0.6.1 `harness-control.yml` after a `.bak`, and owns the repair route's text _(layer: cli)_ _(points: 20)_
3. [x] **Task 3** — `init` reports the control-workflow repair, and warns on an edited unparseable copy _(layer: cli)_ _(points: 15)_
4. [x] **Task 4** — `doctor --check-github` fails on a harness workflow GitHub lists by its path _(layer: cli)_ _(points: 15)_
5. [ ] **Task 5** — `forge_report` posts nothing for any job event a stop has overtaken _(layer: cli)_ _(points: 15)_
6. [ ] **Task 6** — `status` never calls a running run's ledger fully ticked, and names a round whose ledger is not written yet _(layer: cli)_ _(points: 12)_
7. [ ] **Task 7** — Gate 14: parse every rendered workflow with a YAML parser, refuse 0.6.1's file, and run `actionlint` where installed _(layer: general)_ _(points: 15)_
8. [ ] **Task 8** — `docs/development.md`: gate 14, the (xiv) by-name check, and the Gate 12 round 7 record _(layer: general)_ _(points: 15)_
9. [ ] **Task 9** — `docs/github-run-control.md`: `status`, the stopped-job rule, the repair route, and §8's round 7 table _(layer: general)_ _(points: 15)_
10. [ ] **Task 10** — `docs/remote-execution.md`, `docs/github-issue-trigger.md` and `docs/cli.md` state the repair route and the new `doctor` failure _(layer: general)_ _(points: 12)_

## Scope register

This plan's targets include durable corpus text: five documents under `docs/`, and the header paragraphs of two adopter-facing templates, `cli/templates/github/workflows/harness-control.yml` and `cli/templates/scripts/remote-run.sh`. The register below covers those sites only. The `cli/src` modules, the tests and `scripts/run-gates.sh` are source, and none of them owes a row.

**Scope predicates**, quoted verbatim from the task prompt:
- *"Give adopters a route to the fixed file, and state it where an adopter will see it: the CLI's output, `doctor`, `docs/github-run-control.md` and `docs/remote-execution.md`."*
- *"`docs/github-run-control.md` → `## 5.` states that nothing from a stopped job changes a label or posts a lifecycle comment."*
- *"The `harness-control.yml` and `remote-run.sh` header paragraphs match the new behaviour."*
- *"Gate 12 → (xiv)'s setup in `docs/development.md` checks that GitHub lists all four workflows by name."*
- Item 4's two numbered steps, and the four §8 rows its table names.

**Derivation entry D1 — statements of `harness-control.yml`'s re-run or upgrade route (command).** Re-run verbatim from the checkout root:

```
git grep -nE "harness-control\.yml.*(--force|upgrade-workflows|create-if-absent|\.bak)|(--force|upgrade-workflows|create-if-absent|\.bak).*harness-control\.yml" -- docs cli/templates plugin README.md ARCHITECTURE.md cli/README.md
```

**Derivation entry D2 — the two templates' header paragraphs (procedure).**
- **Artifact:** the leading `#` comment block of `cli/templates/github/workflows/harness-control.yml`, and of `cli/templates/scripts/remote-run.sh`.
- **Traversal:** each paragraph that opens with an upper-case lead, in file order.
- **Decision rule:** a paragraph is reached when it states any of these:
  - the control job's `if:` form;
  - `harness-control.yml`'s re-run or upgrade route;
  - which events `report` posts or withholds once a branch is stopped;
  - what `status` replies about the flow-progress ledger.

**Derivation entry D3 — the rule that a stop silences a job's report (command).**

```
git grep -nE "caused by stopping|overwrites .stopped.|stop already reported|nothing from a stopped job" -- docs cli/templates plugin README.md ARCHITECTURE.md
```

**Derivation entry D4 — statements that a ledger reads fully ticked (command).**

```
git grep -nE "every entry is ticked|Every entry of the flow-progress ledger|entry is ticked" -- docs cli/templates plugin README.md ARCHITECTURE.md
```

**Derivation entry D5 — the count and list of gates (command).** Case-insensitive, so a sentence-initial "Thirteen gates." is reached.

```
git grep -niE "thirteen gates|of the thirteen|gates 1, 2, 3, 4, 6, 11 and 13|5, 7, 8, 9, 10 and 12" -- docs scripts README.md ARCHITECTURE.md cli/README.md
```

**Derivation entry D6 — "What still owes a first recording" sentences (command).**

```
git grep -n "What still owes a first recording" -- docs
```

**Derivation entry D7 — enumerations of what `--check-github` asks (command).**

```
git grep -nE "gh workflow view|.--check-github. adds" -- docs README.md cli/README.md
```

**Derivation entry D8 — the four §8 rows that move (command).**

```
git grep -nE "^\| (A .delete. event's workflow runs from the default branch|The contents API serves a file at a commit no branch points at any more|A workflow can be dispatched from the default branch while its .branch. input names a deleted branch|A .pull_request. .closed. job runs the merge-commit copy of the workflow) \|" -- docs
```

**Derivation entry D9 — sites the task prompt names by heading (procedure).**
- **Artifact:** the task prompt, `harness-runs/task_prompts/fix_forge_run_control_gate12_round7_findings_task_prompt.md`.
- **Traversal:** in order, each item's `**Docs:**` line, then item 1's upgrade-path bullet, then item 4's numbered steps, then the `## Acceptance criteria` bullets.
- **Decision rule:** a file-plus-heading pair the prompt names is a site.

**Derivation entry D10 — conventions documents (procedure).**
- **Artifact:** the three `layers[].conventions` documents: `.claude/context/conventions.md`, `.claude/context/cli.md` and `.claude/context/plugin.md`.
- **Traversal:** each `##` section in file order.
- **Decision rule:** a sentence is reached when it enumerates the gates of `docs/development.md` → `## 5.`, or states `harness-control.yml`'s re-run route, what `report` posts after a stop, or what `status` replies.

**Derivation entry D11 — standing-artifact rows (procedure).**
- **First step, runnable:** `grep -nE "^## |^- " harness-runs/lessons.md`.
- **Artifact:** that standing ledger.
- **Traversal:** its topic headings in file order, then the one-line rules under each.
- **Decision rule:** a rule is reached when it names a workflow template, `report`, `status` or `doctor --check-github`. It reached none: no row was owed.

**Closure invariant:** every site that any entry above reaches appears as a row below.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/cli.md` → the re-run-contract row for `.github/workflows/harness-control.yml` ("`init --upgrade-workflows` leaves it … It needs no `.gitignore` line, because no upgrade ever `.bak`s it") | — | D1 | `change` | Task 10 |
| 2 | `docs/cli.md` → the `remote-execution` and `remote-github` paragraph ("`gh workflow view` for each workflow") | — | D1, D7 | `change` | Task 10 |
| 3 | `docs/github-issue-trigger.md` → **2. Write the trigger workflow.** ("Neither carries a version pin, so `init --upgrade-workflows` does not re-render them") | — | D1 | `change` | Task 10 |
| 4 | `docs/github-issue-trigger.md` → **6. Check the setup.** ("`--check-github` adds whether GitHub knows `harness-trigger.yml` and `harness-control.yml`") | — | D7 | `change` | Task 10 |
| 5 | `docs/remote-execution.md` → `### Upgrading` → "**It does not re-render `harness-trigger.yml` or `harness-control.yml`.**" | — | D1, D9 | `change` | Task 10 |
| 6 | `cli/templates/github/workflows/harness-control.yml` → `# THE PREFILTER.` paragraph | — | D2, D9 | `change` | Task 1 |
| 7 | `cli/templates/github/workflows/harness-control.yml` → `# TWO RULES EVERY EDIT KEEPS.` paragraph | — | D2 (the rule for a value's scalar form) | `change` | Task 1 |
| 8 | `cli/templates/github/workflows/harness-control.yml` → `# WHO WRITES IT.` paragraph ("`init --upgrade-workflows` does NOT re-render it") | — | D2, D9 | `change` | Task 2 |
| 9 | `cli/templates/scripts/remote-run.sh` header → the `` `report` TURNS A LIFECYCLE EVENT INTO ONE COMMENT `` paragraph ("`failed` posts nothing when `remote_branch_stopped` finds the branch stopped, so a cancelled job never overwrites `stopped`") | — | D2, D3 | `change` | Task 5 |
| 10 | `cli/templates/scripts/remote-run.sh` → `forge_report`'s own comment and its `report: $br was stopped, and the stop already reported the run; nothing posted` line | — | D3 | `change` | Task 5 (the comment widens to every job event; the log line's literal stays) |
| 11 | `cli/templates/scripts/remote-run.sh` header → `WHY RE-DISPATCH IS NOT LEFT TO `!cancelled()` ALONE` ("A listing that fails fails CLOSED in `continue`: nothing sent, one `paused` naming gh's error") | — | D2 | `no-change` | Still true: under Task 5 a failed listing still lets the `paused` report through |
| 12 | `cli/templates/scripts/remote-run.sh` header → the control paragraph's `status` sentence ("the next ledger entry (or that every entry is ticked, or that the ledger could not be read)") | — | D2, D4 | `change` | Task 6 |
| 13 | `cli/templates/scripts/remote-run.sh` → `control_ledger_next_var`'s comment ("both empty when every entry is ticked") | — | D4 | `no-change` | It describes the function's return, which Task 6 does not change |
| 14 | `cli/templates/scripts/remote-run.sh` → `control_status`'s `Every entry of the flow-progress ledger is ticked.` reply literal | — | D4 | `change` | Task 6 (the literal stays for a run that is not running and has no newer round) |
| 15 | `docs/development.md` → Gate 12 (xiv) leg (f) pass condition ("or that every entry is ticked") | — | D4 | `change` | Task 8 |
| 16 | `docs/development.md` → `## 5.` opening paragraph ("**Seven of the thirteen run unattended**") | — | D5, D9 | `change` | Task 8 |
| 17 | `scripts/run-gates.sh` header ("defines thirteen gates … gates 1, 2, 3, 4, 6, 11 and 13 … the six it cannot") | — | D5 | `change` | Task 7 |
| 18 | `scripts/run-gates.sh` → the `hand_run=` line ("gates 5, 7, 8, 9, 10 and 12 remain hand-run") | — | D5 | `no-change` | The hand-run set is unchanged; gate 14c's SKIPPED is appended conditionally, as 13d's is (Task 7) |
| 19 | `docs/development.md` → Gate 12 → round 5's "What still owes a first recording" sentence | — | D6 | `change` | Task 8 (removed: only round 7's sentence stands) |
| 20 | `docs/development.md` → Gate 12 → round 6's "What still owes a first recording" sentence | — | D6, D9 | `change` | Task 8 (removed) |
| 21 | `docs/development.md` → Gate 12 → `gh workflow view harness-resume.yml` (an (iii)-era setup command) | — | D7 | `no-change` | A hand-run command whose answer this branch does not change |
| 22 | `docs/github-run-control.md` → `## 8.` row "A `delete` event's workflow runs from the default branch" | — | D8, D9 | `change` | Task 9 (moved to *Verified in Gate 12 round 7*) |
| 23 | `docs/github-run-control.md` → `## 8.` row "The contents API serves a file at a commit no branch points at any more" | — | D8, D9 | `change` | Task 9 (moved) |
| 24 | `docs/github-run-control.md` → `## 8.` row "A workflow can be dispatched from the default branch while its `branch` input names a deleted branch" | — | D8, D9 | `change` | Task 9 (moved) |
| 25 | `docs/github-run-control.md` → `## 8.` row "A `pull_request` `closed` job runs the merge-commit copy of the workflow" | — | D8, D9 | `change` | Task 9 (moved) |
| 26 | `docs/github-run-control.md` → `## 8.` opening sentence ("round 6 (2026-10-02, CLI 0.6.0) observed the rows moved …") | — | D9 | `change` | Task 9 |
| 27 | `docs/github-run-control.md` → `## 5.` paragraph after the table ("A `failed` caused by stopping the run posts nothing, so it never overwrites `stopped`.") | — | D3, D9 | `change` | Task 9 |
| 28 | `docs/github-run-control.md` → `## 1.` → the `status` row and **Why `status` exists.** | — | D9 | `change` | Task 9 |
| 29 | `docs/github-run-control.md` → `## The GitHub entry point` → the "Upgrading, with `init --upgrade-workflows` or `init --force`" bullet | — | D9 | `change` | Task 9 (gains the 0.6.1 repair route) |
| 30 | `docs/development.md` → `## 5.` → a new **Gate 14** paragraph after Gate 13 | — | D9 (acceptance: "listed in `docs/development.md` → `## 5.`") | `change` | Task 8 |
| 31 | `docs/development.md` → Gate 12 → (xiv)'s setup, after the push and `gh label create sdlc-harness` | — | D9 | `change` | Task 8 |
| 32 | `docs/development.md` → Gate 12 → the Round 7 paragraph, after round 6's closing paragraph | — | D9 | `change` | Task 8 |
| 33 | `.claude/context/conventions.md` → `## The testing bar` → the bullet that lists §5's gates ("plugin and marketplace manifests under `--strict`, … and the example project") | — | D10 | `no-change` | A conventions document is never a task target. The new gate 14 leaves its list less complete (it already omits gates 10, 11 and 13), so this is raised in `## Corpus staleness` |
| 34 | `.claude/context/cli.md` and `.claude/context/plugin.md` | — | D10 (no sentence reached) | `no-change` | Neither enumerates the gates or states the control workflow's route, `report`'s stop rule or `status`'s reply |
| 35 | `docs/development.md` → `## 5. Verifying a change` → its opening sentence ("Thirteen gates. Run each **without a pipe** …") | — | D5 | `change` | Task 8 ("Thirteen gates." becomes "Fourteen gates.") |
