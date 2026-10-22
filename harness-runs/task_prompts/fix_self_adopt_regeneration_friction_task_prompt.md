`chore_self_adopt_regeneration_friction` removes the hand restore that `HARNESS_SELF_ADOPT=1 init --force` needs in this repository. `chore_sandbox_manual_verification` ran that step to regenerate the profile and `scripts/`. It then had to restore these by hand (`<home>/Work/harness-sandbox-tests/sandbox-verification-issues.md` #5, #6, #8):

- `scripts/test.sh` was re-rendered to `npm test "$@"`. It had been `bash scripts/run-gates.sh "$@"`.
- `scripts/typecheck.sh` was re-rendered to `harness_fail "harness: set commands.typecheck in harness.config.json"`, because `commands.typecheck` names `bash scripts/typecheck.sh`, the wrapper itself.
- `githooks/pre-push` lost its dedicated `publish` refusal message.
- `.claude/CLAUDE.md` and the three context documents went back to skeletons. That one is documented, but it is unwanted in this repository.
- The `.gitignore` merge duplicated a comment line.
- Five `README.md.bak` files were left in gitignored state-dir folders, the autonomous inbox among them, where `git status` never shows them.
- `restart-watcher.sh` refused because the CLI was not on `PATH`, and `HARNESS_CLI` cannot be a command with arguments (`node …/cli/dist/cli.js`).

## The goal

1. A forced self-adopt run keeps a wrapper whose configured command names the wrapper itself, rather than replacing it with a failing stub.
2. Document in `docs/development.md`'s self-adoption section the exact regeneration recipe for this repository, and what it must restore.
3. Write no `.bak` into a gitignored state-dir folder, or name each one in the run's report.
4. Let `restart-watcher.sh` take a multi-word `HARNESS_CLI`, or document the shim.
