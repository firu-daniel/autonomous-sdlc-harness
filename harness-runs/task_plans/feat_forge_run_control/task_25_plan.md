### Task 25 — Document security, both sides, what is not verified, and the GitHub entry point

**Goal:** Finish `docs/github-run-control.md` with three sections and an entry-point summary:

- `## 6.` — who can act, pull requests from forks, and what comments make visible;
- `## 7.` — working a run from both sides at once;
- `## 8.` — the GitHub behaviours this rests on without having observed them;
- `## The GitHub entry point`, placed before `## 1.` — the adopter-docs section goal 9 and acceptance 10 require.

The entry point lists, in order, the one-time local setup one maintainer does, what a team member with write access then does from GitHub alone, what still needs a local machine, and the caveats. Nothing in it says the team moves off the local route, or that every team member needs a local install. The two routes are not alternatives, and anyone may use both at once.

**Depends on:** Task 24, which leaves `docs/github-run-control.md` with its opening and `## 1.`–`## 5.`. This task appends `## 6.`–`## 8.` after `## 5.` and inserts `## The GitHub entry point` between the opening and `## 1.`. The facts it states, restated so this file stands alone:

- **Authorisation.** Commands and reviews pass the trigger's actor check: `admin` or `write` from the collaborator-permission API, so triage is refused (T3); a listed bot only; never `ghost`.
- **Forks.** A fork's review never runs: the workflow's `if:` skips it, and its token is read-only anyway (C2). A comment on a fork's pull request is refused with a reply, because an `issue_comment` job carries the repository's secrets (C2). `pull_request_target` is never used, and nothing from a pull request's head is checked out or run: the control job runs the default branch's scripts.
- **Self-triggering.** Every harness comment carries the hidden line and is posted with the job's own token, which starts no workflow (S3).
- **Both sides.** Local commands act on the same runs. Each side sees the other through lifecycle comments and labels, and a local `remote-run.sh stop` or `/autonomous-sdlc-harness:branch-user-review` also reports on GitHub. The **Run workflow** form stays the fallback.
- **A locally executed branch reviewed on GitHub.** Its round runs through `harness-run.yml`; its local record keeps `execution: local` and is untouched; its working copy falls behind `origin/<branch>`.
- **Who can request changes on the delivered pull request** (Task 6's decision, documented in `## 4.` by Task 24). With `HARNESS_GIT_TOKEN` set, the draft pull request is opened with it, so its author is the token's owner, and GitHub does not let a pull request's author request changes on their own pull request. A solo maintainer whose own token that is cannot start a round from GitHub with a review; they set a token of a machine account, or start the round locally with `/autonomous-sdlc-harness:branch-user-review`. Without the token, anyone with write access can request changes, and CI needs the approval click (S3). The rule is GitHub's documented behaviour, not retrieved in `docs/github-integration-research.md`; C1 measured only a pull request opened by `app/github-actions`.

**Where this task stops.** The README's two entry points and its short GitHub section are Task 30's, which links to this task's `## The GitHub entry point`. The trigger document's own changes are Task 26's, and `docs/remote-execution.md`'s are Tasks 27 and 28's.

### Targets

- `docs/github-run-control.md` — `## The GitHub entry point`, `## 6.`, `## 7.` and `## 8.`.

**Work:**

- [ ] **`## 6. Who can act, and pull requests from forks`**:
  - the shared check and why triage is refused;
  - the fork rule in three sentences: never `pull_request_target`, a fork's review skipped, a fork's comment refused;
  - that nothing from a pull request's head runs;
  - the self-trigger guard;
  - **what a commenter vouches for**: as the labeller vouches for an issue's text (`github-issue-trigger.md` → `## 4. What the labeller vouches for`), an authorised reviewer or answerer vouches for the text that becomes a round or an answer;
  - **visibility**: park questions, answers and review text become comments, public on a public repository, beyond what the artifact and the workflow inputs already expose ([`remote-execution.md`](remote-execution.md) → `## 11. Security`).

  State the fork rule next to a pointer at that section's self-hosted-runner warning.
- [ ] **`## 7. Working a run from both sides`**:
  - every local command still works for the same runs (acceptance 7);
  - which side posts what, so each sees the other;
  - that a trigger-started run is reached locally through the `<branch>:` prefix;
  - that the **Run workflow** form ([`remote-execution.md`](remote-execution.md) → `### Working a run from GitHub alone`) stays as the fallback;
  - the locally-executed-branch rule. Bringing that working copy current before another local round is one fenced command, run in the working copy:

    ```
    git pull --ff-only
    ```

- [ ] **`## 8. What is not verified here`**, a table *behaviour | what rests on it | source | if it is wrong*, in `github-issue-trigger.md` → `## 7.`'s style. The intro says every automated case drives a `gh` stub, and Gate 12 observation (xiv) in [`development.md`](development.md) records them. Rows:
  - the prefilter's `contains()` being case-insensitive — GitHub's documented behaviour, not retrieved here; if wrong, a mixed-case handle goes unanswered and is never obeyed;
  - adding a missing label, or creating one, with the job token's `issues: write` — not retrieved; if wrong, one warning line and no label;
  - a pull request's conversation comment and labels going through the issues endpoints — not retrieved;
  - a pull request comment's size limit (S6 measured issue comments only);
  - a draft refused for a plan without drafts (C3, unmeasured) — the one ready retry;
  - a pull request's author being unable to request changes on their own pull request — what rests on it: the advice that a solo maintainer uses a machine account's token for `HARNESS_GIT_TOKEN` or starts the round locally; source: GitHub's documented rule, not retrieved here (C1 measured only a pull request opened by `app/github-actions`); if it is wrong, the token's owner can start a round from GitHub after all, and the advice is merely unneeded;
  - a newer pending run cancelling an older one in `harness-run.yml`'s `concurrency` group — not measured, and why the in-flight refusal makes it moot;
  - the whole chain on GitHub — Gate 12 (xiv).
- [ ] **`## The GitHub entry point`**, between the opening and `## 1.`. One paragraph says GitHub is a second entry point beside the local one, the setup comes first, and the two can be mixed. Then four lists:
  1. **The one-time setup, by one maintainer, locally**, in order:
     1. install the plugin;
     2. run `init`;
     3. run `/autonomous-sdlc-harness:harness-analyze`, recommended;
     4. set `forge` to `github` and `execution.target` to `github-actions`, then run `init` again, which writes the four workflows;
     5. commit;
     6. refresh `gh`'s `workflow` scope;
     7. push to the default branch;
     8. set a credential secret;
     9. set `HARNESS_GIT_TOKEN` when tasks will edit `.github/workflows/*` — it also opens the draft pull request so CI runs on it. Its owner becomes the pull request's author and so cannot request changes on it: prefer a token of a machine account, especially for a solo maintainer, or plan to start review rounds locally with `/autonomous-sdlc-harness:branch-user-review` (link to `## 4.`);
     10. create the trigger label `sdlc-harness`;
     11. switch on *Allow GitHub Actions to create and approve pull requests*, unless `HARNESS_GIT_TOKEN` is set.

     Each action links to where its command is written — [`github-issue-trigger.md`](github-issue-trigger.md) → `## Turning it on, in short` and [`remote-execution.md`](remote-execution.md) → `## 7. Turning it on` — rather than restating it.
  2. **What a team member with write access then does from GitHub alone**: label an issue `sdlc-harness`; answer, pause, resume or stop with `@sdlc-harness` comments (`## 1.`); request changes on a pull request from the run's branch, draft or not (`## 2.`); follow the lifecycle comments and labels (`## 5.`). Triage is refused (`## 6.`).
  3. **What still needs a local machine**:
     - running or re-running `/autonomous-sdlc-harness:harness-analyze`, which is supervised and has no remote route (research A12);
     - upgrading (`init --upgrade-workflows`, `init --force`), since the workflows pin the harness version;
     - `doctor`;
     - a configuration change that needs files re-rendered — a plain switch in `harness.config.json` can be edited in a pull request on GitHub, because the job reads the file from the branch;
     - the interactive-test phase, which a remote run skips, so the branch still owes a local `/autonomous-sdlc-harness:branch-qa-test` while `phases.qa` is on, until `ROADMAP.md`'s *Cloud QA* row lands.
  4. **The caveats**: every run uses the repository's one credential secret, billed to its owner ([`remote-execution.md`](remote-execution.md) → `## 9. Credentials and billing`); on a public repository the comments are public (`## 6.`); and when `HARNESS_GIT_TOKEN` is a person's own token, that person cannot start a round with *Request changes* on the pull request it opened (`## 4.`, `## 8.`).

**Verification:**

- `git grep -n -E '^## ' -- docs/github-run-control.md` lists `## The GitHub entry point`, then `## 1.` through `## 8.` in order.
- `git grep -n -i "moves to github\|move to github\|every team member needs" -- docs/github-run-control.md` finds nothing.
- Every `](#…)` link in the document resolves to one of its own headings.
- Every command a reader is meant to type in this task's sections sits in a fenced block.
