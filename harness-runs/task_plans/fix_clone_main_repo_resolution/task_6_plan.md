### Task 6 — Prove `hc_main_root` in every run-copy layout, with and without the anchor, and move QA-lock case (f) to fail closed

**Goal:** Add the `cli/test/` suite goal 7 asks for. It runs `hc_main_root` / `hc_main_root_var` from `plugin/hooks/lib/harness-config-lib.sh` in fixture repositories built under `mkdtemp`, with and without `HARNESS_MAIN_REPO`. Then move `cli/test/qa-user-locks.test.mjs` case (f), the one existing case that asserts the defect this branch removes, to the new outcome, and add the registered-clone case beside it. The layout builder goes in a shared helper, which Task 7 reuses.

**Depends on:** Task 3, which ships this contract:

- **`hc_main_root_var <root>`** sets `HC_MAIN_ROOT` and `HC_MAIN_ROOT_REFUSAL`, prints nothing and returns 0 or 1. **`hc_main_root <root>`** prints `HC_MAIN_ROOT` on 0.
- **The anchor arm.** An absolute `HARNESS_MAIN_REPO` naming a directory whose `.git` is a directory without `commondir` wins for any `<root>`.
- **The clone arm.** When the anchor arm does not apply, it is taken whenever `<root>/.git` is a real directory holding `objects/info/alternates`. It answers the main checkout only if every check passes:
  - the alternates file is one line naming `<candidate>/.git/objects`;
  - `<candidate>` is not `<root>`;
  - `<candidate>/.git` is a directory with no `commondir`;
  - `<root>`'s `HEAD` is `ref: refs/heads/<branch>`;
  - `<candidate>/<stateDir>/autonomous_logs/registry.json` has `.runs[<branch>].copy_kind == "clone"` and `.worktree == <root>`;
  - `<root> == <parent of candidate>/<projectName>-<branch with / → ->`.

  Otherwise it returns 1 with a refusal sentence.
- **Every other root** gets today's `--git-common-dir` answer.
- **The QA helpers** exit as before (reserve 1, release 0). On a refusal their stderr carries `cannot resolve the main checkout of <root>: <sentence>`.

### Targets

- `cli/test/helpers/run-copy-layouts.mjs` (new) — the layout builder.
- `cli/test/main-root-fallback.test.mjs` (new) — the suite.
- `cli/test/qa-user-locks.test.mjs` — case (f), one new case beside it, and the header's rule paragraph.

**Work:**

- [x] **`helpers/run-copy-layouts.mjs`.** Export `buildRunCopyLayouts(t)`, which returns the absolute physical paths of these layouts. Build them under one `realpath(mkdtemp(join(tmpdir(), …)))` root, removed in `t.after`, and never inside this checkout.
  - **`main`**: a `git init -b trunk` checkout with a committed `harness.config.json` (`version`, `defaultBranch: "trunk"`, a non-default `stateDir`), and `<stateDir>/autonomous_logs/` created.
  - **`worktree`**: `git worktree add` of `main`.
  - **`registeredClone`**: made by sourcing `cli/templates/scripts/lib/harness-run-lib.sh` from `WORKSPACE_ROOT` and calling `hr_clone_create_var "$main" feat_reg trunk`, which writes the registry record. Follow how `cli/test/cleanup-run-copies.test.mjs` calls that function.
  - **`unregisteredClone`**: a plain `git clone --shared` of `main` at `hr_worktree_dir`'s path for `feat_unreg`, with `feat_unreg` checked out and no registry record.
  - **`twoLineClone`**: a second `hr_clone_create_var` clone (`feat_two`) with a second line appended to its `.git/objects/info/alternates`.
  - **`selfClone`**: a third registered clone (`feat_self`) whose alternates line is rewritten to name its own `.git/objects`.
  - **`plain`**: an unrelated `git init` repository.

  Each fixture changes exactly one condition, so a refusal is the work of the check that case targets. Run every child through `runBash` / `runGit` from `cli/test/helpers/fixture.mjs`. Spread no `process.env`; where a spread is unavoidable, blank `MAIN_REPO_ANCHOR_VARIABLE` in the same object, as `cli/test/helpers/fixture.mjs`'s isolated environment does.
