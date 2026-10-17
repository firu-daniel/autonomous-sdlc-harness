# Work report research — qa-tester-mobile-mcp

## Verdict

**Do not recommend** a work report for the stub. It does one thing: an optional `Read` of `harness.config.json`, then a one-line `error:`. Its allowlist is `Read` only (`plugin/agents/qa-tester-mobile-mcp.md:4`), so it could not write a report, and its contract says "write **no** files" on every branch (`:10`, `:12`, `:14`). No flow ever dispatches it by name: flows always dispatch `qa-tester`, and that agent's own driver gate stops a mobile configuration (`plugin/commands/branch-qa-test.md:9`, `plugin/agents/README.txt:18-30`). **Recommend the thinning, though.** The file is 1 337 words, of which 89 % is REFERENCE (42 %) or REDUNDANT (47 %) per the classification table below; only 6 % is ACTION. The thinned stub, inlined below, is 360 words. The cost also lands on `ui-tests-plan-writer` and `ui-tests-plan-reviewer`, which read this file up front under `qa.driver: mobile-mcp` (`plugin/agents/ui-tests-plan-writer.md:84`, `plugin/agents/ui-tests-plan-reviewer.md:64`). When the variant is implemented, it should inherit `qa-tester`'s template and swap only the driver items. As in the sibling `qa-tester-mobile-maestro` report, its report goes in the FAIL index and is returned inline on PASS.

## Read tree

| File | Up-front / on demand | Words |
|---|---|---|
| `plugin/agents/qa-tester-mobile-mcp.md` | up-front (the agent definition) | 1 337 |
| `.claude/CLAUDE.md` (template `cli/templates/claude/CLAUDE.md`: 1 320) | up-front (auto-loaded) | 1 695 |
| `harness.config.json` (only `phases.qa`, `qa.driver`) | up-front (the only file the stub reads: `:10`, `:12`, `:28`) | 154 (this repo) |
| `plugin/agents/qa-tester.md` → `## Output contract` → "3. Tests blocked" | cited (`:14`), but the error line is inlined at `:17`, so there is no need to read it | 7 201 (whole file) |
| `plugin/agents/qa-tester.md` (operating contract) | cited (`:57`) for an implementer only; never read on a dispatch, which stops first | (same) |
| `plugin/agents/qa-tester-mobile-maestro.md` | named in the driver-gate routing (`:12`); not read | 1 183 |

**Up-front total: 3 186 words** (1 337 + 1 695 + 154). For comparison with the sibling `qa-tester-mobile-maestro` report, which excludes `CLAUDE.md`, the stub-only figure is 1 337. The stub needs nothing on demand. On lead 13: the read-on-demand table in `CLAUDE.md` points implementation, review and planning at `context/conventions.md`. The stub does none of those and stops before any work, so its own narrower list wins, and the auto-loaded `CLAUDE.md` is the only part of the larger set that is counted.

**Second-order readers.** Under `qa.driver: mobile-mcp`, `ui-tests-plan-writer` and `ui-tests-plan-reviewer` list this file in their `## Read first` (`ui-tests-plan-writer.md:73`, `:84`; `ui-tests-plan-reviewer.md:56`, `:64`), so it is an up-front read on every dispatch of either. They do **not** have to infer the missing capability set from the stub. Their own text already says that "the two mobile variants are declared but not implemented in this release and state no capability set", and fixes the `n/a (<qa_driver> variant declares no capability set)` marker (`ui-tests-plan-writer.md:105`, `ui-tests-plan-reviewer.md:143`). The read therefore buys them nothing beyond confirming that the file exists. Under their `blocker:`-on-unreadable rule (`ui-tests-plan-writer.md:87`, `ui-tests-plan-reviewer.md:71`), though, the file must stay readable at its path.

## Dispatch sites and phases

