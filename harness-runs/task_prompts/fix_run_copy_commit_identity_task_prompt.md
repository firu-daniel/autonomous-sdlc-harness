`fix_run_copy_commit_identity` makes a run copy commit under the main checkout's git identity. Since `feat_clone_per_run`, every commit a run makes is authored by whatever the user's **global** `~/.gitconfig` names, not by the identity the main checkout sets in its own `.git/config`.

Measured on `fix_run_gates_sandbox_tmpdir` (PR #126), 2026-10-21:

- The main checkout's `.git/config` sets `user.name` / `user.email` to the maintainer's GitHub identity. The global `~/.gitconfig` names a different account's identity.
- All 23 commits on the branch carry the global identity (`git log --format='%an <%ae> | %cn <%ce>' origin/dev..HEAD`). GitHub attributes them to that other account, because the email is verified there. The push itself went through the remote's own SSH key, so no access by that account was involved; only the author text was wrong.
- **Cause:** `hr_clone_create_var` (`cli/templates/scripts/lib/harness-run-lib.sh`) rewrites the clone's `.git/config` to the allow-list `hr_clone_config_spec` prints. That list carries no `user.*` key. `hr_clone_config_check_var` then refuses any key outside the list, so the wrappers would also refuse a `user.name` written into a clone by hand.
- A legacy worktree run shares the main checkout's `.git/config`, which is why this started with the clone layout.

**The omission was not a decision.** `feat_clone_per_run` built the allow-list (Task 1, `4bb22716`) to close a code-execution surface. Its task prompt's goal 4 ("Protect the clone's own trust surface") says unsandboxed code must not trust a clone's `.git/config`, `.git/hooks` or `objects/info/alternates`, because the commit and push wrappers run git there outside the sandbox. A planted key could make that git execute a program. The list holds the structural keys, `remote.origin.*`, `core.hooksPath` and the platform booleans. Neither the plan, its task files nor its reviews mention commit identity either way.

**It surfaced once already, unflagged.** `feat_clone_per_run_switch` Task 28's deviation note (`harness-runs/task_plans/feat_clone_per_run_switch/task_28_plan.md`) records that a test clone's push was refused because `user.email` was set in its `.git/config`, outside the allow-list. The implementer switched to `-c user.email=… -c user.name=…` and moved on.

**Why adding the identity is safe.** `user.name` and `user.email` are data git writes into a commit and never execute. As exact copies of the main checkout's values, they leave the allow-list as strict as it is: a session still cannot set its own identity. A session also cannot write the clone's `.git/config` in the first place (`docs/sandbox-verification.md` row CL5; CS1 owed), so the check stays defence in depth.

It starts from a `dev` that carries `fix_run_gates_sandbox_tmpdir`.

## The goal

1. Add `user.name` and `user.email` to the clone allow-list as exact values (`=<value>`), listed **only when the main checkout's `.git/config` sets them**. That is the same conditional form `remote.origin.url` already uses. `hr_clone_create_var` copies them into the clone. A main checkout that sets neither leaves the clone on the global identity, which is then the correct identity by definition.
2. Decide, and record the decision, whether the commit-signing keys (`user.signingkey`, `commit.gpgsign`, `gpg.format`) travel the same way. A main checkout that signs its commits would otherwise produce unsigned commits in every run.
3. Keep the per-run profile and `doctor` consistent with the widened list, wherever either reads it.

## Constraints

- **Existing clones keep passing the check.** A clone created before this change has no `user.*` keys. The new keys must be optional (present only with the main checkout's exact value), never required.
- **Signing keys split into data and programs.** `user.signingkey` and `commit.gpgsign` are data. `gpg.program` and `gpg.ssh.program` name a program git executes, which is the exact class the allow-list exists to keep out. If goal 2 carries them at all, it carries them only as the main checkout's exact value. Record that as a deliberate trust decision, with the main checkout's `.git/config` as the trusted source, never as a widened rule.
- **A value that does not match the main checkout's is still refused.** A session must not be able to set its own author identity in the clone's config.
- **Test both arms:** a main checkout with a local identity (the clone carries it, and a commit made in the clone is authored by it), and one without (the clone carries no `user.*` key).
- **Record the measurement** beside the clone-layout rows in `docs/sandbox-verification.md` → `### The clone layout (owed)`. Name no account and no email in the record; refer to them as the main checkout's identity and the global one.
