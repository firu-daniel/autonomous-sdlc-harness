### Task 6 — Add the `glob-deny` leg (GW1, GW2)

**Goal:** Measure how the Linux sandbox treats a `denyWrite` entry containing `*`. This is the first point `docs/sandbox-verification.md` → §6 lists as never measured on Linux, and the residual the generated profile's `_README` states (*"how the Linux sandbox treats the globbed `denyWrite` entries is unverified - it may skip one, or expand it to the paths that exist when the sandbox starts"*).

The leg makes a sandboxed write to a clone path that **only** a `*` entry of the base profile covers. It records whether the write is refused, once for a path that exists when the session starts (**GW1**) and once for one that does not (**GW2**). Both rows are **recorded, not graded on what they find**. The task prompt asks *whether* the write is refused, and states no expectation.

**Depends on:**

- **Task 2.** The leg table declares `glob-deny` with rows `GW1,GW2`. `scripts/sandbox-probe.sh` sources `scripts/lib/sandbox-probe/legs-glob.sh` when present, and calls `sp_leg_glob_deny` only when `SP_PLATFORM` is `linux` (`sp_leg_platform_skip` otherwise).
- **Task 3** (`judge.sh`). On Linux, `Read-only file system` is layer `sandbox`. A `sandbox`-expected call that errors with no known string is layer `unrecognised`, verdict `not run`.

It reuses, unchanged:

- `session.sh` → `sp_session`, `sp_departures`, `sp_prompt_new`, `sp_prompt_bash`, `sp_track`, `sp_dd_cmd`, `SP_DD_RULE`, `SP_RUN_PROFILE`, `SP_CLONE`, `SP_TMP`;
- `controls.sh` → `sp_ctl_prepare`, `sp_ctl_add <pfile> written <command> <path>`, `sp_ctl_held`, `sp_row_result`;
- `judge.sh` → `sp_judge_call`.

**Where this task stops.** It adds one new library file and edits nothing else. Task 18 tests its grading and target functions. Gate 15's account is Task 11's, and the record's rows are Task 21's. No profile is changed: the leg's scratch profile is a new file under `SP_TMP`, as every scratch profile is.

### Targets

- `scripts/lib/sandbox-probe/legs-glob.sh` (new)

**Work:**

- [ ] **The header**, as every sibling's:
  - what the leg measures, and why on a scratch profile. The per-run profile also carries exact entries for the clone's own paths (`autonomous-watcher.sh` → *THE PER-RUN PROFILE*: *"The base's glob entries cannot be relied on for the run's own copy (Linux may skip a `*` denyWrite entry)"*), so only with those removed is a path covered by a glob alone;
  - the two rows;
  - the grading functions, with their signatures;
  - *SOURCED, NEVER EXECUTED … Bash 3.2 floor.*
- [ ] **`sp__gw_profile`** writes `$SP_TMP/sbx_gw.json` from `SP_RUN_PROFILE` with one `jq --arg clone "$SP_CLONE"` call. It removes:
  - every `sandbox.filesystem.denyWrite` entry carrying no `*` that equals `<clone>` or starts with `<clone>/`;
  - every `permissions.deny` `Edit(…)` rule carrying no `*` other than a trailing `/**` whose path names `<clone>` or a path under it.

  Everything else is unchanged, every entry containing a `*` included. It sets `SP__GW_PROFILE`, or returns status 1 with `SP__GW_WHY`.
