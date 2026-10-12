### Task 4 — Thin `architecture-reviewer`'s own `## Read first` bullet, sub-case (c) step, `## What to check` and justification rule

**Goal:** Cut the prose only `plugin/agents/architecture-reviewer.md` carries to direct rules stated once:
- the lessons-ledger bullet;
- the `## Process` sub-case (c) bullet;
- the `## What to check` lead paragraphs and checks;
- the `**Verify justifications …**` paragraph.

The following stay exactly as they are:
- every check's bold lead and `(Source: …)` citation;
- the adopter-fill slots;
- the `**Must Fix with no exceptions**` rule;
- the machine-path Must Fix and its citation of `test-fix-plan-writer`.

**Depends on:** Task 1, which rewrites `## Process` step 2's sub-case (b) bullet to open `the same read over the fix-plan index`. This task's R2 phrases sub-case (c) the same way (`the same read over the test fix plan index`), so the three sub-case bullets read as one rule. Task 1 also wrote `harness-runs/scratch/plan_diff_gates_family_check.mjs`, which this task runs.

**Where this task stops.** It edits `plugin/agents/architecture-reviewer.md` only, and in it only:
- the `<state_dir>/lessons.md` bullet of `## Read first`;
- the `**Plan-review mode, sub-case (c):**` bullet of `## Process` step 2;
- the two lead paragraphs under `## What to check (the architecture checks)`;
- the nine check bullets from `**Layer placement.**` to `**Logging placement.**`;
- the `**Verify justifications — do NOT rubber-stamp a claimed exception.**` paragraph.

It does not touch:
- the other `## Read first` bullets or the unreadable-input paragraph;
- the `**No plan asks for a test run.**` check;
- `## Scope boundary`, which is Task 3's;
- `plugin/agents/business-parity-reviewer.md`, which is Tasks 5 and 6's.

Apply the replacements below exactly. Each **Old** block is an exact substring of the file at `6307573a`, sometimes only part of a line, leading spaces included. Replace exactly that substring. If an Old block is not found exactly once, change nothing more and return a blocker naming the R-number.

**Frozen text in or next to this range** stays word for word. It occurs in agent definitions outside this family, and a one-copy edit forks it:
- the whole `## Read first` conventions-document, docs-root and docs-retrieval bullets, and the run `- `<state_dir>/lessons.md` — the recurring-escape` that opens the lessons bullet;
- in the `**No plan asks for a test run.**` check, the run `asks for a test run the rule forbids — the configured test command, a gate script, or a test file the`;
- in the justification paragraph, the run `no numbered points), or a justification buried in a doc comment rather than declared at the entry`. It sits inside the sentence opening `A fabricated, miscited or non-existent authorization`, which stays whole.

Every bold lead in range stays, including `**Plan-review mode, sub-case (c):**`, which `business-parity-reviewer` does not carry.

**Wire this task keeps:**
- `${CLAUDE_PLUGIN_ROOT}/agents/test-fix-plan-writer.md` → `## Process` → **Rewrite machine paths before quoting.**, in both `## Read first` and the sub-case (c) bullet;
- `<home>/…`;
- `*replace with your project's rule*`, wherever a check carries it;
- `**Must Fix with no exceptions**`;
- every check's `(Source: …)` parenthetical.

### Targets

- `plugin/agents/architecture-reviewer.md` → the parts named above.

**Work:**

- [ ] **`## Read first` and the sub-case (c) step.** Apply R1–R2.
  - The lessons bullet keeps its order rule: check layer-ownership entries first. It drops the history behind that rule.
  - The sub-case (c) bullet keeps:
    - the read of the index, every finding and the log;
    - both path rewrites;
    - the Must Fix on a quoted absolute checkout-root or home-directory path;
    - the `test-fix-plan-writer` citation.
  - It drops "Judge … as in (b)" and the commit rationale.
