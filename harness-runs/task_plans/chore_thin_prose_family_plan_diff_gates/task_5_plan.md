### Task 5 — Thin `business-parity-reviewer`'s `## Read first`, `## Process` step 3 and parity checks (a)–(h)

**Goal:** Cut the following parts of `plugin/agents/business-parity-reviewer.md` to direct rules stated once:
- the `<reference_impl>` and docs-root bullets of `## Read first`;
- `## Process` step 3;
- the two lead paragraphs of `## What to check (the parity checks)`;
- checks (a)–(h).

The following stay:
- the whole-method read with its four sibling-branch examples;
- every check's bold lead and its condition;
- every `*Replace with your project's parity surface*` slot and every surface-check `(Source: …)` citation.

**Depends on:** Task 1, which leaves `## Process` step 2's implemented-solution bullet saying the full-read discipline belongs to *"the **reference** side, step 3"*. This task's R3 keeps step 3 that full-read rule. Task 1 also wrote `harness-runs/scratch/plan_diff_gates_family_check.mjs`, which this task runs.

**Where this task stops.** It edits `plugin/agents/business-parity-reviewer.md` only, and in it only:
- the `- `<reference_impl>`` bullet of `## Read first` and the closing sentence of its `- `<docs_root>`` bullet;
- the body of `## Process` step 3 after its bold lead;
- the two paragraphs under `## What to check (the parity checks)`;
- the eight bullets `**(a) External call name**` through `**(h) Source-of-truth and mirror ordering for application-level state**`.

It does not touch:
- the conventions-document, docs-retrieval and test-run bullets, or the unreadable-input paragraph;
- step 3's bold lead `**For every business-logic decision in the work, locate the corresponding `<reference_impl>` source and compare.**`;
- checks (i) and (j), the exclusion-basis sub-bullet, the test-run check, the obvious-reference-bug exception and the dead-code carve-out, which are Task 6's;
- `plugin/agents/architecture-reviewer.md`.

Apply the replacements below exactly. Each **Old** block is an exact substring of the file at `6307573a`, sometimes only part of a line. Replace exactly that substring. If an Old block is not found exactly once, change nothing more and return a blocker naming the R-number.

**Frozen text in or next to this range** stays word for word. It occurs in agent definitions outside this family, and a one-copy edit forks it:
- the whole conventions-document bullet;
- the docs-root bullet up to `The code`;
- the whole docs-retrieval tool bullet;
- in check (a), the sentence `*Replace with your project's parity surface*: which calls cross that boundary and where the reference declares them.`;
- in check (c), the run `the **wire name** the reference's serialization declares, not the in-language property name` and the run `it keeps in parity, and how its serialization declares a wire name.`

Every check's bold lead stays. So does `**Do not stop at the grepped line: read the *entire* corresponding reference method / state object top to bottom**`.

**Wire this task keeps:**
- `` `## Process` step 3 ``, cited from `## Read first` and the exclusion-basis sub-bullet;
- the labels `(g), (i) and (j)`;
- `*Replace with your project's parity surface*` and `*replace with your project's parity surface*`;
- `<impl_stack>` and `<convention_symbols>`;
- the `(Source: …)` parentheticals of checks (a)–(d) and (h).

The `(Source: the conventions documents `<layer_path_map>` names; the rule is stated in this check.)` parentheticals of the doctrine checks (e)–(g) go. R5's lead paragraph now states once that the doctrine checks carry their own rule.

### Targets

- `plugin/agents/business-parity-reviewer.md` → the parts named above.

**Work:**

- [ ] **`## Read first`.** Apply R1–R2.
  - The `<reference_impl>` bullet keeps three rules: it is the spec, it is the only evidence, and it is opened per decision in step 3, never read end to end.
  - The docs-root bullet's last sentence keeps the rule that a digest entry is a claim to verify against the code and `<reference_impl>`, never a verdict.
- [ ] **`## Process` step 3.** Apply R3.
  - Keep:
    - the grep targets;
    - the bold whole-method read;
    - the four sibling-branch examples and the dropped-or-re-ordered risk;
    - the feed into (g), (i) and (j);
    - the plan-review and implemented-solution judgements.
  - The plan-review questions become one clause, and "a grep for one constant will not reveal a whole missing branch" goes. Task 6's exclusion-basis sub-bullet keeps that point (*"invisible to a constant-by-constant grep"*).
