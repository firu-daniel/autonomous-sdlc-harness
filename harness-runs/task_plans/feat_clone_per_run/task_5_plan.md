### Task 5 — Add `cli/test/clone-sync.test.mjs`: the sync model, the substituted-object refusal, and the fetch's measured pins

**Goal:** Prove that objects reach the main checkout from a clone only through a fetch that rejects a substituted object. Also prove that sync-in refuses whenever the main checkout has the branch checked out, and that sync-out moves only the one ref it names. Then settle by test the two points the task prompt leaves unresolved: which of the clone's own config keys a local-transport fetch honours, and whether any hook, filter or fsmonitor in the clone runs during it.

**Depends on:** Task 2, which adds these to `cli/templates/scripts/lib/harness-run-lib.sh`:

- **`hr_copy_sync_in_var <main> <gitdir> <branch>`.** It is a no-op returning 0 on the `main` and `worktree` arms (`hr_copy_kind`). On a clone:
  - it refuses when `<main>` or any of its linked worktrees has `<branch>` checked out, and when `<main>` has no `refs/heads/<branch>`;
  - it reads the clone's ref, fetches it with no destination under `hr_run_main_git`'s pins (`core.hooksPath=/dev/null`, `core.fsmonitor=false`, `submodule.recurse=false`, `GIT_NO_REPLACE_OBJECTS=1`, `GIT_GRAFT_FILE=/dev/null`) with `--no-tags --no-recurse-submodules` and a pinned `--upload-pack`, and proves the commit arrived with `cat-file -e`;
  - it then fast-forwards `<main>`'s `refs/heads/<branch>` by compare-and-swap, does nothing when they are equal, and refuses when the clone is behind or has diverged;
  - it sets `HR_SYNC_TIP` and `HR_SYNC_REFUSAL`.
- **`hr_copy_sync_out_var <main> <gitdir> <ref> [<expected_old>]`.** A no-op on `main` and `worktree`. On a clone it sets the clone's `<ref>` (`refs/heads/*` or `refs/remotes/origin/*`) to `<main>`'s value. It runs `update-ref` under `GIT_DIR=GIT_COMMON_DIR=<gitdir>`, `GIT_OBJECT_DIRECTORY=<main>/.git/objects` and hooks off, as a compare-and-swap when `<expected_old>` is given.
- **The globals contract, as Task 2 states it.** Neither function reads or writes `HR_RUN_MAIN`, `HR_RUN_TRUSTED_BASE`, `HR_RUN_REFUSAL` or any `HR_RUN_COPY_*` global, and neither calls `hr_run_main_set_var` or `hr_run_main_git`. Each also leaves every `HR_TARGET_*`, `HR_WRAPPER_*` and `HR_COMMIT_*` global as it found it. Each takes its main checkout from its own `<main>` argument alone. On the `clone` arm only, after `hr_copy_kind` has said `clone`, it canonicalizes `<main>` into a local with `hr_run_main_set_var`'s main-checkout predicate: `cd -P` succeeds, and `<main>/.git` is a real directory, not a symbolic link, holding no `commondir`. When the predicate fails, it returns 1 with `HR_SYNC_REFUSAL` set. Every main-side git call then runs through a private runner, `hr_copy_sync_main_git <canonical-main> …`, carrying exactly `hr_run_main_git`'s pins. The only globals either function sets are `HR_SYNC_TIP` (sync-in only) and `HR_SYNC_REFUSAL`, both cleared at entry. So a caller needs no prior `hr_run_main_set_var`, and a call made after the watcher family's globals are seeded leaves them intact.

Clones for the fixture come from Task 3's `hr_clone_create_var <main> <branch> <start>`, which sets `HR_CLONE_DIR` and records `worktree` and `copy_kind=clone` in the registry.

**Where this task stops.** It calls the two functions directly. Some measurement cases deliberately bypass the trust check in order to measure what the fetch itself honours. The trust check's own suite is **Task 4's**, and the wrappers' use of sync is **Task 8's**. This task changes no script. **If a measurement shows a clone-side key or program running under the pins Task 2 chose, stop and report it as a blocker** naming the key and the observed effect. Do not adjust the library from this task.

### Targets

- `cli/test/clone-sync.test.mjs` (new)

**Work:**

- [ ] **Header first.** State the rule:
  - a clone's objects enter the main checkout only through sync-in's fetch, which hashes what it indexes, so a substituted object is rejected and the main checkout's refs are left as they were;
  - sync-in never moves a branch the main checkout has checked out;
  - both halves are no-ops for a worktree and the main checkout.

  Then record the **measured** answers to the two open points, filled in from what the cases below observe, with `git --version` at the time of writing. The header keeps the observed answers as its statement of the rule this suite enforces, and adds one line saying that **the record of the measurement is `docs/cli.md` §6**, which Task 15 writes by transcribing from this header (`.claude/context/conventions.md` → `### Where a new responsibility goes`: a measured fact goes to `docs/` and nowhere else). Give each payload's case a test name Task 15 can cite.
