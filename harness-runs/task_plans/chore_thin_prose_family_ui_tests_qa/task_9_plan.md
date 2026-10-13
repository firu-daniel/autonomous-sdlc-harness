### Task 9 — Thin `qa-tester`'s `## Output contract` and `## What you must NOT do`

**Goal:** Cut `## Output contract` and `## What you must NOT do` of `plugin/agents/qa-tester.md` to direct rules stated once. Every return shape, filename and readiness format the callers parse stays byte for byte. `## What you must NOT do` keeps only the two rules stated nowhere else in the file.

**Depends on:** Task 8, the last edit to `## How it tests`. Four of the seven `## What you must NOT do` bullets R10 deletes have their only other statement there: fixed sleeps, MCP selection, the trace guard and the never-flip rule. Task 7 keeps the driver gate and the boundaries the other three restate. So this task lands after both.

**Where this task stops.** It changes only these parts of `plugin/agents/qa-tester.md`:
- the line-count sentence and the `mkdir -p` paragraph (deleted) at the top of `## Output contract`;
- the `**Per-single-test invocation.**` paragraph;
- in `### 2. Some tests fail`: the lead paragraph's tail, the any-finding paragraph, one aside in the readiness bullet, one aside in the fix-target bullet, and the `findings_file:` sentence's parenthetical;
- one clause of `### 3. A test blocked`;
- the bullets of `## What you must NOT do`.

It does not touch the three filename bullets under **Per-single-test invocation.**, the full-run paragraph, **Priority — one return per dispatch.**, any fenced return block, the `### 3.` cause list, `### 4. The run cannot proceed`, or any heading.

Apply the replacements below exactly. Each **Old** block is an exact substring of the file at `13a2ed4c` — sometimes only part of a line, leading space included — and you replace exactly that substring. If an Old block is not found exactly once, change nothing more in that file and return a blocker naming the file and the R-number.

**Frozen text in or next to this range** stays word for word:
- in the readiness bullet, `- A `## Phase 2 Readiness — Ordered Fix List` section — **required,` and the run from `_(layer: <one or more of <layer_names>>)_`.` through `Never re-sort against a remembered layer list.`;
- the `## Must Fix` / `## Should Fix` / `## Nice to Have` bullet through its `e.g. `→` opening;
- the run from `(informational; the committer ignores them).` through the end of the `Binding on you as the author: …` sentence;
- `An optional `## Unsolicited dispatch guidance` section precedes whichever fixed return applies and changes nothing in it.`

These bold leads stay: `**Index**` and `**Per-finding files**`, which agent definitions outside the family carry.

**Anchors and wires other files rely on, which this task keeps:**
- The label `**Per-single-test invocation.**`, cited as `qa-tester.md` "Per-single-test invocation" by `plugin/instructions/plan_orchestration_instructions_core.md`.
- The namespaced names `qa_review_<iteration>_t<T>.md` and `finding_t<T>_<N>.md`, which the E.1/E.2 merge and `plugin/instructions/unit_loop_core.md` row `E.3` read.
- The headings `### 3. A test blocked` and `### 4. The run cannot proceed`. `plugin/instructions/plan_orchestration_instructions_core.md` and `plugin/instructions/qa_test_instructions.md` cite the first, and the mobile stubs cite `## Output contract` → "4. The run cannot proceed".
- The literal `error: blocked — `: em dash, single spaces, never decorated.
- The PASS-writes-nothing rule of `### 1. All tests pass`, and that the caller, not this agent, assembles the round-level `qa_review_<iteration>.md` in per-single-test mode.

### Targets

- `plugin/agents/qa-tester.md` → `## Output contract` and `## What you must NOT do`, the parts named above.

**Work:**

- [ ] **Opening and per-single-test.** Apply R1–R3.
  - The line-count rule stays without its rationale.
  - The `mkdir -p` paragraph goes, because `### 2. Some tests fail` opens with the same command.
  - **Per-single-test invocation.** keeps the once-per-case dispatch, the caller's ownership of the round-level index, the never-write-it rule and the namespace-by-`<T>` rule.
- [ ] **FAIL and blocked returns.** Apply R4–R9. The any-finding paragraph keeps "a Should Fix alone" and the valid `must_fix_count: 0` return. The fix-target bullet keeps "application code — NOT at the test plan". The blocked literal keeps its em-dash rule.
- [ ] **What you must NOT do.** Apply R10. Only the credential-hardcoding and volatile-text bullets remain. Each deleted bullet's rule is stated once above:
  - never edit application code or the plan — the observe-and-report line, boundary 2;
  - never start the server — boundary 1;
  - never use fixed sleeps — **Waiting on async work:**;
  - MCP selection — `## Which MCP to use`;
  - the trace guard — `## Which MCP to use` → the never-trace bullet;
  - the driver — the driver gate.
- [ ] **Rule inventory before saving.** Confirm each deleted `## What you must NOT do` bullet's rule still has the home named above in this file, and that every return shape, filename and readiness format listed under **Anchors and wires** is unchanged. Restore anything missing in its shortest form.

### Replacements

**R1** — `plugin/agents/qa-tester.md`: replace

```text
1 line on either `error:` shape** — the per-test `error: blocked — ` line or the unmarked run-level `error:` line — because the caller reads only your short return and will not open the findings file.
```

with

```text
1 line on either `error:` shape**.
```

**R2** — `plugin/agents/qa-tester.md`: delete this whole paragraph together with the blank line that follows it

```text
When a branch below writes files (the FAIL branch), run `mkdir -p <findings_folder>` before the first `Write` — the caller does not pre-create the folder.
```

**R3** — `plugin/agents/qa-tester.md`: replace

