### Task 9 — Move `committer.md` and `qa-tester.md` to the anchor, and say "run copy" in every agent's `<repo_root>` row, holding word counts

**Goal:** Give the two agent definitions that place the main checkout the anchor-first resolution. `committer.md` carries the canonical row; `qa-tester.md` carries the canonical clause where it reads the launch profile. Then move the `<repo_root>` row every dispatchable agent shares to **run copy**, keeping that block one wording across every copy. **No agent definition's up-front word count rises** (`.claude/context/plugin.md` → `## Writing agent prose`). Three files grow and are measured and trimmed: `committer.md` and `qa-tester.md`, whose row and clause grow, and `layer-implementer.md`, whose sandbox-refusal sentence trades one word ("worktree") for two ("run copy"). Every other agent takes only the `<repo_root>` swap, which is count-neutral.

**Depends on:**

- **Task 1**, which allow-lists `Bash(printenv HARNESS_MAIN_REPO)` in every generated profile.
- **Task 3**, which exports `HARNESS_MAIN_REPO` to every session the watcher launches.

**The canonical row (`committer.md`), byte for byte as Tasks 8, 11 and 13 carry it:**

```
| `<MAIN_REPO>` | derived at runtime | The main checkout — the path a bare `printenv HARNESS_MAIN_REPO` prints, else the first `worktree ` line of a bare `git worktree list --porcelain`. Spell it as a literal absolute path in the command, never through a substitution or a variable. |
```

**The canonical clause (`qa-tester.md`), byte for byte as Tasks 10–12 carry it:**

```
the path a bare `printenv HARNESS_MAIN_REPO` prints, else the first `worktree ` line of a bare `git worktree list --porcelain`
```

**The shared `<repo_root>` phrase** is `in an autonomous run, its **own worktree**, not the main checkout`. In every agent that carries it, `its **own worktree**` becomes `its **run copy**`, and nothing else in the row changes. That is a two-words-for-two swap, so it moves no count. The `layer-implementer.md` sandbox sentence is not count-neutral, and is measured with the two files above.

### Targets

- `plugin/agents/committer.md`, `plugin/agents/qa-tester.md`.
- The `<repo_root>` row of `plugin/agents/` `architecture-reviewer.md`, `branch-reviewer.md`, `business-parity-reviewer.md`, `docs-reviewer.md`, `docs-writer.md`, `layer-implementer.md`, `layer-reviewer.md`, `review-plan-reviewer.md`, `skeptic-reviewer.md`, `statistics-plan-writer.md`, `task-plan-reviewer.md`, `task-plan-writer.md`, `test-fix-plan-writer.md`, `ui-tests-plan-reviewer.md`, `ui-tests-plan-writer.md`, `user-review-fix-plan-writer.md`.
- `plugin/agents/layer-implementer.md` → **A sandbox refusal is the boundary working, in every mode.**: *"a write outside the worktree"*.

**Work:**

