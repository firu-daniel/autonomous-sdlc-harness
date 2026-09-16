### 1. `task-plan-reviewer`'s carve-out reads as a resolution rule over paths a task is about to create

**File:** [plugin/agents/task-plan-reviewer.md:60](plugin/agents/task-plan-reviewer.md#L60). Anchor: `plugin/agents/task-plan-reviewer.md` → `## Read first` — "**Guard carve-out.** Pointer resolution binds a cited path". The line number is only a hint.

**Problem.** Task 6 put the byte-identical `**Guard carve-out.**` into `task-plan-reviewer.md` → `## Read first`, right after the `<state_dir>/lessons.md` bullet. Its first half reads *"Pointer resolution binds a cited path, symbol, heading or quoted substring that does not resolve"*.

In the three code reviewers that sentence has a rule to point at: their consequence ladder grades *"a pointer's target does not exist"* as Must Fix. `task-plan-reviewer.md` has no such rule. The story plan admits this (*"C3's pointer-resolution half adds no trigger … a `(new)` target or quoted text a task is about to write is never a finding under it"*), but that sentence is only in the plan. It never reached the definition.

**Who gets it wrong, and how.** `task-plan-reviewer` grades a plan whose `### Targets` names a file the task will create, or whose `**Work:**` bullet quotes text it will add. Neither can resolve before the task runs. Read literally, the carve-out says an unresolvable cited path or quoted substring is bound, so the reviewer files a Must Fix and returns `verdict: FAIL` on a correct plan. Every plan that adds a file is exposed. The false FAIL then uses up one of the loop's five iterations.

**Fix.** Leave the carve-out paragraph byte-identical, since `branch-reviewer`, `skeptic-reviewer`, `layer-reviewer` and `review-plan-reviewer` carry the same text. Add one sentence to the end of that same paragraph, in `task-plan-reviewer.md` only:

```markdown
**Guard carve-out.** Pointer resolution binds a cited path, symbol, heading or quoted substring that does not resolve; a line coordinate — stale, missing or present — never binds it, and is gradable however it is enumerated, including where it is enumerated as a `<state_dir>/lessons.md` entry. A path or quoted text a task is about to create is not a cited pointer under this carve-out.
```

- [ ] Append the sentence as shown.
- [ ] Confirm the byte-identical carve-out still matches in all five carriers: a fixed-string `grep -rlF` for the carve-out text over `plugin/agents` returns the same five files.
