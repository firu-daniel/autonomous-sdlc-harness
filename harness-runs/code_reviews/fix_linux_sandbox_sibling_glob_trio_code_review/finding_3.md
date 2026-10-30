### 3. `push-branch.sh`'s header still calls the Linux treatment of a globbed `denyWrite` entry unverified

**File:** `cli/templates/scripts/push-branch.sh` (the `THE PER-WORKING-COPY CONFIG IS NOT TRUSTED.` header paragraph) — "and how the Linux sandbox treats one is" … "unverified." and "which is unverified on" … "Linux.". The same two sentences are in the self-adopted copy `scripts/push-branch.sh`.

This branch measured and recorded how Linux treats a `denyWrite` entry containing `*`, and rewrote every other shipped statement of it. Those rewrites cover the generated `_README` (`writeProtection.ts`, `settings.autonomous.json`), `doctor`'s `profile-write-protection` note, the run library's `hr_wrapper_target_check_var` header and the watcher's `THE PER-RUN PROFILE` banner. The measured treatment:

- the entry is expanded against the directories that exist when the sandbox starts, and a placeholder is mounted at each absent path (AP2, 2026-10-30, Claude Code 2.1.314, bubblewrap 0.8.0);
- a new file under an existing directory that only such an entry covered was written, not refused (GW1, 2026-10-29, Claude Code 2.1.312).

`push-branch.sh` is a shipped template that every adopter receives, and its header still says twice that the treatment is "unverified". A reader of that header still meets the old open question, although the measured answer is now the reason the pin and the `config.worktree` check matter: on Linux a globbed entry does not refuse a new file under the directory it matches.

**Fix:** in `cli/templates/scripts/push-branch.sh`, replace

```
# a globbed profile entry can name it, and how the Linux sandbox treats one is
# unverified. `setup-worktree.sh`
```

with

```
# a globbed profile entry can name it, and on Linux such an entry is expanded
# only against the directories present at sandbox start and did not refuse a new
# file under one (docs/sandbox-verification.md §5 AP2, §8 GW1). `setup-worktree.sh`
```

and replace

```
# directory is protected only by a globbed `denyWrite`, which is unverified on
# Linux. The pin accepts only `<main>/<githooksDir>` or
```

with

```
# directory is protected only by a globbed `denyWrite`, which on Linux did not
# refuse a new file under it (GW1). The pin accepts only `<main>/<githooksDir>` or
```

Then copy the edited template byte for byte over `scripts/push-branch.sh`, so the self-adopted copy stays identical. This is a comment-only change, so it needs no test run.