- [ ] **`sp__gw_targets <profile> <clone>`** reads only its arguments and the filesystem. It walks the profile's `sandbox.filesystem.denyWrite` entries that contain `*`, in order. For each it builds the candidate `<clone>/<the entry's text after its first "*/">` and keeps it only when the candidate matches the entry as an unquoted `case` pattern.

  It drops any candidate that is `<clone>/.git` or lies under it. The runtime refuses writes to the cwd repository's `.git/config`, `.git/hooks/` and `objects/info/alternates` with no profile entry naming them (`docs/sandbox-verification.md` → §2 CL5), so a refusal there would not show that the `*` entry acted.

  Its outputs:
  - `SP__GW_EXISTING`: the first kept candidate that exists. When it is a directory, the target is `<candidate>/sbx_gw1_new`; otherwise the candidate itself.
  - `SP__GW_ABSENT`: the first kept candidate that does not exist and whose parent directory exists.
  - `SP__GW_EXISTING_ENTRY` and `SP__GW_ABSENT_ENTRY`: the entry each came from.

  Either target may be empty. It returns status 1 when no `*` entry yields a kept candidate.
- [ ] **`sp__gw_grade <stream> <dd command>`** reads only its arguments and the stream, and sets `SP_VERDICT` and `SP_EVIDENCE`. It calls `sp_judge_call <stream> sandbox <command>`:
  - layer `sandbox` → `pass`, `refused: <evidence>`;
  - layer `ran` on a result that is not an error → `pass`, `written: the open for writing succeeded, so no entry protected the path: <first line>`;
  - layer `permission` or `file-tool` → `not run`, `refused at the <layer> layer, so it never reached the sandbox: …`;
  - the judge's own `not run`, `unrecognised` included → `not run` with its evidence;
  - layer `network` → `not run`, naming it.
- [ ] **`sp_leg_glob_deny`:**
  1. Cut the profile and the targets. When either fails, print GW1 and GW2 `not run`, naming why: no scratch profile, or *the run profile carries no denyWrite entry containing a star that covers a path in the clone*. A missing single target prints only its own row `not run`.
  2. `sp_track` GW2's target before the session, and GW1's when it is a new file.
  3. One session, `glob-deny`, on `SP__GW_PROFILE`, cwd the clone, with `--allowed "$SP_DD_RULE"`. Its prompt issues `sp_dd_cmd` on GW1's target, then GW2's, then the control `sp_ctl_add … written "dd if=/dev/null of=$SP_CLONE/sbx_gw_ctl conv=notrunc" "$SP_CLONE/sbx_gw_ctl"`, tracked.
  4. `sp_ctl_held`, then each row through `sp_row_result`. A `written` outcome is not a refusal-shaped pass, so it is printed through `sp_row_result` like the refused one and needs the control too.
  5. Each row's evidence starts `<target> (covered only by <entry>; <existed|absent> when the session started): `.
  6. The departure is `--settings $SP__GW_PROFILE (SP_RUN_PROFILE without its exact entries under the clone); <sp_departures>`.

**Verification:**

- The type check passes.
- By hand, on this macOS host, `bash -c '. scripts/lib/sandbox-probe/legs-glob.sh; declare -F'` lists `sp__gw_profile`, `sp__gw_targets`, `sp__gw_grade` and `sp_leg_glob_deny`.
- `grep -n 'set -[euo]' scripts/lib/sandbox-probe/legs-glob.sh` finds nothing.
- `grep -n 'settings.autonomous.json\|SP_RUN_PROFILE"* *>' scripts/lib/sandbox-probe/legs-glob.sh` shows no write to the base or run profile: the only file the leg writes beside the session is `$SP_TMP/sbx_gw.json`.

**Deviations from plan:**

- GW1's evidence prefix, when the existing candidate is a directory, reads `<target> (covered only by <entry>; a new file in <candidate>, which existed when the session started): ` rather than `existed`: the dd target itself is new there, and `existed` would misstate it. A file candidate keeps `existed`; GW2 keeps `absent`.
- `sp__gw_targets` also drops a candidate still carrying a `*` (the entry's text after its first `*/` holds another star): it is not one literal path a dd can name. `sp_leg_glob_deny` prints a row `not run` when its target or the clone is not spellable as one literal word (`sp__ctl_literal`), as `sp_leg_write_protection` does for the clone.
- `sp__gw_grade`: a `ran` result that is an error (reachable only off Linux, where the judge does not file it as `unrecognised`) is `not run`, *neither refused nor written*; the plan names no arm for it.
- A GW1 new file, the GW2 file and the control file that landed are removed right after `sp_ctl_held`, because later legs run in the same clone; all three stay `sp_track`ed as the plan asks.
- `grep -n 'set -[euo]'` matches line 29, the plan-prescribed header sentence *"It sets no shell option: the entry point owns `set -u`"*, which every sibling carries; the file sets no option.
- The jq call's redirects are ordered `2>/dev/null >"$out"` so the profile-write grep finds nothing; it was matching the read of `"$SP_RUN_PROFILE"` followed by the scratch file's redirect.
- Evidence downgrade: the by-hand `bash -c '. scripts/lib/sandbox-probe/legs-glob.sh; declare -F'` was refused at the permission layer (*"Permission to use Bash has been denied because Claude Code is running in don't ask mode"*), as was `bash -n` on the file. The four functions' presence rests on reading the file, and its parse on `bash scripts/typecheck.sh`'s `check-shell-parse: 92 files checked with /bin/bash (bash 3.2.57(1)-release), 0 failed`. No function body was executed in this session; Task 18's suite is the first run of `sp__gw_targets` and `sp__gw_grade`.
</content>
</invoke>
