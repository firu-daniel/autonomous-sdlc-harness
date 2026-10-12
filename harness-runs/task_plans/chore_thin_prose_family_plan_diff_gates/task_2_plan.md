### Task 2 — Thin both definitions' intros and the `## Invocation contract` blocks they share

**Goal:** Cut the role paragraph, the read-only paragraph and `## Invocation contract` of `plugin/agents/architecture-reviewer.md` and `plugin/agents/business-parity-reviewer.md` to direct rules stated once. The shared blocks end identical in both files. Every dispatch block, every caller anchor, the mode selector, the verdict-exactness rule and the `diff_base` row stay exactly as they are.

**Depends on:** Task 1. Task 1 gives `## Process` step 2's implemented-solution bullet `from `<repo_root>`,` and the full `--stat` command. This task's R30 and R31 then cut `## Invocation contract`'s copy of that procedure to a pointer, `As `## Process` step 2 states,`. Task 1 also wrote `harness-runs/scratch/plan_diff_gates_family_check.mjs`, which this task runs.

**Where this task stops.** It owns, in both files:
- the role paragraph opening `You are the **`;
- the paragraph opening `**You report findings. You do not edit the plan, and you do not edit the code.**`;
- `## Invocation contract` from its first paragraph through the paragraph opening `Also run `git diff <diff_base>...HEAD --shortstat`.

It does not touch:
- the frontmatter, `## Resolved values`, or `business-parity-reviewer`'s phase-gate paragraph opening `**Skip this phase unless`;
- the paragraph opening ``**You create `<findings_folder>` yourself``;
- any fenced dispatch block, line for line;
- the `task_files_dir`, `findings_folder`, `iteration`, `diff_base` and `index_path` key rows;
- `architecture-reviewer`'s `- **(c) Insertion point 4 — test fix plan.**` bullet;
- anything from `## Read first` on.

Apply the replacements below exactly. Each **Old** block is an exact substring of the file at `6307573a`, sometimes only part of a line. Replace exactly that substring; a deletion takes the space or blank line its R-entry names. If an Old block is not found exactly once, change nothing more in that file and return a blocker naming the file and the R-number.

**Frozen text in or next to this range** stays word for word. It occurs in agent definitions outside this family, and a one-copy edit forks it:
- the sentences `Your `tools:` allowlist carries no `Edit`, … Do not treat it as an oversight to work around.`;
- the run `You run in one of **two modes**, and there is **no mode flag**: the caller selects the mode by`;
- in the return paragraph, the first sentence `**Your return is parsed, not read.** … and nothing else routes.` and the sentence `So the verdict line must be **exactly** one of those two strings — a reworded or decorated verdict strands the flow with no error message.`;
- in the plan-review key table, `write `<findings_folder>/review_{iteration}.md`.` and the whole `iteration` row;
- in the implemented-solution key table, `The caller supplies it; you never hardcode it.` and the whole `findings_folder` row;
- the run `review each segment **from its diff hunks with generous context** (`git diff -U15`;
- the sentence `Report that count in your index's Context paragraph as: "N run-artifact files excluded from the reviewed diff."`

These bold leads, which only the two family files carry, stay in both: `**You report findings. You do not edit the plan, and you do not edit the code.**`, `**(a) Insertion point 1 — task plan.**` and `**(b) Insertion point 3 — user-review fix plan.**`.

**Wire this task keeps:**
- the caller anchors `### 3. Architecture review (plan-review mode)`, `### 2. Business-parity review (plan-review mode)`, `→ step 8`, `→ `## Flow` step 7`, `## Phase A2` → `### A2.1 Generate the architecture review` and `## Phase A1.5` → `### A1.5.1 Generate the parity review`;
- the mode selector sentence;
- the `diff_base` row's *"use the value you are given, never a remembered default"*, which `plugin/agents/README.txt` quotes as unchanged;
- the full `--shortstat` command;
- the excluded-count line.

### Targets

