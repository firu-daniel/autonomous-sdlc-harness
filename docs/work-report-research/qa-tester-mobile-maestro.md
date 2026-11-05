# Work report research — qa-tester-mobile-maestro

## Verdict

**Do not recommend** a work report for this agent today. The stub has one action (gate, then return a fixed `error:` line), one tool (`Read`, `plugin/agents/qa-tester-mobile-maestro.md:4`), and a contract that bars it from writing any file on every dispatch (`:14`). No shipped flow dispatches it by name: Phase E always dispatches `qa-tester`, which gates itself off and returns the routing `error:` line (`plugin/agents/qa-tester.md:14`, `plugin/instructions/plan_orchestration_instructions_core.md:135`). So a report would have no writer, no dispatch and no evidence to add beyond the `error:` line, which is already the evidence. **Recommend the thinning anyway**: the file can drop from 1 183 to about 470 words with no wire change. When the variant is implemented, it should inherit qa-tester's future template with one rule changed: on PASS the report is returned inline, because qa-tester writes nothing on PASS (`plugin/agents/qa-tester.md` → `### 1. All tests pass`).

## Read tree

| File | Up-front / on demand | Words |
|---|---|---|
| `plugin/agents/qa-tester-mobile-maestro.md` | up-front (the whole load) | 1 183 |
| `harness.config.json` (`phases.qa`, `qa.driver` only) | up-front, two keys | n/a (config, not prose) |
| `plugin/agents/qa-tester.md` → `## Output contract` → `### 3. Tests blocked` | **not read**: the blocked line's shape is cited, but the literal is inlined at `:16-18`, so no read is needed | (qa-tester.md is 7 201) |
| `plugin/agents/qa-tester.md` (whole, as the "inherited contract") | only for whoever *implements* the variant; never read by the stub at runtime (`:49`) | 7 201 |
| `CLAUDE.md` (auto-loaded) | up-front, harness-wide, same for every agent | excluded, as in batch 1 |

**Total up-front: 1 183 words.** On demand: 0. The stub reads nothing from the conventions, the lessons ledger or the samples.

**Other readers of this file.** `ui-tests-plan-writer` (`plugin/agents/ui-tests-plan-writer.md:84`) and `ui-tests-plan-reviewer` (`plugin/agents/ui-tests-plan-reviewer.md:64`) list "the configured `<qa_driver>`'s `qa-tester` variant" under their own `## Read first` (`:73`, `:56`), so under `mobile-maestro` this file is an **up-front** read for both. An unreadable variant file is a `blocker:` for both (`ui-tests-plan-writer.md:87`, `ui-tests-plan-reviewer.md:71`), so the stub must keep its path and stay readable even if open question 1 is pursued. They do not read it for a capability set. They read it to confirm there is none: under the mobile drivers the only admissible annotation is `n/a (<qa_driver> variant declares no capability set)` (`ui-tests-plan-writer.md:105`, `ui-tests-plan-reviewer.md:143`). Thinning therefore cuts their load too, but `## What this variant would drive` must not start to read as a capability set, and the file must keep saying "declared, not implemented".

## Dispatch sites and phases

| Site | What happens |
|---|---|
| `plan_orchestration_instructions_core.md` → Phase E (E.1) | Dispatches `qa-tester`, not the stub (`:135`, `:415`). |
| `qa_test_instructions.md` → step 3 | Dispatches `qa-tester` once per test case (`:75`). |
| `branch-qa-test.md:9` | Runs `web-playwright` only and refuses other drivers before any dispatch. |
| `user_review_fixes_instructions_core.md` QA | Same `qa-tester` dispatch (`:70-71`). |
| `qa-tester.md:14` driver gate | On `mobile-maestro`, returns an `error:` line that names this file. It routes nothing on to it ("terminal outcome, not a routing hop"). |

A grep for `qa-tester-mobile-maestro` across `plugin/instructions` and `plugin/commands` finds nothing. **No shipped flow dispatches the stub, so it runs 0 times per branch**; only a hand dispatch reaches it. Its runtime text is a backstop for a dispatch that should never happen.

## Prose classification

Word counts come from `sed -n 'a,bp' | wc -w`.

