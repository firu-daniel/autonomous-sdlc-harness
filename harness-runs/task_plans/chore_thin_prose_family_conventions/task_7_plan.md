### Task 7 — Thin `harness-analyze.md`'s `(4d)`, step 5 and step 6

**Goal:** Cut `(4d)`, step 5 and step 6 of `plugin/commands/harness-analyze.md` to direct instructions stated once.

**Depends on:** Task 6, which edited the step 4 text above `(4d)` in the same file.

**Where this task stops.** It changes only the text from `   **(4d) The corpus pass — the set as a whole, two fixed iterations.**` to the end of the file. It does not touch anything above it, or any other file.

Apply the replacements below exactly, in order. Each **Old** block is an exact substring of `plugin/commands/harness-analyze.md` at `25e2382a` — sometimes only part of a line, sometimes several hard-wrapped lines with their indentation — and you replace exactly that substring with the **New** block, which carries its own line breaks and indentation. If an Old block is not found exactly once, change nothing more in that file and return a blocker naming the file and the replacement id.

`plugin/commands/harness-analyze.md` is hard-wrapped Markdown: a numbered step's first line has no indent and every continuation line of that step, and every later paragraph inside it, is indented three spaces; a bullet inside a step is `   - ` with five-space continuations. Each New block is already wrapped and indented that way. Paste it as given; do not re-wrap the paragraphs around it.

**Anchors and behaviour that must not move:**
- the labels `(4d)` and `(4d.0)`; `(4d.0)`'s gate, its field list and the `Layer-writer divergence — ` prefix; the cap sentence quoted from `plugin/agents/conventions-writer.md` → `## Invocation contract`, word for word, which Task 1 kept on the writer side;
- the corpus set's three `target` values, the two `role` values, the unfilled-skeleton exclusion and its step-6 report; when the pass does not run; both iterations, their field lists, the per-group dispositions and when iteration 2 does not run;
- step 5's propose-never-write rule, the `npx autonomous-sdlc-harness config set layers '<json>'` and `npx autonomous-sdlc-harness config set detection.review '<json>'` calls with the verdict JSON line byte for byte, the three verdicts and their bounds, and the `cli/src/doctor/checks.ts` (`LAYER_PROFILE_CHECK`) citation, which `.claude/context/plugin.md` → `## Citation` names as its example of citing outside the plugin;
- step 6's report order and every row, review line, corpus-block bullet and outstanding-item rule.

### Targets

- `plugin/commands/harness-analyze.md` → `(4d)`, step 5 and step 6.

**Work:**

- [ ] **`(4d.0)`.** Apply HA24–HA27: the prefix sentence keeps the literal and names the writer contract as the discriminator's owner; the cap paragraph keeps the quoted cap and the `role: fixable` note; the "runs first" rationale paragraph goes (the dispatch is already sent *"Before the corpus review below"*); the declined-divergence paragraph keeps its literal and its route.
- [ ] **The corpus set and the iterations.** Apply HA28–HA33: each bullet and paragraph keeps its rule and drops the reason after it.
- [ ] **Step 5.** Apply HA34–HA37: the new-path parenthesis, the refused-proposal reason and the rationale-provenance reasons go; the `LAYER_PROFILE_CHECK` citation stays; the record-clears paragraph keeps what it clears and that `layer-drift` reads the record for reporting only.
- [ ] **Step 6.** Apply HA38: the recap of where the four action values come from goes; each source is already stated in its own bullet above it.
- [ ] **Rule inventory, then the probe.** Confirm each item under **Anchors and behaviour that must not move** still has a home, restoring anything missing in its shortest form. Then run `bash scripts/scratch-run.sh harness-runs/scratch/conventions_family_check.mjs plugin/commands/harness-analyze.md` as one plain foreground command.

### Replacements

**HA24** — `plugin/commands/harness-analyze.md`: replace

```text
`Layer-writer divergence — `** so the writer reads a forwarded divergence rather
   than a reviewer finding — that prefix, and the absence of a corpus check id, is the discriminator its own
   `## Invocation contract` names.
