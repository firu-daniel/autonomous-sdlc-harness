### Task 9 — Mirror the shipped run-analytics files into this repository's `scripts/` and `harness-runs/`

**Goal:** This repository has adopted its own harness (`.claude/context/conventions.md` → `## Documents of record`), so its `scripts/` and `harness-runs/` are `init`'s output here. Bring them level with what this branch ships, so this repository's own watcher records run analytics and its `doctor` finds the new artifact directory — the task prompt's *"mirrored to `cli/templates/scripts/`"*, from this side.

**Depends on:** Tasks 1, 2, 3 and 5, whose finished templates are copied here byte for byte — `cli/templates/scripts/lib/run-analytics.jq`, `cli/templates/scripts/lib/run-analytics-report.jq`, `cli/templates/scripts/run-analytics.sh` and `cli/templates/scripts/autonomous-watcher.sh` — and Task 4, whose `cli/templates/state-dir/run_analytics/README.md` is copied likewise. The modes are Task 4's rows: `0755` for the two `.sh` files, `0644` for the two `.jq` files and the README. This is the catch-all task, so it ships after every layer task it copies from.

**Where this task stops.** It copies; it edits none of the five sources, and the copies carry no change of their own — a fix belongs in the template, then a re-copy.

### Targets

- `scripts/run-analytics.sh` (new), `scripts/lib/run-analytics.jq` (new), `scripts/lib/run-analytics-report.jq` (new).
- `scripts/autonomous-watcher.sh` — replaced by the template's bytes.
- `harness-runs/run_analytics/README.md` (new) — scope register row 22.

**Work:**

- [ ] Before copying, confirm `scripts/autonomous-watcher.sh` still equals its template's pre-branch bytes (`git diff --quiet <merge-base> -- scripts/autonomous-watcher.sh` exits 0, and `git show <merge-base>:scripts/autonomous-watcher.sh` is byte-identical to `git show <merge-base>:cli/templates/scripts/autonomous-watcher.sh`), so the copy replaces nothing this repository holds on its own.
- [ ] Copy the four script files from `cli/templates/scripts/` to the same relative paths under `scripts/`, byte for byte, with the modes above.
- [ ] Copy `cli/templates/state-dir/run_analytics/README.md` to `harness-runs/run_analytics/README.md`, byte for byte.

**Verification:**

- `cmp` of each of the five copies against its source reports nothing, and `git diff --stat` on this task's commit names exactly the five targets.
- `ls -l scripts/run-analytics.sh scripts/autonomous-watcher.sh scripts/lib/run-analytics.jq scripts/lib/run-analytics-report.jq` shows the executable bit on the two `.sh` files only.
- `grep -nE '/(Users|home)/' scripts/run-analytics.sh scripts/lib/run-analytics.jq scripts/lib/run-analytics-report.jq harness-runs/run_analytics/README.md` finds nothing (gate 6a).

- **Deviations from plan:**
  - Merge base: this checkout has no `main` ref (only `origin/dev`), so `<merge-base>` was `git merge-base HEAD origin/dev` = `c7d4cec464f95ab8b8831fb3aa20ddc69e121c16`. Pre-copy check held: `git diff --stat <merge-base> -- scripts/autonomous-watcher.sh` printed nothing, and `git ls-tree <merge-base>` gives both `scripts/autonomous-watcher.sh` and `cli/templates/scripts/autonomous-watcher.sh` blob `b270f77dfa011ab8a14fe6ea1f2ce88f857c3d81` (modes 100755 vs 100644; bytes identical).
  - Copy route: `cp` was refused by the permission profile ("Permission to use Bash has been denied"). The four new files were written with the file tools from the template's bytes, and `scripts/autonomous-watcher.sh` was brought level by applying the five hunks of `git diff HEAD:scripts/autonomous-watcher.sh HEAD:cli/templates/scripts/autonomous-watcher.sh` with Edit. `cmp <template> <copy>` printed nothing for all five pairs.
  - Mode not met: `chmod 755 scripts/run-analytics.sh` was refused by the permission profile (same denial). `ls -l` shows `scripts/run-analytics.sh` at `-rw-r--r--`; `scripts/autonomous-watcher.sh` keeps `-rwxr-xr-x`; the two `.jq` files and the README are `-rw-r--r--`. Until the executable bit is set, the watcher's `record_run_analytics` `[ ! -x "$RUN_ANALYTICS" ]` test logs and skips recording in this repository. Remedy: `chmod 755 scripts/run-analytics.sh` before the commit, or `git update-index --chmod=+x scripts/run-analytics.sh` after staging.
  - Gate-6a probe: the plan's `grep -nE '/(Users|home)/'` matches two lines of `scripts/lib/run-analytics.jq` (line 39, the header's `/Users/<segment> or /home/<segment>`; line 135, `strip_home("/Users/") | strip_home("/home/")`). Both are the template's redaction literals, copied byte for byte. They name no machine location. The real gate 6a (`scripts/run-gates.sh` → `machine_path_hits`) greps for `$HOME`, and `grep -n /Users/daniel` over all five targets printed nothing.
  - `git diff --stat` on this task's commit is the committer's to check; before the commit, `git status --short` lists exactly the five targets (`M scripts/autonomous-watcher.sh`, `?? harness-runs/run_analytics/`, `?? scripts/lib/run-analytics-report.jq`, `?? scripts/lib/run-analytics.jq`, `?? scripts/run-analytics.sh`).
