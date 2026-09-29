### Task 3 — Move both workflow templates to action majors that run on Node 24 and make their headers true

**Goal:** Every run of round 2 printed `Node.js 20 is deprecated. The following actions target Node.js 20 but are being forced to run on Node.js 24: actions/checkout@v4, actions/upload-artifact@v4.` The warning is about each action's own runtime, not the job's Node (`setup-node` already gives the steps Node 22). Every action the two templates pin must move to a major whose own `action.yml` declares `runs.using: node24`. Both headers must be made true, including the three statements round 2 has now settled.

**Depends on:** the maintainer's action-runtime record, the `Manual setup required:` item in the story index's `## Context`. It is **not** produced by any task, and this task makes no network call. The record is the file:

`harness-runs/task_prompts/fix_remote_pause_state_and_gate12_record_action_runtimes.md`

It is committed on this branch, so it is present in every checkout of it. For each of `actions/checkout`, `actions/setup-node`, `actions/cache` (with `restore/action.yml` for `actions/cache/restore`) and `actions/upload-artifact`, it holds the verbatim output of these lookups:

- the newest non-prerelease release;
- the `runs:` block of `action.yml` at `v4` and at every later major tag up to that newest release;
- the release notes of each later major's `v<N>.0.0`, or the lookup's own "not found" output where none exists.

**Take every version and runtime fact from that record, never from memory.** If the file is absent, or it lacks the `runs.using` of any major this task would choose, choose nothing. Return a blocker that names the missing file, or the missing action and major, and edit no file.

### Targets

- `cli/templates/github/workflows/harness-run.yml` — seven `uses:` lines and the header.
- `cli/templates/github/workflows/harness-resume.yml` — two `uses:` lines and the header.
- `cli/test/workflow-templates.test.mjs` — one new case and the file header's contract list.

**The pinning decision, which this task records in both headers.** Pin a **major tag** (`actions/<name>@v<N>`), not a full commit sha. Three reasons:

1. Every action here is GitHub's own `actions/` organisation. That is the same owner as the runner image and the `GITHUB_TOKEN` the job already trusts, so a moved major tag there crosses no trust boundary the job has not already crossed.
2. These files are written create-if-absent and are the adopter's from then on. A sha would freeze every adopter at this release's commit, security fixes included, with no update path but a hand edit. A major tag takes the action's own patch releases.
3. `.github/workflows/publish-main.yml` is this repository's own workflow, maintained and bumped here, and its sha pin argues its own reason.

An adopter who wants shas can pin their copy. Dependabot updates either form.

**Work:**

- [ ] **Choose the majors from the record.**
  - Read the record file named above. For each of `actions/checkout`, `actions/setup-node`, `actions/cache/restore`, `actions/cache` and `actions/upload-artifact`, choose the **lowest** major whose recorded `runs.using` is `node24`. The lowest one satisfies the requirement with the fewest intervening breaking changes.
  - Read that major's recorded `v<N>.0.0` notes, and every recorded notes block between the old and the new major, for a change to an input these templates pass or to a default they rely on:
    - `checkout`: `ref`, `fetch-depth`, `token`, and how credentials persist for the later `git push` in `Push the branch`;
    - `setup-node`: `node-version`, and any **automatic package-manager caching** a newer major turns on. If one does, set the input that disables it explicitly, with a one-line comment giving the reason: the job installs nothing through npm's cache, and an adopter's lockfile-less repository must not fail the step;
    - `cache/restore` and `cache`: `path`, `key`;
    - `upload-artifact`: `name`, `path`, `overwrite`, `retention-days`, `if-no-files-found`, and the hidden-files default the bundle's dot-less `flow_walker_state` exists for.
  - Where a note changes one of these, adapt the step to keep its behaviour, or choose the next major and say why.
