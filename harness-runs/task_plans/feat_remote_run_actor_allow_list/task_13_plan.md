### Task 13 — Add Gate 12 observation (xv) for the allow-list, and set the list in the run-control setup

**Goal:** Ship the hand-run gate step that measures what this branch infers:
- a `remote-run.sh continue` chain and a `harness-resume.yml` poller dispatch name `github-actions[bot]`, and so pass the run job's gate;
- `github.event.repository.owner.type` reads `User` on a user-owned repository's dispatch.

The step also observes every refusal route on GitHub itself. The lessons ledger requires it: *"A figure measured under a test stub or a fixture-sized corpus never justifies a design decision: the branch that makes the decision also ships the gate step that produces the real-shape figure."* This task also fixes the existing Gate 12 setups, which would otherwise fail under the owner-only default.

**Depends on:** Tasks 4, 5 and 11. Restated here:
- **Task 4.** `harness-run.yml`'s `run` and `collect` jobs each open with the gate step. On a refusal it prints an `::error::` line naming `HARNESS_RUN_ACTORS` and launches nothing. It admits exactly `github-actions[bot]`, and every login the list admits.
- **Task 5.** The trigger and control jobs pass `HARNESS_RUN_ACTORS`, so `remote-run.sh` screens labels, comments, reviews and closes against it, and the refusal comment names it.
- **Task 11.** Its new row in `docs/remote-execution.md` → `## 6. What is not verified here` is the row this observation settles. Its *Source* cell names *"Gate 12 observation (xv)"*.

**How this task's implementer reads the conventions.** This is the catch-all layer: read `.claude/context/conventions.md`, whose `## Documents of record` requires a measured fact to state what was measured, the command and the exact message. Follow the shape of the existing Gate 12 observations (xiii) and (xiv) in `docs/development.md` → `## 5. Verifying a change`: a lettered list of legs, each with its commands in fenced blocks, one per line, and its own pass condition, then *"What it settles."*. Nothing here is run by this task. It is a gate a maintainer runs by hand in `firu-daniel/harness-gate12`.

### Targets

- `docs/development.md` → `## 5. Verifying a change` → Gate 12:
  - the setup sentence of observation (xiii), *"From another device, as a person with write access, open an issue and apply the trigger label"*;
  - the leg preamble of observation (xiv), *"Run every leg below from another device, as a person with write access"*, and its leg (e) reviewing-account paragraph;
  - a new observation (xv), placed after (xiv)'s `**What it settles.**` paragraph and before the `**Teardown.**` paragraph, with its own `**What it settles.**` paragraph. (xiv)'s existing `**What it settles.**` paragraph, which cites (xiv)'s legs (d), (f) and (h), is left byte-identical, so its leg letters keep pointing at (xiv)'s legs;
  - the `**Teardown.**` paragraph.

**Work:**

- [ ] **(xiii) and (xiv), the setups.** Replace *"as a person with write access"* with *"as a person the allow-list admits — by default the repository owner"*. In leg (e)'s reviewing-account paragraph, replace *"must have write access"* with *"must have write access, must be admitted by the allow-list"*, keeping the rest of the sentence (*"and must not be the pull request's author"* and its reason). In (xiv), before the legs, add a fenced command that names the owner and the reviewing account. Leg (e)'s reviewer is a second writer, whose review the list must admit:
  ```
  gh variable set HARNESS_RUN_ACTORS --repo <owner>/<scratch-repo> --body <owner login>,<reviewing account login>
  ```
  Leave leg (b) of (xiii) as it stands. A labeller without write access is still refused by the permission check, which runs before the list, so its expected comment still names write access.
