### Task 5 — Thin `harness-analyze.md`'s `## Context` and steps 1–3

**Goal:** Cut `## Context` and steps 1–3 of `plugin/commands/harness-analyze.md` to direct instructions stated once. The command's own `## Context` already says the decisions it applies, and what each was chosen over, are recorded in `docs/analyze.md` and *"are not restated here"*; this task removes the restatements that crept in.

**Depends on:** Task 4. The command dispatches both agents and cites `plugin/agents/conventions-writer.md` → `## Invocation contract`, `## The document`, `## Scope` and `## Output contract`, and `plugin/agents/conventions-reviewer.md` → `## Invocation contract` and `## The corpus pass — what to verify`; Tasks 1–4 kept every one of those headings and left both agents final, so this file is thinned against their final text.

**Where this task stops.** It changes only the text from the `## Context` heading to the line before step 4 (`4. **Classify every document…`). It does not touch the frontmatter, the `# Scope:` heading, `## Resolved values` (frozen), step 4 onwards (Tasks 6 and 7), or any other file.

Apply the replacements below exactly, in order. Each **Old** block is an exact substring of `plugin/commands/harness-analyze.md` at `25e2382a` — sometimes only part of a line, sometimes several hard-wrapped lines with their indentation — and you replace exactly that substring with the **New** block, which carries its own line breaks and indentation. If an Old block is not found exactly once, change nothing more in that file and return a blocker naming the file and the replacement id.

`plugin/commands/harness-analyze.md` is hard-wrapped Markdown: a numbered step's first line has no indent and every continuation line of that step, and every later paragraph inside it, is indented three spaces; a bullet inside a step is `   - ` with five-space continuations. Each New block is already wrapped and indented that way. Paste it as given; do not re-wrap the paragraphs around it.

**Frozen text in this range:** none beyond `## Resolved values`, which this task does not touch. **Behaviour that must not move:** the target and document sets and their order; the dedup rule; the mode decision; the three `shared_document` values and when each is sent; `none` as a value, never an omitted key; the re-derived set after an applied proposal; the `--dry-run` report; what step 2 gathers and never reads; step 4 as the only sender; the write dispatch's full field list; the closed block and its reach to (4c) and (4d); and a held divergence riding a fix dispatch, never the review. Every command name stays spelled `/autonomous-sdlc-harness:harness-analyze` and the setup verb `autonomous-sdlc-harness init`: `scripts/check-command-spelling.sh` (gate 6d, run by the Run gates phase) fails a bare spelling.

### Targets

- `plugin/commands/harness-analyze.md` → `## Context` and steps 1–3.

**Work:**

- [ ] **`## Context`.** Apply HA1 and HA2: the host-initializer contrast shrinks to one clause, and the supervised paragraph drops its last clause. The three standing prohibitions and the `docs/analyze.md` sentence stay.
- [ ] **Step 1.** Apply HA3 and HA4: the `shared_document` paragraph and the re-derived-set paragraph lose their reasons and keep every case and value.
- [ ] **Step 2.** Apply HA5: the lead drops its list of what each writer gathers and points at the writer instead. The four gather bullets, including the demand set and its re-derivation grep, stay unchanged.
- [ ] **Step 3.** Apply HA6–HA11: the reference paragraph, the delegation paragraph, the ordering paragraph, the write block, the closed-block paragraph and the corpus-dispatch paragraph each keep their instruction and drop their reason.
- [ ] **Rule inventory, then the probe.** Confirm each item under **Behaviour that must not move** above still has a home, restoring anything missing in its shortest form. Then run `bash scripts/scratch-run.sh harness-runs/scratch/conventions_family_check.mjs plugin/commands/harness-analyze.md` as one plain foreground command.

### Replacements

**HA1** — `plugin/commands/harness-analyze.md`: replace

```text
`autonomous-sdlc-harness init` detects a layout from file existence alone and writes the conventions documents
as skeletons. This command is the other half: it reads this repository and turns those skeletons into this
project's actual rules, and fills the two skeleton sections of the always-loaded project file. It is not the
host tool's own project-file initializer — that one writes a single always-loaded file from the codebase,
while this one fills the per-layer conventions documents `<layer_path_map>` points at and refuses to guess
what it could not determine. The setup verb it completes is written in full, `autonomous-sdlc-harness init`,
never a bare `init`.
```

with

```text
`autonomous-sdlc-harness init` detects a layout from file existence alone and writes the conventions documents
as skeletons. This command is the other half: it reads this repository and turns those skeletons into this
project's actual rules, and fills the two skeleton sections of the always-loaded project file. It is not the
host tool's own project-file initializer, and it refuses to guess what it could not determine. The setup verb it
completes is written in full, `autonomous-sdlc-harness init`, never a bare `init`.
```

