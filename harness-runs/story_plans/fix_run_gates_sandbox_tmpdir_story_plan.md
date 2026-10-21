# Story: Temporary files the unattended sandbox can write — `run-gates.sh` and the outer-loop scripts

## Context

This branch makes `scripts/run-gates.sh`, and so `scripts/test.sh` (`commands.test`), run inside the unattended sandbox. `docs/sandbox-verification.md` → `## 5. Failures and their follow-ups` → row F2 records that every status-graded gate fails sandboxed on macOS (`run-gates: 24 failed, 4 passed`). The script creates its log with `log="$(mktemp -t harness-gates)"`, and macOS `mktemp -t` ignores `TMPDIR`. It always writes under the per-user `/var/folders/…/T`, which the sandbox refuses (`mkstemp failed on /var/folders/…/T/harness-gates.…: Operation not permitted`). The sandbox's own `TMPDIR`, `/tmp/claude-501`, is writable. The same call also fails on Linux, even unsandboxed: GNU `mktemp` needs at least three `X`s in a template (the task prompt's 2026-10-21 `debian:stable-slim` measurement, GNU coreutils 9.7: `mktemp: too few X's in template 'harness-gates'`).

**The fix, used for every changed call:** an explicit template under `${TMPDIR:-/tmp}`. A file becomes `mktemp "${TMPDIR:-/tmp}/<name>.XXXXXX"` and a directory becomes `mktemp -d "${TMPDIR:-/tmp}/<name>.XXXXXX"`. BSD and GNU `mktemp` both accept this form. It is the form `cli/templates/scripts/lib/harness-run-lib.sh` (`hr_commit_placed`'s `hr-commit-index.XXXXXX`) and `cli/templates/scripts/commit-on-branch.sh` (`commit-on-branch.XXXXXX`) already use. `${TMPDIR:-/tmp}` falls back to `/tmp` when `TMPDIR` is unset or empty. macOS's trailing slash on `TMPDIR` gives a doubled separator, which is harmless and is what the library's existing calls already produce. Each changed call keeps its existing `||` fallback and its existing removal (`trap`, `rm -f`, `rmdir`, `rm -rf`) exactly as they are. That keeps `<state_dir>/lessons.md`'s rule: *"A script that creates a temporary working copy or branch removes it on every exit path…"*.

**Does macOS bare `mktemp` honour `TMPDIR`? It does not, so the bare calls get the same fix.** This plan's writer measured it on 2026-10-21, unsandboxed, on macOS 15.7.4. The session's own `TMPDIR` was the per-user `/var/folders/…/T/`. With `export TMPDIR=<dir>` set to a writable scratch directory:

- `mktemp` gave `/var/folders/…/T/tmp.<suffix>`;
- `mktemp -d` gave `/var/folders/…/T/tmp.<suffix>`;
- `mktemp -t harness-gates` gave `/var/folders/…/T/harness-gates.<suffix>`;
- only `mktemp "${TMPDIR:-/tmp}/harness-gates.XXXXXX"` gave `<dir>/harness-gates.<suffix>`.

The sandbox limits where a write may land. It does not change which directory `mktemp` picks. So a bare call that ignores `TMPDIR` unsandboxed ignores it sandboxed too, and fails as F2 does. That is why the bare calls in `remote-run.sh`, `publish-main.sh` and `release.sh` are changed rather than left alone. The task prompt's "if it does, no change" branch does not arise. Task 3 re-takes this measurement for the record. The sandboxed measurement, and the sandboxed re-run of the gates row, are taken by a person (below). A run cannot launch a sandboxed session under the profile it measures, as `docs/sandbox-verification.md` says for every owed row.

**The work, in three single-layer tasks, in the configured ship order with the catch-all last.**

- **Task 1** (`cli`) changes the shipped template `cli/templates/scripts/remote-run.sh`, the 14 bare calls. It also adds a source-guard test over every shipped script under `cli/templates/scripts/`.
- **Task 2** (`general`) changes this repository's own hand-written scripts: `scripts/run-gates.sh` (the headline fix), `scripts/publish-main.sh` and `scripts/release.sh`. It also brings `scripts/remote-run.sh`, this repository's byte-for-byte copy of the template, level with Task 1's edit.
- **Task 3** (`general`) records the measurements and the new owed and not-run rows in `docs/sandbox-verification.md`.

**The sweep's other findings, settled below in `## Scope register`.** The hard-coded temporary paths a sandboxed caller reaches already honour `TMPDIR`:

- `${TMPDIR:-/tmp}` in `autonomous-watcher.sh`, `commit-on-branch.sh`, `lib/harness-run-lib.sh` and `start-dev-server.sh`;
- `scripts/measure-suite.sh`'s `tmp_base`;
- the Node `os.tmpdir()` call in `scripts/check-rendered-workflows.mjs`.

Every other `mktemp` call already has an explicit template beside its target. `plugin/` has no `mktemp` call at all. Its two `/tmp` mentions are prose, and no command reads them.

**Top risks:** The first risk is a missed call site: one bare `mktemp` left in a shipped script keeps an adopter's sandboxed run failing exactly as F2 does. Three things guard against it. The register's first derivation command must return no hits at the end. Task 1's source-guard test fails on any bare or `-t` call a later change adds to `cli/templates/scripts/`. And Task 2 re-runs that derivation over all three trees. The second risk is drift between the template and this repository's copy of `remote-run.sh`, which `init --force` would otherwise "fix" in the wrong direction. Task 2 is verified by `cmp` of the two copies. The third risk is a record that claims a sandboxed or Linux result nobody took. Task 3 writes every sandboxed macOS row as **not run — owed** and every Linux row as **not run**, never inferred from macOS. One side effect to expect: a temporary file a call used to leave under macOS's per-user directory now lands under the caller's `TMPDIR`. The `remote-run.sh` status cases in `cli/test/remote-run.test.mjs` set `TMPDIR` and assert it is left empty. That is why every removal stays exactly as it is.

**Manual setup required:**

1. **The sandboxed macOS `mktemp` row (Task 3's TD2).** A person launches the sandboxed session per `docs/sandbox-verification.md` → `## 0. Method` and takes the four exact `mktemp` calls the row names, then fills its Observed and Verdict cells. No task depends on it.
2. **The sandboxed gates re-run (Task 3's T2), on this branch's final tree.** A person launches `bash scripts/test.sh` as one exact call. The launch line is the one `docs/sandbox-verification.md` → `### The clone layout (owed)` gives, with cwd = a run copy on this branch. The person fills T2. Any gate that still fails only sandboxed becomes its own new row, with an F row and a follow-up. No task depends on it.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. **Only the committing role flips a marker to `[x]`.** That is the `committer` agent in every flow that dispatches one, and the orchestrator itself in the supervised flow, which dispatches none. In an index a run is iterating, no implementer changes a marker or edits any other line of this section. `[ ]` markers anywhere else, such as sub-step bullets in the per-task files, are informational progress markers only. They are never the iteration source, and the committer never touches them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_run_gates_sandbox_tmpdir/task_<K>_plan.md`. They are ordered bottom-up by ship sequence, in the configured layer order, with the catch-all layer last.

1. [x] **Task 1** — Give every bare `mktemp` in the shipped `remote-run.sh` template an explicit `${TMPDIR:-/tmp}` template, and guard the shipped scripts against a bare or `-t` call _(layer: cli)_ _(points: 15)_
2. [x] **Task 2** — Create `run-gates.sh`'s log, and the temporaries of `publish-main.sh`, `release.sh` and this repository's `remote-run.sh`, under `${TMPDIR:-/tmp}` _(layer: general)_ _(points: 10)_
3. [ ] **Task 3** — Record the `mktemp` measurements and the owed sandboxed gates re-run in `docs/sandbox-verification.md` _(layer: general)_ _(points: 10)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"Sweep `cli/templates/scripts/`, `scripts/` and `plugin/` for every other `mktemp -t`, every bare `mktemp` or `mktemp -d` with no template, and every hard-coded temp path a sandboxed caller reaches, and fix each one the same way."* The predicate's own record target is the goal's *"record the result"* and *"Re-run the gates row"*, both in `docs/sandbox-verification.md`.

**Derivation entry D1: bare and `-t` `mktemp` calls (command).** Re-run verbatim from the repository root. Lines whose first non-blank character is `#` are excluded: those are the hand-run `REPRO` examples in header comments, which no sandboxed caller executes.

`git grep -nE '^[^#]*(\$\(mktemp( -[dq]+)?\)|mktemp -t)' -- cli/templates/scripts scripts plugin`

**Derivation entry D2: hard-coded temporary paths (command).** Re-run verbatim. The same comment exclusion applies.

`git grep -nE '^[^#]*(/tmp|/var/folders|/private/var)' -- cli/templates/scripts scripts plugin`

**Derivation entry D3: corpus text stating the defect or the gates row (command).** Re-run verbatim.

`git grep -nE 'mktemp -t|harness-gates|run-gates[^ ]* fails|§5 F2|\| F2 \||: F2' -- docs README.md ROADMAP.md ARCHITECTURE.md CONTRIBUTING.md`

**Derivation entry D4: standing state-dir artifacts (procedure).**

- **First step, runnable:** `grep -nE 'mktemp|TMPDIR|run-gates|temporary' harness-runs/lessons.md harness-runs/improvement_suggestions.md`.
- **Artifact:** those two standing files under `harness-runs/`.
- **Traversal:** each file's headings in file order, then the one-line rules or entries under each.
- **Decision rule:** an entry is reached when it states a rule about creating or removing temporary files, about `TMPDIR`, or about `scripts/run-gates.sh`.

**Closure invariant:** every site that each derivation entry reaches appears as a row below. At the end of Task 2, D1 re-run over the final tree reaches no site at all: every row it reaches here is `change`.

`Copy` is `template` for a file under `cli/templates/scripts/`, `scripts copy` for this repository's byte-for-byte copy of that template under `scripts/`, and `—` for a file with no mirrored counterpart.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `cli/templates/scripts/remote-run.sh` (`gh_run`): `errfile=$(mktemp)` | template | D1, bare `mktemp` | `change` | Task 1 |
| 2 | `cli/templates/scripts/remote-run.sh` (`status_from_github`): `status_tmp=$(mktemp -d)` | template | D1, bare `mktemp -d` | `change` | Task 1 |
| 3 | `cli/templates/scripts/remote-run.sh` (`remote_branch_exists`): `errfile=$(mktemp)` | template | D1, bare `mktemp` | `change` | Task 1 |
| 4 | `cli/templates/scripts/remote-run.sh` (`redispatch`): `errfile=$(mktemp)` | template | D1, bare `mktemp` | `change` | Task 1 |
| 5 | `cli/templates/scripts/remote-run.sh` (`verb_trigger`): `trigger_tmp=$(mktemp -d)` | template | D1, bare `mktemp -d` | `change` | Task 1 |
| 6 | `cli/templates/scripts/remote-run.sh` (`forge_report`): `tmp=$(mktemp -d)` | template | D1, bare `mktemp -d` | `change` | Task 1 |
| 7 | `cli/templates/scripts/remote-run.sh` (`forge_progress`): `tmp=$(mktemp -d)` | template | D1, bare `mktemp -d` | `change` | Task 1 |
| 8 | `cli/templates/scripts/remote-run.sh` (`forge_progress_stopped`): `tmp=$(mktemp -d)` | template | D1, bare `mktemp -d` | `change` | Task 1 |
| 9 | `cli/templates/scripts/remote-run.sh` (`forge_open_pr`): `tmp=$(mktemp -d)` | template | D1, bare `mktemp -d` | `change` | Task 1 |
| 10 | `cli/templates/scripts/remote-run.sh` (`verb_deliver`): `tmp=$(mktemp -d)` | template | D1, bare `mktemp -d` | `change` | Task 1 |
| 11 | `cli/templates/scripts/remote-run.sh` (`verb_open`): `tmp=$(mktemp -d)` | template | D1, bare `mktemp -d` | `change` | Task 1 |
| 12 | `cli/templates/scripts/remote-run.sh` (`round_collect`): `if ! tmp=$(mktemp -d)` | template | D1, bare `mktemp -d` | `change` | Task 1 |
| 13 | `cli/templates/scripts/remote-run.sh` (`verb_control`): `control_tmp=$(mktemp -d)` | template | D1, bare `mktemp -d` | `change` | Task 1 |
| 14 | `cli/templates/scripts/remote-run.sh` (`verb_collect`): `control_tmp=$(mktemp -d)` | template | D1, bare `mktemp -d` | `change` | Task 1 |
| 15 | `scripts/remote-run.sh` (`gh_run`): `errfile=$(mktemp)` | scripts copy | D1, bare `mktemp` | `change` | Task 2 |
| 16 | `scripts/remote-run.sh` (`status_from_github`): `status_tmp=$(mktemp -d)` | scripts copy | D1, bare `mktemp -d` | `change` | Task 2 |
| 17 | `scripts/remote-run.sh` (`remote_branch_exists`): `errfile=$(mktemp)` | scripts copy | D1, bare `mktemp` | `change` | Task 2 |
| 18 | `scripts/remote-run.sh` (`redispatch`): `errfile=$(mktemp)` | scripts copy | D1, bare `mktemp` | `change` | Task 2 |
| 19 | `scripts/remote-run.sh` (`verb_trigger`): `trigger_tmp=$(mktemp -d)` | scripts copy | D1, bare `mktemp -d` | `change` | Task 2 |
| 20 | `scripts/remote-run.sh` (`forge_report`): `tmp=$(mktemp -d)` | scripts copy | D1, bare `mktemp -d` | `change` | Task 2 |
| 21 | `scripts/remote-run.sh` (`forge_progress`): `tmp=$(mktemp -d)` | scripts copy | D1, bare `mktemp -d` | `change` | Task 2 |
| 22 | `scripts/remote-run.sh` (`forge_progress_stopped`): `tmp=$(mktemp -d)` | scripts copy | D1, bare `mktemp -d` | `change` | Task 2 |
| 23 | `scripts/remote-run.sh` (`forge_open_pr`): `tmp=$(mktemp -d)` | scripts copy | D1, bare `mktemp -d` | `change` | Task 2 |
| 24 | `scripts/remote-run.sh` (`verb_deliver`): `tmp=$(mktemp -d)` | scripts copy | D1, bare `mktemp -d` | `change` | Task 2 |
| 25 | `scripts/remote-run.sh` (`verb_open`): `tmp=$(mktemp -d)` | scripts copy | D1, bare `mktemp -d` | `change` | Task 2 |
| 26 | `scripts/remote-run.sh` (`round_collect`): `if ! tmp=$(mktemp -d)` | scripts copy | D1, bare `mktemp -d` | `change` | Task 2 |
| 27 | `scripts/remote-run.sh` (`verb_control`): `control_tmp=$(mktemp -d)` | scripts copy | D1, bare `mktemp -d` | `change` | Task 2 |
| 28 | `scripts/remote-run.sh` (`verb_collect`): `control_tmp=$(mktemp -d)` | scripts copy | D1, bare `mktemp -d` | `change` | Task 2 |
| 29 | `scripts/run-gates.sh`: `log="$(mktemp -t harness-gates)"` | — | D1, `mktemp -t` | `change` | Task 2 |
| 30 | `scripts/publish-main.sh` (`--- The tree ---` block): `tmp_dir="$(mktemp -d)"` | — | D1, bare `mktemp -d` | `change` | Task 2 |
| 31 | `scripts/release.sh` (`--- 1. Bump ---` block): `worktree="$(mktemp -d)"` | — | D1, bare `mktemp -d` | `change` | Task 2 |
| 32 | `cli/templates/scripts/autonomous-watcher.sh`: `mktemp -d "${TMPDIR:-/tmp}/watcher-job-surfaces.XXXXXX"` | template | D2, `/tmp` | `no-change` | already an explicit template under `${TMPDIR:-/tmp}`, the target form |
| 33 | `scripts/autonomous-watcher.sh`: `watcher-job-surfaces.XXXXXX` | scripts copy | D2, `/tmp` | `no-change` | as row 32 |
| 34 | `cli/templates/scripts/commit-on-branch.sh`: `mktemp -d "${TMPDIR:-/tmp}/commit-on-branch.XXXXXX"` | template | D2, `/tmp` | `no-change` | as row 32 |
| 35 | `scripts/commit-on-branch.sh`: `commit-on-branch.XXXXXX` | scripts copy | D2, `/tmp` | `no-change` | as row 32 |
| 36 | `cli/templates/scripts/lib/harness-run-lib.sh`: `mktemp -d "${TMPDIR:-/tmp}/hr-surface-index.XXXXXX"` | template | D2, `/tmp` | `no-change` | as row 32 |
| 37 | `scripts/lib/harness-run-lib.sh`: `hr-surface-index.XXXXXX` | scripts copy | D2, `/tmp` | `no-change` | as row 32 |
| 38 | `cli/templates/scripts/lib/harness-run-lib.sh` (`hr_commit_placed`): `mktemp -d "${TMPDIR:-/tmp}/hr-commit-index.XXXXXX"` | template | D2, `/tmp` | `no-change` | as row 32 |
| 39 | `scripts/lib/harness-run-lib.sh` (`hr_commit_placed`): `hr-commit-index.XXXXXX` | scripts copy | D2, `/tmp` | `no-change` | as row 32 |
| 40 | `cli/templates/scripts/lib/harness-run-lib.sh`: `mktemp -d "${TMPDIR:-/tmp}/hr-remote-state.XXXXXX"` | template | D2, `/tmp` | `no-change` | as row 32 |
| 41 | `scripts/lib/harness-run-lib.sh`: `hr-remote-state.XXXXXX` | scripts copy | D2, `/tmp` | `no-change` | as row 32 |
| 42 | `cli/templates/scripts/start-dev-server.sh`: `tmp_dir="${TMPDIR:-/tmp}"` | template | D2, `/tmp` | `no-change` | the log path is built from `TMPDIR` with `/tmp` only as the unset fallback, so it already lands where the sandbox can write. This repository renders no copy of it (`phases.qa` is `false`) |
| 43 | `scripts/measure-suite.sh` (`make_work_dir`): `local tmp_base="${TMPDIR:-/tmp}"` | — | D2, `/tmp` | `no-change` | already `mktemp -d "${tmp_base%/}/measure-suite.XXXXXX"`, an explicit template under `TMPDIR` |
| 44 | `plugin/hooks/README.md` → the `allow-qa-credentials-read.sh` row ("`/tmp/notes-<creds base>-draft`") | — | D2, `/tmp` | `no-change` | an example path in a guard's outcome description. No command creates it |
| 45 | `plugin/instructions/plan_orchestration_instructions_autonomous.md` → the QA-user reservation bullet ("which a fixed `/tmp` path is not") | — | D2, `/tmp` | `no-change` | states why the QA lock is not under `/tmp`. Still true, and this branch does not touch the lock |
| 46 | `docs/guard-verification.md` → its own F2 row ("`grep '$(' f.txt`") | — | D3, `\| F2 \|` | `no-change` | that file's own F2, a guard-matrix row unrelated to temporary files |
| 47 | `docs/sandbox-verification.md` → the headline bullet ("`run-gates.sh` fails every status-graded gate sandboxed.") | — | D3, `§5 F2` | `change` | Task 3 |
| 48 | `docs/sandbox-verification.md` → `## 5. Failures and their follow-ups` → row F2 | — | D3, `\| F2 \|`, `mktemp -t`, `harness-gates` | `change` | Task 3 |
| 49 | `docs/sandbox-verification.md` → `**The gates row.**` → row T1 | — | D3, `: F2` | `change` | Task 3 adds T2 and T3 beside T1. T1's own cells stay as the 2026-10-14 record |
| 50 | `docs/work-report-research/README.md` → item 6 ("Gate 6a (`scripts/run-gates.sh:141`) fails") | — | D3, `run-gates[^ ]* fails` | `no-change` | about gate 6a, not the sandbox defect. The file is a research record, and Task 2 replaces exactly one line of `run-gates.sh` with one line, so the line it cites does not move |
| 51 | `harness-runs/lessons.md` → `## Remote and branch-scoped operations` → *"A script that creates a temporary working copy or branch removes it on every exit path…"* | — | D4, names temporary-file removal | `no-change` | the rule still holds, and Tasks 1 and 2 keep every changed call's removal exactly as it is |
