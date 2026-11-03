### Task 11 — F14: rewrite the container home spelling out of the earlier sandbox-series run artifacts

**Goal:** No earlier run artifact under `harness-runs/` spells the Gate 15 container user's home directory literally, so gate 6a, whose search string inside the container is that directory, finds nothing there.

**The finding (docs/sandbox-verification.md §5 F14).** The recipe runs as the user `probe` (`docs/development.md` → `useradd -m -s /bin/bash probe`), and inside the container `$HOME` is that user's home directory. Earlier sandbox-series run artifacts quote that directory literally, in shell lines, globs and quoted output, so gate 6a fails there on every Run gates round. An adopter's run is not affected, because its `$HOME` is named nowhere in its tree.

**The decision for these artifacts: rewrite, not exclude.** A gate 6a exclusion for that one path is not a fix, and the task prompt rules it out. Deleting the artifacts would destroy the record. They are run records, not the frozen `examples/notes-app/` capture `.claude/context/conventions.md` → `## Documents of record` protects. Spelling the directory under a placeholder keeps every sentence's meaning, so a rewrite works, and the residual route is not needed.

**The spelling rule (the same one Tasks 12 and 13 apply):**

- In a **shell command line** a person or script would run, where a shell expands it, write `$HOME` (inside a word or a `${…:-…}` default) or `~/` (at the start of a word). For example, a default `${M:-<the literal>/autonomous-sdlc-harness}` becomes `${M:-$HOME/autonomous-sdlc-harness}`, and `ls -d <the literal>/autonomous-sdlc-harness-chore_sbx_probe_*` becomes `ls -d ~/autonomous-sdlc-harness-chore_sbx_probe_*`.
- Everywhere else (quoted output, a quoted profile entry or glob, prose), write `<home>`, the placeholder `docs/sandbox-verification.md` §0 already declares for *"that home directory"*. A path under it reads `<home>/…`. Where a sentence would then lose its referent, add `(the container user's home)` once.
- **Never write the literal in this task's own edits, commit or return.** It is the string `git grep -l -e '/home/prob[e]'` matches, and the bracket keeps that pattern from matching itself.

### Targets

The sites derivation entry A of the story index's `## Scope register` reaches under `harness-runs/`:

- `harness-runs/task_plans/feat_sandbox_probe_linux_legs/task_11_plan.md`
- `harness-runs/task_plans/fix_sandbox_probe_linux_recipe_gaps/task_2_plan.md`
- `harness-runs/task_prompts/fix_linux_sandbox_deny_placeholders_task_prompt.md`
- `harness-runs/task_prompts/fix_linux_sandbox_sibling_glob_trio_task_prompt.md`
- `harness-runs/task_prompts/fix_sandbox_probe_linux_recipe_gaps_task_prompt.md`
- `harness-runs/user_reviews/fix_linux_sandbox_sibling_glob_trio_fix_plan.md`
- `harness-runs/user_reviews/fix_linux_sandbox_sibling_glob_trio_fix_plan/finding_6.md`
- `harness-runs/user_reviews/fix_linux_sandbox_sibling_glob_trio_review.md`

**Work:**

- [ ] Run `git grep -n -e '/home/prob[e]' -- harness-runs` and rewrite every hit by the spelling rule. Change nothing else on any line.
- [ ] In `harness-runs/task_plans/fix_sandbox_probe_linux_recipe_gaps/task_2_plan.md`, rewrite the quoted `docker cp` lines to the form Task 12 gives the recipe: the user's home read once on the host with `probe_home="$(docker exec sbx-probe-linux getent passwd probe | cut -d: -f6)"`, and each source written `"sbx-probe-linux:$probe_home/…"`. Rewrite its verification line about `docker cp` lines to the same spelling.
- [ ] In `harness-runs/user_reviews/fix_linux_sandbox_sibling_glob_trio_fix_plan/finding_6.md`, the instruction *"Do not copy `<the literal>/…`"* becomes *"Do not copy a path under the container user's home (`<home>/…`)"*. The instruction keeps its force.

**Verification:**

- `git grep -l -e '/home/prob[e]' -- harness-runs` prints nothing.
- `git diff --stat -- harness-runs` lists only the eight targets above, and every changed line in `git diff -- harness-runs` differs from its original only in the home spelling.
