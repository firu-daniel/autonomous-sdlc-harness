### Task 3 — Thin `docs-writer`'s `## Mode 2`, template lead and `## Output contract`

**Goal:** Cut the rest of `plugin/agents/docs-writer.md` — the `## Mode 2 — post-implementation (diff-driven)` intro, `### Survey (`mode: survey`)`, `### Write / update (`mode: update`)`, the lead paragraph of `## Template — `doc_type: feature`` and `## Output contract` — to direct rules stated once, leaving both templates and every return field untouched.

**Depends on:** Task 2, which edits `## Research methodology (apply every time)` of the same file; Task 1 wrote `harness-runs/scratch/docs_family_check.mjs`, which this task runs. If the probe file is missing, return a blocker naming `harness-runs/scratch/docs_family_check.mjs`; do not rewrite it.

**Where this task stops.** It changes only text from `## Mode 1 — catalog` to the end of the file, and inside that range only the five passages below. It does not touch:
- `## Mode 1 — catalog` (its merge rule is graded by `docs-reviewer` check 10 and stays verbatim);
- either fenced template block, or any heading line;
- anything above `## Mode 1 — catalog` (Tasks 1 and 2), `plugin/agents/docs-reviewer.md` (Tasks 4 and 5), or any other file.

`docs-reviewer` will read `## Mode 1 — catalog`, `### Write / update (`mode: update`)` and both `## Template —` sections before it grades (Task 4), so a rule cut there is one the reviewer can no longer grade against.

Apply the replacements below exactly. Each **Old** block is an exact substring of the file at `25e2382a` — sometimes only part of a line — and you replace exactly that substring. Tasks 1 and 2 edited only text above `## Mode 1 — catalog`, so every Old block is still there. If an Old block is not found exactly once, change nothing more in that file and return a blocker naming the file and the X-number.

**Frozen text in this range** stays word for word: `Your final message IS your return value (not a human chat).` (shared with `conventions-writer.md`) and both fenced template blocks, byte for byte.

These bold leads stay, worded as they are: `**Arguments:**`, `**Analyze the diff and decide what it means for the documentation.**`, `**new**`, `**update**`, `**Ripple:**`, `**Write nothing.**`, `**catalog / update:**`, `**survey:**` and `**docs phase disabled:**`. Every heading line stays, including `## Mode 2 — post-implementation (diff-driven)`, which after X1 is followed directly by `### Survey (`mode: survey`)`.

### Targets

- `plugin/agents/docs-writer.md` → the `## Mode 2 — post-implementation (diff-driven)` intro paragraph, `### Survey (`mode: survey`)`, `### Write / update (`mode: update`)`, the lead paragraph of `## Template — `doc_type: feature`` and `## Output contract`.

**Work:**

- [ ] **`## Mode 2`.** Apply X1–X3.
  - The intro paragraph under the `## Mode 2` heading goes (X1): the intro's mode list and `## Invocation contract` already say what Mode 2 is and how it is dispatched.
  - Survey keeps `targets: none` for a pure refactor with no file added, removed, renamed, moved or split, and *say so rather than inventing work*; it drops the coordinate-refresh rationale (X2). The rename/move/split/deletion rule, its grep across `<docs_root>` and the `anchor path moved` reason are not edited.
  - The update bullet keeps when `Anchor files` may be revised, and the stand-alone-update exception for a renamed, moved, split or deleted path; it drops the moved-line clause (documents carry no line numbers, research step 5) and the exception's rationale (X3). `docs-reviewer` checks 11 and 12 grade this bullet.
- [ ] **Template lead and `## Output contract`.** Apply X4 and X5.
  - The template lead keeps *keep the section order* and the fill-from-conventions rule for the template's *Replace with your project's …* bullets; it drops the retrieval-map rationale (X4).
  - The disabled-phase return keeps `notes:` with the reason and the omission of `doc_path:` and `targets:`; it drops the restatement of the gate and the rationale (X5). The `**catalog / update:**` and `**survey:**` bullets are not edited: the two docs flows parse those fields.
