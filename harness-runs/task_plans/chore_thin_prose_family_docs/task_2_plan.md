### Task 2 — Thin `docs-writer`'s `## Research methodology (apply every time)`

**Goal:** Cut `## Research methodology (apply every time)` of `plugin/agents/docs-writer.md` to direct rules stated once, keeping every rule `docs-reviewer` grades — the forward trace, the provenance grep across every layer path, the worked example, the anchor forms, the line-number ban, the repo-relative path rule, `⚠️ unverified` and `reachable? ❌`.

**Depends on:** Task 1, which edits the part of the same file above this section and writes `harness-runs/scratch/docs_family_check.mjs`. This task runs that probe as Task 1 left it. If the probe file is missing, return a blocker naming `harness-runs/scratch/docs_family_check.mjs`; do not rewrite it.

**Where this task stops.** It changes only the numbered steps 1–6 under `## Research methodology (apply every time)`, between that heading and the `---` before `## Mode 1 — catalog`. It does not touch the heading, anything above it (Task 1) or anything below it (Task 3), and no other file. `docs-reviewer` will read this whole section before it grades (Task 4), so a rule cut here is a rule the reviewer can no longer grade against.

Apply the replacements below exactly. Each **Old** block is an exact substring of the file at `25e2382a` — sometimes only part of a line — and you replace exactly that substring. Task 1 edited only text above this section, so every Old block is still there. If an Old block is not found exactly once, change nothing more in that file and return a blocker naming the file and the M-number.

**Frozen text in this range** stays word for word. It occurs in `conventions-writer.md` and `ui-tests-plan-reviewer.md`, and a one-copy edit forks it:
- in step 2, the run ``read off the owning layer's `layers[].conventions` document via `<layer_path_map>`, never from a`` (M2 keeps it, followed by *"vocabulary this file assumes."*);
- in step 5, the run ``document — in any shape: with a colon, with a tilde, in parentheses, as a bare range, as a `(line NNN)` word form, or as a slash-joined run of tails after a`` (M7 keeps the whole bold sentence);
- in step 5, the run ``document is repo-relative and resolves against `<repo_root>`** — the same root `layers[].path` follows — in`` (no replacement touches that sentence).

These bold leads stay, worded as they are: `**Forward trace**`, `**Stored-data provenance — the highest-value technique.**`, `**Stored-data sets as search entry points.**`, ``**Cross-reference `<reference_impl>`**``, `**Never invent.**` and `**Scale to the feature**`. The heading line stays: it is one of the six `docs-reviewer` will cite.

### Targets

- `plugin/agents/docs-writer.md` → `## Research methodology (apply every time)`, steps 1–6.

**Work:**

- [ ] **Steps 1–4.** Apply M1–M5.
  - Step 1 takes its hops from `<layer_path_map>` in the configured order and keeps the hop chain in short form; *"read each hop, never infer one from the name of the next"* stays (M1). The hook/controller hop goes: the configured layers supply the hops.
  - Step 2 keeps the grep across **every** `layers[].path` scope including the catch-all `.` **and** the backend source, and the bold question. It drops *"resolved against `<repo_root>`"* (stated once in `## Resolved values`), the rationale sentence, and the template residue *"Replace with your project's …"*, keeping the vocabulary rule and its frozen run (M2).
  - The worked example keeps the shallow trace, the ranking question, the backward trace to the writers and *"Do this for every non-trivial feature."*, and drops its commentary (M3). `docs-reviewer` check 6 grades depth against it.
  - Step 3 drops its rationale (M4); step 4 drops the restatement of its own *only when* clause (M5).
- [ ] **Step 5.** Apply M6–M8.
  - The symbol-anchor rule, the quoted-substring fallback with its grep-before-writing rule and the line-wrap edge case, and the bare-path fallback all stay (M6).
  - The line-number ban keeps its bold shape list and drops the rationale after it (M7).
  - The repo-relative path rule and the grep-verify-a-promoted-quote rule are not edited.
  - The reachability rule keeps `reachable? ❌`, its parenthetical, the parity case and the search of every layer path including `.` (M8). It drops *"resolved against `<repo_root>`"*, the rationale and *"These feed the INDEX."*, which the writer does not act on.
