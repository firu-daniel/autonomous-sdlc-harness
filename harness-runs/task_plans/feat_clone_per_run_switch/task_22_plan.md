### Task 22 — Restate `docs/cli.md` §6 and §7: the new write protection, the per-run profile and its launch check, the job settlement, and the residuals closed and opened

**Goal:** `docs/cli.md` §6, the failure modes the permission profile encodes, and §7, `doctor`, describe the profile and the checks as this branch leaves them. That means:
- the main checkout's whole `.git` write-denied;
- the sibling-glob `.git` entry narrowed to the six clone paths;
- the per-run profile with its exact entries and launch check;
- the remote job's settlement;
- the clone-first sync;
- the residuals this branch closes removed, and the ones it opens added, the alternates residual among them;
- `doctor`'s new report.

**Depends on:**
- **Task 5.** The base profile protects `<main>/.git` as one `directory` entry, replacing the per-file `.git/config`, `config.worktree`, `commondir`, `hooks`, the worktree-record entries and `remotes` / `branches`. Under the sibling glob it protects `.git/config` (`file`), `.git/hooks` (`directory`), `.git/objects/info/alternates` (`file`) and `.git/commondir`, `.git/config.worktree`, `.git/objects/info/http-alternates` (`entry`), and no longer `<glob>/.git`.
- **Task 13.** The per-run profile at `<lane dir>/run-profiles/<slug>/<branch>.json` adds the run copy's exact paths and every other live worktree's pointer. The launch check is described in the story index's `## Context`, part 2.
- **Tasks 13 and 26, job mode.** A job renders no per-run copy and writes nothing under the machine lane. It runs the same launch check on the base profile and passes the base profile unchanged as `--settings`, because the lane is off in a job (`autonomous-watcher.sh` → header *JOB MODE*) and a job copy would equal the base: the copy is the main checkout, with no other linked worktree. A base that fails the check launches nothing, and the job records `failed`.
- **Task 6.** `doctor`'s `profile-write-protection` warns (fails under `--remote-job`) on a profile still carrying the retired `<glob>/.git` entry. The `worktrees` check keeps its id with a restated title.
- **Tasks 1 and 4,** for the sync order and the heal, as Task 21's `**Depends on:**` states them.
- **The job settlement.** A job session's cwd is the main checkout and its `.git` is write-denied. The flows issue no sandboxed git write: commits and pushes go through the excluded wrappers, reverts use the file tool, `git restore` / `git checkout` sit in `ask`, and `git status`'s index refresh fails silently.

### Targets

- `docs/cli.md`

**Work:**

- [ ] **§6 → `### The sandbox block and the permission mode`, the three-wrappers and target-check paragraphs.**
  - Replace *"No shipped script creates a clone yet: every run still executes in a linked worktree"* with the clone layout and its creator.
  - Restate *"sync-in, operate, sync-out"* as the clone-first swap with rollback, the heal, and `push-branch.sh`'s pre-push check.
  - Restate the exit-contract sentences: `commit-on-branch.sh`'s landed exit `1` now also covers a clone ahead of the main checkout, and `refresh-branch.sh`'s exit `5` covers a failed rollback.
- [ ] **§6, the paragraph *"Everything that runs outside the sandbox is write-protected on both sides"*.**
  - Rewrite the `.git` half of the list: the whole `<main>/.git`, the six glob paths with why each, and that the old glob `.git` entry closed a clone's git to its own sandboxed git (CL1–CL4).
  - Add the per-run profile: what it adds, where it lives and why there, and the launch check with what it refuses.
  - Add the residual the check leaves: the copy is only as valid as the base. A settings file that fails validation is silently ignored under `-p` (Claude Code 2.1.304 `--help`), so an invalid base starts unsandboxed. Point at Task 23's row.
  - Add the job settlement as its own paragraph. Include that a job's `--settings` is the base profile, checked at launch, with no per-run copy, and why.
- [ ] **§6 residuals.**
  - **Remove** residual 1.6, the object store a run's copy shares being sandbox-writable. It is closed for every run: the main checkout's `.git` is write-denied as a whole, and a clone's objects reach it only through sync-in's hashing fetch. A legacy worktree run's sandboxed git could not write the store either (`docs/sandbox-verification.md` G1).
  - In residual 1.5, restate the bullet that says *"The trusted configuration is read through the object store item 6 describes"*: the job's profile now write-denies the checkout's whole `.git`, so the session can no longer substitute that loose object.
  - **Remove** the record-race parts of residual 1.3 and residual 2 for every clone run. A clone has no record outside its own `.git`.
  - **Restate** in one sentence that a legacy worktree run keeps both until it finishes.
  - **Add** these residuals:
    - **Alternates:** the main checkout's `gc` can prune an object that only a clone's own reflog or stash references. A sandboxed read of it in the clone then fails, and no wrapper reads it. Dissociation is not used because it copies the whole history.
    - **The clone's `info/`, `shallow` and other `.git` files** stay sandbox-writable. What reads each, and why none runs code unsandboxed.
    - **Main-checkout lag,** pointing at `docs/watcher.md` §2.
    - **The per-run profile's base-validity residual.**
  - Update residual 2's list of globbed entries to the new set. In *"Which configurable phases run under the sandbox"*, state that `docs`, `parity` and `qa` run in a clone exactly as the list says, since the copy kind changes none of them (`harness-runs/lessons.md` → *"A new execution environment must state, for every configurable phase, whether that phase runs there"*).
- [ ] **§7, `doctor`:**
  - Restate the `worktrees` row's title to Task 6's.
  - Extend the `profile-write-protection` entry: it reports a profile still carrying the retired `<glob>/.git` entry, by path and side, why that is stale and not merely extra, and `init --force` as the remedy.
  - Say that `doctor` grades the base profile, and the watcher grades each per-run copy at launch.
- [ ] Re-run the story index's derivation entries A–D against this file (entry A as widened in revision round 1). Confirm every hit is either a sentence this task wrote and means, or a sentence that stays true after this branch and that the implementer's return names. One such sentence is §7's `permission-profile` row (*"in a linked worktree, the main checkout's profile"*), which describes `doctor` run from a linked worktree; that is unchanged. Cite every anchor by heading, symbol or quoted text, never by line number. State each measured fact with what was measured, the command and the version.

**Verification:**

- `git grep -nE 'No shipped script creates a clone|every run still executes in a linked worktree|which every run does today' -- docs/cli.md` prints nothing.
- The §6 residual list is numbered consecutively after the removals, and every reference to a residual number (`residual 1`, `residual 2`, …) inside `docs/cli.md` points at the item it means. `docs/watcher.md` cites these residuals by quoted text, not by number (Task 21), so it needs no edit here.
