## The plan writer reported corpus staleness in the shared conventions document
- **category:** tooling-gap
- **evidence:** both `task-plan-writer` returns this run (the initial write and the revision) carried a `## Corpus staleness` section with one `stale-rule` entry: `.claude/context/conventions.md` → `## Not determined`, the `forge` bullet, says the draft-pull-request output, comment-based park-and-ask and the rest of the forge coupling "read nothing yet". `cli/templates/scripts/remote-run.sh`'s `deliver`, `report` and `control` verbs already read `forge`, and this branch adds `open` and `report progress` as readers.
- **cost this run:** none on this branch. A follow-up restatement of that bullet is owed: a supervised `/autonomous-sdlc-harness:harness-analyze .claude/context/conventions.md` re-run, or a hand edit.

## Story-task commits got different subject prefixes from the same committer argument
- **category:** agent-contract
- **evidence:** every Phase A `committer` dispatch passed `commit_prefix: feat`, as `plugin/instructions/unit_loop_core.md` row `A`'s `commit_prefix rule` derives it from the branch name. The commits for Tasks 1–4 (c85d624, eaf294e, d87508b, 072f8d3) carry no prefix, and each of those committers reported overriding the argument because `.claude/context/conventions.md` → `## Commit-message policy` gives story-task commits the prefix `none`. The commits for Tasks 5–19 (e8da051 through 8fd6933) carry `feat:`, from the same argument and the same policy. The fix-row commits, dispatched with `commit_prefix: none`, all carry no prefix.
- **cost this run:** 15 of the branch's 19 story-task commits carry a prefix the repository's commit policy does not allow, and the branch's history is inconsistent with itself.
- **hypothesis:** row `A`'s rule names a fixed branch-name mapping, while the fix rows' rule defers to the committer's policy, so each committer settles the conflict differently.
