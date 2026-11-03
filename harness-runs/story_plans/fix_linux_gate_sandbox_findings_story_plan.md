# Story: Fix the third Linux probe run's gate-sandbox findings (F11–F14, PD28–PD30)

## Context

The third Linux run of the sandbox probe (Gate 15, 2026-11-03, on `dev` at `df1b5619`) showed that a gate run the main checkout's excluded launcher starts under its own `bwrap` outlives the session and reaches a verdict. The verdict was `fail`, and the rows that measure the launcher's sandbox boundary (GS1–GS4, WF5) printed `not run`. This branch fixes the seven findings that run recorded, each with a fixture in the suite, so that a Linux gate run started by the launcher can pass and so that the next Gate 15 container run can measure GS1–GS4. It takes no Linux result itself: that is taken by hand afterwards, in Gate 15's container, by `run --leg gates --leg git --leg gate-sandbox`.

What each finding gets:

- **F11**: gate 6a fails on `grep: ./<p>: Permission denied` lines inside the launcher's sandbox. The vector explains the reading, but it is not measured: the launcher pins each absent built-in protected path with `--ro-bind /dev/null <p>`. bwrap mounts every bind except a `--dev-bind` `nodev`, and opening a character device on a `nodev` mount is refused with `EACCES`. AP5 already records Claude Code's own placeholders as `/null (tmpfs, ro,nosuid,nodev)`. The fix moves gate 6a into a script of its own. That script drops exactly one `grep` error shape, `Permission denied` on a path that is a character device (a placeholder, which holds no bytes). Every other `grep` error still prints and so still fails the gate. `scripts/run-gates.sh` is the only file carrying the gate. No template carries it (`cli/templates/scripts/` holds no `run-gates.sh`).
- **F12**: `launch-sandboxed-gates.test.mjs` case `(c)` hides `bwrap` by dropping whole `PATH` directories, which drops `bash` too wherever the two share one. It now shadows only the `bwrap` entry.
- **F13**: `doctor-profile-sandbox.test.mjs` case `(d)` is the only case in that suite that runs `init` with retrieval on. It runs that `init` against the host's real machine cache with no retrieval stub. Under the launcher's read-only home, `cli/src/retrieval/setup.ts` → `setUpRuntime`'s `mkdirSync` cannot create the runtime directory, and that throw sits outside the step's warning path. So `init` exits 2 `(unexpected)`. This is read from the code. It is not reproduced in the container. The case is put under `helpers/fixture.mjs` → `retrievalEnv` like every other retrieval case, and its failure messages lead with the last stderr line, so the next container run prints the cause if this reading is wrong. **The code is not changed:** once `mkdirSync` is moved into the warning path, `init` goes on to the model download, and no offline case can then reach that path. Task 13 records this as an observation in F13's row.
- **F14**: committed files spell the Gate 15 container user's home directory literally, and inside the container that directory is `$HOME`, so gate 6a matches them. Every such spelling is rewritten. Shell words use `$HOME` or `~/`, and quoted output and prose use the `<home>` placeholder `docs/sandbox-verification.md` §0 already declares. A `docker cp` source, which the host shell cannot expand inside the container, reads the user's home once through `docker exec … getent passwd`. A tree guard (Task 14) then keeps the tree clean, so a reintroduction fails on any machine, macOS included, rather than only inside the container. No gate 6a exclusion is added.
- **PD28**: CL5's `could not lock config file .git/config: File exists` joins the judge's Linux table under the sandbox layer, as that exact line rather than a bare `File exists`. CL5 then passes it only when the readings fit the placeholder: absent before the session, a character device `1, 3` (`/dev/null`) inside it, and absent after.
- **PD29**: the writer of `branch.dev.remote` and `branch.dev.merge` is `scripts/lib/sandbox-probe/legs-refresh.sh` → `sp__rf_r4`. It runs `git branch <defaultBranch> refs/remotes/origin/<defaultBranch>` in the shared probe clone, and under git's default `branch.autoSetupMerge` that records the upstream. The `gate-sandbox` leg moves to an extra clone of its own (`sp_extra_clone`, as `planted-files` and `wrappers-refresh` do), and it checks its target against the clone allow-list before it launches. R4 is left unchanged, so no macOS verdict moves. The launcher's refusal does not change.
- **PD30**: T3's `fail` evidence names every `  FAIL  ` line of the lane log and the suite's counts, ahead of anything else. T2's macOS evidence is byte-identical.