- [ ] **The model on a fixture under the system temp directory**, torn down in process, with the library sourced through `runBash`. The fixture is a main checkout with `harness.config.json`, `autonomous_logs/` and a local bare origin, plus a clone from `hr_clone_create_var`. Cases:
  - (a) A commit made **in the clone** with plain `git commit` is synced in. The main checkout's `refs/heads/<branch>` becomes that commit, and `HR_SYNC_TIP` names it.
  - (b) Equal tips: nothing is written. Snapshot `for-each-ref` and the reflog, and assert both unchanged.
  - (c) The clone is behind the main checkout: refused, with the main checkout's ref unchanged.
  - (d) Diverged tips: refused, naming both short ids.
  - (e) The main checkout has the branch checked out: refused, with its ref unchanged. Then (e2): a linked worktree of the main checkout has it checked out: refused the same way.
  - (f) `hr_copy_sync_out_var` moves only the named clone ref, and a stale `<expected_old>` makes it refuse with the clone's ref unchanged.
  - (g) On a linked worktree and on the main checkout, both functions return 0 and change nothing.
  - (h) **The globals survive.** Seed `HR_RUN_MAIN`, `HR_RUN_TRUSTED_BASE`, `HR_RUN_COPY_TOP`, `HR_RUN_COPY_GITDIR`, `HR_RUN_COPY_BRANCH` and `HR_RUN_COPY_TIP` with sentinel strings, `HR_RUN_MAIN`'s naming a directory other than `<main>`, then call `hr_copy_sync_in_var` and `hr_copy_sync_out_var` on the clone, in one `runBash` shell, with no `hr_run_main_set_var` before them. Both succeed, and every sentinel reads unchanged afterwards. A third call with `HR_RUN_MAIN` unset also succeeds, so neither function needs a caller to set it.
- [ ] **The substituted object.** Write a loose object into the clone's `.git/objects/<xx>/<rest>` under the name of a blob the clone's new commit references, holding a different blob's compressed bytes. Use the method `docs/cli.md` §6 residual 6 describes: a committed blob's loose file overwritten with another blob's compressed bytes under the same name. Choose a blob the main checkout does **not** already hold, so the fetch must send it. Assert:
  - sync-in returns 1;
  - the main checkout's `refs/heads/<branch>` is unchanged;
  - `git -C <main> cat-file -e` of the substituted name fails, or it succeeds with content that hashes to its name. The exact branch is recorded in the header;
  - `git -C <main> fsck --full` reports no hash-path mismatch.
- [ ] **The fetch's measured pins.** Call `hr_copy_sync_in_var` directly, bypassing the trust check, on a clone whose `.git/config` or `.git` holds each payload below. Each payload is a command that touches a marker outside the clone. Record for each whether the marker appears, and whether the main checkout's refs changed. The expected outcome is that no marker appears; any marker is a blocker as stated above:
  - `core.fsmonitor`;
  - `uploadpack.packObjectsHook`;
  - `core.hooksPath` naming a directory holding `pre-upload-pack`, `reference-transaction` and `post-checkout` scripts;
  - a `filter.<x>.clean`/`smudge` pair with a matching `.gitattributes` committed in the clone;
  - `core.sshCommand`;
  - a planted `.git/shallow` and `.git/info/grafts`. For each, record whether the fetch refuses and whether the main checkout's history reads unchanged afterwards (`git -C <main> rev-list --count <tip>` before and after: the two values equal, whatever they are).
- [ ] **The disk property, structurally.** After (a), `find <clone>/.git/objects -type f` lists only files under `info/` and the loose objects the clone's own `git commit` wrote. No pack copied from the main checkout appears, so the store is borrowed. Do not time anything (`harness-runs/lessons.md` → *"A wall-clock figure in a document of record is never one a run measured inside its own session"*).

**Verification:**

- `npm test --workspace cli -- test/clone-sync.test.mjs`, from the repository root, as one plain foreground command. Read the `# tests`, `# pass` and `# fail` counts and the exit status. Every case passes, and `# fail 0`.
- The header's measured-answers paragraph names every payload in the pins bullet, with its observed outcome and the `git --version` it was taken on, and carries the line naming `docs/cli.md` §6 as the record.
- Mutate once by hand, then revert, with `git diff` clean afterwards. In the library, drop the checked-out refusal. Case (e) must then fail. Separately, make `hr_copy_sync_in_var` call `hr_run_main_set_var` on its `<main>`. Case (h) must then fail.
