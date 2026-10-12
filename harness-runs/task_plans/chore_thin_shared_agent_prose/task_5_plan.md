### Task 5 — Thin the shared sentences of the `<repo_root>` and `<repo_root>` / `<app_dir>` rows, identically in every copy

**Goal:** Shorten the sentences the `<repo_root>` `## Resolved values` row repeats across twenty agents in all eight families, and the `<app_dir>` sentences its combined `<repo_root>` / `<app_dir>` form repeats, writing one result per sentence into every copy.

**Depends on:** Task 4, which edits the `<state_dir>` row of eighteen of these files. This task changes only the `<repo_root>` row (and, in `qa-tester.md` and `layer-implementer.md`, the sentences named below in their `<app_root>` row), never the `<state_dir>` row.

**Where this task stops.** The row is not one block but a shared core with per-agent tails, so this task works **sentence by sentence**: it replaces each shared sentence wherever it occurs and leaves every agent-specific sentence as it is — `statistics-plan-writer.md`'s "Every `<state_dir>/…` path in this file is written repo-relative and resolves against it.", `test-fix-plan-writer.md`'s "Every repo-relative path a prompt hands you resolves against it.", and each review agent's own account of which search scopes to `<layer_path_map>` stay byte-for-byte. Literals kept: `git rev-parse --show-toplevel`, `$(…)`, `appDir`, `layers[].path`, `harness.config.json` and every placeholder. Change these sentences **only inside the `<repo_root>` row** (and the `<app_root>` rows named above): `committer.md` and `layer-reviewer.md` carry "the checkout this run is executing in" a second time outside the row, and that occurrence stays.

Each replacement gives the **old** text and the **new** text in their own fenced blocks; match the old text exactly and replace it whole.

### Targets

- Every `plugin/agents/*.md` file whose `## Resolved values` table carries a `<repo_root>` row — all twenty definitions except `qa-tester-mobile-maestro.md` and `qa-tester-mobile-mcp.md`.

**Work:**

- [ ] **The three shared `<repo_root>` sentences**, in all twenty rows. Replace each old fragment with its new one; a row that lacks a fragment (the two conventions-family rows have no worktree clause) simply skips it.

  Old fragment 1 → new:

```markdown
the checkout this run is executing in
```

```markdown
the checkout this run executes in
```

  Old fragment 2 → new:

```markdown
in an autonomous run, the run's **own worktree**, not the main checkout.
```

```markdown
in an autonomous run, its **own worktree**, not the main checkout.
```

  Old sentences 3 and 4 → new:

```markdown
Obtain it with a **bare** `git rev-parse --show-toplevel` and build every literal path from the result. Never embed the `$(…)` substitution inside another shell command, and never stash it in a shell variable across separate Bash calls — separate calls do not share shell state.
```

```markdown
Take it from a **bare** `git rev-parse --show-toplevel` and build every literal path from it. Never nest the `$(…)` in another command, or carry it across Bash calls in a shell variable.
```

  (`statistics-plan-writer.md` has its own sentence between fragment 2 and sentence 3; replace sentences 3 and 4 in place and keep it.)

- [ ] **The `<app_dir>` sentence**, in the eleven rows that carry it (`qa-tester.md` and `branch-reviewer.md`, `business-parity-reviewer.md`, `review-plan-reviewer.md`, `skeptic-reviewer.md`, `task-plan-reviewer.md`, `task-plan-writer.md`, `ui-tests-plan-writer.md`, `user-review-fix-plan-writer.md`, `docs-reviewer.md`, `docs-writer.md`). Old → new, in the eight files other than the docs pair:

```markdown
`<app_dir>` is `appDir`, the app's directory inside that checkout, repo-relative; `<repo_root>/<app_dir>` is where the app's own source tree sits inside the checkout.
```

```markdown
`<app_dir>` is `appDir`, the app's repo-relative directory; `<repo_root>/<app_dir>` is where its source tree sits.
```

  In `docs-reviewer.md` and `docs-writer.md` the old sentence names the application root; keep that difference. Old → new:

