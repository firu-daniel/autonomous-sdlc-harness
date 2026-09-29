### Task 5 — State the planning-draft design and record round 2 in `docs/remote-execution.md`

**Goal:** `docs/remote-execution.md` is the design of record for remote execution. This task makes it state three things:

- **Finding 1's decision:** the bundle carries the untracked planning drafts, why direction (b) was not taken, and what the choice costs.
- **What changed for adopters** with the Node 24 action pins.
- **What Gate 12 round 2 settled**, with its evidence, and plainly what round 2 did not reach. Nothing may stay listed as unverified that round 2 measured, and nothing may be listed as verified that it did not.

**Depends on:** Tasks 1, 2, 3 and 4. This task documents what they built and changes none of their files. The facts it documents, restated so this file stands alone:

- **What the bundle carries (Task 1).** Every job's `harness-state` bundle carries, under `planning/`, whichever of these exist under `<stateDir>`: `story_plans/<branch>_story_plan.md`, `task_plans/<branch>/`, `ui_test_plans/<branch>_ui_test_plan.md`, `ui_test_plans/<branch>/`, `task_plan_reviews/<branch>/`, `business_parity_reviews/<branch>/`, `architecture_reviews/<branch>/`, `ui_test_plan_reviews/<branch>/`.
- **How a restore treats them (Task 1).** A **job** restore places each carried file only where the checkout has nothing at that path, so a committed copy always wins. A **mirror** restore (`sync`) places none. The bundle schema stays `1`.
- **What `restore` reports (Task 2).** It prints `placed <n> planning file(s) …; kept <m> the checkout already carries`. For an expired bundle its warning names *"any planning drafts not yet committed that it carried"* among what is lost. `/autonomous-sdlc-harness:branch-resume` says the same (Task 4).
- **Pins (Task 3).** Both workflow templates now pin each action at the lowest major whose own `action.yml` declares `runs.using: node24`, by major tag rather than sha. The templates' headers carry the chosen majors under `# ACTION PINS.`; cite that block rather than restating version numbers.

**The round-2 record**, from the task prompt, is the only evidence this task may use. Round 2 ran on 2026-09-29 against the private scratch repository `firu-daniel/harness-gate12-r2`, with CLI 0.4.1, a GitHub-hosted runner, `phases.qa`, `docs` and `parity` off, and the task `feat_invoice_totals`.

- **A step's `timeout-minutes` accepts the `env` expression:** verified. Every `harness-run.yml` run was accepted and its `Run the harness` step ran.
- **A `workflow_dispatch` sent with `GITHUB_TOKEN` starts a run:** verified. Job 1's `remote-run.sh continue` logged `dispatched action=run engine=task resume=pause`, and a new `harness run <branch>` run started, restored the bundle and resumed.
- **A push made with `GITHUB_TOKEN` starts no workflow:** not measured. The repository had no other workflow to trigger.
- **A job skipped by its `if:` bills nothing:** verified. On the `harness pause` marker run both jobs were `skipped`, and `actions/runs/<id>/timing` returned `"billable":{"UBUNTU":{"total_ms":0,"jobs":2,…}}`.
- **`upload-artifact@v4` caps `retention-days: 400`:** verified, capped. The artifact's `expires_at` was 90 days after creation, and the repository's `artifact-and-log-retention` was `{"days":90,"maximum_allowed_days":400}`. This was observed on **v4** only.
- **`gh workflow disable` under `GITHUB_TOKEN` with `actions: write`:** verified. A hand-started tick logged `poll: no branch is waiting; disabled harness-resume.yml`, and the workflow's state became `disabled_manually`.
- **`gh workflow enable`:** not observed; no job ended on a usage pause.
- **An in-progress run's artifact is listed and downloadable:** not observed, for the same reason.
- **The 6-hour and 5-day job limits:** not measured. The longest job took 30 m 35 s.
- **`ANTHROPIC_API_KEY` precedence (§9):** not verified; observation (ix) was skipped.
- **A self-hosted runner (§8):** not verified; observation (vii) was skipped.
- **The remote interactive-test skip:** not verified; observation (x) was skipped. Its follow-up is `ROADMAP.md`'s *Cloud QA* row.
- **Other points round 2 settled:**
  - the self-pause dropped `PAUSE` at exactly 300 s (`reason budget`) and chained a new job;
  - a `harness pause` run was found by the running job 47 s after its creation, and the job ended with decision `stop`;
  - `remote-run.sh stop` dispatched the marker, cancelled the running job (whose post-steps still saved and uploaded the bundle) and started nothing new;
  - a later resume restored that cancelled job's bundle;
  - one 240-minute job took the task from planning to "branch ready for review" in 30 m 35 s, with every enabled phase `[x]`.

### Targets

- `docs/remote-execution.md` — the sections named in the bullets below. **`## 6. What is not verified here` keeps that heading byte-identical**, because `docs/development.md`, `docs/outer-loop-verification.md` and this file's own `(§6)` references cite it.

**Work:**

- [ ] **`## 3.` → `### Runs longer than a job`: the decision of record for finding 1.** Add a **Decision:** / **Reason:** pair in the section's existing style.
  - **What was lost, and the decision.** Before this change, a pause in a job lost the untracked planning drafts, because the next job starts in a fresh checkout. The saved walk was then unusable, and the writer re-ran from scratch; in round 2 that happened in three consecutive jobs. Now the bundle carries the drafts and a job restore puts them back, never over a committed file.
  - **Why not commit them before yielding.** That would put unconverged plans into branch history, and it would split P1's meaning of "converged and committed" across the ledger, the walker's unusable-walk check and the plugin's resume overrides, all for a remote-only defect. It would expose nothing less, since a pushed draft is as public as an artifact.
  - **What the choice costs.** The drafts are readable wherever the artifact is (§11), and they expire with the bundle (§4).
  - **Scope.** Only planning is carried, because only planning has a saved walk. A review index a pause interrupts before its commit is regenerated rather than resumed.
  - **Round 2's measured self-pause.** Add the measurement: `PAUSE` dropped at exactly 300 s with `HARNESS_SELF_PAUSE_AFTER_MINUTES=5`, reason `budget`, and a new job chained.
