### Task 4 — Thin `conventions-reviewer`'s checks, corpus pass, `## What you do not do` and `## House rules`

**Goal:** Cut `## What to verify`, `## The corpus pass — what to verify`, `## What you do not do` and `## House rules` of `plugin/agents/conventions-reviewer.md` to direct rules stated once. Where a check restates a writer rule the reviewer now reads (Task 3), it cites that rule by its bold lead instead and keeps its own **Concrete correction**.

**Depends on:** Task 3, which edited the sections above `## What to verify` in the same file and narrowed the reviewer's read to the writer's `## Scope`, `## The document`, `## The fix dispatch` and `## House rules`. Task 2 left those writer sections final; the bold leads CR16 and CR17 cite — **Never a census.**, **The carve-out — a claim that *is* a rule stays.** and **Never a restatement of the stack.** — are in `plugin/agents/conventions-writer.md` → `## The document` and are pinned by the probe.

**Where this task stops.** It changes only the text from the `## What to verify` heading to the end of the file. It does not touch anything above that heading, `plugin/agents/conventions-writer.md`, `plugin/commands/harness-analyze.md` or any other file under `plugin/`.

Apply the replacements below exactly, in order. Each **Old** block is an exact substring of `plugin/agents/conventions-reviewer.md` at `25e2382a` — sometimes only part of a line, sometimes several hard-wrapped lines with their indentation — and you replace exactly that substring with the **New** block, which carries its own line breaks and indentation. If an Old block is not found exactly once, change nothing more in that file and return a blocker naming the file and the replacement id.

**Frozen text in this range** stays word for word: in check (14), *"— a path that resolves only from inside the application directory is the finding,"*; the sentence *"Where the auto-loaded `CLAUDE.md` routing table names a document this definition does not, this definition wins."*; and *"or heading style — this review is factual correctness, not editing."* in `## What you do not do`.