| Section (lines) | Total | ACTION | REFERENCE | WIRE | REDUNDANT | Notes |
|---|---|---|---|---|---|---|
| Frontmatter (1-6) | 84 | 0 | 55 | 6 (`name`, `tools: Read`) | 23 | The description's last sentence repeats the never-do section. |
| Identity (8) | 42 | 0 | 15 | 0 | 27 | "This file is a declaration…" is said again at `:14`. |
| Phase gate (10) | 74 | 15 | 0 | 0 | 59 | The rationale is near-verbatim from `qa-tester.md:12` ("no reason to open a browser" vs "nothing to drive"). |
| Driver gate (12) | 82 | 20 | 0 | 30 (variant → file map in the error) | 32 | |
| Not implemented (14) | 123 | 20 | 25 | 10 (cites "3. Tests blocked") | 68 | The do-nothing list repeats `:10`/`:12`. |
| Error literal (16-18) | 26 | 0 | 0 | **26** | 0 | **Verbatim.** `qa-tester.md:204` quotes the same driver phrase. |
| "Stopping loudly" (20) | 30 | 0 | 10 | 0 | 20 | Also stated at `qa-tester.md:14`. |
| `## Resolved values` (22-28) | 130 | 0 | 30 | 0 | 100 | One token. The table preamble about path placeholders explains an absence. |
| `## What this variant would drive` (32-38) | 164 | 0 | 130 | 0 | 34 | Keep it as scope for the implementer. The plan writer and reviewer read it only to confirm that no capability set exists (`n/a` marker). |
| `## What it must never do` (40-45) | 227 | 0 | 90 | 0 | 137 | The 134-word tool-closure bullet repeats `CLAUDE.md` → `## Agent authoring rules` and `qa-tester.md:16`. |
| `## Operating contract — inherited by pointer` (47-51) | 200 | 0 | 80 | 0 | 120 | It lists qa-tester's sections; a pointer plus the "one-way" sentence is enough. |
| **Total** | **1 183** | **55** | **435** | **72** | **621** | |

About 52 % of the file is REDUNDANT and under 5 % is ACTION. Two thirds of the redundancy is shared word for word with `qa-tester-mobile-mcp.md` (1 337 words; a `diff` shows they differ only in variant names, `:14`, `:36-37`, the closure text and `:51`).

## Draft work report template

None is shipped for the stub (see Verdict). For reference only, the whole template would be:

```markdown
- [ ] S1. **Gate on phase and driver** — Read `phases.qa`, `qa.driver`; pick the first applicable `error:` reason.
- [ ] S2. **Return the blocker line** — Return exactly one `error:` line; write no file.
```

This is 35 words to record one action whose evidence (the returned line) the caller already logs. The agent cannot write it (`tools: Read`), and writing it would break "write **no** files" (`:14`).

**What the implemented variant's template should inherit from qa-tester.** That template belongs in the qa-tester research and is not yet written in this batch. The mobile variant should reuse its items with the driver-specific item bodies swapped:

```markdown
- [ ] Q1. **Gate on phase and driver** — Stop with `error:` unless `phases.qa` is true and `qa.driver` is `mobile-maestro`.
- [ ] Q2. **Read conventions and inputs** — Read every `<layer_path_map>` conventions doc, `ui_test_index`, each per-test file; unreadable → `error:`. (ref: qa-tester.md → ## Read first)
- [ ] Q3. **Verify device target reachable** — One runner probe against the caller's device target and installed build; failure → `error:`, never provision. (ref: <variant> → ## Preconditions)
- [ ] Q4. **Reserve the QA account** — Run the reserve script; branch on its exit code. (ref: qa-tester.md → reserve/release protocol)
- [ ] Q5. **Run each case's steps** — Invoke the runner per step, assert test-attribute ids and text, capture log and screenshot.
- [ ] Q6. **Classify blocked versus failed** — A precondition reachable by peer sign-in or a documented setup is not blocked. (ref: qa-tester.md → blocked-vs-failed)
- [ ] Q7. **Write findings on FAIL only** — `qa_review_<iteration>_t<T>.md` plus `finding_t<T>_<M>.md`, readiness heading verbatim. (ref: qa-tester.md → ### 2. Some tests fail)
- [ ] Q8. **Release the QA account** — Run the release script on every exit path, including `error:`.
- [ ] Q9. **Return the fixed shape** — `verdict: PASS`, FAIL index pointer, or one `error:` line, word for word.
```

