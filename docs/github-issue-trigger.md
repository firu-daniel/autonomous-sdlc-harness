# Starting a run from a GitHub issue

**Who reads this:** a maintainer who wants a labelled GitHub issue to start an autonomous run, and anyone changing the issue trigger — `harness-trigger.yml`, `remote-run.sh trigger` and `start`, or the branch-name rule. It owns the trigger's design of record: how to turn it on, what happens between a label and a dispatched run, how the branch is named, who may start a run and what the labeller vouches for, and what is not verified. The run itself, from the dispatch on, is [`remote-execution.md`](remote-execution.md)'s.

It cites rather than restates. Every GitHub fact below is cited from [`github-integration-research.md`](github-integration-research.md) by its ID (S1, S3, T1–T6), retrieved there on 2026-09-30 and not re-verified here. The code of record is `cli/templates/scripts/remote-run.sh` → the header's `start` and `trigger` paragraphs, the header of `cli/templates/github/workflows/harness-trigger.yml`, and `cli/templates/scripts/lib/harness-run-lib.sh` → `DERIVING A BRANCH NAME FROM A TITLE`.

---

## Turning it on, in short

The issue trigger is off unless `harness.config.json` carries `forge` set to `github` **and** `execution.target` set to `github-actions`. With either missing, `init` writes no trigger workflow, and a trigger workflow already committed refuses every start with a comment naming both keys. The commands run from the repository root.

**1. Set the two keys.** The second only when remote execution is not on yet; [`remote-execution.md`](remote-execution.md) → `## 7. Turning it on` is then the rest of that setup, including the credential secret every run needs.

```
npx autonomous-sdlc-harness config set forge github
```

```
npx autonomous-sdlc-harness config set execution.target github-actions
```

**2. Write the trigger workflow.** `init` writes `.github/workflows/harness-trigger.yml` only if absent. It carries no version pin, so `init --upgrade-workflows` does not re-render it; `init --force` replaces it after a `.bak`.

```
npx autonomous-sdlc-harness init
```

**A repository wired by an earlier release also needs its scripts brought current.** The trigger job runs `remote-run.sh trigger` from the scripts on the default branch, and `init` keeps existing outer-loop scripts as they are ([`cli.md`](cli.md) → `## 3. The re-run contract`). Scripts written before this release have no `trigger` or `start` verb. On such scripts the job fails with `remote-run.sh: unknown verb 'trigger'` and posts no comment on the issue, and `doctor`'s `forge` check does not see it. `--force` replaces the scripts, each after a `.bak`. What else it regenerates is listed in [`remote-execution.md`](remote-execution.md) → `### Upgrading`.

```
npx autonomous-sdlc-harness init --force
```

**3. Commit it and push it to GitHub's default branch.** GitHub runs an `issues` or `repository_dispatch` workflow only from the default branch (T1, T6). Add the two run workflows to the same commit when step 1 turned remote execution on, and every file under your scripts directory that `init --force` replaced in step 2, which this lists:

```
git status --short
```

The `workflow` scope and `--no-verify` are explained in [`remote-execution.md`](remote-execution.md) → `## 7.` step 3.

```
git add .github/workflows/harness-trigger.yml
```

```
git commit -m "Add the harness issue trigger"
```

```
gh auth refresh -s workflow
```

```
git push --no-verify origin <default branch>
```

**4. Create the trigger label.** Creating a label needs write access (T1).

```
gh label create harness
```

**5. Optionally, rename the label or admit bots.** The trigger label is the repository variable `HARNESS_TRIGGER_LABEL`, `harness` when unset; create a label of that name instead of `harness`. `HARNESS_TRIGGER_ALLOWED_BOTS` is a comma-separated list of bot logins allowed to start a run, empty by default (§3).

```
gh variable set HARNESS_TRIGGER_LABEL --body <label>
```

```
gh variable set HARNESS_TRIGGER_ALLOWED_BOTS --body <bot login>,<bot login>
```

**6. Check the setup.** `doctor`'s `forge` check reads local evidence only: it warns when remote execution is off, when the trigger workflow is absent, or when `origin/<default branch>` does not carry it. `--check-github` adds whether GitHub knows `harness-trigger.yml` and whether the trigger label exists, and notes every bot `HARNESS_TRIGGER_ALLOWED_BOTS` admits. Once `gh` is authenticated, both answers appear in the `remote-github` check's report whatever else it reports, `pass`, `warn` or `fail`. A `gh` that cannot run or reports no usable login stops that check before GitHub is asked about the trigger.

