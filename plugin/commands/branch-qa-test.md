---
description: Run a supervised interactive-test session on the current branch — write or reuse the UI-test plan, execute it, and present the findings without fixing or committing.
---

# Scope: Run a supervised interactive-test (QA) session on the current branch

**Skip this flow unless `phases.qa` is `true` in `harness.config.json`.**

**This supervised session runs the `web-playwright` driver, and no other.** Read `<qa_driver>` first — before step 1, before any dev server is started and before any agent is dispatched. If it is anything other than `web-playwright`, stop with a one-line message naming the configured `<qa_driver>` and saying that this session implements the `web-playwright` driver only. That is the same terminal outcome the `qa-tester` returns on its own driver gate; stopping here simply avoids starting a server first. Dispatch is unchanged either way — it is always by the single name `qa-tester`, never a per-driver name.

## Resolved values

The tokens below are not ordinary **path placeholders** (`<branch>`, `<N>`, which this file's own text resolves): one is derived at runtime and three resolve from the adopting repository's `harness.config.json`. They are declared here once, and after this table the body uses each one as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<repo_root>` | derived at runtime | The absolute root of the checkout this session runs in. Obtain it with a **bare** `git rev-parse --show-toplevel` and build every literal path from the result. Never embed the `$(…)` substitution inside another shell command, and never stash it in a shell variable across separate Bash calls — separate calls do not share shell state. |
| `<app_dir>` | config value | `appDir` — the app's directory inside the checkout, repo-relative. The app root the dev server serves is `<repo_root>/<app_dir>`. |
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |
| `<qa_driver>` | config value | `qa.driver` — which variant of the interactive-test agent the QA phase runs, and so how that variant reaches the application. This flow runs the `web-playwright` value and no other — see the driver statement above. Read **only** when `phases.qa` is `true`. |

---

## Context: This is the opt-in, supervised counterpart to the automatic QA phase (Phase E) that the semi-autonomous task-plan orchestrator runs. It dispatches the `ui-tests-plan-writer` (to create the UI-test plan if none exists yet, or — only if you ask — to refresh it) and the `qa-tester` (which drives the running app through the browser MCP servers the project registers), then **presents the findings and stops for you**. It does NOT auto-fix and does NOT auto-commit — that is what the implement flows (`/branch-implement-review`, or the semi-autonomous QA loop) are for. This mirrors the supervised, present-and-stop discipline of `/branch-review`.

## Steps
1. This command operates on the checkout this session runs in: commands run from `<repo_root>`, and the app itself lives at `<repo_root>/<app_dir>`. Do not change cwd. Git commands work from any cwd inside the checkout. To run a project command — type-check, tests, the dev server — invoke its wrapper through the configured `commands.*` string in `harness.config.json` **exactly as written**; never rebuild that string from its parts and never write an absolute path in its place; if a configured string is **refused**, the key holds a raw command line rather than the wrapper invocation, so run `bash <scripts_dir>/<name>.sh`, whose body is the line `init` inlined into it and not necessarily the configured string, and report which string you ran.
2. Determine the current git branch with `git branch --show-current`.
3. Confirm the **story index** exists at `<repo_root>/<state_dir>/story_plans/<branch>_story_plan.md`. If it is missing, stop and ask the user — the UI-test plan writer and the qa-tester need it for context.
4. Do **not** start a **dev server** here. The QA instruction owns the server lifecycle and starts it in its own `### 2. Start the dev server (background)` — after the UI-test plan is approved and after the `no_ui` gate that forbids starting one at all. A server started here would sit outside that start/teardown ownership.
5. Read `${CLAUDE_PLUGIN_ROOT}/instructions/qa_test_instructions.md` and follow it. It is the canonical supervised QA flow this command chains to.
6. If anything is missing or unclear, don't make assumptions — ask questions to clarify.