- `plugin/agents/architecture-reviewer.md` → the role and read-only paragraphs and `## Invocation contract`, as bounded above.
- `plugin/agents/business-parity-reviewer.md` → the same.

**Work:**

- [ ] **Intro.** Apply R1–R4.
  - Both role paragraphs lose the "two kinds of input" framing and the separate "do not invent rules" sentence. They are restated as one review sentence ending in the citation rule, identical in both files from `You review **plan files**` to `implemented solutions** (the branch diff)`.
  - `business-parity-reviewer` loses its list of parity areas. The `description:` and `## What to check` carry that list.
  - Both read-only paragraphs lose the restated "read-only on plan files and on application code" clause.
- [ ] **Contract preamble.** Apply R5–R8.
  - Drop the mode paragraph's closing sentence: the selector already resolves every plan-review dispatch, none of which carries a `diff_base`.
  - Drop the return paragraph's middle sentence, which describes the caller's loop rather than the agent's return.
- [ ] **`### Plan-review mode`.** Apply R9–R25.
  - The intro keeps "before any code is written" and "key names are identical … only the values differ".
  - Each sub-case (a) bullet loses its wiring rationale.
  - The "You read …" lines after each block go, because `## Process` step 2 states each read.
  - Each sub-case (b) bullet keeps its anchor and its role mapping.
  - The `story_path` row becomes one identical line in both files.
  - The `prompt_path` row leads with "Where the caller supplies one". This also fixes `architecture-reviewer`'s missing comma.
  - The closing "same set of checks" paragraph goes, because `## What to check` states the plan-review judgement.
- [ ] **`### Implemented-solution mode`.** Apply R26–R33.
  - Shorten the intro sentence and the `plan_path` row.
  - Replace the `Run …` paragraph with the shared pointer at `## Process` step 2, keeping the bold generous-context run and the split-index rule.
  - In the `--shortstat` paragraph, name the `--stat` command the count complements, since it is no longer "above".
- [ ] **Rule inventory before saving.** Read the old and new text side by side and confirm each of these still has a home. Restore anything missing in its shortest form.
  - **Intro:**
    - what each reviewer checks;
    - plan files and implemented solutions as the two inputs;
    - rules already stated in the conventions documents, and for parity also the `<reference_impl>` source;
    - every finding cites its rule source, or for parity its `<reference_impl>` anchor;
    - edits neither plan nor code, and writes only its own findings files;
    - the deliberate absence of `Edit`.
  - **Contract preamble:**
    - no mode flag;
    - `task_files_dir` (or a fix-plan index) without `diff_base` means plan-review mode, and `diff_base` means implemented-solution mode;
    - the findings folder is created only with findings;
    - a clean review touches no disk;
    - exactly `verdict: PASS` or `verdict: FAIL`.
  - **Plan-review mode:**
    - judged before code exists;
    - one key set for every sub-case;
    - every dispatch block and caller anchor;
    - (b) runs before the user approves the fix plan;
    - the index and folder role mapping in (b) and (c);
    - every key row's meaning, including the `prompt_path` per sub-case and "where the caller supplies one".
  - **Implemented-solution mode:**
    - judged on the actual diff, at insertion point 2 only;
    - the block and its anchor;
    - `diff_base` is the passed value, never a remembered default;
    - `plan_path` is for context only, and its prose is not reviewed;
    - hunks with generous context, per `## Process` step 2;
    - a split index plus per-finding files, never a flat file;
    - the `--shortstat` count reported in the index's Context paragraph.

### Replacements

**R1** — `plugin/agents/architecture-reviewer.md`: replace

```text
and which direction dependencies are allowed to point. You review **two kinds of input** — **plan files** (a plan index plus its detail files, before any code exists) and **implemented solutions** (the branch diff). You judge both against rules that are **already written down** in the configured layers' conventions documents. You do **not** invent rules: every finding cites the rule-source file it comes from.
```

with

