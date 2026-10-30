# Code Review: fix_linux_sandbox_sibling_glob_trio

## Context

**Branch:** `fix_linux_sandbox_sibling_glob_trio`
**Date:** 2026-10-30
**Reviewed:** the whole branch diff against the default branch `dev`, taken from `origin/dev`. No local `dev` ref exists in this run copy; the merge base is `ef7e35be`. The diff covers:

- the run library's new `hr_deny_glob_expand` and `hr_profile_deny_paths` (Task 1);
- the watcher's `run_profile_glob_drops`, the sibling lines of `run_profile_entries`, and the drop-aware `run_profile_render`, `run_profile_check` and `spawn_engine` manifest (Task 2);
- the measured Linux glob statement in `writeProtection.ts`, the settings template and `doctor`'s `profile-write-protection` note (Task 3);
- the self-adopted `scripts/` refresh (Task 4);
- `scripts/sandbox-absent-path-check.sh`'s sibling clone (Task 5);
- `docs/sandbox-verification.md`, `docs/cli.md` §6, `docs/watcher.md`, Gate 15 and the upstream report (Tasks 6–8);
- the tests that ship with all of these.

13 run-artifact files were excluded from the reviewed diff.

**Tests.** Every behaviour change ships with cases:

- the expander's shapes, identity exclusion, literal glob characters and `noglob` refusal (`cli/test/placeholder-sweep-lib.test.mjs`);
- the re-rooted render on a placeholder host, the seam-off render byte-equal to today's, and the launch check accepting exactly the trio drop and refusing any other drop or a check without a copy (`cli/test/watcher-run-profile.test.mjs`);
- the manifest listing glob expansions, and a sibling leftover being swept (`cli/test/watcher-placeholder-host.test.mjs`);
- the `_README` and `doctor` wording (`cli/test/profile.test.mjs`, `cli/test/doctor-profile-sandbox.test.mjs`).

This review runs no suite; whether these pass is the Run gates phase's question. `scripts/lib/harness-run-lib.sh` and `scripts/autonomous-watcher.sh` are byte-identical to their templates. Pass 0's caller check found every new shell function wired: `hr_deny_glob_expand` is called by the library and `run_profile_entries`, and `hr_profile_deny_paths` by `spawn_engine` and the absent-path check. No new TypeScript export was added. The grep half of Pass 0 is unconfigured in this agent's sweep list. **Parity:** `phases.parity` is `false`, so no parity review ran.

**Job mode (lessons ledger → `## Unattended control loops`, "covers every execution mode the failure reaches") — clean pass.** The failure this branch recovers from has two parts. First, the base's sibling-glob trio entries (`<work_root>/<projectName>-*/.git/commondir`, `…/config.worktree`, `…/objects/info/http-alternates`) match the run's own clone, and the glob mounts placeholders there. Second, the clone launch check then refuses that clone for good. Job mode is not reached by either part. The diff supports that, and covers the one part job mode shares:

- **No per-run copy and no clone launch check in job mode.** In `cli/templates/scripts/autonomous-watcher.sh` → `spawn_engine`, the `if [ "$JOB_MODE" = "1" ]` branch sets `settings_file="$SETTINGS_PROFILE"`. It never reaches `run_profile_render` or `hr_run_copy_check_var` ("No launch check: the job's checkout is a main one"). `run_profile_check` gets no `<copy>` there (`[ "$JOB_MODE" = "1" ] || check_copy="$worktree"`), so it applies no drop. Its header says so: "In job mode <file> is $SETTINGS_PROFILE, no <copy> is passed". The header's JOB MODE → "THE PROFILE IS THE BASE, CHECKED" bullet says the same. So the per-run copy's re-rooting has nothing to do in job mode.
- **The glob does not match the job's own checkout.** The job runs in its own main checkout (JOB MODE → "the job's checkout is a main one"; "the job's fresh checkout has no other linked worktree"). The trio globs match only `<projectName>-*` siblings, so the base's glob entries make no placeholder in the job's own `.git`. This is the story index's stated premise ("Job mode is untouched … the job's own checkout is a main checkout, which the glob does not match"), and the code is consistent with it.
- **The shared manifest change covers job mode too.** `spawn_engine`'s placeholder-manifest block is marked "Both modes". It writes to `hr_job_absent_file` in job mode, and it builds the list from `hr_profile_deny_paths "$settings_file"`, which now adds each absent path a remaining `*` entry expands to at launch. So any placeholder that a glob makes in a sibling during a job is recorded and swept, as it is locally.

No job-mode finding is owed.

**Outstanding manual items** (from the story index's **Manual setup required**; not findings):

- `examples/notes-app/.claude/settings.autonomous.json` still carries the three pre-branch `_README` lines ("is unverified - it may skip one…"). Its re-render and the README sentence are owed by hand.
- AP1–AP6 must be re-taken in Gate 15's container on this branch's head before merge. Until then, every statement of the route's Linux effect is correctly marked predicted or owed.

---

## Phase 2 Readiness — Ordered Fix List

1. [x] **Finding 1** — Re-quote the deleted `_README` and watcher-banner sentences in `legs-glob.sh`'s header _(layer: general)_
2. [ ] **Finding 4** — Correct the caller lists in the `hr_deny_glob_expand` / `hr_profile_deny_paths` headers _(layer: cli, general)_
3. [ ] **Finding 3** — Replace `push-branch.sh`'s two "unverified" glob statements with the measured treatment _(layer: cli, general)_
4. [ ] **Finding 2** — Refuse the render when a dropped trio glob cannot be re-rooted, instead of skipping it silently _(layer: cli, general)_

---

## Must Fix

_None._

---

## Should Fix

### 1. `legs-glob.sh`'s header quotes two sentences this branch deleted
→ [finding_1.md](fix_linux_sandbox_sibling_glob_trio_code_review/finding_1.md)

### 2. A trio glob the expander refuses is dropped from the per-run copy and never re-rooted, with no refusal
→ [finding_2.md](fix_linux_sandbox_sibling_glob_trio_code_review/finding_2.md)

### 3. `push-branch.sh`'s header still calls the Linux treatment of a globbed `denyWrite` entry unverified
→ [finding_3.md](fix_linux_sandbox_sibling_glob_trio_code_review/finding_3.md)

### 4. `hr_deny_glob_expand`'s header names a caller that does not call it, and names a script an adopter never has
→ [finding_4.md](fix_linux_sandbox_sibling_glob_trio_code_review/finding_4.md)

---

## Nice to Have

_None._

---

## Out of scope / verified-OK (intentional divergences / call-outs)

This section is empty: `phases.parity` is `false`, so there is no reference implementation to diverge from.
