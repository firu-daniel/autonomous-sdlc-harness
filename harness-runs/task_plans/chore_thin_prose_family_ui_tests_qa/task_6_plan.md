### Task 6 — Thin `ui-tests-plan-reviewer`'s `## What to check`

**Goal:** Cut the check groups of `plugin/agents/ui-tests-plan-reviewer.md` → `## What to check` to direct rules stated once. Every Must Fix trigger keeps its grade. Where the writer's `### Capability guidance` (now read up front, Task 5) states a rule, the reviewer grades against it by pointer rather than restating it.

**Depends on:** Task 5, which makes the reviewer read `ui-tests-plan-writer.md` → `` ### Capability guidance (encode this in every test's `**Capability / MCP:**` line) `` up front. R11's pointers into that section are only sound once that read exists.

**Where this task stops.** It changes only these parts of `plugin/agents/ui-tests-plan-reviewer.md`:
- the tail of the `**Your own checklist is not downgradable.**` paragraph;
- in `### Index structure`: the `## Context` bullet and two asides of the readiness bullet;
- the sub-step-checkbox paragraph;
- the two bullets of `### Test-attribute convention parity (Must Fix)`;
- in `### Asserted attribute values agree with the source`: the lead paragraph, one sentence of **Find the call site.**, one clause of the first no-call-site arm, and the **What this check is not.** paragraph;
- the three bullets of `### Capability/MCP correctness (Must Fix)` after its first;
- the `### Backend-name parity (Must Fix)` bullet.

It does not touch the grading rubric's three bullets, the `# UI Test Plan:` and no-`## Tasks` bullets, the recorded-rejection bullet, the per-test structure bullets, `### Index↔per-test correspondence (Must Fix)`, `### `**Depends on:**` ordering (Must Fix)`, `### Completeness (Must Fix)`, `## Unsolicited dispatch guidance` or `## Output contract`, all of which stay byte for byte.

Apply the replacements below exactly. Each **Old** block is an exact substring of the file at `13a2ed4c` — sometimes only part of a line, leading space included — and you replace exactly that substring. If an Old block is not found exactly once, change nothing more in that file and return a blocker naming the file and the R-number.

**Frozen text in or next to this range** stays word for word:
- the rubric sentence from `The rubric is stated here because it is harness doctrine rather than a project convention;` through `nothing here depends on that` (R1 edits only after it);
- in the readiness bullet, the runs `- `## Phase 2 Readiness — Ordered Fix List` section **placed immediately after Context**.`, `or one that contains no `[ ]` entries is a Must Fix.` and `K** — <short title> _(layer: <one or more of <layer_names>>)_`.`;
- the `NO `## Tasks` section and NO `## Must Fix` / `## Should Fix` / `## Nice to Have` sections.` bullet and the whole recorded-rejection bullet;
- the run `inside the index's `## Phase 2 Readiness — Ordered Fix`, which R5 keeps;
- the correspondence run from `entry. - A count mismatch in either direction` to `Name the offending entry/file in the finding.`;
- in the backend-name bullet, the run `read off the owning layer's `layers[].conventions` document via `<layer_path_map>`, never from a`;
- `## Unsolicited dispatch guidance` and `## Output contract`, whole.

These bold leads stay: `**Grade every finding by consequence.**`, `**Must Fix**`, `**Should Fix**`, `**Nice to Have**`, `**Your own checklist is not downgradable.**`, `**A recorded rejection is an addressed finding only once you have tested it.**` and `**For the `web-playwright` driver**`.

**The contract with Task 2.** R11 writes the sentence `The two mobile variants are declared but not implemented in this release and state no capability set: do not fall back to the browser variant's set.`, identical to the writer's `### Capability guidance` copy, and keeps the phrase `declared but not implemented in this release` that `cli/src/config/model.ts` → `QA_DRIVER_IMPLEMENTED` names as a sweep key.

### Targets

- `plugin/agents/ui-tests-plan-reviewer.md` → `## What to check`, the parts named above.

**Work:**

- [ ] **Rubric and index structure.** Apply R1–R5. The rubric's tail keeps its scoping rule — the layer rules around the rubric are not this reviewer's to grade — in one clause. The readiness bullet loses only its two key-off asides; every Must Fix trigger in it stays.
- [ ] **Attribute groups.** Apply R6–R10.
  - The locator bullet keeps the Must Fix, the "test-prep coverage gap" name and "name the locator and the test".
  - The asserted-values group keeps the call-site grep, the "where a call site exists" Must Fix and both no-call-site arms with their outcomes.
  - The plan-not-application boundary stays.
- [ ] **Capability and backend names.** Apply R11–R12.
  - The capability bullets keep every Must Fix: a capability the variant lacks; an over-tagged, under-tagged or missing line; a test that needs a real backend failure.
  - The `n/a (<qa_driver> variant declares no capability set)` marker is accepted and graded no further.
  - The backend-name bullet keeps the anti-invention rule and drops the "*replace with your project's*" scaffolding.
