### Task 5 — Add `scripts/tag-release.sh`, which creates the release tag the job installs from

**Goal:** Make "every release creates the ref the job installs from" a single command. `bash scripts/tag-release.sh <version>` creates the annotated tag `autonomous-sdlc-harness--v<version>`, with the message `autonomous-sdlc-harness <version>`, on the oldest commit of `origin/main`'s first-parent line whose `plugin/.claude-plugin/plugin.json` carries that version, and pushes the tag. The same script backfills the tags of past releases.

**Why this shape, read from the tree rather than assumed.**

- The one existing tag, `autonomous-sdlc-harness--v0.1.0`, is annotated and SSH-signed by the maintainer on 2026-09-09, with the message `autonomous-sdlc-harness 0.1.0`, on the initial commit `2c01123`. This script keeps that shape.
- `main` is the branch adopters install from: `scripts/publish-main.sh` → `HOW IT REACHES MAIN`. Its commits carry `.claude-plugin/marketplace.json` and `plugin/` without this repository's adoption, which is exactly the tree Task 4's job clones.
- The oldest commit carrying a version is that version's bump publication, for example `4dd0881` for 0.4.2. A later commit with the same version holds unreleased work.

**Where this task stops.** This task does not run the script to create or push any tag: creating tags is the operator's release act (the story index's `Manual setup required:`). The release steps that call the script are documented by **Task 9**. The job that reads the tag is **Task 4**.

### Targets

- `scripts/tag-release.sh` (new) — hand-written for this repository, like `scripts/publish-main.sh`. It is not in the set `init --force` regenerates, and it is removed from what `main` publishes, because `scripts/` is in `publish-main.sh`'s `removed_paths`.

**Work:**

- [ ] **Header comment**, in `publish-main.sh`'s style: what a release tag is and who reads it (the `Install the pinned plugin` step of `cli/templates/github/workflows/harness-run.yml`); the resolution rule and why; why `main` and never `dev`; who runs it, which is the operator at a terminal after the publication pull request lands on `main` and before the npm package is published; and why a push needs a terminal (fourth bullet). End it with a `Usage:` line, `tag-release.sh <version> [--dry-run]`, and an `Exit:` line: 0 tagged or already tagged, 1 refused or failed, 2 bad usage.
- [ ] **Body, arguments and resolution.** Start with `#!/usr/bin/env bash` and `set -uo pipefail`.
  - Refuse with exit 2 a `<version>` that is not `MAJOR.MINOR.PATCH`, with an optional pre-release or build suffix, and any argument other than `--dry-run`.
  - Resolve the repository root from `${BASH_SOURCE[0]}`, as `publish-main.sh` does.
  - `git fetch --quiet --tags origin main`.
  - Walk `git rev-list --first-parent --reverse refs/remotes/origin/main`. The first commit whose `plugin/.claude-plugin/plugin.json` has `.version` equal to `<version>` is the target; read it with `jq`, which this repository's shell assets already require.
  - If no commit matches, exit 1 saying the version was never published to `main`'s first-parent line, so there is nothing to tag. 0.3.0 is the known case.
  - If the target lacks `.claude-plugin/marketplace.json`, exit 1.
- [ ] **Existing tags.** If `refs/tags/autonomous-sdlc-harness--v<version>` exists at the target, report it as already tagged. Push it only if `git ls-remote --tags origin` lacks it; otherwise exit 0. If it exists on a different commit, exit 1 naming both commits.
- [ ] **Create and push.** Under `--dry-run`, print the tag, the target's short sha and subject, and whether it would be created and pushed, then exit 0. Otherwise:
  - refuse with exit 1 unless `[ -t 0 ]`. A release tag is pushed by a person at a terminal, and this refusal is what stops an unattended run's Bash tool, which the script-allowlist guard would otherwise permit;
  - `git tag -a "$tag" -m "autonomous-sdlc-harness $version" "$target"`, which honours the operator's own tag-signing configuration;
  - `git push origin "refs/tags/$tag"`. A tag target passes `githooks/pre-push`, whose `case` matches branch names.

**Verification** (each run without a pipe, and only with `--dry-run`: this task creates and pushes no tag):

- `bash scripts/tag-release.sh 0.4.2 --dry-run` exits 0 and names the `origin/main` commit whose subject is `chore: bump version to 0.4.2 (#43)`.
- `bash scripts/tag-release.sh 0.1.0 --dry-run` exits 0 and reports the tag as already present at `2c01123`.
- `bash scripts/tag-release.sh 0.3.0 --dry-run` exits 1 and says the version was never published to `main`.
- `bash scripts/tag-release.sh 0.4 --dry-run` and `bash scripts/tag-release.sh 0.4.2 --bogus` each exit 2.
- `bash -n scripts/tag-release.sh` exits 0.

**Deviations from plan:**

- `bash -n scripts/tag-release.sh` was refused by the permission profile ("This command requires approval"), in both absolute- and repo-relative-path spellings. The syntax claim rests instead on the five `--dry-run` / bad-usage runs above, each of which executed the script to its expected exit (0, 0, 1, 2, 2); the create-and-push branch after the `[ -t 0 ]` check was parsed but not executed.
- `chmod 755 scripts/tag-release.sh` was refused the same way, so the file is written mode 644 while its siblings `scripts/publish-main.sh` and `scripts/run-gates.sh` are tracked 100755. The documented invocation is `bash scripts/tag-release.sh`, which does not need the bit; an operator wanting parity runs `git update-index --chmod=+x scripts/tag-release.sh` before the commit.
- The walk skips `jq` for a commit whose `plugin.json` blob equals the previous commit's, which changes no result: an unchanged blob carries an unchanged version.
