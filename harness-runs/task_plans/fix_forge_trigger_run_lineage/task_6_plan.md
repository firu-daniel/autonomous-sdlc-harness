### Task 6 — Move the scratch-containment path test into the run library as `hr_scratch_path_var`, and make `scratch-run.sh` call it

**Goal:** Give the judgement "does this argument resolve strictly inside `<root>/<state_dir>/scratch/`" one home before a second script needs it. Today it exists once, inline in `cli/templates/scripts/scratch-run.sh`, which uses it to decide which file it executes. Task 7's `remote-run.sh discard` needs the same judgement to decide which directory it removes. This task moves the test into `cli/templates/scripts/lib/harness-run-lib.sh` as one function. The library's header calls itself the one place every outer-loop script derives the state-dir paths "the scripts would otherwise each re-derive slightly differently". After this task, `scratch-run.sh` calls the function and keeps its own exit codes and messages. Rule: `.claude/context/conventions.md` → `### Where a new responsibility goes`, *"A responsibility that already has a home does not get a second one"* and *"Before adding a copy of anything, grep for it."*

**Depends on:** **Task 3**, which edits a different section of `cli/templates/scripts/lib/harness-run-lib.sh` (`DERIVING A BRANCH NAME FROM A TITLE.`). This task edits the `Anchors, the slug and the machine-local directory.` section and the file's opening paragraph only. The dependency exists so that only one task has the file at a time.

**Where this task stops.** It adds the function and moves `scratch-run.sh` onto it. It adds no verb to `remote-run.sh`: `discard`, which is the function's second caller, is **Task 7**. No document under `docs/` changes. `docs/watcher.md`'s `scratch-run.sh` row ("refusing any argument that does not resolve inside `<state_dir>/scratch/`") stays true, because the refusal is kept and the row does not say where it is defined. This repository's own `scripts/` copy is `init`'s self-adoption output (`.claude/context/conventions.md` → `## Documents of record`), and this task does not edit it.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh`: the opening responsibility paragraph, and a new `hr_scratch_path_var` placed directly after `hr_state_path` in the `Anchors, the slug and the machine-local directory.` section.
- `cli/templates/scripts/scratch-run.sh`: the `THE REFUSAL IS THE WHOLE OF THE SAFETY` header paragraph, the `SCRATCH_SUBDIR` constant, and the inline path test (from the `*..*` refusal through the `[ -L "$target" ]` refusal), which is replaced by one call.
- `cli/test/outer-loop-scripts.test.mjs`: one new `REFUSED` row, and the comment above `REFUSED`.

**The interface this task defines, which Task 7 calls.** `hr_scratch_path_var <root> <path> [<base>]`:

- **Arguments.**
  - `<root>` is the repository whose `<state_dir>/scratch` is the fence.
  - `<path>` is the argument **as the caller received it**. The character tests run on this raw form.
  - A relative `<path>` resolves against `<base>` when one is given, and against `<root>` otherwise. An absolute `<path>` is taken as given. `scratch-run.sh` passes no `<base>`, so its behaviour does not change. Task 7 passes the caller's directory, captured before `remote-run.sh`'s `cd`.
- **What it sets.** It clears all five variables on entry, then sets:
  - `HR_SCRATCH_SUBDIR=scratch`. This is the one spelling of the directory name, and its comment mirrors the `scratch` row of `STATE_DIR_ENTRIES` in `cli/src/generators/stateDir.ts`, as `scratch-run.sh`'s `SCRATCH_SUBDIR` comment does today.
  - `HR_SCRATCH_DIR`: the scratch directory, resolved physically.
  - `HR_SCRATCH_PARENT`: the physical directory that holds the target.
  - `HR_SCRATCH_TARGET`: `<HR_SCRATCH_PARENT>/<basename>`. This is the path the caller acts on.
  - `HR_SCRATCH_WHY`: one keyword naming why the call did not return 0, or empty on 0. The keywords are `dotdot`, `charset`, `outside`, `itself`, `symlink`, `no-parent`, `no-config`, `no-scratch` and `usage`. They are keywords and not messages, so each caller keeps its own wording.
- **Checks, in this order.** This is the order `scratch-run.sh` uses today.
  1. `<path>` carries `..` anywhere → `dotdot`.
  2. `<path>` carries a character outside `A-Za-z0-9._/-` → `charset`.
  3. `hr_state_path "$root" "$HR_SCRATCH_SUBDIR"` does not resolve → `no-config`.
  4. That directory does not resolve with `cd … && pwd -P` → `no-scratch`.
  5. The candidate's `dirname` does not resolve with `cd … && pwd -P` → `no-parent`.
  6. That parent is neither the scratch directory nor beneath it → `outside`.
  7. The basename is `.`, so the target would be the scratch directory itself → `itself`.
  8. The target is a symlink (`[ -L … ]`) → `symlink`.
- **Statuses.**
  - **0**: the target is a proper descendant of the scratch directory and is not a symlink. The target need **not** exist.
  - **1**: refused (`dotdot`, `charset`, `outside`, `itself`, `symlink`).
  - **2**: the target's parent cannot be resolved (`no-parent`).
  - **3**: the scratch directory cannot be located (`no-config`, `no-scratch`).
  - **4**: `<root>` or `<path>` is empty (`usage`).
- **What it does not do.** It writes nothing, prints nothing, removes nothing and sets no shell option (`.claude/context/conventions.md` → `## Shell assets`: *"A sourced library sets no shell options at all"*). It adds **no** entry to the library's `THE WRITE EXCEPTIONS` list. Every other variable it uses is `local`. It stays inside the library's Bash 3.2 floor.