- [ ] **Step 6** is not edited.
- [ ] **Run the probe:** `bash scripts/scratch-run.sh harness-runs/scratch/docs_family_check.mjs plugin/agents/docs-writer.md`, as one plain foreground command.
- [ ] **Rule inventory before saving.** Read the old and new text side by side and confirm each of these still has a home. Restore anything missing in its shortest form.
  - Forward trace through the configured hops, in order, reading each hop.
  - Provenance: grep each stored-data set across every layer path including `.` and the backend source; ask where the data comes from and what consumes it; name things in the project's own vocabulary from the owning layer's conventions document.
  - The worked example's shallow-versus-backward contrast, and *do this for every non-trivial feature*.
  - Data-defined features start from the set's name; parity cross-reference only with `phases.parity` on.
  - Never invent; symbol anchor naming a symbol you read; quoted substring grep-verified, and a span across a line wrap resolves to nothing; else the bare path.
  - No line number in any of the listed shapes; every path repo-relative from `<repo_root>`, in prose and anchors; a quote left beside a removed line number becomes the anchor and is grep-verified.
  - `⚠️ unverified` with a one-line reason; `reachable? ❌` for an operation or capability with no caller under any layer path, the scope-cut parenthetical, and the search of every layer path including `.`.
  - Scale: ~100–150 lines for a rich feature, a few dozen for a static page.

### Replacements

**M1** — `plugin/agents/docs-writer.md`: replace

```text
from an entry point, following the configured layers: the surface the user touches → the feature's own hook/controller → the unit that holds the business logic → the layer that talks to the outside world → the backend stored-data sets and operations it reaches. Take the hops from `<layer_path_map>` in the configured order, and **read each hop** — do not infer one from the name of the next.
```

with

```text
from an entry point through the hops of `<layer_path_map>`, in the configured order — the surface the user touches, the unit that holds the business logic, the layer that talks to the outside world — to the backend stored-data sets and operations it reaches. **Read each hop**; never infer one from the name of the next.
```

**M2** — `plugin/agents/docs-writer.md`: replace

```text
For every stored-data set the feature reads or writes, `grep` its name across **every** `layers[].path` scope of `<layer_path_map>`, resolved against `<repo_root>` — including the catch-all `.` — **and** the backend source, and ask: **where does this data come from, and what consumes it?** This uncovers derived / hidden mechanisms that a surface-first or backend-first trace misses. *Replace with your project's stored-data and backend-operation vocabulary* — what it calls a stored-data set and what it calls a backend operation (endpoint, callable, procedure) — read off the owning layer's `layers[].conventions` document via `<layer_path_map>`, never from a vocabulary this file assumes.
```

with

```text
For every stored-data set the feature reads or writes, `grep` its name across **every** `layers[].path` scope of `<layer_path_map>` — including the catch-all `.` — **and** the backend source, and answer: **where does this data come from, and what consumes it?** Name stored-data sets and backend operations (endpoint, callable, procedure) in the project's own vocabulary, read off the owning layer's `layers[].conventions` document via `<layer_path_map>`, never from a vocabulary this file assumes.
```

**M3** — `plugin/agents/docs-writer.md`: replace

```text
*Worked example (illustrative — substitute the adopting project's own feature):* a personalized item feed. `feed surface → the feed use case → a "fetch feed" backend operation that returns items` is the **shallow** trace, and a document that stops there says nothing a reader could not guess. The real story is *how the ranking is produced*: the operation reads a per-user preference data set. Trace **backward** to what WRITES that set — and it turns out two unrelated surfaces do (marking an item as liked, and a background watch-duration tracker), neither of which appears anywhere in the feed's own directory. Only by following the data set to its writers do you document how the feature actually works. Do this for every non-trivial feature.
```