- [ ] **`## What to check` leads.** Apply R3–R4.
  - The first paragraph opens `Verify each check below.` and keeps:
    - `**Never flag something no rule-source file says.**`;
    - the described-versus-actual split;
    - "A violation is a **Must Fix** unless noted."
  - The adopter-fill paragraph keeps the rule — take the rule from the cited conventions document, never invent one — and drops the shape/content explanation.
- [ ] **The nine checks.** Apply R5–R13.
  - Each check's text becomes the property to verify. The first paragraph's `Verify each check below.` carries the verb.
  - Every condition and every `(Source: …)` stays.
  - The accompanying-set check keeps its second sentence, with **Must Fix with no exceptions** and one finding per missing item, unchanged.
- [ ] **The justification rule.** Apply R14–R15.
  - Keep the bold lead and "no carve-out", and keep the open-the-cited-source instruction with its three authorization kinds. Keep the fabricated-authorization sentence whole.
  - The closing rationale sentence becomes one instruction: judge where the added code puts the logic, hunk by hunk, never the comment above it.
- [ ] **Rule inventory before saving.** Read the old and new text side by side and confirm each of these still has a home. Restore anything missing in its shortest form.
  - **Read first:** check the ledger's layer-ownership entries first.
  - **Sub-case (c):**
    - read the whole fix plan and the log;
    - quote log text with `<repo_root>` paths made repo-relative and other home paths as `<home>/…`;
    - a quoted absolute checkout-root or home path in the plan is a Must Fix, with its citation.
  - **Checks:**
    - never flag without a rule source;
    - described placement in plan-review mode, actual files in implemented-solution mode;
    - Must Fix unless noted;
    - adopter-fill slots come from the cited document, never invented.
  - **Each check's property:**
    - placement by kind, including the tag-path violation even when the code is correct;
    - decision logic in its owning layer;
    - import direction and neighbour only — never past it, never back up;
    - wire types, mapping placement and mandated wire types;
    - closed sets as declared types;
    - a new concept in its own file;
    - state placement and the mandated accessor;
    - the accompanying set called out or present at its path, with no exceptions for a missing test and one finding per missing item;
    - the mandated logger.
  - **Justification:**
    - no carve-out;
    - open the cited source and confirm it is real and licenses the deviation;
    - a fabricated, miscited or non-existent authorization, or a doc-comment justification, stays a Must Fix;
    - judge the code, not the comment.

### Replacements

**R1** — `plugin/agents/architecture-reviewer.md`: replace

```text
the recurring-escape ledger. Its layer-ownership entries are architecture violations that historically shipped past review, so they are the checks worth running first.
```

with

```text
the recurring-escape ledger. Check its layer-ownership entries first.
```

**R2** — `plugin/agents/architecture-reviewer.md`: replace (the Old block opens with three spaces and ends at `(source:`; the citation after it stays)

```text
   - **Plan-review mode, sub-case (c):** read the test fix plan index (`story_path`), **every** `finding_<N>.md` in `task_files_dir`, and the log at `prompt_path`. Judge the planned placement of each fix as in (b). Any log text you quote in your findings is quoted **with machine paths rewritten** — an absolute path under `<repo_root>` to its repo-relative form, any other home-directory path to `<home>/…` — because your findings are committed and a tracked file naming the home directory fails the next gate run. A quoted absolute checkout-root or home-directory path in the test fix plan index or any `finding_<N>.md` is a **Must Fix** for the same reason (source:
```

with

```text
   - **Plan-review mode, sub-case (c):** the same read over the test fix plan index (`story_path`) and **every** `finding_<N>.md` in `task_files_dir`, plus the log at `prompt_path`. Quote log text in your findings **with machine paths rewritten** — an absolute path under `<repo_root>` to its repo-relative form, any other home-directory path to `<home>/…`. A quoted absolute checkout-root or home-directory path in the test fix plan index or any `finding_<N>.md` is a **Must Fix** (source:
```