```text
and which direction dependencies may point. You review **plan files** (a plan index plus its detail files, before any code exists) and **implemented solutions** (the branch diff) against the rules the configured layers' conventions documents already state, and every finding cites the rule-source file it comes from.
```

**R2** — `plugin/agents/business-parity-reviewer.md`: replace

```text
the reference implementation this project is kept in parity with: external-call names and payload shapes, stored-document shapes / stored-data set paths / queries / serialized field names, threshold constants and gating predicates, side-effect ordering, strict-vs-loose inequalities. You review **two kinds of input** — **plan files** (a plan index plus its detail files, before any code exists) and **implemented solutions** (the branch diff). You judge both against the parity rules already written down in the configured layers' conventions documents and against the actual `<reference_impl>` source. You do **not** invent rules: every finding cites the rule-source document or the specific `<reference_impl>` source anchor it comes from.
```

with

```text
the reference implementation this project is kept in parity with. You review **plan files** (a plan index plus its detail files, before any code exists) and **implemented solutions** (the branch diff) against the parity rules the configured layers' conventions documents already state and against the actual `<reference_impl>` source, and every finding cites the rule-source document or the `<reference_impl>` source anchor it comes from.
```

**R3** — `plugin/agents/architecture-reviewer.md`: replace

```text
**You report findings. You do not edit the plan, and you do not edit the code.** You are **read-only on plan files and on application code**; the only files you write are your own findings file(s).
```

with

```text
**You report findings. You do not edit the plan, and you do not edit the code.** The only files you write are your own findings file(s).
```

**R4** — `plugin/agents/business-parity-reviewer.md`: replace

```text
**You report findings. You do not edit the plan, and you do not edit the code.** You are **read-only on plan files and on application code**; the only files you write are your own findings file(s).
```

with

```text
**You report findings. You do not edit the plan, and you do not edit the code.** The only files you write are your own findings file(s).
```

**R5** — `plugin/agents/architecture-reviewer.md`: delete this sentence, together with the one space before it. The rest of its paragraph stays.

```text
All three plan-review insertion points run in plan-review mode, because at each of them the work under review is a *plan* that has not been implemented yet.
```

**R6** — `plugin/agents/business-parity-reviewer.md`: delete this sentence, together with the one space before it. The rest of its paragraph stays.

```text
Both plan-review insertion points run in plan-review mode, because at both of them the work under review is a *plan* that has not been implemented yet.
```

**R7** — `plugin/agents/architecture-reviewer.md`: delete this sentence, together with the one space before it. The rest of its paragraph stays.

```text
A `FAIL` increments the caller's `iteration` and re-dispatches the upstream writer (plan-review mode) or opens the per-item fix loop (implemented-solution mode); at `iteration >= 5` the plan-review gates escalate.
```

**R8** — `plugin/agents/business-parity-reviewer.md`: delete this sentence, together with the one space before it. The rest of its paragraph stays.

```text
A `FAIL` increments the caller's `iteration` and re-dispatches the upstream writer (plan-review mode) or opens the per-item fix loop (implemented-solution mode); at `iteration >= 5` the plan-review gates escalate.
```

**R9** — `plugin/agents/architecture-reviewer.md`: replace

```text
You judge the *planned* architecture, before any code is written. There are **three sub-cases**, distinguished by what the caller hands you. The **key names are identical** in all three — only the values differ.
```

with

```text
You judge the *planned* architecture, before any code is written. The **key names are identical** in all three sub-cases — only the values differ.
```

**R10** — `plugin/agents/business-parity-reviewer.md`: replace

```text
You judge the *planned* / *described* parity, before any code is written. There are **two sub-cases**, distinguished by what the caller hands you. The **key names are identical** in both — only the values differ.
```

with

```text
You judge the *planned* / *described* parity, before any code is written. The **key names are identical** in both sub-cases — only the values differ.
```

**R11** — `plugin/agents/architecture-reviewer.md`: replace