with

```text
*Worked example (illustrative):* a personalized item feed. `feed surface → the feed use case → a "fetch feed" backend operation that returns items` is the **shallow** trace. The real story is *how the ranking is produced*: the operation reads a per-user preference data set, so trace **backward** to what WRITES that set: two unrelated surfaces do (marking an item as liked, and a background watch-duration tracker), neither in the feed's own directory. Do this for every non-trivial feature.
```

**M4** — `plugin/agents/docs-writer.md`: replace

```text
start from the set's name and fan out to all readers/writers — that is often the only reliable way to find it.
```

with

```text
start from the set's name and fan out to all readers/writers.
```

**M5** — `plugin/agents/docs-writer.md`: replace

```text
**only when `phases.parity` is `true`**. With the phase off, skip this step entirely: there is no reference implementation to compare against and no parity claim to make.
```

with

```text
**only when `phases.parity` is `true`**.
```

**M6** — `plugin/agents/docs-writer.md`: replace

```text
cite it as a **symbol anchor**: `path` (`symbolName`) — the path of the file plus the name of the symbol you actually read in it. Where the target has no nameable symbol (a rules file, a config file, a template), name a short quoted code substring that is unique and greppable instead, and **verify it with a literal `grep` before writing it**: a span that crosses a line wrap resolves to nothing and is worse than a bare path.
```

with

```text
cite it as a **symbol anchor**: `path` (`symbolName`), naming a symbol you actually read in that file. Where the target has no nameable symbol (a rules file, a config file, a template), name a short quoted code substring that is unique and greppable instead, and **verify it with a literal `grep` before writing it** — a span that crosses a line wrap resolves to nothing.
```

**M7** — `plugin/agents/docs-writer.md`: replace

```text
as a slash-joined run of tails after a path** — line numbers churn across every branch and go stale silently, while the symbol they sit next to is already the stable anchor.
```

with

```text
as a slash-joined run of tails after a path**.
```

**M8** — `plugin/agents/docs-writer.md`: replace

```text
that has **no caller anywhere under the `layers[].path` scopes of `<layer_path_map>`, resolved against `<repo_root>`** as `reachable? ❌` (a deliberate scope cut vs. something simply not built yet — flag `⚠️ unverified` if unsure); search **every** layer path, including the catch-all `.`, since a search narrowed to one directory marks a wired surface unreachable. These feed the INDEX.
```

with

```text
that has **no caller anywhere under the `layers[].path` scopes of `<layer_path_map>`** as `reachable? ❌` (a deliberate scope cut vs. something simply not built yet — flag `⚠️ unverified` if unsure); search **every** layer path, including the catch-all `.`.
```

**Verification:**

- The probe run above prints a `WORDS docs-writer.md` line whose `delta` is more negative than after Task 1, and its last line is `PASS`. It prints none of `FROZEN`, `LEAD`, `HEADING`, `FENCE`, `FRONTMATTER`, `LITERAL`, `LITERAL-NOT-AT-BASE`, `READS-CHANGED`, `OTHER-AGENT-CHANGED` or `WORDS-NOT-LOWER`.
- `git grep -n -F -e 'hook/controller' -e 'derived / hidden mechanisms' -e 'line numbers churn' -e 'These feed the INDEX' -e 'Only by following the data set' -- plugin/agents/docs-writer.md` prints nothing.
- `git grep -n -F -e 'reachable? ❌' -e '⚠️ unverified' -- plugin/agents/docs-writer.md` still prints the step 5 line of `## Research methodology (apply every time)`; the only other line it may print is the `**catalog / update:**` bullet of `## Output contract`.
- `git diff -- plugin/agents/docs-writer.md` shows this task's hunks only between `## Research methodology (apply every time)` and `## Mode 1 — catalog`.
