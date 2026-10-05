### Task 11 — Document the variable, the two credential set-ups, the residual risk and the upgrade in `docs/remote-execution.md`

**Goal:** `docs/remote-execution.md` covers four things:
- **The variable**, with the step that sets it and its row in the variable table.
- **The two credential set-ups**: one driver, or several.
- **The residual risk** neither set-up closes.
- **The upgrade**: what each old workflow copy does until it is re-rendered, and by which route.

It also adds the not-verified row that Task 13's Gate 12 observation settles.

**Depends on:** Tasks 2–5, 8 and 9, whose behaviour this describes:
- **The grammar and the decisions** (story index `## Context`):
  - unset admits the owner of a user-owned repository alone, and nobody in an organisation-owned one;
  - `*` admits every writer;
  - the `run` and `collect` jobs refuse a `github.triggering_actor` the list does not admit, `github-actions[bot]` excepted, before any credential step;
  - `remote-run.sh` screens the trigger, commands, answers, reviews, closes and a `repository_dispatch` sender.
- **`doctor`'s findings** (Tasks 6–8) and **`init`'s lines** (Task 9), which this prose must not contradict.

**How this task's implementer reads the conventions.** This is the catch-all layer: read `.claude/context/conventions.md`, and `.claude/context/cli.md` for the behaviour described. Apply the lessons ledger's rules:
- every command an adopter runs sits in its own fenced block;
- the prose uses *allow-list*, while `HARNESS_RUN_ACTORS` stays the wire name;
- a documented fact states what was measured, with its source.

### Targets

- `docs/remote-execution.md`: `## 7. Turning it on`, step 4 (*"4. Set a credential secret."*); `### Every secret and variable`; `### Upgrading`; `## 9. Credentials and billing`; `## 11. Security`, the issue-trigger bullet and one new bullet; `## 6. What is not verified here`, one new row; `## 1.` → `### Working a run from GitHub alone`, its two opening paragraphs (*"a maintainer with no local setup … works a run"* and *"The fallback, which works with or without `forge`, is the **Run workflow** form"*).

**Work:**

- [ ] **§7 step 4 and `### Every secret and variable`.**
  - **Step 4.** After the two `gh secret set` blocks, add *"Then name who may spend it"*: the allow-list, its default, the organisation case and `*`, each command in its own fenced block:
    ```
    gh variable set HARNESS_RUN_ACTORS --body <login>,<login>
    ```
    ```
    gh variable set HARNESS_RUN_ACTORS --body '*'
    ```
  - **The variable table.** Add a `HARNESS_RUN_ACTORS` row beside `HARNESS_TRIGGER_ALLOWED_BOTS`:
    - *Kind:* variable.
    - *Read by:* `harness-run.yml`'s gate step in the `run` and `collect` jobs, and `remote-run.sh` `trigger`, `control` and `collect`.
    - *Default:* unset, which admits the repository owner alone in a user-owned repository and nobody in an organisation-owned one.
    - *Required:* yes in an organisation-owned repository; otherwise no.
  - **The `list of record` sentence after the table** names the `env:` blocks. Add the `collect` job's `env:` to it.
- [ ] **§9 Credentials and billing.** Add *"Two set-ups"*:
  - **One driver.** The owner's subscription token in `CLAUDE_CODE_OAUTH_TOKEN`, with the list left unset, which admits the owner alone.
  - **Several drivers.** A Claude API organisation, with a workspace that has spend and rate limits, and a service account whose key goes in `ANTHROPIC_API_KEY`. The list is `*` or the team's logins. The organisation sets this up itself, and each member signs in locally with their own account. Cite `team-accounts-research.md` → `## 5. Options for the harness`, options B and C.
  - **The residual risk, in both set-ups.** Any writer can still read the secret by dispatching an edited workflow from a branch (G7). On a private repository, a push ruleset on the workflow paths and on the scripts they run closes that (G8). On a public repository, only withholding `write` closes it. Say also that a writer who edits a workflow can dispatch as `github-actions[bot]`, which the gate admits, and that this is the same exposure, not a new one.
  - **`doctor --check-github`.** Say what it reports: the effective list, a warning for `*` with a subscription token, and a warning for writers beyond the list with a subscription token.
