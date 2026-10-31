### 1. `legs-glob.sh`'s header quotes two sentences this branch deleted

**File:** `scripts/lib/sandbox-probe/legs-glob.sh` (the header comment at the top of the file) — "it may skip one, or expand it to the paths that exist when the sandbox" and "base's glob entries cannot be relied on for the run's own copy (Linux may skip a `*` denyWrite"

The header of the probe's glob-deny leg cites two sources by quoted substring. This branch removed or reworded both of them:

1. *"the generated profile's `_README`: "it may skip one, or expand it to the paths that exist when the sandbox starts""*. `cli/src/generators/writeProtection.ts` → `applyWriteProtection` no longer emits that clause, and neither does `cli/templates/claude/settings.autonomous.json` (the "TWO RESIDUALS" and "THREE COMMANDS" lines). The `_README` now states the measured treatment: *"On Linux a `denyWrite` entry containing `*` is expanded against the directories that exist when the sandbox starts, with a placeholder mounted at each absent path it yields"*.
2. *"autonomous-watcher.sh → THE PER-RUN PROFILE: "The base's glob entries cannot be relied on for the run's own copy (Linux may skip a `*` denyWrite entry)""*. That banner in `cli/templates/scripts/autonomous-watcher.sh` (and its self-adopted copy, `scripts/autonomous-watcher.sh`) now reads *"The base's glob entries are not relied on for the run's own copy, and …"*. The "Linux may skip" parenthesis is gone.

So both quoted anchors point at text that no longer exists, and the header still presents "may skip" as the open question the leg measures. The branch answered that question (AP2, 2026-10-30, GW1, 2026-10-29). `docs/sandbox-verification.md`'s GW1 row was already updated to say the `_README` stated the residual *"until `fix_linux_sandbox_sibling_glob_trio`"*. This header was missed because the scope register's derivation command does not search `scripts/`.

**Fix:** rewrite the two quotations in the header so that each one matches text that now exists, and mark the old residual as historical. Replace the opening sentence's parenthesis:

```bash
# legs-glob.sh — the sandbox probe's glob-deny leg (rows GW1, GW2), Linux only: how the Linux sandbox
# treats a `sandbox.filesystem.denyWrite` entry containing `*` (docs/sandbox-verification.md §6; the
# generated profile's `_README` stated, until `fix_linux_sandbox_sibling_glob_trio`, that it "may skip
# one, or expand it to the paths that exist when the sandbox starts").
```

Replace the second quotation:

```bash
# The session runs on a scratch profile, SP__GW_PROFILE, not SP_RUN_PROFILE: the per-run profile also
# carries exact entries for the clone's own paths (autonomous-watcher.sh → THE PER-RUN PROFILE: "The
# base's glob entries are not relied on for the run's own copy"), so a path in the clone is covered by
# a glob alone only once those are removed. …
```

Leave the rest of the header as it is. This is a comment-only change, so it needs no test run.

Before you finish, check that the new quotation's text exists in the banner. In `cli/templates/scripts/autonomous-watcher.sh`, under the `THE PER-RUN PROFILE.` banner, that sentence wraps across two comment lines: one line ends `The base's glob entries are not relied on for the run's`, and the next begins `# own copy, and the base carries no entry`. `git grep` matches one line at a time, so grep for the first line's part only:

```bash
git grep -n "The base's glob entries are not relied on for the run's" -- cli/templates/scripts/autonomous-watcher.sh
```

One match is expected. Then read the comment line after it and confirm that it begins `# own copy`. A grep for the whole sentence finds nothing even after a correct edit, so do not change the quotation to make one match.
