### Task 3 — Update the CLI-side descriptions of the wrapper and its log

**Goal:** Make the four adopter-facing and package-facing READMEs under `cli/` say what `run-test-suite.sh` now does: it runs the whole-tree `commands.typecheck` and `commands.test` once each per Run gates round, into one log with a per-gate section, behind one verdict line.

**Depends on:** Task 1, which fixes the behaviour these documents describe:

- one invocation runs `commands.typecheck` (no path argument) and then `commands.test`, each exactly once, and the test runs even when the typecheck failed;
- one verdict, `pass` or `fail <log path>`, which is `pass` only when both pass;
- one log per round at `<state_dir>/test_run_logs/<sanitized branch>/<label>.log`, holding the typecheck output and then the test output, each between the marker lines `== run-test-suite.sh: gate <typecheck|test> (commands.<key>) ==` and `== run-test-suite.sh: gate <key> exited <status> ==`;
- `commands.typecheck` = `<none>` is logged as `== run-test-suite.sh: gate typecheck not run: commands.typecheck is <none> ==` and never fails the round.

This task describes that behaviour and changes none of it.

**What this task does not touch.** This repository's own `harness-runs/test_run_logs/README.md` is the `init`-written copy of `cli/templates/state-dir/test_run_logs/README.md`, byte-identical today. This task edits the template only. Task 12 (catch-all layer) copies this task's finished template bytes over that copy, so write the template as the final text; do not edit the `harness-runs/` copy here. Likewise this repository's `harness-runs/README.md` is the (drifted, not byte-identical) `init`-written copy of `cli/templates/state-dir/README-root.md`; this task edits the template only, and Task 12 applies the same replacement clause to the copy.

### Targets

- `cli/templates/state-dir/test_run_logs/README.md`: the file an adopter receives as that directory's contract.
- `cli/templates/scripts/README.md`: the outer-loop family paragraph's `run-test-suite.sh` clause.
- `cli/README.md`: the template-tree paragraph's "the test-suite runner (`run-test-suite.sh`)".
- `cli/templates/state-dir/README-root.md`: the gitignore paragraph's `test_run_logs/` clause ("the full output of each test-gate run").

**Work:**

- [ ] `test_run_logs/README.md`: replace "holding the full output of one run of the configured test command" with the two-gate wording. Each log holds the whole-tree `commands.typecheck` output and then the `commands.test` output, each under a marker line naming the gate, closed by a marker giving its exit status, or a not-run line for `<none>`. In the second paragraph, keep "written by … `run-test-suite.sh`, and by nothing else" and the orchestrator-never-reads sentence. Add that the test fix-plan writer tells a static failure from a test failure by which gate's section closed non-zero.
- [ ] `scripts/README.md`: rewrite the `run-test-suite.sh` clause ("runs the configured test command, writes its output to a per-round log … and prints only `pass` or `fail <log path>`") so that it says the script runs the whole-tree type check and the test command, and keep the rest of the sentence. Then add a sentence explaining that the outer-loop scripts are written `create-if-absent`, so an already-wired repository picks up a changed one only by re-running `init` with `--force`, which takes a `.bak` of each file it overwrites first. Follow that sentence with the command itself, **in a fenced block on a line of its own**, in the form an adopter runs it from the repository root:

  ````
  ```
  npx autonomous-sdlc-harness init --force
  ```
  ````

  The prose names the flag and explains the policy; it does not carry the command inline (`harness-runs/lessons.md` → `## Adopter-facing documentation`: every command an adopter is meant to run sits in a fenced block, one command per line).
- [ ] `cli/README.md`: change "the test-suite runner (`run-test-suite.sh`)" to name it as the Run gates wrapper that runs both configured verification commands. Keep the file name.
- [ ] `cli/templates/state-dir/README-root.md` (register row 43): in the gitignore paragraph, replace the clause "and the full output of each test-gate run, one log per round, under `<state_dir>/test_run_logs/`" with exactly "and the full output of each Run gates round, the whole-tree type check and then the test suite, one log per round, under `<state_dir>/test_run_logs/`". Change nothing else in the file; in particular leave the `scratch/` clause's "with the directories the branch commands' GitHub route fetches …" text as it is. Task 12 applies this same replacement clause, verbatim, to this repository's own `harness-runs/README.md`, so the clause above is the wire between the two tasks.

**Verification:**

- `git grep -nE 'configured test command|test-suite runner' -- cli/README.md cli/templates/scripts/README.md cli/templates/state-dir/test_run_logs/README.md` prints no line that describes the wrapper as running only `commands.test`.
- The register's derivation command (story index → `## Scope register`) still reaches these four paths (the README-root one through its `test_run_logs` pattern), as expected, since the script name and the directory name stay. Every `cli/templates` hit outside them is a register row marked `no-change`.
- The wording matches Task 1's header contract word for word on the marker-line shape and the `<none>` line.
- `git grep -n 'test-gate' -- cli/templates/state-dir/README-root.md` prints nothing, and `git grep -n 'each Run gates round, the whole-tree type check and then the test suite' -- cli/templates/state-dir/README-root.md` prints the one replaced clause. `git diff -- cli/templates/state-dir/README-root.md` touches only that clause.
- Every command an adopter is meant to run that these edits add (here, `npx autonomous-sdlc-harness init --force` in `cli/templates/scripts/README.md`) sits in a fenced block, one command per line, per the lessons ledger's adopter-facing documentation rule. An inline mention of the `--force` flag that is not an instruction to run is fine.

**Deviations from plan:**

- `cli/templates/scripts/README.md`: the family list's "the test-suite runner `run-test-suite.sh`" also matched the verification grep's `test-suite runner` pattern; renamed it "the Run gates wrapper `run-test-suite.sh`" to match the `cli/README.md` wording, so the grep prints nothing in the three files.
- The `create-if-absent` / `--force` sentence and its fenced command are appended at the end of the outer-loop family paragraph rather than directly after the `run-test-suite.sh` clause, because a fenced block cannot sit mid-paragraph.
