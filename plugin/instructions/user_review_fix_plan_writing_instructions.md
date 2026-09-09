# Supervised user-review fix-plan writing flow

Run `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fix_plan_writing_instructions_core.md` **`## Flow` steps 1–8 and step 11**, its **`## Convergence`**, and its `## Context discipline` verbatim by reference, with the bindings below. Do not restate the review-file discovery, the round-suffix resolution, the writer prompts, or either gate — they are canonical there.

**This is a supervised, single-session flow.** There is no dispatch counter, no `STOP` file check, and no orchestrator loop — those belong to the semi-autonomous flows. The same holds inside both plan-review gates: to stay consistent with the rest of this supervised flow, neither gate increments a `.dispatch_counter` and neither checks a `STOP` file — each is bounded only by the 5-iteration cap the core states. The core's `## Flow` preamble leaves that scaffolding to its fork; this fork's value for it is **none**.

---

## Resolved values

The tokens below are neither Mode-contract **bindings** (`## Mode contract — bindings`, immediately below) nor ordinary **path placeholders** (`<branch>`, and the `<findings_file>` / `<feedback>` the core binds at their points of use): they resolve from the runtime or from the adopting repository's `harness.config.json`, are declared here once, and after this table the body uses each one as an ordinary placeholder.

| Token | Class | How to resolve it |
|---|---|---|
| `<repo_root>` | derived at runtime | The absolute root of the checkout this session runs in. Obtain it with a **bare** `git rev-parse --show-toplevel` and build every literal path from the result. Never embed the `$(…)` substitution inside another shell command, and never stash it in a shell variable across separate Bash calls — separate calls do not share shell state. |
| `<app_dir>` | config value | `appDir` — the app's directory inside the checkout, repo-relative. The **binding** `<app_root>` below is built from it (`<repo_root>/<app_dir>`) and is deliberately a different name: this row is the configured directory, that one is the resolved root. |
| `<state_dir>` | config value | `stateDir` — the run-artifact tree every artifact path the core names is relative to. Default `sdlc-harness/`. It is never dot-named: no path segment of it may begin with a dot. |

---

## Mode contract — bindings

One row per binding declared in `user_review_fix_plan_writing_instructions_core.md` → `## Mode contract — bindings this file uses`, carrying **this flow's value**. The core supplies no defaults (`mode_contract.md` rule (1)), so these values are what complete it; both read orders converge on this pair of files and neither is complete alone (rule (2)).

**Values only.** No row below restates a flow step, a dispatch block or a writer prompt. One value — `<terminal_handoff>` — is a procedure too long for a table cell and is stated in full in the subsection **of this same section**, immediately below the table; it is inline in this fork, not a pointer to a third file (rule (2)). That subsection is also the one place this fork restates text the core also carries — the core's `## Convergence` fact list, deliberately, and to be mirrored on change; see the `## Convergence` bullet below.

| Binding | Value for this flow |
|---|---|
| `<escalate>` | Stop and surface the blocker, plus whatever path(s) the core's site names, to the user in your text output, then wait for direction. Do not continue. (For either gate's `>= 5` cap — steps 7 and 8, the common case — that is the latest findings path (`<findings_file>`) plus the one-paragraph non-convergence summary the core's site words. For step 2's missing review file it is that blocker plus the format-reference path the core's site names: tell the user to write the review file first.) |
| `<ask>` | Surface the writer's `## Questions` section to the user in your text output and stop; when their answers come back the flow resumes in this same session, which is what distinguishes `<ask>` from `<escalate>`. (The verbatim-relay requirement, the redispatch-with-the-answers-appended rule, the go-back-to-step-6 ordering and the do-not-invent / do-not-paraphrase prohibitions are the core's, on its `## Flow` step 6 — not restated here.) |
| `<terminal_handoff>` | **Present for approval, then stop.** Stated in full in ``### `<terminal_handoff>` — Present for approval, then stop`` below. |
| `<existing_artifact_decision>` | Ask the user to pick **extend** / **rewrite** / **stop**. Their answer selects the outcome of that same name in the core's `## Flow` step 4 — "extend" → the writer in revision mode (step 11), "rewrite" → the writer in initial-write mode (step 5), "stop" → this loop has nothing to do, which hands to `<terminal_handoff>`'s stop path below. (What each outcome does, and the do-NOT-silently-overwrite / do-not-pick-one-yourself prohibitions, are the core's on that same step — not restated here.) |
| `<repo_root>` | The supervised checkout root, resolved as `## Resolved values` above states. On a main-repo run that is the main checkout; a worktree run resolves the same way to that worktree's own root. Every relative `<state_dir>/…` path the core writes — the `<state_dir>/user_reviews/` artifacts, the fix-plan index and its per-finding folder, both gate findings folders — resolves against it. |
| `<app_root>` | `<repo_root>/<app_dir>` — the flow's app root, resolved once at session start. Bound for completeness: this flow invokes no wrapper script, so no step it executes consumes it. That is not a stop condition, and not by any narrowing: `mode_contract.md` rule (1) makes an **unbound** binding a stop condition, and this row binds it — a bound-but-unconsumed binding sits idle. (The core's own table says the same; its `<app_root>` row reads **"No step in this core."**) |