**R3** — `plugin/agents/architecture-reviewer.md`: replace

```text
Each check names what it verifies and cites its rule source. **Never flag something no rule-source file says.** In **plan-review mode** you judge the *described* placement and flow; in **implemented-solution mode** you judge the *actual* files in the diff.
```

with

```text
Verify each check below. **Never flag something no rule-source file says.** In **plan-review mode** you judge the *described* placement and flow; in **implemented-solution mode**, the *actual* files in the diff.
```

**R4** — `plugin/agents/architecture-reviewer.md`: replace

```text
Where a check says *replace with your project's rule*, the content is the adopter's to state in the conventions document the check cites — this file supplies the check's shape, never its content, and never a rule of its own invention.
```

with

```text
Where a check says *replace with your project's rule*, the rule is the one the conventions document the check cites states; never invent one.
```

**R5** — `plugin/agents/architecture-reviewer.md`: replace

```text
- **Layer placement.** Verify each new file lands inside the `layers[].path` of the layer its kind belongs to, named the way that layer's document requires. A change landing outside the `layers[].path` of the layer its `_(layer: …)_` tag names is a placement violation even when the code itself is correct.
```

with

```text
- **Layer placement.** Each new file lands inside the `layers[].path` of the layer its kind belongs to, named as that layer's document requires; a change outside the `layers[].path` of the layer its `_(layer: …)_` tag names is a placement violation even when the code itself is correct.
```

**R6** — `plugin/agents/architecture-reviewer.md`: replace

```text
- **Business-logic placement.** Verify each unit of decision logic sits in the layer the configured `layers[]` set gives it, rather than in a layer whose document reserves it for another
```

with

```text
- **Business-logic placement.** Each unit of decision logic sits in the layer the configured `layers[]` set gives it, never in a layer whose document reserves it for another
```

**R7** — `plugin/agents/architecture-reviewer.md`: replace

```text
- **Dependency direction.** Verify imports cross a layer boundary only in the direction the conventions documents allow, and only to the neighbour they name — no layer reaching *past* its declared neighbour, and no import running back up into a layer that is meant to depend on it.
```

with

```text
- **Dependency direction.** Imports cross a layer boundary only in the direction the conventions documents allow and only to the neighbour they name — never *past* that neighbour, and never back up into a layer meant to depend on it.
```

**R8** — `plugin/agents/architecture-reviewer.md`: replace

```text
- **Wire surface and mapping placement.** Verify the types that carry data across the project's external boundary stay inside the layer that owns that boundary, that the mapping between them and the shapes the layers above consume happens where the conventions documents put it, and that signatures on that boundary use the wire-surface types those documents mandate (`<convention_symbols>`)
```

with

```text
- **Wire surface and mapping placement.** The types that carry data across the project's external boundary stay in the layer that owns that boundary, their mapping to the shapes the layers above consume happens where the conventions documents put it, and signatures on that boundary use the mandated wire-surface types (`<convention_symbols>`)
```

**R9** — `plugin/agents/architecture-reviewer.md`: replace

```text
- **Closed value sets.** Verify a closed set of values is a real declared type, in the layer its conventions document places such types in, rather than an open primitive at each point of use.
```

with

```text
- **Closed value sets.** A closed set of values is a declared type, in the layer its conventions document places such types in, never an open primitive at each point of use.
```

**R10** — `plugin/agents/architecture-reviewer.md`: replace

```text
- **New responsibility → new owner file.** Verify a new concept gets its own file under the folder its layer's document assigns it, rather than being inlined into its first caller.
```

with

```text
- **New responsibility → new owner file.** A new concept gets its own file under the folder its layer's document assigns it, never inlined into its first caller.
```

**R11** — `plugin/agents/architecture-reviewer.md`: replace

```text
- **State placement.** Verify unit-local state and application-level state each sit where the conventions documents put them, and that writes to the application-level store go through the mandated accessor rather than around it (`<convention_symbols>`)
```

