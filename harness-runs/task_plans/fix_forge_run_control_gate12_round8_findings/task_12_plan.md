### Task 12 — `harness-run.yml`: the gate cites §7 step 4 and §11, and the header says `collect` reports a job that never started

**Goal:** Two edits to the run workflow template, `cli/templates/github/workflows/harness-run.yml`.
- **The gate's pointer.** The run-actor gate's refusal points at the sections that set up and describe the allow-list. Gate 12 round 8, finding 4: the `::error::` ends `(docs/remote-execution.md, section 9)`. At v0.6.2, §9 is *Credentials and billing* and only mentions the variable. The variable is set up in §7 step 4 (*Every secret and variable*) and described in §11 *Security* → *Who can spend the credential*. Round 8 saw the line in (xv)(b), (c) and (c′), for example run `37414830050`.
- **The header.** It states what `collect` now does with a `run` job GitHub never started.

**Depends on:** Task 8, which makes `remote-run.sh collect` report the run in this case. For the newest `harness run <branch>` run, when it is this workflow run and its `run` job ended `cancelled` or `failure` with no step listed, `collect` sends one `not_started` comment and sets `sdlc-harness: paused`, or `failed` when no bundle exists anywhere and its dispatch's comment records no engine. It does this before it requires an open pull request.

**Where this task stops.** This task edits the two gate lines and one header paragraph. It changes no job, no step order and no `if:`. `collect` already runs after such a `run` job under `!cancelled()`, which round 8 observed (`collect` logged `paused (killed)` after run `37363550384`'s `run` job was not acquired). `doctor`'s own `(docs/remote-execution.md, section 9)` warnings in `cli/src/doctor/checks.ts` are about sharing a subscription and the residual risk, which §9 does own. They stay.

### Targets

- `cli/templates/github/workflows/harness-run.yml`:
  - the `::error::` line in the `run` job's gate step `Refuse an actor not on HARNESS_RUN_ACTORS`, and the byte-identical line in the `collect` job's gate step `… before collecting`;
  - the header paragraph `THE COLLECT JOB.`
- `cli/test/workflow-templates.test.mjs`: one assertion on the gate's pointer.

**Work:**

- [ ] **The gate line, in both jobs.** Replace `(docs/remote-execution.md, section 9).` with `(docs/remote-execution.md, section 7 step 4, and section 11).`. Change nothing else in either step. `workflow-templates.test.mjs` already asserts the two gate bodies are identical, so edit both in one pass.
- [ ] **`THE COLLECT JOB.`** After "Under `!cancelled()` a failed `run` job still reaches it", add a sentence: a `run` job GitHub cancelled before any step ran, for example one no runner acquired, reaches it too, and `collect` reports that run once (`remote-run.sh` → the header's `collect` paragraph), because the job itself could report nothing. Keep "a cancelled or stopped run skips it", which is about a workflow run cancelled as a whole, and say so in the same sentence.
- [ ] **`workflow-templates.test.mjs`.** In the gate test that already compares `gateBody('run')` with `gateBody('collect')`, add two assertions on `gateBody('run')`: it includes `docs/remote-execution.md, section 7 step 4, and section 11`, and it does not include `section 9`.

**Verification:**

- `npm test --workspace cli -- test/workflow-templates.test.mjs`, from the repository root, passes.
- `bash scripts/typecheck.sh` exits 0.
- Grep `cli/templates` for `remote-execution.md, section 9`: none.
- Check that each cited section exists. In `docs/remote-execution.md`, `## 7. Turning it on` carries the allow-list's setup step (`HARNESS_RUN_ACTORS`), and `## 11. Security` carries **Who can spend the credential.**. Grep both headings and both phrases.