```text
`### 3. Architecture review (plan-review mode)`, with the same argument names as `task-plan-reviewer` so the wiring stays consistent:
```

with

```text
`### 3. Architecture review (plan-review mode)`:
```

**R12** — `plugin/agents/business-parity-reviewer.md`: replace

```text
`### 2. Business-parity review (plan-review mode)`, with the same argument names as the architecture step so the wiring stays consistent:
```

with

```text
`### 2. Business-parity review (plan-review mode)`:
```

**R13** — `plugin/agents/architecture-reviewer.md`: delete this whole paragraph (it sits under sub-case (a)'s fenced block, indented two spaces), together with the blank line above it.

```text
  You read the story index's `## Context` plus **every** `task_<N>_plan.md` in `task_files_dir`, and judge the planned architecture.
```

**R14** — `plugin/agents/business-parity-reviewer.md`: delete this whole paragraph (it sits under sub-case (a)'s fenced block, indented two spaces), together with the blank line above it.

```text
  You read the story index's `## Context` plus **every** `task_<N>_plan.md` in `task_files_dir`, and judge the planned parity.
```

**R15** — `plugin/agents/architecture-reviewer.md`: replace

```text
→ step 8. The drafted fix plan is reviewed *before* the user approves it and before any of it is implemented, so it is reviewed as a plan: the
```

with

```text
→ step 8, before the user approves the drafted fix plan: the
```

**R16** — `plugin/agents/business-parity-reviewer.md`: replace

```text
→ `## Flow` step 7. The drafted fix plan is reviewed *before* the user approves it and before any of it is implemented, so it is reviewed as a plan: the
```

with

```text
→ `## Flow` step 7, before the user approves the drafted fix plan: the
```

**R17** — `plugin/agents/architecture-reviewer.md`: delete this whole paragraph (under sub-case (b)'s fenced block, indented two spaces), together with the blank line above it.

```text
  You read the fix-plan index plus **every** `finding_<N>.md` in `task_files_dir`, and judge the *planned* architecture of the drafted fixes: do they place or relocate files into the right layers, leave each responsibility with the layer that owns it, keep the dependency direction correct?
```

**R18** — `plugin/agents/business-parity-reviewer.md`: delete this whole paragraph (under sub-case (b)'s fenced block, indented two spaces), together with the blank line above it.

```text
  You read the fix-plan index plus **every** `finding_<N>.md` in `task_files_dir`, and judge the *planned* parity of the drafted fixes: does each cite a real `<reference_impl>` source for every constant, call name and field; do the described payloads match field-by-field; do the described predicates match the reference's boundary comparisons?
```

**R19** — `plugin/agents/architecture-reviewer.md`: delete this whole paragraph (under sub-case (c)'s fenced block, indented two spaces), together with the blank line above it.

```text
  You read the test fix plan index plus **every** `finding_<N>.md` in `task_files_dir`, and judge the *planned* placement of each fix as in (b).
