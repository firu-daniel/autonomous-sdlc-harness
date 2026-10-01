### Task 7 — Add `remote-run.sh discard`, scoped to `<state_dir>/scratch/`, and describe the commands' scratch directories

**Goal:** Give the commands' GitHub route a way to remove the directory it fetched into, with a literal command and without the agent running a recursive `rm`. The new verb removes a directory only when it resolves strictly inside the checkout's `<state_dir>/scratch/`. The adopter's state-directory READMEs then say that this directory also holds those per-command fetch directories.

**Depends on:**
- **Task 6**, which provides the path test this verb calls: `hr_scratch_path_var <root> <path> [<base>]` in `cli/templates/scripts/lib/harness-run-lib.sh` (the contract is restated below).
- **Task 4**, the last of the tasks that edit `cli/templates/scripts/remote-run.sh` before this one.
- **Task 1**, which edits `cli/test/remote-run.test.mjs`.

This task touches a new verb's code path only, and none of theirs.

**Where this task stops.** It provides the verb and documents the directory. It does **not** define what "inside scratch" means, and it does not touch the run library or `scratch-run.sh`: that judgement has one home, Task 6's `hr_scratch_path_var`, and `verb_discard` calls it rather than carrying a copy (`.claude/context/conventions.md` → `### Where a new responsibility goes`). Rewriting the four commands to use it is **Tasks 8 and 9**. `docs/remote-execution.md` is Task 10's.

### Targets

- `cli/templates/scripts/remote-run.sh`: the verb list in the header, `usage()`, the verb `case`, the argument loop, the root-resolution and gate `case`, a new `verb_discard`, the exit map, a header paragraph and a `REPRO` line.
- `cli/test/remote-run.test.mjs`: new cases, and its file header.
- `cli/templates/state-dir/scratch/README.md`: the template written as `<state_dir>/scratch/README.md`.
- `cli/templates/state-dir/README-root.md`: its machine-local list sentence on `<state_dir>/scratch/`.

**The interface this task defines, which Tasks 8, 9 and 10 rely on.** `remote-run.sh discard <dir> [--repo <root>]`:
- `<dir>`, when relative, resolves against the caller's directory, captured before the script's `cd`, as `fetch`'s `<out_dir>` does today. That directory is passed to the library as `<base>`, so the character tests still run on `<dir>` as the caller typed it.
- The root is `--repo`, or else `hr_repo_root` of the working directory: the session's own checkout, not the main one, as for `restore`.
- The verb makes no `gh` call and takes no `execution.target` gate.
- Exit codes:
  - **0**: `<dir>` was removed (`remote-run.sh: removed <dir>`), or did not exist (`remote-run.sh: <dir> does not exist; nothing removed`).
  - **2**: `<dir>` does not resolve **strictly inside** `<root>/<state_dir>/scratch/`, or is a symlink. Nothing is removed.
  - **1**: a usage error, an unresolvable configuration, a parent directory that cannot be resolved, or a removal that failed.
- **The path test is Task 6's `hr_scratch_path_var`, called and not copied.** The contract this verb relies on:
  - Call: `hr_scratch_path_var "$root" "<dir as given>" "<caller's directory>"`.
  - It refuses `..` anywhere and any character outside `A-Za-z0-9._/-` on the raw argument. It resolves the scratch directory (through `hr_state_path`) and the target's parent physically with `cd … && pwd -P`. It requires the target to be a proper descendant of the scratch directory, so the scratch directory itself is refused. It refuses a symlinked target. A target that does not exist is accepted.
  - On 0 it sets `HR_SCRATCH_TARGET`, the physical path to act on. On any other status it sets `HR_SCRATCH_WHY` to one of `dotdot`, `charset`, `outside`, `itself`, `symlink`, `no-parent`, `no-config`, `no-scratch` or `usage`.
  - Status → this verb's exit: **0** → go on to remove. **1** (refused) → exit **2**. **2** (`no-parent`), **3** (`no-config`, `no-scratch`) and **4** (`usage`) → exit **1**.
  - It writes and prints nothing, so every message is this verb's own, and none names the function.

**The directory naming rule this task defines, which Tasks 8, 9, 10 and 12 use.** Each command's directory is `<state_dir>/scratch/<command>-<branch_fold>/`. `<branch_fold>` is the branch with every character outside `A-Za-z0-9_-` replaced by `_`. For example, `feat/recent_searches_panel` gives `branch-pause-feat_recent_searches_panel`, and `fix+a@b.c` gives `branch-answer-fix_a_b_c`. The reasons:
- A raw `/` would make `mkdir -p` create two levels, and `discard` would remove only the leaf, leaving the outer directory behind.
- A raw character outside the class `hr_scratch_path_var` accepts (`charset`), or a `..` (`dotdot`, refused anywhere in the argument), would make `discard` refuse the directory the command had just created. The next invocation would then stop on it as a leftover, naming a `discard` that refuses it again.
- `.` is folded as well as the characters outside the class. A fold that kept `.` would let a user-typed name such as `../x` produce `.._x`, which carries `..`.

