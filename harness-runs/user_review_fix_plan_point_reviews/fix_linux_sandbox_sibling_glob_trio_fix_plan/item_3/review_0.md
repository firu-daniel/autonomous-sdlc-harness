# cli review — ### 3. The clone trust check refuses the empty `config.worktree` Claude Code creates at every session start, so a Linux run copy is refused from its first session — iteration 0

## Nice to Have
1. **The non-inert refusal sentence describes the harness's own clone inaccurately** — `cli/templates/scripts/lib/harness-run-lib.sh` (`hr_clone_target_check_var`) — "and a clone the harness made has none but an empty regular file"
   A clone the harness made has no `config.worktree` or `http-alternates` at all. The empty file comes from the session start, not from the harness. The appended clause also reads as "has nothing except an empty regular file", which is awkward wording for an adopter-facing refusal. No consumer acts differently on it: the check's behaviour is right, and both payload suites' `plantedFile` regexes and case `(h2)`'s `planted` regex match on the unchanged prefix.
   **Fix:** Keep the prefix the regexes match and replace the tail, e.g. `… exists, and a clone the harness made has none; only an empty regular file is accepted`. Apply the same edit to the root twin `scripts/lib/harness-run-lib.sh` and re-run `cmp`.