Q1, Q2, Q4 and Q6–Q9 are driver-neutral and could live in a shared qa base template. Only Q3 and Q5 are driver-specific, which matches the stub's own account of the "driver-specific half" (`:14`, `:51`). Following leads 2 and 8, the report is embedded on FAIL as a `## Work report` section of the per-dispatch index the caller already merges, and returned inline on PASS. It is never a separate file in `<qa_review_findings_dir>`, which `review-plan-reviewer` would flag as an orphan (lead 9).

## Thinning plan

`plugin/agents/qa-tester-mobile-maestro.md`, 1 183 words → about 470 (the rows below sum to 468):

| Part | Action | Est. after |
|---|---|---|
| Frontmatter | Keep `name`/`tools`/`model` verbatim and shorten the description to 2 sentences: what it would drive, and "declared but not implemented in this release — returns a blocker". Keep that exact phrase so the description stays a hit for the `cli/src/config/model.ts:463` sweep grep. | 55 |
| Identity + phase gate + driver gate + not-implemented (`:8-14`) | Merge into one ordered list: "Read `phases.qa` then `qa.driver`; return `error:` with the first true reason: (1) phase off, (2) driver ≠ `mobile-maestro` → name the file that implements it (keep the variant → file map), (3) otherwise the literal below. Read no plan, reserve no account, run nothing, write no file." | 110 |
| Error literal (`:16-18`) | **Keep verbatim.** | 26 |
| `:20` | One clause: "a silent success is indistinguishable from a clean run". | 12 |
| `## Resolved values` | Remove the table; `<qa_driver>` is defined inline in the merged gate as `qa.driver`. | 0 |
| `## What this variant would drive` | Keep the three bullets and trim the preamble and the repeated "no browser, no page, no URL". Phrase them as scope for an implementer, never as a list of capabilities, so the `n/a (… declares no capability set)` marker that the plan writer and reviewer grade against stays valid. | 130 |
| `## What it must never do` | Four one-line bullets. Tool closure: "`tools:` stays `Read` until implemented; then add `Bash` and the tools used, never a browser namespace (`CLAUDE.md` → `## Agent authoring rules`)." | 75 |
| `## Operating contract — inherited by pointer` | "Implementation inherits every driver-neutral rule of `qa-tester.md` (invocation, boundaries, blocked-vs-failed, account protocol, per-test mode, output format, return shapes). It adds only: runner invocation, element location, evidence read-back. The pointer does not make `qa-tester.md` runnable under this driver." | 60 |

**Descriptive readers to keep true:** `plugin/agents/README.txt:25-31` and `ARCHITECTURE.md:193` describe the stub as having frontmatter, its own allowlist, a "what it would drive" statement and a pointer to `qa-tester.md`. The plan keeps all four. `.claude/context/plugin.md:47` (no Invocation or Output contract) also stays true.

**Shared base:** none. A base file would add a read to an agent whose whole load is the stub. If both stubs are thinned the same way, the duplication left between them is about 300 words, which is acceptable. `qa-tester-mobile-mcp.md` takes the identical plan and lands at about 480 words, keeping its device-namespace-withholding rule as one sentence. Keep the sentence `.claude/context/plugin.md:47` relies on, that a stub carries no `## Invocation contract`/`## Output contract`, true after the rewrite.

## Word-count ledger

| File | Today | After | Delta |
|---|---|---|---|
| `qa-tester-mobile-maestro.md` (up-front) | 1 183 | ~470 | −715 |
| Work report template | 0 | 0 (none shipped) | 0 |
| **Up-front total** | **1 183** | **~470** | **−715 (−60 %)** |
| On demand | 0 | 0 | 0 |

**The constraint holds: yes.** It would still hold with the 35-word S1/S2 template (about 505 words). The secondary readers (`ui-tests-plan-writer`/`-reviewer` under a mobile driver) also save about 750 words each.

## Storage and lifecycle

