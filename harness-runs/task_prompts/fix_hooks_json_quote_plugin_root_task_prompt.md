`scripts/run-gates.sh` → gate `1a plugin manifest` fails on every run, because `plugin/hooks/hooks.json` puts
`${CLAUDE_PLUGIN_ROOT}` in its hook commands without quotes. Quote it so the gate passes, and so every guard
hook still runs when the plugin's path contains a space.

> ⚠️ **Locate every anchor in this prompt by quoted text or heading, never by line number.**

---

## The defect

Gate `1a` is `claude plugin validate --strict plugin`. Claude Code `2.1.282` warns once for each of the six
`PreToolUse` commands in `plugin/hooks/hooks.json`, each written as
`bash ${CLAUDE_PLUGIN_ROOT}/hooks/<guard>.sh`:

> Shell command uses ${CLAUDE_PLUGIN_ROOT} without quotes … If the expanded path contains a space the command
> can split into several words and fail. Wrap the placeholder in double quotes, or use exec form

`--strict` treats warnings as errors, so the gate fails. It fails in the main checkout and in every per-branch
worktree, so `commands.test` exits 1 on every unit of every run. The `fix_gate_6a_worktree_git_file` run
recorded this: each implementer and both end-of-branch reviewers diagnosed the same failure again, and
`harness-runs/improvement_observations/fix_gate_6a_worktree_git_file.md` lists it as wasted work.

The warning is right on its own terms too. These six hooks are the harness's guards, including the protected
branch, commit and rewrite guards and the script allowlist. If the plugin is installed under a path that
contains a space, bash splits the command into several words. The hook then exits with an error instead of
judging the tool call.

## What to deliver

1. All six `hooks.json` commands pass `claude plugin validate --strict plugin` with no warnings. Choose between
   the two forms the validator offers, the double-quoted placeholder or exec form, and record why.
2. Every guard still receives its hook input and still returns its decision, the same as before the change.
3. Any file that quotes these command strings is changed to match.

## Establish, do not assume

- **Whether exec form behaves the same as shell form for these hooks.** That covers how stdin reaches the
  script, and the exit-code and output contract each guard relies on. It also covers which Claude Code versions
  accept exec form. If that cannot be settled from the installed CLI and its documentation, quote the placeholder.
- **Whether anything reads these command strings as data.** Check tests under `cli/test/`, templates under
  `cli/templates/`, the docs and the conventions documents.
- **Whether gate `1b marketplace manifest` validates the same hook file**, and whether it still passes after the
  change.

## Out of scope

- The guard scripts' own logic.
- Any other gate.

## Acceptance

1. `claude plugin validate --strict plugin` exits 0 and prints no warning. Record its output.
2. `bash scripts/run-gates.sh` reports `ok    1a plugin manifest` in this run's worktree and prints no new
   failure.
3. With the plugin loaded from a copy at a path that contains a space, one guard still fires on the input it
   exists to catch, for example the protected-branch guard refusing a commit on the default branch. Record the
   result, and remove the copy afterwards.
