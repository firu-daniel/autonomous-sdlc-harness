### Task 1 — Add `hr_script_root`, which places a script's root from the nearest confirmed `harness.config.json` ancestor, and the runner-git test shim

**Goal:** Give the run library one function that places the repository root of a script from the script's own directory without asking git to discover upward from that directory, so that a placeholder `.git` at a scripts-directory level (F15) never decides the answer. Also give the test suite one seam that answers as the runner's git did for a placeholder `.git`, so that no suite's verdict depends on the host's git version.

**Where this task stops.** This task adds the function and the seam, and switches no caller. **Task 2** switches `run-test-suite.sh` and `scratch-run.sh`, **Task 3** switches the six other library-sourcing scripts, **Task 4** inlines the same algorithm in the four wrapper templates, which source no library, and **Task 5** uses the shim in the launcher suite. Tasks 2, 4 and 5 import the shim from the helper this task creates. Task 2 and Task 3 call the function by the exact contract below.

### Targets

- `cli/templates/scripts/lib/harness-run-lib.sh`: the new function `hr_script_root`, its doc comment, and its lines in the header's `REPRO` block.
- `cli/test/helpers/runner-git-shim.mjs` (new): the runner-git shim and the placeholder planter.
- `cli/test/script-root.test.mjs` (new): the function's suite.

**The contract Tasks 2 and 3 call — `hr_script_root <script_dir>`:**

1. Let `d` be the physical form of `<script_dir>` (`CDPATH= cd -P -- <script_dir>` then `pwd -P`). If it does not resolve, return 1 and print nothing.
2. For `d`, then each parent of `d` up to and including `/`: when `$d/harness.config.json` is a regular file, run `git -C "$d" rev-parse --show-toplevel` with stderr discarded. If its output equals `d` byte for byte, print `d` and return 0. Otherwise keep walking. A candidate whose git answer is another directory, or is an error, is passed over.
3. When no directory confirms, return `hr_repo_root "<script_dir>"`'s output and status unchanged. That is today's answer, so a layout without a configuration file is placed exactly as before.

It never reads, tests or classifies a `.git` entry itself, and it judges no trust shape. It sets no shell option and no global (the library's rule: a sourced library leaves the shell as it found it). It uses nothing below bash 3.2. The probe stays the bare `rev-parse --show-toplevel` spelling `hr_repo_root` already uses.

**Work:**

- [ ] `harness-run-lib.sh`: add `hr_script_root` beside `hr_repo_root` in the *Resolution* section, implementing the contract above.
- [ ] `harness-run-lib.sh`: write the doc comment. It must say four things:
  - **Why it exists.** F15: on a bubblewrap host the base profile's exact `<scriptsDir>/.git` entry is a placeholder inside both sandboxes, and git's discovery from the scripts directory dies on it. Cite `cli/src/generators/writeProtection.ts` → `protectedPaths`.
  - **Why the walk keys on `harness.config.json`.** A script that cannot read the configuration still learns its depth this way.
  - **Why a planted `harness.config.json` in the scripts directory cannot move the answer.** Confirming that candidate needs a `.git` there, and the profile write-protects `<p>/.git` at every scripts-directory level, as it already does for `hr_wrapper_main_of`.
  - **The declared mirror.** The four wrapper templates `typecheck.sh`, `test.sh`, `start-dev-server.sh` and `deploy.sh` carry the same algorithm inline because they source no library. A change here is an edit there in the same change.

  Add `hr_script_root` lines to the header's `REPRO` block: a job layout with a placeholder, and the no-configuration fallback.
- [ ] `runner-git-shim.mjs`: export `installRunnerGitShim(binDir)`. It resolves the real `git` to an absolute path at install time, then writes an executable `git` into `binDir` that does the following:
  - It appends its argv, one line per call, to `<binDir>/git-calls.txt`.
  - For `-C <d> rev-parse --show-toplevel` only, it walks from `<d>` upward to the first directory whose `.git` exists or is a link. If that entry, links followed, is neither a directory nor a regular file, it prints `fatal: not a regular file` on stderr and exits 128. If it is a regular file of size 0, it prints `fatal: invalid gitfile format: <path>` and exits 128.
  - Otherwise, and for every other call, it `exec`s the real git with the original argv.

  The function returns `{ callsFile }`. Also export `plantPlaceholder(path, shape)`, where `shape` is `'empty-file'` (a 0-byte, mode `0444` regular file, the host leftover's shape) or `'device'` (a symbolic link to `/dev/null`, the character-device stand-in: a test cannot `mknod` without root). The helper's header states both substitutions and why they exist: the runner's git measured in round 14 dies on both shapes, while a local git may pass over a `/dev/null` link.
- [ ] `script-root.test.mjs`: a header stating the rule. **A script's root is the nearest ancestor holding `harness.config.json` that `git -C` confirms as its own top, whatever stands at `<scriptsDir>/.git`; `hr_wrapper_main_of`'s answers are unchanged.** The header also states what is substituted, citing the helper. Build fixtures under `os.tmpdir()` with `cli/test/helpers/fixture.mjs`, source the template library, and run every case under the shim. The cases:
  - **(a) Job layout.** `scriptsDir` `harness-scripts`; `harness-scripts/.git` absent, an empty file, then a device. Each answer is the root.
  - **(b) Nested `scriptsDir`.** `tools/harness`, with a placeholder at both levels. The answer is the root.
  - **(c) The clone layout and a linked worktree.** Each answers its own checkout, as `hr_repo_root` does.
  - **(d) `scriptsDir` `.`.** The answer is the root.
  - **(e) No `harness.config.json` anywhere.** The answer equals `hr_repo_root`'s, and is a refusal (status 1, nothing printed) under a placeholder.
  - **(f) A planted `harness-scripts/harness.config.json`.** The answer is still the root.
- [ ] `script-root.test.mjs`: the acceptance case "a planted `<scriptsDir>/.git` still cannot move an unsandboxed wrapper's main checkout". `hr_wrapper_main_of <root>/harness-scripts` refuses (status 1) for the empty-file and device shapes. For a planted directory `.git` holding no `commondir`, it answers `harness-scripts`, which is today's answer and the redirect the profile's `entry` protection exists to stop. The case asserts that answer, so that any change to the function shows up. It also asserts that `protectedPaths` still lists `<root>/harness-scripts/.git` with kind `entry`, through the compiled CLI's `init` output in the fixture's generated `.claude/settings.autonomous.json` → `sandbox.filesystem.denyWrite`.

**Verification:**

- `cli/test/script-root.test.mjs` passes. Case (a)'s device and empty-file shapes fail under the shim when `hr_repo_root` is called in place of `hr_script_root`. Check this once by hand during the unit with a throwaway edit, then revert it: it proves the shim reproduces F15.
- `git diff` of `harness-run-lib.sh` touches no line of `hr_wrapper_main_of`, `hr_checkout_top_nogit`, `hr_main_checkout_of`, `hr_gitdir_nogit` or `hr_common_dir_nogit`.
- The function contains no `[ -f …/.git ]`, `[ -d …/.git ]` or other `.git` test.