```text
**Per-single-test invocation.** The caller dispatches you **once per test case** (`test_ids` of one) so each test gets a fresh **agent** session, its own starting state via `## Preconditions` step 3, and clean per-test pass/fail attribution. In that mode **the caller — not you — owns the round-level QA-review index** that the fix loop consumes: it aggregates every per-dispatch return into a single `qa_review_<iteration>.md` per round. So your filenames MUST be **non-colliding across dispatches into the shared `findings_folder`** — namespace every file you write by the single test id you were given (call it `<T>`, the lone value in `test_ids`):
```

with

```text
**Per-single-test invocation.** The caller dispatches you **once per test case** (`test_ids` of one) and **owns the round-level QA-review index**, `qa_review_<iteration>.md`, which it assembles from every dispatch's files — you never write it in this mode. Namespace every file you write into the shared `findings_folder` by the single test id you were given (`<T>`, the lone value in `test_ids`):
```

**R4** — `plugin/agents/qa-tester.md`: replace (the Old block opens with one space)

```text
 — mirroring the `branch-reviewer` split format so the caller can loop the fixes through the normal implementer / reviewer / committer agents. (Per-single-test mode: the index you write is a **per-dispatch** index named `qa_review_<iteration>_t<T>.md` covering only the one test you ran; the caller merges your per-dispatch indices into the round-level `qa_review_<iteration>.md`. Per-finding files are namespaced `finding_t<T>_<N>.md`. Everything else in this section is unchanged.)
```

with

```text
 — in the `branch-reviewer` split format. (Per-single-test mode: the index covers only the one test you ran, under the namespaced names above.)
```

**R5** — `plugin/agents/qa-tester.md`: replace

```text
This is the return for **any** finding — including a missing identity test attribute on a test whose assertions otherwise held (fix target: the application layer) and a setup step the UI-test file omitted (fix target: the UI-test file). Both are Should Fix, so `verdict: FAIL` with `must_fix_count: 0` is a valid return.
```

with

```text
This is the return for **any** finding, a Should Fix alone included, so `verdict: FAIL` with `must_fix_count: 0` is a valid return.
```

**R6** — `plugin/agents/qa-tester.md`: replace (the Old block opens with one space)

```text
 The heading text MUST be exactly `## Phase 2 Readiness — Ordered Fix List` — the caller keys off it. Format:
```

with

```text
 The heading text MUST be exactly `## Phase 2 Readiness — Ordered Fix List`. Format:
```

**R7** — `plugin/agents/qa-tester.md`: replace (the Old block opens with one space)

```text
 points at the **application code** (so an implementer dispatched for that layer can act) — NOT at the test plan.
```

with

```text
 points at the **application code** — NOT at the test plan.
```

**R8** — `plugin/agents/qa-tester.md`: replace (the Old block opens with one space)

```text
 or your per-dispatch `qa_review_<iteration>_t<T>.md` in per-single-test mode (the caller merges per-dispatch indices into the round-level index itself).
```

with

```text
 or your per-dispatch `qa_review_<iteration>_t<T>.md` in per-single-test mode.
```

**R9** — `plugin/agents/qa-tester.md`: replace (the Old block opens with one space)

```text
 is the wire the caller discriminates on, as `layer-implementer`'s `blocker: prohibited — ` is; never decorate or reword it. The caller **continues the QA phase**, leaves the test `[ ]` and reports the cause.
```

with

```text
 is the wire the caller discriminates on; never decorate or reword it.
```

**R10** — `plugin/agents/qa-tester.md`: replace

```text
- Never edit application code.
- Never edit the UI-test plan (index or per-test files), and never flip a readiness checkbox in it.
- Never start, restart or stop the application's server — the caller owns that lifecycle.
- Never hardcode credentials in this file or any committed file, and never restate a credential value in a finding, a return line or a commit message.
- Never use fixed sleeps — wait on a status-attribute token, expected text, or network completion.
- Never assert on volatile text when a test attribute exists for the same state.
- Never call a browser MCP tool outside the per-test MCP-selection rule (default Playwright; chrome-devtools for performance only).
- Never run a performance trace against a page you did not navigate to — `about:blank`, the sign-in route, or the surface a previous dispatch left the browser on — navigate the chrome-devtools browser to `base_url` first, and for an auth-gated surface sign it in through the `<auth_provider>` route (never a third-party pop-up route) so the trace runs against the authenticated target surface. Return the per-test `error: blocked — ` line (`## Output contract` → `### 3. A test blocked`) if the browser cannot be moved onto that surface, rather than emitting that page's trace as a pass.
- Never drive a browser when `<qa_driver>` is not `web-playwright` — return the driver-gate `error:` instead.
```

with

```text
- Never hardcode credentials in this file or any committed file, and never restate a credential value in a finding, a return line or a commit message.
- Never assert on volatile text when a test attribute exists for the same state.
```

**Verification:**

- Run `bash scripts/scratch-run.sh harness-runs/scratch/ui_tests_qa_family_check.mjs plugin/agents/qa-tester.md` as one plain foreground command. Its last line is `PASS`, its `WORDS` line shows a negative `delta`, and it prints none of `FROZEN`, `LEAD`, `HEADING`, `FRONTMATTER`, `LITERAL`, `OUTSIDE-CHANGED` or `WORDS-NOT-LOWER`.
- `git grep -n -F -e 'never fixed sleeps' -e 'Do not switch MCPs on your own initiative' -e 'Never trace a page you did not navigate to' -e 'You never flip a readiness checkbox' -- plugin/agents/qa-tester.md` prints one line for each of the four strings: the deleted bullets' rules still have their homes.
- `git diff -- plugin/agents/qa-tester.md` shows hunks only from `## Output contract` down, and none inside a fenced return block.
