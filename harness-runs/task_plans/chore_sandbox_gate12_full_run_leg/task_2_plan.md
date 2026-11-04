### Task 2 — Write Gate 12 observation (xvi), the full-run leg, and the sandbox series round into `docs/development.md`

**Goal:** Write the full-run leg into Gate 12 as observation (xvi), and write the round that folds in the sandbox series' remote and after-the-release checks, both into `docs/development.md` → `## 5. Verifying a change`. Observation (xvi) is the procedure for one task run end to end through `harness-run.yml` on `firu-daniel/harness-gate12`, with each thing it shows, its expected result and where that result is read from. The round is ten ordered steps that one release and one reset of the Gate 12 repository take. Point Gate 15's two runner-legs sentences and the regeneration block at the round. Nothing is run, and no result is recorded.

**Depends on:** Task 1, which adds `docs/sandbox-verification.md` → `## 10. The full-run leg and the Gate 12 sandbox round` with rows FR1–FR7, JS1, JS3, JS3N, JS4, SB2, SB3, SB4, RJ2 and RJ3. This task cites that section and those ids exactly. Task 1 states each row's expectation. This task carries the one-line expectation in the gate, as the prompt requires, and says where each result goes. The "read from" of each FR row is the fixed contract below (the story index's **Shared anchors** list, which Task 1's §10 rows carry); (xvi) writes it unaltered. A step name or symbol the shipped source does not carry is a defect named in this unit's return, never a reason to change the text.

### Targets

- `docs/development.md`, in five places:
  - **Gate 12**'s opening paragraph;
  - a new observation after **(xv)**'s block and before Gate 12's **Teardown.**;
  - a new round block after **Round 12**'s closing paragraph and before **Setup.**;
  - **Gate 15**'s **The GitHub-hosted runner legs, in the Gate 12 repository.** and **The rows this probe does not take, named so the list is complete.**;
  - the **Regenerating this repository's adoption after a `cli/templates/` change** block.

