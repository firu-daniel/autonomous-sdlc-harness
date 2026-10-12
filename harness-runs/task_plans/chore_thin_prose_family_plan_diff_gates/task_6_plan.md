### Task 6 — Thin `business-parity-reviewer`'s checks (i)–(j), exclusion basis, obvious-reference-bug exception and dead-code carve-out

**Goal:** Cut the rest of `plugin/agents/business-parity-reviewer.md`'s grading standard to direct rules stated once:
- checks (i) and (j);
- the `**Verify the exclusion basis …**` sub-bullet;
- the `**Obvious-reference-bug exception …**` paragraph, both legs and the outcome paragraph;
- the `**Dead-code carve-out for check (j) (do NOT flag).**` paragraph.

Every grade stays as it is. That covers the three outcomes of the exception and both legs' Must Fix cases, the deferred-work marker literal, the precedent-grep scope and every frozen run.

**Depends on:** Task 5, which rewrites the `## What to check` lead paragraph to say checks **(e)–(g)** and **(i)–(j)** *"are parity doctrine and state their own rule"*. That lets this task drop the `(Source: … the rule is stated in this check.)` parentheticals of (i) and (j). Task 5's step 3 also keeps the whole-method read that R3's exclusion-basis sentence points back to. Task 1 wrote `harness-runs/scratch/plan_diff_gates_family_check.mjs`, which this task runs.

**Where this task stops.** It edits `plugin/agents/business-parity-reviewer.md` only, and in it only:
- the bullets `**(i) The whole business flow, not only scattered lines.**` and `**(j) Missing whole behaviour.**`;
- the sub-bullet `**Verify the exclusion basis — never accept the citation on its face.**`;
- the paragraph opening `**Obvious-reference-bug exception`;
- the `**Leg 1 …**` and `**Leg 2 …**` bullets;
- the paragraph opening `If the claim survives both legs`;
- the paragraph opening `**Dead-code carve-out for check (j) (do NOT flag).**`.

It does not touch:
- the `**No plan asks for a test run.**` check;
- the sentence opening `Grep the `layers[].path` scopes of `<layer_path_map>`` in Leg 2, which is frozen;
- `## Scope boundary`, which is Task 3's;
- `plugin/agents/architecture-reviewer.md`.

Apply the replacements below exactly. Each **Old** block is an exact substring of the file at `6307573a`, sometimes only part of a line. Replace exactly that substring. If an Old block is not found exactly once, change nothing more and return a blocker naming the R-number.

**Frozen text in or next to this range** stays word for word. It occurs in agent definitions outside this family, and a one-copy edit forks it:
- in check (j), the run `entry-point deferred-work marker (`// TODO: @claude add a follow up task for this: …`, in the project's own comment`;
- in the exclusion-basis sub-bullet, the run `**open the cited file and confirm the citation is real and says what is`;
- in Leg 1, the run `value not reverted on the *failure* path) while the rest is intended`;
- Leg 2's bold lead, whose run `no established precedent in this project already sets a different` is shared;
- Leg 2's sentence from `Grep the `layers[].path` scopes of `<layer_path_map>`, resolved against `<repo_root>`` to `for a sibling implementation of the`;
- in the `**No plan asks for a test run.**` check, the run `asks for a test run the rule forbids — the configured test command, a gate script, or a test file the` and the sentence `Naming the unit's own new or edited test file is not a finding.`

These bold leads stay:
- `**(i) The whole business flow, not only scattered lines.**` and `**(j) Missing whole behaviour.**`;
- `**Verify the exclusion basis — never accept the citation on its face.**` and `**Obvious-reference-bug exception — verify before accepting, do NOT rubber-stamp the label.**`;
- `**Leg 1 — the cited reference behaviour is wholly a bug, not partly intended.**` and `**Leg 2 — no established precedent in this project already sets a different convention.**`;
- `**Dead-code carve-out for check (j) (do NOT flag).**`.

**Wire this task keeps:**
- `// TODO: @claude add a follow up task for this: …`;
- `` `## Process` step 3 ``;
- the quoted Should Fix text `"either match `<reference_impl>` or record the intentional divergence"`;
- `BOTH legs`, `(path: ".")` and `**except** the catch-all`.

### Targets

- `plugin/agents/business-parity-reviewer.md` → the parts named above.

**Work:**

- [ ] **Checks (i)–(j) and the exclusion basis.** Apply R1–R3.
  - Check (i) states the end-to-end property once. Its restatement and its source parenthetical go.
  - Check (j) keeps:
    - the plan and diff cases with each mode's test;
    - both missing bases — no cited prompt line, no entry-point marker;
    - the marker literal in the project's own comment syntax;
    - **Must Fix**, and "parity is the default and there are no silent omissions".
  - Check (j) loses the grade comparison, the "both modes" restatement and its source parenthetical.
  - The exclusion-basis sub-bullet keeps:
    - "open the cited file and confirm the citation is real and says what is claimed", with its three tests;
    - the fabricated-authorization example, plus the doc-comment note, as the unjustified cases, each a **Must Fix**;
    - the whole-method read as what surfaces the omission, with both examples and the constant-by-constant point.
