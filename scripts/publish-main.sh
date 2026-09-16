#!/usr/bin/env bash
# publish-main.sh — regenerate `main` from `dev`: take dev's tree, remove this repository's own
# harness adoption from it, and commit the result onto `main` as ONE ordinary commit. Hand-written
# for this repository, like run-gates.sh: it is not in the set `init --force` regenerates, and it is
# itself one of the paths it removes, so it never reaches `main`.
#
# THE BRANCH MODEL IT SERVES. `dev` is the trunk: it carries the product AND the adoption
# (harness.config.json, .claude/, scripts/, githooks/, harness-runs/), feature branches are cut
# from it and merge back into it by pull request, and `defaultBranch` in harness.config.json names
# it, so worktrees are cut from it too. `main` carries the product and nothing else, and is never a
# merge target. A merge from dev into a main that deleted those paths would raise a modify/delete
# conflict on every artifact touched since the previous merge; this script builds the tree directly
# instead, so there is no merge base and nothing to conflict.
#
# WHO RUNS IT. .github/workflows/publish-main.yml, on every push to `dev` — so each feature pull
# request merged into dev becomes one commit on main. It can be run by hand with --dry-run to see
# what would be published; a real local run would be refused by githooks/pre-push, which protects
# main, and that is intended.
#
# WHAT A PUBLICATION IS. A commit whose tree is dev's tree minus the removed paths, whose ONLY
# parent is main's tip, and whose message ends in a `Published-from: <dev sha>` trailer. One parent
# makes it read like a squash merge: dev's granular history is not reachable from main. Author and
# committer are taken from dev's tip commit, so main keeps the identity of whoever merged the pull
# request. If the pruned tree equals main's tree — a push that touched only removed paths — nothing
# is published.
#
# THE MESSAGE. dev's tip is read as the pull request that produced it: GitHub's merge commit
# ("Merge pull request #N from …", PR title in the body) publishes as "<PR title> (#N)"; a squash
# merge's subject is already that shape and is used as is; anything else publishes under its own
# subject. When more than one first-parent commit is being published, the body lists them all.
#
# THE GUARD. A publication replaces main's content with dev's, so a commit that landed on main by
# any other route would be silently undone by the next one. Before publishing, every first-parent
# commit on main since its last publication must be accounted for: either it is already in dev's
# history, or a commit in the unpublished range of dev carries git's `cherry picked from commit
# <sha>` line for it — which is what `git cherry-pick -x` writes. Otherwise the script refuses and
# names the commit. Port it to dev that way and the next push publishes. Before the first
# publication, main has no `Published-from` trailer anywhere, and main's tip must then be an
# ancestor of dev — true for the dev that was branched from it.
#
# THE REMOVED PATHS are root-level and exact. examples/notes-app/.claude/ and its sdlc-harness/
# are the fixture and are kept. The managed block `init` writes into .gitignore is cut out of that
# file rather than the file removed.
#
# Usage: publish-main.sh [--dry-run]
#   --dry-run  build the publication and print it; push nothing
# Exit: 0 published, or nothing to publish · 1 refused or failed · 2 bad usage

set -uo pipefail

removed_paths=(
  harness.config.json
  .claude
  .gitattributes
  githooks
  harness-runs
  scripts
  .github/workflows/publish-main.yml
)

fail() {
  echo "publish-main: $1" >&2
  exit 1
}

dry_run=0
case "${1:-}" in
  "") ;;
  --dry-run) dry_run=1 ;;
  *)
    echo "publish-main: unrecognized argument '$1'" >&2
    echo "  usage: publish-main.sh [--dry-run]" >&2
    exit 2
    ;;
esac

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$repo_root" ] || ! cd "$repo_root"; then
  fail "could not resolve a repository root from '${script_dir}' (is git on PATH?)"
fi

git fetch --quiet origin main dev || fail "could not fetch main and dev from origin"
main_tip="$(git rev-parse --verify --quiet refs/remotes/origin/main^{commit})" || fail "origin has no main"
dev_tip="$(git rev-parse --verify --quiet refs/remotes/origin/dev^{commit})" || fail "origin has no dev"

# --- The guard -----------------------------------------------------------------------------------

# The newest publication on main's first-parent line, and the dev commit it was published from.
last_pub=""
last_from=""
while read -r sha from; do
  if [ -n "$from" ]; then
    last_pub="$sha"
    last_from="$from"
    break
  fi
done < <(git log --first-parent --format='%H %(trailers:key=Published-from,valueonly,separator=%x20)' "$main_tip")

if [ -z "$last_pub" ]; then
  git merge-base --is-ancestor "$main_tip" "$dev_tip" \
    || fail "main has never been published and its tip ${main_tip:0:12} is not in dev's history — refusing to replace it"
  since="$main_tip"
  unaccounted=()
