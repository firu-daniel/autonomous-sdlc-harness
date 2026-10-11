### Task 10 — Add `.github/workflows/supply-chain.yml`, the nightly supply-chain workflow

**Goal:** Re-audit the dependencies, the rendered adopter workflows' action pins and the retrieval model pins every night, after changes have merged, and fail loudly when something is found. The workflow runs on `schedule` plus `workflow_dispatch`. It is **never** a required check, because a new upstream advisory must not block unrelated merges. It **fails** on findings, with no `continue-on-error` anywhere, because the email GitHub sends for a red scheduled run is the alert. Online zizmor belongs here and not in a merge gate, because an API outage or a new advisory would fail unrelated pull requests.

**Depends on:**
- Task 5 (and Tasks 3 and 4 before it). The full tree audits clean, so `npm audit --audit-level=moderate` exits 0.
- Task 6. `docs-retrieval-service/uv.lock` is unchanged, and `uv audit` over it is clean.
- Task 7. This repository's own `.github` has no unsuppressed zizmor finding.
- Task 8. `node scripts/check-rendered-workflows.mjs --zizmor-online` exits 0 when clean, 1 on a finding and 4 when zizmor or a token is unavailable. It takes its token from `GH_TOKEN`, and it needs `cli/dist` built and `uvx` (or zizmor 1.30.1) on `PATH`.
- Task 9. `node scripts/check-model-revisions.mjs` exits 0 whether or not a pin has drifted (drift is a `::notice::`), and 1 when a pin is unreadable or no longer resolves. It needs `cli/dist` built.

**Two placement facts this file's header must state.**
- **It travels to `main`.** `schedule` fires only from the default branch's copy of a workflow, and this repository's default branch is `main`. `scripts/publish-main.sh` → `removed_paths` strips only `harness.config.json`, `.claude`, `.gitattributes`, `githooks`, `harness-runs`, `scripts` and `.github/workflows/publish-main.yml`, so this file reaches `main` with every publication and `scripts/publish-main.sh` needs no edit. This is the same placement `release-npm.yml`'s header records.
- **It checks out `dev`.** `scripts/` is in that removed set, so `main`'s tree has neither `check-rendered-workflows.mjs` nor `check-model-revisions.mjs`. `dev` is the trunk and carries the product plus those scripts, so every job checks out `ref: dev`, as `publish-main.yml` does. This applies under `workflow_dispatch` too, because the subject of the audit is the trunk. A branch is audited before merge by running the same commands locally: Task 13 runs and records them, except the online zizmor leg, which is a hand-run step in the story index's `Manual setup required:`.

**The shape.** Every `uses:` takes a full commit SHA with its version in a trailing comment, in the style `release-npm.yml` uses. Re-confirm each SHA with `gh api repos/<owner>/<repo>/git/ref/tags/<tag>` before pinning; the planner resolved them on 2026-10-11:
- `actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09` is v5.1.0.
- `actions/setup-node@820762786026740c76f36085b0efc47a31fe5020` is v7.0.0.
- `astral-sh/setup-uv@1c37ad07a6a961277cf70c0d37d6f313000f5884` is v10.3.0.

| Job | Steps after checkout | What it fails on |
|---|---|---|
| `npm-audit` | `setup-node` (`node-version: '22'`, `package-manager-cache: false`); `npm ci --ignore-scripts`; `npm audit --audit-level=moderate` | Any moderate-or-higher advisory anywhere in the **full** tree. Never `--omit=dev`: the CLI's runtime packages are optional `peerDependencies`, so `--omit=dev` reports 0 and hides exactly what an adopter installs. |
| `uv-audit` | `setup-uv` (`version: '0.12.23'`, `enable-cache: false`); `uv audit --preview-features audit-command --frozen` with `working-directory: docs-retrieval-service` | Any known vulnerability in `docs-retrieval-service/uv.lock` |
| `zizmor-online` | `setup-node` as above; `setup-uv` as above; `npm ci --ignore-scripts`; `npm run build`; `node scripts/check-rendered-workflows.mjs --zizmor-online` with `env: GH_TOKEN: ${{ github.token }}` | A rendered-template finding outside `RESIDUAL`, a `RESIDUAL` entry that no longer fires, any finding on this repository's own `.github`, or zizmor or the token being unavailable (exit 4) |
| `model-revisions` | `setup-node` as above; `npm ci --ignore-scripts`; `npm run build`; `node scripts/check-model-revisions.mjs` | A pin that is unreadable or no longer resolves. Drift is a notice only. |

