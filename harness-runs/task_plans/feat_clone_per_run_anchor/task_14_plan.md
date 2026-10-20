### Task 14 — Prove the QA-lock helpers follow the anchor from a clone and fall back without it, in `cli/test/qa-user-locks.test.mjs`

**Goal:** Prove behaviourally the arm Task 7 added to `hc_main_root`. A reserve issued in a `git clone --shared` of the main checkout, with `HARNESS_MAIN_REPO` naming that main checkout, lands in the **main** checkout's lock set, and a release from the main checkout frees it. Without the variable, or with one that names no main checkout, every answer is today's.

**Depends on:**

- **Task 7**, which makes `hc_main_root` (`plugin/hooks/lib/harness-config-lib.sh`) read `${HARNESS_MAIN_REPO-}` first. It takes the value only when it is non-empty, absolute, a directory, and its `.git` is a directory holding no `commondir`, and then prints its `pwd -P`. Anything else falls through to the unchanged `git rev-parse --git-common-dir` answer. `reserve-qa-user.sh` and `release-qa-user.sh` place their lock set at `<that main>/<stateDir>/qa_user_locks/`, `stateDir` read from that main checkout's configuration.
- **Task 4**, which blanks the variable in `cli/test/helpers/fixture.mjs` → `ISOLATED_ENV`, so the existing cases run unaffected by a parent's value. Each new case passes the variable explicitly through `runBash`'s `env` argument, applied over `ISOLATED_ENV`, and only ever names a fixture's own directory.

**Why this task sits after the `plugin` tasks.** It is a `cli`-layer file, and it tests a `plugin`-layer change, so it ships after Task 7 rather than in the `cli` block. No task may depend on a later one.

**Where this task stops.** It changes no script. Only `cli/test/qa-user-locks.test.mjs` changes.

### Targets

- `cli/test/qa-user-locks.test.mjs` — new cases, a clone fixture helper, and the header.

**Work:**

- [ ] **A clone beside the existing fixture.** Add a helper that runs `git clone --shared <main> <dir>` under the same `mkdtemp` root the file's existing main-plus-worktree fixture uses, through `runGit` from `./helpers/fixture.mjs`, and torn down with it. Rewrite the clone's working-tree `harness.config.json` to name a `stateDir` different from the main checkout's, so a lock that lands in the clone's own state directory fails the location assertion by name. That is the same device the worktree half of the fixture already uses.
- [ ] **The new cases.** Import `MAIN_REPO_ANCHOR_VARIABLE` from `../dist/core/mainRepoAnchor.js`, and use it as the key of every `env` object below.
  - **(a) Anchor from a clone.** Run `reserve-qa-user.sh` with the clone as the working directory and `{ [MAIN_REPO_ANCHOR_VARIABLE]: <main> }`. It exits 0 and prints only a slot number, and the lock exists under `<main>/<main's stateDir>/qa_user_locks/`, not under the clone's. Then `release-qa-user.sh <slot>` from the main checkout, with no anchor, exits 0 and removes it.
  - **(b) No anchor in a clone.** The same reserve with the variable blank lands under the clone's own state directory. That is today's answer, recorded so the fallback is visible.
  - **(c) An anchor that names no main checkout.** Set the variable to a plain temp directory with no `.git`, from the existing linked worktree. The reserve lands under the main checkout's lock set exactly as the existing worktree case does: the anchor is ignored and the common-dir answer stands.
  - **(d) A relative anchor.** A value that is not absolute is ignored the same way.
- [ ] **The header.** Extend the rule paragraph by one sentence: the lock set's main checkout is the anchor when the launcher set one that names a main checkout, else the common-dir answer. Add (b) to what the file states about a clone, and keep the **Not covered** paragraph true.

**Verification:**

- `npm test --workspace cli -- test/qa-user-locks.test.mjs`, from the repository root as one plain foreground command. Read the `# tests`, `# pass` and `# fail` counts and the exit status: every case passes, the pre-existing ones included, `# fail 0`.
- `bash scripts/typecheck.sh` exits 0.
- `grep -n "HARNESS_MAIN_REPO" cli/test/qa-user-locks.test.mjs` prints nothing: the name arrives through the import.

- **Deviations from plan:** The file's existing cases already carry the labels (a)–(d), so the plan's new cases (a)–(d) are titled (e)–(h) in the file: (e) anchor from a clone, (f) no anchor in a clone, (g) an anchor naming no main checkout, (h) a relative anchor. Case (h) uses the value `../clone` from the linked worktree — a relative path that does resolve to a real main checkout (the fixture's clone) from that working directory — so honouring it would land the lock in the clone's state directory and fail by name; the plan only required a non-absolute value.