- [ ] **`## What to check` leads.** Apply R4–R5.
  - The first paragraph opens `Verify each check below.` and keeps:
    - `**Never flag something no rule source says.**`;
    - the described-versus-actual split;
    - "A violation is a **Must Fix** unless noted."
  - The second paragraph keeps the two check kinds:
    - (a)–(d) and (h) fill their slot from the conventions document they cite, never from invention;
    - (e)–(g) and (i)–(j) are doctrine and carry their own rule.
- [ ] **Checks (a)–(h).** Apply R6–R13.
  - Each check states its property, and `Verify each check below.` carries the verb.
  - Every condition stays: exact names, a name the reference does not declare, the payload's field-by-field match, the wire name over the in-language name, and document and collection paths.
  - So do the query shape with batching at the same size from the shared constant, every threshold and decision traced to a cited anchor, the three comparison kinds, and the write, dispatch and await order.
  - Check (h) keeps the authoritative store, the mirror order and the shared storage keys from the mandated constants.
  - The (e)–(g) source parentheticals go, per the lead paragraph.
- [ ] **Rule inventory before saving.** Read the old and new text side by side and confirm each item in the bullet above still has a home, and also these:
  - `<reference_impl>` is the spec and the only evidence;
  - it is opened per decision, never read end to end;
  - a divergence digest entry is a claim to verify;
  - step 3's grep targets, whole-method read, examples and feed;
  - each mode's judgement in step 3.

  Restore anything missing in its shortest form.

### Replacements

**R1** — `plugin/agents/business-parity-reviewer.md`: replace

```text
- `<reference_impl>` — the reference implementation itself, which is the spec. It is not a "read first" in the sense of reading it end to end; it is the source you open per decision in `## Process` step 3, and the only evidence a parity finding may rest on.
```

with

```text
- `<reference_impl>` — the spec, and the only evidence a parity finding may rest on. Do not read it end to end: open it per decision, in `## Process` step 3.
```

**R2** — `plugin/agents/business-parity-reviewer.md`: replace (the Old block opens with one space, after `` The code and `<reference_impl>` win. `` in the docs-root bullet)

```text
 Where the corpus keeps a digest of *already-adjudicated* intentional divergences, treat each entry as a "verify against the code and `<reference_impl>`" prompt, not as a verdict.
```

with

```text
 Treat an entry in a digest of *already-adjudicated* intentional divergences as a claim to verify against the code and `<reference_impl>`, never as a verdict.
