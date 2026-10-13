### Task 2 — Scope `ui-tests-plan-writer`'s read of the `qa-tester` variant, and thin `## No-UI determination` and `### Capability guidance`

**Goal:** Make `plugin/agents/ui-tests-plan-writer.md` read only the capability set of `qa-tester.md` — its frontmatter and its `## Which MCP to use (per-test selection rule — follow verbatim)` section — instead of the whole 7 921-word file, and cut `## No-UI determination` and `### Capability guidance` to direct rules stated once. This read is the largest up-front saving of the branch.

**Depends on:** Task 1, which writes `harness-runs/scratch/ui_tests_qa_family_check.mjs`. Task 1 edits only the writer's intro and `## Invocation contract`, so the two tasks touch disjoint text.

**Where this task stops.** It changes only these parts of `plugin/agents/ui-tests-plan-writer.md`:
- in `## Read first`: the lead-in line, the `**The configured `<qa_driver>`'s `qa-tester` variant**` bullet, and one sentence appended to the cited-path paragraph;
- in `## No-UI determination`: the signature paragraph, the write-no-files and return bullets, and the ambiguity paragraph;
- in `### Capability guidance`: the vocabulary paragraph, the two server bullets, the `**Rule:**` paragraph's last sentence, and the failed-backend paragraph.

It does not touch the task-prompt, story-index, per-task, conventions-document, source-directory, docs-root, docs-retrieval or lessons bullets, the `CLAUDE.md` precedence sentence, the prose-minimisation paragraph, or anything from `## Process` down (Tasks 3–4).

Apply the replacements below exactly. Each **Old** block is an exact substring of the file at `13a2ed4c`, and you replace exactly that substring. If an Old block is not found exactly once, change nothing more in that file and return a blocker naming the file and the R-number.

**Frozen text in or next to this range** stays word for word:
- the `- `<docs_root>` — the documentation corpus, **only when `phases.docs` is `true`**:` opening and the whole `mcp__harness-docs__search_docs` bullet;
- in the lessons bullet, the run `initialization, re-fetch when an authorization or entitlement flag flips, deep-link`;
- the sentence `Where the auto-loaded `CLAUDE.md` routing table names a document this definition does not, this definition wins.`;
- the cited-path paragraph from `**A cited path you cannot read is a finding, not a fallback.**` through `and never` (R3 only appends a sentence after its end).

These bold leads, which the UI-test plan reviewer carries too, stay: `**The conventions document of the layer that owns the application's surfaces**`, `**That same layer's source directory**`, `**The configured `<qa_driver>`'s `qa-tester` variant**`, `**For the `web-playwright` driver**`. `**Playwright MCP**` and `**chrome-devtools MCP**`, which `qa-tester.md` carries too, stay.

**The contract with Tasks 5 and 6.** The UI-test plan reviewer reads the same variant file the same way. Four sentences are written identically into both files. Tasks 5 and 6 write the reviewer's copies, and the probe's `SHARED` list checks them.
- `Read these; no other layer's conventions document is needed:` (R1);
- `Resolve the file from the driver: … each read whole.`, the whole sentence in R2;
- `A cited section you cannot find is an unreadable path.` (R3);
- `The two mobile variants are declared but not implemented in this release and state no capability set: do not fall back to the browser variant's set.` (R8).

The reviewer also reads this file's `` ### Capability guidance (encode this in every test's `**Capability / MCP:**` line) `` section (Task 5), so that heading stays byte for byte, and the section must still state the two-server tagging rule, the `n/a (<qa_driver> variant declares no capability set)` marker and the failed-backend ban on its own.

### Targets

- `plugin/agents/ui-tests-plan-writer.md` → `## Read first`, `## No-UI determination`, `### Capability guidance`, the parts named above.

**Work:**

- [ ] **The scoped read.** Apply R1–R3. The variant bullet now names the read: under `web-playwright`, `qa-tester.md`'s frontmatter and `## Which MCP to use (per-test selection rule — follow verbatim)` only; under either mobile driver, the stub read whole. A heading that cannot be found blocks like an unreadable file.
- [ ] **No-UI determination.** Apply R4–R7. The rationale for writing no index goes; the absent-index signal, the ban on an empty index or a zero-entry readiness list, the no-`## Questions` rule and the ambiguity route stay.
- [ ] **Capability guidance.** Apply R8–R11. The two server bullets keep their bold leads and their tag scope; `qa-tester.md` → `## Which MCP to use` now states the servers in full, and this file reads it.
- [ ] **Rule inventory before saving.** Confirm each of these still has a home in this file. Restore anything missing in its shortest form.
  - The writer reads no layer conventions document beyond the surface layer's.
  - The variant file is resolved from `<qa_driver>`; the capability set comes from it and from nothing remembered.
  - No-UI: obvious → no files, no `## Questions`, the no-UI contract; ambiguous → `## Questions`; never invent tests.
  - Annotate only from the variant's set; a mobile driver takes only the `n/a (<qa_driver> variant declares no capability set)` marker, and the line is still written.
  - `chrome-devtools (performance / Core Web Vitals)` only for LCP / CLS / INP or a trace; every other test `Playwright`, plus `request mocking` when it stubs a response.
  - No test that needs a real backend failure; note the coverage gap; a run that reaches it reports `blocked`.

