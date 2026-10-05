# Task plan review — iteration 1

All three Must Fix findings from iteration 0 are resolved:
- `task_6_plan.md` and `task_7_plan.md` now name the `failing` table's *calls made* edits (`7` → `8`, then `8` → `9` for one row only).
- `task_13_plan.md` places (xv) after (xiv)'s `**What it settles.**`, with its own paragraph.
- `task_9_plan.md` rewords the label step's who-may-start sentence.

## Must Fix

1. **Index structure (`feat_remote_run_actor_allow_list_story_plan.md` → `## Scope register`): derivation entry 1 is too narrow, and misses who-may-act passages this branch makes false**

   The register's predicate covers *"every passage of the project's prose that states who may start, command, answer or review a run, or which credential set-up a repository uses"*. I re-ran derivation entry 1 verbatim, and every hit is a row. But entry 1 matches only the literal phrase `with write access`, plus the variable and function names. It misses passages that state the same rule in other words, and several of those become false or misleading once the list and the run-job gate land:
   - `README.md` → the paragraph opening *"Once the setup is done, labelling an issue `sdlc-harness` starts a run"*: *"a team member who uses only this route needs nothing local: no clone, no plugin and no `init`."* With the default list, a team member who is not the owner is refused on this route.
   - `docs/github-run-control.md` → `## 7. Working a run from both sides` → *"**The Run workflow form stays the fallback.** A maintainer with no local setup can still work any remote run from `harness-run.yml`'s **Run workflow** form"*. The **Run workflow** form is the very route Task 4's gate now refuses for anyone the list does not admit (task prompt, item 3).
   - `docs/remote-execution.md` → `### Working a run from GitHub alone`: *"a maintainer with no local setup … works a run"* and *"The fallback, which works with or without `forge`, is the **Run workflow** form"*. This is the same gated route, and the section is where an adopter learns to use it.
   - `docs/github-issue-trigger.md` → `## 5. Working the run`, *"**Without one**, … the **Run workflow** form is still available"*.
   - `docs/development.md` → Gate 12 (xiv), *"The reviewing account, which submits every review in legs (e) and (f), must have write access"*. Task 13's `### Targets` already names this paragraph, but no register row carries it. Row 22's reason cell mentions it only in parentheses, against a different site (the (xiv) leg preamble).

   No derivation entry reaches these sites, so this is disposition (ii): the derivation is under-inclusive.
   **Fix:** In the story index → `## Scope register`, replace derivation entry 1's command with this wider one:
   `git grep -n -e HARNESS_TRIGGER_ALLOWED_BOTS -e authorise_actor -e 'write access' -e 'admin. or .write' -e 'write. or .admin' -e 'write or admin' -e 'Who can start' -e 'Who can act' -e 'Run workflow' -e 'team member' -- docs README.md ARCHITECTURE.md cli/README.md plugin/README.md plugin/docs`

   Then add a row for every site it reaches that is not already a row. That includes the five sites above, each with a `change` disposition and an owning task, or a `no-change` with a stated reason. The likely owners:
   - `README.md` → Task 11 or Task 12. The task's `### Targets` must then name it.
   - `github-run-control.md` §7 → Task 10.
   - `remote-execution.md` → `### Working a run from GitHub alone` → Task 11.
   - `github-issue-trigger.md` §5 → Task 10.
   - `development.md` (xiv) reviewing account → Task 13.

   The wider command also reaches passages that state nothing about who may act. Give each a `no-change` row with its reason, to keep the closure invariant. These include:
   - `docs/analyze.md`;
   - `docs/guard-verification.md`;
   - `docs/github-issue-trigger.md` → step 4 (*"Creating a label needs write access"*) and §4;
   - `docs/github-run-control.md` → its `**Who reads this:**` line;
   - `docs/remote-execution.md` → the self-hosted-runner and §3 notification lines;
   - `docs/development.md` → the round records.

   Update the `**Verification:**` bullets of Tasks 10, 11, 12 and 13 that re-run derivation entry 1 so they expect the widened hit set.

## Should Fix

- **`task_2_plan.md`: two trigger way-on texts still promise that write access is enough.** This was raised in iteration 0 and has not been applied. In `remote-run.sh` → `trigger` → the `case "$status"` after `authorise_actor`, two arms keep their old text:
  - arm `1)`: *"A collaborator with write access can re-apply the label …"*;
  - arm `2)`: *"… or have a collaborator with write access apply the label …"*.

  An unlisted writer who follows either way on is refused again. Add a sub-bullet that rewords both to name a collaborator the allow-list admits.
- **`task_6_plan.md`: the grading sentence still contradicts itself.** This was raised in iteration 0. *"Grade that read the way the retention read is graded"* is followed by *"`refused` is the same warning"*. The retention read grades `refused` as a **note** (`checks.ts` → `notes.push(\`artifact retention not checked: …\`)`). Drop the retention comparison and keep the explicit list.
- **`task_4_plan.md`: "nothing reaches the shell any other way" is still wrong.** This was raised in iteration 0. The gate body reads `HARNESS_RUN_ACTORS` from the job-level `env:`. Say instead that the step `env:` is exactly the three `IN_*` lines, and that the list comes from the job-level `HARNESS_RUN_ACTORS`.
- **`task_8_plan.md`: `FORGE_CHECK` has no warnings list to add to.** Every `warn` in `FORGE_CHECK` is an early `return warn(…)`: remote off, a workflow absent, a workflow not carried by `origin/<defaultBranch>`. Only the final `return pass(…)` reaches the end of the function. Say which path the old-copy warning joins. The natural one is the path that currently passes, which would then return `warn`. Also say whether it is appended when a carried-ness warn already fires.
- **`task_2_plan.md` case (b) and `task_3_plan.md`'s `remote-control.test.mjs` case are worded ambiguously.** Task 2 says *"the labeller written as `' Alice ,bob'` starts a run"*. Task 3 says *"a commenter written as `' ALICE '` with `'alice'` set is obeyed"*. A login carrying spaces fails `authorise_actor`'s shape check (status 1), so read literally, either case contradicts itself. Say which side carries the whitespace and the case: the list value or the actor's login. For example: list `' Alice ,bob'` with labeller `alice`; list `'alice'` with commenter `ALICE`.

## Nice to Have

- **Story index → `## Context`: say what an unlisted writer can still do through the form.** A form-dispatched `action=pause` or `action=stop` is a jobless marker run. `remote-run.sh` reads it as a signal (the header's `harness stop <branch>` / `harness pause <branch>` lookup), and no job runs, so no gate sees it. An unlisted writer can therefore still pause or stop a run from the **Run workflow** form, though this spends no credential. One sentence in the Context's decisions list would record that this is deliberate. Task 10's or Task 11's prose could then say so.
