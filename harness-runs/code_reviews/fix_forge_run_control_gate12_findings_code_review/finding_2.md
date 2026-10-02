### 2. A failed permission check on a close is logged as "not authorised" and exits 0, so an authorised close silently stops nothing

**File:** `cli/templates/scripts/remote-run.sh` (`control_close`) — `[ "$status" -eq 0 ] || control_close_ignore "@$CONTROL_ACTOR is not authorised: ${AUTH_WHY%.}"`

**The problem.** `authorise_actor` has four refusal statuses, and the header comment above it states them. Status 4 is not a judgement about the actor: *"that permission call failed (GH_ERR holds why)"*. `control_close` treats every non-zero status alike. So a transient failure of `repos/<repo>/collaborators/<login>/permission` on a maintainer's close becomes the quiet line `close ignored: @<login> is not authorised: the permission check for @<login> failed (…)` and **exit 0**.

The `harness control` run shows green, nothing is replied to (a close never is), and the run keeps burning minutes on a closed item. That is the exact defect item 5 fixes. The close event fires once, so nothing retries it.

The other callers do not do this. The comment path answers status 4 with a reply the commenter can act on, and `round_collect` turns status 4 into a failure (`4) RC_ERR="${AUTH_WHY%.}"; return 3`). The header's exit table for the close lists the cases that are `3` with an `::error::` line (*"the stop child failed …, or the repository name, the issue's comments or the run's state could not be read"*), and a failed permission read is the same kind of failure as those.

**Fix.**

- [ ] In `control_close`, replace the one-line status test after `authorise_actor "$CONTROL_ACTOR" "$CONTROL_SENDER_TYPE" || status=$?` with:

```bash
    case "$status" in
      0) ;;
      4)
        echo "::error::remote-run.sh: control: the close by @$CONTROL_ACTOR was not acted on: ${AUTH_WHY%.}"
        exit "$EXIT_GH" ;;
      *) control_close_ignore "@$CONTROL_ACTOR is not authorised: ${AUTH_WHY%.}" ;;
    esac
```

- [ ] In the header's `THE CLOSE.` paragraph, change gate 3's `\`authorise_actor\` refused` to `\`authorise_actor\` refused (statuses 1–3)`. In the exit-code list's `3` entry, extend the close clause `or the repository name, the issue's comments or the run's state could not be read` to `or the repository name, the closer's permission, the issue's comments or the run's state could not be read`.
- [ ] In `cli/test/remote-control-close.test.mjs`, add a case where the `gh` stub fails the `collaborators/alice/permission` call (the stub already routes `api` calls by path, so add a `STUB_PERMISSION_FAIL` branch answering `HTTP 502` on stderr with exit 1). Assert exit 3, an `::error::` line naming `@alice`, and no `workflow run`, no `run cancel`, no comment POST and no label write. Run `npm test -- test/remote-control-close.test.mjs` from `cli/`.
