### 4. SR2 prints `pass` with no `sbx_sr2_refused` line, against its row's Expected

**File:** `scripts/lib/sandbox-probe/legs-local.sh` (`sp_leg_scratch`) — `line="$(sp__line_with "$text" sbx_sr2_refused)" || line="no sbx_sr2_refused line"`

SR2's row in `docs/sandbox-verification.md` expects *"refused: the file prints `sbx_sr2_refused` followed by the error's message, quoted, and `$HOME/sbx_probe_scratch_marker` does not exist"*. `sp_leg_scratch` checks only the second half. When the marker is absent, it prints `pass` even when `sp__line_with` found no `sbx_sr2_refused` line, and the evidence then says so literally: *"…absent; no sbx_sr2_refused line"*.

Two real outcomes reach that branch and are graded `pass` wrongly:

- The probe file died before its outside write. SR2 then measured nothing, and `pass` is a refusal row's pass with no refusal in evidence.
- The write landed somewhere other than the person's `$HOME`. The file computes `process.env.HOME || homedir()` inside the session, and the probe tests `$HOME` from its own shell. The file then prints `sbx_sr2_written <path>`, and the protection broke.

The second is exactly the outcome the row exists to catch, and the probe does not read that line at all.

**Fix.** Grade on the probe file's own output first, then on the marker:

```bash
  sp_ctl_held "$SP_STREAM"
  if [ -e "$out_marker" ]; then
    sp_row_result --direct scratch SR2 fail "$out_marker exists: the outside write from the scratch file landed" "$departure"
  elif line="$(sp__line_with "$text" sbx_sr2_written)"; then
    sp_row_result --direct scratch SR2 fail "the outside write landed: $line" "$departure"
  elif line="$(sp__line_with "$text" sbx_sr2_refused)"; then
    sp_row_result --direct scratch SR2 pass "$out_marker absent; $line" "$departure"
  else
    sp_row_result --direct scratch SR2 "not run" \
      "no sbx_sr2_refused or sbx_sr2_written line, so the outside write was never attempted: $(sp__first_line "$text")" "$departure"
  fi
```
