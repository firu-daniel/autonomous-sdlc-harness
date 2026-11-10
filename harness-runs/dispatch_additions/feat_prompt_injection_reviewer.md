## [A2 · arch-review · iter 0] → architecture-reviewer  (#41)
- **added:** `context_notes:`
- **verbatim:** context_notes: this checkout has no local `dev` ref; `origin/dev` exists and its merge-base with HEAD is a05560de (source: `git rev-parse --verify dev` exits 1; `git merge-base origin/dev HEAD`)
- **why the agent could not derive it:** the dispatch block's `diff_base: dev` names a ref absent from this run copy; nothing in the agent's read set states that only the remote-tracking ref exists

## [B · review-plan · iter 0] → branch-reviewer  (#53)
- **added:** `context_notes:`
- **verbatim:** context_notes: this checkout has no local `dev` ref (the configured defaultBranch); `origin/dev` exists and its merge-base with HEAD is a05560de (source: `git rev-parse --verify dev` exits 1; `git merge-base origin/dev HEAD`)
- **why the agent could not derive it:** the agent diffs against the configured `defaultBranch` `dev`, a ref absent from this run copy; nothing in its read set states that only the remote-tracking ref exists
