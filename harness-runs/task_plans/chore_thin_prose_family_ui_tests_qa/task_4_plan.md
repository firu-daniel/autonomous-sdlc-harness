### Task 4 — Thin `ui-tests-plan-writer` from `## Split output spec` to the end

**Goal:** Cut `## Split output spec (mirror the `task-plan-writer` exactly)`, `## Quality checks before saving`, `## Clarification questions` and `## Output contract` of `plugin/agents/ui-tests-plan-writer.md` to direct rules stated once. The quality checks become a one-line-per-check list whose rules are stated in the sections above them.

**Depends on:** Task 3, which moves the uncreatable-data clarification list into `### Test data` → the `## Questions` bullet. This task deletes the paragraph that list came from, so it must land after Task 3.

**Where this task stops.** It changes only these parts of `plugin/agents/ui-tests-plan-writer.md`:
- in `## Split output spec`: the `## Context` bullet's parenthetical, two clauses of the readiness bullet, the `**`**Capability / MCP:**`**` bullet, and the last sentence of the `**`**Expected:**`**` bullet;
- the seven `## Quality checks before saving` bullets;
- the `## Clarification questions` exception sentence and the test-data paragraph after it (deleted);
- in `## Output contract`: the `**No-UI variant.**` lead-in, the omit paragraph, and the reviewer-dispatch sentence.

It does not touch the three fenced return blocks, the `## Questions` paragraph, the `**(a) The index**` and `**(b) One self-contained per-test file**` field lists outside the bullets named above, or any heading.

Apply the replacements below exactly. Each **Old** block is an exact substring of the file at `13a2ed4c` — sometimes only part of a line, leading space included — and you replace exactly that substring. If an Old block is not found exactly once, change nothing more in that file and return a blocker naming the file and the R-number.

**Frozen text in or next to this range** stays word for word:
- the run `an absolute path built from `<repo_root>`; do not use a Bash`;
- in the readiness bullet, the runs `K** — <short title> _(layer: <one or more of <layer_names>>)_`,` (comma included), `that genuinely spans layers carries a comma-joined tag, in the adopter's configured layer order with the catch-all layer — the `layers[]` entry whose `path` is `"."` — last, because it usually documents or wires up what the other layers`, `State up-front in the section's lead paragraph that this list is the **single source of truth**` and the whole `Binding on you as the author: …` sentence;
- `Do not paste the plan content back to the orchestrator — it will not read it.`

These bold leads, which agent definitions outside the family carry, stay: `**(a) The index**` and `**`## Phase 2 Readiness — Ordered Fix List`**`.

**What `ui-tests-plan-reviewer` reads here.** From Task 5 on, the reviewer reads this file's `## Split output spec (mirror the `task-plan-writer` exactly)` section as the contract it grades against. That section must therefore still state on its own:
- the heading order;
- the byte-identical readiness heading and the entry form with its `_(layer: …)_` tag;
- the 1:1 file rule;
- the six required per-test fields plus the optional `**Depends on:**`;
- the capability tags and the not-applicable marker, by pointer to `### Capability guidance`.

### Targets

- `plugin/agents/ui-tests-plan-writer.md` → `## Split output spec`, `## Quality checks before saving`, `## Clarification questions` and `## Output contract`, the parts named above.

**Work:**