**Anchors other files rely on**, all kept: the check numbers (1)–(15) and the ids `C1`–`C6` (`docs/development.md` Gate 8 plants findings by them and cites check (3)'s support clause); the `## The corpus pass — what to verify` heading and its subset `(3), (4), (7), (8), (9), (10), (12), (13), (14) and (15)` with the five excluded checks and their reasons (`plugin/commands/harness-analyze.md` → `(4b)` and `docs/analyze.md` → `## 12` (d) cite it); false positive (b)'s citation of the writer's `## Scope`, **Reconciling `harvested_sources` against the code**; every **Concrete correction**, which the reviewer copies into its findings; and every `## Output contract` field.

### Targets

- `plugin/agents/conventions-reviewer.md` → `## What to verify`, `## The corpus pass — what to verify`, `## What you do not do` and `## House rules`.

**Work:**

- [ ] **Checks (1)–(3) and (7).** Apply CR10–CR15.
  - CR10–CR12 drop rationale from checks (1) and (2); every value case (`none`, `n/a`) and "grade only the supplied string" stay.
  - CR13 and CR14 keep check (3)'s union rule and its exemption with its duty, and drop the reasons.
  - CR15 replaces check (7)'s copy of the probe paragraph with a pointer at the reviewer's own `<scripts_dir>` row, which keeps the paragraph and already says *"check (7) states the exemption"*.
- [ ] **Checks (9) and (13).** Apply CR16–CR18.
  - CR16 and CR17 replace check (9)'s restated census shapes, stack shapes and carve-outs with citations of the writer's three bold leads. Each sub-bullet keeps its question, its **Concrete correction**, the line that its carve-out is not (8)'s value test, and the `## Not determined` census rule.
  - CR18 trims check (13)'s closing clause to the rule.
- [ ] **The corpus pass.** Apply CR19–CR23: they drop rationale from the section lead, C2's overlap note, the `target: project` paragraph, false positive (b) and the `findings: none` paragraph. C1–C6, the disjointness rule, the subset and its five exclusions, false positives (a)–(c) and `iteration: 2` stay whole.
- [ ] **`## What you do not do` and `## House rules`.** Apply CR24–CR26. **Checks (9) and (10) are not that.** keeps one sentence saying why; **No severity band and no verdict field, on either axis.** keeps *"Their absence is the contract, not an omission."*; **Minimal prose.** keeps its rule.
- [ ] **Rule inventory, then the probe.** Confirm each of these still has a home, restoring anything missing in its shortest form: every check (1)–(15) with every exemption and correction; C1–C6 with each correction; disjointness and its two exceptions; the `project` subset and its five exclusions; false positives (a)–(c); `findings: none` as a complete answer; `iteration: 2`; every `## What you do not do` rule; both return shapes. Then run `bash scripts/scratch-run.sh harness-runs/scratch/conventions_family_check.mjs plugin/agents/conventions-reviewer.md` as one plain foreground command.

### Replacements

**CR10** — `plugin/agents/conventions-reviewer.md`: delete this text (the Old block begins with one space, which is part of it):

```text
 A finding raised in that case on a missing prompt list, a missing removed marker or an unreplaced example is a finding against a contract the document was never given.
```

**CR11** — `plugin/agents/conventions-reviewer.md`: delete this text (the Old block begins with one space, which is part of it):

```text
 Its silent loss is the highest-value catch here: the shipped agents read those contracts off this document.
```

**CR12** — `plugin/agents/conventions-reviewer.md`: replace (the Old block begins with one space, which is part of it)

```text
 You grade **only** the supplied string: what you cannot see you do not grade, and the writer's report of that string is checked at the hand-run fixture gate, not here.
```

with (the New block begins with one space, which is part of it)

```text
 You grade **only** the supplied string.
```

**CR13** — `plugin/agents/conventions-reviewer.md`: replace (the Old block begins with one space, which is part of it)

```text
 The union is deliberate: a rule about intent the code can neither corroborate nor contradict — a prohibition, a security rule, a policy — is **required** to be carried over attributed to the adopter's own prose, and that prose is harvested repo-wide, so its path routinely sits outside this document's `scope`. That citation is correct behaviour, not a finding. Provenance pointing at **neither** set is the finding.
```

with (the New block begins with one space, which is part of it)

```text
 A rule carried over attributed to harvested prose outside `scope` is correct behaviour, as the writer's `## Scope` requires; provenance pointing at **neither** set is the finding.
```

**CR14** — `plugin/agents/conventions-reviewer.md`: replace (the Old block begins with one space, which is part of it)

```text
 Those are harness facts the policy must exempt, not adopter rules, so a provenance naming them is correct behaviour there and nowhere else.
```

with (the New block begins with one space, which is part of it)

```text
 A provenance naming them is correct there and nowhere else.
```

**CR15** — `plugin/agents/conventions-reviewer.md`: replace

```text
describes this package, not the adopter. **One probe is not evidence gathering:** the commit-message policy's fixed-form-subject derivation reads the plugin's own tree and `<scripts_dir>` for the subject strings the flow emits — a harness fact the policy must exempt, not an adopter rule inferred from a generated script. It reads subjects and nothing else, and no other rule may be derived from that directory.
```

with

```text
describes this package, not the adopter. The commit-subject probe the `<scripts_dir>` row describes is exempt.
```

**CR16** — `plugin/agents/conventions-reviewer.md`: replace

```text
A sentence a new site, export, file or `catch` would falsify is a finding. The shapes: a count of sites, exports, files or branches; an enumeration of a module's exports; a file table listing a module's current members; a "the N … today" formulation; a "holds only …" formulation over a directory's present contents; a uniqueness or absence claim about the present code ("the only", "the one", "there is no", "none", "not yet", "no … exists yet"); a count of the differences between two shapes. **Concrete correction: delete the sentence, or restate it as the rule it stood in for.** The carve-out is the writer's own, and it is **not** (8)'s value-vs-coordinate test — which keeps a census: a number that *is* a rule stays (a threshold, a limit, a required bound). **And a uniqueness claim that is a rule: a monopoly or single-owner constraint the code must keep true — "`X` is the only file that …", "there is no `Y` and adding one is a decision to state".** Same test decides both: a statement that *measures* the present code goes, a statement *correct new code must satisfy* stays. A uniqueness claim no rule forbids a second instance of — "the only shape that crosses a serialization boundary", "the only key in the project" — is a measurement and goes.
```

with

```text
A sentence a new site, export, file or `catch` would falsify is a finding: the shapes and the rule carve-out are the writer's `## The document` → **Never a census.** and **The carve-out — a claim that *is* a rule stays.**, applied as written. **Concrete correction: delete the sentence, or restate it as the rule it stood in for.** That carve-out is **not** (8)'s value-vs-coordinate test, which keeps a census.
```

**CR17** — `plugin/agents/conventions-reviewer.md`: replace

```text
A sentence that would be decides nothing and is a finding, whether or not it survives new code — a naming or visibility convention the language itself imposes, a formatter- or linter-enforced style (quoting, indentation, trailing commas), a framework's own required structure. **Concrete correction: delete the sentence, or restate it as the choice this project made among the alternatives the stack allows.** **Its carve-out — a choice among the alternatives the stack allows is a rule and stays:** one of two idioms the language offers, a linter rule this project turned on, a framework option this project settled. Could a correct project of this stack do otherwise? If it could, this project's answer is a rule and firing on it is the wrong finding.
```

with

```text
A sentence that would be decides nothing and is a finding, whether or not it survives new code: the shapes and the carve-out are the writer's `## The document` → **Never a restatement of the stack.**, applied as written, and firing on a choice that carve-out keeps is the wrong finding. **Concrete correction: delete the sentence, or restate it as the choice this project made among the alternatives the stack allows.**
```

**CR18** — `plugin/agents/conventions-reviewer.md`: replace (the Old block begins with one space, which is part of it)

```text
 This carve-out admits the list without bounding it; check (3)'s closure is what bounds it, so the two do not contradict each other.
```

with (the New block begins with one space, which is part of it)

```text
 This carve-out admits the list; check (3)'s closure bounds it.
```

**CR19** — `plugin/agents/conventions-reviewer.md`: delete this text (the Old block begins with one space, which is part of it):

```text
 No single-document pass reaches it — a reviewer reading one document has nothing to compare it against.
```

**CR20** — `plugin/agents/conventions-reviewer.md`: replace

```text
, admitted here because its subject is the agent fleet rather than the member — a name correct when that member was written goes wrong when the fleet changes, and no document pass re-reads a member afterwards. Disjointness below does not bar it.
```

with

```text
; disjointness below does not bar it.
```

**CR21** — `plugin/agents/conventions-reviewer.md`: replace (the Old block begins with one space, which is part of it)

```text
 **Which** of those two the dispatching session actually composed is the caller's to know and not yours — it classifies them per section, with `skip` available on each — so grade both and return the finding either way: the caller disposes of one landing in a section it did not write, the same split `## Output contract` states for a finding whose correction lands in a `role: context` member. The generated remainder — the routing table, the ledger-path block, the agent-authoring section, the `## Where a change request runs` section — is `init`'s output rather than this run's, and a finding against it names a line nobody in this run may change.
```

with (the New block begins with one space, which is part of it)

```text
 Grade both, whichever of them the session composed, and return every finding: the caller disposes of one landing in a section it did not write.
```

**CR22** — `plugin/agents/conventions-reviewer.md`: replace

```text
, and a shape exemption would make the corpus's enforceability depend on its provenance.
```

with

```text
.
```

**CR23** — `plugin/agents/conventions-reviewer.md`: replace (the Old block begins with one space, which is part of it)

```text
 These checks fire on a defect visible **between** members; their absence is the expected result on a corpus whose document passes did their job, and you are graded on it — the hand-run gate (`docs/development.md` §5 Gate 8) requires zero findings over a known-good corpus.
```

with (the New block begins with one space, which is part of it)

```text
 These checks fire only on a defect visible **between** members.
```

**CR24** — `plugin/agents/conventions-reviewer.md`: replace (the Old block begins with one space, which is part of it)

```text
 Each names the reader who reaches the wrong answer: an implementer or a downstream reviewer grades work against whatever this document states, so an invented intent becomes the standard the flow enforces and a census becomes a refusal to accept correct new code.
```

with (the New block begins with one space, which is part of it)

```text
 An implementer is graded against whatever this document states, so an invented intent or a census is a factual defect.
```

**CR25** — `plugin/agents/conventions-reviewer.md`: delete this text (the Old block begins with one space, which is part of it):

```text
 Nothing downstream branches on either: the writer decides each finding on its merit and no orchestrator adjudicates. A verdict would imply a gate that does not exist.
```

**CR26** — `plugin/agents/conventions-reviewer.md`: replace

```text
State the rule, not the argument for it — this file is a system prompt paid on every dispatch.
```

with

```text
State the rule, not the argument for it.
```

**Verification:**

- The probe run prints negative `delta`s on its `WORDS plugin/agents/conventions-reviewer.md` and `UPFRONT plugin/agents/conventions-reviewer.md` lines, and its last line is `PASS`.
- `git grep -n -F -e 'highest-value catch' -e 'nothing to compare it against' -e 'a shape exemption would make' -e 'a "holds only …" formulation' -- plugin/agents/conventions-reviewer.md` prints nothing.
- `git grep -n -F -e '→ **Never a census.**' -e '→ **Never a restatement of the stack.**' -- plugin/agents/conventions-reviewer.md` hits both strings, and every hit sits in check (9).