```
npx autonomous-sdlc-harness doctor --check-github
```

The trigger job runs on the runner `HARNESS_RUNNER` names, like the run job, and needs `jq` and `gh` there.

---

## 1. What happens when an issue is labelled

1. **The event.** `harness-trigger.yml` listens to `issues` of type `labeled` only, never `opened`. A label set while the issue is being created raises `labeled` as a separate event whose `sender` is the creator, so listening to both would start twice, and `labeled` alone covers labelling at creation and later (T1).
2. **The label filter.** The job's `if:` runs it only for the label `HARNESS_TRIGGER_LABEL` names. Any other label yields a skipped job, which runs no runner and bills nothing ([`remote-execution.md`](remote-execution.md) → `### Verified in Gate 12 round 2`).
3. **The refusals**, in this order, each one a comment on the issue naming the reason and the way on:
   1. the repository variable `HARNESS_REMOTE_STOP` is set;
   2. the default branch's `harness.config.json` does not set `forge` to `github` and `execution.target` to `github-actions` — checked before any authorisation, so a disabled trigger asks GitHub nothing about the labeller;
   3. the issue is not open;
   4. the labeller is `ghost`, empty, or not a login's shape;
   5. the labeller is not a `User` and is not listed in `HARNESS_TRIGGER_ALLOWED_BOTS`;
   6. the labeller is a `User` whose repository permission is not `admin` or `write`, or whose permission could not be read (§3).
4. **The branch and the snapshot.** The job fetches the default branch, derives the branch name from the issue's title (§2), and writes the task prompt: `# <title>`, the body as it is at this moment, and a provenance line naming the issue, the labeller, the label and the time. A name that cannot be derived, or whose every suffix is taken, is a refusal.
5. **`start`.** `remote-run.sh start <branch> --prompt-file <file>` cuts the branch from `origin/<default branch>`, places the prompt at `<stateDir>/task_prompts/<branch>_task_prompt.md`, commits it as `chore: add task prompt for <branch>` and pushes it, through the same run-library calls the local watcher's inbox pass makes. The working copy and its local branch are removed once the push lands, and on any failure after the cut, so a self-hosted runner accumulates nothing; a copy or branch that existed before the cut is left alone. Then it sends `harness-run.yml`'s `workflow_dispatch` with `action: run`, `engine: task`, `resume: none` and `chain: 0`. Nothing downstream can tell where the task came from.
6. **The comment and the label.** The job looks up the `harness run <branch>` run whose head commit (`headSha`) is the one `start` pushed, at most `TRIGGER_RUN_LOOKUP_TRIES` times, and comments the branch and that run's URL — or, if the lookup finds nothing, the URL of the branch's filtered run list. A run of an earlier branch of the same name is never named. Every comment, a refusal's included, is followed by removing the trigger label, so re-applying it is a deliberate act; re-applied on the same issue, it starts another run on the next indexed branch. The comment and the removal are the only writes the trigger makes to the issue.
7. **From here it is the run a local drop starts** ([`remote-execution.md`](remote-execution.md) → `## 1. The lifecycle of a remote run`, from step 4): the same workflow, inputs, supervision and notifications, ending in a pushed branch ready for review. Nothing on your machine takes part.

**The adapter shape is *event → (branch, task text) → placement → dispatch*.** `trigger` is the event adapter: it turns a GitHub event into a branch and a task text. `start` is the platform-neutral half, and is where any later adapter plugs in; a Jira rule already reaches it through `repository_dispatch` without touching it (§6). The workflow declares no `concurrency` group, because a group keeps at most one pending run and cancels an earlier pending one, which would drop a trigger (§7). Two starts racing for one name are caught by the refused push of an existing branch, and that refusal is commented.

**Running it on your own hardware.** A run started from GitHub always executes through `harness-run.yml`: GitHub cannot reach your machine, and a local process polling GitHub for issues would contradict the point of starting from GitHub. To run it on your own hardware, register a self-hosted runner there and name its label in `HARNESS_RUNNER` ([`remote-execution.md`](remote-execution.md) → `## 8. Choosing a runner`). Both the trigger job and the run then execute on that machine.

