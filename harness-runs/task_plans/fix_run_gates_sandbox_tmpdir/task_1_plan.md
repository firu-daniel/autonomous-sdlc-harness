### Task 1 — Give every bare `mktemp` in the shipped `remote-run.sh` template an explicit `${TMPDIR:-/tmp}` template, and guard the shipped scripts against a bare or `-t` call

**Goal:** Make every temporary file and directory that the shipped `cli/templates/scripts/remote-run.sh` creates land under `${TMPDIR:-/tmp}` through an explicit template, which BSD (macOS) and GNU (Linux) `mktemp` both honour. Add a test that fails if any shipped script under `cli/templates/scripts/` ever again calls `mktemp` with no template or with `-t`.

**Where this layer stops.** This task edits the **template** only, which is what a future adopter receives. It does not touch `scripts/remote-run.sh`, this repository's own byte-for-byte copy of that template. That copy belongs to **Task 2**, which brings it level with this task's result by `cmp`. So this task's edit is the one source both copies end up holding. `scripts/run-gates.sh`, `scripts/publish-main.sh` and `scripts/release.sh` are hand-written files of this repository with no template, and they are Task 2's too. The test added here reads `cli/templates/scripts/` only. The cross-layer rule *"no test is ever aimed at this repository"* (`.claude/context/conventions.md` → `## The testing bar`) keeps it off `scripts/`, and Task 2 verifies that tree by grep instead.

### Targets

- `cli/templates/scripts/remote-run.sh`: the 14 bare `mktemp` / `mktemp -d` calls, plus the two header-comment sentences that describe them.
- `cli/test/shipped-scripts-mktemp.test.mjs` (new): the source guard over every shipped script.

**Work:**

- [ ] `cli/test/shipped-scripts-mktemp.test.mjs`: **write this first.**
  - **Header** (`.claude/context/conventions.md` → `## The testing bar`). It opens with the rule: *every `mktemp` a shipped script runs names an explicit template, and none uses `-t`*.
  - **The header argues why the guard is on the source, the last resort that section allows:**
    - on GNU `mktemp`, a bare call honours `TMPDIR`, so a behavioural case on Linux cannot tell the two forms apart;
    - on macOS, the failure exists only where the per-user `/var/folders/…/T` is unwritable. That is the unattended sandbox, which no test can launch (`docs/sandbox-verification.md` → `## 5. Failures and their follow-ups`, row F2);
    - GNU rejects `mktemp -t <prefix>` with fewer than three `X`s outright (`mktemp: too few X's in template '<prefix>'`).
  - **Body.** Resolve `cli/templates/scripts` from `WORKSPACE_ROOT` (`cli/test/helpers/fixture.mjs`), the way `cli/test/prompt.test.mjs` resolves its source. Walk it recursively and read every `*.sh` file. Drop each line whose first non-blank character is `#`, because the header `REPRO` blocks are hand-run examples. Collect every command substitution matching `\$\(\s*mktemp\b([^)]*)\)`.
  - **Assert, for each match:** its argument text contains a run of six `X`s, and it carries no `-t` option. On failure, name `<file>:<line>` and the call.
  - **Also assert at least one call was found**, so a regex that matches nothing cannot pass vacuously.
- [ ] `remote-run.sh`, the 14 calls. Replace each with an explicit template whose name is `remote-run.<function>.XXXXXX`, where `<function>` is the enclosing function. A file call becomes `$(mktemp "${TMPDIR:-/tmp}/remote-run.<function>.XXXXXX")`. A directory call becomes `$(mktemp -d "${TMPDIR:-/tmp}/remote-run.<function>.XXXXXX")`. The calls, by function:
  - `errfile=$(mktemp)` in `gh_run`, `remote_branch_exists` and `redispatch`;
  - `status_tmp=$(mktemp -d)` in `status_from_github`;
  - `trigger_tmp=$(mktemp -d)` in `verb_trigger`;
  - `tmp=$(mktemp -d)` in `forge_report`, `forge_progress`, `forge_progress_stopped`, `forge_open_pr`, `verb_deliver`, `verb_open` and `round_collect` (the `if ! tmp=$(mktemp -d); then` form);
  - `control_tmp=$(mktemp -d)` in `verb_control` and `verb_collect`.
- [ ] `remote-run.sh`, what must **not** change at those 14 sites:
  - every `||` fallback and every `if !` failure arm (`GH_ERR="mktemp failed"`, `REMOTE_BRANCH_ERR=…`, `REDISPATCH_ERR=…`, the `exit "$EXIT_USAGE"` / `exit "$EXIT_OK"` lines, `tmp=""`, `RC_ERR=…`);
  - every `made_tmp` / `control_dirs` bookkeeping line;
  - every removal (`rm -f "$errfile"`, `trap 'rm -rf "$status_tmp"' EXIT`, `rmdir "$made_tmp"`, `rm -rf -- "$tmp"`).

  The `RUNNER_TEMP` preference ahead of each directory call stays as it is: on a GitHub runner that directory is still used first. Each removal stays exactly as it is because a temporary file left behind would now land under the caller's `TMPDIR`, where the `status` cases of `cli/test/remote-run.test.mjs` assert nothing is left. It would no longer land under macOS's per-user directory.
- [ ] `remote-run.sh`, header comments only. Two sentences describe these directories as *"a `mktemp -d` directory"*: the `RUNNER_TEMP` line of the environment-variable list, and the `status` WITH NO LOCAL RECORD paragraph. Make each say *"a `mktemp -d` directory under `${TMPDIR:-/tmp}`"*. Change no other comment.

**Verification:**

- Run the new test file alone, `npm test --workspace cli -- test/shipped-scripts-mktemp.test.mjs`, as one plain foreground command from the repository root, once before the `remote-run.sh` edit and once after:
  - **before the edit**, it fails, naming every `remote-run.sh` call listed under **Work** and no file other than `remote-run.sh`. That shows the guard can fail;
  - **after the edit**, it passes.
- `git grep -nE '^[^#]*(\$\(mktemp( -[dq]+)?\)|mktemp -t)' -- cli/templates/scripts` prints nothing. This is the story index's `## Scope register` D1, narrowed to this task's tree.
- `bash -n cli/templates/scripts/remote-run.sh` exits 0.
- `git diff -U0 -- cli/templates/scripts/remote-run.sh` shows only:
  - the 14 `mktemp` lines, each now carrying `"${TMPDIR:-/tmp}/remote-run.<function>.XXXXXX"` with `<function>` matching its enclosing function;
  - the two header-comment sentences.

  No fallback, bookkeeping or removal line appears in it.
