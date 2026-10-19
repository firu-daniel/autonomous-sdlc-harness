### Task 10 — Add goal 1's owed measurement rows and the commit-wrapper rows to `docs/sandbox-verification.md`, and the owed note to `docs/outer-loop-verification.md`

**Goal:** Record goal 1's candidate measurements and the commit wrapper's new behaviour as rows in the standing sandbox record, each with an exact procedure, so a person can run them and fill in the cells. Point the record's own failure row and headline at this branch's route. Mark the outer-loop record's §1.1 as owed against the rebuilt wrapper. The run cannot take these measurements itself, as the story index's `## Context` explains. This task writes procedures and owed markers; it never writes an Observed cell.

**Depends on:** Tasks 1 and 4.

- **Task 1** rebuilt `commit-on-branch.sh`. Its contract is: target, `config.worktree` and hooks-pin checks before any git call; branch and protected set from the main checkout; a plumbing commit against `<main>/.git` that borrows only the record's `index`; no commit hook; exits 0/1/2/3 and the stdout line unchanged.
- **Task 4** added `bash <main>/scripts/commit-on-branch.sh:*` to `sandbox.excludedCommands`.

The rows' launch line is the one `docs/sandbox-verification.md` → `## 0. Method` already gives, and it is not restated.

### Targets

- `docs/sandbox-verification.md`
- `docs/outer-loop-verification.md`

**Work:**

- [ ] **`docs/sandbox-verification.md` §2, after G3: four owed rows, G4–G7, one per goal-1 candidate.** Each has its Check and Expected cells and the procedure to take it, `not run — owed` in Observed and Verdict, and a note that the cells are filled by a person under §0's method, with `claude --version` recorded.
  - **G4**: G1's `git add` probe taken again on the installed Claude Code, which is 2.1.303 on this machine as of 2026-10-19. The real regenerated profile, cwd = a linked worktree, one exact call. Controls: `git branch <x>` and a new file in `<main>/.git` in the same session. Also a `dd` to a new file directly in the record and to the record's existing `index`. That separates a per-file deny from a closed directory.
  - **G5**: the launch-line candidate. The session's cwd is the main checkout, with `--add-dir <worktree>`. The probe is `git -C <worktree> add <file>` (through `--allowedTools`, since the profile has no `git -C` allow rule). State in the row that a run launched this way would resolve the main checkout from a bare `git rev-parse --show-toplevel`. The cost is therefore every checkout-root resolution in the plugin, whatever the result.
  - **G6**: the relocated-record candidates, (a) and (b). (a) is a per-run clone whose git dir sits inside its own working tree (`git clone --no-hardlinks <main> <dir>`), probed with `git add` and `git commit` from a session whose cwd is that clone. (b) is a `git worktree add` record moved into the worktree, with its `.git` pointer and `gitdir` rewritten, recording what `git worktree list` and the wrappers' target check then say.
  - **G7**: what the sandbox does with the cwd's git common dir. Take a `--debug` session from a worktree and quote the write allow and deny entries the runtime adds for `<main>/.git` and for `<main>/.git/worktrees/<name>/`. A reading of 2.1.303's bundled code suggests it grants the common dir and denies only `config.worktree`, its lock and `commondir` per record. Mark that a lead to confirm, not a finding.
- [ ] **`docs/sandbox-verification.md`: a new §3 block for the commit wrapper, rows CW1–CW6, all `not run — owed`.** Model them on the P/R/C/K rows, and judge each by refs and `git status`, never by the message alone.
  - CW1: `bash <main>/scripts/commit-on-branch.sh --repo <worktree> <file> -- "<subject>"` from a sandboxed session. It runs outside the sandbox, the branch moves, and `git -C <worktree> status --porcelain` is empty.
  - CW2: the worktree's own `bash scripts/commit-on-branch.sh` stays sandboxed and fails on the record.
  - CW3: a scratch repository as `--repo` is refused before git runs.
  - CW4: a planted `config.worktree` key is refused.
  - CW5: a compound `bash <main>/scripts/commit-on-branch.sh …; <a second allow-listed command>` stays sandboxed.
  - CW6: an assignment prefix, `GIT_DIR=<x> bash <main>/scripts/commit-on-branch.sh …`, stays sandboxed, or, if it is excluded, `hr_git_env_drop` neutralises it.
- [ ] **`docs/sandbox-verification.md`: the rows that point at this work.**
  - In the headline bullet *"No sandboxed git call in a linked worktree can write that worktree's record"*, add that runs now commit through the excluded main-checkout `commit-on-branch.sh` (`fix_sandbox_worktree_record_writes`), with CW1–CW6 owed.
  - Set row F1's Follow-up cell to name this branch and its route, and list G4–G7 and CW1–CW6 as owed.
  - Above the §2 table, add a note that G1 and G3 are owed a re-run on a profile carrying the third excluded entry. Under the wrapper route, G1's raw `git add` is still expected to fail sandboxed, and G3 is expected to get past its first commit and then stop at Run gates while F2 is open.
  - In **Who reads this:**, name the three excluded wrappers.
  - Leave every measured cell of G1, G2, G3, WR1–WR7 and F3 as it is.
  - Write no sentence that commits the project to replacing the route if G4–G7 find an opening. That is the maintainer's decision (`harness-runs/lessons.md` → *"A decision rule's outcome is a proposal to the maintainer, not a settled future"*).
- [ ] **`docs/outer-loop-verification.md`:**
  - Directly under `### 1.1 \`commit-on-branch.sh\` — refuses **loudly**`, add a note that the table's eleven rows are owed a re-drive against the rebuilt wrapper, with the main checkout and then a linked worktree as the target. The heading must stay byte-identical: `docs/retrieval-eval-results.md` links its anchor. Give the note the names of the two suites that assert the same rows automatically, `cli/test/commit-on-branch-target-check.test.mjs` and `cli/test/commit-on-branch-plumbing.test.mjs`.
  - The stale-count paragraph says *"The other two — `commit-on-branch.sh`, `setup-worktree.sh` — have comment-only diffs since the stamp"*, which is no longer true of `commit-on-branch.sh`. Follow that document's own rule (*"re-run the recipe rather than editing the number"*): add a sentence saying the commit wrapper's mechanism moved on this branch and §1.1 is owed, rather than editing the count.

**Verification:**

- `grep -n -E '^\| (G[4-7]|CW[1-6]) \|' docs/sandbox-verification.md` shows each new row once, and every one of them has `not run` in its Verdict cell.
- `grep -n -F '### 1.1 \`commit-on-branch.sh\` — refuses **loudly**' docs/outer-loop-verification.md` still matches: the anchor `docs/retrieval-eval-results.md` cites is intact.
- Re-run the story index's derivation entry C: `grep -n -E '^(\| [A-Z][A-Z]*[0-9]|- ).*(excludedCommands|excluded|worktrees/|record|commit-on-branch)' docs/sandbox-verification.md`. Every row it now prints is a register row or one of this task's new rows, G4–G7 and CW1–CW6.
- Each new row's procedure names its launch line by reference to §0, the exact command probed, and its positive control (`.claude/context/conventions.md` → `## Documents of record`: *"A measured fact states what was measured, the command and the exact message"*). The owed rows say plainly that the measurement has not been taken yet.
