`feat_gate12_sandbox_round_driver` adds a hand-run script that takes the job legs of Gate 12's sandbox series round. It plants each adversarial branch, dispatches its job, and grades the job logs and artifacts into one result line per row. Today every one of those legs is set up and read by hand. It does not take the measurements: nothing in this branch dispatches a real job.

It starts from a `dev` that carries `chore_sandbox_gate12_full_run_leg` (#195). Read what that branch wrote first:

- `docs/development.md` → **Gate 12** → **The sandbox series round (#170 step 4) — not yet run.**: its ten steps, **The owed checks** and **Departures**;
- the same section's observation **(xvi) The full-run leg: one task through `harness-run.yml`, end to end.**;
- `docs/sandbox-verification.md` → `## 10. The full-run leg and the Gate 12 sandbox round`: rows FR1–FR7, JS1, JS3, JS3N, JS4, SB2, SB3, SB4, RJ2 and RJ3, each with its **Expected** and **Read from** columns.

Those rows are the contract. The script grades a row on exactly what its **Read from** names, and prints the row's ID.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.**

## The model to follow

`scripts/sandbox-probe.sh`, with its library under `scripts/lib/sandbox-probe/`. It is hand-written for this repository, is not in the set `init --force` regenerates, and is not a `cli/templates/` file. It prints one result line per leg for the rows of `docs/sandbox-verification.md` and keeps evidence only for a leg that does not pass. The new script is the same kind of file and follows the same shape. It is not shipped to adopters.

## The goal

1. **A script, `scripts/gate12-sandbox-round.sh`**, run from the Gate 12 repository's root and naming that repository explicitly (`--repo <owner>/<name>`). It refuses to run against this repository, and against any repository that is not adopted at a version carrying `Install the sandbox prerequisites` in its `harness-run.yml`.
2. **`plant` for the adversarial legs (round step 7)**, each on its own throwaway branch cut from the default branch's tip, dispatched through `harness-run.yml` as the round gives it: JS1 (both the `.claude/settings.json` and the `<scriptsDir>/remote-run.sh` plumbing commits), JS4 (the `.npmrc` arm and the `node_modules/` arm), SB2 with its `remote_status.json` variant, SB3, SB4's bundle half, and RJ2. It records the branches it created and the run IDs it dispatched in one state file under the Gate 12 repository's `<stateDir>/scratch/`.
3. **`grade`**, after the jobs end: it reads each run's step logs (`gh run view --log`), downloads the `harness-state` artifact where the row reads one (`gh run download`), and prints `<row> pass|fail|not run|expired` with the evidence line that decided it. It follows `## 10.`'s **Reading a result.**: a step that did not run makes its row `not run`, and an expired artifact is `expired`, never a pass or an absence.
4. **`grade` for the full-run leg (round step 6)**, given the full run's branch. The run itself stays driven by hand, as observation (xvi) gives it. The script grades FR1–FR7 from that branch's runs and the committed `run-analytics.json`. A row whose **Read from** is a source file rather than a log, like FR1's `--settings` clause, is printed as `source`, with the file and symbol to read, and is not graded.
5. **The default-branch leg (round step 8)**, as its own subcommand: it records the repository's GitHub default branch, cuts and pushes `<other branch>` as step 8 gives it, switches the default, plants and dispatches JS3 and JS3N, and **restores the default branch on every exit path**, an interrupt included. A later `grade` takes JS3 and JS3N.
6. **`teardown`**: it deletes every branch the state file records and confirms the default branch is the recorded one. Resetting the repository to its seed stays the round's step 10, by hand.
7. **The gate names the script.** Round steps 6, 7 and 8, and observation (xvi), give the script's commands beside the hand steps they replace. A hand step stays where the script cannot take its row. RJ3 and the three `sandbox1h` checks stay hand steps.

## What the plan must settle first

Some plants must happen *inside* the job's session, not in a pushed commit: SB2's links may be either, but SB3's `stateDir` rewrite must be the session's uncommitted write, and JS3's stall needs lowered `STALL_WARN_SECS` / `STALL_KILL_SECS`. For each such row, the plan finds the route the shipped `harness-run.yml` and watcher already offer, for example a task prompt that asks the session to make the write, or a dispatch input. It cites the line that offers the route. Where no route exists without changing behaviour, the row stays a hand step, the gate says why, and the gap becomes a follow-up task prompt.

## Constraints

- **No measured result is invented.** `docs/sandbox-verification.md`'s rows stay *not yet measured*.
- **Nothing runs against GitHub in this branch.** The tests drive a `gh` stub, as gate 4's remote-execution cases do. Nothing runs in this repository, which cannot host its own remote runs (`docs/development.md` → **This repository cannot host its own remote runs.**).
- **No profile, generator, wrapper, guard, watcher or `harness-run.yml` behaviour changes**, and nothing under `cli/templates/`. A defect becomes a follow-up task prompt.
- **The Gate 12 repository is never deleted**, and the script deletes only the branches it created.
- `scripts/run-gates.sh` passes.
