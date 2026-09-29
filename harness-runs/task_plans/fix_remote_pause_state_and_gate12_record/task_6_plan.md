### Task 6 — Record Gate 12 rounds 1 and 2 and add the remote park-and-answer observation in `docs/development.md`

**Goal:** Gate 12's own text in `docs/development.md` → `## 5. Verifying a change` should tell the next person five things: that round 1 (0.4.0) and round 2 (0.4.1) were run, which observations passed, which were skipped or not reached and why, which still owe a first recording, and what round 2's two findings changed. It also gains an observation for a path round 2 exercised that the gate has none for: **a remote park answered and resumed**.

**Depends on:** Task 5, which records round 2 in `docs/remote-execution.md`. That file's `## 6. What is not verified here` keeps its heading and gains a `### Verified in Gate 12 round 2` sub-section. Its `### Runs longer than a job` states the planning-draft decision. This task cites those sections by heading. It also states Tasks 1–3's changes in one line each as round 2's findings:

- the state bundle now carries the untracked planning drafts, and a job restore puts them back without overwriting;
- both workflow templates pin Node 24 majors, listed in each header's `# ACTION PINS.` block.

This task changes no file but `docs/development.md`.

**The round-2 record** is the only evidence this task may use, restated so the file stands alone. Round 2 ran on 2026-09-29 against the private scratch repository `firu-daniel/harness-gate12-r2`, with CLI 0.4.1, a GitHub-hosted runner, `phases.qa`, `docs` and `parity` off, `execution.target: github-actions`, adopted with `npx autonomous-sdlc-harness@0.4.1 init`, and one task dropped as `feat_invoice_totals`.

- **(i) and (ii): reached, lines not recorded.** Jobs ran to "branch ready for review" under 0.4.1's plugin-root grants, but neither the `doctor --check-github` lines nor the preflight's `PASS` lines were carried into this repository. Both owe a first verbatim recording. The `claude` version the job installed was not carried either.
- **(iii): passed.**
  - With `HARNESS_SELF_PAUSE_AFTER_MINUTES=5` the job dropped `PAUSE` at exactly 300 s (`reason budget`).
  - `continue` logged `dispatched action=run engine=task resume=pause`, and a new `harness run <branch>` run restored the bundle and resumed.
  - `expires_at` was 90 days after creation, and `artifact-and-log-retention` was `{"days":90,"maximum_allowed_days":400}`.
  - Whether a push started another workflow was **not measured**: the repository had none.
  - The chain exposed finding 1: three consecutive jobs each ran the task-plan writer and paused before any reviewer; only the ledger reached the branch; and the second job's bundle held exactly four files. The run's own `PAUSE_PROGRESS.md` recorded that *"the untracked story index and per-task files from the first session were not on disk (the checkout was fresh)"*.
- **(iv): passed.** Both jobs of the `harness pause` run were `skipped`, with `timing` → `"billable":{"UBUNTU":{"total_ms":0,"jobs":2,…}}`. The running job found the run 47 s after its creation and ended with decision `stop`.
- **(v): disable passed, enable and in-progress artifact not observed.** The disable logged `poll: no branch is waiting; disabled harness-resume.yml`, with the workflow's state `disabled_manually`. The enable and the in-progress artifact listing were **not observed**, because no job ended on a usage pause.
- **(vi): passed.** Every `harness-run.yml` run was accepted and its `Run the harness` step ran.
- **(vii): skipped.**
- **(viii): passed.** `remote-run.sh stop` dispatched the marker, cancelled the running job (whose post-steps still saved and uploaded the bundle) and started nothing new. A later resume restored that cancelled job's bundle.
- **(ix): skipped.** No API key was available.
- **(x): skipped.** The remote QA path is `ROADMAP.md`'s *Cloud QA* row. Cite it **by name**, never as "item 31" or "point 31", because `## 6. The roadmap this tree defers to` has no row 31, and its rule is that a cited number owes a row.
- **A full delivery.** One 240-minute job took the task from planning to "branch ready for review" in 30 m 35 s, with every enabled phase `[x]`.
- **Finding 2.** Every run printed *"Node.js 20 is deprecated. The following actions target Node.js 20 but are being forced to run on Node.js 24: actions/checkout@v4, actions/upload-artifact@v4."*
- **The park path, the new observation (xi): partly observed.**
  - A task that left three security limits undecided made the task-plan writer park before writing a draft (`question_1.md`, `job: parked stop`).
  - An `answer_1.md` was written **by hand** into the worktree clarifications directory. That is the file `/autonomous-sdlc-harness:branch-answer` writes, but the command itself was not run.
  - One `tick` relayed it: `relayed the answers (1) of parked remote run`.
  - The next job logged `restored the bundle of run <id>`, `wrote answer_1.md for <branch>` and `resuming parked run '<branch>' (answers 1)`. The session passed `answered` to the walker and dispatched the writer with the answers attached, without re-parking.
  - The operator stopped the run before P1, so the answered writer's plan converging was **not observed**.