| Site | Dispatches this agent? |
|---|---|
| `plan_orchestration_instructions_core.md` → `### E.1 Run QA` (`:449`) | No. It dispatches `qa-tester` by name (`:135` heartbeat). |
| `user_review_fixes_instructions_core.md` → Phase QA (`:140`) | No. It is Phase E by reference. |
| `qa_test_instructions.md` / `branch-qa-test.md` | No. Dispatch is "always by the single name `qa-tester`, never a per-driver name" (`branch-qa-test.md:9`). |
| `qa-tester.md:14` driver gate | It returns an `error:` that *names* the mobile variant (`:204`). It does not route to it. |

**Effective dispatch count per branch: 0.** The stub can be reached only by a hand dispatch. Its own text calls the not-implemented stop "the terminal outcome, not a routing hop" (`:14`). In practice the hop to the stub never happens, because `qa-tester` is already the terminal. `plugin/docs/AUTONOMOUS_FLOW.md:45` lists "Interactive-test agents, one per configured driver", which reads as a dispatch per driver. It is only a file map, and this finding contradicts that reading.

## Prose classification

| Section (lines) | ACTION | REFERENCE | WIRE | REDUNDANT | Notes |
|---|---|---|---|---|---|
| Frontmatter (1–6) | 0 | 50 | 8 | 23 | Only `name`, `tools: Read` and `model` are wire. The 73-word description is REFERENCE: the dispatcher sees it, but nothing parses or quotes it (no other file greps it), so it can be rewritten. Its last sentence repeats the tool-closure section. |
| Intro (8) | 0 | 20 | 0 | 22 | "This file is a declaration…" |
| Phase gate (10) | 25 | 15 | 0 | 34 | The "caller bug, not a licence to improvise" rationale is redundant with `qa-tester.md:12`. |
| Driver gate (12) | 30 | 0 | 22 | 30 | The routing names mirror `qa-tester.md:204`. |
| Not implemented (14) | 30 | 30 | 0 | 60 | It restates the "read no plan / reserve no account / write no files" list for the third time. |
| Error line + rationale (16–20) | 0 | 26 | 30 | 0 | The error literal is **wire** and stays verbatim. It also contains the phrase `not implemented in this release`, which is the grep key `cli/src/config/model.ts:463` names for the implementation sweep. |
| `## Resolved values` (22–30) | 0 | 30 | 0 | 101 | A table for one token, plus a paragraph explaining why path placeholders are not listed. |
| `## What this variant would drive` (32–38) | 0 | 90 | 0 | 86 | Maintainer scope; the third bullet repeats the inherited locator rule. |
| `## Tool closure` (40–46) | 0 | 120 | 0 | 139 | Three paragraphs that each say "a grant that resolves to nothing is a false signal" for a different tool class. Keep one sentence per rule. The browser-closure rule is load-bearing (`CLAUDE.md` → `## Agent authoring rules`). |
| `## What it must never do` (48–53) | 0 | 60 | 0 | 49 | Bullet 4 repeats `:14`. |
| `## Operating contract` (55–59) | 0 | 120 | 0 | 87 | The list of inherited items is useful to an implementer. The "pointer runs one way" paragraph repeats `qa-tester.md:14`. |
| **Total 1 337** | **85 (6 %)** | **561 (42 %)** | **60 (4 %)** | **631 (47 %)** | |

The only true ACTIONs are: read two config keys, pick one of three `error:` reasons, and return. That is two checklist items, so a work report could add nothing to goal (b) here.

## Draft work report template

**For the stub: none.** If one were forced, it would be:

```markdown
- [ ] S1. **Resolve gates** — Read `phases.qa` and `qa.driver` from `harness.config.json`; nothing else.
- [ ] S2. **Return the blocker** — Return the matching `error:` line verbatim; write no file.
```

The stub cannot write this file: it has no `Write`, and no `Bash` either, so the corrected lead 1 (`sed -i`, `cat`, `mkdir -p` are allowed) does not help it. Writing the file would also break the write-nothing wire contract. The return line already carries all the evidence there is.

**For the future implemented variant:** inherit `qa-tester`'s template. The items below are this research's view of what `qa-tester.md` asks for, not a reviewed `qa-tester` template. ⇄ marks an item the mobile variant replaces with a driver-specific one; = marks an item it inherits unchanged.

