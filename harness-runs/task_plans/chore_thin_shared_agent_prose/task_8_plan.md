### Task 8 — Thin the reviewers' shared grading blocks — the severity ladder, `**Guard carve-out.**` and `**Prose volume — the receiving side.**` — identically in every copy

**Goal:** Shorten the three grading blocks that the branch-review family (`branch-reviewer`, `skeptic-reviewer`, plus `review-plan-reviewer` for the carve-out) shares with the unit-loop family (`layer-reviewer`) and the task-plan family (`task-plan-reviewer`, carve-out only), writing one result per block into every copy.

**Depends on:** Task 7, which edits the `## Resolved values` and `## Invocation contract` tables of these files. This task edits only the three blocks named here.

**Where this task stops.** The bold labels `**Must Fix**`, `**Should Fix**`, `**Nice to Have**`, `**Guard carve-out.**` and `**Prose volume — the receiving side.**`, the line `**Grade every finding by consequence.**`, and `<state_dir>/lessons.md` are kept byte-for-byte. Each file's own "**Your own checklist is not downgradable.**" paragraph and every other paragraph around the blocks stay. `review-plan-reviewer.md` and `task-plan-reviewer.md` each append one sentence of their own to the carve-out ("A path or quoted text a … is about to create is not a cited pointer under this carve-out."); keep it after the new shared sentences.

Each replacement gives the **old** text and the **new** text in their own fenced blocks; match the old text exactly and replace it whole.

### Targets

- The ladder and the prose-volume paragraph — `plugin/agents/branch-reviewer.md`, `plugin/agents/layer-reviewer.md`, `plugin/agents/skeptic-reviewer.md`.
- The carve-out — those three plus `plugin/agents/review-plan-reviewer.md` and `plugin/agents/task-plan-reviewer.md`.

**Work:**

- [ ] **The severity ladder**, in its three files: the three bullets directly under `**Grade every finding by consequence.**`. Old:

```markdown
- **Must Fix** — a consumer acting on this diff would do the wrong thing: the behaviour is wrong, a required accompanying item is missing, a pointer's target does not exist, an authorization gate is absent or client-only.
- **Should Fix** — the code or claim is wrong or unclear but no consumer decision turns on it; and a line coordinate in a durable artifact — an instruction file, an agent definition, a catalog document, a standing tracked artifact under `<state_dir>`, a code comment — stale or not, or a citation in any artifact that locates its site by a line coordinate alone, repaired by replacing the coordinate with a symbol anchor.
- **Nice to Have** — style, wording, ordering; and a stale line hint beside an anchor that resolves, in a point-in-time artifact (a plan, a review, a finding, a QA report).
```

  New:

```markdown
- **Must Fix** — a consumer acting on this diff would do the wrong thing: wrong behaviour, a missing required accompanying item, a pointer whose target does not exist, an absent or client-only authorization gate.
- **Should Fix** — wrong or unclear, but no consumer decision turns on it. Also a line coordinate in a durable artifact (an instruction file, an agent definition, a catalog document, a standing tracked artifact under `<state_dir>`, a code comment), stale or not, and a citation in any artifact that locates its site by a line coordinate alone — fixed by replacing the coordinate with a symbol anchor.
- **Nice to Have** — style, wording, ordering; also a stale line hint beside a resolving anchor in a point-in-time artifact (plan, review, finding, QA report).
```

- [ ] **The carve-out**, in its five files. Old (the shared part; the two files that continue it keep their continuation after it):

```markdown
**Guard carve-out.** Pointer resolution binds a cited path, symbol, heading or quoted substring that does not resolve; a line coordinate — stale, missing or present — never binds it, and is gradable however it is enumerated, including where it is enumerated as a `<state_dir>/lessons.md` entry.
```

  New:

```markdown
**Guard carve-out.** Pointer resolution binds a cited path, symbol, heading or quoted substring that does not resolve. It never binds a line coordinate — stale, missing or present — which stays gradable however it is enumerated, a `<state_dir>/lessons.md` entry included.
```

- [ ] **The prose-volume paragraph**, in its three files. Old: the single paragraph beginning `**Prose volume — the receiving side.**` and ending "nothing here depends on that restatement.". New:

```markdown
**Prose volume — the receiving side.** This binds durable text — the definition files an agent loads, the standing tracked artifacts under `<state_dir>`, code comments — never a round's point-in-time artifacts, where detail is the product. A finding that asks for **more** prose names the reader who reaches the wrong answer without it and states that answer; one that names neither is not a finding. Prose no reader test keeps is padding: **Should Fix**, never Must Fix — except prose that also creates a second owner (a rule restated inline from a file the same agent already reads), which keeps the grade the ladder above gives it.
```

- [ ] Before saving each file, confirm each block kept every grading rule — the four Must Fix triggers, the Should Fix line-coordinate and coordinate-only-citation cases with their repair, the Nice to Have stale-hint case, the carve-out's bind and never-bind halves, and prose volume's scope, its reader test, its padding grade and its second-owner exception — and dropped only "This is a finding class, not a severity ladder — that ladder still owns the grades." (the second-owner clause already defers to the ladder), "do not raise it", and the closing harness-doctrine sentence, which no reader acts on.

**Verification:**

- The copies match: `git grep -l -F -e 'wrong or unclear, but no consumer decision turns on it. Also a line coordinate' -- plugin/agents` and `git grep -l -F -e 'except prose that also creates a second owner' -- plugin/agents` each list exactly `branch-reviewer.md`, `layer-reviewer.md` and `skeptic-reviewer.md`; `git grep -l -F -e 'It never binds a line coordinate' -- plugin/agents` lists exactly the five carve-out files.
- The old text is gone: `git grep -l -F -e 'the code or claim is wrong or unclear' -e 'never binds it, and is gradable' -e 'This is a finding class, not a severity ladder' -e 'nothing here depends on that restatement' -- plugin/agents` lists none of `branch-reviewer.md`, `layer-reviewer.md` and `skeptic-reviewer.md`. The same sentences occur in other agents' own paragraphs — `task-plan-reviewer.md` among them — which this task does not own; leave those.
- The two per-file carve-out sentences survive: `git grep -n -F -e 'is not a cited pointer under this carve-out.' -- plugin/agents` lists `review-plan-reviewer.md` and `task-plan-reviewer.md`.
- Each edited file is shorter: record `wc -w` for each before your first edit; after the edit each figure is lower.
