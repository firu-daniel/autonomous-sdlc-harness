### Task 2 — Thin `conventions-writer`'s `## The document`, `## The fix dispatch`, `## Output contract` and `## House rules`

**Goal:** Cut `## The document`, `## The fix dispatch`, `## Output contract` and `## House rules` of `plugin/agents/conventions-writer.md` to direct rules stated once, keeping every rule `conventions-reviewer` grades against.

**Depends on:** Task 1, which edited the sections above `## The document` in the same file and wrote the probe at `harness-runs/scratch/conventions_family_check.mjs`.

**Where this task stops.** It changes only the text from the `## The document` heading to the end of the file. It does not touch anything above that heading, `plugin/agents/conventions-reviewer.md`, `plugin/commands/harness-analyze.md` or any other file under `plugin/`.

**Why these four sections are load-bearing twice.** After Task 3, `conventions-reviewer` reads exactly `## Scope`, `## The document`, `## The fix dispatch` and `## House rules` of this file, and after Task 4 its check (9) cites `## The document`'s **Never a census.**, **The carve-out — a claim that *is* a rule stays.** and **Never a restatement of the stack.** by their bold leads. `plugin/commands/harness-analyze.md` → `(4b)` binds its own composition to `## The document` and `## House rules` by reference. So every bold lead, every census shape, every test with its carve-out and every literal here stays; only rationale and restatement go.

Apply the replacements below exactly, in order. Each **Old** block is an exact substring of `plugin/agents/conventions-writer.md` at `25e2382a` — sometimes only part of a line, sometimes several hard-wrapped lines with their indentation — and you replace exactly that substring with the **New** block, which carries its own line breaks and indentation. If an Old block is not found exactly once, change nothing more in that file and return a blocker naming the file and the replacement id.

**Frozen text in this range** stays word for word:
- *"Your final message IS your return value (not a human chat)."*;
- in `## House rules`, the run from *"document — in any shape: with a colon"* to *"as a slash-joined run of tails after a path"*, and the run *"is repo-relative and resolves against `<repo_root>`** — the same root `layers[].path` follows"* with *"a path that resolves only from inside the application directory is"*.

Three sentences other files quote also stay: *"Field names byte-stable"* (`plugin/instructions/mention_reading.md` and `.claude/context/plugin.md` quote it), the `## House rules` line-number paragraph with *"A renamed symbol fails loudly; a shifted line fails silently."* (`.claude/context/plugin.md` → `## Citation` cites it), and the first of `## Not determined`'s two line classes (`docs/development.md` Gate 8 cites it).

### Targets

- `plugin/agents/conventions-writer.md` → `## The document`, `## The fix dispatch`, `## Output contract` and `## House rules`.

**Work:**

- [ ] **`## The document` — tests and every-dispatch bullets.** Apply CW10–CW13.
  - CW10 and CW11 cut the process-rule rationale and re-order the garbled commit-message carve-out sentence into one list. The carve-out's items (prefixes, capitalisation, length cap, trailers, fixed-form subjects derived by the `<scripts_dir>` row's probe with every omission accounted for) all stay.
  - CW12 and CW13 drop rationale from the rule-block and count bullets. The rule that a number which *is* a rule is measured like any other stays.
- [ ] **`## The document` — divergences, the absent document and the closing obligations.** Apply CW14–CW20.
  - CW15 keeps *"On `pass: corpus` it does not apply and the field is `none`"*; `plugin/commands/harness-analyze.md` → `(4d)` cites that rule here.
  - CW16 and CW17 keep the `absent` case's values and add *"never as `skeleton`"* in place of the paragraph explaining why.
  - CW18–CW20 drop the reasons behind removing the marker, the footer provenance line and the literal, and keep each obligation and *"That literal is a wire string."*
- [ ] **`## The fix dispatch` and `## Output contract`.** Apply CW21–CW25.
  - CW21 folds the duplicate "not reworded for a forwarded finding" sentence into the recording rule.
  - CW22 and CW23 cut the rationale in the `action_taken:` and `shared_document_divergences:` bullets. Every field name, its order and its value set stay.
  - CW24 and CW25 keep "quote before replacing", "quote, never paraphrase", "re-emit the handed values on a fix", "the report is built from this return alone" and "re-emit the whole block on a fix".
