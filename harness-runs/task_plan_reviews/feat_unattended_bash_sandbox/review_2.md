# Task plan review — iteration 2

**The plan has not been revised since iteration 1.** Every file under `harness-runs/task_plans/feat_unattended_bash_sandbox/` was last modified at or before 19:27:40, and the story index at 19:12:27. `review_1.md` was written at 19:41:26. The story index has no `## Rejected findings` section, so none of iteration 1's findings is recorded as rejected. I re-checked each of the four against the files and the tree, and all four are still open. They are restated below with the evidence re-verified this round, and their fixes stand as `review_1.md` gives them. The structural checks that passed in iteration 1 still pass, because nothing changed: index shape, 27 entries to 27 files, single-layer tags, points and the Work-bullet budget, bottom-up order, and `**Depends on:**` direction.

## Must Fix

1. **The plan resolves the unresolved `autoAllowBashIfSandboxed` question two opposite ways** — story index (`feat_unattended_bash_sandbox_story_plan.md`), `task_2_plan.md`, `task_15_plan.md`, `task_13_plan.md`.
   - The story index's `## Context` → **Unresolved** list still says *"How `autoAllowBashIfSandboxed` interacts with `dontAsk`. Neither page says."*
   - `task_2_plan.md`'s Template bullet still says *"Do not set `autoAllowBashIfSandboxed`; its default `true` is what lets a sandboxed command run without an entry of its own."*
   - The canonical restatement says an unlisted call *"is refused at once"*, and Tasks 13–22, 25 and 27 write that into Bash-scoped sentences.
   - The task prompt's verified fact gives the default as `true`. Under that default, an unlisted sandboxed Bash command runs. So the plan both picks an outcome and contradicts itself, which breaks the prompt's *"plan around both outcomes, never pick one"*.

   **Fix:** apply `review_1.md` Must Fix 1, with no change.
   - In `task_2_plan.md`, set `"autoAllowBashIfSandboxed": false` in the static `sandbox` object, give it a `_README` rationale, and replace the *"Do not set…"* sentence.
   - In the story index, drop or restate the Unresolved bullet.
   - Remove the matching clause from `task_15_plan.md` (line ~33) and from `task_13_plan.md` (line ~45).
   - If the writer keeps `true` instead, the restatement and every Bash-scoped rewrite must stop claiming a refusal.

2. **The hooks pin can name a directory the profile does not write-protect** — `task_4_plan.md` (the `hr_pinned_hooks_path` row), `task_3_plan.md` (`protectedPaths` item 3), and the story index (*"The hooks pin follows from the same rule."*).
   - `hr_pinned_hooks_path` still pins whatever `core.hooksPath` the main `.git/config` holds, or `<common>/hooks` when it is unset.
   - `protectedPaths` item 3 still protects only `<repoRoot>/<resolveGithooksDir(config)>` and the worktree glob.
   - `cli/src/generators/githooks.ts` (line ~50) still says *"never when it points somewhere else"*, so a foreign hooks path is a supported configuration. In that case, and in the unset `.git/hooks` case, the file tools can write a `pre-push` that the excluded wrapper then runs unsandboxed. That breaks goal 7.

   **Fix:** apply `review_1.md` Must Fix 2. Either refuse unless the resolved directory equals a protected one and add `<repoRoot>/.git/hooks` to `protectedPaths`, or protect the configured directory itself. Compare only against a value the run cannot write. State the rule in the story index, and add a foreign-`core.hooksPath` refusal case to Task 4's suite.

3. **Scope register: no derivation entry reaches three sites this branch makes false** — story index `## Scope register`; ownership in `task_8_plan.md`, a `cli` task (for example `task_17_plan.md`) and `task_26_plan.md`. Every site below was re-verified in the tree, and none is a row or a target in any task:
   - `cli/templates/claude/harness-task-offer.md` and its example copy `examples/notes-app/.claude/harness-task-offer.md`: *"A remote address is worse: the run has no web access granted at all, so it would hang rather than fail."*
   - `plugin/instructions/docs_orchestration_instructions_autonomous.md` → **Paths (Override-A equivalent)**: *"`<MAIN_REPO>` (for the global kill switch only)"*. Task 8 adds a push under `<MAIN_REPO>` to this file, so *"only"* becomes false.
   - `cli/src/commands/doctor.ts` help text: *"a session that would park. It reaches no network."*

   **Corrected derivation entries**, strictly wider than the ones on the page:
   - (a) Widen entry H's artifact from the targeted files to every file under entry G's pathspec, keeping its first step, traversal and decision rule.
   - (b) Add a command entry `git grep -n -F '<MAIN_REPO>' -- plugin`. Decision rule: a sentence that restricts what `<MAIN_REPO>` is used for is `change` in a file where Tasks 8–10 add a push under it.

   **Fix:** add one register row per site, plus a Work bullet and a `### Targets` line in the owning per-task file.

4. **`doctor`'s help text, module header and `REMOTE_JOB_FLAG` doc comment still state the old three-check `--remote-job` count, and no task changes them** — `task_7_plan.md`. `cli/src/commands/doctor.ts` still has:
   - line ~44: *"it changes three profile checks' grades"*;
   - line ~95: *"`profile-paths`, `profile-tracked` and `plugin-permissions` fail instead of warning"*;
   - line ~185: *"turns three warnings into failures"*.

   `task_7_plan.md`'s `### Targets` list does not name `doctor.ts`.

   **Fix:** add `cli/src/commands/doctor.ts` to `task_7_plan.md`'s Targets. Add a Work bullet that rewrites the three sentences to the five-check set, keeping the taken-opt-out exception and using the same words as Task 13. Fold in the *"would park"* rewording from Must Fix 3, and add a grep verification.

## Should Fix

1. Register rows 50–123 still give `Site` as line coordinates only. Add a quoted anchor or a symbol to each.
2. `task_26_plan.md` still cites *"the scratch-run route the conventions document names"*. Name the actual route (`plugin/agents/layer-implementer.md` → **The probe route, in every mode.**), and say the scratch render is removed in-process.
3. Rows 82, 127 and 145 keep sentences that read as if `acceptEdits` were the unattended run's current mode. Scope each of them to the measurement.
4. State one classification of `<MAIN_REPO>` in the story index.

## Nice to Have

1. The stale *"the three profile checks unanswerable"* count in `cli/src/doctor/checks.ts` and `docs/cli.md` §7 could become *"the profile checks"* inside Tasks 27 and 13.