---

## 2. The branch name

The name is derived from the issue title by a fixed rule, with no model call and no confirmation step. The rule has one owner, `hr_derive_branch` in the run library, so a later adapter derives the same name.

| Issue title | Branch |
|---|---|
| `Version bump` | `version_bump` |
| `Version bump`, a second time | `version_bump_2` |
| `feat: move button to the bottom of the page` | `feat_move_button_to_the_bottom_of_the_page` |
| `PROJ-123 Fix the login redirect` | `proj_123_fix_the_login_redirect` |
| `Café menu` | `caf_menu` |
| `🚀🚀`, issue 42 | `issue_42` |

- **The fold.** The title is lowercased A–Z under `LC_ALL=C`, every run of characters outside `[a-z0-9]` becomes one `_`, and `_` is trimmed from both ends. The fold is ASCII-only, so `é` is a separator, never a letter: a locale-dependent fold would derive different names on different runners. A lowercase name of letters, digits and single `_` passes every `git check-ref-format` rule, and cannot collide by case on macOS or Windows (T5). A prefix the team already writes into titles, such as `feat:` or a ticket key, carries into the name; none is added.
- **The cap.** 60 characters, cut before any suffix, with a `_` the cut exposes trimmed. The name becomes a working-copy directory component and prefixes artifact file names, and 60 keeps both far under a 255-byte file-name limit and readable in the Actions run list. GitHub documents no ref length limit (T5).
- **The fallback.** A title the fold empties, such as one of emoji or non-Latin characters only, takes `issue_<number>`.
- **The suffix.** A taken name takes the lowest free `<name>_<n>`, from `_2` up to `_99`. The first branch carries none, so `_2` reads as "the second". With every suffix taken, the trigger refuses rather than guess.
- **What counts as taken**, each for its reason:
  - *a run's artifacts on the default branch*: a directory named exactly the name, or a file `<name>_task_prompt.md`, `<name>_story_plan.md` or `<name>_docs.md`, under `<stateDir>` on `origin/<default branch>`. A merged and deleted branch leaves them there, and a reused name would collide with them;
  - *a protected branch*: `protectedBranches` with `defaultBranch`, which no run ever works on. A title of `Main` derives `main_2`;
  - *a branch on `origin`*, compared case-insensitively, since two refs differing only in case cannot coexist on a case-insensitive filesystem (T5);
  - *a local branch*, and *a run-registry record* when the caller names a registry. The rule is written for any caller; the trigger job's fresh checkout holds no run branch and names no registry, so for it these two never fire;
  - *a run of the run workflow listed under that name*, when the caller passes `gh`, as the trigger does: GitHub is asked once per candidate whether any `harness-run.yml` run is listed under it. An abandoned, unmerged branch leaves no artifact on the default branch, yet its runs and their state bundles stay listed under its name for the artifact retention, and a reused name would inherit them ([`development.md`](development.md) → Gate 12 → Round 5, finding 1).

  A name that cannot be judged, because a listing failed, a candidate's run history included, is a refusal, never a guess.
- **The inbox round-trip.** The derived name must route back to itself through the inbox filename patterns (`<name>_task_prompt.md`, `<name>_review.md`, `<name>_review_2.md`, `<name>_docs.md`), so no derived name makes those patterns ambiguous. A name that does not is replaced by the fallback once.

`/autonomous-sdlc-harness:branch-prompt` keeps its confirmed, model-deduced name; this rule does not change it.

---

## 3. Who can start a run

**A person whose permission on the repository is `admin` or `write`, or a bot you have listed in `HARNESS_TRIGGER_ALLOWED_BOTS`. Nobody else.** Applying a label needs only the triage role (T1), so the label alone proves nothing, and the trigger checks the labeller itself:

- **A person** (`sender.type` `User`): the collaborator-permission API must answer `admin` or `write`. That admits the maintain role, which the API reports as `write`, and refuses triage, which it reports as `read` (T3). Any other answer, or no answer, is a refusal.
- **A bot** (any other type): refused unless its login is an exact entry of `HARNESS_TRIGGER_ALLOWED_BOTS`. A listed bot is authorised by the listing and is not asked about its permission, because the API answers `none` or 404 for a bot (T3). `doctor --check-github` notes each listed bot for that reason.
- **`ghost`**, GitHub's placeholder for a sender it cannot resolve (T1), is never authorised.