```markdown
- [ ] Q1. = **Phase and driver gates** — Confirm `phases.qa` true and `qa.driver` is this variant's; else return blocked `error:`.
- [ ] Q2. ⇄ **Reach the target** — Verify the device/emulator target and installed build answer through the pinned server (replaces `base_url` navigate, `qa-tester.md` → ## Preconditions 1).
- [ ] Q3. = **Read the test case** — Read `ui_test_index` and `ui_test_<N>.md` for each `test_ids` entry.
- [ ] Q4. ⇄ **Reset starting state** — Bring the app to the test's start state (replaces same-origin storage clear, ## Preconditions 3).
- [ ] Q5. = **Reserve account** — Run `reserve-qa-user.sh`; handle exit 0/1/2/3 (ref: qa-tester.md → ## How it tests).
- [ ] Q6. ⇄ **Execute steps in order** — Locate by test attribute, act, wait on status token; no undocumented flows.
- [ ] Q7. ⇄ **Capture evidence** — Record observed attribute values / text per assertion, one repo-relative evidence path per step.
- [ ] Q8. = **Classify blocked vs failed** — Try peer sign-in / setup action before `blocked` (ref: qa_test_scenarios.md → QA techniques).
- [ ] Q9. = **Write findings on FAIL** — `mkdir -p`; write `finding_t<T>_<N>.md` and `qa_review_<i>_t<T>.md` with layer tag.
- [ ] Q10. = **Release account** — Release every reserved slot before returning.
- [ ] Q11. = **Return one shape** — `verdict: PASS` / 3-line FAIL / `error:` verbatim.
```

Seven of the eleven items are shared. A common `qa-tester` base template, with a driver block (Q2, Q4, Q6, Q7) swapped per variant, is the right shape, and the maestro sibling report reaches the same split. That would also fit `qa-tester-mobile-maestro`, which differs from this file in substance only at `:3`, `:14`, `:36-37`, the added tool-closure block (`:40-47`), the "Never open a browser" bullet (`:50`, maestro `:42`) and `:59`. `:12` also differs textually, because each stub routes to the other two variants, but it matches once the driver names are normalized.

## Thinning plan

**`plugin/agents/qa-tester-mobile-mcp.md`, from 1 337 to 360 words** (the draft below, measured with `wc -w`).

- **Keep verbatim:** `name`, `tools: Read`, `model`; the error literal at `:17`; the phrase "declared but not implemented in this release" (the grep key at `model.ts:463`), kept in the description as well; the pointer to `qa-tester.md` → "3. Tests blocked".
- **Collapse:** fold the phase gate, the driver gate and the not-implemented stop (`:10–14`, 276 words) into one sentence plus a three-step ordered list. Both routing targets of today's `:12` stay: `web-playwright` (implemented) and `mobile-maestro` (declared, not implemented). Steps 1 and 2 state **reasons**, not new literals, as today's `:10`/`:12` and `qa-tester.md:204` ("e.g.") do. Callers parse only the `error:` prefix (`qa-tester.md:73`).
- **Remove:** `## Resolved values` (131); the intro paragraph (42); three of the four copies of the "read no plan, reserve no account, write no files" list.
- **Rewrite the description** (73 → 45 words). It is REFERENCE, not wire (see the classification), and it keeps the grep phrase.
- **Not added:** a "capability set: none" line. It would be redundant with `ui-tests-plan-writer.md:105` and `ui-tests-plan-reviewer.md:143`. Following the sibling report, the scope bullets must not read as a capability list.
- **Shorten to one `## For the implementer` bullet list:** `What this variant would drive`, `Tool closure` (one bullet: widen only at implementation, never a browser namespace), `What it must never do`, and the inherited-contract list including the one-way caveat.
- **Shared base:** none. Agents cannot include files, so sharing would cost a `ref:` read. The maestro sibling estimates ~480 words for this file under its plan; this draft is tighter (360) because it folds the device-namespace-withholding rule into the single Tools bullet and drops the separate "stopping loudly" paragraph to one sentence.