- [ ] **The obvious-reference-bug exception, both legs and the outcome.** Apply R4–R7.
  - The exception paragraph keeps:
    - the three bug examples;
    - the recording rule with its footer example;
    - "correct, not a parity deviation";
    - the three claim labels and three claim locations;
    - "untrusted until you verify it" and "BOTH legs".
  - Leg 1 keeps "only the buggy slice", and dropping the intended part stays a **Must Fix**; the closing restatement goes.
  - Leg 2 keeps "match `<reference_impl>` **and** that precedent", and matching **neither** stays a **Must Fix**, not a refinement.
  - The outcome paragraph keeps all three outcomes: do NOT flag, Should Fix with its quoted text, and **Must Fix** however thoroughly documented.
- [ ] **The dead-code carve-out.** Apply R8. It keeps three rules: dead or commented-out reference code is not a behaviour to port, its absence is correct parity, and it is not a missing whole behaviour. The "no silent omissions" restatement goes, because check (j) carries it.
- [ ] **Rule inventory before saving.** Read the old and new text side by side and confirm each item in the three bullets above still has a home. Restore anything missing in its shortest form.

### Replacements

**R1** — `plugin/agents/business-parity-reviewer.md`: replace

```text
- **(i) The whole business flow, not only scattered lines.** Verify the end-to-end sequence of decisions / calls / writes reproduces the reference's behaviour, not just isolated constants and field names. Check the business flow itself, not only small, isolated, scattered code. (Source: the conventions documents `<layer_path_map>` names; the rule is stated in this check.)
```

with

```text
- **(i) The whole business flow, not only scattered lines.** The end-to-end sequence of decisions, calls and writes reproduces the reference's behaviour, not just isolated constants and field names.
```

**R2** — `plugin/agents/business-parity-reviewer.md`: replace