**Constraints every task holds.** The launcher's trust check, its refusal of an untrusted clone and the `bwrap` vector's boundary are not loosened. That boundary is no network, writes only to the target, protected paths read-only and credentials masked. `scripts/launch-sandboxed-gates.sh` and its template are not edited. No `excludedCommands` entry is added, and nothing sets `allowNestedUserNamespaces` or `enableWeakerNestedSandbox`. Shell stays at the bash 3.2 floor. macOS behaviour and every macOS verdict stay unchanged. No measured result is invented: GS1–GS4 stay **not yet measured**, and every §5 and §8 row this branch touches reads *fixed by this branch, confirmation owed to the next Gate 15 container run*. **No artifact of this branch spells the container user's home directory literally**: plans, reviews and docs write `<home>`. The literal is what F14 removes, and Task 14's guard fails on it.

**Order.** Tasks are in ship order by dependency, following `fix_linux_detached_gate_run`'s precedent. The two self-contained `cli` test fixes (F13, F12) come first. Then come the `general` script fixes under `scripts/` (F11, PD28, PD29, PD30), then the `cli` suites that test those scripts. Next come the `general` record and documentation rewrites (F14, the two docs). Last are the `cli` tree guard that reads the cleaned tree and the `general` registration of that guard. A `cli` test of a `general` script cannot ship before the script, and the tree guard cannot ship before the tree it reads is clean.

**Top risks:** The first is a gate 6a fix that hides a real hit. Task 3 drops only `Permission denied` on a character device, and Task 7's fixture shows that the same error on a regular file still prints. The second is the next container run still failing gate 6a on a home spelling missed here. Tasks 11–13 rewrite every site the scope register's command reaches, and Task 14's guard makes a reintroduction fail on any machine, not only in the container. The third is the `gate-sandbox` leg's new clone silently changing what GS1–GS4 measure. Task 5 changes only the target and its profile, Task 9 pins the target choice in both layouts, and Task 13 states the new target in GS1's row.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the implementation loop.** The orchestrator walks the `[ ]` entries below from top to bottom. **Only the committing role flips a marker to `[x]`**: the `committer` agent in every flow that dispatches one, or the orchestrator itself in the supervised flow, which dispatches none. An implementer never changes a marker, and never edits any other line of this section, in an index a run is iterating. `[ ]` markers anywhere else, such as sub-step bullets inside a per-task file, are informational progress markers only. They are never the iteration source, and the committer does not touch them.

Each entry resolves 1:1 to `harness-runs/task_plans/fix_linux_gate_sandbox_findings/task_<K>_plan.md`. They are in ship order, by dependency (see `## Context` → **Order.**).