```

with

```text
`Layer-writer divergence — `** — the discriminator the writer's own `## Invocation contract` names.
```

**HA25** — `plugin/commands/harness-analyze.md`: replace (the Old block begins with its 3-space indentation)

```text
   reconciliation dispatch, the third one that sentence admits; the shared cross-layer document is
   `role: fixable` like any other document this run wrote, so it takes the iteration fixes below in addition to
   this one. The count is therefore admissible on both sides rather than only on this one: a caller that
   exceeds it is refused by the writer's own stop condition.
```

with (the New block begins with its 3-space indentation)

```text
   reconciliation dispatch, the third one that sentence admits; the shared cross-layer document is
   `role: fixable` like any other document this run wrote, so it takes the iteration fixes below in addition to
   this one.
```

**HA26** — `plugin/commands/harness-analyze.md`: delete this text, together with the one blank line after it (the Old block begins with its 3-space indentation):

```text
   It runs **first** so the corpus review reads an already-reconciled shared document and its findings are
   net-new, rather than a re-discovery iteration 2 would then have to spend itself on.
```

**HA27** — `plugin/commands/harness-analyze.md`: replace (the Old block begins with one space, which is part of it)

```text
 exactly as a reviewer
   finding does. That literal is **not forked for a second origin** — one literal, one grep, one count; the
   origin rides inside the line, in the `Layer-writer divergence — ` prefix the report prints.
```

with (the New block begins with one space, which is part of it)

```text
 exactly as a reviewer
   finding does, the `Layer-writer divergence — ` prefix carrying its origin.
```

**HA28** — `plugin/commands/harness-analyze.md`: replace (the Old block begins with one space, which is part of it)

```text
 Send no fourth value: that paragraph is the closed set, and a value it does not admit changes the
     reviewer's `conventions` carve-out silently.
```

with (the New block begins with one space, which is part of it)

```text
 Send no fourth value.
```

**HA29** — `plugin/commands/harness-analyze.md`: replace (the Old block begins with one space, which is part of it)

```text
 An unfilled skeleton is
     template prose, and measuring this run's documents against it produces findings against the template —
     findings a writer then applies. The state is reachable: (4a)'s untouched-skeleton test is the marker
     **and** the `**What belongs here**` block, so a half-edited file carrying only the marker is *asked*, and
     can be answered `skip`. **Not a silent drop** — step 6 names the excluded document and the marker, which
     is what keeps this from being the drop the next bullet refuses.
```

with (the New block begins with one space, which is part of it)

```text
 A half-edited file
     carrying only the marker reaches this state, because (4a) asks about it and it can be answered `skip`.
     **Not a silent drop** — step 6 names the excluded document and the marker.
```

**HA30** — `plugin/commands/harness-analyze.md`: replace (the Old block begins with one space, which is part of it)

```text
 A member carrying neither value is a malformed
     dispatch, and silently dropping it from the set is worse than sending it: that is how the one member with
     no writer loses its review-time rule-holder on exactly the re-run where no section was written.
```

with (the New block begins with one space, which is part of it)

```text
 A member carrying neither value is a malformed
     dispatch, and silently dropping it from the set is worse than sending it.
```

**HA31** — `plugin/commands/harness-analyze.md`: replace (the Old block begins with one space, which is part of it)

```text
 or no `fixable` member: a
   corpus of one has nothing to be incoherent with, and the run says so in step 6 rather than paying a
   dispatch.
```

with (the New block begins with one space, which is part of it)

```text
 or no `fixable` member; the
   run says so in step 6.
```

**HA32** — `plugin/commands/harness-analyze.md`: replace

```text
, forwarded and never
     re-gathered, for the reason (4c) already gives. `shared_document` travels with those write-dispatch
     values as the writer's read-only anchor, but **the corpus-fix return carries
     `shared_document_divergences: none` by that axis's own rule**
     (`${CLAUDE_PLUGIN_ROOT}/agents/conventions-writer.md` → `## The document`): there is nothing to collect
     here, and (4d.0) — the only consumer — is already past, sent or skipped, before iteration 1.
