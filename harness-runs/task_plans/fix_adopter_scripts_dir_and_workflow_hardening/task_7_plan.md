### Task 7 — Harden `harness-run.yml`: SHA pins, per-job permissions, unpersisted credentials where no push, justified residuals

**Goal:** `cli/templates/github/workflows/harness-run.yml` passes `zizmor 1.30.1 --offline --no-config` except for the residual findings the story index decided. Those are `artipacked` on the `run` and `collect` checkouts, which push through the checkout's credential, and `adhoc-packages` on `Install the claude CLI when absent`. Each is justified in the file's header. **No job loses a capability it has today** — every job still does what `docs/remote-execution.md` says it does.

**Where this task stops.**
- It edits this one template only.
- `harness-resume.yml` and `harness-trigger.yml` are Task 8's, and `harness-control.yml` is Task 9's.
- The suite that pins these shapes, `cli/test/workflow-templates.test.mjs`, is Task 10's. That suite asserts today that this file's permissions are a workflow-level block with exactly `contents`, `actions`, `issues` and `pull-requests` at `write`, so it fails on this change until Task 10 lands.
- The documentation is Task 16's (`docs/remote-execution.md` §7 `### Upgrading` and §11), and the gate that audits the rendered file is Task 14's.
- `{{cliVersion}}` stays the file's only template token, and every GitHub expression keeps its space after the braces (the header's `TWO RULES EVERY EDIT KEEPS.`).

### Targets

- `cli/templates/github/workflows/harness-run.yml`

**Work:**

- [ ] **Pin all eight `uses:` lines to commit SHAs**, keeping each major. The SHAs were resolved on 2026-10-09 with `git ls-remote --tags https://github.com/actions/<name>`:

  | Action | Version | SHA |
  |---|---|---|
  | `actions/checkout` | v5.1.0 | `fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09` |
  | `actions/setup-node` | v5.0.0 | `a0853c24544627f65ddf259abe73b1d18a591444` |
  | `actions/cache/restore` and `actions/cache` | v5.1.0 | `caa296126883cff596d87d8935842f9db880ef25` |
  | `actions/upload-artifact` | v6.0.0 | `b7c566a772e6b6bfb58ed0dc250532a479d7789f` |

  - **Where the version goes.** On its own comment line directly **above** the `uses:` line, as `# actions/checkout v5.1.0`. Never as a trailing ` # v5.1.0`: the header rule "a value carrying ` #` is never a plain scalar" is enforced by `workflow-templates.test.mjs` → `no plain-scalar mapping value carries ': ' or ' #'`.
  - **The `# ACTION PINS.` block.** Rewrite it to say three things:
    - Each action is pinned to the full commit SHA of the release named beside it, in the same major as before, so the `node24` rationale stays.
    - Why a SHA and not a tag: a tag is mutable, and this job holds the Claude credential and write tokens. This is the reasoning this repository's own `.github/workflows/publish-main.yml` states.
    - How a pin moves. `npx autonomous-sdlc-harness@<version> init --upgrade-workflows` re-renders this file at a newer release's pins, and a hand bump replaces the SHA and the comment line together.
- [ ] **`permissions: {}` at workflow level, and a `permissions:` block on each of the four jobs.** Derive each grant from what that job's own steps run, and cite the evidence in the header's `# THE PERMISSIONS.` block, one line per job and grant:
  - **`wrong-ref`** gets `permissions: {}`. It only fails a mis-dispatched run, through its step's `env:`.
  - **`run`** keeps all four writes the block lists today:
    - `contents`, to push the branch through `push-branch.sh`;
    - `actions`, for `remote-run.sh continue` dispatch and poller enable;
    - `issues`, for lifecycle comments and labels;
    - `pull-requests`, for `remote-run.sh open` and `deliver`.
  - **`collect`.** Read `cli/templates/scripts/remote-run.sh` → `verb_collect` and what it calls, and grant exactly what it reaches. It starts a review round through the `review` path, whose `hr_push_landed "$script_dir/push-branch.sh"` needs `contents: write`. Its dispatch, comment and label calls need `actions` / `issues` / `pull-requests` as each call site shows.
  - **`warm`** gets `contents: read`, for the checkout. The `actions/cache` save uses the runner's cache token, not `GITHUB_TOKEN`. Confirm that against the step and say so.

  Where the derivation cannot rule a grant out, keep it and say why in the header. A grant narrower than the job's need fails only on GitHub — the story index's third `Top risks:` entry.
- [ ] **`persist-credentials: false` on the `warm` job's checkout.** That job pushes nothing.
  - **The `run` and `collect` checkouts keep the persisted credential**, because both push through `push-branch.sh` with it. `run` checks out with `token: ${{ secrets.HARNESS_GIT_TOKEN || github.token }}`, and `collect` with `${{ github.token }}`.
  - **A new `# THE CHECKOUT CREDENTIAL.` header block** records this as the reason `artipacked` stands on those two checkouts. The only artifact upload, `Upload the state bundle`, uploads `${{ runner.temp }}/harness-state`, which sits outside `$GITHUB_WORKSPACE`, so no upload can carry the checkout's `.git/config`.
  - **The same block says what an edit must keep:** never point an `upload-artifact` `path:` inside the workspace while a checkout persists its credential.
- [ ] **Keep the `npm install -g @anthropic-ai/claude-code` line unpinned, and justify it** in a `# THE CLAUDE CLI.` header block:
  - The install runs only when the runner has no `claude`.
  - The latest CLI is wanted because the agent runner tracks the model API, and `harness-control.yml` installs it the same way but is never re-rendered by `--upgrade-workflows` (`cli/src/generators/githubWorkflows.ts` → choice 5). A version frozen into the templates would therefore stay frozen there.
  - `zizmor`'s `adhoc-packages` flags a pinned install too: measured on 2026-10-09 against `npm install -g @anthropic-ai/claude-code@2.1.284`.
  - The audit-silent alternatives, `npx --yes …` and `curl … | bash`, are the same install with less integrity checking.
- [ ] **Leave everything else byte-stable.**
  - **The mirrors.** The `# DECLARED MIRRORS` entries, including `DEFAULTS.scriptsDir`, which the `jq -r '.scriptsDir // "scripts"'` fallback still mirrors because the absent-key meaning stays `scripts` (story index).
  - **The behavioural lines.** The `run-name`, the job `if:` conditions and the step order.
  - **The renderer's view.** `{{cliVersion}}` stays the only token.

**Verification:**

- **The scratch-probe audit.** Copy the edited template into a directory under `harness-runs/scratch/`, as `.github/workflows/harness-run.yml`, and run `uvx zizmor@1.30.1 --offline --no-config --format=plain <that dir>/.github` from a probe written there and run through `bash scripts/scratch-run.sh <probe>`. The only findings left are `artipacked` on the `run` and `collect` checkouts and `adhoc-packages` on the CLI install.
- **YAML and lint.** The same probe parses the file as YAML, and runs `actionlint -shellcheck= -pyflakes=` over it where `actionlint` is on `PATH`.
- **The pins.** `grep -n "uses:"` on the file shows every action reference as `@<40 hex>` with its version comment on the preceding line.
- **The renderer's view.** `grep -n "{{"` shows `{{cliVersion}}` as the only token.
- **Byte-stable lines.** `git diff` of the file touches no `run:` body, `if:` or step `name:`.
- **The end-to-end check.** The hardened shapes are pinned by Task 10's suite, and the live run is the Gate 12 hand-run in the story index's `Manual setup required:`.
