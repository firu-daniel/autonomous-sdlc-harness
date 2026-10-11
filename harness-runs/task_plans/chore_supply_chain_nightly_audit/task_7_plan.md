### Task 7 — Clear zizmor's findings on this repository's own `release-npm.yml` and `publish-main.yml`

**Goal:** Make this repository's own `.github` pass zizmor 1.30.1 with no unsuppressed finding, offline and online, so the nightly's online leg (Tasks 8 and 10) is green on its first run. On 2026-10-11, `uvx zizmor@1.30.1 --offline --no-config --format=plain .github`, and the same run online with a token, both printed `10 findings (7 suppressed, 2 unsafe fixes): 0 informational, 0 low, 2 medium, 1 high`. The three unsuppressed findings are:

1. `artipacked` on `release-npm.yml` → job `publish` → `actions/checkout`, which sets no `persist-credentials: false`.
2. `cache-poisoning` (high) on `release-npm.yml` → `actions/setup-node`: "omitting `package-manager-cache` enables caching", on a tag-triggered publishing job.
3. `artipacked` on `publish-main.yml` → job `publish` → `actions/checkout`.

**How each is disposed of.** Findings 1 and 2 are **fixed**. `release-npm.yml` pushes nothing with git: `npm publish` authenticates by OIDC trusted publishing, so the persisted credential is unused. A publishing job has no business restoring a cache. Finding 3 **stands, as a documented, narrow inline ignore.** `scripts/publish-main.sh` stages the publication with `git push --force origin "${commit}:refs/heads/${publish_branch}"`, which authenticates through the checkout's persisted credential. Removing it would mean rewriting a privileged push path for no gain on a dev-only workflow. `publish-main.yml` never reaches `main` (`scripts/publish-main.sh` → `removed_paths`), but the nightly audits `dev`, so the ignore must live in the file itself. The planner confirmed on a scratch copy of `publish-main.yml` that a `# zizmor: ignore[artipacked]` comment inside the finding's span drops it from `--format=json` output, under both `--offline` and `--no-config`. The comment worked trailing either the `uses:` line, as `# zizmor: ignore[artipacked] v5.1.0`, or the `fetch-depth: 0` line.

**Where this task stops.** It edits the two existing workflows and nothing else. Changing `release-npm.yml`'s file name would break the npm trusted-publisher link (its own header). The new `supply-chain.yml` is **Task 10**'s, and the script mode that grades this directory online is **Task 8**'s. Neither action pin moves. `actions/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09` (v5.1.0) and `actions/setup-node@820762786026740c76f36085b0efc47a31fe5020` (v7.0.0) stay as they are.

### Targets

- `.github/workflows/release-npm.yml` — the checkout and setup-node steps, and the pin comment above them.
- `.github/workflows/publish-main.yml` — the checkout step and its comment.

**Work:**

- [ ] `release-npm.yml`: give the `actions/checkout` step `with: persist-credentials: false`. Give the `actions/setup-node` step `package-manager-cache: false` beside its existing `node-version` and `registry-url`. Extend the pin comment above the two steps with one sentence each: the publish authenticates by OIDC, so no git credential is persisted, and a publishing job restores no cache.
- [ ] `publish-main.yml`: add `# zizmor: ignore[artipacked]` inside the checkout step's span, trailing its `fetch-depth: 0` line. Add a comment line directly above the step stating why it stands: `scripts/publish-main.sh` pushes the `publish` branch through the checkout's persisted credential, and the token it persists can write `publish` only.

**Verification:** run each command from the repository root, without a pipe.

- `uvx zizmor@1.30.1 --offline --no-config --format=plain .github` reports `0 high`, `0 medium` and `0 low`, and lists no unsuppressed finding. Record its summary line in this task's return.
- `actionlint .github/workflows/release-npm.yml .github/workflows/publish-main.yml` reports nothing.
- `git diff .github/workflows/release-npm.yml` changes no `uses:` SHA, no `permissions:` key and no step order.
