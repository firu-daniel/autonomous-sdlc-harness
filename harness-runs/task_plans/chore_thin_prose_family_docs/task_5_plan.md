### Task 5 — Thin `docs-reviewer`'s `## What to verify` and `## Output contract`

**Goal:** Cut `## What to verify (accuracy first, then depth, then completeness)` and `## Output contract` of `plugin/agents/docs-reviewer.md` to direct rules stated once, keeping all thirteen checks with their numbers, both line-number detectors and the value-vs-coordinate test byte for byte, and every return field.

**Depends on:** Task 4, which edits the part of the same file above `## What to verify (accuracy first, then depth, then completeness)`. Task 1 wrote `harness-runs/scratch/docs_family_check.mjs`, which this task runs. If the probe file is missing, return a blocker naming `harness-runs/scratch/docs_family_check.mjs`; do not rewrite it.

**Where this task stops.** It changes only text inside `## What to verify (accuracy first, then depth, then completeness)` (checks 1–13 and the sentence after them) and `## Output contract`. It does not touch:
- `## Unsolicited dispatch guidance` (frozen; the roster in `plugin/instructions/dispatch_discipline_instructions.md` names it);
- the second line-number detector line, which carries the `[Ll]ines?` expression `scripts/check-typos.sh` exempts this file for;
- anything above `## What to verify …` (Task 4), `plugin/agents/docs-writer.md`, or any other file.

Apply the replacements below exactly. Each **Old** block is an exact substring of the file at `25e2382a` — sometimes only part of a line — and you replace exactly that substring. Task 4 edited only text above this section, so every Old block is still there. If an Old block is not found exactly once, change nothing more in that file and return a blocker naming the file and the C-number.

**Frozen text in this range** stays word for word. It occurs in agent definitions outside this family, and a one-copy edit forks it:
- in check 1, the run `— a path that resolves only from inside the application directory is the finding,` (C2 keeps it);
- in check 4, the run ``read off the owning layer's `layers[].conventions` document via `<layer_path_map>`, never from a`` (C5 keeps it, followed by *"shape this file assumes."*);
- the sentence after check 13, from `or heading style — this review is factual correctness, not editing.` (not edited);
- the whole `## Unsolicited dispatch guidance` section.

These bold leads stay, worded as they are: the thirteen numbered check leads (`**Every cited anchor resolves — both halves**` … `**Ripple not missed**`), `**A coordinate need not carry a colon.**`, `**values**` and `**classify every hit**` (each opening an indented line of check 2), `**Disregard it for verdict purposes**`, `**Report it**`, `**PASS**`, `**FAIL**` and `**docs phase disabled:**`. Every heading line stays, and the check numbers stay: the file cites *"check 2"* and *"check 7"*.

### Targets

- `plugin/agents/docs-reviewer.md` → `## What to verify (accuracy first, then depth, then completeness)` and `## Output contract`.

**Work:**

- [ ] **Checks 1–3.** Apply C1–C4.
  - Check 1 keeps both halves, the grep, and the prose-path rule from `<repo_root>` with its frozen run; it drops a restatement of (a) and (b) and the rationale sentence (C1, C2).
  - Check 2's two detectors, its shape list, its value list and the value-vs-coordinate test are not edited, except that *"classify every hit, never drive to zero"* drops the rationale after it (C3).
  - Check 3 keeps the operation name, payload, response and `reachable? ✅ / ❌` checks and the search of every layer path including `.`; it drops *"resolved against `<repo_root>`"* (stated once in `## Resolved values`), the rationale and the priority remark (C4).
- [ ] **Checks 4–10.** Apply C5–C8.
  - Check 4 keeps the claim kinds, the vocabulary rule with its frozen run, and the routing of each claim to its layer's `path` through the `## Technical implementation` sub-sections in the configured order; the template residue *"Replace with your project's …"* and the rationale go (C5).
  - Check 6 drops its last sentence (C6): `## Output contract` → `**FAIL**` already names a shallow, under-researched document.
  - Check 7 keeps its bold skip rule and drops its explanation (C7); `## Resolved values` → the `<reference_impl>` row states that the missing parity section is not a finding.
  - Check 10 drops its last sentence, a restatement of the check (C8).
  - Checks 5, 8, 9 and 11–13 are not edited.
- [ ] **`## Output contract`.** Apply C9. The disabled-phase return keeps `verdict: PASS`, the one line naming `phases.docs` as `false`, and the omission of `findings_file:`; it drops the restatement of the gate and the rationale. Every other line of the section is not edited.
- [ ] **Run the probe:** `bash scripts/scratch-run.sh harness-runs/scratch/docs_family_check.mjs plugin/agents/docs-reviewer.md`, as one plain foreground command.
- [ ] **Rule inventory before saving.** Read the old and new text side by side and confirm each of these still has a home. Restore anything missing in its shortest form.
  - Thirteen checks, numbered as before, with check 10 catalog-only with `existing_doc` and checks 11–13 update-only.
  - Check 1: path exists, symbol or quoted substring greps inside it, prose paths resolve from `<repo_root>`, and an application-relative path is the finding.
  - Check 2: the shape list, the symbol-anchor correction, both detectors, classify every hit, the value examples and the value-vs-coordinate test.
  - Check 3: operation name in the project's spelling, payload, response, reachability across every layer path including `.`. Check 4: claim kinds, the owning layer's vocabulary, routing by layer.
  - Check 6: shallow restatement of the entry files is a finding; derived features must trace provenance. Check 7: skipped with parity off. Checks 8, 9: honest unverified markers, no material omission.
  - No nitpicking of prose; the findings file shape (claim, contradicting file, correction); `verdict:` with the PASS and FAIL criteria, including the unclassified line coordinate; `findings_file:`, `missed_docs:` (update only), `summary:`; the disabled-phase return; do not paste the document back.

