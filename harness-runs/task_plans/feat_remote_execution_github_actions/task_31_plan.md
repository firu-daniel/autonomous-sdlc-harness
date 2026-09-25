### Task 31 — Add hand-run Gate 12 for a real GitHub repository, and list it in `scripts/run-gates.sh`

**Goal:** Ship the step that produces the real-shape evidence remote execution's design rests on. Every automated case in this branch drives a `gh` stub and an agent stub; the GitHub behaviours the design depends on can only be observed against a real repository, so this branch writes that procedure down as a hand-run gate rather than letting a stubbed suite stand in for it (`harness-runs/lessons.md` → *"A figure measured under a test stub … never justifies a design decision: the branch that makes the decision also ships the gate step that produces the real-shape figure"*). This branch documents the gate; it does not run it.

**Depends on:** Tasks 15, 16 and 17, which produce what the gate drives: `init` writing `.github/workflows/harness-run.yml` and `harness-resume.yml` when `execution.target` is `github-actions`; the `run`, `pause` and `warm` actions; the poller. And Task 28, whose `## 6. What is not verified here` lists the behaviours the gate records, each with its source.

**What Gate 12 records**, each as a measured fact with the command and the exact message or observation (`.claude/context/conventions.md` → `## Documents of record`):

1. A throwaway **private** GitHub repository adopted with `init`, the key set, the workflows pushed to the default branch, one credential secret set, and `doctor --check-github` passing — or the exact failure.
2. A drop dispatched by the local watcher starts the `run` job on `ubuntu-latest`, and the job's `init --plugin-root-entries` produces a profile whose plugin-root entries match what `doctor`'s `plugin-permissions` asks for (the prompt's *"check that the job's plugin install produces a root `init` can resolve"*).
3. With `HARNESS_SELF_PAUSE_AFTER_MINUTES` set small, the job self-pauses, re-dispatches itself with `GITHUB_TOKEN`, and the next job resumes from the ledger — recording that the `workflow_dispatch` exception held.
4. A `pause` dispatch runs no job and is billed nothing (the run's usage view), and the running job honours it.
5. `gh workflow enable` and `gh workflow disable` of `harness-resume.yml` under the job's `GITHUB_TOKEN` — succeeded, or the exact refusal.
6. `timeout-minutes` at the step level accepted the expression the template uses, or what GitHub reported.
7. With `HARNESS_RUNNER` set to a self-hosted runner's label, the same workflow runs there and no self-pause occurs.
8. A job cancelled mid-run (`remote-run.sh stop <branch>`) does not re-dispatch, and `/autonomous-sdlc-harness:branch-resume` after a `sync` resumes it from the pushed ledger.
9. Both credentials set: which one the run's `system` event reports it used.

### Targets

- `docs/development.md` — §5's opening count ("Eleven gates.") and its list of the gates `scripts/run-gates.sh` reports as hand-run, and a new **Gate 12 — remote execution against a real GitHub repository** after Gate 11 (register row 57).
- `scripts/run-gates.sh` — the header's gate count and the `hand_run` line naming the hand-run gates (hand-written; not an `init` copy).

**Work:**

- [ ] Write Gate 12 in the form Gates 10 and 11 use: why it is hand-run (it needs a real repository, a runner, a credential and minutes), the setup as commands in fenced blocks, one per line, the nine observations above each with what passes and what to record, and where the result is recorded (a dated paragraph under the gate, and the matching line of `docs/remote-execution.md` → `## 6.` moved from *not verified* to *verified on <date>*).
- [ ] Update §5's opening: twelve gates, and the hand-run list gains 12.
- [ ] Update `scripts/run-gates.sh`'s header count and its `hand_run` sentence so the summary names gate 12 among the hand-run gates, changing no graded gate.

**Verification:**

- `bash scripts/run-gates.sh` exits as it did before this task and its summary line names gate 12 as hand-run.
- `bash scripts/check-command-spelling.sh` passes; every command in the gate sits in a fenced block, one per line.

**Deviations from plan:** The first verification bullet's "exits as it did before this task" rests on reading, not on a baseline run: no pre-change run was taken. The post-change run exits 1 on two gates, 6a (an untracked `harness-runs/scratch/t3-test.log` carrying absolute paths) and 11 (retrieval runtime not installed, `check-floor.mjs` exit 1), neither of which reads `docs/development.md` or the edited lines of `scripts/run-gates.sh`. Because the run is red, the `hand_run` summary line (printed on a green run only) was not observed; the `== gates this script cannot run` block did print gate 12, and the `hand_run` string was checked by reading.