Thinned stub (draft, 360 words):

````markdown
---
name: qa-tester-mobile-mcp
description: The `mobile-mcp` variant of the interactive-test agent — would drive an installed app on a device or emulator through a device-automation MCP server. Declared but not implemented in this release: every dispatch returns a blocker and drives nothing. Allowlist: `Read` only, no browser-automation tools.
tools: Read
model: inherit
---

You are the **Interactive Test Agent — `mobile-mcp` variant**, declared but not implemented in this release. On every dispatch read only `phases.qa` and `qa.driver` from `harness.config.json`; read no plan, reserve no account, open no session, write **no** files, and return one `error:` line (`${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md` → `## Output contract` → "3. Tests blocked"), its reason the first that holds:

1. `phases.qa` is not `true` — reason: the interactive-test phase is disabled.
2. `qa.driver` is not `mobile-mcp` — reason: name the configured driver and the variant that implements it: `web-playwright` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md` (implemented), `mobile-maestro` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester-mobile-maestro.md` (declared, not implemented).
3. Otherwise, verbatim:

```
error: qa.driver is mobile-mcp; the mobile-mcp variant of the interactive-test agent is declared but not implemented in this release — no test was executed
```

Never return a pass or an empty result: the caller cannot tell "nothing observed" from a clean run.

## For the implementer

- **Drives:** an already-installed build on a device or emulator, through a device-automation MCP server the adopter registers (the plugin ships none). No browser and no `base_url`; the dispatch key replacing it (device target + build) is pinned at implementation.
- **Locators:** the project's test-attribute family from the surface layer's conventions document, as `qa-tester.md` does.
- **Tools:** the allowlist stays `Read` until implemented; then add the tools used and the pinned server's namespace. Never a browser-automation namespace — `qa-tester.md` holds the only grant (`CLAUDE.md` → `## Agent authoring rules`).
- **Never** provision, launch or tear down the app, device or emulator; edit app code or the UI-test plan; or flip a readiness checkbox.
- **Inherits** from `qa-tester.md`, one way: invocation contract, the two absolute boundaries, blocked-vs-failed, account reserve/release, per-single-test namespaced artefacts, split index + per-finding output, the three return shapes. It does not make `qa-tester.md` runnable under this driver. Add only the driver half: server, session, locate/act, evidence read-back.
````

The draft keeps what `plugin/agents/README.txt:25-30` says a stub carries: valid frontmatter, its own allowlist, a statement of what it would drive, and a pointer to `qa-tester.md`. It also still carries no `## Invocation contract` or `## Output contract`.

## Word-count ledger

