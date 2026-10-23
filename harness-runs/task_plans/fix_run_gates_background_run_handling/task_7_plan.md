### Task 7 — Correct the teardown clause in the five autonomous forks' self-pause paragraphs

**Goal:** Each autonomous fork restates §2.5's backoff rule with the clause *"the headless process is torn down at end of turn, so that exit is `rc=0` with no `PAUSE_ACK` …"*. That is true only when nothing is pending. Narrow it to that case and point at §2.5 for what a pending task or `Monitor` changes, so no fork keeps the unmeasured claim Task 6 removes from §2.5. The rule itself — never schedule a `Monitor`, never sleep for minutes, never end the turn to wait out a backoff — is unchanged.

**Depends on:** Task 6. It rewrites §2.5's paragraph opening *"A backoff is not a resumption mechanism, and neither is a `Monitor`."* to the three cases measured on Claude Code 2.1.309, macOS, headless:
- nothing pending → exit `rc=0` at the turn's end (BG1);
- a background Bash task pending → woken on completion, then `rc=0` (BG5);
- a `Monitor` pending → the same (BG6).

The opening sentence stays byte-identical. This task edits no core and does not touch §2.5.

### Targets

- `plugin/instructions/plan_orchestration_instructions_autonomous.md`: **Self-pause on API overload.**
- `plugin/instructions/user_review_fixes_instructions_autonomous.md`: **Self-pause on API overload.**
- `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md`: item 3, **API-overload self-pause.**
- `plugin/instructions/docs_orchestration_instructions_autonomous.md`: **Self-pause on API overload.**
- `plugin/instructions/task_plan_writing_instructions_autonomous.md`: **Self-pause on API overload during planning.**

**Work:**

- [ ] In each of the five paragraphs, replace exactly these words:

  > the headless process is torn down at end of turn, so that exit is

  with these, where `Monitor` keeps its code span as the surrounding sentence spells it:

  > with nothing pending, the headless process exits when the turn ends (Claude Code 2.1.309, macOS; `docs/sandbox-verification.md` → BG1; §2.5 states what a pending task or `Monitor` changes, and why neither is a resumption mechanism), so that exit is

  The parenthetical carries the version and the BG row because the task prompt's `## Constraints` requires *"Every claim about CLI behaviour carries the version it was measured on"* — the same bar Task 6's Verification sets. BG1 is created by Task 11, with the content the story index's `## Context` table fixes; cite it by that id and do not open the document. Use one replacement string, byte-identical in all five. Everything before and after it in each paragraph stays as it is, including each fork's own ending (*"for a flow abandoned mid-phase"*, *"for a fix cycle that never started"*, *"for a checklist that was never finished"*, *"for planning that never converged"*). The plan-orchestration fork cites §2.5 as *"canonical-doc **§2.5**"* and two others as `${CLAUDE_PLUGIN_ROOT}/instructions/autonomous_pause_and_ledger.md` §2.5. The inserted `§2.5` is a back-reference inside a paragraph that already names the document, so it needs no path of its own.
- [ ] Before editing, re-derive the set: `grep -rln 'the headless process is torn down at end of turn' plugin` must list exactly the five targets above. A sixth file is a stop: report it as a blocker rather than editing a file this task does not name.
- [ ] Name no duration.

**Verification:**

- `grep -rn 'torn down at end of turn' plugin` prints nothing.
- `grep -rlF 'with nothing pending, the headless process exits when the turn ends (Claude Code 2.1.309, macOS; `docs/sandbox-verification.md` → BG1; §2.5 states what a pending task or' plugin` lists exactly the five targets.
- The BG id the five forks cite is BG1, which Task 11's Verification bullet *"Every `BG<n>` id the plugin cites"* already covers.
- `git diff --stat` shows each of the five files with a one-line change and no other file under `plugin/instructions/`.
