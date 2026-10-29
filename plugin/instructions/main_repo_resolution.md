# Main-checkout resolution — the `<MAIN_REPO>` fallback (canonical, single source of truth)

Load this file only when a bare `printenv HARNESS_MAIN_REPO` printed nothing, and resolve `<MAIN_REPO>` by `## The fallback` below. A reader whose `printenv HARNESS_MAIN_REPO` printed a path uses that path and never opens this file.

This rule is its own file rather than a section of `${CLAUDE_PLUGIN_ROOT}/instructions/dispatch_discipline_instructions.md`, because that file's `## Activation` closes the set of documents that may point at it.

## Resolved values

| Token | Class | How to resolve it |
|---|---|---|
| `<MAIN_REPO>` | derived at runtime | The main checkout's absolute path — what this file resolves, by `## The fallback`. |
| `<copy>` | derived at runtime | The root of the checkout you are running in, taken at step F1. |
| `<candidate>` | derived at runtime | The directory the alternates file names, taken at step F3. |

## The fallback

Run every command **bare and literal**: no substitution, no variable, no pipe, no wrapping command. The only commands are `git rev-parse --show-toplevel`, `git rev-parse --abbrev-ref HEAD` and `git worktree list --porcelain`, each run in the checkout you are in; read every file with the `Read` tool, never with a shell command.

**Reading a file.** A `Read` answer that the file does not exist means the file is absent, and so does an `ENOTDIR` / "not a directory" answer — which is what F2's read returns in a linked worktree, whose `<copy>/.git` is a pointer file. A file the `Read` tool cannot read for any other reason — refused, denied, a directory, any other error — is a stop, never an absence.

**Comparing.** Every comparison below is a literal string comparison of the paths as written. A spelling mismatch stops you; it never gives a wrong answer.

**The stop.** Write one sentence beginning exactly `cannot resolve the main checkout — `, naming the step that failed and the path it read: `cannot resolve the main checkout — F<n> failed reading <path>: <what it could not establish>.` Then do nothing that needs `<MAIN_REPO>`, and **never** use `<copy>` in its place.

1. **F1.** Run `git rev-parse --show-toplevel`; its output is `<copy>`. No output, or an error: stop.
2. **F2.** `Read` `<copy>/.git/objects/info/alternates`. If it does not exist, this is not a clone: `<MAIN_REPO>` is the first `worktree ` line of a bare `git worktree list --porcelain`, with the `worktree ` prefix removed — the checkout itself in a main checkout or an ordinary repository, and its main checkout in a linked worktree. You are done. If it exists, continue at F3.
3. **F3.** The alternates file holds exactly one line, and that line is an absolute path ending in `/.git/objects`. Anything else: stop. `<candidate>` is that line with `/.git/objects` removed.
4. **F4.** `<candidate>` is not `<copy>`: equal strings stop. `Read` `<candidate>/.git/HEAD`; it must read, which shows `<candidate>/.git` is a directory. `Read` `<candidate>/.git/commondir`; only a "does not exist" answer passes.
5. **F5.** Run `git rev-parse --abbrev-ref HEAD`; its output is `<branch>`. An output of `HEAD` is a detached HEAD: stop.
6. **F6.** `Read` `<candidate>/harness.config.json`. Take `stateDir` from it, default `sdlc-harness`, with any trailing `/` removed, and `projectName`, default the last path segment of `<candidate>`. A config that does not exist takes both defaults. `Read` the registry, `<candidate>/<stateDir value>/autonomous_logs/registry.json`. Its `.runs` object must hold a `<branch>` entry whose `copy_kind` is `clone` and whose `worktree` is `<copy>`. Anything else: stop.
7. **F7.** Build `<parent of candidate>/<projectName>-<branch>`, with every `/` in `<branch>` turned into `-` and `<parent of candidate>` being `<candidate>` with its last path segment removed. It must equal `<copy>`. Anything else: stop.
8. **F8.** Every check held: `<MAIN_REPO>` is `<candidate>`.

## What this repeats of the outer loop's clone check, and what it drops

The outer loop's clone check is `cli/templates/scripts/lib/harness-run-lib.sh` → `hr_clone_target_check_var`; its conditions are numbered in that function's header comment.

