### 2. A W8 `fail` or `not run` caused by W7's debug log does not keep that log

**File:** `scripts/lib/sandbox-probe/legs-protection.sh` (`sp_leg_write_protection`), at `sp__wp_w8 "$departure" "$dbg" "${SP_W7_DEBUG:-}"`

W8 now reads two `--debug-file` logs: the write-protection session's own, and W7's at `SP_W7_DEBUG` (`$SP_TMP/gates-w7.debug.log`). `sp_session` records W7's log in the evidence record under the leg that was current when it launched, which is `gates`. Teardown's `sp__td_keep_evidence` keeps a record's files only when *that record's* leg is in `SP_NONPASS_LEGS`.

Take a run where `gates` prints `pass` for T2 and W7, and W8 prints `fail` because of an unmatched-rule line in W7's log (`sp__wp_w8` quotes it as `W7 log: …`). Write-protection is kept, but the file W8 was graded from is not in its record, so teardown deletes it with `SP_TMP`. That is the evidence loss defect 8 exists to stop: "Keep the session streams and prompts of every leg that printed anything but `pass`". It is also the row the maintainer's re-run is meant to settle (§5 PD12).

**Fix:** in `sp_leg_write_protection`, add this immediately before the `sp__wp_w8 "$departure" "$dbg" "${SP_W7_DEBUG:-}"` call:

```bash
  # W8 grades W7's log too, which sp_session recorded under the gates leg: keep it with this leg as well.
  [ -z "${SP_W7_DEBUG:-}" ] || sp_keep_file "$SP_W7_DEBUG"
```

`SP_CURRENT_LEG` is `write-protection` at that point, so the record lands under this leg. `sp__td_keep_evidence` skips a recorded path that is no longer a file. So when both legs are non-pass, the log is moved once, under whichever record comes first, and nothing is refused.

No test file changes. `sp_keep_file` and teardown's keeping are already driven by `cli/test/sandbox-probe-evidence.test.mjs`, and `sp_leg_write_protection` launches sessions, which no test does. So the fix runs no test, and the full suite runs later, in the Run gates phase.