### `<terminal_handoff>` — Present for approval, then stop

**Entered from `## Convergence`** (both gates PASS). Deliver the facts the core's `## Convergence` carries, as this flow's steps 9 and 10 — the numbers they have always had:

9. **Once both gates PASS**, **present the writer's contract summary** to the user — the `fix_plan_file` (index) path, the `fix_plan_dir` (per-finding folder) path, plus the counts (`valid_must_fix`, `valid_should_fix`, `valid_nice_to_have`, `invalid`), plus the mandatory `📌 Dispatch additions: …` disclosure line, in the exact form `${CLAUDE_PLUGIN_ROOT}/instructions/dispatch_discipline_instructions.md` → `## The disclosure line` gives it (including its `none` form, which is a normal outcome) — `<N>` is your own count of the blocks you wrote at the core's `## Convergence` record step, so producing it opens no fix-plan file. Emit the mandatory `📌 Run mode: …` disclosure line too, as its own line beside the `📌 Dispatch additions: …` line and never merged into it, in the exact form `${CLAUDE_PLUGIN_ROOT}/instructions/run_mode_instructions.md` → `## The disclosure line` gives it — including its `none` form (a prompt carrying no such section at all, a normal outcome) and its ignored-directive suffix; the core's `## Convergence` owns that obligation and the form, and this fork-held hand-off value is where it is emitted. Name any **plan-gate findings folder that exists** for this branch — `<state_dir>/business_parity_user_review_reviews/<branch>/`, `<state_dir>/architecture_user_review_reviews/<branch>/` — as **uncommitted artifacts to include when they commit the fix plan**: no flow step on this path stages them, so a commit covering only the fix-plan index, its per-finding folder and the source review loses them at PR time. Check which of the two are present and list only those; where neither exists (both gates passed first time), say nothing — an absent folder is a normal outcome, not a defect. Ask for approval. Do not paste the fix plan content back; the user can open the file.

10. **On approval:** the file is already on disk (the writer saved it). Stop and tell the user the next step is to run `/branch-implement-user-review` in a fresh session.

**On rejection-with-feedback:** carry the user's feedback as `<feedback>` into the core's **step 11** and continue there — it redispatches the writer in revision mode and re-runs **both** gates on the revised plan before it is re-presented here. This fork states no revision prompt of its own; step 11's dispatch, and its re-run-both-gates ordering, are the core's.

**Entered from `## Flow` step 4's stop outcome** (a fix-plan index already exists for the active round and the user picks **stop**): the existing plan is good, so this loop has nothing to do — end the session and tell the user to run `/branch-implement-user-review` next.

---

## What this fork does NOT redefine

- `## Flow` steps 1–3 — the branch determination, the review-file discovery (its round rule and its stricter `grep -E` regex) and the round-matched index + per-finding-folder table. Canonical in the core.
- `## Flow` step 4 — what each of extend / rewrite / stop does, and both of its prohibitions. Canonical in the core; only the interactive question is bound above.
- `## Flow` steps 5 and 6 — the writer's initial-write dispatch prompt, and the `## Questions` handling body. Canonical in the core.
- `## Flow` steps 7 and 8 — both plan-review gates: their dispatch blocks and arg shapes, their findings folders and no-`mkdir -p` rules, step 7's `phases.parity` gate sentence, their verdict parses, their revision prompts, their 5-iteration caps and their go-back-to-step-6 ordering. Canonical in the core.
- `## Flow` **step 11** — the writer-revision dispatch and its re-run-**both**-gates ordering. Canonical in the core, **under its own number**. It is mode-free (both modes make that dispatch) and it is cited by number from outside this file, so a copy here would fork the prompt and make another fork depend on this one for flow-body content, which `mode_contract.md` rule (5) prohibits outright. `<terminal_handoff>` above names this fork's *entry* into it and stops there.
- `## Convergence` — the condition both gates must meet, and the **owner** of the fact set the hand-off carries. Canonical in the core. `<terminal_handoff>` above carries a deliberate copy of those facts, because its value *is* the two-step body that delivers them (it states an approval gate the autonomous fork removes outright and names a slash command, so the core cannot hold it): a change to the core's fact list must be mirrored in that subsection.
- `## Context discipline` — **all** of its rules, including never reading the fix plan, the review file or either gate's findings, never editing a fix-plan file directly, the execute-only-with-a-fork's-binding-table rule with its binding-vs-path-placeholder distinction, and the closing add-nothing-to-a-dispatch-prompt rule. Canonical in the core.

**Ownership.** This fork **binds** values; it never restates a body. Anything that reads as *what to do* rather than *what a value is* belongs in the core (`mode_contract.md` rules (3) and (5)) — the one exception being `<terminal_handoff>`, whose value *is* a procedure the core is forbidden to contain: it names a slash command and states an approval gate the autonomous fork removes.