- [ ] **Split output spec.** Apply R1–R5. The readiness bullet loses only the two key-off asides; every frozen run in it stays. The `**`**Capability / MCP:**`**` bullet keeps the `**`Playwright (interaction + network + console`**` tag form and the `**`chrome-devtools (performance / Core Web Vitals)`**` tag.
- [ ] **Quality checks.** Apply R6. Each check is one line. The test-prep-gap route (note it in the test's text and raise it in `## Questions`) and the lower-numbered `**Depends on:**` rule are stated here only, so they stay in full.
- [ ] **Clarifications and output.** Apply R7–R11. R8 deletes the test-data clarification paragraph, whose rule `### Test data` now states (Task 3). The no-UI return block and its "omit `ui_test_index` / `ui_test_files_dir`" rule stay.
- [ ] **Rule inventory before saving.** Confirm each of these still has a home in this file, restoring anything missing in its shortest form:
  - every file is saved with `Write` at an absolute path, never a heredoc;
  - no `## Tasks` section;
  - the tag is picked from the `**On failure → fix target:**` note, comma-joined across layers in configured order with the catch-all last;
  - every entry is written at `[ ]` and never flipped;
  - a no-UI branch writes nothing and returns the no-UI block;
  - `## Questions` goes above the summary;
  - the plan content is never pasted back.

### Replacements

**R1** — `plugin/agents/ui-tests-plan-writer.md`: replace (the Old block opens with one space)

```text
 No per-test bodies, no `### Targets` sub-lists. (A no-UI branch produces **no index at all** — see `## No-UI determination` — so this section only exists when there are tests.)
```

with

```text
 No per-test bodies, no `### Targets` sub-lists.
```

**R2** — `plugin/agents/ui-tests-plan-writer.md`: replace

```text
The heading text MUST be **byte-identical** (the QA orchestrator and any committer that touches this file key off it). One entry
```

with

```text
The heading text MUST be **byte-identical**. One entry
```

**R3** — `plugin/agents/ui-tests-plan-writer.md`: replace (the Old block opens with one space)

```text
 if that test fails (it is informational for running the test — `**Test K**` entries dispatch the `qa-tester`, not a layer implementer). Pick
```

with

```text
 if that test fails. Pick
```

**R4** — `plugin/agents/ui-tests-plan-writer.md`: replace

```text
- A **`**Capability / MCP:**`** line stating which capability the test needs so the qa-tester picks the right one, drawn from the configured `<qa_driver>`'s variant. For the `web-playwright` driver the default is **`Playwright (interaction + network + console`** [`+ request mocking` if the test stubs a response]`)`, and **`chrome-devtools (performance / Core Web Vitals)`** only for the rare test that asserts on LCP/CLS/INP or a performance trace. Under a driver whose variant declares no capability set, the line carries the not-applicable marker `### Capability guidance` defines instead.
```

with

```text
- A **`**Capability / MCP:**`** line — the capability `### Capability guidance` assigns: for the `web-playwright` driver **`Playwright (interaction + network + console`** [`+ request mocking` if the test stubs a response]`)`, or **`chrome-devtools (performance / Core Web Vitals)`** for a test that asserts on LCP/CLS/INP or a performance trace; under a driver whose variant declares no capability set, the not-applicable marker.
```

**R5** — `plugin/agents/ui-tests-plan-writer.md`: replace (the Old block opens with one space)

```text
 Each status / value literal here is the one `## Process` step 3 had you read off its authority — the call site that writes it, or the task file that introduces the attribute where no call site exists yet — never one inferred while drafting this list.
```

with

```text
 Each status / value literal is the one `## Process` step 3 read off its authority.
```

**R6** — `plugin/agents/ui-tests-plan-writer.md`: replace

```text
- Every test step references an identity locator that the story/task files say exists. If a needed locator is missing, **flag it** as a test-prep gap (note it in the test's text and surface it in `## Questions`) rather than inventing one.
- Every expected network assertion cites an external-call or stored-query name that appears in the story or task files — do not invent backend names.
- **Every test carries a `**Capability / MCP:**` line**, naming a capability the configured `<qa_driver>`'s variant has — or, where that variant declares no capability set, the not-applicable marker of `### Capability guidance`; on the `web-playwright` driver, only tests that actually assert on performance / Core Web Vitals are tagged `chrome-devtools`, and every other test is `Playwright`.
- **Every readiness entry carries a `_(layer: …)_` tag** with one or more of `<layer_names>`, matching the test's `**On failure → fix target:**` note. A `**Test K**` entry missing its layer tag is a `Must Fix` in review.
- The index ↔ per-test 1:1 correspondence holds (one `ui_test_<K>.md` per readiness entry, count matches).
- Tests are ordered by run sequence and any `**Depends on:**` link points at a lower-numbered test.
- **Every asserted status / value literal is one the emitting source can actually produce at that point in the flow** — read off that call site where the attribute already exists, and off the task file that introduces it where it does not, never inferred. An attribute that **neither** a call site nor a task file names is not asserted at all. Either one is a `Must Fix` in review.
```

with

```text
- Every step's locator is one the story/task files say exists. A missing one is a test-prep gap: note it in the test's text and raise it in `## Questions`; never invent one.
- Every expected network assertion cites an external-call or stored-query name the story or task files state.
- Every test carries a `**Capability / MCP:**` line per `### Capability guidance`.
- Every readiness entry carries a `_(layer: …)_` tag of `<layer_names>` values matching its test's `**On failure → fix target:**` note.
- One `ui_test_<K>.md` per readiness entry, and no file without one.
- Tests are in run order, and every `**Depends on:**` link points at a lower-numbered test.
- Every asserted status / value literal was read off its authority (`## Process` step 3); an attribute neither authority names is not asserted.
```

**R7** — `plugin/agents/ui-tests-plan-writer.md`: replace (the Old block opens with one space)

```text
 Do NOT make load-bearing assumptions silently. **Exception — the no-UI case is not a clarification question:** when it is obvious the branch renders nothing (see `## No-UI determination`), self-skip by writing **no plan** and returning `no_ui: true`; reserve `## Questions` for genuine ambiguity, not for confirming an obvious no-UI skip.
```

with

```text
 Do NOT make load-bearing assumptions silently. An obvious no-UI branch is never a question (`## No-UI determination`), and test data is one only when `### Test data` says so.
```

**R8** — `plugin/agents/ui-tests-plan-writer.md`: delete this whole paragraph together with the blank line that follows it

```text
**Test data the credentials file does not cover is a clarification only when it is genuinely uncreatable.** First apply the QA techniques (`.claude/qa_test_scenarios.md`): **where this project has more than one account**, a cross-account check becomes a sequential peer test (act, sign out, sign in as the peer), and **sparse-but-creatable** data becomes a UI bootstrap step (create it through the app, e.g. add items to cross the page size, then reopen). Only when the scenario needs data **no QA action can produce** — an account beyond the documented set, a peer holding rights the documented accounts don't have, an elevated-rights account, a group membership none of the accounts holds, a stored value no UI action produces — do you **raise a `## Questions` clarification** rather than inventing it or quietly assuming it exists. Do **not** raise a clarification (and do **not** silently drop the test) for something a sequential sign-in or a UI setup step would reach. This is the same "do not make load-bearing assumptions silently" discipline applied to seed/test data.
```

**R9** — `plugin/agents/ui-tests-plan-writer.md`: replace

```text
**No-UI variant.** When the No-UI determination fires — or when `phases.qa` is `false`, so there was nothing to write in the first place — you wrote no files; return instead:
```

with

```text
**No-UI variant.** When the No-UI determination fires, or `phases.qa` is `false`, write no files and return instead:
```

**R10** — `plugin/agents/ui-tests-plan-writer.md`: replace

```text
Omit `ui_test_index` / `ui_test_files_dir` — no plan file was written, and its **absence** is the signal the orchestrator and QA consumers use to skip QA and skip the UI-test-plan review.
```

with

```text
Omit `ui_test_index` / `ui_test_files_dir`.
```

**R11** — `plugin/agents/ui-tests-plan-writer.md`: replace

```text
Do not paste the plan content back to the orchestrator — it will not read it. On a normal (non-no-UI) write the orchestrator dispatches the `ui-tests-plan-reviewer` against the index + per-test files, then later the `qa-tester` to execute them.
```

with

```text
Do not paste the plan content back to the orchestrator — it will not read it.
```

**Verification:**

- Run `bash scripts/scratch-run.sh harness-runs/scratch/ui_tests_qa_family_check.mjs plugin/agents/ui-tests-plan-writer.md` as one plain foreground command. Its last line is `PASS`, its `WORDS` line shows a negative `delta`, and it prints none of `FROZEN`, `LEAD`, `HEADING`, `FRONTMATTER`, `LITERAL`, `OUTSIDE-CHANGED` or `WORDS-NOT-LOWER`.
- `git grep -n -F -e '**Test data the credentials file does not cover**' -- plugin/agents/ui-tests-plan-writer.md` prints nothing, and `git grep -n -F -e 'a group membership none of them holds' -- plugin/agents/ui-tests-plan-writer.md` prints one line: the rule moved and was not lost.
- `plugin/samples/sample_task_plan.md` says *"write it from the format rules below and from the `ui-tests-plan-writer` body, which states the per-test file's own sections"*. Confirm that `**(b) One self-contained per-test file**` still lists `**`**Goal:**`**`, `**`**Depends on:**`**`, `**`**Preconditions:**`**`, `**`**Capability / MCP:**`**`, `**`**Steps:**`**`, `**`**Expected:**`**` and `**`**On failure → fix target:**`**`.
- `git diff -- plugin/agents/ui-tests-plan-writer.md` shows hunks only from `## Split output spec (mirror the `task-plan-writer` exactly)` down, and none inside a fenced return block.
