### Task 4 — Bring the forks' Override I and commit-point paraphrases and `AUTONOMOUS_FLOW.md` in line with the check

**Goal:** Every plugin file that describes what happens between the intake write and its commit, or summarises the entry format, now says that every path in an entry is repo-relative and that the written file is checked for machine paths before the wrapper runs — each by a pointer to the module, never by restating it.

**Depends on:** Task 2 and Task 3, which add to `plugin/instructions/improvement_observations_instructions.md`:
- in `## The entry format`, the rule under the bold lead **`Every path in an entry is repo-relative.`** (Task 2);
- in `## Commit mechanics`, the check under the bold lead **`Machine-path check — before every wrapper call.`** (Task 3): needles from `git worktree list --porcelain` and `jq -nr env.HOME`, one single-statement `grep -nF`, a hit rewritten by the rule and re-checked, no commit while a hit remains, a check that cannot run logged and passed over.

This task cites those two leads by heading plus lead and restates neither — the module is the canonical policy, and each fork's `Override I` already says the policy *"is canonical in that file and is **not** restated here"*. It edits nothing in the module itself.

**Where this task stops.** A site that names the intake only as a **position** in Phase D's order — the `D` and `R5` ledger bullets, both `Override J` openings, `autonomous_pause_and_ledger.md` `### 1.8`, `AUTONOMOUS_FLOW.md` step 5, `AUTONOMOUS_FLOW_WHITEBOARD.md` — is **not** edited: the check sits inside the intake step and moves nothing in that order (story index `## Scope register`, rows 11, 12, 15, 17, 29, 30). `clarification_digest_instructions.md` is not edited either (row 16).

### Targets

- `plugin/instructions/plan_orchestration_instructions_autonomous.md` — `## Override I — improvement observations intake (autonomous fork only)` → **Commits + pushes** bullet; **Autonomous-fork commit points — the clean-tree invariant** → entries 5 and 8.
- `plugin/instructions/user_review_fixes_instructions_autonomous.md` — `## Override I — improvement observations intake (autonomous fork only)` → **Commits + pushes** bullet.
- `plugin/docs/AUTONOMOUS_FLOW.md` — `## Improvement observations`.

**Work:**

- [ ] Task-flow fork, **Commits + pushes** bullet: open it with *"after the module's machine-path check (`## Commit mechanics` → **Machine-path check — before every wrapper call.**)"* so it reads check, commit, push; leave the rest of the bullet as it is.
- [ ] User-review-fix fork, **Commits + pushes** bullet: the same clause, same wording, so the two forks do not drift apart.
- [ ] Task-flow fork, commit-point entries 5 and 8: in each, after the sentence on skipping and re-entry, add one clause — the file is checked for machine paths and any hit rewritten before the wrapper runs, and a hit that cannot be cleared means no commit, handled like a wrapper refusal (module `## Commit mechanics`). Entry 8 says it by reference to entry 5 (*"the same check as entry 5"*), the way it already inherits entry 5's other properties.
- [ ] `plugin/docs/AUTONOMOUS_FLOW.md` → `## Improvement observations`: in the **Best-effort, never a gate.** paragraph, extend what `improvement_observations_instructions.md` is said to own — *"the entry format, and the commit contract"* — to name the two new rules in reader terms: every path an entry names is written repo-relative, and the file is checked for the machine's own paths before it is committed. One clause, in prose; no command (this document hands a reader nothing to run).

**Verification:**

- Wire sweep, per `.claude/context/plugin.md` → `## Verifying a change in this layer`: `grep -rln 'Machine-path check — before every wrapper call' plugin/` and `grep -rln 'Every path in an entry is repo-relative' plugin/` each print a subset of {the module, this task's three `### Targets` files}, with the module in both — no hits outside that set, and both fork files in the first.
- The two forks' **Commits + pushes** bullets carry the same new clause: `grep -n 'machine-path check' plugin/instructions/plan_orchestration_instructions_autonomous.md plugin/instructions/user_review_fixes_instructions_autonomous.md` shows it in both `Override I` sections.
- No cited heading was renamed: `grep -rn 'AUTONOMOUS_FLOW' plugin/` (the citer sweep `plugin/docs/README.md` prescribes) shows every citation still resolving to an existing `AUTONOMOUS_FLOW.md` heading.
- No fork gained a cross-fork citation it did not already carry: `git diff` on the two forks adds only citations of `${CLAUDE_PLUGIN_ROOT}/instructions/improvement_observations_instructions.md` or the module's own headings.
- `bash scripts/run-gates.sh` fails no gate beyond the baseline the story index `## Context` records.
