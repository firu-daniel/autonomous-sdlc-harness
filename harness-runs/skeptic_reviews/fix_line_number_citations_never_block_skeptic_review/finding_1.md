### 1. `review-plan-reviewer`'s carve-out binds a finding's site anchor to a file the fix is about to create

**File:** [plugin/agents/review-plan-reviewer.md:133](plugin/agents/review-plan-reviewer.md#L133). Anchor: `plugin/agents/review-plan-reviewer.md` → `### Missed checks (Must Fix when applicable to the diff)` — "**Guard carve-out.** Pointer resolution binds a cited path". The line number is only a hint.

**Problem.** Task 4 added the byte-identical `**Guard carve-out.**` to `review-plan-reviewer.md`. Its first half reads *"Pointer resolution binds a cited path, symbol, heading or quoted substring that does not resolve"*. The code review's Finding 1 found this same sentence wrong in `task-plan-reviewer.md`: that file grades plans whose cited paths may not exist yet. The fix appended an exemption **to `task-plan-reviewer.md` only**, with the words *"in `task-plan-reviewer.md` only"*. Nobody checked `review-plan-reviewer.md`. It is the other agent that carries the carve-out *and* grades artifacts whose cited paths can point at files that do not exist yet.

`review-plan-reviewer` is the only one of the five carriers whose subject is **review findings**, and each finding must carry a site anchor. The precision clause this branch wrote into that same per-finding check allows *"a bare path only when the change is the whole file"*. Creating a missing file is exactly that kind of change. The rubric that `branch-reviewer` and `skeptic-reviewer` share lists *"a required accompanying item is missing"* as a Must Fix, so a finding like "add the mandated test file `src/data/search/searchService.test.ts`" is expected. Its correct site anchor is a bare path that does not resolve until the fix loop runs.

The other three carriers are not exposed. `branch-reviewer`, `skeptic-reviewer` and `layer-reviewer` grade the diff, and every path in a diff exists.

**Who gets it wrong, and how.** At B.2 or C2.2, `review-plan-reviewer` meta-reviews a code or skeptic review that contains a missing-file finding. It reads the carve-out literally: a cited path that does not resolve is bound. It files a Must Fix against a correct finding and returns `verdict: FAIL`. The author then has to "fix" an anchor it cannot make resolve without creating the file itself, so the loop spends iterations up to the `iteration >= 5` escalation. The only other way out is for the author to drop a legitimate Must Fix.

**Proof.**
- `grep -rlF 'A path or quoted text a task is about to create is not a cited pointer under this carve-out.' plugin/agents` returns only `plugin/agents/task-plan-reviewer.md`.
- `grep -rlF '**Guard carve-out.** Pointer resolution binds a cited path, symbol, heading or quoted substring that does not resolve' plugin/agents` returns `branch-reviewer.md`, `layer-reviewer.md`, `review-plan-reviewer.md`, `skeptic-reviewer.md` and `task-plan-reviewer.md`.
- `review-plan-reviewer.md` → `**Per-finding files**` bullet: *"the site anchor (the repo-relative path plus the symbol, heading or short quoted substring that locates the change, … and a bare path only when the change is the whole file …)"*.

**Fix.** Keep the shared carve-out sentence byte-identical, as the Finding 1 fix did. Add one sentence to the end of the same paragraph, in `plugin/agents/review-plan-reviewer.md` only, so the paragraph reads:

```markdown
**Guard carve-out.** Pointer resolution binds a cited path, symbol, heading or quoted substring that does not resolve; a line coordinate — stale, missing or present — never binds it, and is gradable however it is enumerated, including where it is enumerated as a `<state_dir>/lessons.md` entry. A path or quoted text a finding's fix is about to create is not a cited pointer under this carve-out.
```

- [ ] Append the sentence as shown, and change nothing else in the paragraph.
- [ ] Run `grep -rlF '**Guard carve-out.** Pointer resolution binds a cited path, symbol, heading or quoted substring that does not resolve; a line coordinate — stale, missing or present — never binds it, and is gradable however it is enumerated, including where it is enumerated as a `<state_dir>/lessons.md` entry.' plugin/agents` and confirm it still returns the same five files.