### Targets

- `docs/development.md` → `## 5. Verifying a change` → **Gate 12 — remote execution against a real GitHub repository.** and the paragraphs under it, up to and including **Teardown.** and **Where the results go.**

**Work:**

- [ ] **The lead paragraph and round 1's close.**
  - In the gate's lead paragraph, change *"Ten observations, after a setup that is itself the first."* to eleven.
  - In the **Round 1** paragraph's close, replace *"The fixes ship in 0.4.1; none has been observed on a runner. **The re-run on 0.4.1 starts from observation (i)**, and every observation is re-recorded."* It should say the fixes shipped in 0.4.1 and that round 2, below, ran on it.
- [ ] **A new `**Round 2 — 2026-09-29, CLI 0.4.1.**` paragraph**, placed after round 1's numbered findings and before **Setup.**, in round 1's style. It carries:
  - the scratch repository and configuration;
  - one sentence per observation (i)–(xi) with its outcome (**passed**, **reached — lines not recorded**, **not observed**, **not measured** or **skipped**), its evidence as quoted in the record above, and its reason where it did not pass;
  - the full-delivery figure;
  - the statement that the job's `claude` version was not carried.
  Then a short numbered list, as round 1's is: *"The two findings, and what this branch changed for each"*. Finding 1 was the lost planning drafts, and the change is that the bundle carries them, as `docs/remote-execution.md` → `### Runs longer than a job` states. Finding 2 was the Node 20 action pins, and the change is the Node 24 majors in each template's `# ACTION PINS.` block.
- [ ] **A closing sentence, "What still owes a first recording".** Name:
  - (i) and (ii)'s verbatim lines;
  - (iii)'s push half;
  - (v)'s enable and in-progress artifact;
  - (vii), (ix) and (x);
  - (xi)'s convergence and the `/autonomous-sdlc-harness:branch-answer` command itself;
  - (iii)'s `expires_at` on the upload-artifact major the templates now pin;
  - that the next round's (ii) should record that no `Node.js 20 is deprecated` notice appears.
- [ ] **Amend observation (iii)** so the push half can be measured next time. Before the drop, the scratch repository gets one trivial workflow triggered `on: push`, committed to its default branch, and the observation records whether a push the job made started a run of it. Give its commands one per line in fenced blocks, as the gate's others are.
- [ ] **Add observation (xi), "A remote park answered and resumed"**, after (x) and before **Teardown.**
  - **Procedure.** Drop a task that leaves a decision undecided, so the task-plan writer parks. Wait for the job's `job: parked stop`. Then run, each command in its own fenced line: `bash <scriptsDir>/remote-run.sh sync <branch>`; `/autonomous-sdlc-harness:branch-answer <branch>` in the session; `bash <scriptsDir>/autonomous-watcher.sh tick`; `gh run list --workflow harness-run.yml`.
  - **Passes when:** the tick relays the answers; the next job logs its `restore` line, `wrote answer_<n>.md for <branch>` and `resuming parked run '<branch>' (answers <n>)`; the run does not re-park on the same question; and P1 converges, meaning the ledger's `P1` flips `[x]` and `chore: Add task plan for <branch>` lands on the branch.
  - **Record:** the relay line, the three job-log lines and the commit.

**Verification:**

- `grep -n "Ten observations\|none has been observed on a runner" docs/development.md` finds nothing.
- `grep -n -E "items? [0-9]+" docs/development.md` reaches no new number introduced by this task. The gate's own rule (*"Every number that command reports, other than 1 and 2, must have a row above"*) still holds, because *Cloud QA* is cited by name.
- Every observation (i)–(xi) is named in the round-2 paragraph with exactly one outcome word. None is recorded as passed without a quoted log line, answer or state from the record above.
- Every command this task adds sits in its own fenced block, one command per line (`harness-runs/lessons.md` → *"Every command an adopter is meant to run sits in a fenced block…"*).
- The heading **Gate 12 — remote execution against a real GitHub repository.** and the section heading `## 5. Verifying a change` are byte-identical to before, because other documents cite both.

**Deviations from plan:**

- (v) and (xi) each have mixed results in the record. To keep exactly one outcome word per observation, each takes the word its own pass condition decides. (v) is **passed**: its pass condition is the disable, and the enable and the artifact listing are described as "never reached". (xi) is **not observed**: its pass condition ends at P1 converging. The half of (iii) that concerns the push is written as "had nothing to answer it" rather than as a second outcome word.
- The amended (iii) names the probe workflow `.github/workflows/push-probe.yml`. It requires `HARNESS_GIT_TOKEN` to be unset, and it reads the probe's runs with `gh run list --workflow push-probe.yml --branch <branch>`, so the setup push's own run of the probe on the default branch is not counted.
