#!/usr/bin/env bash
# release.sh — run a whole release from one terminal: bump the version on dev, publish dev onto
# main, tag the publication, and watch npm publish it. Hand-written for this repository, like
# tag-release.sh and publish-main.sh: it is not in the set `init --force` regenerates, and
# publish-main.sh removes `scripts/`, so it never reaches `main`.
#
# THE STEPS, each one skipped when it is already done — so a run that stopped part-way (a failed
# workflow, a Ctrl-C) is resumed by running the same command again:
#
#   1. Bump. A branch `chore_bump_version_<x_y_z>` cut from origin/dev in a throwaway worktree (the
#      caller's checkout is never touched), the version changed in the four files every bump has
#      touched, a pull request onto dev, squash-merged. Skipped when origin/dev already carries the
#      version; an open pull request from that branch is reused rather than recreated.
#   2. Publish onto main. The push to dev runs .github/workflows/publish-main.yml, which stages the
#      publication on `publish`; this waits for that run, opens the `publish` → main pull request
#      (Actions may not open it here — see publish-main.sh) and merges it with Rebase and merge,
#      the only method main's ruleset allows. Skipped when origin/main already carries the version.
#   3. Tag. scripts/tag-release.sh, which needs a terminal and is idempotent.
#   4. npm. The tag push runs .github/workflows/release-npm.yml, which publishes by trusted
#      publishing; this waits for that run and then for the registry to list the version. Skipped
#      when the registry already lists it.
#
# WHO RUNS IT. The operator, at a terminal, with `gh` logged in as an account that may merge onto
# dev and main. Merging through `gh` is the same pull-request route the rulesets require of the web
# UI — nothing here pushes to a protected branch, which githooks/pre-push would refuse anyway.
# Without --dry-run it refuses unless stdin is a terminal, for the reason tag-release.sh gives.
#
# Usage: release.sh <version> [--dry-run] [--yes]
#   --dry-run  report which steps are done and which would run; change nothing
#   --yes      skip the one confirmation before the first change
# Exit: 0 released, or already released · 1 refused or failed · 2 bad usage

set -uo pipefail

usage() {
  echo "release: $1" >&2
  echo "  usage: release.sh <version> [--dry-run] [--yes]" >&2
  exit 2
}

fail() {
  echo "release: $1" >&2
  exit 1
}

say() {
  echo "release: $1"
}

version=""
dry_run=0
assume_yes=0
for arg in "$@"; do
  case "$arg" in
    --dry-run) dry_run=1 ;;
    --yes) assume_yes=1 ;;
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

for tool in gh jq npm; do
  command -v "$tool" >/dev/null 2>&1 || fail "$tool is required and is not on PATH"
done

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$repo_root" ] || ! cd "$repo_root"; then
  fail "could not resolve a repository root from '${script_dir}' (is git on PATH?)"
fi

package="autonomous-sdlc-harness"
tag="${package}--v${version}"
manifest="plugin/.claude-plugin/plugin.json"
bump_branch="chore_bump_version_${version//[.+-]/_}"
title="chore: bump version to ${version}"
poll_seconds=10

slug="$(gh repo view --json nameWithOwner --jq .nameWithOwner 2>/dev/null)" \
  || fail "gh could not resolve this repository (is it logged in? try 'gh auth status')"

# The version a ref's plugin manifest carries, or nothing.
version_at() {
  git cat-file blob "$1:${manifest}" 2>/dev/null | jq -r '.version // empty' 2>/dev/null
}

fetch() {
  git fetch --quiet origin main dev || fail "could not fetch main and dev from origin"
}

