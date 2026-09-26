### Task 29 — Add adopter setup, runner choices, costs, billing and security to `docs/remote-execution.md`

**Goal:** Give an adopter everything they need to turn remote execution on and to know what it costs and exposes: the setup steps, the runner choices, setting up a self-hosted runner, the credentials and which one billing follows, the cost reference figures with their sources and retrieval date, the security notes and the paused billing change (Acceptances 4 and 6).

**Depends on:** Task 28, which created `docs/remote-execution.md` with its sections 1–6 and a short "turning it on" section that defers here. The facts this task documents, restated:

- **Turning it on**: `config set execution.target github-actions`, then `init` (writes the two workflows), commit and push them to GitHub's default branch, set the secrets, optionally the variables, then `doctor --check-github` (Tasks 1, 17, 19).
- **Secrets**: `CLAUDE_CODE_OAUTH_TOKEN` (a subscription token, made with `claude setup-token`) and/or `ANTHROPIC_API_KEY`; the job exports only the non-empty ones and fails before launch when neither is set; `HARNESS_PUSH_URL` (notifications); `HARNESS_GIT_TOKEN` (optional: a token whose pushes trigger the adopter's own CI, which `GITHUB_TOKEN` pushes do not). **Variables**: `HARNESS_RUNNER`, `HARNESS_REMOTE_STOP`, `HARNESS_MAX_CHAIN`, `HARNESS_SELF_PAUSE_AFTER_MINUTES`, `HARNESS_STEP_TIMEOUT_MINUTES`, and the watcher tunables the workflow maps (read the template's `env:` block for the exact list).
- **Runners**: unset `HARNESS_RUNNER` → `ubuntu-latest`; a hosted Linux label or a larger-runner label the adopter created also works; macOS and Windows hosted runners are not supported; a self-hosted runner needs git, `jq` 1.5 or newer, `gh`, Node and the `claude` CLI, and the job says which is missing.
- **Adopter-tuned allow entries** do not travel with the machine-local profile; entries naming no absolute path can move into the committed `.claude/settings.json`, which the runtime merges beside `--settings`.

### Targets

- `docs/remote-execution.md` — new sections `## 7.` onward (register row 53).

**Work:**

- [ ] `## 7. Turning it on`: the steps above, each command in its own fenced block, one per line; a table of every secret and variable with what reads it, its default and whether it is required; and the adopter-tuned-entries paragraph.
- [ ] `## 8. Choosing a runner`: the one-line switch; the supported hosted choices and the unsupported ones with the reason; **setting up a self-hosted runner** — registering it with GitHub's runner installer (`./config.sh --url <repository URL> --token <registration token> --labels <label>`, then `./svc.sh install` and `./svc.sh start`, each in its own fenced block), installing the prerequisites beside it, setting `HARNESS_RUNNER` to the label, and the ephemeral-runner option; what differs on self-hosted (no self-pause, waits happen in the job, the job limit).
- [ ] `## 9. Credentials and billing`: which credential the run uses and that billing follows `ANTHROPIC_API_KEY` whenever both are set; the terms' position on an end user signing the unmodified Claude Code in with their own subscription, including where a platform hosts it, and that products must not route other people's usage through subscription credentials; that the harness never holds, pays for or intermediates anyone's compute or usage; and **the paused billing change** — the announced separate monthly credit for `claude -p`, Agent SDK and GitHub Actions usage from 2026-06-15, now paused, and that if it resumes it affects remote and local headless runs alike. Source URL and retrieval date for each.
- [ ] `## 10. What it costs`: hosted runner prices after the 1 January 2026 change, free standard runners on public repositories, included minutes per plan, the unverified larger-runner plan question, the postponed self-hosted platform fee as a live risk, the poller's tick cost by interval on a private repository, and the reference heavy-user figure (3 sessions of 6 h a day, 20 days a month, 360 h) against hosted 2-core, hosted 4-core and a self-hosted Hetzner CX33, with the per-hour billing cap marked unverified. **Every figure carries its source URL and the retrieval date 2026-09-24, labelled as carried from the task prompt's research** unless you re-fetched the page, in which case say so with the new date and correct the figure if it changed.
- [ ] `## 11. Security`: hosted runners (a fresh VM per job, destroyed afterwards; the checkout on its disk; secrets in GitHub Secrets; caches stored by GitHub); self-hosted runners (code persists on the adopter's disk unless ephemeral; a persistent self-hosted runner on a **public** repository is a risk if fork pull requests can run workflows on it — say what setting prevents it); the `harness-state` artifact and the run log are readable by anyone who can read the repository's Actions runs; workflow inputs reach shell lines only through `env:`; and on every option the code the agents read goes to the Anthropic API, as it does locally.

**Verification:**

- Every secret and variable named matches `cli/src/remote/githubActions.ts` and the template's `env:` block, spelled identically.
- `grep -n "2026-09-24" docs/remote-execution.md` finds a date beside every figure's source, and no figure lacks a source URL.
- Every command sits in a fenced block, one per line (`harness-runs/lessons.md`); the adopter-facing prose says "GitHub Actions", "self-hosted runner" and "runner label", the terms an adopter arrives with, and uses the configuration key only where the key itself is meant.

- **Deviations from plan:**
  - The service commands are written `sudo ./svc.sh install` and `sudo ./svc.sh start`: GitHub's runner service script needs root on Linux, and §8 scopes self-hosted runners to Linux.
  - "The job says which is missing" holds for `jq` and `gh` only (`harness-run.yml` → `Check for jq and gh`). Node comes from `actions/setup-node` and the `claude` CLI is npm-installed when absent, so §8 says that instead.
  - Evidence downgrade: no page was re-fetched (this session has no web-fetch tool), so every figure in §9–§10 is labelled carried from the task prompt, retrieved 2026-09-24. The sources §8 and §11 add for the ephemeral runner, the hosted-VM lifecycle and the fork pull request setting are outside the prompt's research and are labelled "not retrieved in this branch". The derived figures ($129.60, $111.60, $259.20, $43.20, $8.64, the poller minutes, ~33 hours) are arithmetic over the carried figures and show it.
