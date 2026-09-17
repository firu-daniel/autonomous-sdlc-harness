# Semi-autonomous orchestrator loop

Run `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` Phases **A → A1.5 → A2 → B → C → C2 → E → D** verbatim by reference, with the bindings below. Do not restate the phase bodies — Setup, the Safety contract, every phase, the stop conditions and the "What you must NOT do" list are canonical there, and the unit loop with its substitution table, named exceptions and gated per-unit review step is canonical in `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md`, which the core cites.

**This fork is bound by the semi-autonomous entry point only.** The `/autonomous-sdlc-harness:branch-implement-plan-semi-autonomous` command is its sole reader. It does **not** serve the supervised task-plan implementation flow: `/autonomous-sdlc-harness:branch-implement-plan` reads `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_implementation_instructions.md`, which sends it on to `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions.md` — a separate, human-gated, one-item-per-session loop, and not a mode fork over this core. Two files each declaring themselves the supervised orchestration flow is precisely the naming lie this restructure exists to end.

---

## Resolved values

The three tokens below are neither Mode-contract **bindings** (`## Mode contract — bindings`, immediately below) nor ordinary **path placeholders** (`<branch>`, which resolves from the core's `## Setup` as every path placeholder this flow uses does): they resolve from the runtime or from the adopting repository's `harness.config.json`, are declared here once, and after this table the body uses each one as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<repo_root>` | derived at runtime | The absolute root of the checkout this session runs in. Obtain it with a **bare** `git rev-parse --show-toplevel` and build every literal path from the result. Never embed the `$(…)` substitution inside another shell command, and never stash it in a shell variable across separate Bash calls — separate calls do not share shell state. |
| `<app_dir>` | config value | `appDir` — the app's directory inside the checkout, repo-relative. The **binding** `<app_root>` below is built from it. |
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |

---

## Mode contract — bindings

One row per binding declared in `plan_orchestration_instructions_core.md` → `## Mode contract — bindings this file uses`, carrying **this flow's value**. The core supplies no defaults (`mode_contract.md` rule (1)), so these values are what complete it; both read orders converge on this pair of files and neither is complete alone (rule (2)).

**Values only.** No row below restates a body. Where a binding switches a step on, the row names the file that owns that step and stops there.

| Binding | Value for this flow |
|---|---|
| `<escalate>` | Report the blocker and the relevant path(s) in your text output, then stop the session and wait for direction — do not continue. |
| `<repo_root>` | The supervised checkout root, resolved as `## Resolved values` above states. On a main-repo run that is the main checkout; a worktree run resolves the same way to that worktree's own root. |
| `<app_root>` | `<repo_root>/<app_dir>`, resolved once at session start. It anchors where the app's source tree sits and is **not** a working directory: every `commands.*` string is repo-relative, so the core's Setup step 3 runs each one from `<repo_root>` — resolving one against this root would resolve a nested `<app_dir>` twice. It is deliberately a different name from the config token `<app_dir>` it is built from: that one is the configured directory, this one is the resolved root. |
| `<per_unit_review>` | **`on`** — the per-unit `layer-reviewer` step runs between implementer and committer. Its body is `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `### Per-unit review step`, which the unit loop's step 4 enters on this value; that file is its only owner and this fork restates none of it. |
| `<committer_push>` | *(omitted — append no `push:` line to any `committer` dispatch. This flow deliberately leaves commits unpushed for the human merge step.)* |
| `<reentry_command>` | `/autonomous-sdlc-harness:branch-implement-plan-semi-autonomous` |
| `<planning_command>` | `/autonomous-sdlc-harness:branch-start-plan-semi-autonomous` |
| `<next_step_note>` | **Optional next step.** If you have observations after your hands-on review, write them as a numbered list to `<state_dir>/user_reviews/<branch>_review.md` (round 1) — see `${CLAUDE_PLUGIN_ROOT}/samples/sample_user_review.md` for the format. For follow-up rounds after a first fix cycle, suffix with `_2`, `_3`, … (`<branch>_review_2.md`, etc.). Then run `/autonomous-sdlc-harness:branch-start-user-review-fix-plan` in a fresh session — the writer agent will produce a fix plan at `<state_dir>/user_reviews/<branch>_fix_plan.md` matching the format in `${CLAUDE_PLUGIN_ROOT}/samples/sample_user_review_fix_plan.md`. That command lives in a separate supervised flow — this orchestrator does NOT auto-trigger it. |

---

## What this fork does NOT redefine

- `## Setup (once per session)` — its six steps and the path-placeholder table that resolves every `<bracketed-name>` this flow uses. Canonical in the core.
- `## Safety contract — applies before EVERY Agent dispatch` — the per-run `<state_dir>/STOP` check, the `.dispatch_counter` increment, `MAX_TOTAL_DISPATCHES`, the heartbeat format, and the compose-the-prompt step. Canonical in the core.
- **The unit loop** — its body, the layer routing table, the gated per-unit review step, the substitution table and the named exceptions. Canonical in `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md`, which the core cites by reference.
- Every phase body — **A, A1.5, A2, B, C, C2, E, D**, including each phase's dispatch blocks and hand-offs. Canonical in the core.
- `## Stop conditions (halt and do NOT continue)` and `## What you must NOT do`. Canonical in the core.

**Ownership.** This fork **binds** values; it never restates a body, and it is never cited by another fork. Anything that reads as *what to do* rather than *what a value is* belongs in the core — or in `unit_loop_core.md` when it is loop content (`mode_contract.md` rules (3) and (5)).
