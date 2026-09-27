### Task 7 — Add the `test-fix-plan-writer` agent and grant it the plan-writer search roster

**Goal:** Create the agent that turns a failing gate run into a split fix plan. It reads the per-round log, diagnoses each failure against the current tree, and writes an index and one self-contained `finding_<N>.md` per fixable failure. Failures it cannot fix on the branch are listed separately. It never runs a test or a gate itself.

**Depends on:** Task 3 and Task 5.
- **From Task 3:** the directories `test_fix_plans`, where the index `<branch>_<gate_key>_round_<gate_round>.md` and its sibling folder `…/finding_<N>.md` live, and `test_run_logs`, where the machine-local log `<branch>/<gate_key>_round_<gate_round>.log` lives.
- **From Task 5:** `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`, which this agent's findings obey, and substitution row `G.4`, which walks this agent's index. Row `G.4` reads the `**Finding K**` readiness entries, routes by each entry's `_(layer: …)_` tag, and commits with `review_item` over the matching `### K. <title>` pointer heading.

**Why a new agent rather than a reused one.** This argument is recorded in the story index `## Context`; this is the short form. Reusing `user-review-fix-plan-writer` would put a second job inside a resident system prompt, and its step 6 lessons-ledger append must never fire on a gate failure. The `tools:` allowlist rule in the always-loaded project file is satisfied by this agent's own allowlist, which omits every browser namespace.

### Targets

- `plugin/agents/test-fix-plan-writer.md` (new).
- `plugin/agents/README.txt` → `The docs-retrieval grant — one roster, one wire`.

**The contract this task defines** (restated by Task 9, which dispatches it, and Task 8, which reviews its output):

- **Frontmatter.** Exactly these four keys:
  - `name: test-fix-plan-writer`
  - `description:` what it does, that it writes only the fix-plan files, that `plan_orchestration_instructions_core.md` → `## Phase G — Run gates` → `### G.2` dispatches it, and that it runs in the Run gates phase only
  - `tools: Read, Write, Edit, Bash, Glob, Grep, mcp__harness-docs__search_docs`
  - `model: inherit`
- **Initial write:** `Write the test fix plan. Branch: <branch>. Test log: <log_path>. Earlier logs: <comma-separated earlier-round log paths, or none>. Output: <test_fix_plan_path>.`
- **Revision:** `Revise the test fix plan at <test_fix_plan_path> per architecture findings: <findings_file>.`
- **Return:** exactly four lines:

  ```
  fix_plan_file: <index path>
  fix_plan_dir: <per-finding folder>
  fixable: <N>
  not_fixable: <N>
  ```

  An optional `## Questions` section goes above them, with `fix_plan_file: (pending — questions for user)` and nothing written. A `blocker:` line takes their place for an unreadable input.
- **Index format.**
  - `# Test Fix Plan: <branch> — <gate_key> round <gate_round>`.
  - `## Context`: branch, the log path, and a one-sentence summary.
  - `## Phase 2 Readiness — Ordered Fix List`: entries `N. [ ] **Finding K** — <short title>. _(layer: <one or more layers[].name, bottom-up, catch-all last>)_`. The lead paragraph states it is the single source of truth.
  - `## Must Fix`: every fixable failure, as `### K. Title` plus a one-line pointer.
  - `## Not fixable on this branch`: each failure it judges environmental or outside the tree, with the log line quoted, machine paths rewritten (below), and the reason.
  - `## Source failures`: every failing gate or test named in the log, each mapped to a finding number or to the not-fixable list.
- **Per-finding file.** `### K. Title`; the site anchor (path plus symbol or quoted substring, grep-verified); the failure quoted from the log, machine paths rewritten (below); the diagnosis; the concrete fix. It carries no test-run request, per `## The test-run rule`.
- **Machine paths never reach a written file.** The log is machine-local because it carries machine paths, while every file this agent writes is committed, and the self-containment gate (gate 6a) refuses a tracked file naming the running user's home directory. So, before any quoted log text is written: every absolute path under the checkout root is rewritten to its repo-relative form, and every other path under the home directory has that prefix replaced by the placeholder `<home>`. Before returning, every written file is checked for the literal checkout root (from a bare `git rev-parse --show-toplevel`) and the literal home directory (from a bare `printenv HOME`), and neither may appear.

**Work:**

