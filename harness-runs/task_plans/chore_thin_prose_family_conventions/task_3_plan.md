### Task 3 — Thin `conventions-reviewer`'s intro and `## Invocation contract`, and narrow its read of the writer to four sections

**Goal:** Cut the intro and `## Invocation contract` of `plugin/agents/conventions-reviewer.md` to direct rules stated once, and narrow the reviewer's up-front read of `plugin/agents/conventions-writer.md` from the whole file to the four sections it grades against.

**Depends on:** Task 2, which left `## Scope`, `## The document`, `## The fix dispatch` and `## House rules` of `plugin/agents/conventions-writer.md` in their final form. This task names those four sections as the reviewer's read; it does not edit the writer.

**Where this task stops.** It changes only the text from the line after the frontmatter down to the `## What to verify` heading, excluding the `## Resolved values` preamble and table. It does not touch:
- the frontmatter or `## Resolved values` (frozen);
- `## What to verify` and everything below it (Task 4);
- `plugin/agents/conventions-writer.md`, `plugin/commands/harness-analyze.md` or any other file under `plugin/`.

**The narrowed read.** CR2 states the read as the writer's `## Scope`, `## The document`, `## The fix dispatch` and `## House rules`, which are all the reviewer grades against:
- `## Scope` holds the reconciliation rule false positive (b) reuses;
- `## The document` holds the banner, prompt, rule-block, provenance, census, stack, process and intent rules, `## Not determined` and the declined-finding literal;
- `## The fix dispatch` holds the bounded merge correction and the corpus-declined recording duty;
- `## House rules` holds the line-number shapes check (8) leans on, the repo-relative path rule for check (14) and the `.claude/**` rule for check (15).

Nothing the reviewer grades lives in the writer's intro, `## Resolved values`, `## Invocation contract` or `## Output contract`: the reviewer carries its own `<scripts_dir>` probe row and its own `prior_*` table.

Apply the replacements below exactly, in order. Each **Old** block is an exact substring of `plugin/agents/conventions-reviewer.md` at `25e2382a` — sometimes only part of a line, sometimes several hard-wrapped lines with their indentation — and you replace exactly that substring with the **New** block, which carries its own line breaks and indentation. If an Old block is not found exactly once, change nothing more in that file and return a blocker naming the file and the replacement id.

**Frozen text in this range** stays word for word:
- the paragraph's bold lead, which tells the reviewer to read the writer's definition before it grades; the run *"before you grade.** It is the contract the document was written against — the"*, and the sentence *"Take the strings from it rather than from memory, so writer and reviewer cannot disagree."* CR2 rewrites only the list between them and keeps the word *"the"* after the dash;
- *"that omission is deliberate: it makes the read-only guarantee tool-level rather than a prose request."* — `.claude/context/plugin.md` → `## Frontmatter` quotes it from this file;
- the sentence opening `**The argument names and the return field names in this file are the wire` through *"reorder them."*, and the bold lead `**Stop condition — a missing value, never a missing key spelling.**`.

### Targets

- `plugin/agents/conventions-reviewer.md` → the intro paragraphs and `## Invocation contract`.

**Work:**

- [ ] **The intro.** Apply CR1–CR3.
  - CR1 keeps the read-only sentence and the tool-level quote, and replaces the findings-file rationale with the rule: no findings file, findings go back to the caller in the return, on both axes.
  - CR2 narrows the writer read as described above.
  - CR3 drops the last sentence of **What you establish, and what you do not.**
- [ ] **`## Invocation contract` tables.** Apply CR4–CR6. CR4 and CR6 make the same cuts Task 1 made in the writer's copies of the `pass` and `demand_set` rows; CR5 shortens the `harvested_sources` row to its rule and its pointer at check (3).
- [ ] **`## Invocation contract` paragraphs.** Apply CR7–CR9: they drop the rationale after the `none` rule, after the `prior_*` sentence (including the Gate 8 aside) and in the dispatch-count paragraph. Each rule, each count and the caller-bug stop stay.
- [ ] **Rule inventory, then the probe.** Confirm each of these still has a home, restoring anything missing in its shortest form: both axes' value tables; the three `shared_document: none` cases and "raise no naming finding"; checks (1) and (2) comparing against supplied strings only; the corpus `target` values and the `project` member's `scope`; `prior_*` and `shared_document` not sent on the corpus axis; the dispatch counts and both caller-bug stops; the stop condition. Then run `bash scripts/scratch-run.sh harness-runs/scratch/conventions_family_check.mjs plugin/agents/conventions-reviewer.md` as one plain foreground command.

### Replacements

