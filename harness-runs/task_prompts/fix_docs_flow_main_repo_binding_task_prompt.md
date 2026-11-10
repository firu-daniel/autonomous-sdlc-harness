`fix_docs_flow_main_repo_binding` makes every autonomous file that names the agent's push spell it one way: `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>`, both paths literal. It also makes every autonomous `<MAIN_REPO>` binding carry the literal-spelling rule in its own `## Resolved values` row. Several autonomous files still describe the push as a bare `<scripts_dir>/push-branch.sh` or with a `$REPO_ROOT` argument, which reads as the sandboxed worktree spelling. Two entry commands and the docs fork still resolve `<MAIN_REPO>` in passing, with no literal-spelling rule.

`fix_clone_main_repo_resolution` (#183) has merged into `dev`. It gave the `<MAIN_REPO>` resolution clause a single home, `plugin/instructions/main_repo_resolution.md` → `## The fallback`. Each site now reads "the path a bare `printenv HARNESS_MAIN_REPO` prints, else the path `${CLAUDE_PLUGIN_ROOT}/instructions/main_repo_resolution.md` → `## The fallback` resolves". This branch does not touch the clause's wording; it adds the literal-spelling rule and fixes the push prose around it.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** The sites below were re-checked at `a8947372` (`dev`), after #183 merged. Re-find each one in the code as it stands when the branch starts.

---

## What is there today

- `feat_unattended_bash_sandbox` moved every agent-issued push to the main checkout's copy of the wrapper, `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>`. Only that copy is in the unattended profile's `sandbox.excludedCommands`, so only that spelling runs outside the sandbox, where an SSH push works. From a run copy the script-allowlist guard does not vouch for the main checkout's copy, so the profile's literal `allow` entry is the call's only grant, and a command carrying a substitution, a pipeline or a variable does not match it.
- **Already fixed since this issue was first written, and not in scope:**
  - No autonomous file mentions a "watcher-supplied" environment or resolves `<MAIN_REPO>` through a `git worktree list --porcelain | head -1 | sed` pipeline any more. The watcher now exports `HARNESS_MAIN_REPO` (`feat_clone_per_run_anchor`, #120), and every site reads it first. #183 owns the clause from here on.
  - The "**Flip the `## Fix planning` entries**" and "**Flip the `## Fixing` entries**" lines, and both "**Commits** land per doc via …" bullets (`plan_orchestration_instructions_autonomous.md`, `user_review_fixes_instructions_autonomous.md`), already name `<MAIN_REPO>/<scripts_dir>/…`.
- **The model to copy.** `plugin/commands/branch-start-user-review-fix-autonomous.md` and `plugin/agents/committer.md` carry a `<MAIN_REPO>` row in their `## Resolved values` tables: the resolution clause, then "Spell it as a literal absolute path in the command, never through a substitution or a variable." The user-review-fix command's hard-boundary paragraph names the push as "`bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>`, both paths literal".
- **`<MAIN_REPO>` bound in passing, without the literal-spelling rule:**
  - `plugin/instructions/docs_orchestration_instructions_autonomous.md` → the paragraph above `## Resolved values` lists `<MAIN_REPO>` among the ordinary path placeholders "which this file's own text resolves", and `## Setup (once, at session start)` step 1 resolves it with the bare clause. The file's push fence under `## Commit mechanics (single source of truth)` already demands literal spelling, so its binding and its push disagree.
  - `plugin/commands/branch-start-docs-autonomous.md` and `plugin/commands/branch-start-plan-autonomous.md` → the same placeholder-list paragraph, and step 2, **Global kill switch**, resolves `<MAIN_REPO>` inline.
- **Bare-name push prose.** These sit beside a correct literal fence, or describe a push made elsewhere, in words an agent can follow into the sandboxed spelling. Treat them as starting evidence; search for others (`git grep -nE "(^|[^/])<scripts_dir>/push-branch\.sh"` and bare `push-branch.sh` mentions).
  - `plugin/agents/committer.md` → the `push` argument: "pushes the branch via `<scripts_dir>/push-branch.sh`".
  - `plugin/commands/branch-start-docs-autonomous.md` and `plugin/commands/branch-start-plan-autonomous.md` → the hard-boundary paragraph "The flow **does** push its own **non-protected** … (via `<scripts_dir>/push-branch.sh`)".
  - `plugin/instructions/plan_orchestration_instructions_autonomous.md` → "**Post-commit push.**": "the direct-`git` points push via `<scripts_dir>/push-branch.sh`".
  - `plugin/instructions/task_plan_writing_instructions_autonomous.md` → both "**Push after the commit.**" paragraphs: "The `<scripts_dir>/push-branch.sh` call above …" and "It uses the `$REPO_ROOT` the calling command … derived at session start", which contradicts the fence's literal `<repo_root>`.
  - `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` → "**Push after the commit.**", with the same two problems.
  - `plugin/instructions/docs_phase_instructions.md` → "**Commit + push.**" ("then `push-branch.sh` as a separate, **ungated** statement … identical mechanics to the docs-catalog engine's per-entry commit"). This reads as shorthand for that section. Make it point at the section's fence or name the main checkout's copy, so no reader takes the bare name as a spelling.
- **`<MAIN_REPO>` rows without the literal-spelling sentence.** Ten files now carry a `<MAIN_REPO>` row in `## Resolved values`. `plugin/instructions/main_repo_resolution.md` and `plugin/instructions/prompt_injection_screen.md` do not carry the sentence in theirs. Decide in the plan whether each is a site an unattended run reads under goal 1.
- The user-invoked commands (`branch-prompt.md`, `branch-user-review.md`, `branch-resume.md`, `branch-pause.md`, `branch-answer.md`, `branch-status.md`) resolve `<MAIN_REPO>` with the same clause and no literal-spelling rule. They run in a supervised session, not under the unattended profile.

## Why it matters

Under `dontAsk`, a command the profile cannot match is refused at once. An orchestrator that follows a bare `<scripts_dir>/push-branch.sh` or a `$REPO_ROOT` argument issues a push that matches neither the `allow` entry nor the `excludedCommands` rule. Either it is refused, or the sandboxed copy runs and its SSH push fails while the wrapper exits 0. The push is best-effort, so the flow logs it and goes on, and the commits stay local with no other sign.

## The goal

1. **Every autonomous file that binds `<MAIN_REPO>` declares it in a `## Resolved values` row**, the way `committer.md` and `branch-start-user-review-fix-autonomous.md` do: #183's resolution clause, then the literal-spelling sentence. That covers the docs fork, `branch-start-docs-autonomous`, `branch-start-plan-autonomous`, and any other site the search turns up under `plugin/` or `cli/templates/` that an unattended run reads. Drop `<MAIN_REPO>` from those files' "ordinary path placeholders" lists, and make step 2 / Setup step 1 point at the row. #183 gave the clause a single home, so the row carries the pointer to `main_repo_resolution.md` → `## The fallback` plus the literal-spelling sentence.
2. **No autonomous file names the agent's push other than as the main checkout's copy.** Prose that refers to the push spells or points at `bash <MAIN_REPO>/<scripts_dir>/push-branch.sh <repo_root>` with both paths literal, never a bare `<scripts_dir>/push-branch.sh` and never a `$REPO_ROOT` argument.
3. **Decide the user-invoked commands explicitly.** Either give them the literal-spelling sentence too, or leave them and say in the plan why a supervised session is fine without it.
4. **A guard against regression.** Add a contract test that fails if an autonomous instruction or command names the push as a bare `<scripts_dir>/push-branch.sh` or with a `$REPO_ROOT` argument, binds `<MAIN_REPO>` without the literal-spelling sentence, or reintroduces "watcher-supplied" or a pipeline resolution of `<MAIN_REPO>`. #183 added a corpus check that every site carries the same resolution clause, `cli/test/main-repo-resolution-corpus.test.mjs`; extend that suite rather than writing a parallel one. Record the mutation that turns each case red, and that it was run red once.

## Constraints

- **Do not change the resolution clause.** Its wording, and where it lives, are #183's. This branch adds the literal-spelling sentence beside it and changes nothing inside it.
- The `plugin/` corpus quotes its own literals across files. Reuse the exact literal-spelling sentence the existing `## Resolved values` rows use ("Spell it as a literal absolute path in the command, never through a substitution or a variable.") rather than writing a new variant, so there is one wording to keep in step.
- Do not change the push wrappers, the profile, the guards or the watcher. The defect is in the prose that tells an agent how to spell the command.
- `scripts/run-gates.sh` must pass.

