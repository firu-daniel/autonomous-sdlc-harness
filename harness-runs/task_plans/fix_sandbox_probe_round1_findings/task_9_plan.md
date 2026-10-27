### Task 9 — Take R4's `--local` half in a session of its own

**Goal:** Take the half of R4 the probe skipped (defect 12, PD11). It issued the probe clone's own `refresh-branch.sh` once and judged only the fetch. R4's `--local` half now runs as a second session, so the fetch half's `ref unchanged` judgement is not disturbed by a merge. One R4 line combines both halves.

**Depends on:** Task 1. The wrappers-refresh leg's expected text is now *"… and the clone's own copy stays sandboxed for its fetch while its --local merge runs in the clone"*.

**Where this layer stops.** **Task 15** tests `sp__rf_r4_local_grade` against recorded streams, by sourcing `core.sh`, `judge.sh`, `controls.sh` and this file. So it reads only its arguments and the stream. **Task 16** amends R4's call and expected columns.

### Targets

- `scripts/lib/sandbox-probe/legs-refresh.sh`: `sp__rf_r4`, the new `sp__rf_r4_local_grade`, and the header.

**Work:**

- [ ] **Hold the fetch half, don't print it.**
  - In `sp__rf_r4`, keep the existing fetch session (`wrappers-refresh-r4`) and its judgement unchanged.
  - Instead of printing R4 there, keep its verdict, its evidence and that session's control result: `SP_CTL_OK`, `SP_CTL_EVIDENCE` after `sp_ctl_held`.
  - On the paths that return early today (`scriptsDir` unresolvable, `git status` failed, the clean failed, the session did not launch), print R4 `not run` as now and take no `--local` half.
- [ ] **The `--local` session.**
  - Before it, ensure the probe clone has a local `refs/heads/$SP_DEFAULT_BRANCH`. Where it has none, create it at `refs/remotes/origin/$SP_DEFAULT_BRANCH` with the probe's own git (`git -C "$SP_CLONE" -c core.hooksPath=/dev/null branch …`), and say so in the evidence.
  - Then launch session `wrappers-refresh-r4-local` on `SP_RUN_PROFILE`, cwd = the clone, with:
    - one exact call: `bash $SP_CLONE/<scripts_rel>/refresh-branch.sh --local $SP_CLONE` (the script's own usage order, `[--local] [<repo-dir>]`);
    - then the `refresh` control, after a fresh `sp_ctl_prepare refresh_own_local`.
- [ ] **`sp__rf_r4_local_grade <stream> <command>`.** It sets `SP_VERDICT` and `SP_EVIDENCE`:
  - no match, or answered at the permission layer → `not run`, naming it;
  - layer `sandbox` (`Operation not permitted`) → `fail`: `the --local merge was refused sandboxed in the clone: <evidence>` (F1's shape on the clone layout);
  - a result that is not an error → `pass`: `--local exit 0: <first line>`;
  - an error carrying `Exit code 3` → `pass`: `--local exit 3, nothing to do: <the refresh-branch.sh line>`;
  - any other error → `not run`, quoting its first line.
- [ ] **One R4 line for both halves.**
  - The verdict is:
    - `fail` if either half fails;
    - otherwise `not run` if either is `not run`;
    - otherwise `pass`.
  - The evidence is `fetch: <fetch evidence>; --local: <local evidence>`.
  - Gate it on both sessions' controls. Set `SP_CTL_OK=1` only when both held; otherwise set it to 0, with `SP_CTL_EVIDENCE` naming the first that did not. Then print once through `sp_row_result --direct wrappers-refresh R4 …`.
  - The departure is both sessions' departures, joined with `; `.
- [ ] **The header.** Name R4's two sessions, the local base ref the probe ensures, and `sp__rf_r4_local_grade`'s signature.

**Verification:**

- R4 is printed exactly once on every path through `sp__rf_r4` (`grep -c 'wrappers-refresh R4' …` counts the call sites; each early return prints once, and the two-session path prints once at the end).
- The `--local` command carries no `$` other than the two literal-checked paths `sp_leg_wrappers_refresh` already screens with `sp__ctl_literal`.
- `sp__rf_r4_local_grade` calls no `git`, `sp_session` or `hr_` function.
