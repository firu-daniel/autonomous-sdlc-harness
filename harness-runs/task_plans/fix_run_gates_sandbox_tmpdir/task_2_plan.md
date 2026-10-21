### Task 2 — Create `run-gates.sh`'s log, and the temporaries of `publish-main.sh`, `release.sh` and this repository's `remote-run.sh`, under `${TMPDIR:-/tmp}`

**Goal:** Make `scripts/run-gates.sh`, and so `scripts/test.sh` (`commands.test`), create its log where the unattended sandbox can write, through a form that BSD and GNU `mktemp` both accept. Apply the same fix to the other bare temporary-directory calls in this repository's own scripts. Bring `scripts/remote-run.sh` level with the template Task 1 changed.

**Depends on:** Task 1. Task 1 rewrites the 14 bare `mktemp` / `mktemp -d` calls in `cli/templates/scripts/remote-run.sh`. Each becomes `$(mktemp "${TMPDIR:-/tmp}/remote-run.<function>.XXXXXX")` or `$(mktemp -d "${TMPDIR:-/tmp}/remote-run.<function>.XXXXXX")`, named for its enclosing function (`gh_run`, `status_from_github`, `remote_branch_exists`, `redispatch`, `verb_trigger`, `forge_report`, `forge_progress`, `forge_progress_stopped`, `forge_open_pr`, `verb_deliver`, `verb_open`, `round_collect`, `verb_control`, `verb_collect`). Task 1 also changes two header-comment sentences, and it changes nothing else in that file. This task makes `scripts/remote-run.sh` byte-identical to that result and does not edit the template.

**Why `scripts/remote-run.sh` is edited here at all.** This repository has adopted its own harness, so `scripts/` is `init`'s output in this checkout (`.claude/context/conventions.md` → `## Documents of record`). `init` copies an outer-loop script byte for byte from `cli/templates/scripts/`, and `docs/sandbox-verification.md` → `## 0. Method` records `cmp` of each `scripts/*` against `cli/templates/scripts/*` matching. Left alone, the copy here would keep the bare calls this branch removes. `run-gates.sh`, `publish-main.sh` and `release.sh` have no template: they are hand-written files of this repository, and `run-gates.sh`'s header says so (*"This file is hand-written, is not in the set `init --force` rewrites"*).

### Targets

- `scripts/run-gates.sh`: the `log=` line.
- `scripts/publish-main.sh`: the `tmp_dir=` line in the `--- The tree ---` block.
- `scripts/release.sh`: the `worktree=` line in the `--- 1. Bump ---` block.
- `scripts/remote-run.sh`: made byte-identical to `cli/templates/scripts/remote-run.sh` as Task 1 left it.

**Work:**

- [ ] `scripts/run-gates.sh`: replace `log="$(mktemp -t harness-gates)"` with `log="$(mktemp "${TMPDIR:-/tmp}/harness-gates.XXXXXX")"`, the form the task prompt names.
  - **Replace that one line with one line, and add no line anywhere in the file.** `docs/work-report-research/README.md` cites `scripts/run-gates.sh:141` (gate 6a's `machine_path_hits`), and that research record is not this branch's to edit. Any added line above it would move what it cites. The reason for the template form is recorded in `docs/sandbox-verification.md` → row F2 (Task 3), not in a new comment here.
  - Leave the `trap 'rm -f "$log"' EXIT` beside it as it is.
- [ ] `scripts/publish-main.sh`: replace `tmp_dir="$(mktemp -d)"` with `tmp_dir="$(mktemp -d "${TMPDIR:-/tmp}/publish-main.XXXXXX")"`. Keep its `|| fail "could not create a temporary directory"` and its `trap 'rm -rf "$tmp_dir"' EXIT` exactly as they are.
- [ ] `scripts/release.sh`: replace `worktree="$(mktemp -d)"` with `worktree="$(mktemp -d "${TMPDIR:-/tmp}/release-bump.XXXXXX")"`.
  - Keep its `|| fail …` and its `trap 'git worktree remove --force "$worktree" …; rm -rf "$worktree"; git branch -D "$bump_branch" …' EXIT` exactly as they are. Those keep `harness-runs/lessons.md`'s rule that a script removes the temporary working copy and branch it created on every exit path.
  - `git worktree add` into the pre-created empty directory behaves as before: the directory only moves from macOS's per-user temp directory to `${TMPDIR:-/tmp}`.
- [ ] `scripts/remote-run.sh`: apply Task 1's edits to it, so that it ends byte-identical to `cli/templates/scripts/remote-run.sh`. That means the 14 call lines and the two header-comment sentences, nothing more.

**Verification:**

- `git grep -nE '^[^#]*(\$\(mktemp( -[dq]+)?\)|mktemp -t)' -- cli/templates/scripts scripts plugin` prints nothing. This is the story index's `## Scope register` D1 over all three trees, and it is the register's closure check for the `change` rows.
- `cmp scripts/remote-run.sh cli/templates/scripts/remote-run.sh` exits 0.
- `bash -n` exits 0 on each of `scripts/run-gates.sh`, `scripts/publish-main.sh`, `scripts/release.sh` and `scripts/remote-run.sh`.
- `git diff -U0 -- scripts/run-gates.sh scripts/publish-main.sh scripts/release.sh` shows only the three `mktemp` lines named above, and every hunk in `scripts/run-gates.sh` replaces a line without adding one.
- `scripts/run-gates.sh` passing unsandboxed on the final tree is the Run gates phase's check, not this task's (`${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`). The sandboxed re-run is Task 3's owed row T2, which a person takes (the story index's **Manual setup required** 2).
