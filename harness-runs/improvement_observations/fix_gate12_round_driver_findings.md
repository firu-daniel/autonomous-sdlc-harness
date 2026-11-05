## The configured default branch has no local ref in the run copy, so `<default_branch>..HEAD` ranges cannot resolve as written
- **category:** agent-contract
- **evidence:** `harness.config.json` sets `defaultBranch` to `dev`; in this checkout `git rev-parse --verify dev` printed `fatal: Needed a single revision` (rc 128) while `git rev-parse --verify origin/dev` resolved. The `branch-reviewer` (Phase B) return and the `statistics-plan-writer` (Phase D.1) return each reported independently that no local `dev` branch exists and that it fell back to `origin/dev`. The Phase-D disposition derivation in this session was likewise run over `origin/dev..HEAD` rather than the `dev..HEAD` its instruction spells.
- **cost this run:** two sub-agents and the orchestrator each improvised the same fallback; no wrong result observed, but the documented range was not runnable as written.
- **hypothesis:** (guess) the instructions that spell `<default_branch>..HEAD` predate run copies cut from `origin/<default_branch>` without a local branch of that name.

## The branch-reviewer's grep-sweep table had no patterns for this project
- **category:** agent-contract
- **evidence:** the `branch-reviewer` (Phase B) return stated: "found nothing to run, because the sweep table in my instructions has no patterns filled in for this project".
- **cost this run:** the grep-sweep pass of the end-of-branch review ran zero checks.
