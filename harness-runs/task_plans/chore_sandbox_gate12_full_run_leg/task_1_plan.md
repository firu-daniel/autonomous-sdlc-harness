### Task 1 — Add `docs/sandbox-verification.md` §10, the full-run leg's and the round's rows, all *not yet measured*

**Goal:** Give every sandbox check of the Gate 12 sandbox series round its own row in `docs/sandbox-verification.md`. The rows go in a new `## 10. The full-run leg and the Gate 12 sandbox round`, beside the runner section sandbox3b2 named. Each row states its expectation, its source check, the round step that takes it and where its result is read from, and reads *not yet measured*. Two existing sentences are repointed from the branch name to that section.

**Where this task stops.** This task writes the **rows**: what each check expects and where its result will be recorded. The gate procedure that takes them is **Task 2's**: Gate 12 observation **(xvi) The full-run leg: one task through `harness-run.yml`, end to end.** and the block **The sandbox series round (#170 step 4) — not yet run.** in `docs/development.md`. This task cites both by those exact bold leads and writes no procedure, no commands and no fenced block. The `sandbox1h` checks (`init`, `restart-watcher.sh`) are not sandbox rows and get **no** row here; they are Task 2's and Task 4's. The runner legs keep their §9 rows unchanged.

### Targets

- `docs/sandbox-verification.md`: the new `## 10.` section after §9's table, §9's **What this section is.** paragraph, and the opening **Since then.** paragraph.