### Replacements

**R1** — `plugin/agents/ui-tests-plan-writer.md`: replace

```text
UI tests are **black-box behavioural** — you do not need every layer's conventions document in depth; you need to know what each task is supposed to do, what the real UI conventions are, and which capability each test needs. Read:
```

with

```text
Read these; no other layer's conventions document is needed:
```

**R2** — `plugin/agents/ui-tests-plan-writer.md`: replace

```text
- **The configured `<qa_driver>`'s `qa-tester` variant** — the **consumer** of your plan. Read it so you know what that variant can actually do, and so you annotate each test with the capability the qa-tester must pick. Resolve the file from the driver: `web-playwright` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md`, `mobile-maestro` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester-mobile-maestro.md`, `mobile-mcp` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester-mobile-mcp.md`.
```

with

```text
- **The configured `<qa_driver>`'s `qa-tester` variant** — the **consumer** of your plan, and the source of the capability set `### Capability guidance` annotates from. Resolve the file from the driver: `web-playwright` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md`, read only its frontmatter and its `## Which MCP to use (per-test selection rule — follow verbatim)` section; `mobile-maestro` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester-mobile-maestro.md` and `mobile-mcp` → `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester-mobile-mcp.md`, each read whole.
```

**R3** — `plugin/agents/ui-tests-plan-writer.md`: replace

```text
Never substitute another document for a cited one, and never author against a remembered capability set.
```

with

```text
Never substitute another document for a cited one, and never author against a remembered capability set. A cited section you cannot find is an unreadable path.
```

**R4** — `plugin/agents/ui-tests-plan-writer.md`: replace

```text
Some branches produce **no interactively-testable UI** at all — every deliverable is a non-surface artifact (run-artifact or agent-definition documents, scripts, infrastructure, build/config, or internals of a non-surface layer that no task surfaces in the UI). The signature: **no task touches the surface layer's `layers[].path` scope, no surface-component file, no route, and no test attribute is added or changed.**
```

with

```text
A branch renders **no interactively-testable UI** when every deliverable is a non-surface artifact — documents, scripts, infrastructure, build/config, or a non-surface layer's internals that no task surfaces in the UI. The signature: **no task touches the surface layer's `layers[].path` scope, no surface-component file, no route, and no test attribute is added or changed.**
```

**R5** — `plugin/agents/ui-tests-plan-writer.md`: replace

```text
- Write **no files** — no index at `<state_dir>/ui_test_plans/<branch>_ui_test_plan.md` and no per-test files. The **absence** of the index is the signal every QA consumer keys off ("no UI-test plan → skip QA, skip plan review"); an empty index file is **not** written. (A zero-entry readiness list would be self-contradictory: the writer would be emitting exactly what the `ui-tests-plan-reviewer` is contractually required to reject as a Must Fix, and an existing-but-empty index defeats the absent-index skip in the QA flows.)
```

with

```text
- Write **no files** — no index at `<state_dir>/ui_test_plans/<branch>_ui_test_plan.md` and no per-test files. The **absence** of the index is the signal every QA consumer keys off; never write an empty index or a zero-entry readiness list.
```

**R6** — `plugin/agents/ui-tests-plan-writer.md`: replace

```text
- Return the **no-UI contract** (see `## Output contract`): `no_ui: true` plus a one-line `reason` and `tests_count: 0`, and **no** `ui_test_index` path (no file was written).
```

with

```text
- Return the **no-UI contract** of `## Output contract`.
```

**R7** — `plugin/agents/ui-tests-plan-writer.md`: replace

```text
Only fall through to a `## Questions` clarification (per `## Clarification questions`) when the no-UI call is **genuinely ambiguous** — e.g. a task touches the surface layer but you cannot tell whether it produces user-observable behaviour. "Obvious no UI" is the self-skip path; ambiguity is the ask path. Never invent test cases for a branch that renders nothing.
```

with

```text
Raise a `## Questions` clarification only when the no-UI call is **genuinely ambiguous** — e.g. a task touches the surface layer but you cannot tell whether it produces user-observable behaviour. Never invent test cases for a branch that renders nothing.
```

**R8** — `plugin/agents/ui-tests-plan-writer.md`: replace

```text
**The capability vocabulary a test may annotate is the one the configured `<qa_driver>`'s `qa-tester` variant actually has** — read the capability set off that variant's own file (the driver → file map is in `## Read first`) and annotate from that set only. An annotation naming a capability the configured variant does not have is a Must Fix at review, because it routes the qa-tester to a tool it cannot invoke. The two mobile variants are declared but not implemented in this release and state no capability set; under those drivers there is nothing to draw an annotation from, so do not fall back to the browser variant's set. **The line is still written**, and under such a driver its only admissible value is the not-applicable marker `n/a (<qa_driver> variant declares no capability set)`.
```

with

```text
**The capability vocabulary a test may annotate is the one the configured `<qa_driver>`'s `qa-tester` variant actually has** — read off that variant's own file (`## Read first`); annotate from that set only. The two mobile variants are declared but not implemented in this release and state no capability set: do not fall back to the browser variant's set. **The line is still written**, and under such a driver its only admissible value is the not-applicable marker `n/a (<qa_driver> variant declares no capability set)`.
```

**R9** — `plugin/agents/ui-tests-plan-writer.md`: replace

```text
- **Playwright MCP** — the **default/primary**. Covers element interaction, navigation, **network inspection**, **console inspection**, and **request mocking**. Use it for virtually every test.
- **chrome-devtools MCP** — **performance / Core Web Vitals tracing only** (LCP, CLS, INP, trace-based bottleneck analysis). This is the *one* capability Playwright MCP lacks, and the *only* reason the second server exists.
```

with

```text
- **Playwright MCP** — the default: element interaction, navigation, network inspection, console inspection and request mocking.
- **chrome-devtools MCP** — performance / Core Web Vitals tracing only (LCP, CLS, INP, trace-based bottleneck analysis).
```

**R10** — `plugin/agents/ui-tests-plan-writer.md`: replace (the Old block opens with one space)

```text
 (interaction + network + console, plus `request mocking` when the test stubs a backend response). Do not over-tag — interaction/network/console tests are always Playwright.
