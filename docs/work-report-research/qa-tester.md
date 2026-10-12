# Work report research — qa-tester

## Verdict

**Recommend with changes.** qa-tester is the agent where goal (a) has the most value: a PASS today leaves **no record at all** (`plugin/agents/qa-tester.md:163` "Write nothing", 1-line return), so nobody can tell whether storage was cleared, which account was parked and released, or what the pass was asserted on. Its definition is also the largest in the plugin (7 201 words) and states several rules three or four times, so thinning pays for the template many times over. Four changes are needed: (1) the template is **embedded** in the agent file, not copied, and ticked at three checkpoints rather than per item; (2) the PASS "write nothing" contract and its caller-side quotes change, and **PASS reports get a commit point** (the `ui_test_pass` committer stages the report); (3) the report is keyed off `findings_folder` + `t<T>`, not the ledger; (4) the wire literals other files cite (`## Preconditions` step 3, "Per-single-test invocation", `### 3. Tests blocked`) stay in place verbatim. Separately, blocked maps to §3 `error:`, but the per-test "documented assumption — no fix loop" blocks conflict with `error:` halting the whole phase. That pre-existing conflict is worth fixing, but it does not block the template: Q12 names `error:` today.

## Read tree

Measured with `wc -w` in this checkout (layers `cli`, `plugin`, `general` at `.`), with `examples/notes-app` as a second adopter shape.

| File | Up-front / on-demand | Words |
|---|---|---|
| `plugin/agents/qa-tester.md` (incl. 132-word frontmatter) | up-front | 7 201 |
| `harness.config.json` (`phases.qa`, `qa.driver`, `layers[]`, `stateDir`…; `qa-tester.md:12`, `:14`, `:27–40`) | up-front | 154 (notes-app 185) |
| `.claude/CLAUDE.md` (auto-loaded; template `cli/templates/claude/CLAUDE.md` 1 320; notes-app 1 676) | up-front | 1 695 |
| **Every** `layers[].conventions` doc (`qa-tester.md:81`, "Every conventions document `<layer_path_map>` names"): `.claude/context/conventions.md` + `cli.md` + `plugin.md` | up-front | 5 864 + 2 647 + 4 174 = 12 685 (notes-app: 15 781) |
| `ui_test_index` + `ui_test_<T>.md` (`qa-tester.md:91`) | up-front | variable |
| `<repo_root>/<qa_creds_path>` (auth tests only, `:124`; example `cli/templates/claude/qa-accounts.env.example`) | on demand | 362 (example) |
| `.claude/qa_test_scenarios.md` "QA techniques" / cross-account rules (`:122`, `:125`, `:133`, `:135`) | on demand | 1 231 (template) |
| Main checkout `.claude/settings.autonomous.json` `permissions.allow` (only for `browser_route` tests, `:120`) | on demand | profile-sized; QA overlay template 1 388 |
| `<docs_root>` corpus (`phases.docs` only, `:82`) | on demand, optional | n/a |
| `<reference_impl>` (`phases.parity` only, `:40`, `:82`) | on demand | n/a |
| `plugin/scripts/reserve-qa-user.sh` / `release-qa-user.sh` | executed, not read | — |
| Mobile stubs `qa-tester-mobile-maestro.md` / `-mobile-mcp.md` | not read by qa-tester (they point at it) | 1 183 / 1 337 |

**Up-front per dispatch:** this repo 7 201 + 154 + 1 695 + 12 685 = **21 735**; notes-app 7 201 + 185 + 1 676 + 15 781 = **24 843** (both excluding the UI-test files). The agent's own share is 7 201 — the only part this proposal changes. The lessons ledger is not read.

**Read-list conflict (lead 13): none.** CLAUDE.md's always-read row is `context/conventions.md`, a subset of `qa-tester.md:81`'s "every conventions document". The agent's larger set wins and is what is counted.

## Dispatch sites and phases