```

**R3** — `plugin/agents/business-parity-reviewer.md`: replace (step 3's text after its bold lead)

```text
Grep `<reference_impl>` for the relevant truth — the sources that declare the project's external calls, the serialization declaration on the matching reference type, threshold constants, gating predicates. **Do not stop at the grepped line: read the *entire* corresponding reference method / state object top to bottom**, so you see the sibling branches in the same method (a deep-link auto-open, an early-return guard, a post-await revert, an optimistic-before-await mutation) that the port may have silently dropped or re-ordered — a grep for one constant will not reveal a whole missing branch. These full-method reads feed checks (g), (i) and (j). In **plan-review mode** you judge the *cited / described* parity (does the plan cite a real `<reference_impl>` source for each constant, call name and field? does the described predicate match the reference's boundary comparison? does the described payload match it field-by-field?). In **implemented-solution mode** you judge the *actual* code in the diff against the `<reference_impl>` source anchor.
```

with

```text
Grep `<reference_impl>` for it — the sources declaring the external calls, the serialization declaration on the matching reference type, threshold constants, gating predicates. **Do not stop at the grepped line: read the *entire* corresponding reference method / state object top to bottom**, so you see the sibling branches the port may have dropped or re-ordered (a deep-link auto-open, an early-return guard, a post-await revert, an optimistic-before-await mutation); these reads feed checks (g), (i) and (j). In **plan-review mode**, judge whether the plan cites a real `<reference_impl>` source for each constant, call name and field, and whether each described predicate and payload matches it; in **implemented-solution mode**, judge the diff's code against the `<reference_impl>` source anchor.
```

**R4** — `plugin/agents/business-parity-reviewer.md`: replace

```text
Each check names what it verifies and cites its rule source. **Never flag something no rule source says.** In **plan-review mode** you judge the *described / cited* parity; in **implemented-solution mode** you judge the *actual* files in the diff against the `<reference_impl>` source.
```

with

```text
Verify each check below. **Never flag something no rule source says.** In **plan-review mode** you judge the *described / cited* parity; in **implemented-solution mode**, the *actual* files in the diff against the `<reference_impl>` source.
```

**R5** — `plugin/agents/business-parity-reviewer.md`: replace

```text
Two kinds of check live here, and they cite differently. Checks **(a)–(d)** and **(h)** are shaped by *your project's parity surface* — the wire shapes, identifiers and call names it keeps in parity — so each carries a *replace with your project's parity surface* slot and cites the conventions document that states it, never a rule of this file's invention. Checks **(e)–(g)** and **(i)–(j)** are parity doctrine: they hold whatever the stack, and each states its own rule in its own text.
```

with

```text
Checks **(a)–(d)** and **(h)** take their content from *your project's parity surface* — the wire shapes, identifiers and call names it keeps in parity: fill each *replace with your project's parity surface* slot from the conventions document the check cites, never from invention. Checks **(e)–(g)** and **(i)–(j)** are parity doctrine and state their own rule.
```

**R6** — `plugin/agents/business-parity-reviewer.md`: replace

```text
- **(a) External call name** — verify the name of every call the project makes across its external boundary matches `<reference_impl>` exactly, checked against the reference sources that declare those calls. Never invent a name; if the reference does not declare it, that is the finding.
```

with

```text
- **(a) External call name** — the name of every call the project makes across its external boundary matches the `<reference_impl>` source that declares it, exactly; a name the reference does not declare is the finding.
```

**R7** — `plugin/agents/business-parity-reviewer.md`: replace

```text
- **(b) External call payload** — verify it matches `<reference_impl>` field-by-field:
```

with

```text
- **(b) External call payload** — matches `<reference_impl>` field-by-field:
```

**R8** — `plugin/agents/business-parity-reviewer.md`: replace

```text
- **(c) Stored-document and field names** — verify every field the project reads or writes uses the **wire name** the reference's serialization declares, not the in-language property name that serialization maps it from. The two differ by design in both stacks, and the mapping is exactly what is being checked: the reference's declaration is authoritative and the project's own serialization idiom (`<impl_stack>`) must land on the same wire string.
```

with

```text
- **(c) Stored-document and field names** — every field the project reads or writes uses the **wire name** the reference's serialization declares, not the in-language property name it is mapped from: the reference's declaration is authoritative, and the project's own serialization idiom (`<impl_stack>`) must land on the same wire string.
```

**R9** — `plugin/agents/business-parity-reviewer.md`: replace

```text
- **(d) Stored-data queries** — verify filters, ordering, limits and pagination match `<reference_impl>`, and that any batching a backend-imposed argument limit forces is chunked at the same size, taken from the shared constant the conventions document names (`<convention_symbols>`) rather than inlined at the call site.
```

with

```text
- **(d) Stored-data queries** — filters, ordering, limits and pagination match `<reference_impl>`, and batching forced by a backend-imposed argument limit is chunked at the same size, taken from the shared constant the conventions document names (`<convention_symbols>`), never inlined at the call site.
```

**R10** — `plugin/agents/business-parity-reviewer.md`: replace

```text
- **(e) Threshold constants / gating predicates** — verify every numeric threshold, limit, or gating condition traces to a cited `<reference_impl>` source anchor, never invented. Every business-logic decision must cite a reference source anchor; never invent a constant. (Source: the conventions documents `<layer_path_map>` names; the rule is stated in this check.)
```

with

```text
- **(e) Threshold constants / gating predicates** — every numeric threshold, limit or gating condition, like every business-logic decision, traces to a cited `<reference_impl>` source anchor; never invent a constant.
```

**R11** — `plugin/agents/business-parity-reviewer.md`: replace

```text
- **(f) Strict-vs-loose inequality** — verify boundary comparisons (strict vs. inclusive), absent-vs-empty checks, and ownership checks match `<reference_impl>` exactly. (Source: the conventions documents `<layer_path_map>` names; the rule is stated in this check.)
```

with

```text
- **(f) Strict-vs-loose inequality** — boundary comparisons (strict vs. inclusive), absent-vs-empty checks and ownership checks match `<reference_impl>` exactly.
```

**R12** — `plugin/agents/business-parity-reviewer.md`: replace

```text
- **(g) Side-effect ordering** — verify the order of writes, dispatches and awaits matches `<reference_impl>`. (Source: the conventions documents `<layer_path_map>` names; the rule is stated in this check.)
```

with

```text
- **(g) Side-effect ordering** — the order of writes, dispatches and awaits matches `<reference_impl>`.
```

**R13** — `plugin/agents/business-parity-reviewer.md`: replace

```text
- **(h) Source-of-truth and mirror ordering for application-level state** — verify the store the conventions documents name as the source of truth really is authoritative, that the listener mirrors it into the application-level state container (`<impl_stack>`) in the reference's order, and that storage keys match where the data is shared across platforms, taken from the mandated key constants (`<convention_symbols>`) rather than inline literals.
```

with

```text
- **(h) Source-of-truth and mirror ordering for application-level state** — the store the conventions documents name as the source of truth is authoritative, the listener mirrors it into the application-level state container (`<impl_stack>`) in the reference's order, and storage keys shared across platforms match, taken from the mandated key constants (`<convention_symbols>`), never inline literals.
```

**Verification:**

- Run `bash scripts/scratch-run.sh harness-runs/scratch/plan_diff_gates_family_check.mjs plugin/agents/business-parity-reviewer.md` as one plain foreground command. Its last line is `PASS`, and it prints no `FROZEN`, `LEAD`, `PAIR-LEAD`, `LITERAL`, `READS-CHANGED`, `OTHER-AGENT-CHANGED` or `WORDS-NOT-LOWER` line.
- The wire survives. Run `git grep -c -F -e '<literal>' -- plugin/agents/business-parity-reviewer.md` once per literal below; each prints a count of at least 1:
  - `` `## Process` step 3 ``
  - `checks (g), (i) and (j)`
  - `*Replace with your project's parity surface*`
  - `(Source: the boundary-owning layer's `layers[].conventions` document.)`
  - `(Source: the owning layer's `layers[].conventions` document.)`
  - `**Never flag something no rule source says.**`
  - `**Do not stop at the grepped line: read the *entire* corresponding reference method / state object top to bottom**`
  - `an optimistic-before-await mutation`
