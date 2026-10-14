### Task 5 — Scope `ui-tests-plan-reviewer`'s reads of the writer and the `qa-tester` variant, and thin its intro through `## Process`

**Goal:** Make `plugin/agents/ui-tests-plan-reviewer.md` read only the two sections of `ui-tests-plan-writer.md` it grades against and only the capability set of `qa-tester.md`, instead of both whole files (5 662 + 7 921 words at `13a2ed4c`). Also cut its intro, `## Invocation contract` table, `## Read first` and `## Process` to direct rules stated once.

**Depends on:** Task 2, which writes the writer's copies of the sentences this task writes into the reviewer, and Task 4, the last edit to the writer's `## Split output spec` section this reviewer now reads. The reviewer grades plans against the writer's definition, so it is thinned after the writer.

**Where this task stops.** It changes only these parts of `plugin/agents/ui-tests-plan-reviewer.md`:
- the phase-gate tail and the "QA-side analog" paragraph (deleted);
- the `ui_test_index` row of the `## Invocation contract` key table;
- in `## Read first`: the lead-in line, the per-task-files bullet, the writer-contract bullet and the `qa-tester` variant bullet, plus one sentence appended to the cited-path paragraph;
- `## Process` steps 0 and 2–6.

It does not touch the frontmatter, the role line, the read-only paragraph, `## Resolved values`, the fenced dispatch block, the other key-table rows, the `**You create `<findings_folder>` yourself, …**` and `**Your return is parsed, not read.**` paragraphs, the task-prompt, story-index, conventions-document, source-directory, docs and lessons bullets, step 1, or anything from `## What to check` down (Task 6).

Apply the replacements below exactly. Each **Old** block is an exact substring of the file at `13a2ed4c` — sometimes only part of a line, leading space included — and you replace exactly that substring. If an Old block is not found exactly once, change nothing more in that file and return a blocker naming the file and the R-number.

**Frozen text in or next to this range** stays word for word:
- in the phase gate, the run from `is `true` in `harness.config.json`.** With the phase off the project runs no interactive tests at all:` through `not a licence to improvise —`;
- the whole read-only paragraph `**You report findings. You do not edit the plan.** …`;
- the key-table header, the `ui_test_files_dir` row's `per readiness entry. Read **every** one.` and every row from `findings_folder` down;
- the whole `**You create `<findings_folder>` yourself, …**` and `**Your return is parsed, not read.**` paragraphs;
- the docs-root opening, the docs-retrieval bullet and the lessons bullet's opening;
- the `CLAUDE.md` precedence sentence;
- the cited-path paragraph through `never validate against a remembered` (R6 only appends after its end);
- in step 2, the run `You are the coherence guardian — you read the whole`.

**The contract with Tasks 2 and 4.**
- **The writer sections read.** The reviewer reads `ui-tests-plan-writer.md` → `` ## Split output spec (mirror the `task-plan-writer` exactly) `` and `` ### Capability guidance (encode this in every test's `**Capability / MCP:**` line) ``, by those exact headings. Task 4 left the first stating the index and per-test contract on its own, and Task 2 the second stating the tagging rule, the marker and the failed-backend ban.
- **Shared sentences.** Four sentences are written identically into both files, and the probe's `SHARED` list checks them:
  - `Read these; no other layer's conventions document is needed:` (R4);
  - `Resolve the file from the driver: … each read whole.` (R5);
  - `A cited section you cannot find is an unreadable path.` (R6);
  - the mobile-variant sentence of `### Capability/MCP correctness`, which Task 6 writes.
- **The read can widen.** The writer bullet lets the reviewer read another writer section only when a finding turns on a writer rule this file does not state, so no graded rule becomes unreachable.

### Targets

- `plugin/agents/ui-tests-plan-reviewer.md` → the intro, the `ui_test_index` key-table row, `## Read first` and `## Process`, the parts named above.

**Work:**

- [ ] **Intro and contract.** Apply R1–R3. The gate's tail now points at the no-plan guard, which states the PASS-and-write-nothing rule once. The analog paragraph is rationale and goes. The `ui_test_index` row keeps the absence pointer.
- [ ] **The scoped reads.** Apply R4–R6.
  - The writer bullet names the two writer sections by their exact headings, in double-backtick spans because each heading carries backticks.
  - The variant bullet carries the same resolution sentence as the writer.
  - A heading that cannot be found blocks like an unreadable file.
