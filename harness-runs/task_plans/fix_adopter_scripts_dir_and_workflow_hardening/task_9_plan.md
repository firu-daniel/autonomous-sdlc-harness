### Task 9 — Harden `harness-control.yml` the same way, and fix its spelling

**Goal:** The comment-command and review-handler workflow passes `zizmor 1.30.1 --offline --no-config`, except for two justified residuals:
- `artipacked` on its checkout — a review round pushes the branch through that checkout's credential;
- `adhoc-packages` on its `claude` CLI install.

The one `typos` hit in this file is fixed. The behaviour `docs/github-run-control.md` describes is unchanged.

**Depends on:**
- **Task 7**, whose header wording this file mirrors: `# ACTION PINS.`, `# THE CHECKOUT CREDENTIAL.` and `# THE CLAUDE CLI.`, plus the `permissions: {}`-at-top shape.
- **Task 8**, which keeps the template edits in one sequence. It changes nothing here.

**Where this task stops.**
- **Not this file:** `cli/test/fixtures/harness-control-0.6.1.yml` is a frozen negative fixture — the exact bytes 0.6.1 shipped, matched by SHA-256 in `cli/src/generators/githubWorkflows.ts` → `UNPARSEABLE_CONTROL_RELEASES`. It is **never** edited.
- **Not the suite:** `cli/test/workflow-templates.test.mjs` is Task 10's.
- **Not the documentation:** that is Task 16's.

### Targets

- `cli/templates/github/workflows/harness-control.yml`

**Work:**

- [ ] **Pin both `uses:` lines.** Use the SHAs resolved on 2026-10-09:
  - `actions/checkout` → `fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09`, `# actions/checkout v5.1.0`;
  - `actions/setup-node` → `a0853c24544627f65ddf259abe73b1d18a591444`, `# actions/setup-node v5.0.0`.

  Each version comment goes on the line above its `uses:`. Rewrite `# ACTION PINS.` on Task 7's wording, stating that this file is **not** re-rendered by `init --upgrade-workflows` and takes new pins only from `init --force` (`cli/src/generators/githubWorkflows.ts` → choice 5).
- [ ] **Move the permissions to the job.** Set `permissions: {}` at workflow level, and give the `control` job the file's current set, unchanged: `contents`, `actions`, `issues` and `pull-requests`, each `write`. Note in the header that they sit on the job.
- [ ] **Keep the persisted credential on the checkout, and justify it.** The checkout uses `ref: ${{ github.event.repository.default_branch }}` and `token: ${{ github.token }}`.
  - **Why it stays.** A review round reaches `remote-run.sh review` → `verb_review` → `hr_push_landed "$script_dir/push-branch.sh"`, which pushes through that credential. Confirm the path from `verb_control` / `control_review`.
  - **The header.** A `# THE CHECKOUT CREDENTIAL.` block gives that as the reason `artipacked` stands, and confirms that this workflow uploads no artifact.
- [ ] **Keep the `npm install -g @anthropic-ai/claude-code` line, and justify it** in a `# THE CLAUDE CLI.` block. Its wording matches `harness-run.yml`'s, and the existing test `control: the claude CLI install mirrors harness-run.yml` keeps the two lines identical. It adds this file's own clause: the file carries no pin and is never upgraded by pin, so a version frozen here would never move.
- [ ] **Fix the spelling.** In `# THREE RULES EVERY EDIT KEEPS.`, "leaves the file unparseable" becomes "leaves the file unparsable". Grep `cli/test/workflow-templates.test.mjs` for `unparseable` first: its hit there is a header comment, not a matcher on this file's text.

**Verification:**

- **The scratch-probe audit.** Copy the edited template under `harness-runs/scratch/<dir>/.github/workflows/` and run `uvx zizmor@1.30.1 --offline --no-config --format=plain <dir>/.github` through `bash scripts/scratch-run.sh <probe>`. The only findings left are `artipacked` on the checkout and `adhoc-packages` on the CLI install.
- **Spelling.** The same probe runs `uvx --from typos@1.51.1 typos --format brief` over the file and reports nothing.
- **YAML and lint.** The probe parses the file as YAML, keeping the `if: >-` block scalar 0.6.2 introduced, and runs `actionlint -shellcheck= -pyflakes=` where it is on `PATH`.
- **The negative fixture.** `git diff --stat` shows `cli/test/fixtures/harness-control-0.6.1.yml` untouched.
