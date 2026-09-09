commands/ — the harness's slash commands
========================================

This directory holds the harness's slash-command definitions — the `branch-*`
entry points a user (or the outer loop) invokes to write a branch plan, run the
per-task implement/review loop in supervised, semi-autonomous or autonomous mode,
run the end-of-branch review and its fix flow, run the documentation phase, drive
the browser-QA session, and pause, resume or report on a run. Roadmap item 5
landed the nineteen `branch-*` commands beside this file: the four supervised
ones, the semi-autonomous pair, the two autonomous entry points, the four
user-review commands across those modes, the phase-gated documentation and
browser-QA commands, and the five run-control entry points. Not every command
here is a `branch-*` one: item 15 added `/harness-analyze`, the supervised
first-session command that fills the conventions documents `init` writes as
skeletons from the adopted repository's real code. Each command body reaches its
instruction, sample and script assets as `${CLAUDE_PLUGIN_ROOT}/<dir>/<file>`,
the only form that resolves under both a git-sourced install and a
directory-sourced one.

Why this file is README.txt and not README.md: component discovery loads every
`.md` file in this directory as a slash command, so a `README.md` here is parsed
as a command definition and fails `claude plugin validate --strict` with
"frontmatter: No frontmatter block found".
