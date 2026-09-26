### Task 16 — Write the `harness-resume.yml` poller template and register the `github/` template directory

**Goal:** Ship the workflow that resumes a usage-paused remote run once its window has reset, with no local machine involved, and that costs nothing while nothing is paused because it disables itself.

**Depends on:** Task 15, which created `cli/templates/github/workflows/` with `harness-run.yml` and `cli/test/workflow-templates.test.mjs` (this task adds a second template and extends that suite). Task 8's `remote-run.sh poll`, which is this workflow's whole body — it reads `HARNESS_REMOTE_STOP`, `HARNESS_MAX_CHAIN`, `GITHUB_REPOSITORY`, dispatches `resume: pause` for each due usage-paused branch and runs `gh workflow disable harness-resume.yml` when none is left — and Task 8's `continue`, which runs `gh workflow enable harness-resume.yml` when a job ends on a usage pause.

**The shape.**

- `name: harness-resume`; `on: schedule: - cron: '*/30 * * * *'` and `workflow_dispatch` (so a person can tick it by hand); `permissions: contents: read, actions: write`.
- One job on `runs-on: ${{ vars.HARNESS_RUNNER || 'ubuntu-latest' }}`: checkout the default branch (a `schedule` event always runs the default branch's latest commit), read `scriptsDir` from `harness.config.json` with `jq` at run time, and run `bash "$SCRIPTS_DIR/remote-run.sh" poll` with `GH_TOKEN: ${{ github.token }}`, `HARNESS_REMOTE_STOP`, `HARNESS_MAX_CHAIN` and `HARNESS_REMOTE_SLUG` through `env:`.
- The header states: the poller exists because a `schedule` is a recurring cron read from the default branch, not a one-shot timer, so resuming at a recorded time means polling; the interval is the adopter's to edit, with what each choice costs on a private repository while enabled (a tick is billed at least one minute there, and nothing on a public one); that it **disables itself** when no run is paused and a pausing job re-enables it, so ticks are paid only during a pause; that whether `GITHUB_TOKEN` may enable and disable a workflow is **unverified** and what happens if it may not (the pausing job's `paused` notification says auto-resume is unavailable; the run waits for `/autonomous-sdlc-harness:branch-resume`); that GitHub disables scheduled workflows in a public repository after 60 days without activity, which the self-disable makes moot; and that it is `create-if-absent` and written only when `execution.target` is `github-actions`. The same token-spacing rule as `harness-run.yml`: every `${{` is followed by a space; this file carries **no** `{{token}}` at all.

### Targets

- `cli/templates/github/workflows/harness-resume.yml` (new).
- `cli/templates/README.md` — the per-home subdirectory list gains `github/`, written to `.github/` in the adopting repository (stored without the dot, as `repo/gitignore` is), and only when remote execution is on (register row 60).
- `cli/test/workflow-templates.test.mjs` — the accompanying cases.

**Work:**

- [ ] Write the template per the shape, with its header.
- [ ] Add the `github/` row to `cli/templates/README.md`, in the file's own form, naming both templates and the condition they are written under.
- [ ] Extend `workflow-templates.test.mjs`: the poller's `schedule` and `workflow_dispatch` triggers; its `permissions` exactly `contents: read` and `actions: write`; it runs `remote-run.sh poll` and nothing else of the family; no `{{token}}` (`/\{\{[A-Za-z]/` finds nothing); every `${{` followed by a space; no `${{` inside a `run:` block.

**Verification:**

- `bash scripts/test.sh` exits 0.
- `grep -n '\${{[^ ]' cli/templates/github/workflows/harness-resume.yml` prints nothing.
- The self-containment gate (`docs/development.md` → `## 5. Verifying a change`, gate 6) still passes: the templates sit under `cli/templates/github/`, never under a committed dot-directory.

**Deviations from plan:**
- Beyond the shape, the job carries `concurrency: group: harness-resume` (a hand-dispatched tick overlapping a scheduled one would dispatch `resume: pause` twice for the same branch) and a `jq` / `gh` presence check folded into the configuration step, in `harness-run.yml`'s own wording.
- `bash scripts/test.sh` exited 1 on two gates this task does not touch: 6a flags the ignored, untracked `harness-runs/scratch/t3-test.log` (a previous unit's scratch log carrying absolute paths), and 11 needs the docs-retrieval runtime, which is not installed here. Gate 4 (`npm test`, including the extended `workflow-templates.test.mjs`, 10/10) and 6b (no template in the dot-namespace) passed.