| Caller | Phase / ledger id | Per dispatch | Times per branch |
|---|---|---|---|
| `plan_orchestration_instructions_core.md` → `### E.1` (semi-autonomous + autonomous forks) | Phase E; ledger `E` (`autonomous_pause_and_ledger.md` `### 1.3`) | one `test_ids` | (#still-`[ ]` tests) × rounds, `MAX_QA_ROUNDS = 3` (`core` → `### E.4`); E.4 re-runs only still-`[ ]` tests |
| `user_review_fixes_instructions_core.md` QA phase (inherits E.1, lines 140–174) | ledger `R4` | one `test_ids` | per user-review round, same per-round shape |
| `qa_test_instructions.md` → `### 3.` (`/branch-qa-test`, supervised) | no ledger | one `test_ids`; may re-dispatch a subset (`:114`) | per user invocation |
| Ad-hoc full run (no `test_ids`, `qa-tester.md:62`, `:159`) | none | all tests | not used by any flow |

Mobile stubs are dispatched instead of qa-tester when `qa.driver` is `mobile-*`; they return a blocker and drive nothing (`qa-tester-mobile-mcp.md` frontmatter, `tools: Read`).

## Prose classification

Word counts per section from `sed -n 'a,bp' | wc -w`; class splits are my estimates and sum to the section total.

| Section (lines) | Total | ACTION | REFERENCE | WIRE | REDUNDANT | Notes |
|---|---|---|---|---|---|---|
| Frontmatter (1–6) | 132 | 0 | 0 | 132 | 0 | `tools:` is the browser grant (CLAUDE.md → `## Agent authoring rules`) |
| Role + no-edit line (8–10) | 53 | 0 | 53 | 0 | 0 | keep |
| Phase-off gate (12) | 111 | 30 | 0 | 10 | 71 | rationale ("a stray dispatch surfaces cleanly…") cut |
| Driver gate (14) | 190 | 40 | 40 | 30 | 80 | stub paths + `error:` wording are wire; last sentence is the stub contract (keep one line) |
| Browser grant + two servers (16–21) | 217 | 27 | 60 | 0 | 130 | deny-vs-allowlist rationale restates CLAUDE.md → `## Agent authoring rules` (`.claude/CLAUDE.md:55`, template `:37`) |
| `## Resolved values` (23–43) | 899 | 0 | 400 | 150 | 349 | `<qa_port_seed>`, `<dev_server_cmd>` rows describe things the agent never does; `<repo_root>` shell rules restate CLAUDE.md → checkout-root block; `<layer_names>` tag values are wire |
| `## Invocation contract` keys (46–66) | 310 | 0 | 120 | 150 | 40 | dispatch block quoted by `core` E.1 and `qa_test_instructions.md` `### 3.` |
| Two boundaries + return/filename note (68–75) | 233 | 40 | 50 | 80 | 63 | returns/filenames restated in `## Output contract` |
| `## Read first` (77–84) | 244 | 60 | 120 | 0 | 64 | "cited path you cannot read → `error:`" is an action |
| `## Preconditions` steps 1–3 (86–93) | 342 | 150 | 120 | 20 | 52 | `**Depends on:**` / `**Preconditions:**` field names are wire (ui-tests-plan-writer contract) |
| Browser instance (95) | 80 | 0 | 80 | 0 | 0 | |
| Second browser (97) | 233 | 0 | 60 | 0 | 173 | perf-browser bootstrap stated here, at `:102–109`, `:121`, `:217` |
| `## Which MCP to use` (99–110) | 454 | 200 | 100 | 0 | 154 | the one sequence to keep |
| How it tests: locate / click / wait (116–118) | 153 | 80 | 57 | 0 | 16 | click line is a tool list |
| Running `browser_evaluate` safely (119) | 188 | 50 | 138 | 0 | 0 | the hang explanation is load-bearing reference |
| Mocking requests (120) | 273 | 80 | 193 | 0 | 0 | profile-resolution rule is reference for a conditional item |
| Asserting (121) | 271 | 80 | 60 | 30 | 101 | screenshot path `<state_dir>/qa_artifacts/<branch>/qa_<test-id>.png` is wire; perf text repeated |
| Following complex flows (122) | 154 | 50 | 104 | 0 | 0 | |
| Authentication (123–135) | 1 108 | 300 | 500 | 60 | 248 | reserve/release script names + exit codes 0/1/2/3 are wire (`reserve-qa-user.sh:46` cites this section); "replace with your project's…" adopter notes are redundant in a plugin file |
| `## Unsolicited dispatch guidance` (137–145) | 296 | 30 | 206 | 60 | 0 | same body in 10 agents (`dispatch_discipline_instructions.md` → `## The receiving side`) |
| Output: preamble + per-single-test (147–159) | 259 | 0 | 60 | 150 | 49 | namespaced filenames quoted by `core` → E.1 "Round suffix", `unit_loop_core.md:246` |
| Output §1 PASS (161–167) | 13 | 0 | 0 | 13 | 0 | changes under this proposal |
| Output §2 FAIL (169–194) | 590 | 30 | 120 | 400 | 40 | `## Phase 2 Readiness — Ordered Fix List`, entry shape, 3-line return: all parsed |
| Output §3 error (196–206) | 165 | 15 | 50 | 60 | 40 | |
| `## What you must NOT do` (208–219) | 219 | 0 | 42 | 0 | 177 | all but two bullets restate earlier rules; `:213` (never restate a credential value, 27 words) and `:215` (no volatile text, 15) appear nowhere else |
| **Total** | **7 201** | **1 262** | **2 733** | **1 345** | **1 847** | rows sum to 7 187; the 14-word gap is headings and rules between sections |

Wire contract stays verbatim in the agent file: frontmatter, dispatch-key block, three return shapes, namespaced filenames, the readiness heading and entry format, the screenshot path, the reserve/release command lines and exit-code meanings, the driver-gate `error:` wording and stub paths, `**Depends on:**` / `**Preconditions:**`. Cited from other files, so heading and number must survive: **`## Preconditions` step 3** (`core:485` twice, `qa_test_instructions.md:81`, `user_review_fixes_instructions_core.md:172`); the label **"Per-single-test invocation"** (`core:98`, `core:487`); the sub-heading **`### 3. Tests blocked`** (`qa-tester-mobile-maestro.md:14`, `qa-tester-mobile-mcp.md:14`); "Park the account you drive" (`reserve-qa-user.sh:46`, `release-qa-user.sh:6`).

## Draft work report template

Embedded at the end of `qa-tester.md` (no `cp`, no plugin-root read). Written once with `Write` after the gates pass; ticked with `Edit` at three checkpoints (after Q5, after Q10, before return). qa-tester has `Edit`, so in-place ticking is possible (and `sed -i` would be too, lead 1 correction). Three checkpoints is a choice to keep the call count low, not a forced one. Single template: conditional items take `n/a — <reason>`.

```markdown
# QA work report — test <T> · iteration <iteration> · <findings_folder as given, never absolutized>
- [ ] Q1. **Application reachable** — Navigate Playwright to base_url once; on failure return the unreachable `error:`. Evidence: URL path only, never host or port.
- [ ] Q2. **Inputs read** — Read every conventions document, ui_test_index and ui_test_<T>.md; unreadable path → `error:` naming it. Record Depends on, Preconditions, required MCP.
- [ ] Q3. **Starting state reset** — Run Preconditions step 3, or n/a citing the Depends on/Preconditions declaration. (ref: qa-tester.md → ## Preconditions)
- [ ] Q4. **Account parked** — Map rights to slot, run reserve-qa-user.sh. Evidence: slot number and exit code only, never a credential; n/a if not auth-gated. (ref: qa-tester.md → ## How it tests)
- [ ] Q5. **Signed in via auth_provider** — Fill, submit, wait for in-flight indicator to clear; never a pop-up route; no credential in evidence; n/a if not auth-gated.
- [ ] Q6. **Perf browser on target** — Navigate chrome-devtools, sign in, confirm surface before trace; n/a unless performance test. (ref: qa-tester.md → ## Which MCP to use)
- [ ] Q7. **Route grant confirmed** — Check main-checkout profile allows browser_route before mocking; n/a unless the file mocks. (ref: qa-tester.md → ## How it tests)
- [ ] Q8. **Steps executed in order** — One line per step: step no., tool, attribute read, request name + payload field names (never headers or values); time-box any awaited evaluate.
- [ ] Q9. **Missing test attributes filed** — Each role/label fallback becomes a Should Fix finding; n/a if every element had the attribute.
- [ ] Q10. **Setup actions noted** — List peer sign-ins or UI data bootstrap performed; n/a if none.
- [ ] Q11. **Slots released** — Run release-qa-user.sh for every reserved slot, on every exit path; record exit codes; n/a if none reserved.
- [ ] Q12. **Outcome classified** — PASS, FAIL (index + findings, layer tag from layer_path_map) or §3 `error:`; quote the return inline in this line, never echo the report.
- [ ] Q13. **Steering reported** — Quote unsolicited guidance above the return; n/a when none.
```

358 words (`wc -w`). Driver-neutral items are Q1 (as "target reachable"), Q2, Q4, Q10–Q13; Q3, Q5–Q9 are browser-specific. A future mobile implementation reuses the neutral items and supplies its own driver block. Today's stubs get **no** template: with `tools: Read` they cannot write one, and they act on nothing. No file parser reads the report; Q12's quote sits inside a tick line, so no line of the report begins `verdict:`.

## Thinning plan

| Section | Remove | Shorten | Keep verbatim | Est. after |
|---|---|---|---|---|
| Frontmatter | — | — | all | 132 |
| Intro + phase gate + driver gate + browser grant (8–21) | deny rationale (CLAUDE.md has it); "stray dispatch" rationale | each gate to 2 sentences; servers to 2 lines | gate `error:` wording, stub paths | 200 |
| `## Resolved values` | `<qa_port_seed>`, `<dev_server_cmd>` rows (one line: "the caller owns port and server"); checkout-root shell rules (CLAUDE.md) | each row to one line | `<layer_names>` routing note, `<state_dir>` | 380 |
| `## Invocation contract` | restated return/filename paragraphs (`:73`, `:75`) | key glosses | dispatch block, both boundaries (one sentence each) | 380 |
| `## Read first` | — | to 3 bullets | unreadable-path → `error:` | 120 |
| `## Preconditions` + browser notes (655) | duplicated perf-browser text (`:97`, 233 → 0); steps 1–2 to one line each (100 → 40) | shared-browser note `:95` (80 → 40) | **step 3 numbered and verbatim** (`:92–93`, 242) | 320 |
| `## Which MCP to use` | duplicate "never trace" restatements | auth-gated sequence kept once | tool names | 200 |
| `## How it tests` (2 160) | see subtraction below | | evaluate hang reason, `browser_route` profile rule, screenshot path, reserve/release lines + exit codes, `:213` credential rule moved here | 1 350 |
| `## Unsolicited dispatch guidance` | — | — | all (shared base file is a cross-agent decision) | 296 |
| `## Output contract` (1 027) | see subtraction below | | returns, filenames, readiness heading + entry format, "Per-single-test invocation" label, `### 3. Tests blocked` heading; §1 changed to "write the report only" | 876 |
| `## What you must NOT do` | 7 restated bullets | — | `:213` (27) and `:215` (15) | 42 |
| Embedded template | — | — | — | 358 |
| **Total** | | | | **≈ 4 654** |

**`## How it tests` subtraction (measured today → est.):** locate/click/wait `:116–118` 153 → 100 (drop click tool list, 16); evaluate `:119` 188 → 150; mocking `:120` 273 → 200 (trim the offline-emulation aside); asserting `:121` 271 → 150 (drop perf repeat, 101); flows `:122` 154 → 100; authentication `:123–135` 1 108 → 650 (drop 248 redundant: adopter "replace with" notes, restated blocked rules; trim reference ~210). Sum 1 350.

**`## Output contract` subtraction:** preamble `:147–152` 67 → 50; per-single-test `:153–159` 192 → 150 (label kept); §1 13 → 25 (new PASS rule); §2 body `:169–184` 539 → 470 (drop the parenthesised per-single-test restatements); §2 return `:186–194` 51 → 51; §3 165 → 130. Sum 876.

**Mobile stubs.** Their `## Operating contract — inherited by pointer` (`qa-tester-mobile-maestro.md:47–51`, 200 words; `-mobile-mcp.md:55–59`, 207) lists seven driver-neutral parts by name, and both cite `## Output contract → "3. Tests blocked"` at `:14`. All of those stay in `qa-tester.md` under this plan, heading included, so the stubs need no edit. If the synthesis later splits a shared `interactive_test_contract.md` base, the stubs' pointer target changes in the same edit, and qa-tester gains an up-front read of the same size it loses. That is neutral, so it is not proposed. Proposed instead: a heading `## Driver-neutral contract` grouping invocation, boundaries, parking and output, so the stubs can cite one heading.

## Word-count ledger

Up-front, agent-owned:

| File | Today | After | Delta |
|---|---|---|---|
| `plugin/agents/qa-tester.md` (excl. template) | 7 201 | ~4 296 | −2 905 |
| Work report template (embedded) | 0 | 358 | +358 |
| **Subtotal** | **7 201** | **~4 654** | **−2 547** |

Unchanged up-front: `harness.config.json` 154 (notes-app 185), CLAUDE.md 1 695 (notes-app 1 676), conventions docs 12 685 (notes-app 15 781), UI-test files.
**Full per dispatch:** this repo 21 735 → ~19 188; notes-app 24 843 → ~22 296.

On demand: unchanged (`qa_test_scenarios.md` 1 231, creds file, settings profile). The `ref:` targets are sections of `qa-tester.md` itself, already loaded — no new on-demand reads.

**Constraint holds: yes**, by about 2 550 words. Honest attribution: the template is +358; the saving is redundancy removal worth doing without work reports.

## Storage and lifecycle

| Question | Answer for qa-tester |
|---|---|
| Key | It sees no ledger id (`E`/`R4`) and none exists in `/branch-qa-test`. Its dispatch already carries a collision-safe key: `findings_folder` (round-suffixed, `core` → E.1 "Round suffix") + `iteration` + `T`. Proposed path: `<findings_folder>/work_report_<iteration>_t<T>.md`. The brief's `<state_dir>/work_reports/<branch>/<phase>/qa-tester/report_<n>.md` loses the test id and needs a phase the agent cannot see. |
| Index | Caller-supplied (`iteration`, `T`), as today. Collision-safe across rounds (folder suffix) and across tests (`T`). A user-initiated `/branch-qa-test` re-run resolves its own next-free round folder (`qa_test_instructions.md:77`, `:114`), so it is safe too. The one overwrite case: a clarification re-dispatch of a test inside the same invocation (`:114`), which reuses the folder. `qa_review_0_t<T>.md` already has the same overwrite today. Ad-hoc full run: `work_report_<iteration>.md`. |
| Tools | Has `Write` and `Edit`; `Bash(mkdir -p:*)` is allowed; `Bash(cp:*)` is **not** in the autonomous allow list → embed the template (lead 1 applies only to the copy step). |
| Hooks | All six guard hooks match `Bash` only (`plugin/hooks/hooks.json`); none sees `Write`/`Edit`. No block. |
| Commit — FAIL round | The `review_plan_file` committer stages the merged index **and the whole folder** (`committer.md:113`, `${plan_path%/*}/`), so every report in that round's folder — PASS ones included — is committed. Works unchanged. |
| Commit — clean round | **No commit point.** `ui_test_pass` commits "only that index file" (`committer.md:42`); a clean round assembles no index (`core` → E.2). Reports dangle as untracked `<state_dir>/…` (tolerated at checkpoints, `plan_orchestration_instructions_autonomous.md:281`) and are lost at PR time. Change: `ui_test_pass` takes an optional `extra_path` the E.1 caller fills with `<findings_folder>/work_report_<iteration>_t<T>.md`. Same leads 3/8. |
| Sweep risk | `task`/`review_item` stage "the code files shown by `git status --short`" (`committer.md:111`). A dangling PASS report from an earlier clean round is an untracked path that would ride the next E.3 or G.4 fix commit and change its subject reconciliation (lead 3). The `extra_path` change removes this. |
| Supervised | `/branch-qa-test` commits nothing; reports stay untracked for the human. Acceptable. |
| PASS writes nothing | Applies (lead 2). `qa-tester.md:163` and both callers' "creates `<qa_review_findings_dir>` itself only when it has findings — do NOT `mkdir -p` here" (`core:483`, `qa_test_instructions.md:97`) must change together. Side effect: every round now creates its folder, and next-free round resolution (`qa_test_instructions.md:77`; `user_review_fixes_instructions_core.md` → `### QA.0`) consumes it. A clean supervised round now advances the round number. Harmless, but numbering changes. |
| Embed in an existing artifact (lead 11) | Partial fit only. On FAIL, the per-dispatch index `qa_review_<iteration>_t<T>.md` could carry a trailing `## Work report`. The E.2 merge reads only its readiness entries and `### K.` pointers (`core` → E.2 step 1), so it would not misread the section. On PASS no artifact exists, so a separate file is still needed. One file shape for both outcomes is simpler, and it lands in the same folder either way. |
| Evidence leakage (lead 12) | Q1 records the URL path only: `base_url` carries the per-run probed port (`qa-tester.md:63`), which would differ on every run. Q8 records request names and payload **field names** only, never headers or values: `browser_network_request` returns headers, which can carry auth tokens. Q4/Q5 record the slot number, never a credential (`:213`). No timestamps, and `<findings_folder>` is written as given (repo-relative), never absolutized. |
| Gate failures | Phase-off and driver-gate dispatches must stay **no-write** (`:12`, `:14`). The report starts after the gates; those dispatches have none. |
| Orphan check (lead 9) | n/a: no review-plan-reviewer runs over QA folders. E.2 reads per-dispatch indices by name (`qa_review_<iteration>_t<T>.md`), so `work_report_*` is not picked up. |
| Reviewers reviewing reports (lead 5) | Committed reports land in the branch diff that `branch-reviewer`/`skeptic-reviewer` see in a **later** user-review round. They need the same `<state_dir>` artifact exemption every report gets. |

## Risks and costs

- **Per-test documented-assumption blocks conflict with `error:` (existing defect, narrower than first stated).** Blocked does have a return shape: `### 3. Tests blocked` routes it to `error:` (`qa-tester.md:196–202`), and callers treat that as outcome #3 (`core:489`, `core:496`). The conflict is in the per-test blocks that `:198`'s list does not name. These are a `browser_route` not granted or an un-mockable backend failure (`:120`), a busy rights-specific account (`:128`), an unreachable perf surface (`:109`, `:121`), and a missing auth route (`:123`). They are labelled "documented assumption — no fix loop", yet through `error:` they halt and escalate the whole QA phase (`core:496`, `:708`). `:109`'s "record a finding" has no carrier, because an `error:` return has no `findings_file:`. `:122` adds a third route: "record a finding and continue". Q12 names §3 `error:` today, so the template does not wait on this.
- **Tool calls.** Three report writes per dispatch (1 `Write` + 2 `Edit`s), against a dispatch that already makes 10–40 browser calls with large accessibility snapshots. Marginal. Per-item ticking (12 `Edit`s) is not worth it.
- **Goal (a).** Tick timing is unverifiable; the agent can fill everything before returning. Value comes from evidence fields — slot + reserve/release exit codes, the `Depends on` decision, per-step evidence lines, the quoted return. For qa-tester this is the **only** record of a PASS, so (a) is stronger here than for any reviewer.
- **Goal (b).** The rules that matter most are easy to skip in prose: storage reset (Q3), slot release on every exit path (Q11), perf browser bootstrap (Q6), `browser_route` grant check (Q7), missing test attribute → Should Fix (Q9). Each becomes an item. Keep the `evaluate` hang rationale and the route-profile resolution in full behind `ref:`; stripped to an item they would be misapplied (reading the worktree's profile instead of the main checkout's is the exact error `:120` warns against).
- **Release-on-early-exit.** An `error:` return mid-test must still release slots. A report written at Q4 with Q11 unticked makes a missed release visible.
- **Secrets.** Q4/Q5 evidence names the slot, never a credential (`:213`), and the item text says so. Q8 excludes headers (lead 12 row above).
- **Callers and tests.** No `cli/test` file and no `scripts/` check keys on qa-tester prose (grep). Prose quoted elsewhere: dispatch block (`core` E.1, `qa_test_instructions.md` `### 3.`), namespaced filenames (`core` E.1, `unit_loop_core.md:246`), "Park the account you drive" (`reserve-qa-user.sh:46`, `release-qa-user.sh:6`), the unsolicited-guidance roster that names qa-tester (`dispatch_discipline_instructions.md:68`), the `ui_test_pass` sign-off reference (`committer.md:8`), the `## Preconditions` step 3 citations (`core:485`, `qa_test_instructions.md:81`, `user_review_fixes_instructions_core.md:172`), the "Per-single-test invocation" label (`core:98`, `:487`) and the `3. Tests blocked` heading (both stubs `:14`), the stubs' pointer list. Keep those headings and literals.
- **Context.** The report is written to disk, not returned; the orchestrator still reads one line. No orchestrator context cost.

## Open questions

1. Blocked maps to §3 `error:`, but the per-test "documented assumption — no fix loop" blocks (`:109`, `:120`, `:121`, `:123`, `:128`) conflict with `error:` halting the whole phase (`core:496`), and `:109`/`:122` say "record a finding" with no carrier. Should those cases become a FAIL with a test-plan finding, or a non-halting fourth return? Q12 works with `error:` as is. A fix would touch `core` E.2 and `qa_test_instructions.md` `### 4.`.
2. Is extending `ui_test_pass` with an optional `extra_path` acceptable to the committer synthesis, or should PASS reports wait for the next folder commit? The second option leaves clean rounds unrecorded.
3. Should the shared `## Unsolicited dispatch guidance` body (296 words × 10 agents) move to one base file? It saves words in the plugin, not per dispatch.
4. Common `<state_dir>` artifact exemption for `branch-reviewer`/`skeptic-reviewer`, so committed QA reports from round N are not graded as change-set content in round N+1.
5. Pointer-by-heading for the mobile stubs (`## Driver-neutral contract`): adopt it as the cross-variant convention, or leave the stubs' prose list as is?

## Review response

All four Must Fix and all eight Should Fix findings in `reviews/qa-tester.md` are accepted and applied. All three Nice to Have are applied too (inline quote in Q12, `<findings_folder>` as given, the lead-13 line). No rebuttals.

- Must Fix 1: the headline is corrected to the narrower conflict. Verdict condition (4) is now "keep the cited literals in place". The template no longer waits on the blocked question.
- Must Fix 2–3: `## Preconditions` step 3, "Per-single-test invocation" and `### 3. Tests blocked` stay verbatim. The Preconditions row was re-estimated 260 → 320.
- Must Fix 4: `:213` and `:215` are kept. That row was 0 and is now 42 (27 + 15, measured).
- Should Fix 7: the subtraction is now shown. `## How it tests` was re-estimated 1 050 → 1 350, and `## Output contract` 800 → 876.
- Net effect: agent-owned 7 201 → ~4 654 (was ~4 158). Per dispatch, this repo goes 21 735 → ~19 188. The constraint still holds.

