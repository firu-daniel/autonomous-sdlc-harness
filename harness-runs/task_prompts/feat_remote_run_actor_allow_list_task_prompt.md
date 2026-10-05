`feat_remote_run_actor_allow_list` makes a remote run on GitHub spend the repository's Claude credential only for the people the maintainer names. By default that is the repository owner alone. Today, any collaborator with `write` or `admin` can start, steer, answer or review a run, and every one of those spends whatever credential the repository holds. When that credential is the maintainer's own subscription token, that is the maintainer's quota, and Anthropic's terms do not allow it to be shared (`docs/team-accounts-research.md` → P4, P5).

This is **option C** of `docs/team-accounts-research.md` → `## 5. Options for the harness`, with the maintainer's two §7 questions decided below. It also documents the route a multi-person repository takes instead.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.**

**This comes after `chore_team_accounts_research`**, which adds `docs/team-accounts-research.md`.

> **Read `docs/team-accounts-research.md` before planning**: `## Summary`, `## 5. Options for the harness` → *The repository facts the options rest on* and *Option C*, and findings G2, G3, G7 and G8. Where this prompt and that document disagree about the repository, the repository wins. Say so in the plan.

---

## Why

The harness has two kinds of adopter:

- **One person drives the repository.** This is the harness repository itself: public, with its owner as the only collaborator. Anyone may open an issue, comment, or open a pull request from a fork. None of them should ever spend the owner's subscription. Today `authorise_actor` already refuses people without `write`, and fork pull requests are refused. But the moment the owner grants anyone `write`, that person can start runs on the owner's subscription. They can do it through the trigger, the comment commands, a review round, the **Run workflow** form, `gh workflow run` or a re-run. The last three never reach `authorise_actor` at all.
- **Several people drive the repository.** The credential that is allowed for shared use is a Claude API organisation's service account (option B). The organisation sets it up itself and stores the service-account key in the `ANTHROPIC_API_KEY` secret, which `harness-run.yml` already reads. Every writer may then run.

## The goal

1. **An allow-list of who may act.** Add a repository variable listing the GitHub logins allowed to start, command, answer and review a run. The planner settles the name, for example `HARNESS_RUN_ACTORS`. `authorise_actor` accepts a person only when they hold `write` or `admin` **and** are on the list. Bots keep their own `HARNESS_TRIGGER_ALLOWED_BOTS` route, unchanged. A refused actor gets the existing refusal reply, naming the list as the reason.
2. **The meaning of an unset list (decided).** It means **the repository owner only** when the owner is a user account. For an organisation-owned repository, there is no single owner login: an unset list refuses every person, and the refusal says how to set the list. The explicit value `*` restores today's behaviour (every writer), and is the value a repository on an organisation API credential sets.
3. **The run job refuses an actor not on the list.** The **Run workflow** form, `gh workflow run` and re-runs must stop spending anything. `harness-run.yml`'s `run` job refuses to launch when `github.triggering_actor` is neither `github-actions[bot]` nor on the list (item 4), before any credential is read or Claude is started. A re-run by someone else is refused even when the original actor was allowed (G2). Dispatches the harness makes itself must still pass: the trigger, the comment commands, a chained continuation and `harness-resume.yml`'s poller.
4. **The identities item 3 rests on: measured 2026-10-05** in `firu-daniel/harness-gate12`. This answers `docs/team-accounts-research.md` → §7, *For a live measurement*, first bullet. The values are each run's `actor` and `triggering_actor`, read from `GET /repos/{owner}/{repo}/actions/runs/{id}`, the same values as `github.actor` and `github.triggering_actor`:

   | Route | `actor` | `triggering_actor` | Gate12 run |
   |---|---|---|---|
   | Trigger, issue labelled by `firu-daniel` → run | `github-actions[bot]` | `github-actions[bot]` | 36833810996 |
   | Trigger, issue labelled by the second writer `expause-admin` → run | `github-actions[bot]` | `github-actions[bot]` | 36835744979 |
   | Comment command → `run` / `pause` / `stop` dispatch | `github-actions[bot]` | `github-actions[bot]` | 36998575175, 36998258279, 37003637949 |
   | `harness-run.yml`'s `collect` job → next review round | `github-actions[bot]` | `github-actions[bot]` | 37004284664 (dispatched by 37003752361's `collect`) |
   | A person's `gh workflow run` (local watcher or by hand) | that login | that login | 37001319740 |
   | Re-run by `expause-admin` of a run first started as `firu-daniel` | `firu-daniel` | `expause-admin` | 37034702794, attempt 2 |

   **Not observed:** the run job's `remote-run.sh continue` chain and `harness-resume.yml`'s poller dispatch. Both use `GITHUB_TOKEN` like the routes above, so the planner should expect `github-actions[bot]` and confirm it when a test exercises them. The re-run row matches G2: the re-runner shows up in `triggering_actor`.

   **What this means for the gate.**
   - A `GITHUB_TOKEN` dispatch carries `github-actions[bot]`, never the parent run's actor, so it passes. Those dispatches were already screened by `authorise_actor`, or come from a run that was.
   - A person's dispatch or re-run carries that person's login in `triggering_actor`. That login must be on the list.
   - A writer who edits a workflow can also dispatch as `github-actions[bot]`. That opens no new hole, because such a writer can already read the secret (G7). The docs' residual-risk paragraph covers it.
