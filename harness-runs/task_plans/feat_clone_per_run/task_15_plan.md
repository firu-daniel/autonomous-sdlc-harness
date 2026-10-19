### Task 15 — Describe the wrappers' clone arm, the registry protection and the object-store residual in `docs/cli.md` §6

**Goal:** Bring `docs/cli.md` §6's description of the excluded wrappers' target check, of the write-protected set and of the two affected residuals up to what Tasks 1–13 shipped. The clone arm is described as **present and tested, and created by nothing yet**.

**Depends on:** these tasks, which shipped the facts this document states:

- **Task 1** — `hr_wrapper_target_check_var`'s clone arm. It is taken when the target's `.git` is a real directory, and accepts only when the run registry at `<main>/<stateDir>/autonomous_logs/registry.json` records `copy_kind=clone` and `worktree=<target>` for the branch the clone's `HEAD` names, read without creating the file. The remaining conditions are:
  - the target is `hr_worktree_dir <main> <branch>`;
  - its `.git` holds no `commondir`, `config.worktree` or `objects/info/http-alternates`;
  - `objects/info/alternates` names `<main>/.git/objects` only;
  - its `.git/config` holds only the allow-list `hr_clone_config_spec` states, which is also what the creator writes.

  A refusal names a key, never a value. A scratch repository is refused with today's sentence plus an appended clause.
- **Tasks 2 and 9** — the model:
  - sync-in: the main checkout fetches the clone's `refs/heads/<branch>` (index-pack hashes what it receives), fast-forward only, refusing a branch the main checkout has checked out;
  - operate: the unchanged operation in the main checkout, borrowing `<clone>/.git/index` and the working tree;
  - sync-out: `update-ref` of the clone's ref with `GIT_OBJECT_DIRECTORY` pinned to the main checkout's store.

  The exit contracts and stdout lines are unchanged. Exit 5 now also covers a failed sync-out in `refresh-branch.sh`, and the commit wrapper reports a failed sync-out as exit 1 with the commit standing.
- **Task 3** — creation (`git clone --shared`, never `--local` hardlinks), the second-copy refusal, rollback, and the guarded removal, in the library only. `create-worktree.sh` does not call them.
- **Task 5** — the measured answers on which clone-side keys and programs a local fetch honours, stated in `cli/test/clone-sync.test.mjs`'s header as the rule that suite enforces. That header is the **source you transcribe from**, not the record: `.claude/context/conventions.md` → `### Where a new responsibility goes` gives a measured fact to `docs/` and nowhere else, so this task writes the record (the **Record the measured fetch pins.** bullet below). Read the header before writing; this plan does not know the outcomes and states none.
- **Task 12** — the registry in `protectedPaths` as a `file` entry, excluded from `jobSurfacePaths`.
- **Task 14** — rows CL1–CL5 and the owed rows RG1 and RG2 in `docs/sandbox-verification.md`.

**Where this task stops.** `docs/watcher.md` §2 is **Task 16's**. §7's `doctor` rows grade `protectedPaths` generically and need no edit. No sentence here schedules the layout switch or names it as pending work (`harness-runs/lessons.md` → *"A decision rule's outcome is a proposal to the maintainer"*).

### Targets

- `docs/cli.md` — §6 only.

**Work:**

- [ ] **The target-check paragraph** (it opens *"The excluded rule's `:*` accepts any argument, so all three wrappers check their target before any git call"*):
  - After the worktree conditions, add the clone arm's conditions as above, with the reason the planted-file refusals are load-bearing: the runtime leaves a clone's `objects/info/`, `info/` and new top-level `.git` files sandbox-writable (`docs/sandbox-verification.md`, row CL5). Cite `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_wrapper_target_check_var` and `hr_clone_config_spec`.
  - Then state the sync-in, operate, sync-out model in two sentences, with the fact that sync-in refuses a branch the main checkout has checked out, which replaces git's one-branch-one-checkout rule for a clone.
  - Then: "No shipped script creates a clone yet: every run still executes in a linked worktree, and the clone arm is exercised by `cli/test/clone-*.test.mjs`, `cli/test/wrapper-clone-arm.test.mjs`, `cli/test/run-copy-clone-arm.test.mjs` and `cli/test/setup-worktree-clone-target.test.mjs`."
  - The existing sentences about the worktree arm stay as they are.