else
  git rev-parse --verify --quiet "${last_from}^{commit}" >/dev/null \
    || fail "main's last publication ${last_pub:0:12} names dev commit ${last_from:0:12}, which this clone does not have"
  git merge-base --is-ancestor "$last_from" "$dev_tip" \
    || fail "main's last publication came from ${last_from:0:12}, which is no longer in dev's history — was dev rewritten?"
  since="$last_from"
  unaccounted=()
  ported="$(git log --format=%B "${last_from}..${dev_tip}")"
  while read -r sha; do
    [ -n "$sha" ] || continue
    if git merge-base --is-ancestor "$sha" "$dev_tip"; then
      continue
    fi
    if grep -qF "cherry picked from commit $sha" <<<"$ported"; then
      continue
    fi
    unaccounted+=("$sha")
  done < <(git rev-list --first-parent "${last_pub}..${main_tip}")
fi

if [ "${#unaccounted[@]}" -gt 0 ]; then
  echo "publish-main: main carries commits that did not come from dev, and publishing would undo them:" >&2
  for sha in "${unaccounted[@]}"; do
    echo "  $(git log -1 --format='%h %s' "$sha")" >&2
  done
  echo "  port each to dev with 'git cherry-pick -x <sha>' and land it through a pull request; the next push publishes" >&2
  exit 1
fi

# --- The tree ------------------------------------------------------------------------------------

tmp_dir="$(mktemp -d)" || fail "could not create a temporary directory"
trap 'rm -rf "$tmp_dir"' EXIT
export GIT_INDEX_FILE="$tmp_dir/index"

git read-tree "$dev_tip" || fail "could not read dev's tree"

pathspecs=()
for path in "${removed_paths[@]}"; do
  pathspecs+=(":(literal)$path")
done
git ls-files -z -- "${pathspecs[@]}" | git update-index -z --force-remove --stdin \
  || fail "could not remove the adoption paths from the tree"

# Cut init's managed block out of .gitignore: from its marker line to the next blank line, then any
# blank lines the cut leaves at the end of the file.
gitignore_entry="$(git ls-files -s -- .gitignore)"
if [ -n "$gitignore_entry" ]; then
  gitignore_mode="${gitignore_entry%% *}"
  pruned_blob="$(git cat-file blob "${dev_tip}:.gitignore" | awk '
    /^# >>> autonomous-sdlc-harness / { skip = 1; next }
    skip && /^[[:space:]]*$/ { skip = 0; next }
    skip { next }
    { lines[++n] = $0 }
    END { while (n > 0 && lines[n] ~ /^[[:space:]]*$/) n--; for (i = 1; i <= n; i++) print lines[i] }
  ' | git hash-object -w --stdin)" || fail "could not rewrite .gitignore"
  git update-index --cacheinfo "${gitignore_mode},${pruned_blob},.gitignore" \
    || fail "could not stage the rewritten .gitignore"
fi

tree="$(git write-tree)" || fail "could not write the pruned tree"
unset GIT_INDEX_FILE

if [ "$tree" = "$(git rev-parse "${main_tip}^{tree}")" ]; then
  echo "publish-main: dev ${dev_tip:0:12} changes nothing main carries — nothing to publish"
  exit 0
fi

# --- The message ---------------------------------------------------------------------------------

subject="$(git log -1 --format=%s "$dev_tip")"
if [[ "$subject" =~ ^Merge\ pull\ request\ \#([0-9]+)\ from\  ]]; then
  pr_number="${BASH_REMATCH[1]}"
  pr_title="$(git log -1 --format=%b "$dev_tip" | sed '/^[[:space:]]*$/d' | head -n 1)"
  title="${pr_title:-$subject} (#${pr_number})"
else
  title="$subject"
fi

body=""
if [ "$(git rev-list --count --first-parent "${since}..${dev_tip}")" -gt 1 ]; then
  body="$(git log --first-parent --reverse --format='- %s' "${since}..${dev_tip}")"
fi

message="$title"
[ -z "$body" ] || message+=$'\n\n'"$body"
message+=$'\n\n'"Published-from: ${dev_tip}"

export GIT_AUTHOR_NAME GIT_AUTHOR_EMAIL GIT_COMMITTER_NAME GIT_COMMITTER_EMAIL
GIT_AUTHOR_NAME="$(git log -1 --format=%an "$dev_tip")"
GIT_AUTHOR_EMAIL="$(git log -1 --format=%ae "$dev_tip")"
GIT_COMMITTER_NAME="$GIT_AUTHOR_NAME"
GIT_COMMITTER_EMAIL="$GIT_AUTHOR_EMAIL"

commit="$(git commit-tree --no-gpg-sign "$tree" -p "$main_tip" <<<"$message")" \
  || fail "could not create the publication commit"

if [ "$dry_run" -eq 1 ]; then
  echo "publish-main: [dry-run] would push ${commit:0:12} onto main ${main_tip:0:12}:"
  git log -1 --format='%n%B' "$commit"
  git diff --stat "$main_tip" "$commit"
  exit 0
fi

git push origin "${commit}:refs/heads/main" || fail "could not push the publication to main"
echo "publish-main: published dev ${dev_tip:0:12} to main as ${commit:0:12} — $title"
