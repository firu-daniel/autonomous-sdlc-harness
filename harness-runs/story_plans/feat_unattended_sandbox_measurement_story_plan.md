# Story: The unattended sandbox probe and its hand-run gate (macOS legs)

## Context

This branch (sandbox3a) builds the tool that measures the unattended sandbox on macOS. It does **not** take the measurements and does **not** write the document of record. That is sandbox3c's job. The person who runs the gate records the results in `docs/sandbox-verification.md`. It delivers four things.

- **A probe a person runs by hand**, `scripts/sandbox-probe.sh`. It is a maintainer tool of this repository, beside `scripts/probe-plugin-cli.sh`. It is not a `cli/templates/` file and `init` never renders it.
- **One result line per leg.** The probe cuts a throwaway probe clone through `<main>/scripts/create-worktree.sh` and renders that clone's per-run profile with the watcher's own `run_profile_render` / `run_profile_check`. It launches sandboxed headless sessions on the watcher's launch line, following `docs/sandbox-verification.md` → `## 0. Method`, and prints one result line per leg.
- **A new hand-run gate**, **Gate 15**, in `docs/development.md` → `## 5. Verifying a change`, with its line in `scripts/run-gates.sh`'s hand-run list.
- **Every sentence that counts or names the gates is brought in line.**

**Constraints that bind every task.**

- No measured result is invented. Every row this branch adds says *not yet measured*.
- No profile, generator, wrapper, guard or watcher behaviour changes. The probe **sources** the watcher and the run library and **calls** the main checkout's wrappers. It never copies their logic and never edits them. A defect found while building the probe becomes a follow-up task prompt, never an edit here.
- No test launches `claude`.
- **A positive control in the same session for every refusal.** This is §0's method, quoted by the prompt's goal item 1. Every session that measures a refusal row also issues a positive control, after the calls it measures. The row prints `not run`, with evidence `control did not succeed: …`, when its control did not succeed. So a refusal the session itself caused (a broken launch, a wrapper that refuses everything, a dead proxy) never reads as `pass`.
  - Task 4's `sp_session` contract states the rule. Task 19's `controls.sh` carries it in `sp_row_result`. Each leg file names its own control call.
  - Wrapper controls aim at a **control clone** that is never planted or measured, so a control cannot move a ref the refusal row is judged by.
  - The one exception is `sp_row_result --direct`, used only where a `fail` is direct evidence of a protection breaking: a marker present, a host that answered, a write that landed. Such a `fail` is printed whatever the control did. A `pass` always needs its control.

**How the probe is laid out, and who owns which file.**

- `scripts/sandbox-probe.sh` is the entry point (Task 1). It sources a fixed, ordered list of files under `scripts/lib/sandbox-probe/`, and each file has exactly one owning task:
  - `core.sh` — Task 1: the leg table, the result line, the exit codes.
  - `preflight.sh` — Task 2: the refusals and the `shasum` guard.
  - `judge.sh` — Task 3: reads a stream and git state into a verdict.
  - `session.sh` — Task 4: the probe clone, per-run profile, launcher, scratch profiles and teardown.
  - `controls.sh` — Task 19: the positive controls, the control clone and the `not run` gate. It ships right after Task 4, at readiness position 5.
  - `legs-local.sh` — Task 5.
  - `legs-wrappers.sh` — Task 6.
  - `legs-refresh.sh` — Task 7.
  - `legs-planted.sh` — Task 8 (the `planted-config` leg).
  - `legs-planted-files.sh` — Task 9 (the `planted-files` leg).
  - `legs-protection.sh` — Task 10.
  - `legs-network.sh` — Task 11.
  - `legs-settings.sh` — Task 12.
