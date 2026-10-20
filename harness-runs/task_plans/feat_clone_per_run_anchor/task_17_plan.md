### Task 17 — State the anchor's allow rule, its `doctor` check and the suite's isolation in `docs/cli.md`

**Goal:** Make `docs/cli.md`, the CLI's document of record, say three things:

- what the generated profile now allows for the main-checkout anchor, and why it is one exact rule;
- what the new `doctor` check `profile-main-anchor` asks and how it grades;
- how the suite keeps a launcher-set anchor from reaching its subprocesses.

**Depends on:**

- **Task 1** — `cli/src/core/mainRepoAnchor.ts` owns `MAIN_REPO_ANCHOR_VARIABLE` (`HARNESS_MAIN_REPO`), `MAIN_REPO_ANCHOR_READ` (`printenv HARNESS_MAIN_REPO`) and `MAIN_REPO_ANCHOR_RULE` (`Bash(printenv HARNESS_MAIN_REPO)`). `renderProfile` appends the rule to `permissions.allow` and one `_README` line, after the fragments.
- **Task 2** — `profile-main-anchor`, inserted after `profile-deny-floor`. It is unevaluated without a profile, a pass when `allow` carries the rule, and a warn when the rule is missing from `allow` or present in `ask` or `deny`. **It never fails, `--remote-job` included**, because a job's checkout is its own main checkout and the fallback answers the same directory.
- **Task 4** — `cli/test/helpers/fixture.mjs` → `ISOLATED_ENV` blanks the variable. Every suite's own `process.env` spread blanks it too, and `cli/test/main-anchor-isolation.test.mjs` proves the runners hand a child an empty value and source-guards the spreads.

**Where this task stops.** The watcher's side — the export, the readers, a session no launcher started — is `docs/watcher.md`'s, **Task 16's**. This document cites it rather than restating it. The owed sandbox rows are **Task 15's**.

### Targets

- `docs/cli.md` — §6, §7 (the check table, and the grading bullets beside `profile-deny-floor`'s), §10.

**Work:**

- [ ] **§6 `## 6. The failure modes the permission profile encodes`.** Add one bullet after the existing shape bullets: **The main-checkout anchor's read is one exact rule.**
  - The plugin's readers find the main checkout with a bare `printenv HARNESS_MAIN_REPO`, which the watcher sets for every session it launches.
  - The profile allows that string and nothing wider, a rule with no `:*`.
  - Without the rule the read is refused and each reader falls back to the first `git worktree list` entry, correct in a main checkout or a linked worktree.
  - The rule's owner is `cli/src/core/mainRepoAnchor.ts`.

  Cite `docs/watcher.md` → `### The main-checkout anchor`.
- [ ] **§7 the check table.** Add the row `| \`profile-main-anchor\` | the permission profile allow-lists the read of the main-checkout anchor |` directly after `profile-deny-floor`'s row, matching Task 2's title.
- [ ] **§7 the grading bullets.** Beside **`profile-deny-floor` is a warning**, add **`profile-main-anchor` is a warning, and never a failure**, giving the reason above and naming the remedy: the printed rule, or `init --force` after a `.bak`. Say that `--remote-job` does not upgrade it, and why.
- [ ] **§10 `## 10. How this is tested`.** Add one bullet to the harness choices, after the git-configuration bullet: **The main-checkout anchor is blanked.** The watcher exports `HARNESS_MAIN_REPO` to every session, gate runs included. `ISOLATED_ENV` therefore blanks it, as it blanks `HARNESS_GITHUB_DEFAULT_COMMIT`, and so does every suite that builds its own environment. A case whose subject is the anchor sets it explicitly, to a fixture's own directory. Name `cli/test/main-anchor-isolation.test.mjs`. The lead-in sentence counts those choices; update its number to the bullets that now follow it.

**Verification:**

- `grep -n 'profile-main-anchor' docs/cli.md` shows the table row and the grading bullet. `grep -n 'printenv HARNESS_MAIN_REPO' docs/cli.md` shows the §6 bullet.
- The §7 table row's text equals the `title` string of `PROFILE_MAIN_ANCHOR_CHECK` in `cli/src/doctor/checks.ts`. Compare the two by reading both.
- The §10 lead-in sentence's count of choices equals the number of bullets directly under it. Count them after the edit.
- `grep -rn '/Users/\|/home/' docs/cli.md` finds no line this task added.
