### Task 19 — Restate `forge` in the schema and in `ARCHITECTURE.md` now that it has a reader and a reporter

**Goal:** Update the two places that state the `forge` seam's shape: the schema property's `description`, and `ARCHITECTURE.md` → `## 7.` and `## 8. Declaring a seam before building it`. Both say in the present tense that nothing reads the key and that it has no reporter. After this branch:

- the key has a reader: `init` writes the issue-trigger workflow when it is `github` and `execution.target` is `github-actions` (Task 13), and `remote-run.sh trigger` re-reads it at run time (Task 7);
- it has a reporter: the `doctor` check `forge`, which names every state including *not set* (Task 14);
- two parts of the coupling still wait: draft-pull-request output and comment-based park-and-ask.

The prompt's *"Whatever reads `forge` must also report it … and the row must say which parts are still waiting"* is met in these documents, not only in code.

**Depends on:**

- Task 13, whose generator reads `forge` through `forgeTriggerApplies`.
- Task 14, whose `forge` check is the reporter.
- Task 7, whose trigger reads `hr_forge` at run time.

This task describes those; it adds no reader.

**Where this task stops.** The schema keeps its enum and keeps **no default**. `none` is still a decision and an absent key still reads as *not yet decided*, now named by `doctor`. The sister key `design.source` is untouched: it is still declared with no reader and no reporter, and its paragraphs keep saying so. Only their comparison to `forge` changes, because that comparison was to a state `forge` has left. `docs/config.md`'s row and `docs/development.md` → `## 6.` are Task 23's.

### Targets

- `schemas/harness.config.schema.json` — `properties.forge.description`.
- `ARCHITECTURE.md` — `## 7.`'s *No forge coupling* bullet and four `## 8.` paragraphs (scope register rows 2, 3, 5, 6, 7).

**Work:**

- [ ] **The schema description.** Rewrite *"Deliberately has no default, because nothing reads this key in this release: …"* to state that:
  - `github` with `execution.target` `github-actions` makes `init` write the issue-trigger workflow and makes that workflow start runs from labelled issues;
  - `gitlab` writes nothing in this release;
  - `none` means no forge integration at all.

  Keep the reason there is no default: an absent value must read as *not yet decided*, which `doctor`'s `forge` check reports, rather than as a silently assumed platform. Keep the first two sentences' meaning. Change no other property.
- [ ] **`ARCHITECTURE.md` → `## 7.`, the bullet *"No forge coupling."***. Restate it with the document's own `[shipped]` / `[designed]` tags. **[shipped]** The `forge` key is read by the issue trigger alone: the generator that writes `harness-trigger.yml`, and the trigger at run time. It is reported by `doctor`'s `forge` check. The seam this document describes, the engine's, is untouched by it. Keep the pointer to `docs/development.md` → `## 6.` for what remains.
- [ ] **`## 8.`, the paragraph *"`forge` — the same pattern missing one part."***. Keep its account of how the axis was declared: same naming, deliberately no default, the schema's reason. Then state, tagged **[shipped]**, that the missing part has now landed:
  - a reader that changes something observable, namely a generated workflow and a dispatch;
  - a check that names an unset value instead of passing over it: `doctor` → `forge` passes naming *not yet decided*.
  - The two remaining parts of the coupling, draft-pull-request output and comment-based park-and-ask, carry no reader, because nothing implements them.
  - **No present-tense claim may survive that Tasks 13, 14 or this task's own schema edit falsify.** The paragraph quotes the schema's words *"because nothing reads this key in this release"*, which this task's first Work item deletes from the schema; restate that quote in the past tense, as what the schema said when the axis was declared (*"the schema then gave as its reason …"*), so the quote no longer claims to match a current source. The sentence *"What is absent is the observer: `checkEnum` in the configuration check returns on an absent optional key, and `doctor` carries no check of its own"* becomes past tense too — the state before this branch — beside the new **[shipped]** reader and reporter sentences above. The *"debt of record"* sentence citing `docs/development.md` → `## 6.` keeps its quotes, marked as the verdict recorded before the trigger landed (Task 23 restates that paragraph).

  The paragraph now illustrates the rule being satisfied, where it used to illustrate it being broken. Its title may change to say so (it currently reads *"the same pattern missing one part"*); the heading `## 8.` itself does not.
- [ ] **The comparisons to `forge` in `## 8.`.**
  - The engine-seam paragraph's first sentence, *"Adding an `engine` key to `harness.config.json` today would create a third key nothing reads and no reporter names, after `forge` and this release's own `design.source` below — the `forge` outcome exactly"*, stops counting `forge` among keys nothing reads: restate it so that `design.source` is the key in that state, and `forge` was until its issue trigger landed — e.g. *"a second key nothing reads and no reporter names, after `design.source` below — the outcome `forge` had until its issue trigger landed"*. Keep the sentence's **[designed]** tag and its conclusion that the engine axis stays out of the schema.
  - *"what `qa.driver` has and `forge` does not"* (same paragraph) becomes a comparison that is true now: what `qa.driver` and, since the issue trigger, `forge` have.
  - `design.source`'s *"What is absent is the observer, exactly as with `forge`"* becomes *as `forge` was until its issue trigger landed*.
  - *"records against `forge` rather than `qa.driver`'s"* keeps its meaning for `design.source`, and says that the outcome `docs/development.md` → `## 6.` recorded against `forge` has since been paid for that key's trigger part.
  - Row 4's sentence, *"The corollary is `forge`'s"*, stays as it is: it names where the rule came from.
- [ ] **Keep the document's discipline.** Every edited sentence carries its `[shipped]` or `[designed]` tag as the surrounding ones do. No new section is added, and no heading is renamed; `ARCHITECTURE.md` → `## 8. Declaring a seam before building it` is cited by the task prompt and by `docs/development.md`.

**Verification:**

- `git grep -n -i "nothing reads this key" -- schemas/harness.config.schema.json ARCHITECTURE.md` finds only `design.source` text, which this task leaves as it is: the `design.source` property's `description` in the schema, and the `design.source` paragraph of `ARCHITECTURE.md` → `## 8.`. No hit sits in the `forge` property's `description`, in the `forge` paragraph of `## 8.` except inside a sentence marked as the state before this branch (see the `## 8.` Work item), or in the engine-seam paragraph.
- `node -e "JSON.parse(require('fs').readFileSync('schemas/harness.config.schema.json','utf8'))"` from the repository root exits 0, and `git diff -- schemas/harness.config.schema.json` shows only the `forge` description line changed.
- `git grep -n "^## " -- ARCHITECTURE.md` lists the same headings as before this task.
