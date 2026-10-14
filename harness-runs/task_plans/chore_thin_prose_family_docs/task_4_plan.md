### Task 4 — Thin `docs-reviewer`'s intro, `## Invocation contract` and `## Project layout`, and narrow its read of `docs-writer.md` to six sections

**Goal:** Cut the intro, `## Invocation contract` and `## Project layout` of `plugin/agents/docs-reviewer.md` to direct rules stated once, and replace the whole-file read of `docs-writer.md` with a read of the six sections every reviewer check grades against.

**Depends on:** Task 3, the last edit to `plugin/agents/docs-writer.md`. This task names six of that file's headings as the reviewer's read and confirms each graded rule is still inside them, so the writer must be in its final shape first. Task 1 wrote `harness-runs/scratch/docs_family_check.mjs`, which this task runs. If the probe file is missing, return a blocker naming `harness-runs/scratch/docs_family_check.mjs`; do not rewrite it.

**Where this task stops.** It changes only the text between the frontmatter and `## What to verify (accuracy first, then depth, then completeness)`. It does not touch:
- the frontmatter, the `**You do not edit the document.**` paragraph, the disabled-phase paragraph or `## Resolved values` (frozen; no task edits them);
- either fenced dispatch block or the two `Returns …` lines after them;
- `## What to verify (accuracy first, then depth, then completeness)`, `## Unsolicited dispatch guidance` or `## Output contract` (Task 5);
- `plugin/agents/docs-writer.md` or any other file.

Apply the replacements below exactly. Each **Old** block is an exact substring of the file at `25e2382a` — sometimes only part of a line — and you replace exactly that substring. No earlier task edits this file. If an Old block is not found exactly once, change nothing more in that file and return a blocker naming the file and the V-number.

**Frozen text in this range** stays word for word. It occurs in agent definitions outside this family, and a one-copy edit forks it:
- the whole `**You do not edit the document.**` paragraph and the whole disabled-phase paragraph;
- the `## Invocation contract` sentence `**The argument names and the return field names below are the wire between you and the flows that dispatch you — a renamed field silently breaks the caller's parse**, so do not decorate, translate or reorder them.`;
- in the read-the-writer paragraph, the runs ``before you grade.** It is the contract the document was written against — the`` and `the strings from it rather than from memory, so writer and reviewer cannot disagree.` (shared with `conventions-reviewer.md`; V4 keeps both);
- the whole paragraph opening `**A cited path you cannot read is a finding, not a fallback.**`.

These bold leads stay, worded as they are: `**You do not edit the document.**`, ``**Skip this phase unless `phases.docs` is `true` in `harness.config.json`.**``, ``**Catalog (`mode: catalog`)**``, ``**Update (`mode: update`)**``, ``**Read `${CLAUDE_PLUGIN_ROOT}/agents/docs-writer.md` before you grade.**``, `**A cited path you cannot read is a finding, not a fallback.**`, `**The application (the SUBJECT)**`, `**Backend / server-side source**` and `**The reference implementation**`. Every heading line stays.

### Targets

- `plugin/agents/docs-reviewer.md` → the intro sentence, `## Invocation contract` (its findings-path sentence, the fix-loop paragraph and the read-the-writer paragraph) and `## Project layout`.

**Work:**

- [ ] **Intro and `## Invocation contract`.** Apply V1–V3.
  - The intro keeps the one question and loses its second statement of the no-edit rule, which the frozen `**You do not edit the document.**` paragraph states (V1). The writer's path is still cited, in the read-the-writer paragraph.
  - The findings-path rule keeps *exactly the `findings_path` you were handed, never one you compute yourself* and drops the rationale (V2).
  - The fix-loop paragraph goes (V3). It describes what the callers do after a `FAIL`; the reviewer's own duty — a concrete correction for every finding — stays in `## Output contract` (*"each finding: the claim, the file that contradicts it, the correction"* and the `**FAIL**` bullet's *"list the concrete corrections"*).