These are `anthropics/claude-code-action`'s two checks — write access and a human actor — restated in `remote-run.sh` rather than reused, because the harness does not run that action (T4). Its shortcut that passes any login ending in `[bot]` through the write check is not copied: here a bot passes only by being listed.

**Do not put the trigger label in an issue form.** Whether a label an issue form adds at creation raises `labeled`, and with which `sender`, is not established (T1). The permission check would still refuse an author without write access, but the label would no longer be a deliberate act.

A `repository_dispatch` has no labeller: the holder of the token that sent it is the authority (§6).

---

## 4. What the labeller vouches for

**Applying the trigger label means "run this text as a task".** The issue's title and body may have been written by someone without write access. An `issues` workflow runs with the repository's secrets whoever opened the issue (T2), the trigger job holds `contents: write`, and the run it dispatches holds the credential secrets. So the labeller is vouching for the text, as if they had written the task prompt themselves.

- **The committed prompt is the snapshot at label time.** An edit to the issue afterwards does not reach the run, and the comment says so.
- **Working a run from your machine runs none of its code.** The local commands act on a run started on GitHub through GitHub: `/autonomous-sdlc-harness:branch-status` reads it, and `/autonomous-sdlc-harness:branch-answer`, `-resume`, `-pause` and `-user-review` dispatch to it. None of them creates a working copy for any branch but the one it names. The one copy made, by `/autonomous-sdlc-harness:branch-user-review` to commit the review, is created with `create-worktree.sh --existing --no-bootstrap`: it runs no `setup-worktree.sh`, `commands.depInstall` or `commands.build`, and it is removed once the review is pushed. Running the branch's code locally is a deliberate step of your own, such as checking the branch out, and the labeller's vouching (above) is what you rely on then.
- **The trigger job references no secret.** It needs only its own token (`contents`, `actions` and `issues` write), so the credential secrets never reach the job that reads the issue text. Event text reaches its shell only through `env:` and the event file, never through a GitHub expression inside `run:`.
- **A task that edits `.github/workflows/*` cannot push that edit with the job's own token.** This is the existing remote-run limit, not the trigger's: no `permissions:` setting lets `GITHUB_TOKEN` write a workflow file, and the push is refused with ``refusing to allow a GitHub App to create or update workflow … without `workflows` permission`` (S1). Such a task needs a workflow-capable `HARNESS_GIT_TOKEN` ([`remote-execution.md`](remote-execution.md) → `### Every secret and variable`). The trigger itself commits only a task prompt, and a branch whose commits touch no workflow file pushes normally (S1).

The trigger job's push and comment start no other workflow; its `workflow_dispatch` does (S3).

---

## 5. Working the run

**With a local setup**, the local commands act on a run started on GitHub directly when given its branch as the `<branch>:` prefix — no local record, no sync and no running watcher — `branch-user-review` alone makes a short-lived, un-bootstrapped copy of the branch it names (§4). Each reads the job's newest state from GitHub before it acts:

```
/autonomous-sdlc-harness:branch-answer <branch>: <answer text>
```

```
/autonomous-sdlc-harness:branch-resume <branch>
```

```
/autonomous-sdlc-harness:branch-pause <branch>: <reason>
```

```
/autonomous-sdlc-harness:branch-user-review <branch>: <review feedback>
```

Without the prefix a command chooses among the local registry's runs only, so a run with no local record is reached through the prefix alone. The answer, resume and pause go out as dispatches the command sends itself; the user review is committed on the branch tip from a temporary copy that is never bootstrapped, then dispatched ([`remote-execution.md`](remote-execution.md) → `## 1. The lifecycle of a remote run`).

**Without one**, a run is worked from GitHub alone ([`remote-execution.md`](remote-execution.md) → `## 1. The lifecycle of a remote run`).

**Either way, the notifications name both routes**: every job-side notification that names a local command also names the GitHub one.

---

## 6. Other trackers

**Any tracker that can send an HTTP request reaches `start` through `repository_dispatch`.** `harness-trigger.yml` also listens to `repository_dispatch` of type `harness-task`, with this body:

```json
{"event_type": "harness-task", "client_payload": {"title": "…", "body": "…", "source": "…"}}
```