**Work:**

- [ ] **`hr_scratch_path_var`** in `cli/templates/scripts/lib/harness-run-lib.sh`, directly after `hr_state_path`. Implement the interface above. Its doc comment states the rule **once**, so that neither caller restates it:
  - why `..` is refused anywhere in the argument and not only as a whole segment (carried over from `scratch-run.sh`'s header);
  - why both sides are resolved physically, so a planted symlinked directory cannot widen the fence;
  - why a symlinked target is refused rather than followed;
  - that it has two callers, which differ only in what they do with an accepted path: `scratch-run.sh` executes a file there and `remote-run.sh discard` removes a directory there. That is why the function reports a keyword and leaves messages and exit codes to each caller.
- [ ] **Library opening paragraph**: add "judges whether a path lies strictly inside the state directory's scratch directory (`hr_scratch_path_var`)" to the list of what the library is the one place for.
- [ ] **`scratch-run.sh`, the call**: delete `SCRATCH_SUBDIR` and the inline test. Call `hr_scratch_path_var "$repo_root" "$requested"` after `repo_root` is resolved, and switch on its status and `HR_SCRATCH_WHY`:
  - `dotdot`, `charset`, `outside` and `symlink` → exit 65, each with the **existing** message text. Each message must keep the substring the suite matches: `'..'`, `outside A-Za-z0-9`, `outside`, `is a symlink`. Use `HR_SCRATCH_PARENT` and `HR_SCRATCH_DIR` where the `outside` message names the two paths, and `HR_SCRATCH_SUBDIR` where its second line names the directory.
  - `itself` → exit 65, with a new message `scratch-run.sh: '<requested>' names the scratch directory itself — refusing`. This tightens one case: `<state_dir>/scratch/.` used to fall through to exit 67 and is now refused as a path. Record this in the task's return.
  - `no-parent` → exit 67, with the existing "names no existing directory" message.
  - `no-config` and `no-scratch` → exit 68, with the two existing messages.
  - `usage` cannot occur, because the script already exits 64 on an empty argument. Map it to 64 anyway rather than leaving it unhandled.
  - Then use `HR_SCRATCH_TARGET` where the script used `target`. The readable-regular-file test (exit 67) and everything after it stay as they are. No message names the function: the suite's comment above `REFUSED` makes the refusal contract the reason, never a helper name.
- [ ] **`scratch-run.sh`, the header**: in `THE REFUSAL IS THE WHOLE OF THE SAFETY`, keep what is refused and why, and replace the description of how with a pointer: the test is `hr_scratch_path_var` in `lib/harness-run-lib.sh`, shared with `remote-run.sh discard`, and the refusal reasons are the ones that function names. Add the `itself` refusal to the exit map's `65` line. Add a `REPRO` line: `scripts/scratch-run.sh sdlc-harness/scratch/.` → exit 65.
- [ ] **`cli/test/outer-loop-scripts.test.mjs`**:
  - Add one `REFUSED` row: ``['the scratch directory itself', [`${SCRATCH_DIR}/.`], /scratch directory itself/]``.
  - Amend the comment above `REFUSED` so it says the path test is the shared library's `hr_scratch_path_var` and that the refusal contract still names no helper.
  - Change no existing row. Every one of them must pass unchanged, and that is the evidence that the move kept `scratch-run.sh`'s behaviour.

**Verification:**

- `npm test -- test/outer-loop-scripts.test.mjs` from `cli/` passes: every existing `REFUSED` row, the new row, and the per-interpreter run cases. This task edits that file, so it is the file this task runs.
- The type check passes.
- `git grep -nE "pwd -P|\*\.\.\*|A-Za-z0-9\._/-" -- cli/templates/scripts/scratch-run.sh` returns only header prose and the call site. No hit is an inline `case` pattern or a `cd … && pwd -P` resolution of the candidate.
- `git grep -n 'hr_scratch_path_var' -- cli/templates/scripts` returns the definition, its mention in the library's opening paragraph, and `scratch-run.sh`'s call and header pointer. After Task 7 it also returns `remote-run.sh`'s call. No other script carries its own copy of the test.

**Deviations from plan:**
- The `git grep -nE "pwd -P|\*\.\.\*|A-Za-z0-9\._/-"` probe over `scratch-run.sh` also hits the `charset` refusal's message line, because that message must keep the `outside A-Za-z0-9` substring the suite matches; it is a message, not an inline `case` pattern or resolution.
- The `no-scratch` message names the unresolved scratch path by calling `hr_state_path "$repo_root" "$HR_SCRATCH_SUBDIR"` at the message site, because the function's `HR_SCRATCH_DIR` is the physical path and is empty on that outcome; the message text is otherwise unchanged.
