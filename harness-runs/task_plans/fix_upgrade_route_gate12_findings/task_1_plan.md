### Task 1 — Declare the in-flight sentence once, carry it in `doctor`'s version warning, and fix that warning's double full stop at its join

**Goal:** Give the upgrade route one sentence, owned by `cli/src/generators/githubWorkflows.ts`, saying that an upgrade does not reach a run already in flight. Print it in `doctor`'s `remote-execution` version warning. Remove that warning's `never makes it.. To stay on` by fixing the join that produces it, and stop the warning's move route from naming a two-workflow commit set that Task 2 makes incomplete.

**Where this task stops.** This task declares `IN_FLIGHT_RUNS_NOTE` and uses it in `doctor` only. **Task 3** prints the same constant in `init --upgrade-workflows`'s report and imports it from here, so it must not re-spell the text. **Task 5** writes the `docs/remote-execution.md` → `### Upgrading` prose the sentence points at. This task edits no document and no template.

### Targets

- `cli/src/generators/githubWorkflows.ts`: the new exported constant, and a line in the module header saying the module owns it.
- `cli/src/doctor/checks.ts`: `REMOTE_EXECUTION_CHECK`, meaning its version-warning join, the warning's move-route commit set, and its doc comment.
- `cli/test/doctor.test.mjs`: the version-warning cases in the `remote-execution` suite (the one declaring `UPGRADE_ROUTE = 'init --upgrade-workflows'`).

**Work:**

- [ ] `githubWorkflows.ts`: beside `upgradeWorkflowsCommand`, export the interface Task 3 consumes:
  ```ts
  export const IN_FLIGHT_RUNS_NOTE: string
  ```
  It is one complete sentence that ends in exactly one `.` and contains no backtick. Wording:
  > An upgrade reaches only the runs dropped after it is pushed: each run's branch carries the workflows it was cut with, so a run already in flight finishes on the version it started with, and moving one on purpose is a separate step (docs/remote-execution.md, section 7, Upgrading).

  The parenthesised citation is spelled exactly as the workflow template's `upgrade_route` already spells it. Add a sentence to the module header saying this module owns the constant, that `init`'s upgrade report and `doctor`'s version warning both print it, and that neither re-spells it.
- [ ] `checks.ts` → `REMOTE_EXECUTION_CHECK`: fix the join. Today the warning appends `. To stay on` after `push`, and `push` already ends in `.` when the branch is usable (it ends with `defaultBranchPushReason`, a sentence by contract), but not when the branch is unusable (`'push them to the default branch'`).
  - Make both `push` variants end as complete sentences: the unusable one becomes `'push them to the default branch.'`.
  - Join the parts with a space: `… then ${push} ${IN_FLIGHT_RUNS_NOTE} To stay on …`.
  - In the same template literal, stop listing the commit set. Today the move route reads `run \`${upgradeWorkflowsCommand(version)}\`, commit ${WORKFLOW_RUN_PATH} and ${WORKFLOW_RESUME_PATH}, then ${push}`. That two-file set is wrong once Task 2 lands: the first upgrade after this release also merges Task 2's lines into the tracked `.gitignore`, and left uncommitted, the next job's `Generate the job's permission profile` step exits 1 on `init … changed tracked files` (story index, first `Top risks:` entry). Replace `commit ${WORKFLOW_RUN_PATH} and ${WORKFLOW_RESUME_PATH}` with `commit the paths its printed \`git add\` names`, so the route reads `run \`…\`, commit the paths its printed \`git add\` names, then ${push}`. The upgrade's report is the one owner of that set: Task 3 makes its `git add` name the workflows plus every in-repository file the run merged into. Before Task 3 lands, the report's existing first-setup `git add` names the workflows, so this wording is true at every point in the ship order. If `WORKFLOW_RESUME_PATH` has no other use in `checks.ts` after the edit, drop its import.
  - Leave `core/defaultBranchPush.ts` alone. Its reason keeps its period for its other three callers (the origin warning in the same check, `profileUntrackRemedy`, and `init.ts` → `reportGithubSteps`).
- [ ] `checks.ts`: extend `REMOTE_EXECUTION_CHECK`'s doc comment, where it lists the pin warning's remedy, to say the warning also prints `IN_FLIGHT_RUNS_NOTE`. Also say the `push` fragment is a complete sentence in both of its forms, so the join adds no punctuation of its own.
- [ ] `doctor.test.mjs`: in the case `'on, with harness-run.yml pinned to another version, warns with the upgrade route and the stay route'`, add four assertions:
  - the warn line includes the text `a run already in flight finishes on the version it started with`;
  - `/\.\.\s/.test(line)` is false;
  - the warn line includes the text `commit the paths its printed \`git add\` names`;
  - the warn line does not include `commit .github/workflows/harness-run.yml and`.

  Every existing assertion stays. If the suite can reach a configuration whose `defaultBranch` is unusable while `remote-execution` still grades the pin, add the same four assertions there. If it cannot, record in the case's comment that the unusable form is checked by reading the source.

**Verification:**

- Run the edited `cli/test/doctor.test.mjs` under the conditions `unit_loop_core.md` → `## The test-run rule` (3) sets. The four new assertions hold, and the existing pin cases (`pinned to this version`, `a comment after the pin`, `the pin lines removed`, `the upgrade route it names clears the warning`) still pass.
- Grep `cli/src` for `defaultBranchPushReason(` and read each call site. No template literal places a `.` directly after the call. Where one is followed by more text, that text starts after a space.
- Grep `cli/src` for the sentence's distinctive fragment `finishes on the version it started with`. It appears once, in `githubWorkflows.ts`. Task 3 adds an import and no second copy.

**Deviations from plan:**

- The unusable-`defaultBranch` form is reachable in the suite: `editJson` sets `defaultBranch` to `''`, the config parses as an object, and `remote-execution` still grades the pin. So a new case, `'on, with harness-run.yml pinned to another version and defaultBranch unusable, joins the push fragment without a double full stop'`, carries the four assertions, along with one that the line includes `push them to the default branch.`. The four assertions live in a suite-local `assertMoveRoute(line)` that both cases call.
- Verification's single-file run of `cli/test/doctor.test.mjs` was deferred to the Run gates phase. Neither `.claude/context/cli.md` nor `.claude/context/conventions.md` states a single-file test command, so the new assertions and the existing pin cases rest on reading the source and a passing `bash scripts/typecheck.sh`, not on execution.
- `WORKFLOW_RESUME_PATH` keeps its import in `checks.ts`: `REMOTE_EXECUTION_CHECK` still uses it for the resume-presence check.