- **Dispatches per branch:** 0 in every shipped flow (see Dispatch sites). Under a hand dispatch, 1 per call.
- **Tools:** `Read` only, so the agent has no `Write`, `Edit` or `Bash`, and the corrected lead 1 (`sed -i`, `cat`, `mkdir -p` allowed) does not help without `Bash`. For the future variant, which gains `Bash`/`Write`, I choose to write once, embedded in the FAIL index, and to return inline on PASS. That avoids an edit per tick on top of the runner calls. Granting `Write` to file a report would contradict the closure rationale at `:42`: a grant to an agent that may write nothing.
- **Wire:** "write **no** files" on every dispatch (`:10`, `:12`, `:14`). A report file changes that contract (lead 2).
- **Index / key:** not applicable. For the implemented variant, use the caller's `<qa_review_findings_dir>` + `iteration` + `t<T>` namespace, which is already unique per test and per round (`plan_orchestration_instructions_core.md:96-99`; round suffix per `qa_test_instructions.md:27`). Lead 10's collision does not apply, because the round suffix separates the rounds.
- **Lead 11 (embed):** the future variant has an artifact to embed in, the per-dispatch FAIL index `qa_review_<iteration>_t<T>.md`. The orchestrator merges entries from its `## Phase 2 Readiness — Ordered Fix List` into the round index, so a trailing `## Work report` section has to sit after the finding pointers and must not use `N. [ ]` readiness syntax, or the merge or the fix loop could read it as a fix item.
- **Lead 12 (leaks):** runner evidence (device logs, screenshot paths, device serials, timestamps) must be repo-relative and timestamp-free in the embedded section.
- **Lead 13 (read list):** the adopter's `CLAUDE.md` read-on-demand table points "implementation, review or planning" at `context/conventions.md`. The stub does none of these and reads nothing (`:14`). The stub's narrower list wins, and the larger set does not apply.
- **Hooks:** nothing in `plugin/hooks/` would matter, because nothing is written.
- **Committing:** not applicable. For the implemented variant, the FAIL index is committed with the QA round, and PASS has no commit point (lead 8), so the report goes inline.

## Risks and costs

| Risk | Detail |
|---|---|
| **Thinning drops the "implementation brief"** | `## What this variant would drive` and the inherited-contract list exist so a future implementer starts from a fixed scope (`:34`). Over-trimming them loses design decisions such as no `base_url` and a device-target dispatch key to pin. Keep the bullets. Cut only the restatement. |
| Sweep list in `cli/src/config/model.ts:460-470` (grep phrase at `:463`) | The comment tells an implementer to grep `declared-not-implemented|declared but not implemented|not implemented in this release` and names this stub as a load-bearing hit (`:466`). The error literal keeps the stub a hit. A shortened description that drops the phrase would leave the sweep, so the thinning plan keeps "declared but not implemented in this release" in the description as well. |
| `n/a` capability marker | `ui-tests-plan-writer.md:105` and `ui-tests-plan-reviewer.md:143` grade mobile-driver plans against "variant declares no capability set". Trimmed scope bullets that read as a capability list would invalidate that marker. |
| Up-front read by plan writer/reviewer | A rename, a move or a cut of the file makes both return `blocker:` (`ui-tests-plan-writer.md:87`, `ui-tests-plan-reviewer.md:71`). |
| Cross-file literal | The error line's driver phrase is mirrored in `qa-tester.md:204`. Paraphrasing either one breaks the agreement. |
| Tests | `cli/test/` uses `mobile-maestro` only as a config value (`doctor.test.mjs:155`, `profile.test.mjs:116`, `init.test.mjs:138`). No test reads the stub's prose. |
| Template on a stub | 2 tool calls per dispatch, no evidence gain, and it needs a tool grant that the closure argues against. |
| Future variant (goal a) | Tick timing is unverifiable (lead 6). Evidence lives in the runner's captured logs and screenshots, so Q5 should require one evidence path per step. |
| Ref-starvation (lead 7) | Blocked-vs-failed is the grading standard for Q6. Keep it inline in the variant, not only behind `ref:`. |

## Open questions

1. Should the stub exist as a runtime agent at all? No flow dispatches it. Its runtime gate repeats `qa-tester.md:14`, and its real readers are the implementer and the UI-test plan writer/reviewer. It could be cut to frontmatter, the error literal and the scope bullets (about 250 words).
2. Should qa-tester's work report template be split into a driver-neutral base (Q1, Q2, Q4, Q6–Q9) plus a per-driver block (Q3, Q5) now, so the mobile variants inherit it by construction?
3. Under a mobile driver the UI-test plan is still written and reviewed, but Phase E can only return the blocker. Is the planning spend on an unrunnable phase intended, or should the `qa_driver` gate move to the planning side?
4. Should both stubs be thinned in one change, so their shared text stays parallel (the current `diff` is small and deliberate)?

## Review response

Every Should Fix (1–4) and every Nice to Have was applied. None was rebutted.