- [ ] **`## House rules`.** Apply CW26: **Minimal prose.** keeps its rule and loses its rationale.
- [ ] **Rule inventory, then the probe.** Confirm each of these still has a home, restoring anything missing in its shortest form: the census list and both carve-outs; the stack test and its carve-out; the process test, its wording list and the commit-message carve-out; the intent rule; every bullet under *"On every dispatch:"*; the divergence rule on both axes; `action: merge`; the absent-document shape and its three values; both closing obligations; both `## Not determined` line classes; the fix-dispatch duty; every return field; the three `prior_*` rules; and every house rule. Then run `bash scripts/scratch-run.sh harness-runs/scratch/conventions_family_check.mjs plugin/agents/conventions-writer.md` as one plain foreground command.

### Replacements

**CW10** — `plugin/agents/conventions-writer.md`: replace

```text
belong to the flow, which fixes one layer per task and one commit per task; a document asserting one collides with the dispatch model.
```

with

```text
belong to the flow.
```

**CW11** — `plugin/agents/conventions-writer.md`: replace

```text
**The carve-out is the commit-message policy** the shared cross-layer document owns — subject prefixes, capitalisation, length cap, the fixed-form subjects the flow emits, which that document's own bullet has you derive with a probe rather than list — and account for each omission as the `<scripts_dir>` row requires, which is what bounds the carve-out — and trailers: message form stays, work grouping goes.
```

with

```text
**The carve-out is the commit-message policy** the shared cross-layer document owns — subject prefixes, capitalisation, length cap, trailers, and the fixed-form subjects the flow emits, derived with the `<scripts_dir>` row's probe with every omission accounted for, which is what bounds the carve-out: message form stays, work grouping goes.
```

**CW12** — `plugin/agents/conventions-writer.md`: replace

```text
never dropped**: it states harness contracts the shipped agents read off this document. A skeleton carrying no such block simply has nothing to keep.
```

with

```text
never dropped**. A skeleton carrying no such block has nothing to keep.
```

**CW13** — `plugin/agents/conventions-writer.md`: replace (the Old block begins with one space, which is part of it)

```text
 An unmeasured quantity in a durable record reads as measured. Separate from **Never a census**, which bars a measurement of the present code from the **document**: a number that *is* a rule stays admissible and is measured like any other.
```

with (the New block begins with one space, which is part of it)

```text
 A number that *is* a rule stays admissible under **Never a census** and is measured like any other.
```

**CW14** — `plugin/agents/conventions-writer.md`: replace

```text
You do **not** edit that document — the one-file fence of `## Scope` is unchanged — and you do **not** silently write
```

with

```text
You do **not** edit that document, and you do **not** write
```

**CW15** — `plugin/agents/conventions-writer.md`: replace

```text
**On `pass: corpus` it does not apply and the field is `none`:** the caller spends this field at the shared document's reconciliation dispatch, sent before the corpus iterations, so a line emitted on a corpus fix reaches no collector; the corpus review is what covers the same ground on that axis.
```

with

```text
**On `pass: corpus` it does not apply and the field is `none`.**
```

**CW16** — `plugin/agents/conventions-writer.md`: replace

```text
This is the path a layer profile accepted during the run newly names; `autonomous-sdlc-harness init` is the only writer of a skeleton and is not re-run, so there is nothing on disk — no banner to rewrite, no `**What belongs here**` block to answer, no rule block to keep, no footer to replace.
```

with

```text
This is a path a layer profile accepted during the run newly names, and nothing is on disk.
```

**CW17** — `plugin/agents/conventions-writer.md`: replace

```text
`prior_rule_block: n/a`: those three values are what tell the reviewer there was no prompt list to answer, no rule block to keep and no marker to remove. Reporting this case as `skeleton` puts the reviewer on a contract the document cannot satisfy, and the findings it then raises are declined and land permanently in the adopter's `## Not determined`.
```

with

```text
`prior_rule_block: n/a`, never as `skeleton`.
```

**CW18** — `plugin/agents/conventions-writer.md`: delete this text (the Old block begins with one space, which is part of it):

```text
 A leftover marker makes a filled document read as an untouched skeleton to the next run's two-part classification test and to `doctor` — which is exactly what a `merge` produces if the line is left standing.