The folded name is therefore always one path segment that `hr_scratch_path_var` accepts. Two branches that fold to the same name, such as `feat/x` and `feat_x`, are safe: the second command finds the first's directory, stops it as a leftover, and never shares or removes it. `discard` itself does not fold. It acts on the path it is given, and the fold is the command's to apply when it writes the literal path.

**Work:**

- [ ] **Argument handling**:
  - Add `discard` to the verb `case`, to `usage()`'s lines, and to the header's verb list.
  - Take `<dir>` as its single positional argument (not a `<branch>`), exempt from the `valid_branch` requirement.
  - Resolve it against `PWD` beside the existing `out_dir` resolution.
  - Add the verb to the `hr_repo_root` branch of root resolution, and to a no-gate arm of the configuration `case` that requires `hr_state_path "$root"` to resolve.
- [ ] **`verb_discard`**: call `hr_scratch_path_var` as above and map its status to this verb's exits, with one `remote-run.sh: …` message per `HR_SCRATCH_WHY` keyword. On 0: if `HR_SCRATCH_TARGET` does not exist, report "does not exist" and exit 0. Otherwise remove `HR_SCRATCH_TARGET` (the physical path the library resolved, not the raw argument) recursively in-process inside the script (`rm -rf -- "$HR_SCRATCH_TARGET"`), and report. Never re-implement any part of the path test here.
  - Its doc comment states why removal lives here and not in the command: a supervised or auto-mode session may refuse a recursive `rm` typed by the agent, and a user-level `rm -rf` deny cannot be overridden (`.claude/context/conventions.md` → `## Shell assets`).
  - It also states why the scope is the scratch directory only: the lessons ledger's *"never removes one it did not create"* rule.
  - The verb never creates anything.
- [ ] **Header**:
  - Add a `` `discard` `` paragraph next to `` `fetch` IS THE COMMANDS' READ `` covering the scope, the exits, and the fact that it writes nothing else.
  - Add the verb to `WHAT IT NEVER DOES`'s per-verb writes sentence.
  - Add a row to the exit map.
  - Add a `REPRO` line: `mkdir -p sdlc-harness/scratch/branch-pause-feat_x`, then `discard sdlc-harness/scratch/branch-pause-feat_x` gives 0; `discard sdlc-harness/autonomous_logs` gives 2.
- [ ] **Templates**:
  - `cli/templates/state-dir/scratch/README.md`: add a paragraph saying that the GitHub route of `/autonomous-sdlc-harness:branch-pause`, `-resume`, `-answer` and `-user-review` also fetches into `<state_dir>/scratch/<command>-<branch_fold>/`, and removes it with `remote-run.sh discard` on every path. State the naming rule above once in this paragraph: `<branch_fold>` is the branch with every character outside `A-Za-z0-9_-` replaced by `_`, so the name is always one path segment `discard` accepts, and two branches folding to the same name are safe because the leftover check stops the second command. Amend the "Nothing depends on its name" and "the one directory where a file's name carries no contract" sentences so they hold for the probe files and name the exception.
  - `README-root.md`: widen the scratch clause of its machine-local list to name these fetch directories.
- [ ] **`cli/test/remote-run.test.mjs`**:
  - Case: a nested directory under the fixture's `sdlc-harness/scratch/branch-answer-feat_x/` holding files is removed with exit 0.
  - Case: an absent one gives exit 0 with the "does not exist" line.
  - Case, the folded name for a slash-bearing branch: snapshot the listing of the fixture's `sdlc-harness/scratch/`. Then `mkdir -p sdlc-harness/scratch/branch-pause-feat_recent_searches_panel` (the fold of `feat/recent_searches_panel`), put a file in it, and run `discard` on that path. Passes on exit 0 when the listing of `sdlc-harness/scratch/` afterwards equals the snapshot, so nothing remains under `scratch/`.
  - Case: each of `sdlc-harness/scratch`, `sdlc-harness/scratch/.`, `sdlc-harness/autonomous_logs`, a path carrying `..`, an absolute path outside the fixture, and a symlink inside `scratch/` pointing outside gives exit 2, with every target byte-identical afterwards (snapshot as the `status` cases do).
  - Case: no case records a `gh` call.
  - Add the rule to the file header.

**Verification:**

- `npm test -- test/remote-run.test.mjs` from `cli/` passes, with the new `discard` cases and Task 1's and the existing cases.
- The type check passes.
- `git grep -nE "pwd -P|\*\.\.\*|A-Za-z0-9\._/-" -- cli/templates/scripts/remote-run.sh` shows no new hit inside `verb_discard`. The verb's containment comes only from its `hr_scratch_path_var` call.
- `git grep -n 'branch_fold' -- cli/templates/state-dir/scratch/README.md` shows the naming rule stated in the new paragraph.
- Read the two template README paragraphs against `cli/templates/state-dir/scratch/README.md`'s remaining text: no sentence still says that every file in the directory is a probe whose name carries no contract.
