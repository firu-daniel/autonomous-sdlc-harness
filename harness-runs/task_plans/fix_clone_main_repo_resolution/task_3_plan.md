### Task 3 — Give `hc_main_root` the clone arm and a refusal sentence, and print it from the QA-lock helpers

**Goal:** Make `hc_main_root` in `plugin/hooks/lib/harness-config-lib.sh` find the main checkout from a run clone when `HARNESS_MAIN_REPO` is unset. It applies the story's rule (index `## Context` → **The rule**, F1–F8) in shell, with the same fail-closed behaviour, so a QA lock reserved from a clone lands in the main checkout's lock set or the helper stops. It never lands in the clone's own state directory. Its two callers print the reason when it stops.

**What stays exactly as it is:**

- **The anchor arm.** An absolute `HARNESS_MAIN_REPO` naming a directory whose `.git` is a directory without `commondir` still answers that directory's physical path, for any `<root>`.
- **Today's `--git-common-dir` arm**, for every `<root>` that is not a clone: a main checkout, a linked worktree, an ordinary repository, and a bare repository's worktree (still a refusal). Every existing case in `cli/test/qa-user-locks.test.mjs` except (f) depends on this.

**Where this task stops.** **Task 6** writes the behavioural suite for this function and moves case (f). This task verifies by the library's own `REPRO` block in a throwaway fixture, per `.claude/context/plugin.md` → `## Verifying a change in this layer`. `grep -n 'hc_main_root' plugin/hooks/*.sh` printed nothing at this branch's base, so no guard calls the function. Keep it that way.

### Targets

- `plugin/hooks/lib/harness-config-lib.sh` — `hc_main_root`, a new `hc_main_root_var`, their header comment, and the header `REPRO` line for the main checkout.
- `plugin/scripts/reserve-qa-user.sh` — the `main=$(hc_main_root …)` call site and the header paragraph **WHY THE LOCKS LIVE IN THE MAIN CHECKOUT'S STATE DIRECTORY.**
- `plugin/scripts/release-qa-user.sh` — the matching call site and the header paragraph **THE LOCK SET IS THE ONE `reserve-qa-user.sh` DOCUMENTS**.

**Work:**

- [ ] **`hc_main_root_var <root>`** (new) sets `HC_MAIN_ROOT` and `HC_MAIN_ROOT_REFUSAL`, prints nothing, and returns 0 or 1. Callers call it directly, never inside `$(…)`, and the header says so. The flow:
  1. The **anchor arm**, unchanged.
  2. The **clone arm** is taken only when `$root/.git` is a real directory (`-d` and not `-L`) and `$root/.git/objects/info/alternates` exists (`-e` or `-L`).
  3. **Otherwise**, today's common-dir code, byte-for-byte in behaviour.

  Every return of 1 sets `HC_MAIN_ROOT_REFUSAL` to one sentence that names the condition and the path, and never a file's contents. The common-dir arm's existing failure becomes *"its git common directory is not a checkout's .git — a bare repository, a submodule or a separate git dir"*. `hc_main_root <root>` keeps its interface: it calls `hc_main_root_var` and prints `HC_MAIN_ROOT` on 0.
- [ ] **The clone arm — F3–F8, mirroring `hr_clone_target_check_var`'s reading discipline. It runs no `git` command at all.** Canonicalise with `cd -P … && pwd -P`, as the function already does.
  - **Alternates.** The file is regular, not a symbolic link and readable. Read two lines with `IFS= read -r`: the first must be non-empty and the second empty. Join a relative first line to `$root/.git/objects/`. The canonical path must end in `/.git/objects`, and `<candidate>` is that path without the suffix.
  - **Candidate.** `<candidate>` ≠ canonical `<root>`. `<candidate>/.git` is a real directory, and `<candidate>/.git/commondir` is absent (`-e` and `-L` both false).
  - **Branch.** `<root>/.git/HEAD` is a regular file holding exactly one line, `ref: refs/heads/<branch>`.
  - **Registry.**
    - Take `stateDir` from `hc_config_dir "$candidate" stateDir sdlc-harness`.
    - `hc_have_jq` must hold.
    - Read `.runs[$b]` of `<candidate>/<stateDir>/autonomous_logs/registry.json` in **one** `jq -r` call. Use only constructs within the library's stated jq-1.5 floor, and print `copy_kind` and `worktree` on two lines. `copy_kind` must be `clone`, and the canonical `worktree` must equal canonical `<root>`.
    - Never create the registry or its directory.
  - **Derived path.** Canonical `"$(hc_work_root "$candidate")/$(hc_project_name "$candidate")-${branch//\//-}"` equals canonical `<root>`.
  - **Answer.** `HC_MAIN_ROOT=<candidate>`.

  **The reads.** The arm reads only `<root>`'s alternates and `HEAD`, and `<candidate>`'s configuration and registry. These are the same records `hr_clone_target_check_var` already trusts, and nothing else of the clone; in particular it reads neither its `.git/config` nor its hooks. State that read set in the header, with why each one is safe:

  - The main checkout's registry is write-protected.
  - A rewritten `HEAD` or alternates file can only make F6 or F7 fail, so the arm fails closed.

  Bash 3.2 throughout: no associative arrays, `mapfile`, `${v^^}` or `local -n`. Set no shell option (`.claude/context/conventions.md` → `## Shell assets`).