### Replacements

**C1** — `plugin/agents/docs-reviewer.md`: replace

```text
actually resolves *inside that file* (`grep` the symbol in the cited path and get a hit). No dangling/wrong paths, and no symbol that isn't there.
```

with

```text
actually resolves *inside that file* (`grep` the symbol in the cited path and get a hit).
```

**C2** — `plugin/agents/docs-reviewer.md`: replace

```text
is the finding, whatever position it sits in. Unlike a line number, a symbol anchor is mechanically verifiable: the grep either resolves or it does not.
```

with

```text
is the finding, whatever position it sits in.
```

**C3** — `plugin/agents/docs-reviewer.md`: replace

```text
**classify every hit**, never "drive to zero" — a zero here is usually damage, not success.
```

with

```text
**classify every hit**, never "drive to zero".
```

**C4** — `plugin/agents/docs-reviewer.md`: replace

```text
(does a caller actually exist anywhere under the `layers[].path` scopes of `<layer_path_map>`, resolved against `<repo_root>`? Search **every** layer path, including the catch-all `.` — a search narrowed to one directory marks a wired surface unreachable). Wrong payloads and mismarked reachability are the highest-value catches.
```

with

```text
(does a caller actually exist anywhere under the `layers[].path` scopes of `<layer_path_map>`? Search **every** layer path, including the catch-all `.`).
```

**C5** — `plugin/agents/docs-reviewer.md`: replace

```text
the stored-data claims match the source, not paraphrased or invented. *Replace with your project's stored-data vocabulary* — the collection/table paths, the document/record field names, the enum values and the types that declare them — read off the owning layer's `layers[].conventions` document via `<layer_path_map>`, never from a shape this file assumes. The document's `## Technical implementation` sub-sections are the configured layer names (`<layer_names>`) in the configured order: route each claim to that layer's `path` from `<layer_path_map>` and check it there. Checking a claim against the wrong layer's source is how a wrong claim passes.
```

with

```text
the stored-data claims — collection/table paths, document/record field names, enum values and the types that declare them — match the source, not paraphrased or invented, in the vocabulary read off the owning layer's `layers[].conventions` document via `<layer_path_map>`, never from a shape this file assumes. Route each claim to the layer whose `## Technical implementation` sub-section (`<layer_names>`, in the configured order) holds it, and check it against that layer's `path`.
```

**C6** — `plugin/agents/docs-reviewer.md`: replace

```text
rather than stopping at "a backend call returns the data." A shallow document that misses how the feature actually works is a FAIL.
```

with

```text
rather than stopping at "a backend call returns the data."
```

**C7** — `plugin/agents/docs-reviewer.md`: replace

```text
**Skipped entirely when `phases.parity` is `false`**: the writer omits the parity section from the template, so its absence is not a finding.
```

with

```text
**Skipped entirely when `phases.parity` is `false`**.
```

**C8** — `plugin/agents/docs-reviewer.md`: replace

```text
their still-true substance is reflected and no old content was silently dropped. A named merge target whose content is missing is a finding.
```

with

```text
their still-true substance is reflected and no old content was silently dropped.
```

**C9** — `plugin/agents/docs-reviewer.md`: replace

```text
- **docs phase disabled:** you wrote nothing and verified nothing — return `verdict: PASS` plus one line naming `phases.docs` as `false`, and omit `findings_file:` entirely. Its absence is what tells the caller no review was performed.
```

with

```text
- **docs phase disabled:** return `verdict: PASS` plus one line naming `phases.docs` as `false`, and omit `findings_file:` entirely.
```

**Verification:**

- The probe run above prints a `WORDS docs-reviewer.md` line whose `delta` is more negative than after Task 4, an `UPFRONT docs-reviewer.md` line with a negative `delta`, and a last line of `PASS`. It prints none of `FROZEN`, `LEAD`, `HEADING`, `FENCE`, `FRONTMATTER`, `LITERAL`, `LITERAL-NOT-AT-BASE`, `ADDED`, `SECTION-MISSING`, `READS-CHANGED`, `OTHER-AGENT-CHANGED`, `WORDS-NOT-LOWER` or `UPFRONT-NOT-LOWER`.
- `git grep -n -F -e 'mechanically verifiable' -e 'usually damage, not success' -e 'highest-value catches' -e 'how a wrong claim passes' -e 'Its absence is what tells' -- plugin/agents/docs-reviewer.md` prints nothing.
- `git grep -n -F -e '[Ll]ines?' -- plugin/agents/docs-reviewer.md` prints the second detector line of check 2, unchanged from `25e2382a`.
- `git diff -- plugin/agents/docs-reviewer.md` shows this task's hunks only between `## What to verify (accuracy first, then depth, then completeness)` and the end of the file, and none inside `## Unsolicited dispatch guidance`.
