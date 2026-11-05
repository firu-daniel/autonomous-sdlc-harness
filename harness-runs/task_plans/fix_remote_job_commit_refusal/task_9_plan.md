### Task 9 — Make `/autonomous-sdlc-harness:branch-status`'s `unfinished` bullet cover a ledger-less resume

**Goal:** The `paused` local-run bullet for `pause_reason` `unfinished` in `plugin/commands/branch-status.md` stops promising a ledger that may not exist. After Task 3, an `unfinished` record can also come from a zero exit with an absent or unreadable ledger after a resume, a stall restart or an earlier park, and then there is no first `[ ]` entry to name.

**Depends on:** Task 3, whose contract this task describes and does not change. Task 3's `classify_run_exit`, on a zero exit whose ledger is `absent` or `unreadable` after a resume, a stall restart or an earlier park:
- logs `classify: '<branch>' has no readable ledger (<ledger_state>: <ledger_detail>) after <why> — not classifying it completed` to `watcher.log`, where `<why>` is `a <resume_kind> resume`, `a stall restart` or `an earlier park`;
- then sets `ledger_state=unfinished` and runs the existing `unfinished` arm unchanged, so the record is `paused` with `pause_reason` `unfinished` and `watcher.log` also carries the existing `run '<branch>' paused (unfinished) — the session exited 0 before its ledger finished (…)` line, its detail reading `<ledger_state>: <ledger_detail>, after <why>`.

A first launch with no ledger keeps `completed`, so this bullet never sees it.

**Where this task stops.** This task edits one bullet of one command file. It changes no step, no other bullet, and no read the command makes: the read stays a **bounded, single** read of `watcher.log`. The watcher is Task 3's, and the `docs/` and `ARCHITECTURE.md` prose is Task 8's.

### Targets

- `plugin/commands/branch-status.md` — step 6, the `paused` local-run bullet `pause_reason` `unfinished`.

**Work:**

- [ ] **Split the bullet's explanation into its two shapes.**
  - **A ledger that exists but is unfinished:** keep today's sentence. The session ended (exit 0) before its ledger finished, naming the flow-progress ledger or `<state_dir>/docs_catalog/<branch>_docs.md` for a docs run, and the resume continues at its first `[ ]` entry.
  - **No readable ledger after a resume, a stall restart or an earlier park:** the session exited 0 with that ledger absent or unreadable, so there is no `[ ]` entry to name. Say which of the three preceded it, as the `not classifying it completed` log line states, and name the resume without saying where it continues.
- [ ] **Widen the log-line filter.** The lines the bullet shows are those that name this branch and contain `paused (unfinished)`, `stopped background tasks` or `not classifying it completed`. Keep the read **bounded and single**, and never `tail -f`.

**Verification:**

- `grep -n "not classifying it completed" cli/templates/scripts/autonomous-watcher.sh` prints Task 3's log line, so the literal the bullet filters on exists. `grep -n "paused (unfinished)" cli/templates/scripts/autonomous-watcher.sh` still prints the existing arm's lines.
- `git diff -- plugin/commands/branch-status.md` touches only the `pause_reason` `unfinished` bullet of step 6.
- Re-run the story index's scope-register derivation entry 1 verbatim from the checkout root. Its hit on `plugin/commands/branch-status.md` is the register row for this bullet, and no other line of that file is hit.
