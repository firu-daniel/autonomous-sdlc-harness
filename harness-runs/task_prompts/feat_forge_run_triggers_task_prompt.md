`feat_forge_run_triggers` lets an autonomous run be started from GitHub: labelling an issue starts a task run,
with nothing on the maintainer's machine taking part. Today the only entry point is a file dropped into
`<state_dir>/autonomous_inbox/` (`docs/watcher.md` → `## 1. The loop in one page`), which a local watcher picks up.
This branch adds the second entry point, and only that. Everything else a GitHub-side run needs is a named
follow-up (*Out of scope* below).

**This comes after `feat_remote_execution_github_actions`,** which made a run execute in a GitHub Actions job and
supervise itself there. This branch adds *what starts* a run from GitHub. Read what that branch shipped before
planning: `docs/remote-execution.md`, especially `## 1. The lifecycle of a remote run` and `## 5. The seam, and
what stays open`.

**It is the first of two steps.** The order is: this branch (the issue trigger); then `feat_forge_run_control`
(controlling a run from GitHub, below). Design this branch so that the second plugs into it instead of reworking
it. A third step, `feat_github_native_adoption` (removing the local setup steps), was dropped on 2026-09-30:
`docs/github-integration-research.md` → `## 5. Adoption routes compared` records why. Adoption stays the local
install.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.**

> **Everything under "Leads" is research, not a decision.** It was gathered on 2026-09-24 and revised on
> 2026-09-30. The planner and the reviewers must re-verify each lead against the live source, and must agree on
> the design themselves.


> **Read `docs/github-integration-research.md` first.** `chore_github_integration_research` answered this
> prompt's open questions there, with sources and retrieval dates. Where it marks a lead `verified` or
> `refuted`, take its answer and cite it rather than re-verifying; only what it leaves `unverified` stays open.
> An unattended run cannot fetch web pages, so do not claim a lead was re-verified unless that document did it.

---

## The goal

1. **An issue event starts a task run with nothing local involved.** Labelling an issue (or the issue event the
   planner chooses) makes a GitHub-side workflow do what the local watcher's inbox pass does for a remote drop
   today: cut the branch from the default branch, place and commit the task prompt, push, and dispatch
   `harness-run.yml` with `action: run` and `engine: task`. The run then proceeds exactly as a remote run
   dropped locally does. With the maintainer's machine switched off and no local watcher running, the run
   reaches "branch ready for review".
2. **One placement implementation.** The branch cut, the task-prompt placement and its commit message
   (`chore: add task prompt for <branch>`) live in the watcher's inbox pass today. The trigger must reuse that
   logic through a job-safe entry point, for example a new `remote-run.sh` verb, not a second copy of it.
   Nothing downstream of the placement should need to know where the task came from.
3. **A GitHub-triggered run always executes through `harness-run.yml`.** GitHub cannot reach the maintainer's
   machine, so starting a *local* run from a GitHub event would need a local process that polls GitHub, and that
   contradicts goal 1. Running a GitHub-triggered run on the maintainer's own hardware already works: register a
   self-hosted runner there and name it in `HARNESS_RUNNER` (`docs/remote-execution.md` → `## 8. Choosing a
   runner`). State this in the docs as the way to run a GitHub-triggered run locally.
4. **Local and remote work together.** A local adopter keeps everything they have today, and a run started from
   an issue must be workable from the local commands as well as from GitHub. See *Trigger-started runs and the
   local commands* below.
5. **The platform is not fixed to GitHub.** GitHub is the first adapter. Shape the adapter as *event → (branch,
   task text) → placement → dispatch*, so that Jira and others fit later without a rewrite.

## Branch naming — decided

The branch name is derived **deterministically from the issue title**, with no model call and no confirmation
step. A model call adds latency and cost, and a naming label would add a step for the person triggering the run.

- **The slug.** Lowercase the title, replace every run of characters that is not a letter or a digit with a single
  `_`, and trim `_` from both ends. So `Version bump` becomes `version_bump`, and
  `<prefix>: move button to the bottom of the page` becomes `<prefix>_move_button_to_the_bottom_of_the_page`. A
  prefix a team already writes into its titles, such as `feat:` or a ticket key, therefore carries into the
  branch name on its own. No `feat_` or `fix_` prefix is added. The planner may refine these character rules
  if it finds a better convention, and must say why.
