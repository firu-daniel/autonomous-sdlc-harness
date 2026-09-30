### Task 20 — Write `docs/github-issue-trigger.md`, the issue trigger's document of record

**Goal:** Write the adopter-facing design of record for starting a run from GitHub. It covers:

- how to turn it on and what happens when an issue is labelled;
- how the branch is named and who may start a run;
- what the labeller vouches for;
- how the run is then worked, locally or from GitHub alone, and how to run it on one's own hardware;
- how Jira and GitLab fit;
- what is not verified and what is still to come.

Every GitHub fact is cited from `docs/github-integration-research.md` by its ID (S1, S3, T1–T6) rather than restated as re-verified: an unattended run fetches no web page.

**Depends on:** every `cli` and `plugin` task, whose shipped behaviour this document describes:

- Tasks 1 and 13: the names, and when `init` writes `harness-trigger.yml`;
- Task 3: the branch-name rule, whose section in `cli/templates/scripts/lib/harness-run-lib.sh` states the reasons this document repeats for an adopter;
- Tasks 6–8: `remote-run.sh start` and `trigger`, whose header paragraphs are the code of record for the authorisation order, the refusals, the snapshot shape, the comment and the label removal;
- Task 10: `adopt`;
- Task 11: the notification text;
- Tasks 14 and 15: `doctor`;
- Task 16: the commands that adopt.

**Where this task stops.** This document owns the trigger. `docs/remote-execution.md` stays the design of record for the run itself, and Task 21 edits it: its `## 5.` seam, its local-command table, its secrets table, and a `### Working a run from GitHub alone` subsection under `## 1.`. This document cites `docs/remote-execution.md` → `## 1. The lifecycle of a remote run`, which exists today, rather than that subsection, and does not restate the route: Task 21 ships after this task, so a pointer to its subsection would dangle from this commit until Task 21's (`.claude/context/conventions.md` → `### The order files are created, so a half-built feature is still coherent`). The subsection lands inside `## 1.`, so the section pointer reaches it once Task 21 ships — the same choice Task 11 and Task 17 make. `docs/config.md`'s `forge` row is Task 23's, and the Gate 12 procedure is Task 24's.

### Targets

- `docs/github-issue-trigger.md` (new).
- `llms.txt` — one entry for the new document.

**Work:**

- [ ] **Opening and setup.**
  - The document opens with `# Starting a run from a GitHub issue`, then a **Who reads this:** paragraph stating whom it serves and what it owns and cites (`.claude/context/conventions.md` → `## What accompanies a new unit of each kind`, the row *A prose document under `docs/`*).
  - `## Turning it on, in short` lists every command in its own fenced block, one command per line (`harness-runs/lessons.md` → *Adopter-facing documentation*):
    - `npx autonomous-sdlc-harness config set forge github`;
    - `npx autonomous-sdlc-harness config set execution.target github-actions`, when remote execution is not on yet;
    - `npx autonomous-sdlc-harness init`;
    - the `git add` of `.github/workflows/harness-trigger.yml`, the commit, `gh auth refresh -s workflow`, and the `git push --no-verify origin <default branch>` push `docs/remote-execution.md` → `## 7.` step 3 explains;
    - `gh label create harness`;
    - `npx autonomous-sdlc-harness doctor --check-github`.

    It names the optional variables `HARNESS_TRIGGER_LABEL` and `HARNESS_TRIGGER_ALLOWED_BOTS`, and points at `docs/remote-execution.md` → `## 7. Turning it on` for the credential secret the run itself needs. Use the adopter's words, "the issue trigger" and "the trigger label", in prose; keep `forge`, `harness-trigger.yml` and the variable names spelled as the wire identifiers they are (the ledger's naming rule).
- [ ] **`## 1. What happens when an issue is labelled`** walks the sequence as a numbered lifecycle, in the style of `docs/remote-execution.md` → `## 1.`:
  1. the `labeled` event, and why not `opened` (T1);
  2. the skipped job for any other label (billing zero, round 2);
  3. `remote-run.sh trigger`'s refusal order;
  4. the branch derivation and the snapshot;
  5. `start`'s placement, which is the watcher's own through the run library, then its dispatch;
  6. the comment and the label removal;
  7. from there, the same run a local drop starts.

  State the adapter shape *event → (branch, task text) → placement → dispatch*, and that `start` is where any later adapter plugs in. State **Running it on your own hardware**: a GitHub-triggered run always executes through `harness-run.yml`, because GitHub cannot reach your machine, and a self-hosted runner named in `HARNESS_RUNNER` runs it there (`docs/remote-execution.md` → `## 8. Choosing a runner`). This is the task prompt's goal 3, stated as the way to run a GitHub-triggered run locally.