- [ ] **(xv), the refusals.** Title it *"The allow-list refuses a writer it does not name, on every route."* Its setup:
  - a second account with `write`, the `expause-admin` role of the 2026-10-05 measurement;
  - the variable deleted, so the owner-only default applies.

  Legs, each recording the run's `actor` and `triggering_actor` from `gh api repos/<owner>/<scratch-repo>/actions/runs/<id>`:
  - **(a)** The second account labels an issue. Passes when the refusal comment names `HARNESS_RUN_ACTORS` and no `harness run` run follows.
  - **(b)** The second account runs `gh workflow run harness-run.yml --ref <branch> -f action=run -f branch=<branch>`. Passes when the `run` job fails at its first step with the `::error::` line, and no later step ran (`gh run view <id> --log`).
  - **(c)** The second account re-runs a run the owner started, once with **Re-run all jobs** and once with **Re-run failed jobs**. Passes when the gate refuses both.
  - **(d)** The second account comments `@sdlc-harness status` on a run's issue. Passes when the reply names the list.
- [ ] **(xv), the admissions.**
  - **(e)** Let a run started by the owner self-pause on a hosted runner (`HARNESS_SELF_PAUSE_AFTER_MINUTES` set low), so `remote-run.sh continue` chains a new job. Passes when that job's run names `github-actions[bot]` as both `actor` and `triggering_actor`, and its gate passed.
  - **(f)** Let a run end on a usage pause, or dispatch `harness-resume.yml` by hand while a paused run's reset has passed. Passes when the poller's dispatch names `github-actions[bot]` likewise.
  - **(g)** As the owner, with the variable unset, dispatch a run. Passes when the gate's pass line names the owner rule. That shows `github.event.repository.owner.type` read `User`.
  - **(h)** Set the variable to `*`, then repeat leg (a). Passes when the second account's label starts a run.
- [ ] **What (xv) settles, the teardown, and where the results go.**
  - Write (xv) as one block, legs (a)–(h) then its own **new** `**What it settles.**` paragraph, inserted after (xiv)'s `**What it settles.**` paragraph and before `**Teardown.**`. Do not edit (xiv)'s `**What it settles.**` paragraph: it stays byte-identical. (xv)'s paragraph names the `## 6. What is not verified here` row Task 11 added to `docs/remote-execution.md`, settled by legs (e)–(g); and `docs/team-accounts-research.md` → `## 7. Open questions`'s still-to-confirm bullet on the continuation and the poller, settled by legs (e) and (f). The result is recorded under this gate, not by editing the research.
  - *"Teardown."*: add `HARNESS_RUN_ACTORS` to the repository variables the round deletes.
  - *"Where the results go."*: unchanged.

**Verification:**

- Re-run the scope register's derivation entry 1 (story index `## Scope register`), the widened command with the `Run workflow` and `team member` patterns. Every `docs/development.md` hit is a row this task changed (rows 20, 22 and 38) or a `no-change` row with its reason (rows 21 and 39–41). No hit in that file falls outside the register.
- Every command in the new legs sits in its own fenced block, one per line. No leg's pass condition carries a count it expects, other than the gate's own exit.
- `git diff` of `docs/development.md` shows (xiv)'s `**What it settles.**` paragraph unchanged, and (xv)'s legs and its own `**What it settles.**` paragraph sitting after it and before `**Teardown.**`.
- The new observation's label (xv) is the one Task 11's `## 6.` row cites. Grep `docs/remote-execution.md` for `(xv)` and find that citation.

**Deviations from plan:**
- (xv) runs legs (e) and (f) first, then stops `<slug>` as the owner, because `harness-run.yml`'s `run` job holds `concurrency: harness-run-<branch>` with `cancel-in-progress: false`: a dispatch or re-run made while a job of that branch runs waits rather than reaching its gate. Leg letters are as planned.
- Leg (c)'s **Re-run failed jobs** targets the run the owner's `@sdlc-harness stop` ended, so that a job that did not succeed exists; the leg records GitHub's refusal exactly if no failed-jobs re-run is offered.
- Leg (f) records itself as **not observed** when the round meets no usage pause, following (v)'s rule, so that a missing pause is not read as a pass.