```

**R20** — `plugin/agents/architecture-reviewer.md`: replace

```text
| `story_path` | The plan index — the story index in sub-case (a), the fix-plan index in sub-case (b), the test fix plan index in sub-case (c). Its `## Context` is shared by every detail file. |
```

with

```text
| `story_path` | The plan index. Its `## Context` is shared by every detail file. |
```

**R21** — `plugin/agents/business-parity-reviewer.md`: replace

```text
| `story_path` | The plan index — the story index in sub-case (a), the fix-plan index in sub-case (b). Its `## Context` is shared by every detail file. |
```

with

```text
| `story_path` | The plan index. Its `## Context` is shared by every detail file. |
```

**R22** — `plugin/agents/architecture-reviewer.md`: replace

```text
| `prompt_path` | The original prompt the plan was written from, under `<state_dir>/task_prompts/` in (a) the active user-review file under `<state_dir>/user_reviews/` in (b), and in (c) the machine-local test log the plan was written from, read as the requirement. Where the caller supplies one. |
```

with

```text
| `prompt_path` | Where the caller supplies one: the original prompt under `<state_dir>/task_prompts/` in (a), the active user-review file under `<state_dir>/user_reviews/` in (b), and in (c) the machine-local test log the plan was written from, read as the requirement. |
```

**R23** — `plugin/agents/business-parity-reviewer.md`: replace

```text
| `prompt_path` | The original prompt the plan was written from, under `<state_dir>/task_prompts/` in (a) and the active user-review file under `<state_dir>/user_reviews/` in (b). Where the caller supplies one. |
```

with

```text
| `prompt_path` | Where the caller supplies one: the original prompt under `<state_dir>/task_prompts/` in (a), the active user-review file under `<state_dir>/user_reviews/` in (b). |
```

**R24** — `plugin/agents/architecture-reviewer.md`: delete this whole paragraph, together with the blank line above it.

```text
In all three sub-cases the judgement is the same set of architecture checks, applied to the *described* placement and flow rather than to real files. No plan-review dispatch carries a `diff_base`, so the mode selector resolves all three to plan-review mode.
```

**R25** — `plugin/agents/business-parity-reviewer.md`: delete this whole paragraph, together with the blank line above it.

```text
In both sub-cases the judgement is the same set of parity checks, applied to the *described* / *cited* parity rather than to real files. Neither dispatch carries a `diff_base`, so the mode selector resolves both to plan-review mode.
```

**R26** — `plugin/agents/architecture-reviewer.md`: replace

```text
You judge the *actual* architecture of the branch diff. This mode serves insertion point 2 only —
```

with

```text
You judge the *actual* architecture of the branch diff, at insertion point 2 only —
```

**R27** — `plugin/agents/business-parity-reviewer.md`: replace

```text
You judge the *actual* parity of the branch diff. This mode serves insertion point 2 only —
```

with

```text
You judge the *actual* parity of the branch diff, at insertion point 2 only —
```

**R28** — `plugin/agents/architecture-reviewer.md`: replace

```text
| `plan_path` | The plan index, read **for context only** (to know what the diff was *trying* to do). You do not review the plan's prose in this mode. |
```

with

```text
| `plan_path` | The plan index, read **for context only** — what the diff was *trying* to do; do not review its prose. |
```

**R29** — `plugin/agents/business-parity-reviewer.md`: replace

```text
| `plan_path` | The plan index, read **for context only** (to know what the diff was *trying* to do). You do not review the plan's prose in this mode. |
```

with

```text
| `plan_path` | The plan index, read **for context only** — what the diff was *trying* to do; do not review its prose. |
```

**R30** — `plugin/agents/architecture-reviewer.md`: replace

```text
Run `git diff <diff_base>...HEAD --stat -- ':(top,exclude)<state_dir>/*<branch>*' ':(top,exclude)<state_dir>/docs_catalog/reviews/*'` from `<repo_root>`, group the changed files into feature-area segments, review each segment **from its diff hunks with generous context** (`git diff -U15 <diff_base>...HEAD -- <files>`; a targeted `Read` around a hunk only where it cannot be judged alone — never whole changed files), and judge the actual architecture of the diff against the same rule set. Then emit
```

with

```text
As `## Process` step 2 states, review each segment **from its diff hunks with generous context** (`git diff -U15 <diff_base>...HEAD -- <files>`), then emit
```

**R31** — `plugin/agents/business-parity-reviewer.md`: replace

```text
Run `git diff <diff_base>...HEAD --stat -- ':(top,exclude)<state_dir>/*<branch>*' ':(top,exclude)<state_dir>/docs_catalog/reviews/*'` from `<repo_root>`, group the changed files into feature-area segments, review each segment **from its diff hunks with generous context** (`git diff -U15 <diff_base>...HEAD -- <files>`; a targeted `Read` around a hunk only where it cannot be judged alone — never whole changed *project* files), locate the corresponding `<reference_impl>` source for every business-logic decision, and judge the actual parity of the diff against the same rule set. **The reference side is the opposite:** `## Process` step 3's read-the-entire-method discipline stands there, because an omission is invisible in the project's own diff. Then emit
```

with

```text
As `## Process` step 2 states, review each segment **from its diff hunks with generous context** (`git diff -U15 <diff_base>...HEAD -- <files>`), then emit
```

**R32** — `plugin/agents/architecture-reviewer.md`: replace

```text
— the complementary pathspecs, which count the run artifacts the command above excludes.
```

with

```text
— the complementary pathspecs, counting the run artifacts the `--stat` command excludes.
```

**R33** — `plugin/agents/business-parity-reviewer.md`: replace

```text
— the complementary pathspecs, which count the run artifacts the command above excludes.
```

with

```text
— the complementary pathspecs, counting the run artifacts the `--stat` command excludes.
```

**Verification:**

- Run `bash scripts/scratch-run.sh harness-runs/scratch/plan_diff_gates_family_check.mjs plugin/agents/architecture-reviewer.md plugin/agents/business-parity-reviewer.md` as one plain foreground command.
  - Its last line is `PASS`. It prints no `FROZEN`, `LEAD`, `PAIR-LEAD`, `LITERAL`, `READS-CHANGED`, `OTHER-AGENT-CHANGED` or `WORDS-NOT-LOWER` line.
  - It prints no `SHARED-PENDING` line for any prefix in Task 1's set or in this task's: `**You report findings.`, `You run in one of **two modes**`, `**Your return is parsed, not read.**`, `| `story_path` |`, `| `diff_base` |`, `| `plan_path` |`, `As `## Process` step 2 states,`, `Also run `git diff <diff_base>...HEAD --shortstat`.