**HA2** — `plugin/commands/harness-analyze.md`: replace

```text
**Supervised, first-session command.** It is not part of any unattended flow. Step 5's hand-off shells the
harness CLI out of the session, which the generated permission profile does not allow-list, so that call is
**expected to ask for permission** and a person is expected to be there to approve it — on a path that already
needs an explicit yes or `--apply-layers`.
```

with

```text
**Supervised, first-session command.** It is not part of any unattended flow. Step 5's hand-off shells the
harness CLI out of the session, which the generated permission profile does not allow-list, so that call is
**expected to ask for permission** and a person is expected to be there to approve it.
```

**HA3** — `plugin/commands/harness-analyze.md`: replace (the Old block begins with its 3-space indentation)

```text
   **What a run that does not itself write the shared cross-layer document sends as `shared_document`.** Two
   run shapes do not write it: `/autonomous-sdlc-harness:harness-analyze <layer>` for a layer whose own `conventions` is some other
   document, and any run — no-argument or single-target — in which (4a) classified that document `skip`. The
   discriminator is **whether this run writes it**, never whether the document set contains it; (4a) settles
   that for the whole set before any dispatch leaves, so the value is decided by the time one goes out. In both
   shapes the anchor is whatever already sits on disk, and the field carries a **value in every case**:
   `shared_document: <shared_conventions_path>` when a file exists there **and does not carry
   `<!-- harness:unfilled -->`**; `shared_document: none` when no file exists there **or** it is still an
   unfilled skeleton. The unfilled case is `none` rather than a path because an unfilled skeleton is the CLI's
   template prose: anchoring the run's vocabulary on it makes the writer borrow the template's words and the
   reviewer raise naming findings against them. `none` is a **value and never an omitted key** — the writer's
   and the reviewer's stop condition fires on a missing value, so an omitted field halts the dispatch instead
   of relaxing it. A run that **does** write it sends `none` on that document's own dispatch, for the reason
   it always does — whether the run reached it as the `conventions` target or as a layer whose `conventions`
   names it, which every generated configuration's catch-all row does.
```

with (the New block begins with its 3-space indentation)

```text
   **What a run that does not itself write the shared cross-layer document sends as `shared_document`.** Two run
   shapes do not write it: `/autonomous-sdlc-harness:harness-analyze <layer>` for a layer whose own
   `conventions` is some other document, and any run — no-argument or single-target — in which (4a) classified
   that document `skip`. The discriminator is **whether this run writes it**, never whether the document set
   contains it; (4a) settles that for the whole set before any dispatch leaves. In both shapes the anchor is
   whatever already sits on disk, and the field carries a **value in every case**:
   `shared_document: <shared_conventions_path>` when a file exists there **and does not carry
   `<!-- harness:unfilled -->`**; `shared_document: none` when no file exists there **or** it is still an
   unfilled skeleton. `none` is a **value and never an omitted key**: the writer's and the reviewer's stop
   condition halts on an omitted field. A run that **does** write it sends `none` on that document's own
   dispatch, whether the run reached it as the `conventions` target or as a layer whose `conventions` names it,
   which every generated configuration's catch-all row does.
```

**HA4** — `plugin/commands/harness-analyze.md`: replace (the Old block begins with its 3-space indentation)

```text
   **The set is re-derived once, after step 5's `layers` proposal is applied.** The `layers` target runs first
   in the announced order, so its outcome is settled before any document leaves, and a `conventions` path an
   accepted proposal newly names **joins the document set here** — classified by (4a) with every other
   document and dispatched in step 4's waves like any other. The set step 4 classifies is the set as it stands
   **after** the proposal, never the set as it stood before it; when a proposal is applied, reprint the
   announcement's document set and dispatch plan with the addition named.
```

with (the New block begins with its 3-space indentation)

```text
   **The set is re-derived once, after step 5's `layers` proposal is applied.** The `layers` target runs first
   in the announced order, so its outcome is settled before any document leaves, and a `conventions` path an
   accepted proposal newly names **joins the document set here** — classified by (4a) with every other document
   and dispatched in step 4's waves like any other. Step 4 classifies the set as it stands **after** the
   proposal; when a proposal is applied, reprint the announcement's document set and dispatch plan with the
   addition named.
```

**HA5** — `plugin/commands/harness-analyze.md`: replace