with

```text
- **State placement.** Unit-local and application-level state each sit where the conventions documents put them, and writes to the application-level store go through the mandated accessor (`<convention_symbols>`), never around it
```

**R12** — `plugin/agents/architecture-reviewer.md`: replace

```text
- **Accompanying-set placement.** Verify every item a conventions document requires to *accompany* a change — a test for a new unit of behaviour, a registry entry, a localization entry — is present and placed at the path that document states (called out in the plan in plan-review mode; present in the diff in implemented-solution mode).
```

with

```text
- **Accompanying-set placement.** Every item a conventions document requires to *accompany* a change — a test for a new unit of behaviour, a registry entry, a localization entry — is called out in the plan (plan-review mode) or present in the diff (implemented-solution mode), at the path that document states.
```

**R13** — `plugin/agents/architecture-reviewer.md`: replace

```text
- **Logging placement.** Verify error paths go through the mandated logger
```

with

```text
- **Logging placement.** Error paths go through the mandated logger
```

**R14** — `plugin/agents/architecture-reviewer.md`: replace

```text
None of the architecture checks above carries an "intentional exception" carve-out, so when a plan note or an inline code comment justifies
```

with

```text
No check above has an "intentional exception" carve-out. When a plan note or an inline code comment justifies
```

**R15** — `plugin/agents/architecture-reviewer.md`: replace (the Old block opens with one space)

```text
 Reading the actual added code hunk-by-hunk (`## Process` step 2, implemented-solution mode) — never trusting the comment above it — is what reveals the gap between what a comment *claims* ("the decision logic stays in the layer that owns it") and where the logic actually sits.
```

with

```text
 Judge where the added code actually puts the logic, hunk by hunk, never the comment above it.
```

**Verification:**

- Run `bash scripts/scratch-run.sh harness-runs/scratch/plan_diff_gates_family_check.mjs plugin/agents/architecture-reviewer.md` as one plain foreground command. Its last line is `PASS`, and it prints no `FROZEN`, `LEAD`, `PAIR-LEAD`, `LITERAL`, `READS-CHANGED`, `OTHER-AGENT-CHANGED` or `WORDS-NOT-LOWER` line.
- The wire survives. Run `git grep -c -F -e '<literal>' -- plugin/agents/architecture-reviewer.md` once per literal below; each prints a count of at least 1:
  - `**Rewrite machine paths before quoting.**` — and `git grep -n` with the same literal shows it on both the `## Read first` bullet and the sub-case (c) bullet
  - `<home>/…`
  - `**Must Fix with no exceptions**`
  - `*replace with your project's rule*`
  - `(Source: that layer's `layers[].conventions` document, via `<layer_path_map>`.)`
  - `(Source: the `layers[].conventions` documents on either side of the boundary.)`
  - `(Source: the boundary-owning layer's `layers[].conventions` document.)`
  - `**Never flag something no rule-source file says.**`
  - `**open the cited source and confirm the citation is real and actually licenses the deviation.**`
- The cross-family texts keep their file sets:
  - Run `git grep -l -F -e '<string>' -- plugin/agents` and the same command against `6307573a` (`git grep -l -F -e '<string>' 6307573a -- plugin/agents`). Compare the two lists with the `6307573a:` prefix removed; they must match.
  - Do this for each string: `or a justification buried in a doc comment rather than declared at the entry`, `asks for a test run the rule forbids — the configured test command, a gate script, or a test file the`, `the recurring-escape ledger.`.
- `git diff --name-only` lists `plugin/agents/architecture-reviewer.md` as this task's only change. `git diff -- plugin/agents/architecture-reviewer.md` shows hunks only in the lessons bullet, the sub-case (c) bullet, `## What to check`'s first two paragraphs and nine checks, and the justification paragraph.
- `wc -w plugin/agents/architecture-reviewer.md`, run before the first edit and again after the last, is lower the second time.