| File | Today | After | Delta |
|---|---|---|---|
| `qa-tester-mobile-mcp.md` (up-front) | 1 337 | 360 | −977 |
| `.claude/CLAUDE.md` (up-front, unchanged) | 1 695 | 1 695 | 0 |
| `harness.config.json` (up-front, unchanged) | 154 | 154 | 0 |
| Work report template | 0 | 0 (none for the stub) | 0 |
| **Up-front total** | **3 186** | **2 209** | **−977 (−31 %)** |
| Stub only (the sibling report's basis) | 1 337 | 360 | −977 (−73 %) |
| On demand | 0 | 0 | 0 |
| Knock-on: each `ui-tests-plan-writer` / `ui-tests-plan-reviewer` dispatch under `mobile-mcp` | +1 337 | +360 (or 0, see Open Q2) | −977 (up to −1 337) |

**Constraint holds: yes.** It would still hold with the forced two-item template (~35 words).

## Storage and lifecycle

- **Dispatch count:** 0 per branch in every flow. There is no phase key, no `iteration` and no `findings_folder` (the dispatch keys are stated only by pointer, `:57`). The proposed `<phase>/<agent>/report_<index>.md` path has nothing to key on (lead 4).
- **Tools (lead 1, corrected):** `Read` only, with no `Write`, `Edit` or `Bash`, so even the allowed `sed -i`/`cat`/`mkdir -p` are out of reach. The tool-closure section (`:42`) argues against widening the allowlist.
- **Wire contract:** "write **no** files" on every branch (lead 2, in its strongest form). There is no PASS path, so lead 8 does not apply.
- **Leads 3, 5, 9, 10, 11, 12:** none applies, because no artifact is written. There is nothing to stage, review, orphan, index, embed or leak.
- **Hooks:** none in `plugin/hooks/` is relevant, because the stub executes no `Bash` and writes nothing.
- **Future variant (consistent with the maestro sibling):** write once, embedded as a trailing `## Work report` section of the per-dispatch FAIL index `qa_review_<iteration>_t<T>.md`, after the finding pointers and without `N. [ ]` syntax so the E.2 merge and the fix loop do not read it as a fix item (lead 11). On PASS, return it inline, because PASS writes nothing and its `ui_test_pass` commit is fixed-path (leads 3, 8). The `iteration` + `t<T>` + round-suffixed folder makes the key collision-safe (lead 10). Evidence paths must be repo-relative and timestamp-free (lead 12).

## Risks and costs

- **Biggest risk (thinning, not the report): the implementation sweep.** `cli/src/config/model.ts:459-467` names this stub as a load-bearing hit of the `not implemented in this release` grep. A thinning that rewords the error literal or drops that phrase breaks the sweep. It would also break the agreement with `cli/src/generators/harnessConfig.ts:623`, `cli/src/config/check.ts:670` and `schemas/harness.config.schema.json:248`, which all promise that "every interactive-test dispatch returns a blocker". Keep the error line byte-identical.
- **Tool-closure audit risk:** cutting the `## Tool closure` rationale could invite a maintainer to "restore" the default tool set on sight, which is the outcome `:42` guards against. Keep the one-line "widen only at implementation; never a browser namespace" rule.
- **Readers' blocker rule:** renaming, moving or removing the file makes `ui-tests-plan-writer` and `ui-tests-plan-reviewer` return `blocker:` (`ui-tests-plan-writer.md:87`, `ui-tests-plan-reviewer.md:71`).
- **Tests:** no test in `cli/test/` reads this file's prose or description. `init.test.mjs:2137-2143` and `config-command.test.mjs:255` key only on the `mobile-mcp` enum value.
- **Goal (a):** not applicable. Zero dispatches means zero evidence, and the `error:` return is already the full record.
- **Tick cost:** none for the stub. For the future variant, writing once into the FAIL index avoids roughly 11 `Edit`s per test per round on top of `qa-tester`'s fan-out (≈2–3× the UI-test count, `plan_orchestration_instructions_core.md:107`).

## Open questions

1. Should the synthesis exclude declared-not-implemented stubs (this file and `qa-tester-mobile-maestro`) from the work-report scheme by rule, so that no template is ever shipped for an agent that is never dispatched?
2. Under a mobile driver, `ui-tests-plan-writer` and `ui-tests-plan-reviewer` already fix the `n/a` marker in their own text (`:105`, `:143`). Could they skip reading the stub entirely? That would save the whole 1 337 (or 360) words per dispatch, not just the thinning delta. It needs an edit to their `## Read first` driver → file map (`:84`, `:64`), kept consistent with their `blocker:`-on-unreadable rule (`:87`, `:71`).
3. Should `qa-tester` get a base template with a swappable driver block (Q2, Q4, Q6, Q7), decided in the `qa-tester` research, so that mobile implementations inherit it rather than fork it?
4. The stub's own driver gate (`:12`) cannot be reached from any flow (confirmed in review). Should it go, keeping only the unconditional error line? The risk is that a hand dispatch under another driver would then return a false "qa.driver is mobile-mcp".

## Review response

The Must Fix and every Should Fix (1–5) and Nice to Have (1–3) are applied. None was rebutted. On Must Fix 1, the "Capability set: none declared" line is dropped from the draft as redundant rather than kept as a cross-check, which also matches the sibling report's caution that the stub must not read as declaring capabilities.