- [ ] **`### Upgrading`.** Add a bullet to *"What it carries, and what it does not"*: what an old copy does about the allow-list until it is re-rendered, file by file.
  - **An old `harness-run.yml`** (route: `--upgrade-workflows`): its run job checks no one's dispatch or re-run, and its `collect` job passes the scripts no list.
  - **Old `harness-trigger.yml` and `harness-control.yml`** (route: `init --force`, with the scripts): they pass no list. With old scripts every writer still acts. With new scripts every start and command is held to the unset default.
  - **A run already in flight** keeps its branch's copy, and with it no gate, as the existing paragraph on in-flight runs explains.
  - **An organisation-owned repository** is refused for every person after either upgrade until it sets the list. Set it first, with the command in a fenced block.

  Say that `doctor`'s `remote-execution` and `forge` checks warn about an old copy and name the route.
- [ ] **§11 Security, and the gated form in §1.**
  - **The issue-trigger bullet** (*"only a person with `write` or `admin` permission, or a listed bot, may start one"*): add the list.
  - **A new bullet, *Who can spend the credential*.** The run job's gate on `github.triggering_actor` covers the Run workflow form, `gh workflow run` and a re-run. It is a step in each job, because a partial re-run does not repeat an upstream job. Link §9 for the residual risk.
  - **§1 → `### Working a run from GitHub alone`, its two opening paragraphs.** Replace *"a maintainer with no local setup"* with a person the allow-list admits who has no local setup. To the fallback paragraph, add that a `run` dispatched from the form, or re-run, by a person the list does not admit launches nothing: the job's first step refuses it (§11, *Who can spend the credential*). Leave the section's how-to bullets as they stand.
- [ ] **§6, a new table row**, in the table's four columns:
  - *Behaviour:* a `remote-run.sh continue` chain and a `harness-resume.yml` poller dispatch name `github-actions[bot]` as `actor` and `triggering_actor`, and `github.event.repository.owner.type` reads `User` on a user-owned repository's `workflow_dispatch` run.
  - *What rests on it:* the run job's gate admitting the harness's own dispatches, and its owner-only default.
  - *Source:* the 2026-10-05 measurement of the other routes, from `team-accounts-research.md` → *Who a run names*; these two routes not observed; `docs/development.md` → Gate 12 observation (xv) settles both.
  - *If it is wrong:* a continuation or a poller dispatch is refused with the gate's `::error::` line. The run then waits for its owner's manual dispatch, and the gate's bot exemption must widen.

**Verification:**

- Re-run the scope register's derivation entry 1, the widened command with the `Run workflow` and `team member` patterns. Every `docs/remote-execution.md` hit is a row this task changed (rows 13, 16 and 33) or a `no-change` row with its reason (rows 11, 17 and 34–37). No hit in that file falls outside the register.
- Each new command stands alone in its own fenced block. Grep the new prose for an inline `gh variable set`; none exists outside a fence.
- Every anchor added resolves, by `grep -n '^## \|^### '` on the target file: `team-accounts-research.md` → `## 5. Options for the harness`, and `development.md`'s Gate 12. The (xv) label itself lands with Task 13, and this file names it by that label.

**Deviations from plan:**
- §11's *Who can spend the credential* is a bold-lead paragraph, not a bullet: every other §11 item outside the issue-trigger list is one, and §1 and §6 cite it by that name.
- The §6 row's *If it is wrong* cell also states the consequence of a wrong owner type (the owner of a user-owned repository with an unset list is refused; setting the list to that login avoids it), since the row's behaviour names the owner type and the plan's cell covered only the bot identity.
- The derivation-entry-1 re-run on `docs/remote-execution.md` also hits the new text in rows 12 (§7 step 4), 14 (`### Upgrading`) and 15 (§9), all rows this task owns, beside rows 13, 16 and 33 and the `no-change` rows 11, 17 and 34–37. No hit falls outside the register.
- The §6 row's source cites `team-accounts-research.md` → `### The repository facts the options rest on`, *Who a run names*, where that measurement lives, and Gate 12 under `development.md` → `## 5. Verifying a change`, the heading Gate 12 sits under.
