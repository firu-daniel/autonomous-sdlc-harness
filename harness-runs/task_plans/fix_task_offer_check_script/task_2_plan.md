### Task 2 — Shrink fence item 4 to the rendered `{{taskOfferCheckCommand}}` invocation

**Goal:** Take the opt-out one-liner out of the always-loaded template: item **4. Opt-out.** in `cli/templates/claude/CLAUDE.md` names the bare script invocation through a new placeholder holding the whole rendered command, and states the exit contract in one sentence.

**Depends on:** Task 1, which exports from `cli/src/generators/outerLoopScripts.ts` `taskOfferCheckInvocation(config: HarnessConfig): string` — `scriptInvocation(outerLoopScriptsDir(config), 'task-offer-check.sh')`, i.e. `bash <scriptsDir>/task-offer-check.sh`, repo-relative and unquoted. This task substitutes exactly that return value and formats nothing itself: the same string is the inner text of the `Bash(…)` rule Task 3 writes, so a second spelling here — a template-side `bash {{scriptsDir}}/task-offer-check.sh`, which renders `bash ./task-offer-check.sh` for a `scriptsDir` of `.` while the rule names `bash task-offer-check.sh` — would break the match the branch exists for.

**Where this task stops.** The settings rule is Task 3's, the `doctor` arms Task 4's, and the test that the template item names the token and carries no inline shell is Task 5's. `cli/templates/claude/harness-task-offer.md` is **not** edited: its answer 4 writes the marker under "the path the fence's opt-out command printed", which names no one-liner (goal 2). The rendered copies under `.claude/` are Tasks 8 and 9's.

### Targets

- `cli/templates/claude/CLAUDE.md` → `## Where a change request runs`, item **4. Opt-out.**
- `cli/src/generators/claudeContext.ts` → `writeClaudeContext`'s `render('CLAUDE.md', …)` values and the `render` doc comment

**Work:**

- [ ] **The template item.** Keep the opening sentence (`.claude/harness-no-offer` at the **main checkout's** root; the checkout may be a linked worktree or a run copy, and the marker is written once for all of them). Replace everything from *"Test it with the shell rather than by reading anything:"* through the sentence ending *"…clause 1 has already excluded those."* with: run `{{taskOfferCheckCommand}}` (as an inline code span), bare, with no argument, from the root of the checkout you are running in, rather than reading anything; it prints the main checkout and exits 0 **only** when it found one and found no marker there, and that is the one outcome on which the offer proceeds — any other outcome is silence: a non-zero exit, no output, the command declined, or the script not there. Keep the remaining sentences of the item unchanged in substance: presence-only, never read, parse or act on anything inside it (and why); the file is normally absent, absent means only *not opted out*, and a check you cannot make is silence, never a remark to the user. The `jq`, registry and clone-layout detail moves to the script's header (Task 1) and is not restated here. Change nothing else in the file.
- [ ] **`claudeContext.ts`.** Add `taskOfferCheckCommand: taskOfferCheckInvocation(config)` to the values `writeClaudeContext` passes to `render('CLAUDE.md', …)`, importing the helper from `./outerLoopScripts.js`. `assertNoneSurvive` stays on; extend the `render` doc comment's list of substituted values with "the fence's script invocation", which is built from a configured `scriptsDir` and has no business carrying `{{…}}` either. The identity test (`keepsIdenticalProjectFile`) compares against `claudeMdContent`, so it follows the new render with no change.

**Verification:**

- `bash scripts/typecheck.sh` passes.
- `git grep -n -F '$(' -- cli/templates/claude/CLAUDE.md` prints nothing, and `git grep -c -F '{{taskOfferCheckCommand}}' -- cli/templates/claude/CLAUDE.md` reports exactly one occurrence.
- `git grep -l -F 'worktree list --porcelain | sed' -- cli/templates` prints nothing — the one-liner has left the template tree.
- `git diff --name-only <base> -- cli/templates/claude/harness-task-offer.md` prints nothing (`<base>` from a bare `git merge-base HEAD origin/dev`).
