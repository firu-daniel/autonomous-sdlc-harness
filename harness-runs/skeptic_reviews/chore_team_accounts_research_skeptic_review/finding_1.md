### 1. §5 leaves out the documented direct dispatch of `harness-run.yml`, so Option C's allow-list would leave every writer able to start a run on the maintainer's credential

**File:** `docs/team-accounts-research.md`, in three places:
- `## Summary`, the paragraph starting "The table does not settle how each member's runs could use that member's own credential on GitHub", the clause "and every harness run is dispatched by a token that is not the person who asked for it".
- `### The repository facts the options rest on`, the bullet starting "**Every run is dispatched by a token that is not the person who asked for it.**"
- `### Option C — members run locally; only the maintainer's account runs unattended work on GitHub`: the **Security exposure.** paragraph, and under **What would change** the bullet "`harness-resume.yml`, and `harness-run.yml`'s run job: no change."

**The problem.** Option C says that "only the maintainer may start or steer a run on GitHub", and that its terms compliance "holds only while no one else can start or steer a run on it". Its change list puts the only gate in `authorise_actor` and says `harness-run.yml`'s run job needs "no change". The tree has a second route into the run job that never calls `authorise_actor`:

- `docs/remote-execution.md` → `## 1. The lifecycle of a remote run` documents it as the supported fallback: *"The fallback, which works with or without `forge`, is the **Run workflow** form of `harness-run.yml` on the repository's Actions page"*. `gh workflow run harness-run.yml --ref <branch>` reaches the same `workflow_dispatch`.
- `cli/templates/github/workflows/harness-run.yml` → `jobs:` → `run:` is gated only by `if: inputs.action == 'run'`. No line of that file reads `github.actor` or `github.triggering_actor`, so a run started from the form, or by the CLI, goes straight to the `Run the harness` step with `secrets.CLAUDE_CODE_OAUTH_TOKEN` / `secrets.ANTHROPIC_API_KEY`.
- The document already concedes the access: its own repository-facts bullet says *"any writer can dispatch the workflow with any inputs (G7)"*. G7 quotes GitHub: *"Once a workflow has run at least once, you can dispatch it against any branch or tag via the GitHub API or GitHub CLI."* It notes that dispatching needs write access, which every writer has.
- A re-run is a second route that needs no edit. G2 quotes *"Any workflow re-runs will use the privileges of `github.actor`"*. So a writer who re-runs the maintainer's run from the Actions page spends the maintainer's credential.

The summary's sentence and the repository-facts bullet heading are also wrong as written. A run started from the Run workflow form is dispatched by the person who asked for it, under their own GitHub session.

**Runtime consequence.** A planner who scopes Option C from this list would ship an allow-list that does not hold. Any writer not on the list can still open the Actions page, press **Run workflow** (or re-run an earlier run) and spend the maintainer's subscription. Their edit is neither needed nor visible. That is the use the option exists to rule out (P4, P5). The document's Option C **Security exposure** names only the edited-workflow route (G7), which is harder to use and leaves a trace in a commit. It does not name these two routes, which leave neither.

**Fix.** Edit `docs/team-accounts-research.md` only.

- [ ] In `## Summary`, replace the clause "and every harness run is dispatched by a token that is not the person who asked for it ([§5](#5-options-for-the-harness) → *The repository facts the options rest on*)." with:

  > and every harness run the trigger, the commands, a continuation or the poller starts is dispatched by a token that is not the person who asked for it, while a writer who starts one from the **Run workflow** form, the GitHub CLI or a re-run passes no actor check at all ([§5](#5-options-for-the-harness) → *The repository facts the options rest on*).

- [ ] In `### The repository facts the options rest on`, replace the bold lead-in "**Every run is dispatched by a token that is not the person who asked for it.**" with "**Every automated dispatch is made by a token that is not the person who asked for it.**". Then append these two sentences to the end of the same bullet:

  > A writer can also start a run directly, and the run job then checks nobody: [`remote-execution.md`](remote-execution.md) → `## 1. The lifecycle of a remote run` documents the **Run workflow** form of `harness-run.yml` as the fallback route, `gh workflow run` reaches the same `workflow_dispatch` (G7), and a re-run reuses the original run's privileges (G2). `harness-run.yml`'s `run` job is gated only by `if: inputs.action == 'run'` and reads neither `github.actor` nor `github.triggering_actor`, so none of these routes reaches `authorise_actor`.

- [ ] In Option C's **Security exposure.** paragraph, insert this sentence before "Other writers can still read the maintainer's token through an edited workflow (G7)":

  > An allow-list in `authorise_actor` alone does not stop another writer from starting a run on the maintainer's credential through the **Run workflow** form, `gh workflow run` or a re-run, none of which calls it (repository facts; G2, G7); only a gate in the run job itself closes those routes.

- [ ] In Option C's **What would change**, replace the bullet "`harness-resume.yml`, and `harness-run.yml`'s run job: no change." with these two bullets:

  > - `harness-run.yml`'s run job: refuse to launch when `github.triggering_actor` is a person not on the allow-list, so a direct dispatch or a re-run by another writer spends nothing (G2). Dispatches made with `GITHUB_TOKEN` — the trigger, the commands, a chained continuation and the poller — must still pass; which identity they carry is the open measurement [§7](#7-open-questions) lists, so this gate rests on it as option A does.
  > - `harness-resume.yml`: no change.

Change nothing else. Run no test: the change is prose only.
