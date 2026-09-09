#!/usr/bin/env bash
# scaffold.sh — builds the working directory both arms of the `plan-shape` case run in.
#
# PROVISIONAL along with the rest of this case: how the native runner invokes a scaffold is
# unverified. It reads the destination from `$1` and falls back to the current directory, which
# covers both a runner that `cd`s into a prepared working directory and a hand-rolled driver that
# passes one.

set -euo pipefail

case_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fixture="$(cd "$case_dir/../../examples/notes-app" && pwd)"

# Both track the copied `harness.config.json`: `state_dir` is its `stateDir`, and `branch` is a
# name of this case's choosing that is not in its `protectedBranches`. Change either there and here
# together.
state_dir="sdlc-harness"
branch="feat_body_char_count"

dest="${1:-.}"
mkdir -p "$dest"
dest="$(cd "$dest" && pwd)"
if [ -n "$(ls -A "$dest")" ]; then
  echo "scaffold.sh: destination '$dest' is not empty; refusing to scaffold over it" >&2
  exit 1
fi

# An allowlist rather than a filtered copy, so a file added to the fixture later cannot silently
# reach an arm. One tree must never reach one: the captured `sdlc-harness/` run artifacts, which
# hold a finished plan in the exact shape the grader scores, so an arm handed them scores on copying
# rather than on capability — the baseline arm hardest of all, since copying is the only route by
# which it could produce that shape at all. Its `task_prompts/` half is the single exception and is
# seeded below rather than copied; see the block above `git init`.
#
# `.claude/CLAUDE.md` and `.claude/context/` ARE copied, because withholding them would degrade the
# arm without protecting anything. They are the `layers[].conventions` targets of the copied
# `harness.config.json` and the plan writer's mandated first read
# (`plugin/agents/task-plan-writer.md` → `## Read first`), and they carry none of the graded shape —
# re-runnable against `examples/notes-app/`, and last re-run there on 2026-09-07 against the
# regenerated capture, both still exiting 1:
#     grep -rn "Phase 2 Readiness\|_(points:\|_(layer:" .claude/                        → exit 1
#     grep -rin "readiness\|story index\|story_plan\|task_plan\|per-task file" .claude/ → exit 1
# The layer vocabulary they state is in `harness.config.json` as well, which is copied and which
# `graders/plan-shape.md` → `## What to read` reads that vocabulary from — so withholding them
# withholds nothing from the arm that the grader is not already reading out of a file the arm holds.
# The rest of `.claude/` stays out, and this list is exhaustive against the copied fixture — every
# member the allowlist below does not take is named here with its reason. `settings.json` and
# `settings.autonomous.json`, because arm enablement and permissions belong to the runner rather
# than to the tree. The two `*.env.example` files and `qa_test_scenarios.md`, because no planning
# run reads them. `harness-task-offer.md`, for that same reason: it drives the change-request offer
# dialogue in an adopter's own interactive session (`cli/templates/claude/harness-task-offer.md`,
# "One `AskUserQuestion`, before any of the work"), which no planning run reaches. It carries none
# of the graded shape either — both greps above were re-run with it in the tree.
#
# `scripts/` is copied precisely because `harness.config.json` is. That config's
# `commands.typecheck` / `commands.test` / `commands.devServer` hold the *wrapper invocation*
# rather than the raw npm line (`cli/src/generators/harnessConfig.ts`, "Three non-obvious
# choices", choice 3), so a tree carrying the config without the wrappers is one whose configured
# verification commands name files that are not there. An arm whose verification cannot run
# measures nothing.
#
# `.gitignore` is copied for its project section — `dist/` and `node_modules/`, which appear the
# moment an arm runs `commands.depInstall` and `commands.test` and would otherwise be swept into
# the arm's next commit. The managed block above that section is partly live now that both trees are
# partly scaffolded: its `sdlc-harness/.dispatch_counter` line covers the counter the plan flow
# writes into the seeded state directory on entry, and its STOP / PAUSE lines cover the control files
# an operator may drop beside it. Its `.claude/*.env` and `.claude/settings.local.json` lines stay
# inert, because none of those files is copied. `.gitattributes` is left out: it normalises line
# endings across contributing machines, and this tree has one.
#
# Re-run record, same date: every entry of the list below resolved in the regenerated fixture, and
# `state_dir` above still matched that tree's `harness.config.json` `stateDir`.
for entry in \
  src \
  test \
  tools \
  package.json \
  package-lock.json \
  tsconfig.json \
  index.html \
  styles.css \
  harness.config.json \
  scripts \
  .gitignore \
  .claude/CLAUDE.md \
  .claude/context
do
  mkdir -p "$(dirname "$dest/$entry")"
  cp -R "$fixture/$entry" "$dest/$entry"
done

# `stateDir` is not withheld wholesale. Its one INPUT directory is seeded, because every route into
# the harness's plan flow reads `<stateDir>/task_prompts/<branch>_task_prompt.md` before it does
# anything else and halts when the file is absent
# (`plugin/instructions/task_plan_writing_instructions_core.md` → `## Setup` step 2;
# `plugin/commands/branch-start-plan-semi-autonomous.md` step 2) — an arm that halts there measures
# nothing. Its OUTPUT directories, `story_plans/` and `task_plans/`, are left absent: those hold what
# the grader scores, and their absence is the case's premise. The body is `prompt.md` below its seed
# marker, extracted rather than restated, so the task the session is handed and the task prompt the
# flow reads cannot drift apart.
mkdir -p "$dest/$state_dir/task_prompts"
sed '1,/^<!-- SEED MARKER/d' "$case_dir/prompt.md" | sed '/./,$!d' \
  > "$dest/$state_dir/task_prompts/${branch}_task_prompt.md"

# The scaffolded tree is a repository, not a plain copy, and that is load-bearing rather than
# leftover state. Every generated wrapper resolves its working directory with
# `git -C "$script_dir" rev-parse --show-toplevel` and `cd`s there
# (`cli/templates/scripts/typecheck.sh`, `test.sh`, `start-dev-server.sh`), so a copy that is not
# a repository takes the wrapper's own failure branch — "could not resolve a repository root",
# exit 1 — and a copy that happens to sit inside some other repository is worse, because the
# wrapper silently `cd`s into *that* one and verifies the wrong tree. `main` is the initial branch
# name because the copied config's `defaultBranch` is `main`.
git init -q -b main "$dest"
# Set on this repository only: the identity belongs to the scratch tree and to nothing outside it.
git -C "$dest" config user.email "evals@autonomous-sdlc-harness.invalid"
git -C "$dest" config user.name "harness evals scaffold"
# A machine with signing enabled globally would block on a passphrase prompt with no operator
# present to answer it.
git -C "$dest" config commit.gpgsign false
git -C "$dest" add -A
git -C "$dest" commit -q -m "Scaffold the notes-app fixture for the plan-shape eval case"
# The arm works on a branch, not on `main`. Every graded path embeds the branch name and every route
# resolves it from `git branch --show-current`, and `main` is in the copied config's
# `protectedBranches` — the plugin arm's own commit guard stops there, so an arm left on `main` would
# be blocked rather than measured. Checked out after the commit, so the branch carries it.
git -C "$dest" checkout -q -b "$branch"

echo "scaffold.sh: prepared $dest on branch $branch"