- [ ] **Process.** Apply R7–R8. Step 0 keeps the absent-index PASS, the no-write rule and the "never a Must Fix" rule, and drops the caller-routing rationale. Steps 3–5 now point at their check groups instead of restating them. Step numbers 0–6 are unchanged, because `### Asserted attribute values agree with the source` cites "`## Process` step 3".
- [ ] **Rule inventory before saving.** Confirm each of these still has a home in this file. Restore anything missing in its shortest form.
  - A stray dispatch with the phase off lands on the no-plan guard.
  - The reviewer reads no layer conventions document beyond the surface layer's.
  - It grades against the writer's contract and the variant's capability set, and never against a remembered one.
  - With the index absent: `verdict: PASS`, no file written, nothing graded, never a Must Fix.
  - It reads the whole plan set; locators, network names and literals are checked against their authorities.

### Replacements

**R1** — `plugin/agents/ui-tests-plan-reviewer.md`: replace (the Old block opens with one space)

```text
 and it needs no separate handling, because it lands on the **no-plan guard** that already opens `## Process`: the index is absent, so you return `verdict: PASS` immediately, write **no** files, and grade nothing. Do not add a second exit path for the disabled phase, and never grade the absent index as a Must Fix.
```

with

```text
 it lands on the **no-plan guard** at `## Process` step 0.
```

**R2** — `plugin/agents/ui-tests-plan-reviewer.md`: delete this whole paragraph together with the blank line that follows it

```text
You are the QA-side analog of the `task-plan-reviewer`: same job, same read-only discipline, same PASS/FAIL output contract — you just validate the UI-test plan against the `ui-tests-plan-writer` contract instead of the task plan against the `task-plan-writer` contract.
```

**R3** — `plugin/agents/ui-tests-plan-reviewer.md`: replace

```text
| `ui_test_index` | The UI-test plan **index** — the thin one: `# UI Test Plan:`, `## Context`, then the ordered readiness list. No test bodies. Its **absence** is meaningful; see the no-plan guard at `## Process` step 0. |
```

with

```text
| `ui_test_index` | The UI-test plan **index**. Its **absence** is meaningful: `## Process` step 0. |
```

**R4** — `plugin/agents/ui-tests-plan-reviewer.md`: replace

```text
UI tests are **black-box / behavioural** — same as the writer, you do not need every layer's conventions document in depth. You need to know what each task is supposed to do (so you can confirm cited ids and backend names are real), what the real UI conventions are, and what the configured `qa-tester` variant can actually do. Read:
```

with

```text
Read these; no other layer's conventions document is needed:
```

**R5** — `plugin/agents/ui-tests-plan-reviewer.md`: replace

```text
- The **per-task files** (`<state_dir>/task_plans/<branch>/task_<N>_plan.md`) — so you can confirm every cited test-attribute locator and every cited external-call / stored-query name is real (the task files introduce them; the UI-test plan must not invent them).
- `${CLAUDE_PLUGIN_ROOT}/agents/ui-tests-plan-writer.md` — the **contract you validate against** (the split index + per-test shape, the heading strings, the required per-test fields).
- **The configured `<qa_driver>`'s `qa-tester` variant** — the **consumer**; read it so you can verify each test's `**Capability / MCP:**` annotation names a capability that variant actually has, or — where that variant declares no capability set — carries the marker `n/a (<qa_driver> variant declares no capability set)`; see `### Capability/MCP correctness`. Resolve the file from the driver: `web-playwright` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md`, `mobile-maestro` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester-mobile-maestro.md`, `mobile-mcp` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester-mobile-mcp.md`.
```

with

