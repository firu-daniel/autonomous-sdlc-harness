# Task plan review — iteration 0

## Must Fix

1. **Scope register: derivation entry G is under-inclusive; verified sites no entry reaches** — the story index (`feat_unattended_bash_sandbox_story_plan.md`), plus the per-task files that must own the new rows (`task_14_plan.md`, `task_16_plan.md` or `task_27_plan.md`, `task_18_plan.md`).
   Entry G's first command needs a context word (`prompt`, `allow`, `ask`, `unattended`, …) **on the same line** as the stall word. Entry H only walks files some task already targets. So a sentence wrapped across lines, in a file no task targets, is reached by no entry. Re-walking entry G's decision rule over the tree found these sites. Each one becomes false under Task 15's `dontAsk` default, and none is a row:
   - `ARCHITECTURE.md` → the `**[shipped]** Two flags in the invocation row …` paragraph quotes the shipped line `PERMISSION_MODE="${PERMISSION_MODE:-acceptEdits}"` as **[shipped]**. Task 15 changes that exact line to `dontAsk`, so the quote becomes false the moment Task 15 lands. No entry reaches it, because it contains no stall word at all.
   - `cli/src/core/git.ts`, the module header's invariant 2: *"is a different string and stalls on a / prompt"*.
   - `plugin/hooks/autonomous-protected-branch-guard.sh`, header: *"A named ordinary push stalls at the `git push` / `ask` entry in the adopter's permission profile"*.
   - `plugin/hooks/git-commit-branch-guard.sh`, header item 2: *"in an unattended run an `ask` / cannot be answered, so it is a silent stall"*.

   The same widening also reaches these `acceptEdits` statements. They need rows with a stated disposition. Most are dated measurements or procedures that name the flag, so they are probably `no-change`, but that is the writer's call:
   - `ARCHITECTURE.md` → the `.claude/` namespace row (*"a sensitive path `--permission-mode acceptEdits` does not cover"*);
   - `docs/config.md` → `## 3. \`stateDir\`` (*"`.claude/**` is treated as a sensitive path that `--permission-mode acceptEdits` does not cover"*);
   - `docs/github-integration-research.md` (*"Under `claude -p … --permission-mode acceptEdits`"*);
   - `docs/retrieval-eval.md`, the two `claude -p … --permission-mode acceptEdits` procedure lines;
   - `docs/retrieval.md` → **(v) The unattended session through `.mcp.json`.**

   **Fix:** In the story index, replace entry G's first command with one strictly wider than it. Drop the same-line context conjunction, and add the mode name. Use the same pathspec:
   `git grep -n -i -E -e '(^|[^a-z])stall(s|ed|ing)?([^a-z]|$)' -e 'cannot be answered' -e 'unanswerable' -e 'acceptEdits' -- . ':!harness-runs' ':!docs/retrieval-eval-results.md' ':!examples/notes-app/sdlc-harness' ':!evals/docs-retrieval/transcripts'`
   Keep the second command as it is. Add one row per site above, with its disposition and owning task. The natural owners:
   - `ARCHITECTURE.md`'s quoted `PERMISSION_MODE` line → `task_14_plan.md`. Add it to that file's Targets and Work: quote the new line byte for byte from the watcher template, and keep the paragraph's "never a bypass mode" argument.
   - `cli/src/core/git.ts` → `task_27_plan.md` or `task_16_plan.md`, a `cli` file.
   - The two guard headers → `task_18_plan.md`.

2. **Scope register: entry H reaches sites in targeted files that are not rows** — the story index (`feat_unattended_bash_sandbox_story_plan.md`), `task_27_plan.md`, `task_16_plan.md`, `task_17_plan.md`.
   Entry H's procedure says to read every targeted file in full and apply entry G's rule. Re-walking it over the files Tasks 16, 17 and 27 target reaches these sentences. Each says that an unlisted, `ask`-matched or missing-entry call stalls, hangs or parks, and none is a register row or a Work item:
   - `cli/src/doctor/checks.ts`:
     - the `profile-paths`/renderProfile doc comment: *"a command matching neither `allow` nor / `deny` does not prompt in print mode, it hangs."*
     - the `plugin-permissions` doc comment: *"which turns that stall into a copy-paste"*;
     - the **Under `--remote-job`** paragraph: *"so a gap is a launch that parks rather than an operator's paste"* and *"a missing shell grant has not been observed to stall a run"*;
     - the comment *"complete that is one unreadable file away from a stall"*;
     - the **user-facing** `jobClause` message: *"so a gap here is a launch that parks rather than an operator's paste"*.
   - `cli/src/generators/permissionProfile.ts` → the pairing-invariant doc comment above `assertEveryScriptListed`: *"a dropped form is invisible until the run that used that spelling hangs."*
   - `cli/templates/scripts/commit-on-branch.sh`: *"a caller-side `if [ -d … ]; then` existence check would reintroduce the stall described under WHY A WRAPPER EXISTS AT ALL … an unattended run cannot"*.
   - `cli/test/profile.test.mjs`:
     - the header's continuation *"the run parks."*;
     - `FILE_RULE_KINDS`' comment *"a rule that matches nothing stalls exactly like a rule that is missing"*;
     - the helper-line comment *"and the phase stalls at the first helper"*;
     - the scratch-runner case comment *"invisible until the run that happened to use that spelling parks"*;
     - the assertion message *"between an adopter and a stalled phase"*.

   As planned, row 56 lists `checks.ts` only at line hints 3328, 3439, 4655 and 4812, and row 81 lists only `profile.test.mjs`'s G hits plus 727. So these sites stay unaddressed, and Tasks 16 and 27 give their implementers no licence to edit unlisted lines.
   **Fix:** Add one row per site to the register with its disposition. In the owning per-task file, add each `change` site to Targets and to a Work bullet by quoted anchor:
   - `checks.ts` → `task_27_plan.md`. The `jobClause` message is user-facing, so grep `cli/test` for its old substring in the same edit.
   - `permissionProfile.ts` and `profile.test.mjs` → `task_16_plan.md`.
   - `commit-on-branch.sh` → `task_17_plan.md`.

   Also state in the story index's entry H that the procedure was executed over **every** targeted file while the plan was written. As written, it defers the walk to implementers, so the register cannot close over what H reaches.

