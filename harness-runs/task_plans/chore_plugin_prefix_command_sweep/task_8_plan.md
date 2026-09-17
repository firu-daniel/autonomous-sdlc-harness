### Task 8 — Qualify the command spellings in the plugin's agents, READMEs, flow whiteboard and samples

**Goal:** The rest of `plugin/` uses the qualified spelling: the agent definitions that name the analyze command, the two directory READMEs, the flow whiteboard and the two sample fixtures.

**Where this task stops.** Five agent definitions that the broad grep reaches (`architecture-reviewer.md`, `business-parity-reviewer.md`, `review-plan-reviewer.md`, `skeptic-reviewer.md`, `user-review-fix-plan-writer.md`) only cite `${CLAUDE_PLUGIN_ROOT}/agents/branch-reviewer.md`, which is a path, so they are not targets. `plugin/docs/AUTONOMOUS_FLOW.md` is likewise path-only. The `description:` frontmatter values below change only in the spelling of the command they name, and no other key is touched. Commands and instructions are Tasks 6 and 7.

### Targets

- `plugin/agents/committer.md`, `plugin/agents/conventions-reviewer.md`, `plugin/agents/conventions-writer.md`, `plugin/agents/task-plan-writer.md`
- `plugin/agents/README.txt`
- `plugin/README.md`
- `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md`
- `plugin/samples/sample_task_plan.md`, `plugin/samples/sample_user_review.md`

**Work:**

- [ ] **Agents.** Qualify the `/harness-analyze` in the `description:` values of `conventions-reviewer.md` and `conventions-writer.md`. Qualify it in `committer.md` (*"whose `/harness-analyze` pass was declined"*). In `task-plan-writer.md`, qualify every `/harness-analyze` and `/harness-analyze <target>`: the conventions-document prohibition bullet, the `stale-rule` and `undescribed-layer` bullets in `## Output contract`, and any other mention. A planner relays these as its recommended follow-up to a person.
- [ ] **READMEs.** In `plugin/README.md`, qualify *"the `/harness-analyze` setup command"* and every other slash spelling. In `plugin/agents/README.txt`, qualify *"setup command `/harness-analyze` dispatches"*.
- [ ] **Whiteboard.** In `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md`, qualify the entry-point row's and the count paragraph's `/harness-analyze` (*"because the row above counts `branch-*` commands and `/harness-analyze` is not one"*). Leave the `branch-*` family noun as it is.
- [ ] **Samples.** In the header blockquotes of `plugin/samples/sample_task_plan.md` (*"the `/branch-start-plan` command"*) and `plugin/samples/sample_user_review.md` (*"the supervised `/branch-start-user-review-fix-plan`"*, *"the autonomous `/branch-user-review` drop"*), qualify each spelling. These fixtures cite one another by task number, finding number and title, and none of those change here (`plugin/samples/README.md`).

**Verification:**

- `grep -rnE '(^|[^A-Za-z0-9_.}/:-])/(branch-([a-z-]*[a-z]|\*)|harness-analyze)([^A-Za-z0-9_./-]|$)' plugin` prints nothing. Tasks 6 and 7 have already landed, so this also closes the whole `plugin/` layer.
- `git diff --name-only -G '^(name|tools|model):' -- plugin/agents` prints nothing, which shows only `description:` could have changed in frontmatter.
- `bash scripts/test.sh` exits 0 (gate 1 validates the plugin under `--strict`).
  - **Deviations from plan:** `bash scripts/test.sh` exited 1 with `6a no machine paths` as its sole failure; `1a plugin manifest`, `1b marketplace manifest` and the other gates passed. Every 6a hit sits outside this task's diff: the worktree's untracked `./.git` pointer file, `harness-runs/scratch/t3npm.log`, and `harness-runs/improvement_observations/feat_readme_summary_compact_llms_txt.md` — the same hits Task 7 recorded. The claim rests on gate 1 passing plus the two greps above printing nothing, not on a clean exit. `plugin/agents/README.txt`'s wrapped paragraph was re-flowed from the qualified line onward to keep its line width.
