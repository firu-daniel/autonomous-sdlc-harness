### Task 2 — Record the commit-identity measurement and the identity, signing and consistency decisions in the docs

**Goal:** Put the decisions of record where this tree keeps them, which is `docs/` and nowhere else (`.claude/context/conventions.md` → `### Where a new responsibility goes`). Three things go in:
- the PR #126 measurement, beside the clone-layout rows;
- the owed rows that would confirm the fix and reopen the signing decision;
- in the clone-arm paragraph of `docs/cli.md`, the statement that the allow-list now mirrors the main checkout's identity and why the signing keys do not travel, plus why the per-run profile and `doctor` need no change.

**Depends on:** Task 1, which ships the behaviour this task describes. Task 1 makes these changes in `cli/templates/scripts/lib/harness-run-lib.sh`:
- `hr_clone_config_spec` lists `user.name` and `user.email` as `=<value>` rules at the main checkout's exact `.git/config` values, only when that file sets them (non-empty, read with `--file`, so an `include` / `includeIf` identity is not seen);
- `hr_clone_create_var` writes them into each new clone;
- `hr_clone_config_check_var` still requires neither, refuses a different value, and refuses every signing key (`user.signingkey`, `commit.gpgsign`, `gpg.format`, `gpg.program`, `gpg.<format>.program`, `gpg.ssh.defaultKeyCommand`) as off-list;
- a main checkout whose identity changes while a clone is live gets that clone refused until it is recreated.

The library headers Task 1 wrote state each of these decisions in full. Cite them as the code of record (`cli/templates/scripts/lib/harness-run-lib.sh` → `hr_clone_config_spec`). Do not restate their rationale at length. This task changes no code.

**How this task's implementer reads the conventions.** This is the catch-all layer, so read `.claude/context/conventions.md` → `## Documents of record` in particular. A measured fact states what was measured, the command and the exact message. A deferral cites a numbered roadmap item that owns a row in `docs/development.md` → `## 6. The roadmap this tree defers to`; item 21 is the one cited here. **No account name and no email appear anywhere.** The two identities are "the main checkout's identity" and "the global one" (task prompt, last constraint).

### Targets

- `docs/sandbox-verification.md`: `### The clone layout (owed)`.
- `docs/cli.md`: the clone-arm paragraph opening "**The excluded rule's `:*` accepts any argument**".

**Work:**

- [ ] **`docs/sandbox-verification.md` → `### The clone layout (owed)`, the measurement.** Beside the CS rows, add a dated block headed so that it reads as a measurement, not an owed row (for example **Commit identity on a clone (measured 2026-10-21)**). It records what the task prompt measured on `fix_run_gates_sandbox_tmpdir` (PR #126):
  - The main checkout's `.git/config` sets `user.name` / `user.email` to one identity, and the global `~/.gitconfig` names another.
  - `git log --format='%an <%ae> | %cn <%ce>' origin/dev..HEAD` on that branch printed 23 lines, each naming the global identity as author and committer. Quote the command; describe the output by shape, with the identities redacted as the task prompt requires.
  - The push used the remote's own SSH key, so only the author text was wrong.
  - The cause is the allow-list's lack of any `user.*` key. Cite `hr_clone_config_spec`.
  - A legacy worktree run shares the main checkout's `.git/config`, which is why it began with the clone layout.
  - The same omission surfaced once before, unflagged: `feat_clone_per_run_switch` Task 28's deviation note, where a test clone's push was refused because `user.email` was set in its `.git/config`.
- [ ] **The same section, two owed rows and the opening sentence.** Append two rows to the CS table, numbered after the last CS row, in the table's own `| # | Check | Expected | Observed | Verdict |` shape, with `Observed` / `Verdict` left owed like CS1–CS9:
  - **(i) The fix on a real run.** After the story's re-render, a run's commit written with the clone as git's repository names the main checkout's identity as author and committer. Read it with the same `git log --format=…` command over the run's commits. A main checkout that sets no identity gives the global one.
  - **(ii) The measurement that would reopen the signing decision.** It runs inside a session launched with the section's own launch line, with cwd = `<clone>`, against a throwaway branch. Make one `git commit-tree` with `-c commit.gpgsign=true` plus the main checkout's own `gpg.format` and `user.signingkey`, given as `-c` so nothing is written to `.git/config`. Record whether a signature is produced or the commit fails, with the message quoted. Cite roadmap item 21 as the item this measurement belongs to.
  
  Then update the section's opening sentence ("CS1–CS9 are owed measurements, not results: none has been taken") so that its range covers the new rows, and so that it says the dated identity block is a measurement and the one exception.
- [ ] **`docs/cli.md`, the clone-arm paragraph.** After "its `.git/config` holds only the allow-list `hr_clone_config_spec` states, which is also the set a clone's creator writes", add the following sentences:
  - **Identity:** the list also holds `user.name` and `user.email` at the main checkout's exact values, only when its `.git/config` sets them. They are optional, so an older clone passes, and a different value is refused. A main checkout with neither leaves the clone on the global identity.
  - **Signing:** the signing keys, data and program alike, are deliberately not on the list. A failed signature fails the commit, and whether a commit written with the clone as git's repository can be signed is unmeasured (the new owed row). Commits the wrappers write in the main checkout already take its identity and signing (residual 7 in this file's §6). If signing is carried later, a program key travels only as the main checkout's exact value, as a trust decision naming that file as the trusted source.
  - **Consistency:** neither the per-run profile nor `doctor` reads the key list. The profile write-protects `<clone>/.git/config` as one file (`autonomous-watcher.sh` → `RUN_PROFILE_COPY_GIT_PATHS`), and `doctor` has no clone-configuration check, so the widened list changes neither.
  
  Keep the paragraph's citation style: a function or symbol anchor, never a line number.

**Verification:**

- Re-run the story index's `## Scope register` derivation entries A–D verbatim. Every site they reach is a register row, and the only edited sites are rows 1 and 8. A new hit the edits introduce, such as `user.name` in the new text, must sit inside those two sites.
- `git diff -- docs/sandbox-verification.md docs/cli.md` shows added lines with no `@` and no personal name: neither the main checkout's identity nor the global one appears, only those two phrases.
- Every citation the new text makes resolves. `git grep -n 'hr_clone_config_spec' -- cli/templates/scripts/lib/harness-run-lib.sh` finds the function and the header text Task 1 wrote. `git grep -n 'RUN_PROFILE_COPY_GIT_PATHS' -- cli/templates/scripts/autonomous-watcher.sh` finds the declaration. `docs/development.md` → `## 6. The roadmap this tree defers to` holds a row for item 21.
- The new CS rows keep the table's five-column shape, and the section's opening sentence names a range matching the rows that are actually there.

- **Deviations from plan:** The plan's signing row (ii) specified `git commit-tree` with `-c commit.gpgsign=true`. `commit-tree` ignores `commit.gpgsign`, so that call would always write an unsigned commit and the row could never observe a signing failure. Measured in a throwaway repository under the session scratchpad, git 2.50.1 (Apple Git-155): `git -c commit.gpgsign=true -c gpg.program=false -c user.name=a -c user.email=… commit-tree <empty tree> -m t` exited 0 and printed a commit id, while the same `-c` set on `git commit --allow-empty -q -m t` printed `error: gpg failed to sign the data:` / `fatal: failed to write commit object` and exited 128. Implemented row CS11 as `git -c gpg.format=<format> -c user.signingkey=<key> commit-tree -S HEAD^{tree} -p HEAD -m "<subject>"`, keeping the `-c`-only, no-`.git/config`-write form, with one clause in the row saying why `-S` replaces `commit.gpgsign`.