- [ ] **`## 4.` → **Central state.**, **The bundle expires.** and **The walker state.****
  - **Central state.** Add the planning drafts to the list of what the bundle carries, and state the job-only, never-overwrite restore rule with the mirror exclusion and its fast-forward reason. Add round 2's evidence that a resume restored a **cancelled** job's bundle.
  - **The bundle expires.** Name the drafts among what an expired bundle takes with it, and say the writer then runs again from the committed ledger. The `## 1.` command table's `/autonomous-sdlc-harness:branch-resume` row (*"its carried counts and clarification history are lost"*) gets the same addition.
  - **The walker state.** Say the walk the walker state records is now usable in the next job because its drafts travel with it.
  - **What a profile with no plugin-root grant cost — measured.** Replace *"No job has yet been observed reading the plugin root under the grant above."* with what round 2 shows: on 0.4.1, with the grant, a job took a task from planning to "branch ready for review", which no session does without reading the plugin's instruction files. Add that the preflight's verbatim lines were not carried into this repository, so Gate 12 (ii) still owes them.
- [ ] **`## 3.` → `### The kill switch and stopping`, and `### Resuming without the local watcher`.**
  - Under **Pausing one run**, add round 2's measurement: the `harness pause` run was found 47 s after its creation, and the job ended with decision `stop`.
  - Under **Stopping one run**, add round 2's stop: the marker was dispatched, the running job was cancelled with its post-steps still saving and uploading the bundle, and nothing new started.
  - Rewrite **The enable is unverified.**: the disable is verified (round 2's log line and `disabled_manually`), and the enable is still not observed, keeping its existing fallback sentence.
  - Cite Gate 12 in `development.md` for each.
- [ ] **`## 6. What is not verified here`: move what round 2 measured, split what it half-measured, and list what it did not reach.**
  - **Intro.** Rewrite the intro's *"None was verified against a real repository in the branch that built it"* to say Gate 12 round 2 (2026-09-29, CLI 0.4.1) verified the rows moved below, and that the rest remain as stated.
  - **New `### Verified in Gate 12 round 2` sub-section,** with a table (behaviour, what rests on it, evidence, date `2026-09-29`, citing Gate 12) holding: the `GITHUB_TOKEN` dispatch; the skipped-job zero bill; the expression-valued `timeout-minutes`; the disable; and the `retention-days` cap, stated as **observed on `upload-artifact@v4`**, while the major the template now pins (see its `# ACTION PINS.` block) has not been observed by a gate round.
  - **Split rows.** The dispatch row splits: its push half stays unverified, marked *not measured: no other workflow to trigger*. The enable/disable row splits: the enable stays, marked *not observed: no job ended on a usage pause*.
  - **The in-progress-artifact row stays,** marked *not observed*. Its `actions/upload-artifact@v4` wording now names the pinned major by pointing at the template's `# ACTION PINS.` block.
  - **The job-limits row stays,** marked *not measured: the longest job was 30 m 35 s*.
  - **A closing paragraph, "What round 2 did not reach",** naming observations (vii), the self-hosted runner (§8); (ix), `ANTHROPIC_API_KEY` precedence (§9); and (x), the interactive-test skip (§3), each skipped, with the reason given above. Cite the remote QA follow-up as `ROADMAP.md`'s *Cloud QA* row **by name**. Never write "item 31" or "point 31": `docs/development.md` → `## 6. The roadmap this tree defers to` owns numbered citations, and it has no row 31.
- [ ] **`## 11. Security`, and the adopter's existing workflows.**
  - Under **What a reader of the repository's Actions runs can see.**, add the unconverged planning drafts and plan-review findings the bundle now carries.
  - In `## 7. Turning it on`, where step 3 already tells an earlier adopter to delete and re-run `init` to re-render the workflows, add one sentence. Because the workflows are create-if-absent, a copy written before this release keeps its Node 20 pins until re-rendered that way or edited by hand. It should point at the template header's `# ACTION PINS.` block for the current majors.

**Verification:**

- `grep -n "not verified here\|is unverified\|not observed\|not measured" docs/remote-execution.md`. Every hit is one of:
  - the kept `## 6.` heading;
  - the enable;
  - the in-progress artifact;
  - the push half;
  - the job limits;
  - the `## 10.` billing-unit row;
  - the three skipped observations;
  - the retention cap's pinned-major caveat.
  No hit remains for the timeout expression, the `GITHUB_TOKEN` dispatch, the skipped-job bill or the disable.
- `grep -n "31" docs/remote-execution.md` finds no roadmap citation by number.
- `grep -n "clarification history" docs/remote-execution.md` shows the drafts named beside it in both the `## 1.` table row and **The bundle expires.**
- Every round-2 figure written here (300 s, 47 s, 30 m 35 s, 90 days, `total_ms":0`) appears in the record above; none was measured or re-derived by this run (`harness-runs/lessons.md` → *"A wall-clock figure in a document of record is never one a run measured inside its own session…"*).
- Every command this task adds sits in its own fenced block, one command per line (`harness-runs/lessons.md` → *"Every command an adopter is meant to run sits in a fenced block…"*).