- [ ] **Measure first.** Run `wc -w plugin/agents/committer.md plugin/agents/qa-tester.md plugin/agents/layer-implementer.md` and `grep -rlF 'its **own worktree**' plugin/agents` before any edit, and record both outputs in the deviation notes. These are the ceilings. The figure is read off the files as they stand and is never planned in advance.
- [ ] **`committer.md`.** Replace the `<MAIN_REPO>` row with the canonical row, and apply the `<repo_root>` swap. The row grows, so trim at least as many words elsewhere in `committer.md`. Cut rationale the agent does not act on; keep every edge case, wire literal, cited heading and placeholder (`.claude/context/plugin.md` → `## Writing agent prose`). The `## Output contract`, the fixed commit subjects and every mode name stay byte for byte.
- [ ] **`qa-tester.md`.** In **Mocking requests when a test needs it:**, *"`.claude/settings.autonomous.json` under the **main** checkout, the path on the first `worktree ` line of a bare `git worktree list --porcelain`"* becomes *"`.claude/settings.autonomous.json` under the **main** checkout, "* followed by the canonical clause. *"so a run's worktree carries none"* becomes *"so a run copy carries none"*. Apply the `<repo_root>` swap. Trim words elsewhere in `qa-tester.md` on the same terms as above, so the count does not rise. The driver gate, the `error: blocked — ` wire and every `mcp__…` name stay byte for byte.
- [ ] **The sixteen other agents.** Apply only the `<repo_root>` swap, except in `layer-implementer.md`. There, in **A sandbox refusal is the boundary working, in every mode.**, *"a write outside the worktree, the state directory and the temp directory"* becomes *"a write outside the run copy, the state directory and the temp directory"*. That adds one word, so trim at least one word elsewhere in `layer-implementer.md` on the same terms as the committer and qa-tester bullets. No same-length replacement keeps the sentence natural, so trimming is the route. One candidate, in the same sentence: *"the last two usually mean a host outside the allowlist"* becomes *"the last two, a host outside the allowlist"*, which gaps the verb the first clause already carries. Every wire literal, signature string and profile key in that paragraph stays byte for byte. `task-plan-writer.md`'s deny-listed basename list keeps `cleanup-merged-worktrees.sh`: it is a name.
- [ ] **Measure again and close.** Re-run the same three-file `wc -w`: each figure is at most its recorded ceiling. `grep -rlF 'its **own worktree**' plugin/agents` prints nothing.

**Verification:**

- `wc -w plugin/agents/committer.md plugin/agents/qa-tester.md plugin/agents/layer-implementer.md` reports each file at or below the figure recorded before the first edit.
- `grep -rlF 'its **own worktree**' plugin/agents` prints nothing, and `grep -rlF 'its **run copy**' plugin/agents` lists the same set of files that carried the old phrase before the edit (the set `grep -rlF 'its **own worktree**' plugin/agents` printed at the start, recorded in the deviation notes).
- `grep -n 'worktree list' plugin/agents/committer.md plugin/agents/qa-tester.md`: every hit carries `printenv HARNESS_MAIN_REPO`.
- `git diff plugin/agents` touches no frontmatter line: `name`, `description`, `tools` and `model` are unchanged in every file.

**Deviations from plan:**

- **Measure first (before any edit).** `wc -w plugin/agents/committer.md plugin/agents/qa-tester.md plugin/agents/layer-implementer.md` printed `3675 committer.md`, `5687 qa-tester.md`, `4909 layer-implementer.md` (`14271 total`) — the ceilings. `grep -rlF 'its **own worktree**' plugin/agents` listed 18 files: `qa-tester.md`, `layer-reviewer.md`, `task-plan-reviewer.md`, `architecture-reviewer.md`, `docs-reviewer.md`, `layer-implementer.md`, `committer.md`, `business-parity-reviewer.md`, `user-review-fix-plan-writer.md`, `branch-reviewer.md`, `task-plan-writer.md`, `ui-tests-plan-reviewer.md`, `test-fix-plan-writer.md`, `docs-writer.md`, `review-plan-reviewer.md`, `statistics-plan-writer.md`, `skeptic-reviewer.md`, `ui-tests-plan-writer.md` (the plan's two named files plus its sixteen).
- **Measure again.** The same `wc -w` printed `3669 committer.md`, `5681 qa-tester.md`, `4908 layer-implementer.md` — each at or below its ceiling. `grep -rlF 'its **own worktree**' plugin/agents` prints nothing; `grep -rlF 'its **run copy**' plugin/agents` lists the same 18 files.
- **Trims.** `committer.md`: dropped the rationale clause *"— the guard scans the raw command string, so the escaped byte still matches"* after *"Never escape a mark and pass it anyway"*. `qa-tester.md`: *"— you have no other way to induce a real failure, so never fake one."* became *". Never fake a failure."* `layer-implementer.md`: the plan's own candidate, *"the last two usually mean a host outside the allowlist"* → *"the last two, a host outside the allowlist"*.
- **Verification run.** `bash scripts/typecheck.sh` (the configured `commands.typecheck`) printed `PASS: typecheck`. No test file was created or edited.