- [ ] **The write-protection paragraph** (it opens *"Everything that runs outside the sandbox is write-protected on both sides"*). Add the run registry, by exact path, to the enumerated set, with its reason: the clone trust check reads it, so a sandboxed write could aim unsandboxed code at a forged copy. Say that the library writes it by `mktemp` plus `mv`, and that the sandboxed rename case is owed (`docs/sandbox-verification.md`, RG1 and RG2).
- [ ] **Residual 1, item 3** (*"The copy check reads the worktree record once"*). Add one sentence: on a clone it reads the registry, the clone's `HEAD`, `objects/info/alternates` and `.git/config` once each, and sync-out's `update-ref` reads the clone's `.git/config` again. That file is on the allow-list, and the runtime refuses sandboxed writes to it on macOS (row CL5); Linux is unmeasured.
- [ ] **Residual 1, item 6** (the shared object store). Add a closing sentence. It must state only what is true now:
  - a clone borrows the main checkout's objects through `objects/info/alternates`;
  - its own objects reach the main checkout only through sync-in's fetch, which hashes each object as it indexes it, so a substituted object is rejected (`cli/test/clone-sync.test.mjs`);
  - the watcher family's runners read objects from the main checkout's store alone (`cli/test/run-copy-clone-arm.test.mjs`).

  Then say that this residual stands for every run as long as runs execute in linked worktrees, which every run does today.
- [ ] **Record the measured fetch pins.** Add one paragraph to §6, directly after the sync-in / operate / sync-out sentences of the target-check paragraph, that is the **document of record** for the two points the task prompt left to measurement — which of the clone's own config keys a local-transport fetch from the clone honours, and whether a hook, filter or fsmonitor in the clone runs during that fetch — in the shape `.claude/context/conventions.md` → `## Documents of record` requires (what was measured, the command, the exact outcome):
  - one entry per payload measured: `core.fsmonitor`; `uploadpack.packObjectsHook`; a `core.hooksPath` holding `pre-upload-pack`, `reference-transaction` and `post-checkout`; a `filter.<x>` clean/smudge pair with its `.gitattributes`; `core.sshCommand`; a planted `.git/shallow`; a planted `.git/info/grafts`;
  - for each, the case in `cli/test/clone-sync.test.mjs` that measures it (by its test name), and the observed outcome — whether the marker appeared, whether the fetch refused, whether the main checkout's refs and history read unchanged — transcribed from Task 5's header after reading it;
  - the `git --version` the measurement was taken on, as the header states it;
  - the pins under which it was taken (`hr_run_main_git`'s `-c core.hooksPath=/dev/null -c core.fsmonitor=false -c submodule.recurse=false`, `GIT_NO_REPLACE_OBJECTS=1`, `GIT_GRAFT_FILE=/dev/null`, `--no-tags --no-recurse-submodules` and the pinned `--upload-pack`), citing `cli/templates/scripts/lib/harness-run-lib.sh` → *THE CLONE ARM'S SYNC*.

  Name `npm test --workspace cli -- test/clone-sync.test.mjs` as the command that reproduces the measurement, not the test file as the record. Wherever else this section names the sync-in fetch's pins (residual 6's closing sentence included), cite this paragraph.

**Verification:**

- `grep -n 'clone' docs/cli.md` shows each new mention inside §6, between `## 6.` and `## 7.`. Read each one.
- `git diff docs/cli.md` touches only the four paragraphs named above plus the one new measured-record paragraph. Read it to confirm the worktree-arm sentences are byte-identical.
- The measured-record paragraph names every payload the **Record the measured fetch pins.** bullet lists, each with its test case and observed outcome, plus a `git --version`; read it beside `cli/test/clone-sync.test.mjs`'s header and confirm every outcome matches the outcome the header states. No outcome appears in the paragraph that the header does not state.
- No sentence in the diff uses "will", "next branch", "planned" or "pending" about the layout switch: `git diff docs/cli.md | grep -nE '^\+.*(will |next branch|planned|pending)'` yields no line about a clone.
