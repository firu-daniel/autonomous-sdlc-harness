### 1. §5 says Option C's allow-list needs no workflow change, but each job that calls `authorise_actor` passes repository variables in through its own `env:`

**File:** `docs/team-accounts-research.md`, in two places:
- `### The repository facts the options rest on`, the bullet starting "**One actor check gates both the trigger and the commands.**"
- `### Option C — members run locally; only the maintainer's account runs unattended work on GitHub`, under **What would change**, the bullets starting "`authorise_actor`: accept a person only when their login is on an allow-list" and "`harness-run.yml` and `harness-resume.yml`: no change."

**The problem.** The document's reader statement names its reader: "the planner of any branch that changes the credentials". For Option C it tells that planner the allow-list is "one check, so `harness-trigger.yml` and `harness-control.yml` honour it with no workflow change". It also says `harness-run.yml` needs "no change". The tree contradicts both statements:

- **`authorise_actor` has three callers, not two.** `cli/templates/scripts/remote-run.sh` calls it from the trigger path, from the control path, and from `round_collect()` (the `authorise_actor "$login" "$type"` inside the loop over a review round's distinct authors). `round_collect()` runs as `remote-run.sh collect`, in `harness-run.yml`'s `collect` job. The repository-facts bullet mentions only "the trigger and the commands".
- **No repository variable reaches the script implicitly.** Each job maps every variable it uses into `env:` by hand. The existing bot allow-list shows the pattern: `HARNESS_TRIGGER_ALLOWED_BOTS: ${{ vars.HARNESS_TRIGGER_ALLOWED_BOTS }}` appears in `harness-trigger.yml`'s job `env:`, in `harness-control.yml`'s job `env:`, and in `harness-run.yml`'s `collect` job `env:`. Only `harness-trigger.yml` and `harness-control.yml` also list it under `DECLARED MIRRORS`; `harness-run.yml` passes it into the `collect` job's `env:` without listing it in its header. A new allow-list variable would need the same `env:` line in all three jobs, plus a mirror entry for the new variable. Without them `authorise_actor` reads it unset, so Option C's "what an unset list means" fallback would apply on GitHub every time, whatever the maintainer had configured.

A planner who scopes Option C from this list would leave all three workflow templates out of the change, and the allow-list would never take effect in a remote job.

**Fix.**

- [ ] Replace the repository-facts bullet with:

  > - **One actor check gates the trigger, the commands and a review round's authors.** `remote-run.sh` → `authorise_actor` is called by the trigger, by the comment-command path and by `round_collect` (`remote-run.sh collect`, which `harness-run.yml`'s `collect` job runs). A person passes with `admin` or `write` from `repos/<repo>/collaborators/<login>/permission`. A bot passes only when listed in `HARNESS_TRIGGER_ALLOWED_BOTS`, and `ghost` or a non-login never passes ([`github-run-control.md`](github-run-control.md) → `## 6. Who can act, and pull requests from forks`). The repository variable that check reads reaches it only through an explicit `env:` line in each of those three jobs: `harness-trigger.yml`'s, `harness-control.yml`'s and `harness-run.yml`'s `collect` job. `harness-trigger.yml` and `harness-control.yml` also list it under `DECLARED MIRRORS`; `harness-run.yml` does not.

- [ ] In Option C's **What would change**, replace the `authorise_actor` bullet and the `harness-run.yml` / `harness-resume.yml` bullet with:

  > - `authorise_actor`: accept a person only when their login is on an allow-list in a repository variable, as well as holding `write`. What an unset list means — today's behaviour, or the repository owner only — is the maintainer's decision ([§7](#7-open-questions)). Because the check also screens a review round's authors, writers not on the list can no longer steer a run through a review either.
  > - `harness-trigger.yml`, `harness-control.yml` and `harness-run.yml`'s `collect` job: pass the new variable into the job's `env:` beside `HARNESS_TRIGGER_ALLOWED_BOTS`, and add a `DECLARED MIRRORS` entry for the new variable in each of the three files — in `harness-run.yml` as a new entry, since its header does not list `HARNESS_TRIGGER_ALLOWED_BOTS` today.
  > - `harness-resume.yml`, and `harness-run.yml`'s run job: no change.

Leave the rest of Option C unchanged. This finding changes no file outside `docs/team-accounts-research.md`, and no test applies to a prose-only change.
