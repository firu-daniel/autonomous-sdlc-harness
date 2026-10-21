### 1. The signing decision rests on a false fact: `commit-tree` never reads `commit.gpgSign`, so the main-checkout wrappers' commits are not signed

**File:** `cli/templates/scripts/lib/harness-run-lib.sh` (the `THE CLONE CONFIGURATION ALLOW-LIST — one contract.` block, paragraph `WHY NO SIGNING KEY.`) — "commit-tree` already signs under the main checkout's configuration"
**File:** `docs/cli.md` (§6, the clone-arm paragraph opening "**The excluded rule's `:*` accepts any argument**") — "Commits the wrappers write in the main checkout already take its identity and signing (residual 7 below)"

This branch adds two statements of record. Both say the main-checkout wrappers' `git -C <main> commit-tree` signs commits under the main checkout's configuration, and both use that claim as part of the reason the signing keys stay off the clone allow-list. The claim is false. `git commit-tree` does not read `commit.gpgSign`. It signs only when it is passed `-S`. No harness commit path passes `-S`: `hr_commit_paths_var` runs `hr_run_main_git commit-tree "$tree" -p "$tip_c" "${msg_args[@]}"`, and `refresh-branch.sh` runs `main_git commit-tree "$merge_tree" -p "$old_tip" -p "$base_tip" -m "$merge_msg"`. So no commit any wrapper writes is signed, on the main-checkout side or the clone side.

Measured during this review on git 2.50.1 (Apple Git-155), in a scratch repository with one commit: `git -c commit.gpgsign=true -c gpg.program=/usr/bin/false -c user.name=a -c user.email=a@b commit-tree 'HEAD^{tree}' -p HEAD -m x` exited `0` and printed a new commit id. `gpg.program` named a program that always fails, so any attempt to sign would have failed the call. `commit.gpgsign=true` therefore triggered no signing attempt. The branch's own new row CS11 in `docs/sandbox-verification.md` says the same thing ("`-S`, not `-c commit.gpgsign=true`: `commit-tree` ignores `commit.gpgsign`"), so the branch now contradicts itself.

This matters for any maintainer whose main checkout sets `commit.gpgsign`, as this repository's main checkout does. They would read the decision of record and conclude that the wrapper path keeps their commits signed and only clone-written commits lose the signature. Neither path signs. The decision to keep the signing keys off the list still holds, but its reasons need correcting. Carrying `commit.gpgsign` into a clone would sign nothing and fail nothing, because the commit-writing path is `commit-tree`. Signing a run's commits would need an explicit `-S`.

**Fix:**

1. In `cli/templates/scripts/lib/harness-run-lib.sh`, the `WHY NO SIGNING KEY.` paragraph currently contains:

   ```
   # deliberately not listed. A commit written with the clone as git's repository
   # can be signed only by a program that reaches the signing key or agent socket
   # from wherever that commit is written; that is unmeasured, and a failed
   # signature fails the commit. The main-checkout wrappers' `git -C <main>
   # commit-tree` already signs under the main checkout's configuration. If signing
   ```

   Replace the text from "A commit written with the clone" through "under the main checkout's configuration." so the paragraph reads:

   ```
   # WHY NO SIGNING KEY. `user.signingkey`, `commit.gpgsign`, `gpg.format`,
   # `gpg.program`, `gpg.<format>.program` and `gpg.ssh.defaultKeyCommand` are
   # deliberately not listed. No harness commit is signed today, on either side:
   # every one is written by `commit-tree` (`hr_commit_paths_var`,
   # `refresh-branch.sh`), which never reads `commit.gpgsign` and is passed no
   # `-S`. So the main-checkout wrappers' `git -C <main> commit-tree` writes
   # unsigned commits under the main checkout's identity, and carrying the
   # signing keys into a clone would sign nothing. Signing a run's commits needs
   # an explicit `-S`. Whether a commit written with the clone as git's
   # repository can be signed at all is unmeasured: that needs a program that
   # reaches the signing key or agent socket from there. A signature that cannot
   # be made fails the commit. If signing
   # is ever carried, the program keys travel only as the main checkout's exact
   # values, as a deliberate trust decision naming the main checkout's
   # `.git/config` as the trusted source, never as a widened rule.
   ```

   Re-wrap the comment lines to the file's usual width. The final "If signing is ever carried …" sentence stays word for word.

2. In `docs/cli.md`, the same clone-arm paragraph currently contains:

   > …are deliberately not on the list, so the check refuses each in a clone whatever its value: a signature that cannot be made fails the commit, and whether a commit written with the clone as git's repository can be signed is unmeasured (`docs/sandbox-verification.md`, row CS11, owed under roadmap item 21). Commits the wrappers write in the main checkout already take its identity and signing (residual 7 below).

   Replace it with:

   > …are deliberately not on the list, so the check refuses each in a clone whatever its value. No harness commit is signed today, on either side. Every one is written by `commit-tree`, which never reads `commit.gpgSign` and is passed no `-S`. Measured on git 2.50.1: `git -c commit.gpgsign=true -c gpg.program=/usr/bin/false -c user.name=a -c user.email=a@b commit-tree 'HEAD^{tree}' -p HEAD -m x` exits `0` and prints a commit id, where any signing attempt would have failed. So commits the wrappers write in the main checkout take its identity but not its signing (residual 7 below), and carrying the signing keys into a clone would sign nothing. Signing would take an explicit `-S`. Whether a commit written with the clone as git's repository can be signed is unmeasured, and a signature that cannot be made fails the commit (`docs/sandbox-verification.md`, row CS11, owed under roadmap item 21).

   Leave the rest of the paragraph unchanged.

This fix edits no test file, so it runs no test. The full suite runs later, in the Run gates phase.