```markdown
`<app_dir>` is `appDir`, the app's directory inside that checkout, repo-relative; `<repo_root>/<app_dir>` is the application root — where the app's own source tree sits inside the checkout.
```

```markdown
`<app_dir>` is `appDir`, the app's repo-relative directory; `<repo_root>/<app_dir>` is the application root, where its source tree sits.
```

  `qa-tester.md`'s `<repo_root>` / `<app_dir>` row carries a one-word variant ("the application's directory"), and takes the same thinning. Old → new:

```markdown
`<app_dir>` is `appDir`, the application's directory inside that checkout, repo-relative.
```

```markdown
`<app_dir>` is `appDir`, the application's repo-relative directory.
```

- [ ] **The layer-scope sentence**, in the six rows that carry it (`task-plan-writer.md`, `task-plan-reviewer.md`, `ui-tests-plan-writer.md`, `review-plan-reviewer.md`, `docs-writer.md`, and `qa-tester.md`'s `<app_root>` row). Replace the fragment only — `review-plan-reviewer.md` continues it with " — and so are the changed paths you map onto them, …", and that continuation and every closing period stay. Old fragment → new:

```markdown
It is **not** what the `layers[].path` scopes of `<layer_path_map>` resolve against: those are repo-relative, like every path in `harness.config.json`, and resolve against `<repo_root>`
```

```markdown
The `layers[].path` scopes of `<layer_path_map>` do not resolve against it: like every path in `harness.config.json`, they resolve against `<repo_root>`
```

- [ ] **The "Bound for completeness" sentence**, in the eleven rows that carry it (`branch-reviewer.md`, `business-parity-reviewer.md`, `conventions-reviewer.md`, `conventions-writer.md`, `review-plan-reviewer.md`, `skeptic-reviewer.md`, `task-plan-reviewer.md`, `task-plan-writer.md`, `ui-tests-plan-writer.md`, `user-review-fix-plan-writer.md`, and `layer-implementer.md`'s `<app_root>` row). Old → new:

```markdown
Bound for completeness — no step in this file consumes `<app_dir>`.
```

```markdown
No step in this file uses `<app_dir>`.
```

  In `layer-implementer.md` the old sentence ends "consumes it."; keep that difference: "Bound for completeness — no step in this file consumes it." becomes "No step in this file uses it."

- [ ] Before saving each file, read its edited row once: it states the same facts as before — an absolute root, the own-worktree case, the bare probe, no nesting, no carrying across calls, what `<app_dir>` is, and that layer scopes resolve against `<repo_root>` — and dropped only "separate calls do not share shell state" (rationale) and "Bound for completeness".

**Verification:**

- The copies match: `git grep -l -F -e 'build every literal path from it. Never nest the' -- plugin/agents` lists exactly the twenty files under Targets; `git grep -l -F -e 'repo-relative directory; ' -- plugin/agents` lists the ten two-part `<app_dir>`-sentence files and `git grep -n -F -e "the application's repo-relative directory." -- plugin/agents/qa-tester.md` prints a line; `git grep -l -F -e 'do not resolve against it: like every path in' -- plugin/agents` lists the six layer-scope files; and `git grep -l -F -e 'No step in this file uses' -- plugin/agents` lists the eleven "Bound for completeness" files.
- The old text is gone: `git grep -l -F -e 'build every literal path from the result' -e 'separate calls do not share shell state' -e 'Bound for completeness' -e 'directory inside that checkout, repo-relative' -e 'resolve against: those are repo-relative' -- plugin/agents` lists nothing, and `git grep -n -F -e 'the checkout this run is executing in' -- plugin/agents` lists only the two out-of-row occurrences, in `committer.md` and `layer-reviewer.md`.
- The literals survive: `git grep -l -F -e 'git rev-parse --show-toplevel' -- plugin/agents` lists at least the twenty files under Targets.
- Each edited file is shorter: record `wc -w` for each before your first edit; after the edit each figure is lower.