- [ ] **`## 2. The branch name`** gives the rule and its decisions:
  - the ASCII fold under `LC_ALL=C`, and runs outside `[a-z0-9]` becoming one `_`;
  - the 60-character cap and why;
  - the fallback `issue_<number>`;
  - the `_2`… suffix, with none on the first branch;
  - every source of *taken* and why each: a merged branch's artifacts, the protected set, a case-insensitive `origin` match (T5), a local registry record;
  - the inbox round-trip check;
  - that `/autonomous-sdlc-harness:branch-prompt` keeps its confirmed name.

  Include the prompt's own examples as a small table.

  **`## 3. Who can start a run`**, in one statement an adopter can act on:
  - a person whose repository permission is `admin` or `write` (maintain counts as write, triage does not — T3), because applying a label needs only triage (T1);
  - a bot only when listed in `HARNESS_TRIGGER_ALLOWED_BOTS`, and a listed bot is not asked about its permission;
  - never `ghost`;
  - how the checks relate to `anthropics/claude-code-action`'s (T4), restated rather than reused, without its `[bot]` shortcut;
  - a warning against putting the trigger label in an issue form, whose automatic labels were not measured (T1, *Not established*). The permission check would still refuse a read-only author.
- [ ] **`## 4. What the labeller vouches for`**:
  - the issue text may come from someone without write access;
  - the job holds `contents: write`, and the run job the credential secrets (T2);
  - so the label means *"run this text as a task"*;
  - the committed prompt is the snapshot at label time, and a later edit does not reach the run;
  - the trigger job itself references no secret.

  Also state the existing remote-run limit: a run whose **task** edits `.github/workflows/*` cannot push that edit with the job token, and needs a workflow-capable `HARNESS_GIT_TOKEN` (S1, with its quoted refusal line). The trigger itself touches no workflow file, which S1 verified pushes.

  **`## 5. Working the run`**:
  - with a local setup, any of `/autonomous-sdlc-harness:branch-answer`, `-resume`, `-pause` or `-user-review` adopts it first, `branch-status` lists it until then, and relays need the local watcher running when you act;
  - without one, `docs/remote-execution.md` → `## 1. The lifecycle of a remote run` — the section heading, which exists today, never the `### Working a run from GitHub alone` subsection Task 21 adds inside it later (see *Where this task stops*);
  - the notifications name both routes.
- [ ] **Closing sections, and `llms.txt`.**
  - **`## 6. Other trackers`**:
    - the `repository_dispatch` payload `{"event_type": "harness-task", "client_payload": {"title", "body", "source"}}`, with its limits (T6);
    - a Jira Automation rule's **Send web request**, with the method, an `Authorization: Bearer` header holding a Contents-write token as a hidden value, and the body. It is documented and untested (T6), and the token holder is the authority;
    - GitLab needs a webhook relay (T6).
  - **`## 7. What is not verified here`** is a table in `docs/remote-execution.md` → `## 6.`'s shape:
    - the whole chain with the machine off (Gate 12 observation (xiii), pending);
    - the permission API's answer for a triage user, documented and not measured (T3);
    - issue-form labels (T1);
    - a pending run cancelled by a concurrency group, the reason the workflow declares none. This is GitHub's documented behaviour, not retrieved in this branch;
    - the dispatched run appearing in `gh run list` within the lookup's bound, with the filtered-list fallback;
    - Jira end to end (T6).
  - **`## 8. What this does not do yet`**: pull-request review rounds, park-and-ask and pause, resume or stop over comments, lifecycle comments, and draft-pull-request output, all `feat_forge_run_control`'s; and no adapter beyond GitHub's two events.
  - Add `llms.txt`'s entry after `docs/remote-execution.md`'s, in the same `https://github.com/firu-daniel/autonomous-sdlc-harness/blob/main/docs/github-issue-trigger.md` form with a one-clause description, which `scripts/check-llms-txt.sh` requires.

**Verification:**

- Read `## Turning it on, in short` and every other section that hands the adopter a command: each command sits alone on its line inside a fenced block, with none inline in prose and none joined by `&&`.
- Every `docs/github-integration-research.md` ID the document cites exists there: `grep -n -E "^### (S1|S3|T[1-6])\." docs/github-integration-research.md` lists each cited ID.
- The new `llms.txt` line has the exact form of its neighbours, `- [docs/github-issue-trigger.md](https://github.com/firu-daniel/autonomous-sdlc-harness/blob/main/docs/github-issue-trigger.md): …`, and `git ls-files --cached --others --exclude-standard docs/github-issue-trigger.md` lists the target.