# Wait for the first run of <workflow> that matches the jq filter <select>, then watch it to the
# end. No deadline: a queued runner is slow, not failed, and Ctrl-C is always there.
watch_run() {
  local workflow="$1" select="$2" what="$3" run_id=""
  say "waiting for the ${what} run of ${workflow}…"
  while [ -z "$run_id" ]; do
    run_id="$(gh run list --repo "$slug" --workflow "$workflow" --limit 20 \
      --json databaseId,headSha,headBranch --jq "[.[] | select(${select})][0].databaseId // empty" 2>/dev/null)"
    [ -n "$run_id" ] || sleep "$poll_seconds"
  done
  gh run watch "$run_id" --repo "$slug" --exit-status --interval "$poll_seconds" >/dev/null \
    || fail "${workflow} run ${run_id} failed: gh run view ${run_id} --repo ${slug} --log-failed"
  say "${workflow} run ${run_id} passed"
}

fetch
dev_version="$(version_at refs/remotes/origin/dev)"
main_version="$(version_at refs/remotes/origin/main)"
[ -n "$dev_version" ] || fail "could not read the version origin/dev carries"

bump_done=0
publish_done=0
npm_done=0
[ "$dev_version" = "$version" ] && bump_done=1
[ "$main_version" = "$version" ] && publish_done=1
[ "$(npm view "${package}@${version}" version 2>/dev/null)" = "$version" ] && npm_done=1

if [ "$bump_done" -eq 0 ]; then
  newest="$(printf '%s\n' "$dev_version" "$version" | sort -V | tail -n 1)"
  [ "$newest" = "$version" ] || fail "origin/dev is already at ${dev_version}, past ${version}"
fi

state() { [ "$1" -eq 1 ] && echo "done" || echo "to do"; }
say "releasing ${version} (dev ${dev_version}, main ${main_version:-none})"
echo "  1. bump on dev        $(state "$bump_done")"
echo "  2. publish onto main  $(state "$publish_done")"
echo "  3. tag                (tag-release.sh decides: ${tag})"
echo "  4. npm publish        $(state "$npm_done")"

if [ "$dry_run" -eq 1 ]; then
  [ "$publish_done" -eq 0 ] || bash scripts/tag-release.sh "$version" --dry-run
  exit 0
fi

[ -t 0 ] || fail "stdin is not a terminal; a release is run by a person at a terminal (use --dry-run to inspect)"

if [ "$npm_done" -eq 1 ]; then
  say "${package}@${version} is already on npm — making sure it is tagged"
  bash scripts/tag-release.sh "$version"
  exit $?
fi

if [ "$assume_yes" -eq 0 ]; then
  read -r -p "release: proceed? [y/N] " answer
  [[ "$answer" =~ ^[Yy]$ ]] || fail "stopped before changing anything"
fi

# --- 1. Bump -------------------------------------------------------------------------------------