`title` names the branch as an issue title does, with `task_<run id>` as the fallback; `body` is the task text; `source`, optional, is named in the prompt's provenance line. GitHub bounds `client_payload` at 10 top-level properties and under 64 KB, so a longer task text does not fit (T6). A dispatch has no issue, so its outcome goes to the job's step summary rather than a comment. Sending one needs a fine-grained token with Contents write or a classic token with `repo` (T6), so **the token holder is the authority**: nothing checks who asked.

**Jira** — documented and untested (T6). A Jira Automation rule's **Send web request** action, with:

- the URL `https://api.github.com/repos/<owner>/<repo>/dispatches` and the method `POST`;
- a header `Authorization` with the value `Bearer <token>`, marked hidden, where the token has Contents write on the repository;
- a custom body in the shape above.

That token is a GitHub write credential held outside GitHub, and whoever can edit the rule can start runs with it.

**GitLab** has no pipeline source for an issue or a label, so reacting to a GitLab issue label needs a relay that receives GitLab's issue webhook and calls GitHub's dispatch API (T6). None ships.

---

## 7. What is not verified here

Every automated case drives a `gh` stub. Gate 12 round 5 (2026-10-01, CLI 0.5.0) observed the rows under *Verified in Gate 12 round 5* below against a real repository; none of the others has been.

| Behaviour | What rests on it | Source | If it is wrong |
|---|---|---|---|
| Labelling an issue starts a run that reaches "branch ready for review" with the maintainer's machine off | The whole chain | Gate 12 observation (xiii), reached in round 5 up to a paused run with the machine on but no daemon installed; the run to "branch ready for review" with the machine off is not yet recorded ([`development.md`](development.md) → `## 5. Verifying a change`) | The failing step is visible in the trigger job's log and the issue comment |
| The permission API answers `read` for a triage user | Refusing triage (§3) | Documented, not measured: no second account (T3) | A triage user would still need an answer of `admin` or `write` to pass, so a different answer refuses as well |
| A label an issue form adds at creation raises `labeled`, and with which `sender` | The advice to keep the trigger label out of issue forms (§3) | Not established (T1) | The permission check still refuses a sender without write access |
| A `concurrency` group keeps at most one pending run and cancels an earlier pending one | The decision to declare none (§1) | GitHub's documented behaviour, not retrieved in this branch | Nothing built depends on it: the workflow has no group |
| A Jira rule's **Send web request** reaches `repository_dispatch` end to end | §6's Jira route | GitHub side documented, Jira side documented in parts, the chain untested (T6) | The route is documentation only; nothing ships for it |
| A `workflow_dispatch` run's `headSha` in `gh run list` is the commit the dispatched ref pointed at when it was dispatched | The comment's run lookup (§1 step 6) | Not retrieved in this branch, because unattended runs have no web access; Gate 12 (xiii) leg (d) in [`development.md`](development.md) records it | No run matches, so the comment names the branch's filtered run list rather than the run; it never names another lineage's run |


### Verified in Gate 12 round 5

| Behaviour | Observed |
|---|---|
| The dispatched run appears in `gh run list` within the trigger's lookup bound (`TRIGGER_RUN_LOOKUP_TRIES`) | For a branch with no earlier runs: issue #7's comment named run `36835744979`, the `harness run feat_invoices_2` the trigger dispatched. For a branch name with earlier runs the lookup named an older run instead, a defect recorded in [`development.md`](development.md) → Gate 12 → Round 5, finding 1; `fix_forge_trigger_run_lineage` fixed it by matching the run's `headSha`, and the fix is not yet re-observed on GitHub |
| Runs of a deleted branch stay listed under its name by `gh run list --branch` | `restore` on a new `feat_invoices` found run `36569531374` of the deleted `feat_invoices` of rounds 3 and 4 ([`development.md`](development.md) → Gate 12 → Round 5, finding 1). The run-history reason in §2's **What counts as taken** rests on this observation |

---

## 8. What this does not do yet

Each belongs to `feat_forge_run_control`, which follows this branch:

- a pull-request review starting a user-review fix round;
- park-and-ask over issue or pull-request comments;
- pause, resume and stop from comments;
- lifecycle comments (`parked`, `paused`, `completed`, `failed`) on the issue or pull request;
- draft-pull-request output when a run completes.

No adapter exists beyond GitHub's two events, `issues` `labeled` and `repository_dispatch`.