- [ ] **Frontmatter and the opening sections.** Write the frontmatter above. Add a `## Resolved values` table covering `<state_dir>`, `<repo_root>`, `<layer_names>`, `<layer_path_map>`, `<docs_root>`, `<docs_retrieval>` and `<impl_stack>`, modelled on `plugin/agents/user-review-fix-plan-writer.md`'s. Add `## Invocation contract` with the two prompts and *"How the caller consumes your return."*
- [ ] **`## Read on demand` and `## Process`.**
  - Read the log in full. Where earlier logs are given, read them too, and classify each failure as *new this round* (a likely regression from the previous fix) or *persisting*.
  - For each failure, open the failing test or gate's source and the code it exercises, and read the conventions document of the layer the fix lands in.
  - Classify each failure as fixable on the branch or not fixable, the latter meaning an environment problem such as a missing tool, network or credential.
  - **Rewrite machine paths before quoting.** State, as a `### Process` step of its own ahead of the write step, the rewrite rule in the contract's *"Machine paths never reach a written file"* item: checkout-root paths to repo-relative, every other home-directory path to `<home>/…`, applied to every quoted log line in the index and in every `finding_<N>.md`. It is a rule, not a judgement call, and it names gate 6a as the reason. The step's bold lead reads exactly **Rewrite machine paths before quoting.** Task 8's `architecture-reviewer` cites that literal (`test-fix-plan-writer.md` → `## Process` → **Rewrite machine paths before quoting.**) as the rule source of its sub-case (c) machine-path raise, so it must not be reworded.
  - Write the split plan with the `Write` tool at absolute paths. Take `${CLAUDE_PLUGIN_ROOT}/samples/sample_user_review_fix_plan.md` and `…/sample_user_review_fix_plan/finding_<N>.md` as the split-format reference, and adapt the sections as listed above.
  - An unreadable input is reported as `blocker:`, never substituted.
- [ ] **Quality checks, `## Output contract` and `## Revision mode`.**
  - Quality checks: every failure in the log appears under `## Source failures` exactly once; every fixable one has a readiness entry, a pointer and a finding file; no finding asks for a test run (point at `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `## The test-run rule`); the folder name matches the index stem; and a `grep -rlF` of the literal checkout root, then of the literal home directory, over the index and the per-finding folder prints nothing — a hit is rewritten before returning, never shipped.
  - State **what you must not do**: never run the configured test command, a gate, or a test file (the log is the evidence, and Phase G re-runs the gates itself); never append to `<state_dir>/lessons.md`. Name the test command in words, never as the `<test_cmd>` token, which this file's `## Resolved values` does not declare.
  - Revision mode, including the `## Rejected findings` rule, is modelled on `user-review-fix-plan-writer.md` → `## Revision mode`.
- [ ] **The retrieval roster.** In `README.txt` → `The docs-retrieval grant — one roster, one wire`, add `test-fix-plan-writer.md` to the alphabetical list and change **all three** count-bearing sentences from ten to eleven:
  - *"exactly these ten agents"*;
  - *"Renaming either is an edit to the ten agent files above"*;
  - *"whose output must be exactly the ten files listed above"*.

  The *"every plan writer"* sentence then stays true unchanged. The same count in `cli/src/retrieval/server.ts`'s module header is a `cli` file and is Task 1's, not this task's.

**Verification:**

- The frontmatter fence of `plugin/agents/test-fix-plan-writer.md` holds exactly the keys `name`, `description`, `tools` and `model` and no other (`.claude/context/plugin.md` → `## Frontmatter`). `grep -n "^[a-z_]*: " plugin/agents/test-fix-plan-writer.md` lists the fence's key lines, and the list is a subset of those four.
- `grep -n "^tools:" plugin/agents/test-fix-plan-writer.md` shows no browser-automation namespace.
- Every `${CLAUDE_PLUGIN_ROOT}/…` path the file cites exists under `plugin/`. List them with `grep -on "CLAUDE_PLUGIN_ROOT}/[a-z_/.<>N-]*" plugin/agents/test-fix-plan-writer.md` and check each. The list must be a subset of the files present.
- `grep -n "test_cmd" plugin/agents/test-fix-plan-writer.md` prints nothing: the file has no `<test_cmd>` hit, so no undeclared token.
- `grep -c "^  test-fix-plan-writer.md" plugin/agents/README.txt` finds the roster line.
- `grep -nw "ten" plugin/agents/README.txt` prints no line inside `The docs-retrieval grant — one roster, one wire` (the section runs from that heading to `Sample fixture pointers`), and `grep -nw "eleven" plugin/agents/README.txt` shows the three count sentences.
- `grep -n "<home>\|git rev-parse --show-toplevel\|printenv HOME" plugin/agents/test-fix-plan-writer.md` shows the rewrite rule and the pre-return check, and `grep -n "Rewrite machine paths before quoting\." plugin/agents/test-fix-plan-writer.md` shows the step's bold lead inside `## Process`.

**Deviations from plan:**

- The layer's manifest gate (`claude plugin validate --strict plugin`, `.claude/context/plugin.md` → `## Verifying a change in this layer`) was refused by the permission layer in the implementing session. So the closed-frontmatter claim rests on the plan's own `grep -n "^[a-z_]*: "` sweep, not on the validator: the fence carries only `name`, `description`, `tools` and `model`, and the other hits are the `## Output contract` return block.