**CR1** — `plugin/agents/conventions-reviewer.md`: replace (the Old block begins with one space, which is part of it)

```text
 You write **no findings file at all** — this run writes into an adopter's repository with no committer behind it, so a findings file would be untracked litter with no later reader. The corpus pass returns its findings **to the caller** exactly as the document pass does (the decision, and what it was chosen over, is recorded in `docs/analyze.md` §12). Your return is your findings, and the durable record of anything the writer declines is that document's own `## Not determined` line.
```

with (the New block begins with one space, which is part of it)

```text
 You write **no findings file at all**: on both axes your findings go back **to the caller** in your return.
```

**CR2** — `plugin/agents/conventions-reviewer.md`: replace

```text
It is the contract the document was written against — the banner, the `**What belongs here**` answers, the stack-independent rule block kept verbatim or restated, the real example, provenance on every rule, the `## Not determined` section, and the exact `Reviewer finding not applied — ` line the writer owes for anything it declines.
```

with

```text
It is the contract the document was written against — the sections `## Scope`, `## The document`, `## The fix dispatch` and `## House rules`, which are all you read of it.
```

**CR3** — `plugin/agents/conventions-reviewer.md`: delete this text (the Old block begins with one space, which is part of it):

```text
 Judging that one is still the adopter's job, and your findings exist to make it findable.
```

**CR4** — `plugin/agents/conventions-reviewer.md`: replace

```text
the stop condition below covers its absence, and a defaulted axis would let a caller bug read as a document pass.
```

with

```text
the stop condition below covers its absence.
```

**CR5** — `plugin/agents/conventions-reviewer.md`: replace

```text
or `none`. The harvest is repo-level, so these paths routinely sit **outside** any one layer's `scope`; without them you cannot tell a rule correctly carried over from the adopter's prose from an unattributable one — see check (3). |
```

with

```text
or `none`. They routinely sit **outside** this document's `scope` — see check (3). |
```

**CR6** — `plugin/agents/conventions-reviewer.md`: replace

```text
**as the caller derived it**. You never re-derive it: the caller derives it once for the whole run, and a second derivation run from inside the agent directory you are part of would drift from what the document under review was written against. |
```

with

```text
**as the caller derived it**, once for the whole run. Never re-derive it. |
```

**CR7** — `plugin/agents/conventions-reviewer.md`: delete this text (the Old block begins with one space, which is part of it):

```text
 An unfilled skeleton is template prose, and grading the adopter's document against it produces findings against the template.
```

**CR8** — `plugin/agents/conventions-reviewer.md`: replace (the Old block begins with one space, which is part of it)

```text
 The writer quotes them off the file before replacing it and the caller forwards them unchanged, because the write is one whole document and the skeletons ship from the CLI package, which is not part of this plugin and not on the adopter's disk — there is nothing for you to re-read. Checks (1) and (2) are therefore comparisons against **supplied strings**, not against a file you open, and a writer that under-reports them is beyond your reach: the independent check on that residual is the hand-run fixture gate (`docs/development.md` §5 Gate 8, `docs/analyze.md` §8 leg 3), which sees the seeded document and the written one.
```

with (the New block begins with one space, which is part of it)

```text
 There is nothing for you to re-read: checks (1) and (2) compare against these **supplied strings**, never against a file you open.
```

**CR9** — `plugin/agents/conventions-reviewer.md`: replace (the Old block begins with one space, which is part of it)

```text
 On neither axis is there a fix round of yours to wait for or a verdict to gate one: your findings go to the writer, which applies what it judges genuine and records what it declines.
```

with (the New block begins with one space, which is part of it)

```text
 On neither axis is there a fix round of yours to wait for or a verdict to emit.
```

**Verification:**

- The probe run prints `WORDS plugin/agents/conventions-reviewer.md` with a negative `delta` and an `UPFRONT plugin/agents/conventions-reviewer.md` line with a negative `delta`, and its last line is `PASS`. It prints no `READ-SECTION-MISSING` line.
- `git grep -n -F -e 'untracked litter' -e 'the hand-run fixture gate' -e 'a defaulted axis would let' -- plugin/agents/conventions-reviewer.md` prints nothing.
- `git grep -n -F 'which are all you read of it' -- plugin/agents/conventions-reviewer.md` has the narrowed-read sentence as its only hit.
- **Deviations from plan:** The second `**Verification:**` grep still prints one hit, `the hand-run fixture gate` in check (2) under `## What to verify` — outside this task's range ("Where this task stops"); `task_4_plan.md` deletes that sentence. Left in place; the grep is clean only after Task 4 lands. The CR1–CR9 removals themselves leave no hit in the intro or `## Invocation contract`.