```text
- **(j) Missing whole behaviour.** A `<reference_impl>` behaviour present in the ported source file(s) but absent — from the **plan** in plan-review mode (no detail file covers it) or from the **diff** in implemented-solution mode (the code does not implement it) — with no explicit-prompt-exclusion basis (no cited prompt line) and no entry-point deferred-work marker (`// TODO: @claude add a follow up task for this: …`, in the project's own comment syntax), is a **Must Fix** parity finding: parity is the default and there are no silent omissions, so a missing whole behaviour is a parity deviation of the same grade as a wrong field or predicate. Applies in **both modes**, consistent with the "described/cited parity vs. actual files in the diff" framing above. (Source: the conventions documents `<layer_path_map>` names; the rule is stated in this check.)
```

with

```text
- **(j) Missing whole behaviour.** A `<reference_impl>` behaviour in the ported source file(s) that the **plan** (plan-review mode: no detail file covers it) or the **diff** (implemented-solution mode: the code does not implement it) leaves out, with no explicit-prompt-exclusion basis (no cited prompt line) and no entry-point deferred-work marker (`// TODO: @claude add a follow up task for this: …`, in the project's own comment syntax), is a **Must Fix**: parity is the default and there are no silent omissions.
```

**R3** — `plugin/agents/business-parity-reviewer.md`: replace (inside the exclusion-basis sub-bullet; the Old block ends at `a sibling branch`, and the rest of that sentence stays)

```text
When an omission is justified by a cited prompt-exclusion line or a deferred-work marker, **open the cited file and confirm the citation is real and says what is claimed** — the prompt actually contains that exclusion, the named "point N" exists, the marker is at the entry point. A fabricated, miscited or non-existent authorization (for example, code citing "prompt point 6" when the prompt is two sentences with no numbered points) does **not** satisfy the exclusion basis, and a note buried in a doc comment is **not** a valid entry-point marker. In either case the omission is unjustified → **Must Fix**. The same "read the entire reference method" discipline from `## Process` step 3 is what surfaces these omissions in the first place: a sibling branch
```

with

```text
When a cited prompt-exclusion line or deferred-work marker justifies an omission, **open the cited file and confirm the citation is real and says what is claimed** — the exclusion is in the prompt, the named "point N" exists, the marker is at the entry point. A fabricated, miscited or non-existent authorization (for example, code citing "prompt point 6" when the prompt is two sentences with no numbered points), or a note buried in a doc comment instead of an entry-point marker, leaves the omission unjustified: **Must Fix**. The whole-method read of `## Process` step 3 is what surfaces these omissions: a sibling branch
```

**R4** — `plugin/agents/business-parity-reviewer.md`: replace (the paragraph's text after its bold lead)

```text
When the project intentionally implements the *correct* behaviour for an obvious bug in `<reference_impl>` (a missing case in a switch, a string typo, an off-by-one) and records that decision the way the conventions documents require — typically a one-line footer in the plan or review file and in the commit message — that is **correct, not a parity deviation**; do NOT flag it as a Must Fix. But a "do-not-port-the-bug" / "deliberate refinement" / "intentional divergence" claim — whether in a footer, a plan note or an inline code comment — is **untrusted until you verify it.** Treat every such claim as a finding to disprove, and accept it only if BOTH legs hold:
```

with

```text
Implementing the *correct* behaviour for an obvious bug in `<reference_impl>` (a missing case in a switch, a string typo, an off-by-one), recorded the way the conventions documents require — typically a one-line footer in the plan or review file and in the commit message — is **correct, not a parity deviation**. But a "do-not-port-the-bug" / "deliberate refinement" / "intentional divergence" claim — in a footer, a plan note or an inline code comment — is **untrusted until you verify it**: accept it only if BOTH legs hold:
```

**R5** — `plugin/agents/business-parity-reviewer.md`: replace (the end of Leg 1)

```text
the exception licenses fixing **only** the buggy slice. Dropping the intended part too is a **Must Fix** parity deviation — the project threw out behaviour the reference intends in order to fix a narrower bug.
```

with

```text
the exception licenses fixing **only** the buggy slice; dropping the intended part too is a **Must Fix**.
```

**R6** — `plugin/agents/business-parity-reviewer.md`: replace (the end of Leg 2)

```text
If one exists, the correct target is *that* convention — match `<reference_impl>` **and** the precedent. An implementation matching **neither** the reference nor the existing precedent is a **Must Fix**, not a refinement.
```

with

```text
If one exists, match `<reference_impl>` **and** that precedent; an implementation matching **neither** is a **Must Fix**, not a refinement.
```

**R7** — `plugin/agents/business-parity-reviewer.md`: replace

```text
If the claim survives both legs **and** is documented as the conventions documents require, it is correct — do NOT flag. If it survives both legs but is undocumented, it is a Should Fix ("either match `<reference_impl>` or record the intentional divergence"). If it fails **either** leg, it is a **Must Fix** regardless of how thoroughly it is documented — a footer does not legitimise dropping intended reference behaviour or inventing a third behaviour the codebase does not otherwise use.
```

with

```text
Both legs hold **and** the claim is documented as the conventions documents require: correct — do NOT flag. Both legs hold but it is undocumented: a Should Fix ("either match `<reference_impl>` or record the intentional divergence"). **Either** leg fails: a **Must Fix**, however thoroughly it is documented.
```

**R8** — `plugin/agents/business-parity-reviewer.md`: replace (the paragraph's text after its bold lead)

```text
Commented-out or otherwise dead code in `<reference_impl>` is not a behaviour to port, so its absence from the plan or the diff is correct parity and must not be flagged as a missing whole behaviour. Parity is the default and there are no silent omissions — but a behaviour the reference itself never executes is not an omission.
```

with

```text
Commented-out or otherwise dead code in `<reference_impl>` is not a behaviour to port; its absence from the plan or the diff is correct parity, not a missing whole behaviour.
```

**Verification:**

- Run `bash scripts/scratch-run.sh harness-runs/scratch/plan_diff_gates_family_check.mjs plugin/agents/business-parity-reviewer.md` as one plain foreground command. Its last line is `PASS`, and it prints no `FROZEN`, `LEAD`, `PAIR-LEAD`, `LITERAL`, `READS-CHANGED`, `OTHER-AGENT-CHANGED` or `WORDS-NOT-LOWER` line.
- The wire survives. Run `git grep -c -F -e '<literal>' -- plugin/agents/business-parity-reviewer.md` once per literal below; each prints a count of at least 1:
  - `// TODO: @claude add a follow up task for this: …`
  - `there are no silent omissions`
  - `untrusted until you verify it`
  - `BOTH legs hold`
  - `"either match `<reference_impl>` or record the intentional divergence"`
  - `**except** the catch-all (`path: "."`)`
  - `correct — do NOT flag`
  - `however thoroughly it is documented`
  - `invisible to a constant-by-constant grep`
- The cross-family texts keep their file sets:
  - Run `git grep -l -F -e '<string>' -- plugin/agents` and the same command against `6307573a` (`git grep -l -F -e '<string>' 6307573a -- plugin/agents`). Compare the two lists with the `6307573a:` prefix removed; they must match.
  - Do this for each string: `entry-point deferred-work marker (`, `**open the cited file and confirm the citation is real and says what is`, `value not reverted on the *failure* path) while the rest is intended`, `no established precedent in this project already sets a different`, `whose repo-wide scope would promote a documentation example or a test fixture to a precedent`.
- `git diff --name-only` lists `plugin/agents/business-parity-reviewer.md` as this task's only change. `git diff -- plugin/agents/business-parity-reviewer.md` shows hunks only in checks (i) and (j), the exclusion-basis sub-bullet, the exception paragraph, the two legs, the outcome paragraph and the dead-code paragraph.
- `wc -w plugin/agents/business-parity-reviewer.md`, run before the first edit and again after the last, is lower the second time.
