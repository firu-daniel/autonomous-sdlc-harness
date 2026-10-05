# Task plan review — iteration 0

## Must Fix

1. **`task_6_plan.md` and `task_7_plan.md` — the new `gh` calls break the `remote-github` failing table's hard-coded call counts, and both files say every existing case passes unchanged**
   `cli/test/doctor.test.mjs` → the `failing` table inside `test('the remote-github check asks GitHub only under --check-github and grades each answer', …)` gives each case a fifth column, *calls made*, and asserts `assert.equal(ghInvocations(stub).length, calls, …)`. Two rows pin `7`:
   - `['GitHub does not know harness-run.yml', …, 7]`
   - `['neither credential secret is set', …, 7]`

   Neither case returns early. `REMOTE_GITHUB_CHECK.run` pushes to `failures` and carries on, and `answerGh` answers `variables` with `[]`. So:
   - After Task 6, both cases make the new `repos/{owner}/{repo}` owner read, which is 8 calls.
   - After Task 7, the first case also makes the collaborators read. Its healthy secrets carry `CLAUDE_CODE_OAUTH_TOKEN` and the list is owner-only, so it makes 9 calls.

   Task 6 handles only the healthy exact-invocation case (`Object.values(GH_CALLS)`). Its `**Verification:**` then claims *"every existing `remote-github` case still passes, including the exact-invocation one"*, and Task 7's claims the same. Neither file names the `failing` table, so an implementer who follows either file as written fails its own verification.
   **Fix:** In `task_6_plan.md` → `**Work:**` → the `doctor.test.mjs` bullet, add a sub-bullet: update the `failing` table's *calls made* column for every row that now reaches the owner read (`7` → `8` for both rows above). Say why: the owner read runs whenever the variables listing was read and the list is unset. In `task_7_plan.md`, add the matching sub-bullet: the `GitHub does not know harness-run.yml` row goes `8` → `9`, because its secrets carry the token. The `neither credential secret is set` row stays `8`, because it has no token and so makes no collaborators read. In both files, reword the verification bullet so it names this table edit and no longer says the existing cases pass unchanged.

2. **`task_13_plan.md` — placing observation (xv) "before *What it settles.*" puts it inside (xiv) and makes (xiv)'s paragraph point at the wrong legs**
   `docs/development.md` → Gate 12 has a single `**What it settles.**` paragraph. It belongs to observation (xiv): it opens *"These rows of `docs/github-run-control.md` → `## 8. What is not verified here`"* and cites (xiv)'s *"leg (f)"*, *"Leg (h)"* and *"leg (d)"*. Task 13's `### Targets` puts the new (xv) *"after (xiv)'s leg (i), before \"What it settles.\""*.

   That puts (xv)'s own lettered legs (a)–(h) between (xiv)'s legs and (xiv)'s settling paragraph. A reader of that paragraph would then take *"leg (f)"*, *"Leg (h)"* and *"leg (d)"* as (xv)'s legs, which falsifies (xiv)'s record.

   The `**Work:**` bullet *"What (xv) settles, the teardown, and where the results go"* compounds this. It edits *"What it settles."* without saying whether it adds a second paragraph or rewrites (xiv)'s.
   **Fix:** In `task_13_plan.md` → `### Targets` and `**Work:**`, place (xv) after (xiv)'s `**What it settles.**` paragraph and before `**Teardown.**`. Give (xv) its own `**What it settles.**` paragraph, naming the `## 6.` row Task 11 adds and the `team-accounts-research.md` → `## 7. Open questions` bullet. State that (xiv)'s existing paragraph is left byte-identical.

3. **`task_9_plan.md` — `reportGithubSteps` keeps telling adopters that anyone with write access starts a run**
   `cli/src/commands/init.ts` → `reportGithubSteps`, the trigger-gated label step, still prints *"Only a person with write or admin access, or a listed bot, starts one."* After Tasks 2 and 5, that is false. A writer whom `HARNESS_RUN_ACTORS` does not admit is refused, and in an organisation-owned repository with the list unset every person is refused.

   Task 9 targets this exact function, and the task prompt's items 1 and 7 ask `init` to state who may act. Yet Task 9's `**Work:**` adds a new line to step 2 and never corrects this sentence. The re-run of derivation entry 1 does not reach the sentence either, because it greps `docs/` only. A repository-wide grep finds it as the one remaining who-may-act claim outside the docs and `remote-run.sh`.
   **Fix:** In `task_9_plan.md` → `**Work:**` → the `reportGithubSteps` bullet, add: reword the label step's *"Only a person with write or admin access, or a listed bot, starts one."* so a person also needs admission by `${RUN_ACTORS_VARIABLE}`, by pointing back at step 2's line. Spell the name through the constant. In `**Verification:**`, extend the first-setup assertion so stdout no longer carries the old sentence.

## Should Fix

- **`task_2_plan.md` — two trigger way-on texts still promise write access is enough.** In `remote-run.sh` → `trigger` → the `case "$status"` after `authorise_actor`, two arms keep their old way-on text:
  - Arm `1)`: *"A collaborator with write access can re-apply the label …"*.
  - Arm `2)`: *"… or have a collaborator with write access apply the label …"*.

  After this branch, an unlisted collaborator with write access who follows either way-on is refused again. Add a sub-bullet that rewords both to *"a collaborator the allow-list admits"*, or the equivalent.
- **`task_6_plan.md` — the grading sentence contradicts itself.** *"Grade that read the way the retention read is graded"* is followed by *"`refused` is the same warning"*. The retention read grades `refused` as a **note**, not a warning (`checks.ts` → `notes.push(\`artifact retention not checked: …\`)`). Drop the retention comparison and keep the explicit list.
- **`task_4_plan.md` — "nothing reaches the shell any other way" is wrong.** The gate body reads `HARNESS_RUN_ACTORS` from the **job-level** `env:` (the first `**Work:**` bullet). Only the three `IN_*` lines are in the step `env:`, so the sentence contradicts the plan's own design and the test that pins *"exactly the three `IN_*` lines"*. Say instead that the step `env:` is exactly the three `IN_*` lines, and the list comes from the job-level `HARNESS_RUN_ACTORS`.
