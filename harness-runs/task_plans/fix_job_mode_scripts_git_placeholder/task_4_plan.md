### Task 4 — Inline the same placement in the four wrapper templates, held through `init` on a job-layout fixture

**Goal:** In job mode, a session's `bash <scriptsDir>/typecheck.sh` and `bash <scriptsDir>/test.sh` place their root and run with the placeholder at `<scriptsDir>/.git` in place (the task prompt's first acceptance bullet), and so does the gate worker's call of them through `commands.*`. The same holds for `start-dev-server.sh` and `deploy.sh`. These four are rendered by `cli/src/generators/scripts.ts`, source no library, and need no `jq`, so they carry the algorithm inline.

**Depends on:** Task 1. Its `hr_script_root` in `cli/templates/scripts/lib/harness-run-lib.sh` is the one statement of the algorithm, and its doc comment declares these four templates as its inline mirror. The algorithm, restated so this file stands alone:

1. Let `d` be the physical form of `$script_dir` (`pwd -P` after `cd -P`).
2. For `d`, then each parent of `d` up to and including `/`: when `$d/harness.config.json` is a regular file and `git -C "$d" rev-parse --show-toplevel` (stderr discarded) answers exactly `d`, that is the root.
3. When none does, fall back to today's `git -C "$script_dir" rev-parse --show-toplevel`.

The block never tests a `.git` entry. This task also imports Task 1's `cli/test/helpers/runner-git-shim.mjs`:

- `installRunnerGitShim(binDir)` makes `git -C <d> rev-parse --show-toplevel` die as the runner's git did (exit 128) when the first `.git` above `<d>` is a device or an empty file.
- `plantPlaceholder(path, 'empty-file' | 'device')` plants either shape.

### Targets

- `cli/templates/scripts/typecheck.sh`, `test.sh`, `start-dev-server.sh`, `deploy.sh`: the anchoring block under `# Anchor to the repository root`.
- `cli/test/wrapper-root-placement.test.mjs` (new).

**Work:**

- [ ] `typecheck.sh` and `test.sh`: replace `repo_root="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null)"` with the inline loop, keeping `if [ -z "$repo_root" ] || ! cd "$repo_root"; then harness_fail "{{name}}: could not resolve a repository root from '${script_dir}' (is git on PATH?)"` byte-identical. Constraints on the block:
  - It carries no `"$@"`, no `{{` and no external command but `git`. `wrapperCommandLine` keys on the `"$@"` line, and the generator renders `{{…}}`.
  - Its code lines are identical in the two files. `cli/test/init.test.mjs`'s header relies on these two templates differing only in their comments.
  - Extend the anchoring comment by one sentence: why the walk keys on `harness.config.json` (F15), and that the run library's `hr_script_root` is the same algorithm.
- [ ] `start-dev-server.sh` and `deploy.sh`: the same block in place of their own `repo_root="$(git -C "$script_dir" rev-parse --show-toplevel 2>/dev/null)"` line, their failure paths unchanged.
- [ ] `wrapper-root-placement.test.mjs`: a header stating the rule. **An `init`-written wrapper runs at its checkout's root in a job-layout checkout whose `<scriptsDir>/.git` is a placeholder, and at the same root as before everywhere else.** The header also names the substitutions, citing the helper. The fixture:
  - Built with `cli/test/helpers/fixture.mjs` and adopted through the compiled CLI's `init`.
  - `scriptsDir` `harness-scripts`.
  - `commands.typecheck` and `commands.test` raw lines that print `pwd` to a file under the case's out directory, so `init` renders them into the wrappers.
  - The shim first on `PATH`.
- [ ] `wrapper-root-placement.test.mjs`: the cases.
  - **(a)** With `harness-scripts/.git` an empty file, then a device, `bash harness-scripts/typecheck.sh` and `bash harness-scripts/test.sh` each print `PASS: …`, and the recorded `pwd` is the root. Run them once from the root and once from a subdirectory.
  - **(b)** The same with `scriptsDir` `tools/harness` and a placeholder at both levels.
  - **(c)** With no placeholder, the answer is the root, as before.
  - **(d)** A copy of a rendered wrapper outside any repository prints its `could not resolve a repository root` line and exits 1, with no verdict line.
  - **(e)** `doctor`'s `command-wrappers` check still reads each rendered wrapper's command line. Run `doctor` on the fixture and assert the check does not report an unrecognised line.

**Verification:**

- `cli/test/wrapper-root-placement.test.mjs` passes. With `typecheck.sh`'s old line restored, case (a) fails under the shim. Check this once with a throwaway revert, then restore.
- Strip the `#` lines from `typecheck.sh` and from `test.sh`, and the two remaining bodies are identical.
- `git grep -n 'rev-parse --show-toplevel' -- cli/templates/scripts/typecheck.sh cli/templates/scripts/test.sh cli/templates/scripts/start-dev-server.sh cli/templates/scripts/deploy.sh` shows each occurrence inside the new block, never a bare `git -C "$script_dir"` placement line outside the fallback.
