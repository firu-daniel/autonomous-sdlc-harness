#!/usr/bin/env bash
# check-eval-artifacts.sh — print every machine-local path, credential or account identifier in the
# docs-retrieval eval's committed data artifacts. Hand-written for this repository; run-gates.sh runs
# it as gate 6e, and `docs/development.md` §5 gate 6 states the contract in prose.
#
# WHAT IT SCANS. Data only: evals/docs-retrieval/queries/, evals/docs-retrieval/transcripts/ and
# evals/docs-retrieval/arm-a/sample-transcript.json. A target that does not exist is skipped silently.
# Never the scripts or prose beside them: run-arm-a.sh and docs/retrieval-eval.md document an
# illustrative /tmp output path, which 6a already judges.
#
# WHAT IT REFUSES. An absolute POSIX path under /Users/, /home/, /private/, /tmp/, /var/, /Volumes/
# or /opt/; a Windows drive path; a `../` segment; the literal `HARNESS_EVAL_CORPUS_ROOT=`; the
# credential shapes sk-ant-, ghp_, github_pat_, xox[bp]-, AKIA plus 16; the keys session_id, "cwd"
# and api_key; an e-mail address.
#
# WHY 6a DOES NOT COVER IT. 6a greps for the running user's $HOME only, so a ref under /tmp,
# /private/var or another user's home, a `..`-climbing path, or a credential passes it; and 6a is
# red in a self-adopted checkout by design, so a new hit there is invisible to a "no new failure"
# reading.
#
# Usage: bash scripts/check-eval-artifacts.sh   (no arguments)
# Output: one `path:line:match` per hit, repo-relative, and nothing else. Exit 0 either way — the
# gate grades output, not status; an error message is output too, so it fails the gate.
set -u

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null)"
if [ -z "$repo_root" ] || ! cd "$repo_root"; then
  echo "check-eval-artifacts: could not resolve a repository root from '${script_dir}' (is git on PATH?)"
  exit 0
fi

targets=()
for candidate in \
  evals/docs-retrieval/queries \
  evals/docs-retrieval/transcripts \
  evals/docs-retrieval/arm-a/sample-transcript.json; do
  if [ -e "$candidate" ]; then
    targets+=("$candidate")
  fi
done

# The leading class keeps a URL's or a relative path's own segment (`example.com/var/`, `docs/tmp/`)
# from reading as an absolute path; a hit therefore prints with the one character before it.
patterns=(
  -e '(^|[^A-Za-z0-9_.~-])/(Users|home|private|tmp|var|Volumes|opt)/'
  -e '(^|[^A-Za-z0-9])[A-Za-z]:[\/]'
  -e '\.\./'
  -e 'HARNESS_EVAL_CORPUS_ROOT='
  -e 'sk-ant-|ghp_|github_pat_|xox[bp]-|AKIA[0-9A-Z]{16}'
  -e 'session_id|"cwd"|api_key'
  -e '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
)

# Bash 3.2 treats an empty array expansion as unbound under `set -u`.
if [ ${#targets[@]} -gt 0 ]; then
  grep -rnoE "${patterns[@]}" "${targets[@]}"
fi
exit 0