- **Collisions get an index suffix.** Issue titles repeat (*Version bump*), so when the slug is already taken the
  branch becomes `<slug>_<n>` with the lowest free `n`. The planner decides whether the first branch carries a
  suffix. *Taken* must cover more than live branches on `origin`:
  - a branch that was merged and deleted still has its task prompt, plans and statistics under `<state_dir>` on
    the default branch, so a reused name would collide with those artifacts;
  - a name that matches the protected set (`protectedBranches` unioned with `defaultBranch`) is never usable;
  - a local registry record for that name is a collision too, when the check can see one.
- **Edge cases the plan must settle:** a title that yields an empty slug (only emoji or non-Latin characters),
  where a fallback such as `issue_<number>` fits; a length cap, since the name also becomes a working-copy
  directory; and a check that no derived name makes the inbox filename patterns ambiguous
  (`autonomous-watcher.sh` → `^(.+)_task_prompt\.md$`, `^(.+)_review(_[0-9]+)?\.md$`, `^(.+)_docs\.md$`).
- **The same rule for both paths.** The rule lives in one place, so that a future `/autonomous-sdlc-harness:branch-prompt`
  or adapter can derive the same name. `/autonomous-sdlc-harness:branch-prompt` keeps its confirmed,
  model-deduced name. This branch does not change it.

## Trigger-started runs and the local commands

**The requirement:** a run started from an issue is visible to, and controllable by, the local commands
(`/autonomous-sdlc-harness:branch-status`, `-answer`, `-resume`, `-pause`, `-user-review`), exactly like a remote run
dropped locally, for a maintainer who also has a local setup. A remote-only maintainer needs none of it.