```

**CW19** — `plugin/agents/conventions-writer.md`: replace

```text
, and it is the one `doctor`'s two-part test, the re-run classification and the acceptance gate read.
```

with

```text
.
```

**CW20** — `plugin/agents/conventions-writer.md`: replace (the Old block begins with one space, which is part of it)

```text
 That literal is a wire string: the command's report and the acceptance gate both grep for it.
```

with (the New block begins with one space, which is part of it)

```text
 That literal is a wire string.
```

**CW21** — `plugin/agents/conventions-writer.md`: replace

```text
under the exact literal `Reviewer finding not applied — `, and in your return. That literal is a wire string and is not reworded for a forwarded finding of any origin.
```

with

```text
under the exact literal `Reviewer finding not applied — `, unreworded whatever the finding's origin, and in your return.
```

**CW22** — `plugin/agents/conventions-writer.md`: replace

```text
`written` or `merged`. Those are the only two values: every dispatch you can receive carries `action: write` or `action: merge`, declining a document is not among your options, and a document the caller classified as skipped is never dispatched to you.
```

with

```text
`written` or `merged`, and no other value: declining a document is not among your options.
```

**CW23** — `plugin/agents/conventions-writer.md`: delete this text (the Old block begins with one space, which is part of it):

```text
 **Consumer:** the caller collects these lines across the layer wave and carries them into the shared cross-layer document's own fix-only reconciliation dispatch (`${CLAUDE_PLUGIN_ROOT}/commands/harness-analyze.md`, step 4's `(4d)`), where each returns to this writer as an ordinary `findings` line under the literal `Layer-writer divergence — `.
```

**CW24** — `plugin/agents/conventions-writer.md`: replace (the Old block begins with one space, which is part of it)

```text
 — the write is one whole document replacing what was there, and afterwards nothing on disk or in the plugin holds that text. Quote, never paraphrase: the reviewer grades survival by comparing your document against these strings. Their consumer is the **review dispatch**, not the report — the caller forwards them to the reviewer and back to you on a fix, and prints none of them. On a fix dispatch, re-emit all three with **exactly the values the dispatch handed you**: you did not see the pre-write file on that dispatch and must not reconstruct it.
```

with

```text
. Quote, never paraphrase. On a fix dispatch, re-emit all three with **exactly the values the dispatch handed you**; never reconstruct them.
```

**CW25** — `plugin/agents/conventions-writer.md`: replace

```text
The text-carrying fields exist rather than counts because the dispatching command builds its closing report **from this return alone and does not re-read your document**: a `## Not determined` line, a prose/code conflict or a sampling gap that is not in your return is not in the report. Do not paste the document body — these are lines, not the document. On a fix dispatch, re-emit the whole block describing the document as it now stands: that return is the run's last word on this document.
```

with

```text
The caller builds its report **from this return alone and does not re-read your document**, so every `## Not determined` line, prose/code conflict and sampling gap goes in it. Do not paste the document body. On a fix dispatch, re-emit the whole block describing the document as it now stands.
```

**CW26** — `plugin/agents/conventions-writer.md`: replace

```text
State the rule, not the argument for it — this file is a system prompt paid on every dispatch, and so is the document you write.
```

with

```text
State the rule, not the argument for it — in the document you write as well.
```

**Verification:**

- The probe run prints `WORDS plugin/agents/conventions-writer.md` with a negative `delta`, and its last line is `PASS`.
- `git grep -n -F -e 'collides with the dispatch model' -e 'Those are the only two values' -e '**Consumer:**' -e 'system prompt paid on every dispatch' -- plugin/agents/conventions-writer.md` prints nothing.
- `git grep -n -F -e '**Never a census.**' -e '**The carve-out — a claim that *is* a rule stays.**' -e '**Never a restatement of the stack.**' -- plugin/agents/conventions-writer.md` hits each of the three bold leads, and every hit sits under `## The document`.
- `git diff -- plugin/agents/conventions-writer.md` shows this task's hunks only below the `## The document` heading.