5. **The variable reaches every check.** Pass the variable into each job that runs `authorise_actor`, beside `HARNESS_TRIGGER_ALLOWED_BOTS`, and into the `run` job:
   - `harness-trigger.yml`
   - `harness-control.yml`
   - `harness-run.yml`'s `collect` and `run` jobs

   Add a `DECLARED MIRRORS` entry for it in each of those files. `harness-run.yml` gets a new entry, since its header does not list `HARNESS_TRIGGER_ALLOWED_BOTS` today. Carry the name in `cli/src/remote/githubActions.ts`, as `TRIGGER_ALLOWED_BOTS_VARIABLE` is carried.
6. **`doctor` reports and warns.**
   - It names the effective list.
   - It warns when the list is `*` and `CLAUDE_CODE_OAUTH_TOKEN` is set. A subscription token must not serve every writer.
   - It warns when a subscription token is set and the repository has writers besides the people on the list. Any writer can still read the secret by dispatching an edited workflow from a branch (G7). The allow-list stops spending through the harness; it does not stop that.

   It reads secret and variable names only, never values, as today.
7. **`init` sets the list.** Check whether `init`'s remote setup already writes repository variables. If it does, it writes the list as the owner's login for a user-owned repository. Either way, it states what an unset list means.
8. **Docs.**
   - `docs/github-run-control.md` → `## 6. Who can act, and pull requests from forks`, and `docs/github-issue-trigger.md` → `## 3. Who can start a run`: describe the list, its default and `*`.
   - `docs/remote-execution.md` → `## 9. Credentials and billing`: state the two set-ups.
     - **One driver:** the owner's subscription token, with the default list.
     - **Several drivers:** a Claude API organisation, with a workspace that has spend and rate limits, and a service account whose key goes in `ANTHROPIC_API_KEY`. The list is set to `*` or to the team. This setup is the organisation's own job, with each member signing in locally with their own account.
   - In both cases, state the residual risk: a writer can still read the secret by editing a workflow. On a private repository, a push ruleset on the workflow paths and the scripts they run closes that (G8). On a public repository, only withholding `write` closes it.
   - `docs/remote-execution.md` → `## 7. Turning it on`, the step that sets the credential, and `### Every secret and variable`: add the variable.
9. **Upgrading.** A template change reaches an existing adopter only through `init --upgrade-workflows`. Say in the docs, and in `doctor`'s message, what an adopter's old workflow copy does until they upgrade. Existing organisation-owned adopters will be refused until they set the list; the upgrade note says so.

## Constraints

- No trusted per-run record of who started the run is needed. Under option C the allow-list is checked at every entry point, and the run-job gate checks the triggering actor. Do not add a starter field to the run's inputs or state bundle. Any writer could forge one (*The repository facts the options rest on*).
- The trigger and control jobs keep reading no repository secret.
- The check fails closed. If the variable cannot be read, or the collaborators lookup fails, the actor is refused, as `authorise_actor` does today.

## Out of scope

- Workload identity federation for the run job (option B's no-stored-secret form). That is a later branch. A service-account key in `ANTHROPIC_API_KEY` needs no harness change.
- Per-member credentials selected by who started the run (option A).
- Creating push rulesets, environments or Console organisations for the adopter. The docs describe them; the adopter sets them up.
