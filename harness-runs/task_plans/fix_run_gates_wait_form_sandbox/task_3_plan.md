### Task 3 — Bring this repository's `scripts/run-test-suite.sh` level with the template

**Goal:** Give this checkout's own Run gates wrapper the heartbeat fix, so the next unattended run on this repository collects its verdicts under the sandbox. `scripts/run-test-suite.sh` must hold exactly the bytes of `cli/templates/scripts/run-test-suite.sh` as Task 1 left it, with its executable mode kept.

**Depends on:** Task 1, which rewrites `cli/templates/scripts/run-test-suite.sh`: its header below line 22, the constants block, `run_alive`, and the run form's gates through the new `run_gate`, plus a `TERM`/`INT`/`HUP` trap. Task 2 has proved that file. This task edits neither of them. It copies the template's result.

**Why this file is edited here, and why not through the forced `init`.** This repository has adopted its own harness, so `scripts/` is `init`'s output in this checkout (`.claude/context/conventions.md` → `## Documents of record`). `init` copies an outer-loop script byte for byte. `cli/test/outer-loop-scripts.test.mjs` → *"the test-suite runner lands verbatim under scriptsDir, and a re-run keeps it"* asserts this. So the self-adopt recipe (`docs/development.md` → *"Regenerating this repository's adoption after a `cli/templates/` change is one forced self-adopt run"*) has one outcome for this file: the template's bytes. On this branch's base, `scripts/run-test-suite.sh` is the only outer-loop script whose copy would differ from its template once Task 1 lands. Every other `cli/templates/scripts/*.sh` and `lib/*.sh` copy already matches, apart from the rendered `test.sh` and `typecheck.sh`, which the recipe carries through by hand-set line anyway.

Producing that outcome directly means the hand-kept files the recipe overwrites and then restores are never touched. Those are `.claude/CLAUDE.md`, `.claude/context/conventions.md`, `.claude/context/cli.md`, `.claude/context/plugin.md` and `githooks/pre-push`. That also keeps this task clear of the conventions documents, which no task may target. An unattended run cannot use the recipe itself. Its `HARNESS_SELF_ADOPT=1 node cli/dist/cli.js init --force --no-analyze --non-interactive` is not in the run's permission profile. The forced run would also write `.claude/settings.json`, which the sandbox's `denyWrite` refuses in every run copy, so it would stop partway.

**In a supervised session that can run the recipe**, the recipe is an equally valid route. Run it as `docs/development.md` gives it, dry run first. Then run that section's `git restore --source=HEAD -- githooks/pre-push .claude/CLAUDE.md .claude/context/conventions.md .claude/context/cli.md .claude/context/plugin.md`. The verification below is the same either way.

### Targets

- `scripts/run-test-suite.sh`: replaced whole with the template's bytes.

**Work:**

- [ ] Write `scripts/run-test-suite.sh` with the exact content of `cli/templates/scripts/run-test-suite.sh`. Read the template first and write its bytes unchanged, including the trailing newline. Edit nothing by hand on top of it.
- [ ] Keep the file's mode `100755`, as `git ls-files -s scripts/run-test-suite.sh` shows it on the base. The template is stored `100644` (`cli/templates/scripts/`), and `init` sets the mode from `OUTER_LOOP_SCRIPTS` (`mode: 0o755`), so the mode is not copied from the template.

**Verification:**

- `cmp cli/templates/scripts/run-test-suite.sh scripts/run-test-suite.sh` exits 0.
- `git diff --summary -- scripts/run-test-suite.sh` prints no `mode change` line.
- `git status --short` lists none of `.claude/CLAUDE.md`, `.claude/context/conventions.md`, `.claude/context/cli.md`, `.claude/context/plugin.md` or `githooks/pre-push`, and no `*.bak` file.
- `bash -n scripts/run-test-suite.sh` exits 0.
- No test is aimed at this repository's own `scripts/` (`.claude/context/conventions.md` → `## The testing bar`, *"no test is ever aimed at this repository"*). The wrapper's behaviour is Task 2's proof against the template, and `cmp` above carries that proof to this copy. The Run gates phase then runs this copy itself, which is that phase's check, not this task's.
