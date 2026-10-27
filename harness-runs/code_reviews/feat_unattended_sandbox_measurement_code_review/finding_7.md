### 7. CS8's marker sits under the probe's temp area rather than at the `$HOME` path its row names, an unnamed departure

**File:** `scripts/lib/sandbox-probe/legs-settings.sh` (`sp_leg_invalid_profile`) — `marker="$SP_TMP/sbx_cs8_marker"`

CS8's row in `docs/sandbox-verification.md` defines the helper as *"a script whose one command is `: > "$HOME/sbx_cs8_marker"`"*. On the unmodified run profile, the control is *"the control's call refused with `Operation not permitted`"*. The leg writes its marker to `$SP_TMP/sbx_cs8_marker` instead, and nothing on the result line says so. The task prompt requires every departure to be named on the leg's line.

The departure changes what the control measures. `SP_TMP` is `mktemp -d "${TMPDIR:-/tmp}/sandbox-probe.XXXXXX"` in the probe's own environment. When the probe is started as `! bash scripts/sandbox-probe.sh run` from a Claude Code session, which Gate 15 documents as a supported start, that `TMPDIR` can be the session's own sandbox-writable temp root. A write there is then allowed, the control "on the unmodified run profile must be refused" fails, and CS8 prints `not run` for a reason that has nothing to do with the row. `$HOME` is outside every write root in every start mode. RT1, SR2 and P1b already place their markers there for the same reason.

**Fix.** Use the row's marker, guarded the way `sp_leg_retry` guards its own:

```bash
  marker="$HOME/sbx_cs8_marker"
  if [ -e "$marker" ] || [ -L "$marker" ]; then
    sp_result_line invalid-profile CS8 "not run" "$marker exists before the session; remove it and re-run; $note" ""
    return 0
  fi
  if ! sp__ctl_literal marker "$marker"; then
    sp_result_line invalid-profile CS8 "not run" "'$marker' is not spellable as one literal word; $note" ""
    return 0
  fi
```

Put this in place of the current `marker=` assignment. Keep `sp_track "$marker"` and the existing `rm -f -- "$marker"` calls as they are.