```

with

```text
 (interaction + network + console, plus `request mocking` when the test stubs a backend response).
```

**R11** — `plugin/agents/ui-tests-plan-writer.md`: replace

```text
**Do not author tests that need a real backend call to fail.** Request-mocking (`browser_route`) is granted to the qa-tester but is not reliably exposed by a live Playwright MCP, and it cannot intercept the long-lived streaming transport a realtime backend keeps open; network-condition / offline emulation is likewise typically unavailable (the chrome-devtools `emulate` tool is commonly permission-denied in a headless run environment). The qa-tester is also read-only on application code, so it cannot induce a failure by other means. A behaviour that only appears on a **failed** backend operation (e.g. a failed send removing its optimistic entry, an error state on a failed submit) is therefore **not testable** here — do **not** author a test for it; note the coverage gap instead (if a run reaches the behaviour it is reported `blocked`).
```

with

```text
**Do not author tests that need a real backend call to fail.** The qa-tester cannot force one: request mocking (`browser_route`) is not reliably exposed and cannot intercept a long-lived streaming transport, network-condition / offline emulation is typically unavailable, and it is read-only on application code. A behaviour that only appears on a **failed** backend operation (e.g. a failed send removing its optimistic entry, an error state on a failed submit) is **not testable** here — note the coverage gap instead (a run that reaches it reports it `blocked`).
```

**Verification:**

- Run `bash scripts/scratch-run.sh harness-runs/scratch/ui_tests_qa_family_check.mjs plugin/agents/ui-tests-plan-writer.md` as one plain foreground command. Its last line is `PASS`, its `WORDS` line shows a negative `delta`, and it prints none of `FROZEN`, `LEAD`, `HEADING`, `FRONTMATTER`, `LITERAL`, `OUTSIDE-CHANGED` or `WORDS-NOT-LOWER`.
  - Its `SHARED-PENDING` lines name only files other than `ui-tests-plan-writer.md`: every `SHARED` text this task owns is in the writer.
  - Its `UPFRONT ui-tests-plan-writer web-playwright` line shows an `after` figure that is the writer's own word count plus the frontmatter and `## Which MCP to use` section of `qa-tester.md`, not the whole file.
- `git grep -n -F -e '## Which MCP to use (per-test selection rule — follow verbatim)' -- plugin/agents/qa-tester.md` prints exactly one line, the heading the new read cites.
- `git grep -n -F -e 'declared but not implemented in this release' -- plugin/agents/ui-tests-plan-writer.md` prints at least one line: `cli/src/config/model.ts` → `QA_DRIVER_IMPLEMENTED` names that phrase as a sweep key.
- `git diff -- plugin/agents/ui-tests-plan-writer.md` shows this task's hunks only between `## Read first` and `## Process`.
