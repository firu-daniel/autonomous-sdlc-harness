### Task 8 — Report uncollected gate runs in the user-review fix core's Done summary and in the improvement observations

**Goal:** A gate run that was stopped, re-launched or lost must surface in two places. The first is the user-review fix flow's Done summary, through the same clause Task 4 adds to the plan core. The second is the improvement-observations intake, as an entry this session notes when the event happens and writes at Phase D. A future reader then sees that the Run gates phase did not collect a run cleanly, even when the round eventually passed.

**Depends on:** Task 4. It appends the Done-summary clause from the story index's `## Context` → **The Done-summary clause** to the plan core's `### D.2 Done summary` Run gates bullet, byte-for-byte. The clause defines the three events:
- **stopped** — a tool-layer notification that a command carrying `run-test-suite.sh` was stopped;
- **re-launched** — this session issuing the run form for a label it had already issued it for;
- **lost** — a `--wait` refusal for a label whose verdict this session never read.

Task 4's G.1 step 2 also states that a session issues the run form once per label. A run form that finds a live run belongs only to a session re-entering after a pause or a stall-watchdog restart, and that run was started by an earlier session. So **re-launched** counts only departures from G.1. Write the observation duty below to that reading: a resumed session's first run form for a label is never a re-launch.

This task copies that clause verbatim and uses those three event names verbatim. It edits neither the plan core nor any script.

### Targets

- `plugin/instructions/user_review_fixes_instructions_core.md`: `### D.2 Done summary`, the *"Run gates (Phase G): passed on round N"* bullet.
- `plugin/instructions/improvement_observations_instructions.md`: `## What the orchestrator may log — rules`.

**Work:**

- [ ] **The user-review fix core's D.2 bullet.** After its last sentence (*"… never a remembered number."*), append one space and then the Done-summary clause quoted in the story index's `## Context`, byte-for-byte. Unlike the plan core's bullet (to which Task 4 adds `. `), this bullet already ends with a period (line 226 today), so the separator here is the single space alone, never a second period. The clause's own closing period then ends the bullet. Keep the whole bullet on its one line. Its other D.2 bullets and its `## Phase G — Run gates` section, which runs the plan core's Phase G by reference and restates none of it, stay unchanged.
- [ ] **The improvement-observation duty.** In `## What the orchestrator may log — rules`, after rule 8 and **without renumbering** (*"rules 1–8"* is cited elsewhere in the file), add one bold-led paragraph, **A gate run stopped, re-launched or lost is always noted.**, in these terms:
  - when this session sees one of the three events the Run gates phase's Done-summary bullet names (`${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` → `### D.2 Done summary`), note it when it happens, with rule 2's evidence: the command, the round, and the notification text or refusal line verbatim;
  - at Phase D, write one `## <one-line problem statement>` entry per event, `category: silent-failure`, with `cost this run:` naming the round and whether its verdict was eventually read;
  - these entries are exempt from rule 3's cap of 5, like the trip-wires, because they are mechanically triggered and bounded by the gate runs this session issued.

  This section is the one each activating entry command already has its orchestrator read at session start (`## Where it runs & the non-blocking rule`, the *"These two passages arrive before the run"* bullet), so no command file changes.
- [ ] Name no duration and no Claude Code time limit in either edit. A *stopped* event is recorded by its quoted notification, not by a figure this file states.

**Verification:**

- `grep -o 'gate runs not collected' plugin/instructions/user_review_fixes_instructions_core.md` prints two lines: the event form and the `none observed` form, both inside the one clause. (`grep -c` would print `1`, because both occurrences sit on the bullet's one line; never break the clause across lines to change that.)
- Taking the text from `Then report the gate runs this session saw go uncollected` up to `never \`none\` for them.` in each core, `plugin/instructions/plan_orchestration_instructions_core.md` (Task 4) and `plugin/instructions/user_review_fixes_instructions_core.md`, the two spans are byte-identical. Compare them with `grep -o` on the clause's opening and closing words in both files.
- `grep -n 'A gate run stopped, re-launched or lost is always noted' plugin/instructions/improvement_observations_instructions.md` hits once, between rule 8 and `## Optimization observations — trip-wires, not reflection`.
- `grep -n 'rules 1–8' plugin/instructions/improvement_observations_instructions.md` still finds each pre-existing citation, and no rule number changed.