- **Repeated.** F6 is its condition 1, F7 its condition 2 and F3 its condition 4. F4 is the main-checkout test, plus the rule that the reader never uses the copy itself.
- **Dropped.**
  - Conditions 3 and 5. They protect the git calls an unsandboxed wrapper makes inside the clone, and this reader makes none.
  - The canonical-path comparison. No allow-listable literal command canonicalises a path, so a spelling mismatch stops the reader instead.
  - Condition 1's read of the `HEAD` file. F5's bare `git rev-parse --abbrev-ref HEAD` replaces it.
- **Platform posture.** `docs/sandbox-verification.md` row CL5 shows a sandboxed command's write-open of the alternates file refused on macOS; on Linux the row is unmeasured (`blocked: F9`). So nothing trusts the alternates file alone: F6 needs a registry at the candidate that records this copy at this path, and the main checkout's own registry is write-protected; F7 puts the candidate at the work root. The residual is a directory at the work root shaped as a main checkout, with its own registry naming this copy.
- **Known cost.** A main checkout that itself borrows objects through `alternates` takes the clone arm and stops. Such a repository sets `HARNESS_MAIN_REPO` instead.
- **No new permission.** The commands are covered by the profile's `Bash(git rev-parse:*)`, `Bash(git worktree:*)` and its two `Read(…/**)` rules, so the unattended profile needs no new one.

## Who may cite this

These documents point at `## The fallback`:

- `${CLAUDE_PLUGIN_ROOT}/agents/committer.md`
- `${CLAUDE_PLUGIN_ROOT}/agents/qa-tester.md`
- `${CLAUDE_PLUGIN_ROOT}/commands/branch-answer.md`
- `${CLAUDE_PLUGIN_ROOT}/commands/branch-pause.md`
- `${CLAUDE_PLUGIN_ROOT}/commands/branch-prompt.md`
- `${CLAUDE_PLUGIN_ROOT}/commands/branch-resume.md`
- `${CLAUDE_PLUGIN_ROOT}/commands/branch-start-docs-autonomous.md`
- `${CLAUDE_PLUGIN_ROOT}/commands/branch-start-plan-autonomous.md`
- `${CLAUDE_PLUGIN_ROOT}/commands/branch-start-user-review-fix-autonomous.md`
- `${CLAUDE_PLUGIN_ROOT}/commands/branch-status.md`
- `${CLAUDE_PLUGIN_ROOT}/commands/branch-user-review.md`
- `${CLAUDE_PLUGIN_ROOT}/docs/AUTONOMOUS_FLOW.md`
- `${CLAUDE_PLUGIN_ROOT}/instructions/autonomous_pause_and_ledger.md`
- `${CLAUDE_PLUGIN_ROOT}/instructions/clarification_digest_instructions.md`
- `${CLAUDE_PLUGIN_ROOT}/instructions/dispatch_discipline_instructions.md`
- `${CLAUDE_PLUGIN_ROOT}/instructions/docs_orchestration_instructions_autonomous.md`
- `${CLAUDE_PLUGIN_ROOT}/instructions/improvement_observations_instructions.md`
- `${CLAUDE_PLUGIN_ROOT}/instructions/plan_orchestration_instructions_autonomous.md`
- `${CLAUDE_PLUGIN_ROOT}/instructions/task_plan_writing_instructions_autonomous.md`
- `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fix_plan_writing_instructions_autonomous.md`
- `${CLAUDE_PLUGIN_ROOT}/instructions/user_review_fixes_instructions_autonomous.md`
- `cli/src/doctor/checks.ts` — the `PROFILE_MAIN_ANCHOR_CHECK` doc comment and `warn(…)` message
- `docs/watcher.md` — `### The main-checkout anchor`, **Read.**
- `docs/cli.md` — the main-checkout anchor-rule bullet
- `docs/sandbox-verification.md` — the dated note **2026-10-29: AN5–AN6 are owed measurements, not results, …**
- `cli/test/main-root-fallback.test.mjs` — the header's *Not covered* paragraph

A citer **points and never restates**, and **no document beyond these 26 points at `## The fallback`.** A document not on this list does not point here. An edit that rewords or moves the heading updates every roster member in the same change.