**What stands in the way today, verified on 2026-09-30:** every local command that acts on a remote run first
runs `remote-run.sh sync`. It skips records whose `execution` is not `github-actions`, and it skips the download
when the newest run is the one already synced. But `sync` needs a registry record *and* a mirror working copy: it
exits 2 on `no record` and on `no mirror` (`remote-run.sh` → its header's test notes). A trigger-started run has
neither, because the local watcher never dispatched it.

**The likely route:** an adopt step that finds `harness run <branch>` runs the local registry does not know about,
using the `run-name` contract of `docs/remote-execution.md` → `## 5.`. It fetches the branch, creates the mirror
working copy, and writes a record with `execution: github-actions`. The existing `sync` then does the rest. The
planner decides where adopt runs (the commands that already sync, the watcher's tick, or both) and keeps
`branch-status`'s never-sync rule. Relays still need the local watcher running when the maintainer acts, as they
do today.

**If the plan finds this cannot be done cleanly**, it says why, and the docs state plainly that a run started from
GitHub is worked on from GitHub only (the Actions tab's **Run workflow** form, below), with no local command
seeing it.

## Leads (re-verify every one)

- **GitHub Actions events.** `issues` (`labeled`, `opened`), `workflow_dispatch` and `repository_dispatch` are
  the ones this branch needs. The PR and comment events belong to `feat_forge_run_control`. Source:
  https://docs.github.com/en/actions/writing-workflows/choosing-when-your-workflow-runs/events-that-trigger-workflows
- **The dispatch from the trigger job.** A `workflow_dispatch` sent with `GITHUB_TOKEN` starts a run. Gate 12
  round 2 verified this for `remote-run.sh continue` (`docs/remote-execution.md` → `### Verified in Gate 12 round 2`).
  A push made with `GITHUB_TOKEN` starts no workflow (round 3), which is harmless here because the dispatch, not
  the push, starts the run.
- **Workflow files and `GITHUB_TOKEN`.** `GITHUB_TOKEN` is believed to be unable to create or modify
  `.github/workflows/*`. A trigger job that cuts a branch from the default branch and adds only a task prompt
  touches no workflow file, so it should be unaffected. Verify this. Separately, state as an existing remote-run
  limit that a run whose *task* edits a workflow file cannot push it without `HARNESS_GIT_TOKEN`.
- **Authorisation.** Applying a label needs only the *triage* role, not write.
  - The trigger must check the labeller's permission through the API, with at least write required, and must
    reject bot actors unless they are listed. Only authorised actors can start a run, and the docs must say who
    counts as authorised.
  - An `issues` workflow runs with the repository's secrets whoever opened the issue. So `opened` must never
    start a run without the same check.
  - `anthropics/claude-code-action` applies similar checks (write access, and bots rejected unless listed:
    https://code.claude.com/docs/en/github-actions). Decide whether to reuse them or restate them.
- **Untrusted input.** The issue body may come from someone without write access. The labeller vouches for it.
  The job has `contents: write` and the credential secrets. Say in the docs what the labeller is vouching for.
  Snapshot the body at label time: the committed task prompt is that snapshot, and editing the issue later does
  not change the run.
- **Feedback on the issue.** At minimum, one comment on the issue naming the branch and the run URL, or naming why
  the trigger refused. Lifecycle comments (`parked`, `completed`, ...) belong to `feat_forge_run_control`.
  `autonomous-notify.sh` keeps working unchanged.
- **Parking with no local machine.** A park's notification names `/autonomous-sdlc-harness:branch-answer <branch>`
  (`autonomous-watcher.sh`, the `notify parked` call). A remote-only maintainer has no such command. Until the
  forge follow-up adds answering over comments, the route is:
  1. read the question from the `harness-state` artifact of the run;
  2. send **Run workflow** on `harness-run.yml` with `action: run`, `resume: answer` and the answers JSON.

  Pause, resume and stop go through the same form, with the inputs of `docs/remote-execution.md` → `## 5.`.
  Document this route, and make the notification text for a remote record name it next to the local command.
- **Jira.** A Jira Automation rule can send a web request to GitHub's `repository_dispatch` API. Leave this as a
  documented path at minimum. GitLab has no native "issue labelled" pipeline trigger and needs a webhook relay
  (https://docs.gitlab.com/ci/triggers/).
- **Anthropic routines** (https://code.claude.com/docs/en/routines) cover pull request and release events, not
  issues. They run only in Anthropic cloud sessions, where a repository's `enabledPlugins` plugins do not load
  (https://code.claude.com/docs/en/cloud-environments → *What carries over from your setup*). They are a
  reference point, not a route.
- **`forge` finally gets a reader.** `docs/config.md` → `## 5. Key reference`, the `forge` row, waits for the
  **forge coupling**: *"an issue-label trigger, draft-pull-request output and comment-based park-and-ask"*. This
  branch delivers the first part only. Whatever reads `forge` must also report it (`ARCHITECTURE.md` →
  `## 8. Declaring a seam before building it`), and the row must say which parts are still waiting.
  `docs/development.md` → `## 6. The roadmap this tree defers to` records the key's missing reporter as a
  standing debt.

## Establish, do not assume

- What `feat_remote_execution_github_actions` shipped: the setting's name, how a remote run is started, and what
  it reports back. Build on it, and do not duplicate it.
- Under which configuration `init` writes the trigger workflow (for example `forge: "github"` together with
  `execution.target: github-actions`), and what `doctor` checks about it.
- Which label, or which configurable label, starts a run, and whether it is removed or replaced once the run
  starts, so that re-applying it is a deliberate act.

## Out of scope — `feat_forge_run_control`

Each of these is deferred to `feat_forge_run_control`, the follow-up branch that comes after this one:

- a pull-request review comment, or another PR event, starting a user-review fix round;
- park-and-ask over issue or PR comments;
- pause, resume and stop commands from comments;
- lifecycle comments on the issue or PR (`parked`, `paused`, `completed`, `failed`);
- draft-pull-request output when a run completes;
- adapters beyond GitHub, unless one costs almost nothing once the shape exists;
- changes to where runs execute, which belong to the previous branch.

## Acceptance

1. Labelling an issue, by an authorised actor, starts a task run on a branch named by the rule above. The run
   reaches "branch ready for review" with the maintainer's machine off and no local watcher running.
2. A second issue with the same title gets the next indexed branch name, and a title whose slug names a
   protected branch, or the artifacts of a merged branch, never reuses it.
3. An actor without write access, or an unlisted bot, cannot start a run. The check is stated where an adopter
   will read it.
4. The issue gets a comment naming the branch and the run, or the reason for a refusal.
5. For a maintainer with a local setup, the local commands see and act on a trigger-started run. Otherwise the
   plan says why they cannot, and the docs state that such a run is worked on from GitHub only.
6. A local inbox drop still works exactly as before, locally and remotely.
7. `forge` has a reader and a reporter, and its row says which parts of the coupling remain.
8. `bash scripts/run-gates.sh` prints no new failure.
