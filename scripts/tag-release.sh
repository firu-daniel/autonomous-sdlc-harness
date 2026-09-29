#!/usr/bin/env bash
# tag-release.sh — create and push the release tag `autonomous-sdlc-harness--v<version>`, the ref a
# remote run installs the plugin from. Hand-written for this repository, like publish-main.sh: it is
# not in the set `init --force` regenerates, and publish-main.sh removes `scripts/`, so it never
# reaches `main`.
#
# WHAT A RELEASE TAG IS, AND WHO READS IT. An annotated tag named `autonomous-sdlc-harness--v<version>`
# with the message `autonomous-sdlc-harness <version>` — the shape of the first one, v0.1.0. The
# `Install the pinned plugin` step of cli/templates/github/workflows/harness-run.yml clones the
# marketplace repository at exactly that tag, for the CLI version the workflow was rendered by. A
# version released without its tag is a version whose adopters' remote runs cannot install the plugin.
#
# WHICH COMMIT IT TAGS. The oldest commit on `origin/main`'s first-parent line whose
# plugin/.claude-plugin/plugin.json carries <version>: that commit is the version bump's publication.
# A later commit with the same version holds work published after the release, which the release did
# not ship. A version that never appears on that line was never published, and there is nothing to
# tag.
#
# WHY `main` AND NEVER `dev`. `main` is the branch adopters install from, and its commits carry
# .claude-plugin/marketplace.json and plugin/ without this repository's own adoption — the tree the
# workflow's clone adds as a marketplace. A `dev` commit carries the adoption as well.
#
# WHO RUNS IT. The operator, at a terminal, after the publication pull request carrying the version
# bump has landed on `main` and before the npm package is published — so no published CLI renders a
# workflow pinned to a tag that does not exist yet. It also backfills the tags of past releases.
#
# WHY A PUSH NEEDS A TERMINAL. Without --dry-run the script refuses unless stdin is a terminal. A
# release tag is pushed by a person; an unattended run's Bash tool has no terminal, and this refusal
# is what stops it there, where the script-allowlist guard would otherwise permit the call. Tag
# creation goes through plain `git tag -a`, so the operator's own tag-signing configuration applies.
#
# Usage: tag-release.sh <version> [--dry-run]
#   --dry-run  resolve the target and report what would be created and pushed; change nothing
# Exit: 0 tagged, or already tagged · 1 refused or failed · 2 bad usage

set -uo pipefail

usage() {
  echo "tag-release: $1" >&2
  echo "  usage: tag-release.sh <version> [--dry-run]" >&2
  exit 2
}

fail() {
  echo "tag-release: $1" >&2
  exit 1
}

version=""
dry_run=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) dry_run=1 ;;
    -*) usage "unrecognized argument '$arg'" ;;
    *)
      [ -z "$version" ] || usage "unexpected second version '$arg'"
      version="$arg"
      ;;
  esac
done
[ -n "$version" ] || usage "missing <version>"

semver_re='^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$'
[[ "$version" =~ $semver_re ]] \
  || usage "'$version' is not a MAJOR.MINOR.PATCH version (an optional -pre-release or +build suffix is allowed)"

command -v jq >/dev/null 2>&1 || fail "jq is required and is not on PATH"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$repo_root" ] || ! cd "$repo_root"; then
  fail "could not resolve a repository root from '${script_dir}' (is git on PATH?)"
fi

tag="autonomous-sdlc-harness--v${version}"
manifest="plugin/.claude-plugin/plugin.json"

git fetch --quiet --tags origin main || fail "could not fetch main and tags from origin"
git rev-parse --verify --quiet "refs/remotes/origin/main^{commit}" >/dev/null || fail "origin has no main"

# --- The target ----------------------------------------------------------------------------------

target=""
last_blob=""
while read -r sha; do
  blob="$(git rev-parse --verify --quiet "${sha}:${manifest}" 2>/dev/null)" || continue
  [ "$blob" != "$last_blob" ] || continue
  last_blob="$blob"
  found="$(git cat-file blob "$blob" | jq -r '.version // empty' 2>/dev/null)"
  if [ "$found" = "$version" ]; then
    target="$sha"
    break
  fi
done < <(git rev-list --first-parent --reverse refs/remotes/origin/main)

[ -n "$target" ] \
  || fail "version ${version} was never published to origin/main's first-parent line (no ${manifest} there carries it), so there is nothing to tag"

git cat-file -e "${target}:.claude-plugin/marketplace.json" 2>/dev/null \
  || fail "target $(git rev-parse --short "$target") carries no .claude-plugin/marketplace.json, so the workflow could not install from it"

target_line="$(git log -1 --format='%h %s' "$target")"

# --- Existing tags -------------------------------------------------------------------------------

remote_has_tag() {
  [ -n "$(git ls-remote --tags origin "refs/tags/${tag}")" ]
}

existing="$(git rev-parse --verify --quiet "refs/tags/${tag}^{commit}")"
if [ -n "$existing" ]; then
  if [ "$existing" != "$target" ]; then
    fail "${tag} already exists on $(git log -1 --format='%h %s' "$existing"), but ${version} resolves to ${target_line} — refusing to move it"
  fi
  echo "tag-release: ${tag} is already present at ${target_line}"
  if remote_has_tag; then
    exit 0
  fi
  if [ "$dry_run" -eq 1 ]; then
    echo "tag-release: [dry-run] origin lacks it; would push refs/tags/${tag}"
    exit 0
  fi
  create=0
else
  if [ "$dry_run" -eq 1 ]; then
    echo "tag-release: [dry-run] would create ${tag} at ${target_line} and push it to origin"
    exit 0
  fi
  create=1
fi

# --- Create and push -----------------------------------------------------------------------------

[ -t 0 ] || fail "stdin is not a terminal; a release tag is pushed by a person at a terminal (use --dry-run to inspect)"

if [ "$create" -eq 1 ]; then
  git tag -a "$tag" -m "autonomous-sdlc-harness $version" "$target" \
    || fail "could not create ${tag} at ${target_line}"
  echo "tag-release: created ${tag} at ${target_line}"
fi

git push origin "refs/tags/${tag}" || fail "could not push ${tag} to origin"
echo "tag-release: pushed ${tag}"
