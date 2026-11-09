### Task 10 — Re-key the rendered-workflow zizmor residual set and add roadmap item 35

**Goal:** Two catch-all edits that follow from Task 6's restructured `harness-run.yml`:

- **(a)** The zizmor residual set Gate 14d grades the rendered workflows against must name the checkouts that now keep their credential. `run` no longer does; the new `open` and `deliver` jobs do.
- **(b)** The post-release measurement on a real GitHub run that goal 3 and the Constraints ask for is a deferral. A deferral cites a numbered roadmap item, and the number owes a row (`.claude/context/conventions.md` → `## Documents of record`). So add item **35**.

**Depends on:** Tasks 3 and 5 for row 35's re-toggle and workflow-file checks. `remote-run.sh deliver` turns a ready pull request back to a draft with the job's token and marks it ready with `HARNESS_GIT_TOKEN`, logging both. `push-branch.sh`, while the job push-credential marker is set, refuses commits that change a file under `.github/workflows/`, a merge counted against its first parent, through the push-refusal record.

**And on Task 6.** In `harness-run.yml`:

- the `run` checkout sets `persist-credentials: false`;
- the new `open` job (before `run`) and the new `deliver` job (after it) each check out the default branch with `token: ${{ github.token }}` and keep it persisted, as `collect` does;
- `warm` still sets `persist-credentials: false`;
- `adhoc-packages` still stands on `run`'s `Install the claude CLI when absent`.

The rewritten `# THE CHECKOUT CREDENTIAL.` block names `open`, `deliver` and `collect` as the persisting checkouts.

### Targets

- `scripts/check-rendered-workflows.mjs` — the `RESIDUAL` array and its doc comment.
- `docs/development.md` — **Gate 14d**'s residual-set list, and `## 6. The roadmap this tree defers to`'s table (row 35).

**Work:**

- [ ] **`RESIDUAL`.** Replace `'harness-run.yml artipacked run'` with `'harness-run.yml artipacked open'` and `'harness-run.yml artipacked deliver'`. Keep `'harness-run.yml artipacked collect'` and `'harness-run.yml adhoc-packages run'` and every other file's entries. Keep the doc comment's justification sentence true for the new set.
  - zizmor's other audits may fire on the two new jobs — say, an excessive-permissions or secrets-outside-env finding. If so, Task 6's job shape is what changes, never this set: the set lists only `artipacked` and `adhoc-packages`, each argued in its template's header, and a new entry here needs that argument first.
- [ ] **Gate 14d's list in `docs/development.md`.** Replace the bullet *"`harness-run.yml` `artipacked` on `run` and `collect`: both push through `push-branch.sh` with the checkout's persisted credential."* with one naming `open`, `deliver` and `collect`: agent-free jobs that read origin, or push, through it. Add that `run` sets `persist-credentials: false` and pushes through the stored entry `harness-run.yml`'s `# THE CHECKOUT CREDENTIAL.` names. Leave the dated round records and audit measurements above and below it unchanged: they are records.
- [ ] **Roadmap row 35** in `## 6.`'s table, in the table's shape. Its subject is the post-release measurement on a real GitHub-hosted run of a repository re-rendered with `init --upgrade-workflows` at the release carrying `fix_run_job_credential_exposure`. Its checks:
  - every in-session commit is on origin as it lands, pushed with the stored `github.token`, and the end-of-job `Push the branch` still pushes;
  - `GH_TOKEN`, `GITHUB_TOKEN`, `HARNESS_PR_TOKEN` and `HARNESS_PUSH_URL` are absent from the agent CLI's `environ`, read by the probe-written-script route PD31's fix uses;
  - `.git/config` holds no `extraheader`, and `~/.git-credentials`, while it holds the stored entry, is refused both to a sandboxed read (S1's shape) and to the file tools — a `Read` of it (S2's shape). Until this row is taken, that deny is derived from the profile's `sandbox.credentials.files` entry and `Read` deny pair, whose mechanism S1 (runner) and S2 (runner) measured on `~/.ssh` only;
  - the adopter's CI runs on the `opened` event from the `open` job and on the `ready_for_review` flip `deliver` makes with `HARNESS_GIT_TOKEN`, read from the `deliver` job's *"… ready for review with HARNESS_GIT_TOKEN"* line and the CI run list;
  - **the re-toggle:** on a second run over a pull request that is already ready for review (a user-review round whose own `--undo` was refused, or one a person marked ready, then resumed), `deliver` converts it back to a draft with the job's token and marks it ready with `HARNESS_GIT_TOKEN`, and the adopter's CI runs on that `ready_for_review`, read from `deliver`'s *"turned pull request #<n> back to a draft …"* line and the CI run list; and that the conversion starts none of the harness's own workflows;
  - **the gap the re-toggle leaves:** on a plan without drafts the conversion is refused, so a later run's final tip gets no `ready_for_review` and no CI. Record whether that holds;
  - `github.token` still cannot push a `.github/workflows/` change (re-taking `docs/github-integration-research.md` S1 on the new job), and `push-branch.sh` refuses such a commit at the first in-session push, with the run marked `failed` naming the reason and nothing of the run pushed after it;
  - whether GitHub refuses a `github.token` push whose only workflow change arrives through a merge of the default branch (a `refresh-branch.sh` merge), which `push-branch.sh` counts against the merge's first parent and so refuses. A result that GitHub accepts it is a follow-up fix narrowing the check;
  - whether a job's runner receives every secret the job references when the job starts. That is recorded for the record: the design does not rely on it.

  It also says that a result disagreeing with the design is a follow-up fix, never a silent docs edit, and that it holds for the hosted `ubuntu-26.04` image unless another is measured.

**Verification:**

- `RESIDUAL` holds exactly one `artipacked` entry for each persisting checkout the rewritten `harness-run.yml` header names, plus the unchanged `adhoc-packages` and other-file entries.
- The rendered workflows are graded by Gate 14d in the closing gate round, not by this task.
- The roadmap legend's reproducible citation grep (`grep -rn -E "items? [0-9]+" . --exclude-dir=node_modules --exclude-dir=dist`) reports 35 only where a row exists for it once this task lands.
- No dated round record in `docs/development.md` was edited: `git diff` of that file touches only the Gate 14d bullet and the new row.
