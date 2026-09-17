# Semi-autonomous user-review fix loop

Run `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fixes_instructions_core.md` Phases **A → QA → D** verbatim by reference, with the bindings below. Do not restate the Setup, the Safety contract, the Phase A unit-loop row and its review step, the Phase QA augment + E.0–E.4 loop, Phase D, the stop conditions or the "What you must NOT do" list — they are canonical in that core and in the files it cites (`${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md`, and `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` → `## Phase E — QA testing`).

---

## Resolved values

The four tokens below are neither Mode-contract **bindings** (`## Mode contract — bindings`, immediately below) nor ordinary **path placeholders** (`<branch>`, which resolves from the core's `## Setup (once per session)` as every path placeholder this flow uses does): one is derived at runtime and three resolve from the adopting repository's `harness.config.json`. They are declared here once, and after this table the body uses each one as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<repo_root>` | derived at runtime | The absolute root of the checkout this session runs in. Obtain it with a **bare** `git rev-parse --show-toplevel` and build every literal path from the result. Never embed the `$(…)` substitution inside another shell command, and never stash it in a shell variable across separate Bash calls — separate calls do not share shell state. |
| `<app_dir>` | config value | `appDir` — the app's directory inside the checkout, repo-relative. The **binding** `<app_root>` below is built from it. |
| `<qa_creds_path>` | config value | `qa.credentialsPath` — the repo-relative path of the gitignored test-account file. Read only when `phases.qa` is `true`. |
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |

---

## Mode contract — bindings

One row per binding declared in `user_review_fixes_instructions_core.md` → `## Mode contract — bindings this file uses`, carrying **this flow's value**. That declared set covers the sections the core **cites** as well as the core's own, so this one table completes the whole flow (`mode_contract.md` rule (5)). The core supplies no defaults (rule (1)), so these values are what complete it; both read orders converge on this pair of files and neither is complete alone (rule (2)).

**Values only.** No row below restates a body. Where a binding switches a step on, the row names the file that owns that step and stops there.

| Binding | Value for this flow |
|---|---|
| `<escalate>` | Stop, surface the blocker plus whatever path(s) the core's site names (for a non-convergent review loop, the latest findings file and a one-paragraph summary) in your text output, then wait for direction — do not continue. |
| `<ask>` | Stop and surface the `ui-tests-plan-writer`'s `## Questions` section in your text output; do **not** run the QA loop with an incomplete plan. |
| `<repo_root>` | The supervised checkout root, resolved as `## Resolved values` above states. On a main-repo run that is the main checkout; a worktree run resolves the same way to that worktree's own root. The core's QA.1+ `test_credentials` clause therefore names `<repo_root>/<qa_creds_path>`. |
| `<app_root>` | `<repo_root>/<app_dir>`, resolved once at session start. It anchors where the app's source tree sits and is **not** a working directory: every `commands.*` string is repo-relative, so the core's Setup step 3 runs each one from `<repo_root>` — resolving one against this root would resolve a nested `<app_dir>` twice. Take the string from its `commands.*` key and run it as-is unless that call is **refused**, or `commands.typecheck` holds `<none>` and that gate is therefore not run and recorded as not run — the core's `<test_cmd>` / `<typecheck_cmd>` row states both cases — never invoking the underlying package manager directly and never rewriting a configured command into an absolute path. |
| `<per_unit_review>` | **`on`** — the per-unit `layer-reviewer` step runs between implementer and committer. Its body is `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md` → `### Per-unit review step`, which the unit loop's step 4 enters on this value; that file is its only owner and this fork restates none of it. |
| `<committer_push>` | *(omitted — append no `push:` line to any `committer` dispatch. This flow deliberately leaves commits unpushed for the human merge step.)* |
| `<reentry_command>` | `/autonomous-sdlc-harness:branch-implement-user-review-semi-autonomous` |
| `<next_step_note>` | **Optional next round.** If the user has further observations after this fix cycle, they write `<state_dir>/user_reviews/<branch>_review_2.md` (round 2) following `${CLAUDE_PLUGIN_ROOT}/samples/sample_user_review.md`, then run `/autonomous-sdlc-harness:branch-start-user-review-fix-plan` (supervised) to produce `<branch>_fix_plan_2.md`, then re-run `/autonomous-sdlc-harness:branch-implement-user-review-semi-autonomous`. This orchestrator does NOT auto-trigger that next round — the user invokes it out-of-band when (and if) they want it. |

---

## What this fork does NOT redefine

- `## Setup (once per session)` — its six steps and the path-placeholder table that resolves every `<bracketed-name>` this flow uses, **including the ones the cited sections consume** (the QA-review folders reached two hops out, through `## Phase QA` → `## Phase E` → row `E.3`, among them). Canonical in the core, which is this flow's entry core and therefore owns those paths — never family 1's Setup, whichever file the text happens to sit in.
- `## Safety contract — applies before EVERY Agent dispatch` — the per-run `<state_dir>/STOP` check, the `.dispatch_counter` increment, `MAX_TOTAL_DISPATCHES`, the heartbeat format, and the compose-the-prompt step. Canonical in the core.
- **The unit loop** — its body, the layer routing table, the gated per-unit review step, the substitution table and the named exceptions, this flow's row `UR-A` included. Canonical in `${CLAUDE_PLUGIN_ROOT}/instructions/unit_loop_core.md`, which the core cites by reference.
- Every phase body — **A, QA (the QA.0 augment and the QA.1+ loop), D**, including each phase's dispatch blocks and hand-offs. Canonical in the core, and for the QA loop's E.0–E.4 in `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_core.md` → `## Phase E — QA testing`, which the core cites by reference.
- `## Stop conditions (halt and do NOT continue)` and `## What you must NOT do`. Canonical in the core.

**Ownership.** This fork **binds** values; it never restates a body. Anything that reads as *what to do* rather than *what a value is* belongs in the core — or in `unit_loop_core.md` when it is loop content (`mode_contract.md` rules (3) and (5)).