- The probe's suites each have one owning task: `cli/test/sandbox-probe-judge.test.mjs` and its fixtures — Task 13; `cli/test/sandbox-probe-shell.test.mjs` — Task 14; `cli/test/sandbox-probe-git-and-legs.test.mjs` — Task 15.
- **A leg whose function is not defined yet prints `not run` for each of its rows** with the evidence `leg not implemented`. So the tree is coherent after every task.
- **The leg table in `core.sh` is the single declaration of leg → rows → expected result → where recorded.** Gate 15 in `docs/development.md` (Task 17) restates it for a reader. `bash scripts/sandbox-probe.sh --list` prints it, so the two are checked against each other.

**Cross-task interfaces, stated once.** Each per-task file restates the part it consumes.

- **Result line** (Task 1, `sp_result_line`), one line on stdout, fields in this order, values double-quoted:
  `leg="<leg>" row="<row id>" result="<pass|fail|not run>" evidence="<one line, quoted from the stream or git>" departure="<none|text>" claude="<version>"`
- **Judge outcomes** (Task 3): `ran`, `sandbox`, `permission`, `file-tool`, `network`, read off the four refusal shapes §0 and §4 record.
- **Session API** (Task 4): `sp_session`, `sp_prompt_bash`, `sp_prompt_tool`, `sp_scratch_profile`, `sp_extra_clone <branch> [--no-bootstrap] [--existing]`, `sp_track`, `sp_track_branch`, and the variables `SP_MAIN`, `SP_CLONE`, `SP_BRANCH`, `SP_RUN_PROFILE`, `SP_TMP`, `SP_VERSION`, `SP_DEFAULT_BRANCH`, `SP_STREAM`. `sp_extra_clone`'s default mode cuts a new branch (Tasks 8 and 9). Its `--existing` mode checks out a branch already in `<main>` and never pushes (Task 7's fixtures).
- **Control API** (Task 19): `sp_ctl_clone`, `sp_ctl_prepare <tag>`, `sp_ctl_add <prompt file> <commit|push|refresh|ran|written|tool> [<arg>…]`, `sp_ctl_held <stream>`, and `sp_row_result [--direct] <leg> <row> <verdict> <evidence> <departure>`, with the variables `SP_CTL_CLONE`, `SP_CTL_BRANCH`, `SP_CTL_OK` and `SP_CTL_EVIDENCE`.
- **One line per row id.** `row="<id>"` appears once in a run's output. CS4 is the `wrappers` leg's alone: its commit, push and refresh are one session (Task 6). R0 and R1 are two lines read off one call in fixture (a) (Task 7).

**The new row ids this branch defines** (Task 16 writes them; Tasks 1 and 17 name them):

| Rows | What they cover |
|---|---|
| P1b, P1c | The assignment prefix and the compound on `push-branch.sh` |
| SR1, SR2 | The scratch runner, and its mutation check |
| MC1 | The docs-retrieval MCP server |
| CS12–CS14 | Planted `objects/info/http-alternates`, `commondir` and `config.worktree` in the clone |
| CS15 | A key outside `hr_clone_config_spec`'s allow-list, planted in the clone's `.git/config` |
| N3, N4 | A hostname resolving only to loopback, and one resolving only to link-local |
| N5 | `allowed_domains` on a sandboxed call |
| RT1 | The `dangerouslyDisableSandbox` retry |
| S4, S5 | The token variables, and the SSH agent socket |
| RS1 | The clone's planted `.claude/settings.local.json` |
| HP1 | Headless parity |

C2, K2 and CW4 are re-targeted at the clone.

**Ship order, and why it departs from the configured layer order.**

1. Tasks 1–4, then Task 19, then Tasks 5–12 build the probe (`general`). Task 19 was added in a revision round, so its id is out of sequence. Its readiness position (5) is its ship order, and every leg task that consumes it ships after it.
2. Tasks 13–15 test it (`cli`).
3. Tasks 16–18 document the rows, the gate and the counts (`general`, catch-all last).

The configured order is `cli → plugin → general`, with the catch-all last. Here the `cli`-layer suites consume a `general`-layer script, so the dependency runs against the configured order. Shipping the tests first would make each depend on a later task, which the plan forbids. So the probe ships first, its suites second, and the catch-all's documentation last.

