---
description: Run the current branch's documentation checklist end-to-end autonomously — one doc written, accuracy-checked and committed per entry, ending at "branch ready for review".
---

# Scope: Run the current branch's docs checklist end-to-end, autonomously (write every doc → branch ready for review)

**Skip this flow unless `phases.docs` is `true` in `harness.config.json`.**

## Resolved values

The tokens below are not ordinary **path placeholders** (`<branch>`, `<slug>`, `<MAIN_REPO>`, which this file's own text resolves — `<MAIN_REPO>` in step 2): they resolve from the adopting repository's `harness.config.json`. They are declared here once, and after this table the body uses each one as an ordinary placeholder. The one anchor this command derives at runtime — `$REPO_ROOT` — is step 1's, and is not a config value.

| Token | Class | How to resolve it |
|---|---|---|
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path in this file is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |
| `<docs_root>` | config value | `docs.root` — the repo-relative directory holding the documentation corpus this flow builds. Read **only** when `phases.docs` is `true`, which is the same gate that decides whether this flow runs at all. |
| `<scripts_dir>` | config value | `scriptsDir` — the directory the outer-loop scripts live in. This file names two of them — `autonomous-watcher.sh`, as the owner of the responsibilities this command deliberately does not have, and `push-branch.sh`, in the hard boundary — and invokes neither. |
| `<default_branch>` | config value | `defaultBranch` — the branch work starts from and merges back into. Never a remembered branch name. Bound for completeness — no step in this file consumes it. |
| `<protected_branches>` | config value | `protectedBranches` — the branches the hard boundary below forbids merging into, pushing to, or opening a PR against. The effective set is these together with `<default_branch>`. The `pre-push` git hook enforces that set; above it, the plugin's `PreToolUse` protected-branch guard together with the generated permission profile's `Bash(git push:*)` **`ask`** entry — evaluated before any `allow`, and unanswerable in an unattended run — is the best-effort layer. |

---

## Context

This is the **docs-catalog** autonomous engine command — a **lean sibling** of `/autonomous-sdlc-harness:branch-start-plan-autonomous`. It walks a pre-authored documentation checklist and, for each entry, dispatches a `docs-writer` to produce one doc and a `docs-reviewer` to accuracy-check it, commits the doc, and moves on — ending at "branch ready for review." It builds the documentation corpus under `<docs_root>`: one doc per business feature and one per cross-cutting concept, plus an `INDEX.md` retrieval map.

It is **much leaner than the code engine** because documentation has no code-shaped risk surface. There is:

- **No planning phase.** The curated checklist **is** the plan (hand-authored, not generated). There is no `task-plan-writer` / `ui-tests-plan-writer` and no approval gate.
- **No code reviewers and no interactive tests.** The per-unit `layer-reviewer`, `business-parity-reviewer`, `architecture-reviewer`, `branch-reviewer`, `skeptic-reviewer`, and the interactive-test (QA) phase **do not apply to prose** and are not run. The single review that fits — "does the doc match the code?" — is the `docs-reviewer`, dispatched once per doc.
- **No flow-progress ledger.** The checklist's `[ ]`→`[x]` markers **are** the resume ledger (see the orchestration file).
- **No run mode.** This engine is **not governed** by the run-mode contract, and says so plainly here rather than implying a coverage it does not have: a docs run starts from the checklist and reads no task prompt, so a directive a task prompt addresses to an orchestrator cannot reach it. The only path that runs the docs phase off a task prompt is the code flows' docs phase, which **is** governed, by its own orchestrator. The governed / not-governed set is `${CLAUDE_PLUGIN_ROOT}/instructions/run_mode_instructions.md` → `## Activation`; none of it is restated here.
- **No clarification channel.** A writer that cannot verify a claim marks it `⚠️ unverified` and continues; it never parks to ask a human.

You are the **orchestrator** for the whole session. You do not write docs and you do not review them — you dispatch `docs-writer` / `docs-reviewer`, flip checklist boxes, and commit. Everything else you delegate.

**This command is execution-context-agnostic.** Worktree creation, central logging, and exit notification are the **watcher's** responsibility (`<scripts_dir>/autonomous-watcher.sh`), NOT this command's. Assume you already run in the correct checkout and resolve every path relative to it.

## Two entry points, one engine

- **(a) Manual / interactive** — you invoke `/autonomous-sdlc-harness:branch-start-docs-autonomous` yourself in the branch's checkout and watch the `[docs · <slug> · …]` heartbeat live. Simplest for validating the flow on a short checklist.
- **(b) Watcher / headless** — the watcher (`<scripts_dir>/autonomous-watcher.sh`) launches this same command with `-p` plus the generated permission profile via `--settings`, inside the per-branch worktree it created from a `<branch>_docs.md` inbox drop. Usage-gated auto-pause/resume is the watcher's, and this engine honors `<state_dir>/PAUSE` so it yields cleanly.

## Steps

1. **Derive anchors once, at session start — never hardcode an absolute machine path:**
   - `REPO_ROOT=$(git rev-parse --show-toplevel)` — the current checkout (the worktree, or the main repo in the manual entry point). Obtain it with a **bare** `git rev-parse --show-toplevel` and build every literal path from the result; never embed the `$(…)` substitution inside another shell command, and never stash it in a shell variable across separate Bash calls — separate calls do not share shell state.

2. **Global kill switch — check at session start.** If `<MAIN_REPO>/<state_dir>/AUTONOMOUS_STOP` exists (the global switch in the **main** repo — the first entry of `git worktree list` (`git worktree list --porcelain | head -1 | sed 's/^worktree //'`), or the watcher-supplied env), halt immediately and report it. Do NOT delete it.

3. **Determine the current git branch** with `git branch --show-current` → `<branch>`.

4. **Confirm the checklist exists** at `$REPO_ROOT/<state_dir>/docs_catalog/<branch>_docs.md`. If missing, stop and tell the user (manual) or log a blocker and end the session (headless) — there is no clarification channel to park on.

5. **Run the docs loop.** Read `${CLAUDE_PLUGIN_ROOT}/instructions/docs_orchestration_instructions_autonomous.md` and follow it. It is the canonical docs orchestration loop (checklist parse, per-entry writer→reviewer→commit, resume-from-checkbox, PAUSE honor, INDEX build). Do not duplicate or reinterpret it here.

## Hard boundary

The flow ends at **"branch ready for review."** It must **never** merge to a branch in `<protected_branches>`, push to one, or open/push a PR. Two layers enforce this at the harness level — the `pre-push` git hook, and above it the plugin's `PreToolUse` protected-branch guard together with the generated permission profile's `Bash(git push:*)` **`ask`** entry, which is evaluated before any `allow` and which an unattended run cannot answer — and this command states the intent so the orchestrator never attempts it. The user does the final review and opens the PR out-of-band.

The flow **does** push its own **non-protected** worktree branch to its upstream after each commit (via `<scripts_dir>/push-branch.sh`) — expected behaviour, not a boundary violation (`push-branch.sh` self-refuses a branch in `<protected_branches>`).
