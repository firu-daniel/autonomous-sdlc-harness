# Task plan review — iteration 1

All four Must Fix findings from iteration 0 are resolved in the artifact. These checks hold: the index structure, the 1:1 correspondence (27 entries, 27 files), single-layer tags, the points and Work-bullet budget, bottom-up order (`cli` → `plugin` → `general`) and every `**Depends on:**` direction. Re-running derivation entries A, B, C and F reproduces the register. Entry G's two commands reach 111 files, and every one is named in the register. The findings below are new.

## Must Fix

1. **The plan settles an unresolved point two opposite ways: `autoAllowBashIfSandboxed` versus "refused at once"** — the story index (`feat_unattended_bash_sandbox_story_plan.md`, `## Context` → the canonical restatement and the **Unresolved** list), `task_2_plan.md`, `task_15_plan.md`, `task_13_plan.md`.
   - The story index lists *"How `autoAllowBashIfSandboxed` interacts with `dontAsk`. Neither page says."* as unresolved, to be planned around.
   - `task_2_plan.md` (Template bullet) resolves it one way: *"Do not set `autoAllowBashIfSandboxed`; its default `true` is what lets a sandboxed command run without an entry of its own."*
   - The canonical restatement resolves it the other way: *"under the default `dontAsk` mode, such a call is refused at once"*. Tasks 13–22, 25 and 27 write it into about eighty shipped sentences, many about Bash commands. For example, Task 17 says the compound form *"is what an unattended run's permission mode refuses"*, Tasks 19–21 say *"a bare `rm` is refused"*, and Task 15 rewrites `COMPLETENESS IS LOAD-BEARING` to *"a gap surfaces as a refused step"*.
   - The task prompt's verified fact says the default is `true`, and that only deny rules and content-scoped ask rules still apply to sandboxed commands. If that default applies under `dontAsk`, an unlisted sandboxed Bash command runs instead of being refused, and every Bash-scoped rewrite is false. If it does not apply, Task 2's rationale is false.
   - Either way the plan contradicts itself. It also breaks the prompt's rules: *"plan around both outcomes, never pick one"*, and *"No surface … quotes a fact … as more certain than it is stated"*.

   **Fix:** Make the outcome hold by construction.
   - In `task_2_plan.md`, add `"autoAllowBashIfSandboxed": false` to the template's static `sandbox` object. Give it a `_README` rationale: the profile's `allow` list stays the grant surface for Bash, and the permission mode decides everything else. Task 6's `shippedSandboxSettings()` then grades it with no further change. Replace the *"Do not set `autoAllowBashIfSandboxed`…"* sentence.
   - In the story index, drop the **Unresolved** bullet, or restate it as settled by the explicit `false`.
   - In `task_15_plan.md` (the `THE PERMISSION MODE IS dontAsk:` line) and `task_13_plan.md` (§6's unresolved list), remove the *"how `dontAsk` interacts with `autoAllowBashIfSandboxed`"* clause.

   If the writer keeps the default `true` instead, the canonical restatement must stop claiming that a sandboxed Bash call with no entry is refused. Every Bash-scoped sentence in Tasks 13–22, 25 and 27 then needs rewording, and the story index must say which one applies.

2. **The hooks pin can name a directory the profile does not write-protect** — `task_4_plan.md` (the `hr_pinned_hooks_path` row), `task_3_plan.md` (the protected set, item 3), and the story index (`## Context` → *"The hooks pin follows from the same rule."*).
   - **What Task 4 pins.** It pins every unsandboxed wrapper git call to the main repository's configured `core.hooksPath`, read from `<common>/config`. An absolute value is used as is, a relative one is joined to the main checkout, and an unset one gives `<common>/hooks`.
   - **What Task 3 protects.** On both sides, it protects only `<repoRoot>/<resolveGithooksDir(config)>`.
   - **Why the two diverge.** `cli/src/generators/githooks.ts` → choice 1: *"`init` points `core.hooksPath` at the configured directory only when it is unset or already equal — never when it points somewhere else."* An adopter with a foreign `core.hooksPath`, such as `.husky`, is a supported configuration. There, the pinned directory is `<main>/.husky`. The profile's own `Write(//<repoRoot>/**)` allow lets the file tools, which run outside the sandbox, write a `pre-push` there. The next excluded `push-branch.sh` then runs that hook unsandboxed, with full network access.
   - **The unset case.** It pins `<main>/.git/hooks`, and the protected set has no file-tool rule for it either.
   - **The claim it breaks.** The Context's argument protects the **value**: *"read from the main repository's `.git/config`, which the sandbox cannot write and Task 3 denies to the file tools"*. It does not protect the **directory** that value names. That is goal 7's rule: *"Anything that runs outside the sandbox must not be writable from inside it."*

   **Fix:** Make the pinned directory provably one the profile protects, on both sides, for every configuration `init` leaves in place.
   - Option one: `hr_pinned_hooks_path` returns 1 (a refusal under each wrapper's exit contract) unless the resolved directory equals the protected hooks directory or `<common>/hooks`, and `task_3_plan.md` adds `<repoRoot>/.git/hooks` (kind `directory`) to `protectedPaths`.
   - Option two: protect the configured directory itself.
   - Whichever is chosen, the value compared against must not come from a file the run can write. The main checkout's `harness.config.json` is reachable through `Edit(//<repoRoot>/**)`. So either protect it as well, or compare against a value fixed at generation time.
   - State the chosen rule in the story index's hooks-pin paragraph. Add a refusal case to Task 4's suite: a foreign `core.hooksPath` in the main `.git/config`.

3. **Scope register: no derivation entry reaches four sites this branch makes false** — the story index (`feat_unattended_bash_sandbox_story_plan.md`, `## Scope register`), plus `task_8_plan.md`, `task_17_plan.md` (or another `cli` task) and `task_26_plan.md` for ownership.
   - Entry G's patterns do not match *"would hang"* or *"would park"*. Entry H only walks files some task already targets. Entry B looks only for repo-relative claims. Re-running entry H's first step over entry G's full pathspec, and reading each hit with its sentence, reaches these sites:
     - `cli/templates/claude/harness-task-offer.md` (*"A remote address is worse: the run has no web access granted at all, so it would hang rather than fail."*). This is an adopter template. Task 2 puts `WebFetch` and `WebSearch` in `deny`, and Task 15 makes the mode `dontAsk`, so the call now fails at once. Its rendered copy is `examples/notes-app/.claude/harness-task-offer.md`. The example README keeps that copy as live, not frozen, so it owes the re-render. This checkout's `.claude/harness-task-offer.md` is the self-adoption output, `no-change` as in row 123.
     - `plugin/instructions/docs_orchestration_instructions_autonomous.md` → the **Paths (Override-A equivalent)** step (*"`<MAIN_REPO>` (for the global kill switch only) is the first entry of `git worktree list`"*). Task 8 adds a push under `<MAIN_REPO>` to this file, so *"only"* becomes false.
     - `cli/src/commands/doctor.ts` → the `--remote-job` help paragraph (*"so its preflight stops before a session that would park"*). Under `dontAsk`, a profile gap is a refused call, not a park.
   - **Corrected derivation entries**, strictly wider than the ones on the page:
     - (a) Change entry H's artifact from *"every file named in a `### Targets` list"* to every file under entry G's pathspec. Re-run its first step over that whole pathspec, keeping the same traversal and decision rule.
     - (b) Add a command entry for `<MAIN_REPO>` scoping sentences: `git grep -n -F '<MAIN_REPO>' -- plugin`. Decision rule: a sentence that restricts or describes what `<MAIN_REPO>` is used for is `change` in any file where Tasks 8–10 add a push under it.
   - **Rows and owners:** add one row per site, then a Work bullet in the owning per-task file. The task-offer template goes to a `cli` task, for example Task 17. Its example copy goes to Task 26, mirroring it. The docs-fork sentence goes to Task 8. The `doctor.ts` help sentence goes to the task Must Fix 4 names.

4. **`doctor`'s own `--help` text and module header state the old `--remote-job` count, and no task changes them** — `task_7_plan.md` (or `task_27_plan.md`).
   - Tasks 6 and 7 make `profile-sandbox` and `profile-write-protection` fail under `--remote-job`. Three sentences in `cli/src/commands/doctor.ts` then become false:
     - the user-facing help paragraph, *"`${REMOTE_JOB_FLAG}` turns three warnings into failures: profile-paths, … profile-tracked, … and plugin-permissions"*;
     - the module header, *"it changes three profile checks' grades"*;
     - the `REMOTE_JOB_FLAG` doc comment, *"`profile-paths`, `profile-tracked` and `plugin-permissions` fail instead of warning"*.
   - Task 13 corrects the same count in `docs/cli.md` only. `.claude/context/cli.md` → `## What "done" means here`: *"Where the header states a rule, the change either satisfies it or amends the header in the same edit"*. `grep -rn "turns three warnings" cli/test` prints nothing, so no case moves with the edit.

   **Fix:** Add `cli/src/commands/doctor.ts` to `task_7_plan.md`'s Targets, since Task 7 lands the second of the two new checks. Add a Work bullet that rewrites all three sentences to the five-check set, keeping the taken-opt-out exception, in the same words Task 13 gives `docs/cli.md`. Also reword *"a session that would park"* to the canonical restatement (Must Fix 3's site). Add a verification that `grep -n 'three' cli/src/commands/doctor.ts` hits no `--remote-job` count.

## Should Fix

1. **Register `Site` cells still cite line coordinates only** (repeated from iteration 0). Rows 50–123 give sites as *"line hints 44, 1100, …"* with no quoted anchor or symbol. Several of those files are edited by earlier tasks before the owning task reaches them. Give each row a quoted substring or a symbol, and keep line numbers as hints beside it if useful.
2. **`task_26_plan.md` cites a route no conventions document names** (repeated): *"through the scratch-run route the conventions document names"*. The route is `${CLAUDE_PLUGIN_ROOT}/agents/layer-implementer.md` → **The probe route, in every mode.** It runs `.mjs`/`.js` files and never `.sh`. Also say that the scratch render is removed in-process, not by shelling out to a recursive removal (`.claude/context/conventions.md` → `## Shell assets`, *"Never shell out to a recursive removal"*).
3. **Sentences that call `acceptEdits` the unattended run's mode are kept verbatim.** Examples: `docs/analyze.md` (*"An unattended run's `--permission-mode acceptEdits` does not cover it"*, row 82), `docs/config.md` §3 (row 145), and `ARCHITECTURE.md`'s `.claude/` namespace row (row 127). Entry G's own exception says a line naming `acceptEdits` as the current shipped default is `change`. Keep the measured fact, but scope the wording to the measurement, e.g. *"measured under `--permission-mode acceptEdits`"*, so it no longer reads as the run's current mode.
4. **`<MAIN_REPO>` is classified differently per file** (narrowed from iteration 0).
   - Tasks 8–10 add a `derived at runtime` row in some files.
   - `user_review_fix_plan_writing_instructions_autonomous.md` declares `<MAIN_REPO>` *"none of the three"* vocabularies, *"bound where it is written"*.
   - The commands treat it as a path placeholder resolved by their own text.

   Each file is self-consistent. Still, state one classification in the story index, so the new rows match `plugin/docs/AUTONOMOUS_FLOW.md`'s `derived at runtime` row and the files that classify it otherwise stay as they are on purpose.

## Nice to Have

1. `cli/src/doctor/checks.ts` (the `CHECKS` doc comment) and `docs/cli.md` §7 both say *"a missing profile makes the three profile checks unanswerable"*. That count is already stale: four `profile-*` checks precede this branch. Two more make it worse. Rows 132 and 144 keep it as `no-change`, which is right under entry G's rule, but a one-word fix (*"the profile checks"*) would fit naturally into Tasks 13 and 27.