1. [x] **Task 1** — F13: run `doctor-profile-sandbox` case `(d)` under the retrieval stub and an isolated cache, and lead its failure messages with the cause _(layer: cli)_ _(points: 10)_
2. [x] **Task 2** — F12: make launcher case `(c)` hide only `bwrap`, and pin the shared-directory layout _(layer: cli)_ _(points: 10)_
3. [x] **Task 3** — F11: move gate 6a into `scripts/check-machine-paths.sh`, dropping only `Permission denied` on a character-device placeholder _(layer: general)_ _(points: 15)_
4. [x] **Task 4** — PD28: add CL5's `File exists` lock refusal to the judge's Linux table, and grade CL5 on it plus the placeholder readings _(layer: general)_ _(points: 15)_
5. [ ] **Task 5** — PD29: give the `gate-sandbox` leg a clone of its own, check it against the clone allow-list, and name the writer in the header _(layer: general)_ _(points: 20)_
6. [ ] **Task 6** — PD30: make T3's `fail` evidence name every `FAIL` line and the suite's counts _(layer: general)_ _(points: 10)_
7. [ ] **Task 7** — F11's fixture: test `check-machine-paths.sh` against throwaway trees _(layer: cli)_ _(points: 10)_
8. [ ] **Task 8** — PD28's fixtures: replace the judge's PD28 pin and the CL5 readings cases _(layer: cli)_ _(points: 15)_
9. [ ] **Task 9** — PD29's fixtures: the writer, the allow-list check and the leg's target _(layer: cli)_ _(points: 15)_
10. [ ] **Task 10** — PD30's fixture: T3's `fail` evidence over a lane log whose gate output quotes a refusal string _(layer: cli)_ _(points: 10)_
11. [ ] **Task 11** — F14: rewrite the container home spelling out of the earlier sandbox-series run artifacts _(layer: general)_ _(points: 10)_
12. [ ] **Task 12** — F11 and F14 in `docs/development.md`: gate 6's command, the container recipe's home spellings, and the Gate 15 expectations _(layer: general)_ _(points: 20)_
13. [ ] **Task 13** — Record F11–F14 and PD28–PD30 as fixed in `docs/sandbox-verification.md`, restate T3, WF5, CL5 (Linux) and GS1–GS4, and rewrite its home spellings _(layer: general)_ _(points: 20)_
14. [ ] **Task 14** — F14's fixture: a tree guard that fails on any file naming the Gate 15 container user's home _(layer: cli)_ _(points: 10)_
15. [ ] **Task 15** — Register Task 14's tree guard in `harness.config.json` _(layer: general)_ _(points: 5)_

## Scope register

**Scope predicate**, quoted verbatim from the task prompt: *"committed files name that user's home directory literally"* (F14), together with *"`docs/sandbox-verification.md`'s §5 rows F11–F14 and PD28–PD30, and the §8 rows GS1–GS4, WF5 and CL5 (Linux), read as fixed by this branch"* (goal 3).

**Derivation entry A — files spelling the container user's home (command).** Re-run verbatim from the checkout root: `git grep -l -e '/home/prob[e]'`. The bracket keeps the pattern from matching itself.

**Derivation entry B — the §5 and §8 rows goal 3 names, plus T3 (command).** `grep -nE '^\| (T3|F11|F12|F13|F14|PD28|PD29|PD30|GS[1-4]|WF5|CL5 \(Linux\)) \|' docs/sandbox-verification.md`

**Derivation entry C — live documentation quoting gate 6a's command (command).** `git grep -n -F -e 'grep -rn "$HOME"' -- docs README.md plugin cli/templates`. The earlier run artifacts under `harness-runs/` that quote it are records of their own runs and are outside this entry.

**Derivation entry D — documentation citing what PD28 and PD29 change (command).** `git grep -n -e 'File exists is not a known sandbox refusal' -e 'its target the clone or the job' -- docs plugin README.md`

**Derivation entry E — Gate 15's leg and expectation tables for the `git` and `gate-sandbox` legs, and the refusal-strings paragraph (command).** Re-run verbatim:

```
git grep -n -e '^| `gate-sandbox` |' -e '^| `git` | CS3, CL5' -e 'are in that table since' -- docs/development.md
```

**Derivation entry F — the tree-guard list (command).** `git grep -n '"treeGuards"' -- harness.config.json`

**Closure invariant:** every site any derivation entry above reaches appears as a row below. A re-run whose output is not a subset of these rows is a finding.

