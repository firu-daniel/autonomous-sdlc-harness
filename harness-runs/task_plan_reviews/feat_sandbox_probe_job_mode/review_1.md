# Task plan review — iteration 1

All five Must Fix findings of iteration 0 are resolved in the artifact: CS6 now brackets the index readings around session 1 only (`task_9_plan.md`, `task_21_plan.md`); the workflow switches to the configured `defaultBranch` and the local recipe clones `--branch dev` (`task_14_plan.md`, `task_15_plan.md`); `sp__pf_l1_restore` removes the remote `-sbxdash` it caused (`task_13_plan.md`); Task 19's new fixtures are in `### Targets`; and register row 42 covers the Trust-checks ledger rule. Derivation entries 1–4 were re-run verbatim and entry 5 re-walked. Every site they reach is a row.

## Must Fix

1. **CS6's grade passes on a `git add` error whose text no refusal layer recognises** — `task_9_plan.md` (follows into `task_21_plan.md`)
   `sp__cs6_grade`'s arms, in order, are: a permission-layer refusal or absent call gives `not run`; index changed or file staged gives `fail`; ref unmoved gives `fail`; wrong change set gives `fail`; `git status` errored gives `fail`; `git add` ran without error and the index is unchanged gives `not run`; **otherwise `pass`**.
   No arm handles a `git add` that errored with text the judge cannot place. On Linux the judge files that under `unrecognised`, and off Linux under `ran` with an error status. Either one falls through to `pass`.
   The task prompt rules this out for the runner legs by name: *"A refusal whose text the judge's Linux layer table does not know prints `not run` (PD23)"* (`## The runner legs`, the *Do not repeat what the earlier runs taught* paragraph). CS6 is listed among those legs (*"the job layout's own row: CS6"*).
   The probe's other disk-graded write rows already follow this rule. The `wp-dd-unrecognised` cases in `cli/test/sandbox-probe-protection-legs.test.mjs` print `not run` for an unrecognised error even though the disk is unchanged. Task 6 itself keeps *"any other Linux error against an expected refusal is still `unrecognised`"*.
   The plan's own evidence line, *"`git add`'s refusal line and its layer"*, shows that the layer is computed. Nothing then grades on it.
   **Fix:** In `task_9_plan.md`, add an arm to `sp__cs6_grade` after the `git add` ran-without-error arm and before `otherwise pass`: when `git add` errored and its judged layer is not `sandbox`, the verdict is `not run`, *git add errored with no refusal string the judge knows: <line>* (layer `unrecognised` on Linux, or an error at `ran`). State that `pass` requires `git add`'s layer to be `sandbox`. In `task_21_plan.md`, add a `not run` subtest to `test('CS6')` with a `git add` error on a string no arm matches (for example `Input/output error`, the string Task 19 uses), the index unchanged, and the ref moved. Its evidence names the unrecognised text.

## Should Fix

1. **Every plan file still ends with stray tool-call markup** — the story index and all 23 `task_<N>_plan.md` files. Each ends with the two lines `</content>` and `</invoke>`. This was raised in iteration 0; it was not applied and is not recorded under `## Rejected findings`. Delete both lines from every file.

2. **PN's in-session `PATH=` control is still never graded** — `task_8_plan.md`. The `runner-pid` session issues `grep -a -c PATH= /proc/self/environ` as *"the in-session control, which proves an `environ` read works inside the call"*. No grade reads it. Register row 34 still says PN1–PN3 are graded against an in-session control. Either wire it in (a control count that is not ≥ 1 makes PN1 and PN2 `not run`, with the case added to `task_20_plan.md`), or remove the call and correct row 34.

3. **Some skip evidence strings are not true** — `task_1_plan.md`, `task_5_plan.md`, `task_13_plan.md`.
   - L2 is skipped with *"clone layout only: job mode cuts no clone"*. But L2 runs `refresh-branch.sh` from the probe's own scratch main checkout `<tmp>/dashrepo` (`docs/sandbox-verification.md` row L2), not from a clone.
   - The non-job legs print *"not a job-mode leg: job mode cuts no clone"*. That reason is also false for `retry` (RT1), `mktemp` (TD2, TD4), `scratch` (SR1, SR2) and `retrieval` (MC1).
   - Use evidence that holds for each, for example *"not a job-mode row (Gate 15's job table)"*. State in Gate 15 why each of the twelve non-job legs is left out. The prompt names only CS*, CL5 and the wrappers' clone arm as clone-only.

4. **Task 22's byte-for-byte comparison is not runnable as written** — `task_22_plan.md`.
   - *"for each copied step name, the workflow's `run:` body … equals the template step's of the same name"* includes `Set up Node`, which is a `uses:` step with no `run:`.
   - `Set up Node` and `Read the configuration` each appear in two jobs of `harness-run.yml`: the `run` job, and the job opened by `Check out the dispatched ref`.
   - Fix: name the `run` job as the comparison source, compare `uses:` and `with:` for `uses:` steps, and handle the one-line `run:` form (`Bootstrap the checkout`).

5. **Task 22's `.github/` check contradicts its own "no tree" statement** — `task_22_plan.md`. This was raised in iteration 0 and is unaddressed. *"no path under `.github/` in this checkout names it"* walks a directory, while the file says it reads two fixed files and no tree. Narrow it to one fixed-path absence check (`.github/workflows/sandbox-probe-runner.yml` does not exist). Otherwise an implementer who greps contents writes a tree-reading test that has no `treeGuards` registration (`unit_loop_core.md` → `## The test-run rule` point 8).

6. **Task 14 does not say whether a copied step keeps its step-level keys** — `task_14_plan.md`.
   - `Install the claude CLI when absent` and `Generate the job's permission profile` carry `working-directory: ${{ runner.temp }}` in the template, so `npx` and `npm install -g` never run inside the checkout.
   - Task 14 copies only `run:` bodies and `uses:` pins.
   - Fix: state that every copied step keeps the template's step-level keys other than `if:` (`working-directory`, `id`), and have Task 22 assert it.

7. **CS6's `git status` arm can never fire for its stated reason when the call is refused at `.git`** — `task_9_plan.md`, minor. `git status` under a write-denied `.git` exits 0 because its index refresh fails silently. That is correct. Say so in the header, so a reader does not take a missing `git status` refusal as a gap.

## Nice to Have

1. The story index's `## Context` carries three tables and several lists, where the sample's Context is prose. The leg table and the expected-failure table could move into the per-task files that own them (Tasks 1 and 16), and the index would stay thin.
2. Register row `25a` breaks the table's integer `#` sequence. Renumbering keeps the closure test easy to read.
