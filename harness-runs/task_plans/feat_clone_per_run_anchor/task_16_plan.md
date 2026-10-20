### Task 16 — State in `docs/watcher.md` how the anchor is set, read and graded, and what a session no launcher started resolves

**Goal:** Make `docs/watcher.md`, the outer loop's document of record, say where the main checkout comes from now. The watcher places it from its own location. It hands it to every session it launches as `HARNESS_MAIN_REPO`. The plugin's readers read it with a bare `printenv HARNESS_MAIN_REPO`, then fall back to the first `git worktree list` entry. `doctor` grades the profile rule the read needs. And no outer-loop script reads it.

**Depends on:**

- **Task 3**, the export: `export HARNESS_MAIN_REPO="$MAIN_REPO"` inside `spawn_engine`'s engine subshell, set unconditionally, so an inherited value is overwritten. `remote-run.sh`'s mention session is deliberately left unset, because it runs `--tools Read,Grep,Glob` and no command.
- **Task 1**, the profile rule `Bash(printenv HARNESS_MAIN_REPO)` and its owner `cli/src/core/mainRepoAnchor.ts`.
- **Task 2**, the `doctor` check `profile-main-anchor`, which warns when the rule is missing from `allow` or sits in `ask` or `deny`, and never fails.
- **Task 7**, `hc_main_root`'s anchor-first arm for the QA-lock helpers.
- **Tasks 8–13**, the plugin's resolution row and clause: *"the path a bare `printenv HARNESS_MAIN_REPO` prints, else the first `worktree ` line of a bare `git worktree list --porcelain`"*.

**Where this task stops.** `docs/cli.md` is **Task 17's**. The owed measurement is **Task 15's** rows AN1–AN4, which this document cites rather than restates. The section's wording elsewhere ("working copy", "run's copy") is not in the task prompt's wording scope, and stays.

### Targets

- `docs/watcher.md` — §1 steps 1 and 6, and one new subsection at the end of `## 2. The scripts`.

**Work:**

- [ ] **§1 step 1.** Replace *"`<MAIN_REPO>` is the first working copy `git worktree list` reports"* with a sentence saying `<MAIN_REPO>` is the main checkout. The watcher places it from its own location, and hands it to every session it launches as `HARNESS_MAIN_REPO` (§2, the new subsection). The rest of the step stays byte for byte.
- [ ] **§1 step 6.** After *"run with the generated permission profile through `--settings`"*, add one clause: with `HARNESS_MAIN_REPO` set to the main checkout in the session's environment.
- [ ] **New subsection `### The main-checkout anchor`, at the end of §2,** after `### Where the family runs git in a run's copy, and under what pins`. That heading is cited by `docs/remote-execution.md` and stays byte for byte. Five short paragraphs:
  - **Set.** `spawn_engine` exports `HARNESS_MAIN_REPO` in the engine subshell only, for every local launch, resume and `job`-mode run. Name the one other agent launch, `remote-run.sh`'s mention session, and why it carries none.
  - **Read.** The plugin's readers use the bare `printenv HARNESS_MAIN_REPO`, which the profile allow-lists, and take the first `worktree ` line of `git worktree list --porcelain` when it prints no path. The QA-lock helpers read it through `hc_main_root` when it names a main checkout. A sandboxed command cannot change it for a later call. Cite `docs/sandbox-verification.md` rows AN1–AN4, owed.
  - **Not read.** The excluded wrappers and every script the watcher runs never read it. They place the main checkout from their own location, because an assignment prefix on an excluded call could set the variable.
  - **Graded.** `doctor`'s `profile-main-anchor` (`docs/cli.md` §7).
  - **A session no launcher started.** A supervised session, a by-hand `claude` in a run copy, or one whose profile lacks the rule resolves the fallback. That is the main checkout from the main checkout or from a linked worktree, exactly as before. In a clone it is the clone itself, so a by-hand session in a clone must export `HARNESS_MAIN_REPO` first. Show that export as a command in its own fenced block, one command per line (`harness-runs/lessons.md` → *"Every command an adopter is meant to run sits in a fenced block"*). State that no launcher creates a clone yet.

**Verification:**

- `grep -n 'HARNESS_MAIN_REPO\|profile-main-anchor' docs/watcher.md` shows the variable named in §1 and in the new subsection, and the check id in the new subsection.
- `grep -n 'first working copy `git worktree list` reports' docs/watcher.md` prints nothing.
- `grep -n '^### Where the family runs git in a run.s copy, and under what pins$' docs/watcher.md` still matches: the cited heading is unchanged.
- Every claim in the new subsection names the file or check it rests on. Read each one against Tasks 1, 2, 3 and 7's landed code before committing, and correct the prose where the code differs.