**Interpretations this plan takes rather than asks about.**

- **"The profile `doctor` grades is not the live one"** is read as two conditions:
  - the main checkout's own `node <main>/cli/dist/cli.js doctor` prints `PASS` for `profile-sandbox`, `profile-write-protection`, `profile-main-anchor` and `sandbox-prerequisites`;
  - the file it grades, `<main>/.claude/settings.autonomous.json`, is the watcher's `SETTINGS_PROFILE`.
- **The retrieval leg needs a `harness-docs` server in `<clone>/.mcp.json` or `<main>/.mcp.json`.** This repository's committed configuration wires no docs retrieval. With neither file, MC1 prints `not run` and names why, rather than provisioning retrieval.
- **The recorded stream fixtures are constructed in the recorded shape.** The real streams live outside every checkout, so the fixtures quote verbatim the refusal messages §0 and §4 record. Their shape follows `cli/test/fixtures/run-analytics-two-sessions.jsonl`, including its `@FIXTURE_ROOT@` placeholder, so gate 6a stays clean.
- **CS5 and CS6 are not this probe's; they stay hand rows.** The prompt's *Owed* bullet names CS1–CS8, but its leg list (goal item 2) names no leg for either. Neither fits the probe's one-clone, per-run-profile setup.
  - **CS5** measures a *legacy worktree run*: a linked worktree whose registry record carries no `copy_kind`, resumed by the watcher, so its per-run profile is rendered for the `worktree` kind. Such a run exists only where one was left from before the re-render. The probe never fabricates one, because the registry is the watcher's state and a run of that kind needs a watcher tick.
  - **CS6** measures a *job-mode-shaped session*: a fresh `git clone` outside the sibling glob, adopted with `HARNESS_SELF_ADOPT=1 … init --force`, launched on the base profile rather than a per-run one.
  - Gate 15 (Task 17) names both as hand rows, together with CS8 (b), the way it names sandbox3b's legs.
- **L1 cannot be reached on the clone layout, so it prints `not run` with the reason.** `push-branch.sh`'s clone arm, `hr_clone_target_check_var`, refuses any clone whose HEAD branch has no `clone` record in the run registry. It does so before the `branch '<b>' starts with '-'` check. `hr_clone_create_var`, the only route to such a record, refuses a branch starting with `-`. A clone switched to `-sbxdash` would therefore pass on the wrong refusal. Task 9 records L1 as unreachable, and its 2026-10-14 worktree result stands.

**Top risks:**

- **N5, the `allowed_domains` leg.** It is the leg that matters most. A judge that reads "not refused" as `pass` would hide a self-widening allowlist. Task 3's `sp_judge_allowed_domains` in `judge.sh` is the single home of N5's rule: `fail` exactly when the host answered, and `not run` when the call carried no `allowed_domains`. Task 11's leg calls it. Task 13 pins all three arms against fixtures through `judge allowed-domains`.
- **A probe that leaves something behind or touches the main checkout.**
  - Task 4's teardown runs on every exit path. It removes only what the probe created: the clones, their registry records, their per-run profiles, the branches local and on origin, and the tracked files.
  - Task 2's `shasum` guard over `harness.config.json`, `.git/config` and `settings.autonomous.json` fails loudly on any change. Task 14 drives that guard. Task 7's fixture branches are the one write to `<main>`, and they are refs only.
- **A refusal the session caused, read as `pass`.** Task 19's `sp_row_result` is the only route a refusal row's `pass` takes. It prints `not run` unless that session's control held, and each leg's Verification checks that its refusal rows go through it.
- **Drift between the probe's leg table and Gate 15's table.** Task 17 builds its table from `--list` output, and its verification compares the two line for line.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.**