- [ ] **`harness-run.yml`.**
  - **The seven `uses:` lines:** `Check out the run's branch`, `Set up Node` (run job), `Restore the docs-retrieval cache`, `Upload the state bundle`, `Check out the dispatched ref`, `Set up Node` (warm job) and `Restore and save the docs-retrieval cache`. Each moves to its chosen `@v<N>`.
  - **A new header block `# ACTION PINS.`,** placed after `DECLARED MIRRORS`. One line per distinct action in the exact form `#   actions/<name>@v<N>` (two-space indent after `#`, as the mirrors block uses). Then the pinning decision in two or three sentences, and the date the record was taken, as the record states it, against each action's own `action.yml` (`runs.using: node24`) and release notes.
  - **`WHY THE TIMEOUT IS COMPUTED INTO GITHUB_ENV`:** replace *"could not be checked … Gate 12 records the real behaviour."* with the settled fact. Gate 12 round 2, on 2026-09-29, found every `harness-run.yml` run accepted and its `Run the harness` step run, so the expression-valued `timeout-minutes` is accepted. Keep the paragraph's explanation of why the value is computed into `GITHUB_ENV`.
  - **`WHY retention-days IS SET`:**
    - Its opening sentence names the bundle as *"the only remote copy of a run's clarifications and carried counts"*, and says a run parked or paused too long *"loses those counts"*. Name the uncommitted planning drafts beside the clarifications and counts in both places, because from Task 1 on the bundle carries them too.
    - Replace the unverified sentence. Round 2 found `upload-artifact@v4` **capped** `retention-days: 400` at the repository's 90-day maximum rather than failing: artifact `expires_at` 90 days after creation, and the repository's `artifact-and-log-retention` was `{"days":90,"maximum_allowed_days":400}`. State plainly that this was observed on **v4**, and that the major now pinned has not yet been observed by a gate round.
- [ ] **`harness-resume.yml`.**
  - Move `Check out the default branch` and `Upload the poller state` to their chosen majors.
  - Add the same `# ACTION PINS.` block for its two actions.
  - Replace the `UNVERIFIED:` paragraph. Round 2 verified that `gh workflow disable` succeeds under `GITHUB_TOKEN` with `actions: write`: a hand-started tick logged `poll: no branch is waiting; disabled harness-resume.yml`, and the workflow's state became `disabled_manually`. The **enable** was not observed, because no job ended on a usage pause, so that half stays unverified with its existing fallback sentence.
- [ ] **`cli/test/workflow-templates.test.mjs`: one new case, run for each of the two templates.**
  - Parse the `# ACTION PINS.` block: the `#   actions/…@…` lines under it, up to the next line that is just `#` or a new `# UPPER` heading. Collect every `uses:` value in the file.
  - Assert the two sets are **equal**, so a header naming a pin the file no longer carries, or a bumped `uses:` the header forgot, fails.
  - Assert every `uses:` value matches `^actions/[a-z-]+(/[a-z-]+)?@v[0-9]+$`, which is the pinning decision stated as a contract.
  - Add both to the file header's contract list, in its existing prose style.

**Verification:**

- **Against the record.** Every `uses:` value in the two templates is checked against the recorded output. For each, the record shows `runs.using: node24` at that action and major, and it shows a runtime other than `node24` at every major between `v4` and the chosen one. This is the acceptance criterion measured against each action's own `action.yml`, as the maintainer recorded it. A `uses:` value the record does not cover is a blocker, not a pass.
- `workflow-templates.test.mjs`, the test file this task edits, passes when run on its own through the single-file test command the conventions state. Where none is stated, skip it and record the skip (`plugin/instructions/unit_loop_core.md` → `## The test-run rule` point 3). That covers its existing cases (expression spacing, `{{cliVersion}}` the only token, no expression inside `run:`, the upload's artifact name, the step order) and the new pin case.
- `grep -n "Gate 12 records\|UNVERIFIED\|could not be checked\|could not be re-checked" cli/templates/github/workflows/harness-run.yml cli/templates/github/workflows/harness-resume.yml` reaches only the enable half of `harness-resume.yml`'s paragraph, and nothing in `harness-run.yml`.
- `grep -n "carried counts" cli/templates/github/workflows/harness-run.yml` shows the planning drafts named in the same sentence as each hit.
- No header line introduced here carries `{{` straight after a letter. The template renderer would read it as a token (`TWO RULES EVERY EDIT KEEPS`).