| # | Site | Copy | Evidence | Disposition | Owning task or reason |
|---|---|---|---|---|---|
| 1 | `docs/development.md` → Gate 15's container recipe (the `claude plugin marketplace add` line, the Claude Code credential bullet, the three home-directory `docker cp` lines) | — | A | `change` | Task 12 |
| 2 | `docs/sandbox-verification.md` → every run record spelling the home literally (§0 run paragraphs, §5 PD21, §8 AP/S1/S2 and other quoted evidence) | — | A | `change` | Task 13 |
| 3 | `harness-runs/task_plans/feat_sandbox_probe_linux_legs/task_11_plan.md` | — | A | `change` | Task 11 |
| 4 | `harness-runs/task_plans/fix_sandbox_probe_linux_recipe_gaps/task_2_plan.md` | — | A | `change` | Task 11 |
| 5 | `harness-runs/task_prompts/fix_linux_sandbox_deny_placeholders_task_prompt.md` | — | A | `change` | Task 11 |
| 6 | `harness-runs/task_prompts/fix_linux_sandbox_sibling_glob_trio_task_prompt.md` | — | A | `change` | Task 11 |
| 7 | `harness-runs/task_prompts/fix_sandbox_probe_linux_recipe_gaps_task_prompt.md` | — | A | `change` | Task 11 |
| 8 | `harness-runs/user_reviews/fix_linux_sandbox_sibling_glob_trio_fix_plan.md` | — | A | `change` | Task 11 |
| 9 | `harness-runs/user_reviews/fix_linux_sandbox_sibling_glob_trio_fix_plan/finding_6.md` | — | A | `change` | Task 11 |
| 10 | `harness-runs/user_reviews/fix_linux_sandbox_sibling_glob_trio_review.md` | — | A | `change` | Task 11 |
| 11 | `docs/sandbox-verification.md` → §5 row F11 | — | B | `change` | Task 13 |
| 12 | `docs/sandbox-verification.md` → §5 row F12 | — | B | `change` | Task 13 |
| 13 | `docs/sandbox-verification.md` → §5 row F13 | — | B | `change` | Task 13 |
| 14 | `docs/sandbox-verification.md` → §5 row F14 | — | B | `change` | Task 13 |
| 15 | `docs/sandbox-verification.md` → §5 row PD28 | — | B, D | `change` | Task 13 |
| 16 | `docs/sandbox-verification.md` → §5 row PD29 | — | B | `change` | Task 13 |
| 17 | `docs/sandbox-verification.md` → §5 row PD30 | — | B | `change` | Task 13 |
| 18 | `docs/sandbox-verification.md` → §5 row T3 | — | B | `change` | Task 13 |
| 19 | `docs/sandbox-verification.md` → §5 row WF5 | — | B | `change` | Task 13 |
| 20 | `docs/sandbox-verification.md` → §8 row CL5 (Linux) | — | B | `change` | Task 13 |
| 21 | `docs/sandbox-verification.md` → §8 row GS1 | — | B, D | `change` | Task 13 |
| 22 | `docs/sandbox-verification.md` → §8 row GS2 | — | B | `change` | Task 13 |
| 23 | `docs/sandbox-verification.md` → §8 row GS3 | — | B | `change` | Task 13 |
| 24 | `docs/sandbox-verification.md` → §8 row GS4 | — | B | `change` | Task 13 |
| 25 | `docs/development.md` → `## 5` → **Gate 6 — self-containment.**, the fenced 6a command and the paragraph after it | — | C | `change` | Task 12 |
| 26 | `docs/development.md` → Gate 15's leg-declaration table, row `` `git` `` | — | E | `no-change` | it restates `scripts/lib/sandbox-probe/core.sh`'s `sp_leg_declare git` text, which this branch does not change |
| 27 | `docs/development.md` → Gate 15's leg-declaration table, row `` `gate-sandbox` `` | — | E | `no-change` | it restates `sp_leg_declare gate-sandbox`, which names no target and which this branch does not change |
| 28 | `docs/development.md` → Gate 15's job-legs table, row `` `gate-sandbox` `` | — | E | `no-change` | the job rows do not change |
| 29 | `docs/development.md` → **What a Linux run expects** table, row `` `git` `` | — | E | `change` | Task 12 |
| 30 | `docs/development.md` → **What a Linux run expects** table, row `` `gate-sandbox` `` | — | E | `change` | Task 12 |
| 31 | `docs/development.md` → the paragraph *"An expected refusal whose text carries none of the refusal strings…"* | — | E | `change` | Task 12 |
| 32 | `harness.config.json` → `treeGuards` | — | F | `change` | Task 15 |
