### 1. `NTFY_TOPIC_PATTERN` is exported with no caller outside its defining file

**File:** `cli/src/generators/notifications.ts` (`NTFY_TOPIC_PATTERN`) — "export const NTFY_TOPIC_PATTERN"

The branch adds eight new exported symbols. The Pass 0 caller check greps every `layers[].path` scope (`cli`, `plugin`, `.`) for a use outside the defining file. Seven have one. `NTFY_TOPIC_PATTERN` has none: its only reader is `resolvePushDestination` in the same module ("if (NTFY_TOPIC_PATTERN.test(topic))"). No test imports it, and no other `cli/src` module does either. (`PushDestination` has no caller by name either, but it is the declared return type of `resolvePushDestination`, and `init.ts` consumes that through `.kind`. It is part of the signature of an export that is used, so it is not in scope for this finding.)

This is not an un-wired feature. The grammar is wired through `resolvePushDestination` and tested there; only the `export` keyword has no importer. The export is also plan-correct: `harness-runs/task_plans/feat_harness_init_notification_topic_prompt/task_1_plan.md` → **Work**, first bullet, prescribes the constants "exported with these exact names and shapes", `NTFY_TOPIC_PATTERN` among them. No conventions document bans an export with no importer, and no gate reports it. The fix is a narrowing of the module's public surface: `resolvePushDestination`'s doc comment says it is the one entry point for this grammar ("it is the only grammar for this value, and every entry point calls it"), and making the pattern module-private keeps the surface consistent with that statement. The same branch already made this narrowing on the sibling constant `GUIDED_ENDPOINT_EXAMPLE`, which is now module-private with a comment saying why.

**Fix:** remove the `export` keyword and keep the declaration and its doc comment otherwise unchanged:

```ts
/** The ntfy server's own topic-name rule; a name outside it is one the server would refuse. */
const NTFY_TOPIC_PATTERN = /^[-_A-Za-z0-9]{1,64}$/;
```

Then confirm that nothing imports it: `git grep -n NTFY_TOPIC_PATTERN -- cli plugin docs` must list only `cli/src/generators/notifications.ts`. Also confirm that `bash scripts/typecheck.sh` and `bash scripts/test.sh` still exit 0, run without a pipe.

**Deviations from plan:** `bash scripts/test.sh` exited 1, not 0. Gate 4 (`npm test`) passed. The three failing gates are outside this diff: `1a plugin manifest` (hook-command quoting warnings in `plugin/hooks/hooks.json`), `6a no machine paths` (the worktree's own `.git` pointer file and `harness-runs/` artifacts), and `11 docs-retrieval relevance floor` (the retrieval runtime is not installed). `bash scripts/typecheck.sh` exited 0.
