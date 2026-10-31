# cli review — ### 1. The file tools can write a `commondir`, `config.worktree` or `http-alternates` with content into a Linux run copy: add a `PreToolUse` guard for `Edit|Write|NotebookEdit` that refuses them on every platform — iteration 1

Scope: `cli/test/git-trust-file-guard.test.mjs` (new, untracked), against `harness-runs/user_reviews/fix_linux_sandbox_sibling_glob_trio_fix_plan_2/finding_1.md` step 4 and `.claude/context/cli.md` / `.claude/context/conventions.md` → `## The testing bar`.

Executed: the suite's body, as carried by `harness-runs/scratch/trust-guard-probe.mjs` (read side by side with the test file: identical from the `TOOLS` declaration to the end, differing only in its absolute helper import and its `GUARD` path argument), was run with `bash scripts/scratch-run.sh harness-runs/scratch/trust-guard-probe.mjs <guard>`. Against `trust-guard-ref.bash` it gave 83 pass / 0 fail. Against `trust-guard-broken.bash` it gave 70 pass / 13 fail: every `upperCase` case and every symlinked-leaf case. That matches the `RED ONCE` line and the recorded deviation.

## Should Fix

1. **The relative-path case cannot tell whether `.cwd` is used** — `cli/test/git-trust-file-guard.test.mjs` (`relative .git/commondir resolved against cwd: deny`) — "runGuard(root, payloadFor(tool, '.git/commondir', repo))"
   Any base you join the relative path `.git/commondir` to still gives a path ending in `/.git/commondir`, so the lexical test refuses it whether the guard resolves against `.cwd` or against `$PWD`. The subtest title claims more than the case checks. A `plugin`-layer guard that ignores `.cwd` (step 2 → Normalisation, step 1) would pass. **Executed:** a copy of the reference guard with `abs=${cwd:-$PWD}/$given` changed to `abs=$PWD/$given` (`harness-runs/scratch/review-ignore-cwd.bash`). `bash scripts/scratch-run.sh harness-runs/scratch/trust-guard-probe.mjs review-ignore-cwd.bash` gave 83 pass / 0 fail, and all three `relative … resolved against cwd` subtests passed.
   **Fix:** Pick a relative path whose verdict depends on the base. Example: payload `cwd` = `join(repo, '.git')`, `file_path` = `'commondir'`, guard run from `root`. Against `.cwd` that is `<repo>/.git/commondir` → deny. Against `$PWD` it is `<root>/commondir` → silent. Optionally add the reverse silent case: `cwd` = `repo`, `file_path` = `'commondir'`, guard run from `join(repo, '.git')` → silent.

2. **"Not covered" points at REPRO coverage the plan does not ask for** — `cli/test/git-trust-file-guard.test.mjs` (header) — "the guard's own `REPRO` block reproduces those by hand"
   The header says the missing-`jq`, too-old-`jq`, failing-`readlink` and hop-limit outcomes are reproduced in the guard's `REPRO` block. Step 2 → **The REPRO block** in the task file lists only these: the trio, a path under each, `..`, symlinked parent, `.bak` / outside-`.git` silent, and non-JSON. None of the four outcomes this header cites is on it. A `plugin`-layer implementer following the plan would ship a guard without them. A maintainer reading this header would then think those fail-closed paths are reproducible when nothing reproduces them.
   **Fix:** Either cut the clause down to what is true ("not covered here; reproduce by hand"), or add those four outcomes to the task file's step 2 REPRO list (a `**Deviations from plan:**` sub-bullet) so the `plugin` layer delivers them.

## Nice to Have

1. **The missing-`jq` refusal is reachable from this suite** — `cli/test/git-trust-file-guard.test.mjs` (header) — "which need a `PATH` without `jq` that still holds `bash`"
   The reason given is not really a barrier. `runBash(cwd, args, env)` applies `env` over the isolated environment, so a case can point `PATH` at a temp directory holding only a `bash` symlink, and run `bash` by absolute path inside the `-c` string. That refusal is the most far-reaching departure the plan makes: it refuses every file-tool call in a session that loads the plugin. A subprocess can assert it cheaply. Confirmed by reading `cli/test/helpers/fixture.mjs` → `runBash`, not executed.
   **Fix:** Add one case: a temp `bin/` with `bash` symlinked in, `PATH` set to it, and the guard fed an ordinary `Write` payload → `assertDenied(result, 'jq')`. Then drop missing-`jq` from "Not covered".

2. **Malformed-input refusals do not check what the reason names** — `cli/test/git-trust-file-guard.test.mjs` (`malformed input, ${name}: deny`) — "assertDenied(await runGuard(repo, payload));"
   Step 2 → **Fail closed** asks for "a reason naming what could not be read". These cases only check that a reason is a string. A fixed reason fragment per case (the tool name, or the path field) would pin that contract down.
   **Fix:** Pass a fragment per malformed case once the `plugin` layer fixes the reason wording. At minimum, check that each reason starts with `git-trust-file-guard:`.
