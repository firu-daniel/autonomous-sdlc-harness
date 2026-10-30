### 4. `hr_deny_glob_expand`'s header names a caller that does not call it, and names a script an adopter never has

**File:** `cli/templates/scripts/lib/harness-run-lib.sh` (the header comments of `hr_deny_glob_expand` and `hr_profile_deny_paths`) — "Its callers:" … "this repository's" … "`scripts/sandbox-absent-path-check.sh`.". The same text is in the self-adopted copy `scripts/lib/harness-run-lib.sh`.

There are two problems in these headers.

1. **A wrong caller.** `hr_deny_glob_expand`'s header lists *"`hr_profile_deny_paths`, `autonomous-watcher.sh` and this repository's `scripts/sandbox-absent-path-check.sh`"* as its callers. `scripts/sandbox-absent-path-check.sh` never calls `hr_deny_glob_expand`; it calls only `hr_profile_deny_paths` (in `write_entries` and `write_manifest`). `git grep -n hr_deny_glob_expand -- '*.sh'` finds calls only in the library itself and in `autonomous-watcher.sh` → `run_profile_entries`. A maintainer changing the expander's contract would be sent to check a script that does not depend on it.
2. **A script only the harness's own repository has.** This library is a template that `init` copies into every adopting repository. In an adopter's checkout, "this repository's `scripts/sandbox-absent-path-check.sh`" names a file that does not exist. That script is hand-written for the harness's own source repository (its header: *"not in the set `init --force` regenerates, and not a cli/templates/ file"*). `hr_profile_deny_paths`' header uses the same wording.

**Fix:** in `cli/templates/scripts/lib/harness-run-lib.sh`, change the last sentence of `hr_deny_glob_expand`'s header from

```
# Prints only; creates, removes and logs nothing. Its callers:
# `hr_profile_deny_paths`, `autonomous-watcher.sh` and this repository's
# `scripts/sandbox-absent-path-check.sh`.
```

to

```
# Prints only; creates, removes and logs nothing. Its callers:
# `hr_profile_deny_paths` and `autonomous-watcher.sh` → `run_profile_entries`.
```

and the last sentence of `hr_profile_deny_paths`' header from

```
# <profile> is unreadable or that value is not a list. Its callers:
# `autonomous-watcher.sh` and this repository's
# `scripts/sandbox-absent-path-check.sh`.
```

to

```
# <profile> is unreadable or that value is not a list. Its callers:
# `autonomous-watcher.sh` → `spawn_engine`, and, in the harness's own source
# repository only, `scripts/sandbox-absent-path-check.sh`.
```

Then copy the edited template byte for byte over `scripts/lib/harness-run-lib.sh`, so the self-adopted copy stays identical. This is a comment-only change, so it needs no test run.
