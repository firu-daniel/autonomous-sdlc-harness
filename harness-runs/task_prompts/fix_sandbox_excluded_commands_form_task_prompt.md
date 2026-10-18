`fix_sandbox_excluded_commands_form` makes the two excluded wrappers actually run outside the sandbox. `chore_sandbox_manual_verification` measured that the generated `sandbox.excludedCommands` entries, `Bash(bash <main>/scripts/push-branch.sh:*)` and `Bash(bash <main>/scripts/refresh-branch.sh:*)`, match nothing. Running exactly `bash <main>/scripts/push-branch.sh <worktree>` from a sandboxed session still runs sandboxed. SSH goes into the sandbox proxy (`Received disconnect … This proxy requires authentication`), and the push never lands. `refresh-branch.sh` fails the same way (`docs/sandbox-verification.md` → the push and refresh rows; `<home>/Work/harness-sandbox-tests/sandbox-verification-issues.md` #9).

**Measured on Claude Code 2.1.299, macOS, headless**, with a script that reports whether it can write `$HOME`:
- `Bash(bash <script>:*)`: sandboxed, with or without an argument, and with `allowUnsandboxedCommands` either way.
- `bash <script>`: excluded only when the command has no argument.
- `bash <script> *` and `bash <script>:*`: excluded with an argument.
- With `bash <main>/scripts/push-branch.sh:*`, the same sandboxed call pushed (`46c4b45e..ee930ce5`), and the three refresh fixtures behaved as specified. An excluded command inherits none of the sandbox's proxy variables.

It starts from a `dev` that carries `chore_sandbox_manual_verification`.

## The goal

1. Generate `excludedCommands` as `bash <main>/scripts/<wrapper>.sh:*`, the form measured to match, in `cli/src/generators` and in every document that quotes the old spelling: the profile `_README`, `docs/cli.md` §6, `ARCHITECTURE.md`, and the tests.
2. Have `doctor`'s `profile-sandbox` expect the new form. Report the old form as stale, a warning without `--remote-job` and a failure with it, so an adopter's profile is regenerated.
3. Decide whether `push-branch.sh` and `refresh-branch.sh` should keep a `GIT_SSH_COMMAND` the sandbox set. Sandboxed, it is `ssh … -o ProxyCommand='nc -X 5 -x localhost:<port> %h %p'`. Measure whether an excluded call can ever receive it, and record the answer in the wrapper header.
4. Re-run the push, refresh and leading-dash rows of `docs/sandbox-verification.md` on the regenerated profile, and update them.

## Constraints

- Keep exactly two excluded commands, both naming the main checkout's absolute path. The repo-relative and worktree spellings stay sandboxed.