The top level sets `permissions: contents: read` and nothing else. Every checkout sets `persist-credentials: false`, because no job pushes. Each job sets `timeout-minutes: 20`, so a hung step is bounded. `concurrency: { group: supply-chain, cancel-in-progress: false }` keeps two nights from overlapping. The cron runs once daily at an off-the-hour minute, for example `'23 4 * * *'`. **Moderate fails as well as high.** The one moderate advisory found today (`sprintf-js`) had no patched release and was cleared only by dropping the chain that carried it, which is exactly what a nightly should surface. A nightly that blocks no merge can afford the extra mail.

**Where this task stops.** It writes the workflow file only; the prose is **Tasks 12 and 13**'s. It sets no branch-protection rule, and making this a required check is explicitly not wanted. It adds no `dependabot.yml`; the Dependabot recommendation is Task 12's prose and the maintainer's toggle.

### Targets

- `.github/workflows/supply-chain.yml` (new).

**Work:**

- [ ] Header comment. It covers what the workflow audits (the table above), the three policy reasons in **Goal** (never required, fails on findings, online zizmor here), the two placement facts (travels to `main`, checks out `dev`), the moderate threshold and its reason, and where the residual and ignore sets live: `RESIDUAL` in `scripts/check-rendered-workflows.mjs`, inline `# zizmor: ignore[…]` comments in the audited workflow, `uv audit --ignore-until-fixed <ID>` on the `uv` step, and no npm ignore mechanism. It ends with one sentence on how a finding is disposed of: fixed, or a narrow ignore documented in `docs/development.md` §8, never a lowered threshold.
- [ ] `on:` (`schedule` with the cron, and `workflow_dispatch:` with no inputs), top-level `permissions: contents: read`, and `concurrency`.
- [ ] The four jobs, exactly as in the table. Each `run:` is a fixed command with no `${{ … }}` expression inside it. The token reaches the script only through the step's `env:`.

**Verification:** run each command from the repository root, without a pipe.

- `actionlint .github/workflows/supply-chain.yml` reports nothing.
- `uvx zizmor@1.30.1 --offline --no-config --format=plain .github/workflows/supply-chain.yml` reports no finding. The new file adds nothing to any residual set.
- **The publish route.** The file is untracked at verification time (the committer stages it later), so both commands include untracked files and the invariant holds whether or not the file is staged. `git ls-files --cached --others --exclude-standard -- ':(literal).github/workflows/supply-chain.yml'` prints the path. Then `git ls-files --cached --others --exclude-standard -- ':(literal)harness.config.json' ':(literal).claude' ':(literal).gitattributes' ':(literal)githooks' ':(literal)harness-runs' ':(literal)scripts' ':(literal).github/workflows/publish-main.yml'`, which is exactly the pathspec `scripts/publish-main.sh` removes, prints no line naming `.github/workflows/supply-chain.yml`. As an index-free cross-check, read `scripts/publish-main.sh` → `removed_paths` and confirm no entry is `.github`, `.github/workflows` or `.github/workflows/supply-chain.yml`. The invariant is that the file is outside the removed set, so it reaches `main`. Record both outputs' relevant lines in this task's return.
- `grep -n 'continue-on-error\|omit=dev\|--offline' .github/workflows/supply-chain.yml` finds nothing.
- Each job's command except the `zizmor-online` job's is run once locally on the final tree, and recorded, by Task 13. `node scripts/check-rendered-workflows.mjs --zizmor-online` is a gate script, which no unit runs, so its local run is a hand-run step in the story index's `Manual setup required:`; Task 13 records it as not run by the flow. A first run on GitHub happens only after the publication merges onto `main`, which the story index lists under `Manual setup required:`.