- [x] **`main-root-fallback.test.mjs` — the cases.**
  - **The header** states the rule it enforces and the behaviour it does not cover, and why: the prose rule, which Task 10's rows AN5–AN6 measure by hand.
  - **The anchor.** Each layout is run twice: once with `[MAIN_REPO_ANCHOR_VARIABLE]: ''`, and once with it set to `main`. The variable name is imported from `../dist/core/mainRepoAnchor.js`.
  - **Expected without the anchor:**
    - `main`, `worktree` and `registeredClone` print `main` and exit 0;
    - `plain` prints `plain`;
    - `unregisteredClone`, `twoLineClone` and `selfClone` print nothing and exit 1, and a `hc_main_root_var` call leaves `HC_MAIN_ROOT_REFUSAL` naming the registry, the alternates file and the alternates file respectively. Match a stable fragment of the path or word, not the whole sentence.
  - **Expected with the anchor:** every layout prints `main`, which is today's behaviour.
  - **Call shape.** Call the library as `bash -c '. "$1"; hc_main_root "$2"' _ <lib> <dir>`, and print the variables after a `hc_main_root_var` call the same way.
- [x] **`qa-user-locks.test.mjs`.**
  - **Rename and rewrite case (f):** *"A reserve in an unregistered clone with no anchor refuses: exits 1, and no lock lands in the clone's or the main checkout's state dir"*. Assert:
    - `status` 1;
    - stderr matching `/cannot resolve the main checkout/`;
    - no `cloneLockSet`;
    - no `f.lockSet/user_1`.
  - **Add case (f2):** *"A reserve in a registered clone with no anchor uses the main checkout's lock set"*. Build the clone with `hr_clone_create_var` against this file's own `lockFixture` main, sourcing the template library as in the helper above, and write its own `harness.config.json` with a different `stateDir`, as `cloneOf` does. Assert:
    - exit 0, stdout `1\n`;
    - the lock under `f.lockSet`;
    - nothing in the clone's state dir.

    Add the registry directory the function needs to the fixture's main checkout, if `lockFixture` does not create it.
  - **Rewrite the header's rule paragraph**, which now says *"the same reserve with no anchor lands in the clone's own"*. A reserve with no anchor lands in the main checkout's set from a registered clone, and is refused from an unregistered one.
  - **Leave every other case and assertion byte-identical.**
- [x] **Mutations, recorded in each header.** Each changed test file names, in its header, the mutation of `hc_main_root_var` that turns it red, and states that it was run red once:
  - `main-root-fallback.test.mjs`: make the clone arm skip the registry check, which turns `unregisteredClone` red.
  - `qa-user-locks.test.mjs` (f) and (f2): make the clone arm return `<root>`. That one mutation turns both red: (f) because the reserve then exits 0 and the lock lands in `cloneLockSet`, and (f2) because the lock lands in the clone's state dir rather than under `f.lockSet`. Record both failing case names against it.

  Make each mutation in your working tree only, run the file once to see it red, record the date and the failing case name in the header, and revert the mutation before committing. Never commit a mutated library.

**Verification:**

- `npm test --workspace cli -- test/main-root-fallback.test.mjs` passes, every case of both anchor settings reported.
- `npm test --workspace cli -- test/qa-user-locks.test.mjs` passes, with (a)–(e), (g) and (h) unchanged.
- `git diff cli/test/qa-user-locks.test.mjs` touches only case (f), the new case, the fixture helper it needs, and the header paragraph. Read it to confirm.
- Each changed header records its mutation and the red run; `qa-user-locks.test.mjs`'s header names both (f) and (f2) as the cases that mutation turned red.