3. **Register row 33's disposition is wrong: `docs/cli.md` §7's opening paragraph becomes false** — the story index (`feat_unattended_bash_sandbox_story_plan.md`), row 33, and `task_13_plan.md`.
   Row 33 keeps `## 7. \`doctor\``'s opening paragraph as `no-change` (*"It stays true"*). That paragraph also says *"`--remote-job` can, because it turns three profile warnings into failures"*. Tasks 6 and 7 make `profile-sandbox` and `profile-write-protection` fail under `--remote-job`, so the count becomes false. Task 13 updates only the separate `**--remote-job**` paragraph's *"through those three failures"*.
   **Fix:** Make row 33 `change`, owned by Task 13. Add a Work bullet to `task_13_plan.md` that rewrites *"it turns three profile warnings into failures"* to the new set, keeping the taken opt-out a warning. Make it agree with the `**--remote-job**` paragraph's rewrite.

4. **Deferrals cite this repository's branch names, not a numbered roadmap item** — `task_23_plan.md` and `task_6_plan.md`, plus a `general`-layer per-task file (for example `task_13_plan.md`) for the roadmap rows.
   `.claude/context/conventions.md` → `## Documents of record`: *"A deferral cites a numbered roadmap item, and the number owes a row"*. `docs/development.md` → `## 6. The roadmap this tree defers to` says that READMEs, reference documents and the CLI's own messages *"defer their content to a numbered roadmap item"*. Two tasks write deferrals to branch names instead:
   - Task 23 writes the shipped, adopter-facing `_README` line *"denying them is `feat_unattended_sandbox_measurement`'s to measure"*. That is also an internal name in an adopter-facing surface, which the ledger's `## Adopter-facing documentation` lesson rules out.
   - Task 6's grade argument (*"`feat_unattended_sandbox_preflight` owns the launch refusal"*) lands in `checks.ts`'s doc comment.

   **Fix:** Have a `general` task add rows to `docs/development.md` §6 for the preflight and measurement follow-ups, and list `docs/development.md` → `## 6` in its Targets. Have `task_23_plan.md` and `task_6_plan.md` cite those item numbers rather than branch names. Phrase the adopter-facing `_README` line without this repository's branch vocabulary.

## Should Fix

1. **Register `Site` cells cite line coordinates only** — the story index. Rows 46–125 identify sites as *"line hints 44, 1100, …"* with no quoted anchor. Several tasks (16, 17, 19, 20, 21) edit those files after other tasks have shifted them. Give each row a quoted substring or symbol anchor. Line numbers may stay as hints beside it.
2. **`task_26_plan.md` cites a route no conventions document names.** *"through the scratch-run route the conventions document names"* resolves in none of `.claude/context/conventions.md`, `cli.md` or `plugin.md`. The route lives in `${CLAUDE_PLUGIN_ROOT}/agents/layer-implementer.md` → **The probe route, in every mode.** Cite that, and note that it runs `.mjs`/`.js` files only, never `.sh`.
3. **`<MAIN_REPO>` is classified two ways** — `task_8_plan.md`, `task_9_plan.md`, `task_10_plan.md`. `plugin/commands/branch-start-user-review-fix-autonomous.md` treats `<MAIN_REPO>` as an ordinary path placeholder, resolved by its own text and deliberately left out of `## Resolved values`. Tasks 8–10 add it as a `derived at runtime` row in other files' `## Resolved values`. Pick one classification, in line with `.claude/context/plugin.md` → `## The placeholder vocabulary`, and apply it in every file the three tasks touch.
4. **`task_7_plan.md` does not restate Task 1's interface.** Its Work calls `sandboxOptedOut(config)` (Task 1), but `**Depends on:**` lists only Tasks 3 and 6. Add Task 1 with the `sandboxOptedOut(config: HarnessConfig): boolean` signature.
5. **This repository's own gates under the sandbox** — the story index, `Top risks:` / `Manual setup required:`. Gate 9 (`examples/notes-app`, which installs dependencies inside the checkout) needs the npm registry. Under the empty shipped domain list, a regenerated self-adopted profile will refuse it in every Run gates round. Name this, and either add a reasoned `sandbox.allowedDomains` entry to this repository's own configuration in the manual step, or record it as an expected refusal for the measurement branch.