```text
2. **Gather what the whole run shares, and what the targets this session writes itself need.** Never read
   `<state_dir>`, `<scripts_dir>` or `<githooks_dir>` as evidence about the adopter's code. The per-layer,
   rule-deriving evidence is **not** gathered here: the manifests and lockfiles that name the stack, the entry
   points, the files changed most recently and the shapes that recur are each writer's own gather, from its
   own `scope`, and `${CLAUDE_PLUGIN_ROOT}/agents/conventions-writer.md` states that obligation. What this
   step gathers is three things the whole run shares, plus the survey the one code-facing target this session
   still writes needs:
```

with

```text
2. **Gather what the whole run shares, and what the targets this session writes itself need.** Never read
   `<state_dir>`, `<scripts_dir>` or `<githooks_dir>` as evidence about the adopter's code. The per-layer,
   rule-deriving evidence is **not** gathered here: each writer gathers it from its own `scope`
   (`${CLAUDE_PLUGIN_ROOT}/agents/conventions-writer.md`). This step gathers three things the whole run shares,
   plus the survey the `project` target needs:
```

**HA6** — `plugin/commands/harness-analyze.md`: replace

```text
3. **What is delegated, to whom, and in what order. This step sends nothing.** It is the reference **step 4
   fills**, and step 4 is the sole sender of every dispatch in this run — write, review and fix alike —
   because the `action` a write dispatch carries is decided by (4a), and a document (4a) classifies as `skip`
   must never have been dispatched. Send nothing from here.
```

with

```text
3. **What is delegated, to whom, and in what order. This step sends nothing.** It is the reference **step 4
   fills**, and step 4 is the sole sender of every dispatch in this run — write, review and fix alike — because
   the `action` a write dispatch carries is decided by (4a), and a document (4a) classifies as `skip` must never
   have been dispatched.
```

**HA7** — `plugin/commands/harness-analyze.md`: replace (the Old block begins with its 3-space indentation)

```text
   **Every conventions document is written by `conventions-writer`**
   (`${CLAUDE_PLUGIN_ROOT}/agents/conventions-writer.md`), the shared cross-layer one included. That file owns
   the document's content contract — the banner, the `**What belongs here**` answers, the stack-independent
   rule block, the real example, the shared document's own sections and the `phases.parity` gate on the parity
   one, provenance on every rule, and `## Not determined` — and this file does not restate it. What this step
   keeps is what the orchestrator decides.
```

with (the New block begins with its 3-space indentation)

```text
   **Every conventions document is written by `conventions-writer`**
   (`${CLAUDE_PLUGIN_ROOT}/agents/conventions-writer.md`), the shared cross-layer one included. That file owns
   the document's content contract, and this file does not restate it.
```

**HA8** — `plugin/commands/harness-analyze.md`: replace (the Old block begins with its 3-space indentation)

```text
   **Ordering, for the set the run actually has.** **When this run writes the shared cross-layer document** —
   every no-argument run in which (4a) did not classify it `skip`, a `/autonomous-sdlc-harness:harness-analyze conventions` run, and a
   single-target run naming the layer whose `conventions` is that document, which every generated
   configuration's catch-all row is — `<shared_conventions_path>` is written first, in its own
   write→review→fix chain completed before any per-layer document is dispatched: it owns the cross-layer
   flow, the testing bar and the commit policy, and its finished text is then passed to every later writer as
   `shared_document`, the read-only vocabulary anchor that keeps five writers from naming one concept five
   ways. **When it does not** — a single-target run naming another layer, or any run in which it was
   classified `skip` — there is no first chain to run and no text to pass down: the run dispatches the
   remaining documents and takes its anchor off disk under step 1's rule (the path when that file is filled,
   `none` when it is missing or still unfilled).
```

with (the New block begins with its 3-space indentation)

```text
   **Ordering, for the set the run actually has.** **When this run writes the shared cross-layer document** —
   every no-argument run in which (4a) did not classify it `skip`, a
   `/autonomous-sdlc-harness:harness-analyze conventions` run, and a single-target run naming the layer whose
   `conventions` is that document, which every generated configuration's catch-all row is —
   `<shared_conventions_path>` is written first, in its own write→review→fix chain completed before any
   per-layer document is dispatched, and its finished text is then passed to every later writer as
   `shared_document`, the read-only vocabulary anchor. **When it does not** — a single-target run naming another
   layer, or any run in which it was classified `skip` — there is no first chain to run: the run dispatches the
   remaining documents and takes its anchor off disk under step 1's rule (the path when that file is filled,
   `none` when it is missing or still unfilled).
