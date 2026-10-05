# Code Review: feat_remote_run_actor_allow_list

## Context

**Branch:** `feat_remote_run_actor_allow_list`
**Date:** 2026-10-05
**Reviewed:** the whole branch diff against `dev`, 22 files:

- **Task 1:** the `HARNESS_RUN_ACTORS` owner in `cli/src/remote/githubActions.ts`.
- **Tasks 2–3:** `run_actor_listed`, `authorise_actor`'s status `5` and the `repository_dispatch` sender check in `remote-run.sh`.
- **Tasks 4–5:** the run-actor gate step in `harness-run.yml`'s `run` and `collect` jobs, and the variable passed into the trigger and control workflows.
- **Tasks 6–8:** `doctor`'s `remote-github`, `remote-execution` and `forge` additions.
- **Task 9:** `init`'s first-setup and upgrade report.
- **Tasks 10–13:** the adopter docs and Gate 12 observation (xv).
- The tests that ship with all of the above.

18 run-artifact files excluded from the reviewed diff.

**The grammar.** The allow-list grammar is implemented three times: in TypeScript, in `remote-run.sh` and in the gate step's inline shell. The three agree on every case the story index lists:

- split on `,`, trimmed, empty entries dropped;
- matched case-insensitively;
- `*` anywhere admits every writer;
- an unset list admits a `User` owner alone, and otherwise nobody, failing closed.

Each copy has its own case table. The two gate bodies are asserted byte-identical, and the gate is driven through `bash -e -o pipefail`.

**The gate.**

- The gate is the first step of both jobs, before every `secrets.` step.
- A refused `run` leaves `SCRIPTS_DIR` unset, so the job's `always()` and `!cancelled()` steps skip as the header says.
- Every harness dispatch uses `GH_TOKEN: ${{ github.token }}`, including the trigger, control, collect, the `continue` chain and the poller. So the `github-actions[bot]` exemption covers them all. `HARNESS_GIT_TOKEN` is used only for the checkout push and the pull-request create.

**Other checks.**

- Every new export in `cli/src` has a caller outside its defining file.
- No environment-variable name is retyped as a literal in `cli/src`.
- Every heading the new docs cite resolves.
- Every adopter command added to `docs/` sits in its own fenced block.

The required accompanying tests are present; whether they pass is the Run gates phase's to establish. `phases.parity` is `false`, so no parity review applies. The per-unit findings root holds no review files, so Pass 2 had nothing to reconcile.

The five findings below are what is left:

- one Must Fix: the script's by-hand REPRO contract now predicts the wrong outcome;
- four Should Fix: two misleading default statements, one unconditional upgrade sentence, and one untested graded branch.

---

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the per-item fix loop.** The orchestrator walks the `[ ]` entries below top-to-bottom; the committer flips each one to `[x]` as that fix's commit lands. **Only the committing role flips a marker** — the `committer` agent in every flow that dispatches one, the orchestrator itself in the supervised fix flow, which dispatches none. `[ ]` markers anywhere else (e.g., sub-step bullets inside individual per-finding files) are informational progress markers for the implementer agent — they are NEVER the iteration source and the committer does NOT touch them.

Each entry resolves to a self-contained `harness-runs/code_reviews/feat_remote_run_actor_allow_list_code_review/finding_<K>.md` file via its `**Finding K**` reference (1-to-1 with the `### K. <title>` pointers below). The leading `N.` is the fix order; `K` is the finding's stable identity.

1. [x] **Finding 1** — Set `HARNESS_RUN_ACTORS='*'` in `remote-run.sh`'s REPRO setup and add REPRO lines for the allow-list refusal and the unset default _(layer: cli)_
2. [x] **Finding 3** — State both unset cases in `verb_control`'s command-refusal reply, and update its test _(layer: cli)_
3. [x] **Finding 4** — Print `reportWorkflowUpgrade`'s forge-workflow `init --force` sentence only where the forge workflows apply _(layer: cli)_
4. [ ] **Finding 5** — Add a `doctor` case for the full-page collaborators *cannot tell* warning _(layer: cli)_
5. [ ] **Finding 2** — State the organisation-owned unset default in `README.md` and `docs/github-run-control.md`'s entry point _(layer: general)_

---

## Must Fix

### 1. `remote-run.sh`'s REPRO block now predicts the wrong outcome for `trigger`, `dispatch`, `collect` and `control`
→ [finding_1.md](feat_remote_run_actor_allow_list_code_review/finding_1.md)

---

## Should Fix

### 2. The README and the run-control entry point give the unset default as "the repository owner" with no organisation case
→ [finding_2.md](feat_remote_run_actor_allow_list_code_review/finding_2.md)

### 3. The command-refusal reply says an unset list admits "the repository owner alone", which contradicts its own reason in an organisation-owned repository
→ [finding_3.md](feat_remote_run_actor_allow_list_code_review/finding_3.md)

### 4. The `--upgrade-workflows` report sends every adopter to `init --force` for the forge workflows, including adopters who have none
→ [finding_4.md](feat_remote_run_actor_allow_list_code_review/finding_4.md)

### 5. `remote-github`'s full-page *cannot tell* branch for collaborators has no test case
→ [finding_5.md](feat_remote_run_actor_allow_list_code_review/finding_5.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

`phases.parity` is `false` in `harness.config.json`, so there is no reference implementation to diverge from and this section is empty.
