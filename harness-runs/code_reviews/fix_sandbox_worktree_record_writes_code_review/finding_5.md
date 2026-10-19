### 5. `plugin/hooks/README.md` still says the corpus's own commit invocation carries `${branch}` and is auto-allowed by the script-allowlist guard

**File:** `plugin/hooks/README.md` → the outcome-table row for `autonomous-script-allowlist-guard.sh` — "the shipped instruction corpus's own commit invocation carries `${branch}`, so **that invocation is auto-allowed by this guard**, not left to the profile's literal forms"

This branch changed every commit invocation in the instruction corpus. Each one now names the main checkout's copy, `bash <MAIN_REPO>/<scripts_dir>/commit-on-branch.sh --repo <repo_root> …`, with no `$` anywhere in the command. From a worktree the script-allowlist guard does not vouch for that copy, and the call's only grant is the profile's literal `allow` entry (`plugin/instructions/autonomous_pause_and_ledger.md` §1.6). After this branch, no `commit-on-branch.sh` invocation in `plugin/` carries `${branch}`.

The README's justification for narrowing the guard's `${` arm by shape therefore states something about the corpus that is no longer true. Anyone tuning that arm would conclude that the shipped commit points depend on it and that tightening it would break them. They no longer depend on it.

**Fix:** replace the quoted substring with: "a wrapper invocation the guard vouches for may carry `${branch}` in a path or in its subject; the shipped corpus's own commit invocations no longer do, because they name the main checkout's copy, carry no `$` at all and are granted by the profile's literal `allow` entry (`plugin/instructions/autonomous_pause_and_ledger.md` §1.6)". Keep the rest of the row, from "— and the redirection part" onward, byte-identical. This edit is to the README only, not to the guard, and runs no test.