```

**HA9** — `plugin/commands/harness-analyze.md`: replace (the Old block begins with its 3-space indentation)

```text
   **The write dispatch's argument block**, exactly as the writer's `## Invocation contract` names the fields:
   `pass: document`, **always sent** — the writer's stop condition fires on a missing value, so an omitted
   `pass` halts the dispatch rather than defaulting to an axis;
   `target`; `document_path` (absolute); `action` (`write` or `merge`, from (4a)); `scope` — this layer's
   `layers[].path` for a layer target, and the **repository root** for the shared document, which governs
   every layer and is normally the catch-all row's document, whose `layers[].path` is `.`; `mode`;
   `excluded_paths` (`<state_dir>`, `<scripts_dir>`, `<githooks_dir>`); `harvested_sources`; `demand_set`;
   `shared_document`, **always sent** — the finished shared document's path, or `none` on the dispatch that
   writes it and in the on-disk cases step 1 names; and `parity`, only when `phases.parity` is
   `true`.
```

with (the New block begins with its 3-space indentation)

```text
   **The write dispatch's argument block**, exactly as the writer's `## Invocation contract` names the fields:
   `pass: document`, **always sent**; `target`; `document_path` (absolute); `action` (`write` or `merge`, from
   (4a)); `scope` — this layer's `layers[].path` for a layer target, and the **repository root** for the shared
   document, which governs every layer and is normally the catch-all row's document, whose `layers[].path` is
   `.`; `mode`; `excluded_paths` (`<state_dir>`, `<scripts_dir>`, `<githooks_dir>`); `harvested_sources`;
   `demand_set`; `shared_document`, **always sent** — the finished shared document's path, or `none` on the
   dispatch that writes it and in the on-disk cases step 1 names; and `parity`, only when `phases.parity` is
   `true`.
```

**HA10** — `plugin/commands/harness-analyze.md`: replace (the Old block begins with its 3-space indentation)

```text
   **What governs the prompt beyond that block.** `/autonomous-sdlc-harness:harness-analyze` does **not** activate
   `${CLAUDE_PLUGIN_ROOT}/instructions/dispatch_discipline_instructions.md`: that file's activation list is
   closed and this command is not on it, so activating would mean editing a policy every dispatching
   instruction core obeys, and its obligations have no write point here — a setup run in an adopter's
   repository has no branch, no committer and no run-control tree to record against. **What stands in its
   place: the block is closed.** Every dispatch this command sends — write, review and fix alike — carries
   **exactly** the fields named here and in (4c) and (4d) and no added prose: no `context_notes:` line, no
   "where to be suspicious", no severity or verdict calibration, no scope narrowing.
```

with (the New block begins with its 3-space indentation)

```text
   **What governs the prompt beyond that block.** `/autonomous-sdlc-harness:harness-analyze` does **not**
   activate `${CLAUDE_PLUGIN_ROOT}/instructions/dispatch_discipline_instructions.md`: that file's activation
   list is closed and this command is not on it. **What stands in its place: the block is closed.** Every
   dispatch this command sends — write, review and fix alike — carries **exactly** the fields named here and in
   (4c) and (4d) and no added prose: no `context_notes:` line, no "where to be suspicious", no severity or
   verdict calibration, no scope narrowing.
```

**HA11** — `plugin/commands/harness-analyze.md`: replace (the Old block begins with its 3-space indentation)

```text
   **It binds (4d)'s two corpus dispatch shapes identically, and hardest on the corpus review**, which carries
   exactly the fields (4d) names — no named flaw classes, and no scope narrowing beyond the `corpus_documents`
   set itself. That reviewer's independence is the only check the corpus pass has, and a caller that hands it
   the divergences the run already knows about gets confirmation back rather than evidence — which is why a
   divergence the run already holds rides a **fix** dispatch and never the review one.
```

with (the New block begins with its 3-space indentation)

```text
   **It binds (4d)'s two corpus dispatch shapes identically, and hardest on the corpus review**, which carries
   exactly the fields (4d) names — no named flaw classes, and no scope narrowing beyond the `corpus_documents`
   set itself. A divergence the run already holds rides a **fix** dispatch and never the review one.
```

**Verification:**

- The probe run prints `WORDS plugin/commands/harness-analyze.md` with a negative `delta`, and its last line is `PASS`.
- `git grep -n -E '[^:a-z]/harness-analyze' -- plugin/commands/harness-analyze.md` prints nothing: every command name keeps its qualified spelling.
- `git grep -n -F -e 'anchor that keeps five writers' -e 'makes the writer borrow the template' -e 'gets confirmation back rather than evidence' -- plugin/commands/harness-analyze.md` prints nothing.
- `git diff -- plugin/commands/harness-analyze.md` shows hunks only between the `## Context` heading and the line `4. **Classify every document, then dispatch, then review each written one once, then review the corpus as a`.