- The orchestrator walks the `[ ]` entries below top-to-bottom.
- **Only the committing role flips a marker to `[x]`:**
  - the `committer` agent, in every flow that dispatches one;
  - the orchestrator itself, in the supervised flow, which dispatches none.
- No implementer changes a marker, or edits any other line of this section, in an index a run is iterating.
- `[ ]` markers elsewhere, such as the sub-step bullets in per-task files, are informational only. The committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/feat_unattended_sandbox_measurement/task_<K>_plan.md`.

1. [x] **Task 1** — Add the probe's entry point `scripts/sandbox-probe.sh` and its core library: leg table, result line, exit codes _(layer: general)_ _(points: 15)_
2. [x] **Task 2** — Add the probe's preflight refusals and the `shasum` guard over the main checkout's three files _(layer: general)_ _(points: 15)_
3. [x] **Task 3** — Add the probe's judge: stream-json calls, the refusing layer, pushes by `ls-remote`, commits by ref _(layer: general)_ _(points: 20)_
4. [x] **Task 4** — Add the probe clone, its per-run profile, the session launcher, scratch profiles and the every-exit teardown _(layer: general)_ _(points: 20)_
5. [x] **Task 19** — Add the probe's positive controls: the control clone, the control calls and the `not run` gate _(layer: general)_ _(points: 15)_
6. [x] **Task 5** — Add the gates, mktemp, scratch and retrieval legs _(layer: general)_ _(points: 15)_
7. [x] **Task 6** — Add the wrappers leg: commit, push, the clone's own copies, the compound and the assignment prefix _(layer: general)_ _(points: 20)_
8. [x] **Task 7** — Add the wrappers-refresh leg: fast-forward, two-parent merge and conflict fixtures on the clone arm _(layer: general)_ _(points: 15)_
9. [x] **Task 8** — Add the planted-configuration leg: scratch repositories and the clone's `.git/config` _(layer: general)_ _(points: 15)_
10. [x] **Task 9** — Add the planted-files leg: the clone's `.git` files and the dash-leading names _(layer: general)_ _(points: 15)_
11. [x] **Task 10** — Add the write-protection and git-in-the-clone legs _(layer: general)_ _(points: 20)_
12. [x] **Task 11** — Add the network and retry legs, `allowed_domains` included _(layer: general)_ _(points: 15)_
13. [ ] **Task 12** — Add the repo-settings, credentials, invalid-profile and headless-parity legs _(layer: general)_ _(points: 20)_
14. [ ] **Task 13** — Test the probe's judge against recorded stream fixtures _(layer: cli)_ _(points: 20)_
15. [ ] **Task 14** — Test the probe's preflight refusals and its `shasum` guard _(layer: cli)_ _(points: 15)_
16. [ ] **Task 15** — Test the probe's git judges and its leg table _(layer: cli)_ _(points: 15)_
17. [ ] **Task 16** — Add the probe's new rows to `docs/sandbox-verification.md`, re-target C2, K2 and CW4, and name the probe in §0 _(layer: general)_ _(points: 20)_
18. [ ] **Task 17** — Document Gate 15 in `docs/development.md` §5 _(layer: general)_ _(points: 20)_
19. [ ] **Task 18** — Bring every gate count and hand-run list in line with fifteen gates _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Any sentence that counts the gates, or names the hand-run gates, is brought in line, including the supply-chain audit's statement of how many gates it leaves unchanged. Find them with a search you record, so the scope can be re-derived."* A second predicate governs the record's rows: *"Each leg names the row or rows in `docs/sandbox-verification.md` it measures, so its result goes into that row. A leg with no row yet gets a new row id there, defined by this branch with its check and its expected result and marked *not yet measured*."*

**Derivation entry 1 — gate-count sentences (command).** Re-run verbatim from the checkout root:
`git grep -nIiE '(^|[^a-z])(six|seven|eight|thirteen|fourteen|fifteen)[^.|]{1,40}gates' -- ':!harness-runs' ':!examples/notes-app/sdlc-harness'`

**Derivation entry 2 — hand-run lists and the audit's statement (command).** Re-run verbatim:
`git grep -nIiE 'gates? 5, 7, 8, 9, 10|hand-run gates?|gates this script cannot run|remain hand-run|run-gates\.sh[^ ]{0,3}s (six|seven|eight|fourteen|fifteen)' -- ':!harness-runs' ':!examples/notes-app/sdlc-harness'`

**Derivation entry 3 — counts split across a line break (command).** Re-run verbatim:
`git grep -nIiE '(one|two|three|four|five|six|seven|eight|nine) (automatable|hand-run|unattended)' -- ':!harness-runs' ':!examples/notes-app/sdlc-harness'`

**Derivation entry 4 — the record's rows (procedure).**
- **Artifact:** `docs/sandbox-verification.md`.
- **Traversal:** walk every table under every `##` and `###` heading, in file order, reading each row's first (`#`) cell.
- **Decision rule:** a row is reached when its id is named in the task prompt's `## The goal` item 2, or in its *Owed, and what this probe exists to take* bullet. A range the prompt names (`CS1–CS8`, `R0–R4`, `W6–W8`) reaches every id inside it.
- **Dispositions:**
  - a reached row the prompt re-targets is `change`;
  - a reached row whose result the person writes later is `no-change`;
  - a reached row no leg measures is `no-change`, its reason naming why and where it is measured instead;
  - every id the prompt's legs name, or that a leg needs minted, which the file does not yet carry, is a new row, `change`.