**Inputs to read first:**
- the task prompt `harness-runs/task_prompts/chore_sandbox_gate12_full_run_leg_task_prompt.md`, every section, since this task carries it into the gate;
- `docs/development.md` → **Gate 12**, from its opening through **Setup.**, (ii), (xi), (xv), **Teardown.** and **Where the results go.**, for the voice, the `<version>` / `<scriptsDir>` / `<stateDir>` placeholders and the fenced-block style;
- **Gate 15** → *The GitHub-hosted runner legs, in the Gate 12 repository* through *The rows this probe does not take*;
- `docs/remote-execution.md` → `### Upgrading` and `## 11. Security` → **The branch's own files are checked before the job trusts them.**;
- the shipped sources each "read from" rests on: `cli/templates/github/workflows/harness-run.yml` (step names), `cli/templates/scripts/autonomous-watcher.sh` (`run_profile_check`, the `not launching` log lines, the job-mode `--add-dir` log line, the launch line's `--settings`), and `cli/templates/scripts/lib/run-analytics.jq` → `finalize` (the per-call `permission_denied` field). Also `docs/watcher.md` → *Run analytics*, for where the record is committed.

**Work:**

- [ ] **Add observation (xvi).** Place it after (xv)'s block (its **What it settles.** paragraph) and before **Teardown.** Open it with the bold lead **`(xvi) The full-run leg: one task through `harness-run.yml`, end to end.`** Then cover:
  - **Preconditions:** the release, the 0.6.7-then-`<version>` adoption and the upgrade, all from the round's steps 1–4.
  - **The drop:** a small task that leaves one decision undecided, so the task-plan writer parks. It is dropped with `/autonomous-sdlc-harness:branch-prompt` and dispatched with one `tick`, as (ii) is, on an honest branch.
  - **The park:** answered through `/autonomous-sdlc-harness:branch-answer`'s GitHub route, as (xi) is. The run then goes on to "branch ready for review".
  - **What it shows:** each thing below with its expected result and where it is read from (step log by step name, `gh run view <id> --log`, the `harness-state` artifact, a committed file on the branch):
    - goal 1's four bullets (FR1–FR4);
    - `sandbox1e4` §10 item 1 (FR1);
    - the `sandbox2` install step (FR2);
    - `sandbox1c` §2 (FR5);
    - `sandbox1c2` §1 (FR6), whose first job parks;
    - `sandbox2d` §7 (FR7).
  - **The "read from" contract**, written byte for byte as below for each id:
    - **FR1**: observation (xvi): the `Run the harness` step log, whose watcher launch line carries `--settings`, with `run_profile_check` passing and no `not launching` line.
    - **FR2**: observation (xvi): the `Install the sandbox prerequisites` and `Preflight with doctor` step logs.
    - **FR3**: observation (xvi): the `Run the harness` and `Push the branch` step logs.
    - **FR4**: observation (xvi): the committed `<stateDir>/run_analytics/<branch>/run-analytics.json`, whose per-call records carry `permission_denied`, beside the `Run the harness` step log. No shipped surface carries the denied call's input off the runner (`docs/cli.md` §6, residual 1, item 5).
    - **FR5**: observation (xvi): the `Refuse a branch that changed the job's own files` and `Record the default branch's commit` step logs.
    - **FR6**: observation (xvi): the first job's `Save the state bundle` step log and the next job's `Restore the previous job's state` step log.
    - **FR7**: observation (xvi): the resumed job's `Run the harness` step log and the committed index.
  - **Citing the source:** every "read from" cites the shipped source it rests on, by step name or symbol. For FR4, say plainly what is and is not read:
    - the per-call records with `permission_denied: true` in the branch's committed `<stateDir>/run_analytics/<branch>/run-analytics.json`, quoted whole;
    - the denied call's input, which no shipped surface carries off the runner, because `<branch>.stream.jsonl` is not a bundle source. A leg that needs it records that, never a guess.

  Every command sits in a fenced block, one per line. Close (xvi) with **Where its results go.**: `docs/sandbox-verification.md` §10 rows FR1–FR7, and the `docs/remote-execution.md` records Task 3 repoints.
- [ ] **Add the round block.** Place it after **Round 12**'s last paragraph (*"The round's teardown kept its GitHub evidence …"* and the line after it) and before **Setup.** Open it with the bold lead **`The sandbox series round (#170 step 4) — not yet run.`**
  - **Scope.** State it as the prompt does: the round is scoped to the sandbox series. Gate 12's other observations, (xiii) and (xiv) among them, are not part of it, as earlier rounds stated their own scope.
  - **The ten steps.** Number them 1–10 in the order of the prompt's `## The round's order`, each with its reason:
    - step 1 is `bash scripts/release.sh <version>`, cross-referencing `## 7. Releasing`;
    - step 3 is adoption at 0.6.7 first, with one changed state-dir README;
    - step 4 cites `docs/remote-execution.md` → `### Upgrading` and **Setup.**'s `workflow` scope and `--no-verify` push;
    - step 5 is the runner legs, citing Gate 15's runner block;
    - step 6 is observation (xvi);
    - step 8 is last of the job legs;
    - step 10 is clean-up, citing **Teardown.**: the default branch restored, the throwaway branches deleted, the repository reset to its seed and never deleted.
  - **Each owed check.** Name it by its private source file and section, as the prompt names it (`sandbox1c` §1, … `sandbox1h` §3). Give the one-line expectation the prompt gives, its round step, and its row: the §10 id, or for `sandbox1h` §1–§3 the `docs/cli.md` / `docs/outer-loop-verification.md` / regeneration-block site.
  - **`sandbox1h` §3's Linux arm.** State that it is marked *not run* where no systemd host is available.
  - **Departures.** State that the round changes no profile, generator, wrapper, guard, watcher or `harness-run.yml` behaviour. A defect a step finds is recorded with its command and exact message, and becomes a follow-up task prompt, never a fix inside the round.
- [ ] **Fix Gate 12's count sentence.** Replace *"Fourteen observations, after a setup that is itself the first."* with wording that states no number the observation list can contradict, for example *"Observations (i) to (xvi), after a setup that is itself the first."* No other sentence of that paragraph changes.
- [ ] **Repoint Gate 15's two runner-legs sentences.**
  - In **The GitHub-hosted runner legs, in the Gate 12 repository.**, keep the release and 0.6.7 facts and the ``(#195)`` reference. Make the "that step's one Gate 12 round" clause name **The sandbox series round (#170 step 4) — not yet run.** and its step 5.
  - In **The rows this probe does not take, named so the list is complete.**, replace *"the full run on the real job stays owed on `chore_sandbox_gate12_full_run_leg`"* with the full run being Gate 12's observation (xvi), its rows in `docs/sandbox-verification.md` §10, not yet measured.
- [ ] **Add the adopter-side notes to the regeneration block.**
  - After **The two wrappers keep their hand-set lines.** (*"An adopter's `--force` still re-renders both wrappers from detection (`docs/cli.md` §5)."*), add one sentence. It says that on a published release `sandbox1h` §1 (an adopter's forced run shows no `kept by this self-adopt run` row in `== commands`, re-renders both wrappers from detection, and keeps every state-dir README that matches its template `= kept` with no `.bak`) is taken by the round's step 4, *not yet measured*.
  - After **The `.bak` files are removed by hand once the review is done.**, add one sentence. It says that `sandbox1h` §2's adopter-side counterpart is taken by the same step 4, *not yet measured*: the hidden-`.bak` note on a 0.6.7 adoption, `git status --short` against `--ignored`, the `--quiet` row (decided, not a defect) and the fresh-`init` managed-block comment.

**Verification:**

- `git grep -n -F "(xvi) The full-run leg: one task through" docs/development.md` and `git grep -n -F "The sandbox series round (#170 step 4) — not yet run." docs/development.md` each match exactly once. The first sits after the `(xv)` lead and before **Teardown.**. The second sits after the `Round 12` lead and before **Setup.**
- Each FR id's "read from" in (xvi) matches the story index's **Shared anchors** list for that id byte for byte.
- Every row id the new text cites, from `git grep -o -E "(FR[0-9]+|JS[0-9]+N?|SB[0-9]+|RJ[0-9]+)" -- docs/development.md` (no hit before this branch), is ⊆ the id set Task 1's §10 defines, as the story index's `## Context` lists it.
- `git grep -n "chore_sandbox_gate12_full_run_leg\|Fourteen observations" docs/development.md` reports no hit.
- Every step of the round names a source check or a cited block, and the ten steps appear in the prompt's order. No new sentence states a measured result, a run id, a date of a run or a pass. No command sits inline outside a fenced block, and no new line carries a line-number citation, an absolute machine path or a spelled-out home directory.
- Every step name or log string (xvi) or the round block quotes appears in the shipped source it cites, checked with `git grep -n -F "<fixed text>" cli/templates`, which must find at least one hit in the cited file:
  - A quoted string with no `<placeholder>` in it (every step name, `run_profile_check`, `not launching`) is grepped whole.
  - A quoted string that holds a `<placeholder>` is grepped by its fixed text up to the first placeholder, because the shipped line carries a shell variable where the doc carries the placeholder, and a whole-string `-F` grep would fail on correct text. For example, `git grep -n -F "saved the bundle of" cli/templates`, `git grep -n -F "restored the bundle of run" cli/templates` and, for `placed <n> planning file(s) for <branch>`, `git grep -n -F "planning file(s) for" cli/templates`.
  - Where that leading fixed text is a single generic word (`skipped <path>: <linked> is a symbolic link`), grep the longest placeholder-free run instead (`"is a symbolic link"`, in `cli/templates/scripts/remote-run.sh`). `trusted configuration at <commit> names '<trusted>'` is grepped as `"the trusted configuration at"`.
  - A miss under this rule is a defect named in the unit's return, never a reason to change the quoted text.