- The wire survives. Run `git grep -c -F -e '<literal>' -- plugin/agents/architecture-reviewer.md plugin/agents/business-parity-reviewer.md` once per literal below; each run prints a count of at least 1 for both files:
  - `story_path: <state_dir>/story_plans/<branch>_story_plan.md`
  - `story_path: <fix_plan_path>`
  - `diff_base: <default_branch>`
  - `plan_path: <story_path>`
  - `iteration: 0`
  - `use the value you are given, never a remembered default`
  - `there is **no mode flag**`
  - `⇒ implemented-solution mode.**`
  - `"N run-artifact files excluded from the reviewed diff."`
  - `--shortstat -- ':(top)<state_dir>/*<branch>*' ':(top)<state_dir>/docs_catalog/reviews/*'`
- The anchors survive. `git grep -n -F -e '<anchor>'` finds each anchor in its own file:
  - in `plugin/agents/architecture-reviewer.md`: `### 3. Architecture review (plan-review mode)`, `→ step 8, before the user approves`, `### G.2 Write and review the test fix plan`, `### A2.1 Generate the architecture review`;
  - in `plugin/agents/business-parity-reviewer.md`: `### 2. Business-parity review (plan-review mode)`, `→ `## Flow` step 7`, `### A1.5.1 Generate the parity review`.
- The cross-family texts keep their file sets:
  - Run `git grep -l -F -e '<string>' -- plugin/agents` and the same command against `6307573a` (`git grep -l -F -e '<string>' 6307573a -- plugin/agents`). Compare the two lists with the `6307573a:` prefix removed; they must match.
  - Do this for each string: `the caller selects the mode by`, `So the verdict line must be **exactly** one of those two strings`, `use the value you are given, never a remembered default`, `review each segment **from its diff hunks with generous context**`, `Report that count in your index's Context paragraph as:`, `that omission is deliberate — it makes the read-only guarantee`.
- `git diff -- plugin/agents/architecture-reviewer.md plugin/agents/business-parity-reviewer.md` shows hunks only in the two intro paragraphs and in `## Invocation contract`, and no line inside a fenced dispatch block changes.
- `wc -w plugin/agents/architecture-reviewer.md plugin/agents/business-parity-reviewer.md`, run before the first edit and again after the last, is lower for each file the second time.
