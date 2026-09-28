## Story-task commits got inconsistent prefixes under one dispatch shape
- **category:** agent-contract
- **evidence:** All four Phase-A `mode: task` committer dispatches carried `commit_prefix: fix`, taken from the unit loop's row-`A` `commit_prefix rule` (`fix_` branch → `fix`). The committers for Tasks 1 and 2 dropped it, citing `.claude/context/conventions.md` → `## Commit-message policy` (a story task's commit takes no prefix): `bc95ff8 Export unresolvedRetrievalPeers from the retrieval runtime, Task 1`, `d58940d Replace the eval runtime refusal with a local-peers refusal, Task 2`. The committers for Tasks 3 and 4 applied it: `b2ca85c fix: Grade missing local peers as BLOCKED in eval gates, Task 3`, `91a6734 fix: Describe what gate 11 now depends on in three docs, Task 4`. The Phase B `branch-reviewer` raised the two `fix:` subjects as a `## Questions` entry, since a file-editing fix loop cannot reword commits.
- **cost this run:** two of four task commits break the project commit policy, and the maintainer has to reword them before merging (or rely on a squash merge).
- **hypothesis:** the row-`A` rule and the committer's policy-first contract disagree for story tasks, and each committer settles the conflict its own way.

## A syntax check of a gate script was refused by the permission profile
- **category:** tooling-gap
- **evidence:** Task 3's `layer-implementer` ran `bash -n scripts/run-gates.sh` as a verification step, and it was refused with "This command requires approval". The parse check rested on reading the script, and the Run gates phase later ran the script in full (round 1: `pass`).
- **cost this run:** Task 3 committed an edit to `scripts/run-gates.sh` without a syntax check at unit time.