- [ ] **The header and `REPRO`.**
  - Rewrite `hc_main_root`'s header to the three arms above, and say a main checkout that itself borrows objects through `alternates` takes the clone arm and is refused.
  - Extend the header `REPRO` line for the main checkout with the clone arm's two outcomes:
    - with the anchor unset, from a registered run clone, the main checkout;
    - from an unregistered clone, return 1 with `HC_MAIN_ROOT_REFUSAL` set.
- [ ] **The two callers.** In both scripts, replace `main=$(hc_main_root "$root") || main=""` with a direct `hc_main_root_var "$root"` call that sets `main` from `HC_MAIN_ROOT`.
  - **The stderr line on failure** reads `<script>: cannot resolve the main checkout of $root: $HC_MAIN_ROOT_REFUSAL`. The words `cannot resolve the main checkout` stay, because `qa-user-locks.test.mjs` case (d) matches them.
  - **Reserve** drops its hard-coded parenthetical. The **exit codes are unchanged**: reserve exits 1 and release exits 0.
  - **Both header paragraphs** describe the main checkout the same way: the anchor when set and usable; else, in a run clone, the main checkout its `objects/info/alternates` names and whose run registry records this clone at this path, or a refusal; else the `--git-common-dir` answer.
  - **Keep the pair-must-agree paragraph true.** Both callers take the same derivation, step for step.

**Verification:**

- Reproduce by hand in a throwaway fixture under `$TMPDIR`, never in this checkout:
  - a main checkout with a `harness.config.json`;
  - a linked worktree of it;
  - a clone made by sourcing `cli/templates/scripts/lib/harness-run-lib.sh` and calling `hr_clone_create_var <main> feat_x trunk`, which also writes the registry record;
  - a plain `git clone --shared` at `hr_worktree_dir <main> feat_y` with `feat_y` checked out and no record.

  With `HARNESS_MAIN_REPO` unset, `bash -c '. plugin/hooks/lib/harness-config-lib.sh; hc_main_root <dir>; echo $?'` prints the main checkout's physical path and `0` from the main checkout, the worktree and the registered clone. From the unregistered clone it prints only `1`. A `hc_main_root_var` call there leaves `HC_MAIN_ROOT_REFUSAL` naming the registry.
- With `HARNESS_MAIN_REPO=<main>` set, each of the four answers `<main>`.
- `grep -n 'hc_main_root' plugin/hooks/*.sh` prints nothing and exits 1.
- `grep -n -E 'declare -A|mapfile|readarray|\^\^|local -n' plugin/hooks/lib/harness-config-lib.sh` finds nothing new.

- **Deviations from plan:**
  - Beyond the named header paragraphs, three statements in the same target files were kept true: the library's `FILE DISCIPLINE` list of non-`hc_` names now lists `HC_MAIN_ROOT` / `HC_MAIN_ROOT_REFUSAL`; `reserve-qa-user.sh`'s exit-1 row names an unresolvable clone; both helpers' `REPRO` blocks gained the anchor-unset clone outcome, and `release-qa-user.sh`'s "from the anchor or its shared git directory" sentence now says "by that same three-arm rule".
  - Evidence downgrade: the helpers' new stderr line (`<script>: cannot resolve the main checkout of $root: $HC_MAIN_ROOT_REFUSAL`) was not executed. Running `bash plugin/scripts/release-qa-user.sh 1` from the fixture's unregistered clone was refused by the permission layer (don't-ask mode), as was a second fixture command (bare-repository worktree refusal sentence, registry-absent case, unregistered clone outside the derived path). The claim rests on reading both call sites and on the library runs below; `cli/test/qa-user-locks.test.mjs` case (d) in the Run gates phase executes the stderr match.
  - Executed in a `$TMPDIR` fixture (main checkout with `harness.config.json`, `stateDir` `st`, linked worktree, `hr_clone_create_var <main> feat_x trunk` clone, plain `git clone --shared` at `hr_worktree_dir <main> feat_y` with no record): anchor unset, `hc_main_root` printed the main checkout's physical path and `0` from the main checkout, the worktree and the registered clone, and only `1` from the unregistered clone; `hc_main_root_var` there left `HC_MAIN_ROOT_REFUSAL` = "the run registry <main>/st/autonomous_logs/registry.json records no clone of branch feat_y at <clone>". With `HARNESS_MAIN_REPO=<main>`, all four answered `<main>` and `0`.
  - Expected: `cli/test/qa-user-locks.test.mjs` case (f) (unregistered clone, no anchor, falls back to the clone's own lock set) now fails closed and so fails until Task 6 rewrites it, per the story index's **A test the branch changes on purpose.**