- The slots and pointers survive on every line they sat on. Run `git grep -n -F -e "*Replace with your project's parity surface*" -- plugin/agents/business-parity-reviewer.md` and the same command against `6307573a` (`git grep -n -F -e "*Replace with your project's parity surface*" 6307573a -- plugin/agents/business-parity-reviewer.md`): each check label, (a) through (h), that carries the slot at `6307573a` still carries it. Do the same for `` `## Process` step 3 ``: the `<reference_impl>` bullet and the exclusion-basis sub-bullet each still carry it.
- The cross-family texts keep their file sets:
  - Run `git grep -l -F -e '<string>' -- plugin/agents` and the same command against `6307573a` (`git grep -l -F -e '<string>' 6307573a -- plugin/agents`). Compare the two lists with the `6307573a:` prefix removed; they must match.
  - Do this for each string: `which calls cross that boundary and where the reference declares them.`, `the **wire name** the reference's serialization declares, not the in-language property name`, `it keeps in parity, and how its serialization declares a wire name.`, `Treat their content as authoritative; do not re-derive it from memory.`.
- `git diff --name-only` lists `plugin/agents/business-parity-reviewer.md` as this task's only change. `git diff -- plugin/agents/business-parity-reviewer.md` shows hunks only in the two `## Read first` bullets, step 3, the two `## What to check` lead paragraphs and checks (a)–(h).
- `wc -w plugin/agents/business-parity-reviewer.md`, run before the first edit and again after the last, is lower the second time.