- [ ] **Rule inventory before saving.** Count the Must Fix triggers in `## What to check` before and after: each trigger at `13a2ed4c` must still be stated, at Must Fix, in this file or, for the two capability rules R11 points at, in the writer's `### Capability guidance`. Restore any that is missing.

### Replacements

**R1** — `plugin/agents/ui-tests-plan-reviewer.md`: replace

```text
nothing here depends on that restatement, and only the rubric is in scope for you — the layer rules that document carries around it govern code review, not a black-box UI-test plan review.
```

with

```text
nothing here depends on that restatement, and the layer rules around it are not yours to grade.
```

**R2** — `plugin/agents/ui-tests-plan-reviewer.md`: replace

```text
- `## Context` section with a short **prose paragraph only** (what the branch delivers and which user-facing behaviours these tests cover). The index must **not** carry `### Targets` sub-lists or per-test bodies — those belong in the per-test files. Flag their presence in the index as a Must Fix (keep the index thin).
```

with

```text
- `## Context` section with a short **prose paragraph only**. `### Targets` sub-lists or per-test bodies in the index are a Must Fix.
```

**R3** — `plugin/agents/ui-tests-plan-reviewer.md`: replace (the Old block opens with one space)

```text
 to `## Phase 2 Readiness — Ordered Fix List` — the QA orchestrator keys off it. A missing
```

with

```text
 to `## Phase 2 Readiness — Ordered Fix List`. A missing
```

**R4** — `plugin/agents/ui-tests-plan-reviewer.md`: replace (the Old block opens with one space)

```text
 is a Must Fix — the QA fix loop routes the fix on that tag and has nothing to dispatch without it. Name the offending entry and the bad value.
```

with

```text
 is a Must Fix. Name the offending entry and the bad value.
```

**R5** — `plugin/agents/ui-tests-plan-reviewer.md`: replace

```text
**Sub-step checkboxes inside per-test files are permitted and not a finding.** `**Steps:**` / `**Expected:**` bullets may use `- [ ]` form for informational progress — those are NOT the iteration source and the committer ignores them. Do NOT flag their presence. The only `[ ]` markers that matter are the ones inside the index's `## Phase 2 Readiness — Ordered Fix List` section.
```

with

```text
**Sub-step checkboxes inside per-test files are permitted and not a finding.** Only the `[ ]` markers inside the index's `## Phase 2 Readiness — Ordered Fix List` section count.
```

**R6** — `plugin/agents/ui-tests-plan-reviewer.md`: replace

```text
- Every step references an identity locator that the story/task files say exists (the task that adds the control introduces it). A step that invents a locator with no source in the story/task files is a Must Fix — it is a test-prep coverage gap; name the locator and the test.
- The attribute families are the ones the surface-owning layer's conventions document states, reached through `<layer_path_map>` — identity, value and status (in the bundled sample project, `data-qa-id` / `data-qa-value` / `data-qa-status`). A step or assertion that reads some other ad-hoc attribute that document does not define is a Must Fix.
```

with

```text
- A step whose identity locator the story/task files do not introduce is a Must Fix (a test-prep coverage gap); name the locator and the test.
- The attribute families are the identity, value and status attributes the surface-owning layer's conventions document states. A step or assertion that reads some other ad-hoc attribute that document does not define is a Must Fix.
```

**R7** — `plugin/agents/ui-tests-plan-reviewer.md`: replace

```text
The group above grades the *locator* and the *attribute family* and leaves the *value* ungraded. A plan whose assertions are self-consistent but contradict what the application writes sends the qa-tester to drive a browser and report a product failure that is not there — a consumer acting on the plan doing the wrong thing, which is the Must Fix trigger as stated above. This is the same cross-check `docs-reviewer` performs against source for a prose claim.
```

with

```text
This group grades each asserted *value* against what the application writes.
```

**R8** — `plugin/agents/ui-tests-plan-reviewer.md`: replace (the Old block opens with one space)

```text
 Grep the surface-owning layer's `path` from `<layer_path_map>`; that layer's own test-attribute helper is what makes this a grep rather than a reading exercise.
```

with

```text
 Grep the surface-owning layer's `path` from `<layer_path_map>`.
```

**R9** — `plugin/agents/ui-tests-plan-reviewer.md`: replace (the Old block opens with one space)

```text
 — the plan is describing behaviour that does not exist yet, which is the normal case for this loop (it converges *before* the hand-off to implementation). Grade
```

with

```text
 — the normal case, since this loop converges *before* implementation. Grade