```text
- The **per-task files** (`<state_dir>/task_plans/<branch>/task_<N>_plan.md`) — the source every cited test-attribute locator and external-call / stored-query name must come from.
- `${CLAUDE_PLUGIN_ROOT}/agents/ui-tests-plan-writer.md` → `` ## Split output spec (mirror the `task-plan-writer` exactly) `` and `` ### Capability guidance (encode this in every test's `**Capability / MCP:**` line) `` — the **contract you validate against**. Read those two sections, not the whole file; read another of its sections only when a finding turns on a writer rule this file does not state.
- **The configured `<qa_driver>`'s `qa-tester` variant** — the **consumer**, and the capability set `### Capability/MCP correctness` grades against. Resolve the file from the driver: `web-playwright` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md`, read only its frontmatter and its `## Which MCP to use (per-test selection rule — follow verbatim)` section; `mobile-maestro` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester-mobile-maestro.md` and `mobile-mcp` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester-mobile-mcp.md`, each read whole.
```

**R6** — `plugin/agents/ui-tests-plan-reviewer.md`: replace

```text
Never substitute another document for a cited one, and never validate against a remembered contract.
```

with

```text
Never substitute another document for a cited one, and never validate against a remembered contract. A cited section you cannot find is an unreadable path.
```

**R7** — `plugin/agents/ui-tests-plan-reviewer.md`: replace

```text
0. **No-plan guard (check FIRST).** If `ui_test_index` does not exist on disk, the `ui-tests-plan-writer` determined the branch renders no interactively-testable UI and deliberately wrote no plan (its `no_ui: true` path) — or the interactive-test phase is off, so no writer ever ran. Either way there is nothing to review: return `verdict: PASS` immediately and write **no** findings file. Do **not** treat the absent index as a Must Fix. A normally-dispatched review never reaches this case (the caller skips the reviewer on a `no_ui` writer return, and skips the whole loop when `phases.qa` is `false`), but this guard makes a stray dispatch safe.
```

with

```text
0. **No-plan guard (check FIRST).** If `ui_test_index` does not exist on disk — the writer's `no_ui: true` path, or the interactive-test phase is off — return `verdict: PASS` immediately, write **no** files and grade nothing. The absent index is never a Must Fix.
```

**R8** — `plugin/agents/ui-tests-plan-reviewer.md`: replace

```text
2. Read the **index** in full, then read **every** per-test file in `ui_test_files_dir`. You are the coherence guardian — you read the whole set, even though the qa-tester reads only the slices it runs.
3. For every identity locator cited in any per-test step, confirm the story/task files say that locator exists (the task that introduces the control names it). A locator with no source is a test-prep coverage gap.
4. For every expected network assertion, confirm the external-call or stored-query name it cites appears in the story or task files (no invented backend names).
5. For every asserted value/status attribute literal, grep the surface-owning layer's source for the call site that writes that attribute and confirm the literal is one that call site produces. Where the attribute is one a task on this branch introduces, the task file is the authority instead — the source does not carry it yet. A literal an existing call site contradicts, or an attribute neither the source nor any task file accounts for, is a finding against the plan; see `### Asserted attribute values agree with the source`.
6. Apply the checks below.
```

with

```text
2. Read the **index** in full, then **every** per-test file in `ui_test_files_dir`. You are the coherence guardian — you read the whole set.
3. For every identity locator a per-test step cites, confirm the story/task files say it exists.
4. For every expected network assertion, confirm the story or task files name its external-call or stored-query name.
5. For every asserted value/status attribute literal, grade it against its authority per `### Asserted attribute values agree with the source`.
6. Apply the checks below.
```

**Verification:**

- Run `bash scripts/scratch-run.sh harness-runs/scratch/ui_tests_qa_family_check.mjs plugin/agents/ui-tests-plan-reviewer.md` as one plain foreground command. Its last line is `PASS`, its `WORDS` line shows a negative `delta`, and it prints none of `FROZEN`, `LEAD`, `HEADING`, `FRONTMATTER`, `LITERAL`, `OUTSIDE-CHANGED` or `WORDS-NOT-LOWER`.
  - Its `SHARED-PENDING` lines name `ui-tests-plan-reviewer.md` only for the mobile-variant sentence Task 6 writes.
  - Its `UPFRONT ui-tests-plan-reviewer web-playwright` line shows an `after` figure several thousand words below its `before` figure.
- Both headings the writer bullet cites still exist: `git grep -n -e '^## Split output spec (mirror the ' -e '^### Capability guidance (encode this in every test' -- plugin/agents/ui-tests-plan-writer.md` prints one line per heading, and each matches the heading the bullet quotes character for character.
- `git grep -l -F -e 'read only its frontmatter and its' -- plugin/agents` lists exactly `plugin/agents/ui-tests-plan-reviewer.md` and `plugin/agents/ui-tests-plan-writer.md`.
- `git diff -- plugin/agents/ui-tests-plan-reviewer.md` shows hunks only above `## What to check`, and none inside `## Resolved values` or the fenced dispatch block.
