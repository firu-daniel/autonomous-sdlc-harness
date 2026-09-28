# Task plan review — iteration 1

All three Must Fix findings from iteration 0 are resolved. Task 11 owns the push that the code prints. Tasks 3 and 10 own the teammate onboarding. Entry A of the register now reaches `README.md`, and that file is row 21. I re-ran entries A, B and C verbatim. Every file and rule they reach appears as a row, so the closure invariant holds. The two findings below are new.

## Must Fix

1. **Ignoring the profile removes it from every sibling worktree, so `doctor` changes its grade there, an existing test breaks, and no task owns either** — `task_1_plan.md` and the story index (`fix_remote_job_permission_profile_story_plan.md`, `## Context`).
   What the code does today:
   - `init`'s first commit is `cli/src/core/git.ts` → `commitAll`, which runs `git add -A`. Once Task 1 adds the ignore rule, that commit no longer carries `.claude/settings.autonomous.json`. So a `git worktree add` checkout, which is every run's working copy, has no profile.
   - `doctor` reads the profile from the checkout it runs in: `cli/src/doctor/checks.ts` → `buildCheckContext` → `const profilePath = join(repoRoot, PROFILE_PATH)`. In a worktree, `permission-profile` therefore **fails** (exit 1), and its remedy says *"run `init` to generate one"*. `init` run in a worktree produces the damage that `PROFILE_PATHS_CHECK`'s own header warns about: a profile naming the worktree as `<repo_root>`, with the main checkout named by nothing. The watcher is unaffected, because it reads `$MAIN_REPO/.claude/settings.autonomous.json`. `doctor` does not.
   - `cli/test/doctor.test.mjs` → `a sibling worktree is covered by the profile's worktree pattern and does not warn` depends on the committed profile. Its own comment says *"the profile has to be *committed* for the second checkout to carry it"*. It does `readFileSync(join(worktree, PROFILE_FILE), 'utf8')` and asserts exit 0 with `CLEAN_SUMMARY`. After Task 1 that read throws.

   None of Tasks 1–11 targets this case or the worktree behaviour. Task 1 edits only `cli/test/init.test.mjs`, and under `unit_loop_core.md` → `## The test-run rule` its implementer runs only the test files it edits. So the breakage first appears at Phase G, with no task to route it to. The Context's decision *"The profile is gitignored for every adopter"* states the consequence for a teammate's clone but not the one for worktrees.
   **Fix:** Decide the worktree behaviour, state it in the Context decision, and give it to a `cli` task. That can be Task 1, or a new task placed before Task 4, since Task 4 edits `PROFILE_PATHS_CHECK` next. The task names `cli/test/doctor.test.mjs` → the sibling-worktree case in its `### Targets`. Two workable shapes:
   - (a) `doctor` resolves the profile from the main checkout when it runs in a linked worktree, as the watcher does. Resolve the main checkout through a `cli/src/core/git.ts` function, which the `core/git.ts` monopoly requires. Rewrite the case to assert that the worktree run grades the main checkout's profile.
   - (b) Keep the per-checkout read, but give `permission-profile` a worktree-specific disposition whose remedy is not `init` there. Rewrite the case to assert that disposition.

   Either way, update `PROFILE_PATHS_CHECK`'s header paragraph about worktrees. It argues from a profile that a worktree carries, and after Task 1 no worktree carries one. Restate the chosen behaviour in `task_4_plan.md` and `task_9_plan.md`, whose `profile-paths` edits sit on top of it.

2. **`docs/cli.md` → `## 7.` check table is not targeted: it gains no `profile-tracked` row and keeps the old `plugin-permissions` rule** — `task_9_plan.md`.
   `docs/cli.md` → `## 7. \`doctor\`` has a `| Check | Asks |` table listing every check. The paragraph after it says *"The list is also the order of evaluation and of the report"*.
   - After Task 5 the table is missing `profile-tracked`, which `CHECKS` places directly after `profile-paths`.
   - Its `plugin-permissions` row reads *"… and a read grant where the runtime resolves the plugin to a different one"*. After Task 2 that rule is false: the `Read` grant is required at the runtime root, including a runtime root that is also the install root.

   Task 9's `### Targets` names §7's opening paragraph, the options paragraph and the `profile-paths` / `plugin-permissions` bullets, but not this table. The prompt's fourth acceptance criterion (*"`docs/cli.md` … agree with what the code does"*) is therefore unmet. Scope-register row 2 lists the same sub-sites and misses the table too.
   **Fix:** Add the §7 table to Task 9's `### Targets`. In its `**Work:**`, add a `profile-tracked` row after `profile-paths`, in the check's own words, and rewrite the `plugin-permissions` row to state the runtime-root rule and, under `--remote-job`, the `additionalDirectories` grading. Fold this into the existing `## 7.` bullets so the task stays within 5 `**Work:**` bullets. Add a `**Verification:**` grep showing that `profile-tracked` appears in the table between `profile-paths` and `profile-browser-deny`, and that *"a read grant where the runtime resolves the plugin to a different one"* is gone. Extend register row 2's site cell to name the table.

## Should Fix

1. **`task_3_plan.md`: the "nothing written" outcome is still unspecified (iteration 0, Should Fix 1, unaddressed and not recorded as rejected).**
   - `PluginRootEntriesOutcome` is `'off' | 'appended' | 'no-root'`. The plan does not say which value a render with every entry filtered out reports, or whether a fourth value is added.
   - No `**Work:**` bullet drives the Verification bullet about a filtered-out render.
   - New in this round: the plan does not say whether a root whose entries were dropped for a `FORBIDDEN_IN_ENTRY` character still goes into `permissions.additionalDirectories`.

   Name all three.
2. **`task_4_plan.md` / `task_9_plan.md`: leftover "committed profile" wording (iteration 0, Should Fix 2, unaddressed).** Two passages still say the profile is committed:
   - `PROFILE_PATHS_CHECK`'s doc comment: *"an `init --force` inside a worktree regenerates the **committed** profile"*.
   - The `docs/cli.md` `profile-paths` bullet: *"regenerate the committed profile"*.

   Both tasks edit these exact passages. Name the rewording in their Work bullets, consistent with the worktree decision Must Fix 1 asks for.
3. **`task_2_plan.md`, Work bullet 2: the normalization is not stated for the check's comparison (iteration 0, Should Fix 3, unaddressed).** In `PLUGIN_PERMISSIONS_CHECK.run`, `roots` and `runtimeRoot` are both raw, so `root === runtimeRoot` holds. Say so, as the generator bullet already does for its normalized side. Then a later normalization of one side cannot silently drop the `Read` requirement.
4. **`task_11_plan.md`, Verification bullet 3: the stated grep result is wrong.** `grep -n "git push origin" cli/src/doctor/checks.ts` also returns the `JJ_REPOSITORY_CHECK` doc comment and message (*"the identical refusal `git push origin <protected>` draws"*), which belong to neither `base-freshness` nor `remote`. State only the load-bearing part: no hit inside `REMOTE_EXECUTION_CHECK`.

## Nice to Have

1. `REMOTE_CHECK`'s two failure remedies (`git remote add origin <url> && git push -u origin ${branch}` and `git push -u origin ${branch}`) push the default branch too, so the same `pre-push` hook refuses them. They fall outside finding 6's setup push, but the plan could record that it leaves them unchanged, as Task 11 already does for `base-freshness`.
2. Carried from iteration 0: once `init` writes the profile rule into the managed block, this repository's hand-added rule in the root `.gitignore` duplicates it on the next `init` run.