```

with

```text
, forwarded and never
     re-gathered. `shared_document` travels with those write-dispatch values as the writer's read-only anchor,
     and **the corpus-fix return carries `shared_document_divergences: none` by that axis's own rule**
     (`${CLAUDE_PLUGIN_ROOT}/agents/conventions-writer.md` → `## The document`), so nothing is collected here.
```

**HA33** — `plugin/commands/harness-analyze.md`: replace

```text
: the narrowed set is empty, and a second full
   corpus read is then a cost with no subject. **There is no third iteration and no verdict gates either one**
   — the reviewer emits none by design, so the count is the terminator.
```

with

```text
: the narrowed set is empty. **There is no third iteration and no verdict gates either one.**
```

**HA34** — `plugin/commands/harness-analyze.md`: replace (the Old block begins with one space, which is part of it)

```text
 (4a) classifies that path `action: write` because no skeleton exists at it
   (`autonomous-sdlc-harness init` is the only writer of one and is not re-run here, so the `document_path`
   does not exist when the dispatch goes out),
```

with (the New block begins with one space, which is part of it)

```text
 (4a) classifies that path `action: write` because no skeleton exists at it,
```

**HA35** — `plugin/commands/harness-analyze.md`: replace (the Old block begins with its 3-space indentation)

```text
   **names the proposal that was refused**, because a proposal an operator has already answered, re-put
   unchanged by the next run, is what teaches them to stop reading it.
```

with (the New block begins with its 3-space indentation)

```text
   **names the proposal that was refused**.
```

**HA36** — `plugin/commands/harness-analyze.md`: replace (the Old block begins with one space, which is part of it)

```text
 The rationale
   is composed from this session's own working text, and a figure carried over from there has never been
   checked. It is load-bearing because `doctor`'s `layer-profile` check
   (`cli/src/doctor/checks.ts` → `LAYER_PROFILE_CHECK`) reproduces the rationale verbatim as its evidence, so
   this record is read long after the run that wrote it.
```

with (the New block begins with one space, which is part of it)

```text
 `doctor`'s `layer-profile`
   check (`cli/src/doctor/checks.ts` → `LAYER_PROFILE_CHECK`) reproduces the rationale verbatim as its evidence.
```

**HA37** — `plugin/commands/harness-analyze.md`: replace (the Old block begins with its 3-space indentation)

```text
   **What that record clears, and what it does not.** `doctor`'s `layer-profile` check warns while the
   profile carries no row scoped below the repository root and its provenance does not account for that — the
   unrecognised-layout fallback, unrecorded, or a preset whose source root did not resolve — and this record is
   the one thing that clears it — which is what closes this hand-off's
   loop — while it deliberately does **not** silence `layer-drift`, which reads this record **for reporting
   only**, naming the verdict and its date in its warning, so a recorded verdict never stops `doctor`
   reporting a source directory no layer covers, including one added after the review. A verdict describes
   the profile at the moment it was reviewed; `layer-drift` is what notices the tree moving afterwards.
```

with (the New block begins with its 3-space indentation)

```text
   **What that record clears, and what it does not.** It clears `doctor`'s `layer-profile` warning about a
   profile that carries no row scoped below the repository root with provenance that does not account for it. It
   never silences `layer-drift`, which reads this record **for reporting only** and keeps reporting a source
   directory no layer covers, including one added after the review.
```

**HA38** — `plugin/commands/harness-analyze.md`: delete this text, together with the one blank line after it (the Old block begins with its 3-space indentation):

```text
   That is where all four action values above come from — `written` / `merged` from a writer return or from
   (4b)'s own work, `skipped` from (4a), `proposed` from step 5.
```

**Verification:**

- The probe run prints `WORDS plugin/commands/harness-analyze.md` with a negative `delta`, and its last line is `PASS`.
- `git grep -n -E '[^:a-z]/harness-analyze' -- plugin/commands/harness-analyze.md` prints nothing: every command name keeps its qualified spelling.
- `git grep -n -F -e 'what teaches them to stop reading it' -e 'a re-discovery iteration 2' -e 'That is where all four action values' -- plugin/commands/harness-analyze.md` prints nothing.
- `git grep -n -F 'LAYER_PROFILE_CHECK' -- plugin/commands/harness-analyze.md` hits only step 5.