- [ ] **Narrow the read of `docs-writer.md`.** Apply V4. The paragraph keeps its bold lead and both frozen runs, and names the six sections that are the only part of `docs-writer.md` the reviewer reads: `## Entry-point hints are STARTING POINTS, not boundaries`, `## Research methodology (apply every time)`, `## Mode 1 — catalog`, `### Write / update (`mode: update`)`, `## Template — `doc_type: feature`` and `## Template — `doc_type: concept``. The unreadable-contract `blocker:` paragraph after it is not edited.
- [ ] **Check the narrowed read against every reviewer check.** Open `plugin/agents/docs-writer.md` as Tasks 1–3 left it and confirm that the writer rule each check grades is inside the named section. If one is not, return a blocker naming the check and the rule; do not edit the writer.

  | Reviewer check (`## What to verify …`) | Writer rule it grades | Section it sits in |
  |---|---|---|
  | 1 anchors resolve; prose paths from `<repo_root>` | symbol anchor, quoted substring, bare path; repo-relative path rule (step 5) | `## Research methodology (apply every time)` |
  | 2 no line numbers | the bold line-number shape list (step 5) | `## Research methodology (apply every time)` |
  | 3 backend surface, `reachable? ✅ / ❌` | the reachability rule (step 5) and the `### Backend surface` template bullet | `## Research methodology (apply every time)`; `## Template — `doc_type: feature`` |
  | 4 data shapes routed by layer | the per-layer `## Technical implementation` sub-sections | `## Template — `doc_type: feature`` |
  | 5 gating, optimistic, sync direction | `## Business behaviour` and `### Local state & sync direction` | `## Template — `doc_type: feature`` |
  | 6 research depth beyond the hints | the hints rule, provenance (step 2) and the worked example | `## Entry-point hints are STARTING POINTS, not boundaries`; `## Research methodology (apply every time)` |
  | 7 parity | step 4 and the parity sections' OMIT rules | `## Research methodology (apply every time)`; both `## Template —` sections |
  | 8 `⚠️ unverified` honest | the unverified marker (step 5) | `## Research methodology (apply every time)` |
  | 9 no material omission | the template's sections and `## Anchor files` | both `## Template —` sections |
  | 10 merge / supersede | keep what is still true, correct what drifted, fold in named merge targets | `## Mode 1 — catalog` |
  | 11, 12 diff reflected, content preserved | the `**update**` bullet | `### Write / update (`mode: update`)` |
  | 13 ripple | the reviewer's own check; it grades no writer rule | — |
- [ ] **`## Project layout`.** Apply V5–V8.
  - The application bullet points at `<layer_path_map>` (V5); `## Resolved values` → the `<repo_root>` / `<app_dir>` row states that layer paths are repo-relative from `<repo_root>`.
  - The backend bullet keeps *"normally outside every `layers[].path` scope"* and turns its rationale into the rule it implies: check a claim about the backend against the backend source (V6).
  - The reference bullet keeps the parity gate (V7); the parity-off consequence is stated once, in `## Resolved values` → the `<reference_impl>` row and check 7.
  - The closing `<repo_root>` paragraph goes (V8); the `<repo_root>` / `<app_dir>` row of `## Resolved values` states the same derivation.
- [ ] **Run the probe, then take the rule inventory.** Run `bash scripts/scratch-run.sh harness-runs/scratch/docs_family_check.mjs plugin/agents/docs-reviewer.md` as one plain foreground command. Then read the old and new text side by side and confirm each of these still has a home, restoring anything missing in its shortest form:
  - one document, one question; no edits to the document; the findings file is the only file written;
  - the disabled-phase no-op; the two dispatch shapes, their caller citations and their `Returns …` lines; findings go to exactly the handed `findings_path`;
  - read the six writer sections before grading and take the strings from them; an unreadable contract or input returns `blocker:` and writes no findings file;
  - the application layout from `<layer_path_map>`; backend claims checked against the backend source, normally outside every layer path; the reference implementation only with parity on.

### Replacements

**V1** — `plugin/agents/docs-reviewer.md`: replace

```text
You review **one** document just written or updated by `docs-writer` (`${CLAUDE_PLUGIN_ROOT}/agents/docs-writer.md`) and answer one question: **does this document match the code — and, in update mode, the change?** You report findings; you do **not** edit the document.
```

with

```text
You review **one** document `docs-writer` just wrote or updated and answer one question: **does this document match the code — and, in update mode, the change?**
```

**V2** — `plugin/agents/docs-reviewer.md`: replace

```text
Write your findings to exactly the `findings_path` you were handed and never to one you compute yourself: the caller resolves `<i>` to the next free index, and writing to an index it did not choose destroys an earlier iteration's review.
```

with