- **Non-row sites:** the three prose sites the probe must be named in (`Who reads this`, §0, the §3 owed note) are added as rows by plan decision.

**Derivation entry 5 — standing ledger (procedure).**
- **First step, runnable:** `grep -nE '^## |^- ' harness-runs/lessons.md`.
- **Artifact:** that ledger.
- **Traversal:** topic headings in file order, then each rule under its heading.
- **Decision rule:** a rule is reached when it names a temporary working copy or branch, a measurement or gate, or a command an adopter runs.

**Closure invariant:** every site any derivation entry reaches appears as a row below.

**Re-derived when Task 19 was added (revision for `task_plan_reviews/…/review_1.md`).** Entries 1–3 were re-run verbatim, and every hit is a row below. Entries 4 and 5 reach the same sites, because the revision adds no row id and no ledger rule. Task 19's only target, `scripts/lib/sandbox-probe/controls.sh`, is application source, not durable corpus text, so it adds no register row. The R0 and CS4 changes (Tasks 6–7) move where each row is measured and leave rows 21 and 22's dispositions as they are.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/development.md` → `## 5. Verifying a change`, "Fourteen gates." | — | entry 1, `Fourteen … gates` | `change` | Task 18 |
| 2 | `docs/development.md` → `## 5`, "**Eight of the fourteen run unattended** … the remaining six, gates 5, 7, 8, 9, 10 and 12" | — | entries 1 and 2 | `change` | Task 18 |
| 3 | `docs/development.md` → `## 8. The nightly supply-chain audit`, "changes none of `scripts/run-gates.sh`'s fourteen" | — | entry 2 | `change` | Task 18 |
| 4 | `docs/guard-verification.md` → "all fourteen conditions and the three single-guard gates" | — | entry 1 | `no-change` | counts a guard's fail-closed conditions, not §5's gates |
| 5 | `scripts/run-gates.sh` header, "`docs/development.md` §5 defines fourteen gates … reports the six it cannot" | — | entry 1 | `change` | Task 18 |
| 6 | `scripts/run-gates.sh` header, "reported BLOCKED with the hand-run gates where they are not" | — | entry 2 | `no-change` | names the list, counts nothing |
| 7 | `scripts/run-gates.sh` header, "the other six automatable gates' worth of silence" | — | entry 3 | `no-change` | counts **automatable** gates, which gate 15 (hand-run) does not join, so this branch's fifteenth gate leaves it untouched. Its apparent off-by-one against the eight the same header names is pre-existing and unrelated; raised as an observation for a follow-up, not edited here (the no-behaviour-change constraint) |
| 8 | `scripts/run-gates.sh` → the `== gates this script cannot run` block | — | entry 2 | `change` | Task 18 — gains gate 15's line |
| 9 | `scripts/run-gates.sh` → `hand_run="gates 5, 7, 8, 9, 10 and 12 remain hand-run"` | — | entry 2 | `change` | Task 18 |
| 10 | `cli/src/commands/init.ts` doc comment, "waits on the hand-run gate" | — | entry 2 | `no-change` | one named gate, no count |
| 11 | `cli/test/init.test.mjs` header, "covered by the hand-run gate in" | — | entry 2 | `no-change` | one named gate, no count |
| 12 | `docs/analyze.md` → "(e)", "than in a hand-run gate" | — | entry 2 | `no-change` | generic noun, no count |
| 13 | `docs/cli.md`, "waits on the hand-run gate" | — | entry 2 | `no-change` | one named gate, no count |
| 14 | `.claude/context/conventions.md` → `## The testing bar`, "**The full bar is `docs/development.md` → `## 5. Verifying a change`**, whose gates are …" | — | plan decision; it enumerates the gates by name | `no-change` | conventions document, never a task target; it already lists gates 1–9 only. Raised in `## Corpus staleness` |
| 15 | `docs/sandbox-verification.md` → the opening **Who reads this** paragraph | — | plan decision | `change` | Task 16 — names the probe and Gate 15 |
| 16 | `docs/sandbox-verification.md` → `## 0. Method` | — | plan decision | `change` | Task 16 — the probe paragraph |
| 17 | `docs/sandbox-verification.md` → `## 3. The wrappers`, the **Owed a re-run.** paragraph | — | plan decision | `change` | Task 16 — P1b and P1c are no longer "owed new rows"; names the clone-layout re-measurement of P3, R4, R0–R3 |
| 18 | row T2 | — | entry 4, goal item 2 *gates* | `no-change` | the gates leg's result goes into its Observed cell, by the person |
| 19 | row TD2 | — | entry 4 | `no-change` | as row 18 |
| 20 | rows W6, W7, W8 | — | entry 4, Owed bullet | `no-change` | as row 18; W7 is the gates leg's, W6/W8 the write-protection leg's |
| 21 | rows CS1, CS2, CS3, CS4, CS7, CS8 | — | entry 4 | `no-change` | as row 18; CS8 (b) stays a hand row, named in Gate 15 (Task 17) |
| 22 | rows R0, R1, R2, R3, R4 | — | entry 4 | `no-change` | as row 18; the layout note is row 17's |
| 23 | rows P3, CW2, CW5, CW6 | — | entry 4 | `no-change` | as row 18 |
| 24 | rows C1, CW3, L2 | — | entry 4 | `no-change` | as row 18 |
| 25 | row C2 | — | entry 4, "Re-target the worktree rows C2, K2 and CW4 at the clone" | `change` | Task 16 |
| 26 | row K2 | — | entry 4 | `change` | Task 16 |
| 27 | row CW4 | — | entry 4 | `change` | Task 16 |
| 28 | rows N1, N2 | — | entry 4 | `no-change` | re-measurement goes beside the recorded result, never over it |
| 29 | rows S1, S2 | — | entry 4 | `no-change` | as row 28 |
| 30 | rows CL5, CL6 | — | entry 4, goal item 2 cites them | `no-change` | CL5's re-measurement goes beside it as row 28; CL6 is cited as method only |
| 31 | new rows P1b, P1c (§3) | — | entry 4, ids the legs name | `change` | Task 16 |
| 32 | new rows SR1, SR2, MC1 (§4) | — | entry 4, the scratch and retrieval legs | `change` | Task 16 |
| 33 | new rows CS12, CS13, CS14 (§2 clone layout) | — | entry 4, the planted-configuration leg | `change` | Task 16 |
| 34 | new rows N3, N4, N5, RT1 (§4) | — | entry 4, the network and retry legs | `change` | Task 16 |
| 35 | new rows S4, S5 (§4) | — | entry 4, the credentials leg | `change` | Task 16 |
| 36 | new rows RS1, HP1 (§4) | — | entry 4, the repo-settings and headless-parity legs | `change` | Task 16 |
| 37 | `harness-runs/lessons.md` → *"A script that creates a temporary working copy or branch removes it on every exit path…"* | — | entry 5 | `no-change` | a constraint Task 4 satisfies; the ledger is not edited |
| 38 | `harness-runs/lessons.md` → *"A feature that ships as "not yet measured" ships the seam…"* | — | entry 5 | `no-change` | this branch is that seam; nothing to edit |
| 39 | `harness-runs/lessons.md` → *"A wall-clock figure in a document of record is never one a run measured inside its own session…"* | — | entry 5 | `no-change` | no figure is recorded by this branch |
| 40 | `harness-runs/lessons.md` → *"Every command an adopter is meant to run sits in a fenced block, one command per line…"* | — | entry 5 | `no-change` | Task 17 applies it to Gate 15's commands |
| 41 | `harness-runs/lessons.md` → *"A command scoped to one branch reads and writes that branch's state only…"* | — | entry 5 | `no-change` | a constraint Tasks 4 and 7 satisfy |
| 42 | `harness-runs/lessons.md` → *"A figure measured under a test stub or a fixture-sized corpus never justifies a design decision…"* | — | entry 5 | `no-change` | no decision is made on a stub figure |
| 43 | `harness-runs/lessons.md` → *"Every automatic retry in an unattended path is bounded…"* | — | entry 5 | `no-change` | the probe makes one exact call per probe and retries nothing |
| 44 | row L1 | — | entry 4, Owed bullet | `no-change` | unreachable on the clone layout: `push-branch.sh`'s clone arm refuses a clone with no registry record for its HEAD branch before the dash check, and `hr_clone_create_var` refuses to cut a dash-leading clone. Task 9's `planted-files` leg prints `not run` with that reason; the 2026-10-14 worktree result stands (`## Context` → *Interpretations*) |
| 45 | row CS5 | — | entry 4, Owed bullet (`CS1–CS8`) | `no-change` | not this probe's: needs a legacy worktree run resumed by the watcher, which the probe never fabricates; stays a hand row, named in Gate 15 by Task 17 (`## Context` → *Interpretations*) |
| 46 | row CS6 | — | entry 4, Owed bullet (`CS1–CS8`) | `no-change` | not this probe's: needs a job-mode clone outside the sibling glob, adopted with `init --force`, on the base profile; the prompt's leg list names no leg for it; stays a hand row, named in Gate 15 by Task 17 (`## Context` → *Interpretations*) |
| 47 | new row CS15 (§2 clone layout) | — | entry 4, the planted-configuration leg's off-allow-list key, minted because the prompt names no id for it | `change` | Task 16 writes it; Task 8's `planted-config` leg measures it |

## Corpus staleness

A recommendation, never a task. No readiness entry, per-task file or story points belong to it.

- `stale-rule` — **Site:** `.claude/context/conventions.md` → `## The testing bar`, the sentence *"**The full bar is `docs/development.md` → `## 5. Verifying a change`**, whose gates are …"* (Scope register row 14). **Stale content:** the gate list it gives. It already names gates 1–9 only, against §5's fourteen. Once Task 17 adds Gate 15, the gap is fifteen. **Route:** a supervised `/autonomous-sdlc-harness:harness-analyze .claude/context/conventions.md` re-run, or a hand edit. It would restate the sentence to point at §5 for the list, or to list all fifteen gates, Gate 15 the hand-run sandbox probe among them. A conventions document is never this branch's target.
