### Task 15 — Rename the release tooling: the npm release workflow, `release.sh`, `publish-main.sh` and `tag-release.sh`

**Goal:** A release after this branch publishes the `devscene` package, from a tag named `devscene--v<version>` with the message `devscene <version>`. `main`'s `.gitignore` is still stripped of init's managed block under its new header. Apply the spelling table in the story index's `## Context`.

**Depends on:** Task 1, which renamed the package (`cli/package.json` → `name` `devscene`) and the managed-block header in `cli/src/generators/repoRoot.ts`. Also Task 4, whose workflow templates fetch the plugin from the tag `devscene--v<version>`, and Task 14, which moved this repository's `.gitignore` header to `# >>> devscene (managed block: …) >>>`. The cross-file contracts this task closes:

| Contract | Producer | Readers |
|---|---|---|
| Tag `devscene--v<version>`, message `devscene <version>` | `scripts/tag-release.sh` (here); `scripts/release.sh` builds the same name from `package` (here) | `.github/workflows/release-npm.yml` (here); `cli/templates/github/workflows/harness-run.yml` and `harness-control.yml` (Task 4) |
| `.gitignore` header `# >>> devscene ` | `cli/src/generators/repoRoot.ts` (Task 1), this repository's `.gitignore` (Task 14) | `scripts/publish-main.sh`'s awk strip pattern (here) |

**Where this task stops.** Publishing, configuring npm trusted publishing for the new package name, and deprecating the old package are the maintainer's (story index → **Manual setup required**). Earlier tags keep their old names. Nothing here rewrites or re-reads them.

### Targets

- `.github/workflows/release-npm.yml`
- `scripts/release.sh`
- `scripts/publish-main.sh`
- `scripts/tag-release.sh`

**Work:**

- [ ] `release-npm.yml`: the trigger `tags: ['devscene--v*']` and `tag_version="${GITHUB_REF_NAME#devscene--v}"`.
- [ ] `release.sh`: `package="devscene"`. `tag="${package}--v${version}"` then yields `devscene--v<version>` with no further edit.
- [ ] `publish-main.sh`: the awk strip pattern becomes `/^# >>> devscene / { skip = 1; next }`, and nothing else in the program changes.
- [ ] `tag-release.sh`: the two header comments naming the tag shape and message, `tag="devscene--v${version}"`, and `-m "devscene $version"`. The header's sentence *"the shape of the first one, v0.1.0"* now describes a historical tag under the earlier name, so append *"(cut under the product's earlier name)"* to it.
- [ ] Parse each edited `.sh` file with `bash -n <file>`, one plain command per file.

**Verification:**

- `git grep -n -F 'autonomous-sdlc-harness' -- .github/workflows/release-npm.yml scripts/release.sh scripts/publish-main.sh scripts/tag-release.sh` prints nothing.
- `git grep -n -F 'devscene--v' -- .github/workflows/release-npm.yml scripts/tag-release.sh cli/templates/github/workflows` lists the trigger, the strip, the tag assignment and the templates' fetch lines, with one spelling of the shape throughout.
- `bash -n` exits 0 on the three scripts.

**Deviations from plan:**

- Evidence downgrade: the three per-file `bash -n <file>` calls (Work item 5, Verification bullet 3) were each refused by the tool layer ("Permission to use Bash has been denied because Claude Code is running in don't ask mode"). The parse claim rests instead on the configured `commands.typecheck`, `bash scripts/typecheck.sh`, whose `scripts/check-shell-parse.sh` step runs `bash -n` over every shell script git lists (`scripts/typecheck.sh` → its header's "`bash -n` over every shell script git lists"); it printed `check-shell-parse: 124 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed` and `PASS: typecheck`.
- `tag-release.sh` header: the edited sentence was reflowed so `The` joins the `Install the pinned plugin` line; no wording beyond the planned edits changed.