**Inputs to read first:**
- the task prompt `harness-runs/task_prompts/chore_sandbox_gate12_full_run_leg_task_prompt.md`, sections `## The goal`, `## The owed checks` and `## The round's order`, which are the source of every expectation below;
- `docs/sandbox-verification.md` → `## 9. The GitHub-hosted runner legs`, whose section shape (**What this section is.**, **Stamp.**, **Reading a … result.**, then a table) §10 copies;
- `docs/remote-execution.md` → `## 11. Security` → **The branch's own files are checked before the job trusts them.**, for the step names and the `remote-run.sh sync` recording rule the JS and SB rows restate;
- the shipped sources each FR row's **Read from** rests on: `cli/templates/github/workflows/harness-run.yml` (the step names `Run the harness`, `Install the sandbox prerequisites`, `Preflight with doctor`, `Push the branch`, `Refuse a branch that changed the job's own files`, `Record the default branch's commit`, `Save the state bundle`, `Restore the previous job's state`) and `cli/templates/scripts/autonomous-watcher.sh` (`run_profile_check`, the `not launching` log lines, the launch line's `--settings`).

**Work:**

- [ ] **Open §10 with a section intro.** Add `## 10. The full-run leg and the Gate 12 sandbox round` directly after §9's table, separated by the file's `---` rule as the other sections are. Then add three paragraphs:
  - **What this section is.** These are the rows the round in `docs/development.md` → **Gate 12** → **The sandbox series round (#170 step 4) — not yet run.** takes: the full-run leg, observation **(xvi)**, and the sandbox series' owed remote checks. They are taken at the release that round cuts, and never in this repository (`docs/development.md` → **This repository cannot host its own remote runs.**). The runner legs are §9's. The `init` and `restart-watcher.sh` checks are recorded where their own documents keep them: `docs/cli.md` §3 and §5, `docs/outer-loop-verification.md` §1.5, and `docs/development.md`'s regeneration block.
  - **Stamp.** *To be filled by the person who takes the rows*, naming each field: the date, the CLI `<version>` released, the `claude` version the job installed, the Gate 12 repository's seed commit, the `harness run <branch>` run ids, and the runner image (`ImageOS`, `ImageVersion`) from the job log.
  - **Reading a result.** Each bullet below is a rule:
    - A row is graded on what the named log line, artifact or ref shows.
    - A step that did not run makes its row `not run`, never a pass.
    - An expired `harness-state` artifact is recorded as expired, and the step is re-taken.
    - A refusal at the permission layer is quoted from the source the row names.
- [ ] **Add the full-run leg's rows, FR1–FR7.** Use the columns `| # | Check | Source check | Round step | Expected | Read from | Observed | Verdict |`, with **Observed** and **Verdict** both reading `**not yet measured.**` / `not yet measured`, as §9's rows do. Every row's Round step is 6, observation (xvi). Every row's Expected copies the prompt's text without loosening it.
  - **FR1** — the job cuts no copy, renders no per-run copy, writes nothing under the machine state directory, and `run_profile_check` passes on the base profile, which is passed unchanged as `--settings`. Source checks: goal 1, first bullet, and `sandbox1e4` §10 item 1.
  - **FR2** — `Install the sandbox prerequisites` on the hosted runner: what it installs, and that `Preflight with doctor` then passes. Source checks: goal 1, second bullet, and `sandbox2`. Cite §9 IS1–IS4 as the probe's view of the same step.
  - **FR3** — every commit and push goes through the wrappers, and no sandboxed git write is refused in a way that stops the run. Source check: goal 1, third bullet.
  - **FR4** — the `permission_denials` of the calls the flow needs, each quoted. Source check: goal 1, fourth bullet.
  - **FR5** — an honest branch passes `Refuse a branch that changed the job's own files`, and `Record the default branch's commit` writes `HARNESS_GITHUB_DEFAULT_COMMIT` and `HARNESS_DEFAULT_BRANCH_COMMIT`. Source check: `sandbox1c` §2.
  - **FR6** — the honest job's `Save the state bundle` prints `saved the bundle of <branch>` and no `skipped` line, with the same layout and bytes as its sources. The next job logs `restored the bundle of run <id>` and `placed <n> planning file(s)`. Source check: `sandbox1c2` §1.
  - **FR7** — the parked run, answered through `/autonomous-sdlc-harness:branch-answer`'s GitHub route, resumes in answer mode. If the round's `test_run_logs/…log` is not in the restored bundle, the architecture gate still passes on the index's quoted failure lines rather than returning a blocker. Source check: `sandbox2d` §7.

  **Read from** for each row is exactly the text below. It is the contract the story index's `## Context` → **Shared anchors** fixes, and Task 2's observation (xvi) restates it byte for byte, so write it unaltered:
  - **FR1**: observation (xvi): the `Run the harness` step log, whose watcher launch line carries `--settings`, with `run_profile_check` passing and no `not launching` line.
  - **FR2**: observation (xvi): the `Install the sandbox prerequisites` and `Preflight with doctor` step logs.
  - **FR3**: observation (xvi): the `Run the harness` and `Push the branch` step logs.
  - **FR4**: observation (xvi): the committed `<stateDir>/run_analytics/<branch>/run-analytics.json`, whose per-call records carry `permission_denied`, beside the `Run the harness` step log. No shipped surface carries the denied call's input off the runner (`docs/cli.md` §6, residual 1, item 5).
  - **FR5**: observation (xvi): the `Refuse a branch that changed the job's own files` and `Record the default branch's commit` step logs.
  - **FR6**: observation (xvi): the first job's `Save the state bundle` step log and the next job's `Restore the previous job's state` step log.
  - **FR7**: observation (xvi): the resumed job's `Run the harness` step log and the committed index.

  The FR4 row also states why the input is absent: the raw `.stream.jsonl` stays on the runner, outside the bundle. A step name or symbol the shipped source does not carry is a defect to name in this unit's return, never a reason to change the text above.
- [ ] **Add the adversarial and local rows: JS1, JS3, JS3N, JS4, SB2, SB3, SB4, RJ2, RJ3.** Use the same columns. Each row's **Expected** is the prompt's own text for that check under `## The owed checks`, quoted or closely carried, with every literal kept byte for byte (`::error::`, `pause_reason: killed`, `skipped <path>: <linked> is a symbolic link`, `remote-run.sh: save: skipped …`, `trusted configuration at <commit> names '<trusted>'; using '<trusted>'`, `not launching`). Each **Source check** names the private checks file's id and section, for example `sandbox1c §1`.
  - **Round step 7**, the adversarial legs on their own throwaway branches: JS1, JS4, SB2, SB3, SB4 and RJ2.
  - **Round step 8**, the default-branch leg: JS3 (the positive arm) and JS3N (the negative arm).
  - **Round step 9**, the local leg from a mirror: RJ3.
  - **JS4**: the `Bootstrap the checkout` residual is the known residual (`docs/cli.md` §6, residual 1), not a failure.
  - **SB2**: carries the `autonomous_logs/remote_status.json` variant inside the row.
  - **SB4**: carries its optional half, the throwaway `actions/upload-artifact` workflow and the `sleep 600 &` background-process check, marked optional and *not yet measured*.
- [ ] **Repoint the two existing sentences.**
  - In §9's **What this section is.**, replace *"The full run on the real job is not this section's: it is `chore_sandbox_gate12_full_run_leg`'s."* with a sentence naming §10 and Gate 12's observation (xvi) as where the full run's rows live. The rest of that paragraph, including *"this heading keeps its name when the rows are filled"*, is unchanged.
  - In the opening **Since then.** paragraph, after *"§9 holds the rows the probe's job mode takes on a GitHub-hosted runner, all owed."*, add one sentence: §10 holds the full-run leg's and the Gate 12 sandbox round's rows, all *not yet measured*.

**Verification:**

- `git grep -n "^## 9. The GitHub-hosted runner legs" docs/sandbox-verification.md` still matches, and `git grep -n "^## 10. The full-run leg and the Gate 12 sandbox round" docs/sandbox-verification.md` matches once, after it.
- `git grep -n -E "^\| (FR|JS|SB|RJ)[0-9]" docs/sandbox-verification.md`: every row it lists carries `not yet measured` in both its Observed and its Verdict cell. Its id set is exactly FR1–FR7, JS1, JS3, JS3N, JS4, SB2, SB3, SB4, RJ2 and RJ3, with no other id and no duplicate.
- Each FR row's **Read from** cell matches the story index's **Shared anchors** list for that id, and every step name it quotes is found by `git grep -n -F "<step name>" cli/templates/github/workflows/harness-run.yml`.
- `git grep -n "chore_sandbox_gate12_full_run_leg" docs/sandbox-verification.md` reports no hit. Every reference to the leg now names §10 or observation (xvi).
- No line in the new section carries a line-number citation, an absolute machine path or a home directory spelled out. No `pass`, `fail` or measured figure appears in an Observed or Verdict cell.