```text
Write your findings to exactly the `findings_path` you were handed, never to one you compute yourself.
```

**V3** — `plugin/agents/docs-reviewer.md`: delete this paragraph, together with the one blank line after it

```text
On a `FAIL` either caller re-dispatches the writer with your `findings_file` and re-reviews at the next index, capped at three rounds; after the cap the document is committed as-is with your open findings flagged. So a Must Fix you cannot state as a concrete correction costs a round and changes nothing.
```

**V4** — `plugin/agents/docs-reviewer.md`: replace

```text
It is the contract the document was written against — the two template skeletons and their section order, the symbol-anchor citation rule, the no-line-numbers rule, the `reachable? ✅ / ❌` marker, the `⚠️ unverified` convention, and the update mode's preserve-what-is-true discipline. Every check below targets a rule that file actually states; take the strings from it rather than from memory, so writer and reviewer cannot disagree.
```

with

```text
It is the contract the document was written against — the only sections of it you read: `## Entry-point hints are STARTING POINTS, not boundaries`, `## Research methodology (apply every time)`, `## Mode 1 — catalog`, `` ### Write / update (`mode: update`) ``, `` ## Template — `doc_type: feature` `` and `` ## Template — `doc_type: concept` ``. Every check below grades a rule those sections state; take the strings from it rather than from memory, so writer and reviewer cannot disagree.
```

**V5** — `plugin/agents/docs-reviewer.md`: replace

```text
— its own source tree sits at `<repo_root>/<app_dir>`. Its structure is the configured one: each `layers[]` entry's `path` is the directory that layer's source lives in — **repo-relative**, resolved against `<repo_root>` rather than nested under `<app_dir>` — and its `conventions` document says what belongs there. Take both from `<layer_path_map>` rather than assuming a directory shape.
```

with

```text
— its source tree sits at `<repo_root>/<app_dir>`, laid out as `<layer_path_map>` configures it; never assume a directory shape.
```

**V6** — `plugin/agents/docs-reviewer.md`: replace

```text
— wherever the project keeps it; find it from the configuration and from the calls the application makes. It is normally outside every `layers[].path` scope, which is why a claim about it cannot be checked from the application side alone.
```

with

```text
— find it from the configuration and from the calls the application makes. It is normally outside every `layers[].path` scope, so check a claim about it against that source, never from the application side alone.
```

**V7** — `plugin/agents/docs-reviewer.md`: replace

```text
— `<reference_impl>`, when `phases.parity` is `true`. **It may not exist at all**: with the phase off no document carries a parity section.
```

with

```text
— `<reference_impl>`, only when `phases.parity` is `true`.
```

**V8** — `plugin/agents/docs-reviewer.md`: delete this paragraph, together with the one blank line after it

```text
Resolve `<repo_root>` with a **bare** `git rev-parse --show-toplevel` and build absolute paths from it — you may be running in a worktree, and a relative path resolves against the wrong checkout.
```

**Verification:**

- The probe run above prints a `WORDS docs-reviewer.md` line with a negative `delta` and an `UPFRONT docs-reviewer.md` line with a negative `delta`, and its last line is `PASS`. It prints none of `FROZEN`, `LEAD`, `HEADING`, `FENCE`, `FRONTMATTER`, `LITERAL`, `LITERAL-NOT-AT-BASE`, `ADDED`, `SECTION-MISSING`, `READS-CHANGED`, `OTHER-AGENT-CHANGED`, `WORDS-NOT-LOWER` or `UPFRONT-NOT-LOWER`.
- Every heading V4 names is a line of `plugin/agents/docs-writer.md`: `grep -n -x -F -e '## Entry-point hints are STARTING POINTS, not boundaries' -e '## Research methodology (apply every time)' -e '## Mode 1 — catalog' -e '### Write / update (`mode: update`)' -e '## Template — `doc_type: feature`' -e '## Template — `doc_type: concept`' plugin/agents/docs-writer.md` prints one line per heading.
- `git grep -n -F -e 'capped at three rounds' -e 'destroys an earlier iteration' -e 'two template skeletons' -e 'a relative path resolves against the wrong checkout' -- plugin/agents/docs-reviewer.md` prints nothing.
- `git diff -- plugin/agents/docs-reviewer.md` shows hunks only above `## What to verify (accuracy first, then depth, then completeness)`, none inside `## Resolved values` and none inside a fenced block.
