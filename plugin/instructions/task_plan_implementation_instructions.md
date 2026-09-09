## Resolved values

The three tokens below are neither Mode-contract **bindings** (this file declares none) nor an ordinary **path placeholder** (`<N>`, which the orchestration loop in Phase 2 resolves): two are derived at runtime and one resolves from the adopting repository's `harness.config.json`. They are declared here once, and after this table the body uses each one as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<repo_root>` | derived at runtime | The absolute root of the checkout this session runs in. Obtain it with a **bare** `git rev-parse --show-toplevel` and build every literal path from the result. Never embed the `$(…)` substitution inside another shell command, and never stash it in a shell variable across separate Bash calls — separate calls do not share shell state. |
| `<branch>` | derived at runtime | The current git branch of the checkout this session runs in. Determine it with `git branch --show-current`. |
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |

---

## Phase 1 — Get plan context

1. **Read the story index** at `<repo_root>/<state_dir>/story_plans/<branch>_story_plan.md` — its `## Context` (shared feature context) and its `## Phase 2 Readiness — Ordered Fix List` (the iteration source of truth). The body of each task lives in a self-contained per-task file at `<repo_root>/<state_dir>/task_plans/<branch>/task_<N>_plan.md`; read only the per-task file for the item you are about to implement (the orchestration loop in Phase 2 resolves which one). Do **not** read all per-task files upfront, and there is no monolithic `<branch>_task_plan.md`.
2. **Read `<repo_root>/<state_dir>/task_prompts/<branch>_task_prompt.md`** for the original feature/task requirements that drove the plan.

## Phase 2 — Implementation orchestration

**Read `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions.md`** and follow it. That file is the canonical loop (steps, sub-agent prompt rules, commit conventions, notes) — do not duplicate or reinterpret it here.