if [ "$bump_done" -eq 0 ]; then
  pr="$(gh pr list --repo "$slug" --head "$bump_branch" --base dev --state open \
    --json number --jq '.[0].number // empty')"
  if [ -z "$pr" ]; then
    worktree="$(mktemp -d)" || fail "could not create a temporary directory"
    trap 'git worktree remove --force "$worktree" >/dev/null 2>&1; rm -rf "$worktree"; git branch -D "$bump_branch" >/dev/null 2>&1' EXIT
    git worktree add --quiet -B "$bump_branch" "$worktree" refs/remotes/origin/dev \
      || fail "could not cut ${bump_branch} from origin/dev"

    # Change exactly the package's own version lines, never a dependency's that happens to share
    # the old value: the top-level "version" of each manifest, and in the lockfile the top-level
    # one plus those of the "" and "cli" package entries.
    for file in package.json cli/package.json "$manifest"; do
      sed -i.orig -E "s/^  \"version\": \"${dev_version//./\\.}\",/  \"version\": \"${version}\",/" "$worktree/$file" \
        && rm -f "$worktree/$file.orig" || fail "could not bump $file"
    done
    awk -v old="$dev_version" -v new="$version" '
      /^  "version": / && !top { sub("\"" old "\"", "\"" new "\""); top = 1 }
      /^    "(cli)?": [{]$/ { own = 1 }
      own && /^      "version": / { sub("\"" old "\"", "\"" new "\""); own = 0 }
      { print }
    ' "$worktree/package-lock.json" >"$worktree/package-lock.json.new" \
      && mv "$worktree/package-lock.json.new" "$worktree/package-lock.json" \
      || fail "could not bump package-lock.json"

    changed="$(git -C "$worktree" diff --numstat | awk '{ a += $1; d += $2 } END { print a + 0 "/" d + 0 }')"
    [ "$changed" = "6/6" ] \
      || fail "the bump changed ${changed} lines (added/removed), not the 6/6 every bump has — inspect ${worktree}"

    git -C "$worktree" commit --quiet -am "$title" || fail "could not commit the bump"
    git -C "$worktree" push --quiet --force-with-lease -u origin "$bump_branch" \
      || fail "could not push ${bump_branch}"
    gh pr create --repo "$slug" --base dev --head "$bump_branch" --title "$title" \
      --body "Bump the plugin, CLI and workspace version to ${version}." >/dev/null \
      || fail "could not open the bump pull request"
    pr="$(gh pr list --repo "$slug" --head "$bump_branch" --base dev --state open \
      --json number --jq '.[0].number // empty')"
    [ -n "$pr" ] || fail "opened the bump pull request but could not find it"
  fi
  say "squash-merging the bump, #${pr}, onto dev"
  gh pr merge "$pr" --repo "$slug" --squash --delete-branch >/dev/null \
    || fail "could not merge #${pr} onto dev"
  fetch
  [ "$(version_at refs/remotes/origin/dev)" = "$version" ] \
    || fail "#${pr} is merged but origin/dev does not carry ${version}"
fi

# --- 2. Publish onto main ------------------------------------------------------------------------

if [ "$publish_done" -eq 0 ]; then
  dev_tip="$(git rev-parse refs/remotes/origin/dev)"
  watch_run publish-main.yml ".headSha == \"${dev_tip}\"" "dev ${dev_tip:0:12}"

  git fetch --quiet origin publish || fail "could not fetch the publish branch"
  [ "$(git log -1 --format='%(trailers:key=Published-from,valueonly)' refs/remotes/origin/publish | tr -d '[:space:]')" = "$dev_tip" ] \
    || fail "the publish branch does not carry dev ${dev_tip:0:12}"
  [ "$(version_at refs/remotes/origin/publish)" = "$version" ] \
    || fail "the publish branch does not carry ${version}"

  pr="$(gh pr list --repo "$slug" --head publish --base main --state open \
    --json number --jq '.[0].number // empty')"
  if [ -z "$pr" ]; then
    gh pr create --repo "$slug" --base main --head publish \
      --title "$(git log -1 --format=%s refs/remotes/origin/publish)" \
      --body "Publication of dev \`${dev_tip}\` onto main, built by \`scripts/publish-main.sh\`, for release ${version}." >/dev/null \
      || fail "could not open the publication pull request"
    pr="$(gh pr list --repo "$slug" --head publish --base main --state open \
      --json number --jq '.[0].number // empty')"
    [ -n "$pr" ] || fail "opened the publication pull request but could not find it"
  fi
  # Rebase and merge, never anything else: publish-main.sh → MERGE IT WITH "REBASE AND MERGE".
  say "rebase-merging the publication, #${pr}, onto main"
  gh pr merge "$pr" --repo "$slug" --rebase >/dev/null || fail "could not merge #${pr} onto main"
  fetch
  [ "$(version_at refs/remotes/origin/main)" = "$version" ] \
    || fail "#${pr} is merged but origin/main does not carry ${version}"
fi

# --- 3. Tag --------------------------------------------------------------------------------------

bash scripts/tag-release.sh "$version" || fail "tag-release.sh did not tag ${version}"

# --- 4. npm --------------------------------------------------------------------------------------

watch_run release-npm.yml ".headBranch == \"${tag}\"" "${tag}"

say "waiting for the registry to list ${package}@${version}…"
until [ "$(npm view "${package}@${version}" version 2>/dev/null)" = "$version" ]; do
  sleep "$poll_seconds"
done
say "released ${version}: https://www.npmjs.com/package/${package}/v/${version}"
