## Row A's commit_prefix rule and the repository's commit policy name different prefixes for a task commit
- **category:** agent-contract
- **evidence:** `plugin/instructions/unit_loop_core.md` (main checkout) → `## Substitution table`, row `A`, `commit_prefix rule` cell: "from the branch name: `feat_` → `feat`, `fix_` → `fix` …". `.claude/context/conventions.md` → `## Commit-message policy`: a story task's commit takes prefix **`none`**. The orchestrator followed row A and sent `commit_prefix: fix` for Task 1; the committer applied it and reported in its return that the subject breaks the policy. Commit `30bd48e5` landed and was pushed with the subject `fix: Task 1 — Skip linked bundle sources and resolve trusted stateDir`. Tasks 2–4 were sent `commit_prefix: none` and landed unprefixed (`7d8227b9`, `72db58d3`, `d76299dc`). The branch-reviewer raised the same subject under `## Questions`.
- **cost this run:** one task commit on the branch carries a prefix the repository forbids; correcting it needs a history rewrite or a squash-merge reword.
- **hypothesis:** (guess) row A's rule predates the committer reading the adopter's commit policy, which the fix rows already defer to.

## The committer landed a subject over the repository's 72-character cap after checking a shorter draft
- **category:** agent-contract
- **evidence:** commit `1784b43d`, subject `Add a (TR) case proving restore writes under the trusted stateDir (Finding 3)` (77 characters), landed and was pushed by the `committer` dispatch for code-review Finding 3. The committer's own return: "I checked a 73-character draft, then sent a longer one without checking it again." The cap is `.claude/context/conventions.md` → `## Commit-message policy` → **Subject-length cap: 72 characters.**
- **cost this run:** one pushed commit breaks the subject cap; correcting it needs a history rewrite or a squash-merge reword.
