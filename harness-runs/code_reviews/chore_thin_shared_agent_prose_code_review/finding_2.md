### 2. review-plan-reviewer's thinned `<repo_root>` / `<app_dir>` row leaves "and so are the changed paths" with no predicate to refer back to

**File:** `plugin/agents/review-plan-reviewer.md`, `## Resolved values`, the `<repo_root>` / `<app_dir>` row: "they resolve against `<repo_root>` — and so are the changed paths you map onto them".

**Problem.** Before Task 5, the row's tail read: "It is **not** what the `layers[].path` scopes of `<layer_path_map>` resolve against: those **are repo-relative**, like every path in `harness.config.json`, and resolve against `<repo_root>` — and so are the changed paths you map onto them, which `git diff --name-only` emits relative to the repository root." There, "and so are" pointed back to "are repo-relative".

Task 5 changed the shared sentence to "The `layers[].path` scopes of `<layer_path_map>` do not resolve against it: like every path in `harness.config.json`, they resolve against `<repo_root>`". The shared sentence is correct in the five other copies. This file's own tail was kept, and it now reads "they resolve against `<repo_root>` — and so are the changed paths you map onto them". "Are" no longer has a predicate to stand in for, so the clause is ungrammatical. It also no longer says outright what it said before: the changed paths resolve against `<repo_root>` too. A careful reader can still work out the meaning, so no consumer decision turns on it. It is unclear durable prose that this branch introduced.

**Fix.** Change one word in this file's own tail and leave the shared sentence alone.

Old:

```
they resolve against `<repo_root>` — and so are the changed paths you map onto them, which `git diff --name-only` emits relative to the repository root.
```

New:

```
they resolve against `<repo_root>` — and so do the changed paths you map onto them, which `git diff --name-only` emits relative to the repository root.
```

The word count is unchanged.

- [ ] Apply the replacement in `plugin/agents/review-plan-reviewer.md`.
- [ ] Verify: `git grep -n -F -e 'and so are the changed paths' -- plugin` prints nothing, and `git grep -l -F -e 'and so do the changed paths you map onto them' -- plugin/agents` lists only `plugin/agents/review-plan-reviewer.md`.

No test run is involved.