- [ ] **Run the probe:** `bash scripts/scratch-run.sh harness-runs/scratch/docs_family_check.mjs plugin/agents/docs-writer.md`, as one plain foreground command.
- [ ] **Rule inventory before saving.** Read the old and new text side by side and confirm each of these still has a home. Restore anything missing in its shortest form.
  - Catalog: research from `entry`, write to `output_path` from the template; with `existing_doc`, keep what is still true, correct what drifted, fold in named merge targets, and supersede the old file(s).
  - Survey: classify new / update / both, trace ripples, write nothing, `targets: none` for a pure refactor, and an `anchor path moved` update target for every document citing a renamed, moved, split or deleted path.
  - Write / update: a fresh document for `new`; for `update`, preserve what is accurate, fold in exactly what the diff changed, revise `Anchor files` only on a file-set or role change and never alone except for a moved path, and never rewrite unaffected sections or drop still-true content.
  - Both templates, their OMIT rules and `reachable? ✅ / ❌`, byte for byte; the section order is kept.
  - Every return field and the disabled-phase return shape.

### Replacements

**X1** — `plugin/agents/docs-writer.md`: delete this paragraph, together with the one blank line after it

```text
Runs at the end of a code-implementation flow to keep the documentation in sync with a shipped change. Two call shapes, both in `## Invocation contract`.
```

**X2** — `plugin/agents/docs-writer.md`: replace

```text
yields **`targets: none`** — a coordinate refresh is no longer a reason to touch a document, because documents carry no coordinates; say so rather than inventing work.
```

with

```text
yields **`targets: none`** — say so rather than inventing work.
```

**X3** — `plugin/agents/docs-writer.md`: replace

```text
or a file's role changed — never to re-point an anchor at a moved *line* (documents carry no line numbers, so there is nothing to re-point) — and never as the sole content of an update **except when a cited path was renamed, moved, split or deleted**, which is a legitimate stand-alone update because the document otherwise cites a file that no longer exists.
```

with

```text
or a file's role changed, and never as the sole content of an update **except when a cited path was renamed, moved, split or deleted**.
```

**X4** — `plugin/agents/docs-writer.md`: replace

```text
The section order below is the retrieval map a reader navigates by — keep it. The per-section content is the adopting project's: where a bullet says *replace with your project's …*, fill it from the conventions documents `<layer_path_map>` names, never from a remembered convention.
```

with

```text
Keep the section order below. Where a bullet says *replace with your project's …*, fill it from the conventions documents `<layer_path_map>` names, never from a remembered convention.
```

**X5** — `plugin/agents/docs-writer.md`: replace

```text
- **docs phase disabled:** you wrote nothing and researched nothing — return `notes:` with the one-line reason (`phases.docs` is `false`), and omit `doc_path:` and `targets:` entirely. Their absence is what tells the caller no document was produced.
```

with

```text
- **docs phase disabled:** return `notes:` with the one-line reason (`phases.docs` is `false`), and omit `doc_path:` and `targets:` entirely.
```

**Verification:**

- The probe run above prints a `WORDS docs-writer.md` line whose `delta` is more negative than after Task 2, and its last line is `PASS`. It prints none of `FROZEN`, `LEAD`, `HEADING`, `FENCE`, `FRONTMATTER`, `LITERAL`, `LITERAL-NOT-AT-BASE`, `READS-CHANGED`, `OTHER-AGENT-CHANGED` or `WORDS-NOT-LOWER`.
- `git grep -n -F -e 'Runs at the end of a code-implementation flow' -e 'a coordinate refresh' -e 'nothing to re-point' -e 'retrieval map a reader navigates by' -e 'Their absence is what tells' -- plugin/agents/docs-writer.md` prints nothing.
- `git diff 25e2382a -- plugin/agents/docs-writer.md` shows no change inside either fenced template block and no changed heading line.
