### 1. Sub-cases (b) and (c) of `## Process` step 2 now read only the fix-plan index's `## Context`, not the whole index

**File:** `plugin/agents/architecture-reviewer.md` (`## Process`, step 2) — "the same read over the fix-plan index" and "the same read over the test fix plan index"; and `plugin/agents/business-parity-reviewer.md` (`## Process`, step 2) — "the same read over the fix-plan index"

**What changed.** At the base commit `6307573a`, sub-case (b) of `## Process` step 2 told both reviewers to *"read the fix-plan index (`story_path`) plus **every** `finding_<N>.md` in `task_files_dir`"*. In `architecture-reviewer`, sub-case (c) told it to *"read the test fix plan index (`story_path`), **every** `finding_<N>.md` in `task_files_dir`, and the log at `prompt_path`"*. Both reads cover the **whole** index. Task 1 rewrote each line as *"the same read over …"*, and "the same read" can only point back to sub-case (a). Sub-case (a) reads *"the plan index's `## Context` plus **every** `task_<N>_plan.md`"*. Read that way, (b) and (c) now take in only the index's `## Context`.

**Why it matters.** A user-review fix-plan index holds more than `## Context` (`plugin/samples/sample_user_review_fix_plan.md`). It also has `## Phase 2 Readiness — Ordered Fix List`, which carries each fix's `_(layer: …)_` tag, `## Out of scope / verified-OK` and `## Source observations`. `architecture-reviewer`'s **Layer placement** check grades a change against *"the layer its `_(layer: …)_` tag names"*. A reviewer that reads only `## Context` never sees those tags, so it cannot raise that violation. A parity reviewer that skips `## Out of scope / verified-OK` cannot check the scoping claims recorded there. The story index says **"Behaviour does not change"**, and this edit narrows what both gates read. The `## Rejected findings` paragraph still sends the reviewer to that one section, but not to the readiness list or the other sections.

**Fix.** Replace each "the same read over" with a plain "read", word for word as below. This restores the base behaviour and lowers the word count. Make the (b) edit in **both** files so the two lines stay identical. The family check probe compares the `- **Plan-review mode, sub-case (b):**` line across the two files by prefix, so it still passes when both copies match.

In `plugin/agents/architecture-reviewer.md` **and** `plugin/agents/business-parity-reviewer.md`, replace:

```
   - **Plan-review mode, sub-case (b):** the same read over the fix-plan index (`story_path`) and **every** `finding_<N>.md` in `task_files_dir`.
```

with:

```
   - **Plan-review mode, sub-case (b):** read the fix-plan index (`story_path`) and **every** `finding_<N>.md` in `task_files_dir`.
```

In `plugin/agents/architecture-reviewer.md` only, in the sub-case (c) bullet, replace the opening:

```
   - **Plan-review mode, sub-case (c):** the same read over the test fix plan index (`story_path`) and **every** `finding_<N>.md` in `task_files_dir`, plus the log at `prompt_path`.
```

with:

```
   - **Plan-review mode, sub-case (c):** read the test fix plan index (`story_path`) and **every** `finding_<N>.md` in `task_files_dir`, plus the log at `prompt_path`.
```

Leave the rest of the (c) bullet as it is, from "Quote log text in your findings" to its end. Change nothing else.