```

**R10** — `plugin/agents/ui-tests-plan-reviewer.md`: replace

```text
**What this check is not.** You stay read-only and black-box: you grade the plan, not the application. A *product* behaviour you disagree with is not yours to raise. The one thing this check establishes is whether the plan's expectation and the source agree; where they disagree the finding is against the **plan**, and the fix is the writer's.
```

with

```text
**What this check is not.** You grade the plan, not the application: a *product* behaviour you disagree with is not yours to raise, and a disagreement between plan and source is a finding against the **plan**.
```

**R11** — `plugin/agents/ui-tests-plan-reviewer.md`: replace

```text
- **The annotation must name a capability the configured `<qa_driver>`'s `qa-tester` variant actually has** — read the capability set off that variant's own file (the driver → file map is in `## Read first`) and grade against that set only. An annotation naming a capability that variant lacks is a Must Fix: it routes the qa-tester to a tool it cannot invoke. The two mobile variants are declared but not implemented in this release and state no capability set; under those drivers there is nothing to grade an annotation against, so do not fall back to the browser variant's set. Under such a driver the line is still required, and its admissible value is the not-applicable marker the `ui-tests-plan-writer` contract fixes — `n/a (<qa_driver> variant declares no capability set)`: accept it, and grade nothing further about it.
- **For the `web-playwright` driver**, the split between the two registered browser MCP servers is fixed: a test is tagged `chrome-devtools (performance / Core Web Vitals)` **only** when it asserts on LCP / CLS / INP or a performance trace, and **every other test is `Playwright`** (interaction + network + console, plus `request mocking` when the test stubs a backend response). An over-tagged test (chrome-devtools for an interaction/network/console assertion), an under-tagged performance test, or a missing capability line is a Must Fix.
- A test whose assertion depends on a **backend operation actually failing** (a send/submit/upload that must fail, an error state on a failed call) is a Must Fix: the qa-tester cannot force a real backend failure — request-mocking is not reliably exposed and network-condition / offline emulation is unavailable — so such a test is not runnable and must not be authored (the behaviour is reported `blocked` / noted as a coverage gap instead).
```

with

```text
- **The annotation must name a capability the configured `<qa_driver>`'s `qa-tester` variant actually has** — read off that variant's own file (`## Read first`); one naming a capability that variant lacks is a Must Fix. The two mobile variants are declared but not implemented in this release and state no capability set: do not fall back to the browser variant's set. Under such a driver the line is still required, and its admissible value is the not-applicable marker `n/a (<qa_driver> variant declares no capability set)`: accept it, and grade nothing further about it.
- **For the `web-playwright` driver**, grade the tag against the rule in the writer's `### Capability guidance`: an over-tagged test (`chrome-devtools (performance / Core Web Vitals)` on an interaction/network/console assertion), an under-tagged performance test, or a missing capability line is a Must Fix.
- A test whose assertion depends on a **backend operation actually failing** (a send/submit/upload that must fail, an error state on a failed call) is a Must Fix: the writer's `### Capability guidance` rules it unrunnable.
```

**R12** — `plugin/agents/ui-tests-plan-reviewer.md`: replace

```text
- Every expected network assertion cites a name that appears in the story index or a per-task file. An invented backend name is a Must Fix — name the test and the bogus name. **The names in scope are the adopter's to state** — *replace with your project's* external-call and stored-query vocabulary, read off the owning layer's `layers[].conventions` document via `<layer_path_map>`, never from a list this file invents. What is fully transferable, and is the actual rule, is the anti-invention direction: a test may only cite a name the plan set already introduced, never one it coins for itself.
```

with

```text
- Every expected network assertion cites a name that appears in the story index or a per-task file; an invented backend name is a Must Fix — name the test and the bogus name. The vocabulary is the adopter's external-call and stored-query names, read off the owning layer's `layers[].conventions` document via `<layer_path_map>`, never from a list this file invents.
```

**Verification:**

- Run `bash scripts/scratch-run.sh harness-runs/scratch/ui_tests_qa_family_check.mjs plugin/agents/ui-tests-plan-reviewer.md plugin/agents/ui-tests-plan-writer.md` as one plain foreground command. Its last line is `PASS`, both `WORDS` lines show a negative `delta`, and it prints no `SHARED-PENDING` line naming either file and none of `FROZEN`, `LEAD`, `HEADING`, `FRONTMATTER`, `LITERAL`, `OUTSIDE-CHANGED` or `WORDS-NOT-LOWER`.
- `git grep -n -F -e "replace with your project's" -- plugin/agents/ui-tests-plan-reviewer.md` prints nothing.
- `git grep -n -e '^### ' -- plugin/agents/ui-tests-plan-reviewer.md` prints the same `### ` headings, in the same order, as it prints against `13a2ed4c` (`git grep -n -e '^### ' 13a2ed4c -- plugin/agents/ui-tests-plan-reviewer.md`), minus the `13a2ed4c:` prefix and the line numbers.
- `git diff -- plugin/agents/ui-tests-plan-reviewer.md` shows hunks only between `## What to check` and `## Unsolicited dispatch guidance`.
