### Task 9 — Bring this repository's `scripts/run-test-suite.sh` level with the template

**Goal:** Give this checkout's own Run gates wrapper the detached run form. This branch's own Phase G, and every later run on this repository, can then collect a gate run that outlasts the Bash tool's background limit. `scripts/run-test-suite.sh` must hold exactly the bytes of `cli/templates/scripts/run-test-suite.sh` as Task 1 left it, with its executable mode kept.

**Depends on:** Task 1, which rewrites `cli/templates/scripts/run-test-suite.sh`. Its run form re-invokes the script itself as a detached worker under an environment marker, waits for `.running` to hold the worker's PID, and prints `pending`. Its header comments are rewritten too. Task 2 has proved that file. This task edits neither of them. It copies the template's result.

**This is the catch-all task, and why the file is edited here rather than through the forced `init`.** This repository has adopted its own harness, so `scripts/` is `init`'s output in this checkout (`.claude/context/conventions.md` → `## Documents of record`). `init` copies an outer-loop script byte for byte, as `cli/test/outer-loop-scripts.test.mjs` → *"the test-suite runner lands verbatim under scriptsDir, and a re-run keeps it"* asserts. So the self-adopt recipe (`docs/development.md` → *"Regenerating this repository's adoption after a `cli/templates/` change is one forced self-adopt run"*) has one outcome for this file: the template's bytes. On this branch's base the two files are byte-identical (blob `1a327742`), and this branch changes no other outer-loop script.

Producing that outcome directly leaves untouched the hand-kept files the recipe would overwrite and then restore: `.claude/CLAUDE.md`, the conventions documents under `.claude/context/`, and `githooks/pre-push`. That keeps this task clear of the conventions documents, which no task may target. An unattended run cannot use the recipe itself. Its `HARNESS_SELF_ADOPT=1 node cli/dist/cli.js init --force …` line is not in the run's permission profile, and the forced run writes `.claude/settings.json`, which the sandbox denies in every run copy. In a supervised session the recipe is an equally valid route: run it as `docs/development.md` gives it, then restore the hand-kept files as that section says. The verification below is the same either way.

### Targets

- `scripts/run-test-suite.sh`: replaced whole with the template's bytes.

**Work:**

- [ ] Write `scripts/run-test-suite.sh` with the exact content of `cli/templates/scripts/run-test-suite.sh`. Read the template first and write its bytes unchanged, including the trailing newline. Edit nothing by hand on top of it.
- [ ] Keep the file's mode `100755`, as `git ls-files -s scripts/run-test-suite.sh` shows it on the base. The template is stored `100644`, and `init` sets the mode from `OUTER_LOOP_SCRIPTS` (`mode: 0o755`), so the mode is not copied from the template.

**Verification:**

- `cmp cli/templates/scripts/run-test-suite.sh scripts/run-test-suite.sh` exits 0.
- `git diff --summary -- scripts/run-test-suite.sh` prints no `mode change` line.
- `git status --short` lists none of `.claude/CLAUDE.md`, `.claude/context/conventions.md`, `.claude/context/cli.md`, `.claude/context/plugin.md` or `githooks/pre-push`, and no `*.bak` file.
- `bash -n scripts/run-test-suite.sh` exits 0.
- No test is aimed at this repository's own `scripts/` (`.claude/context/conventions.md` → `## The testing bar`). Task 2's suite proves the behaviour against the template, and `cmp` above carries that proof to this copy. The Run gates phase then runs this copy itself, which is that phase's check, not this task's.
