### Task 10 — Document the hold, its limits and the watchdog's wake discount in `docs/cli.md`, `docs/watcher.md` and `docs/remote-execution.md`

**Goal:** An adopter reads, where they already look for host requirements, that a local run keeps the host awake on AC power only. They also read that a closed lid on battery suspends the run until wake, how `execution.keepAwake` turns the hold off, what Linux and WSL2 need, and what `doctor`'s `keep-awake` check reports. The watcher's own document states the hold and the watchdog's wake discount, and the remote-execution document lists the hold among what job mode turns off.

**Depends on:** Task 4, Task 8 and Task 9. This task describes what those built, and every fact below is restated from them.

- **The hold (Task 4).** macOS `caffeinate -s -i -w <engine pid>`. Linux `systemd-inhibit --what=sleep:handle-lid-switch --mode=block --who=autonomous-sdlc-harness`, taken only on mains power and re-checked every pass. None in job mode, on a GitHub Actions runner or under WSL2. One `keep-awake:` log line per launch when the lock is absent, refused or impossible. The `status` lines `KEEP_AWAKE=<mode>` and `keep-awake: <mode>[ — <reason>]`.
- **The wake discount (Task 4).** The new tunable `STALL_WAKE_GAP_SECS` (default 300). A pass more than `POLL_INTERVAL_SECS + STALL_WAKE_GAP_SECS` after the last one reads as a wake, and silence is measured from the later of the newest output and that wake.
- **The check (Task 8).** `keep-awake`, right after `sandbox-prerequisites`, graded `pass` or `warn` and never `fail`. On Linux it takes and releases one test lock, through `systemd-run --user` where that resolves.
- **The key (Task 9).** `execution.keepAwake`, default `true`, with its §5 row in `docs/config.md`.

**Where this task stops.** Prose only, in the three files below. The rows of `docs/outer-loop-verification.md` §2.6 and of `docs/sandbox-verification.md` are dated records, and the story index's `## Scope register` dispositions them `no-change`. No timing of a real hold is recorded anywhere (ledger: *"A wall-clock figure in a document of record is never one a run measured inside its own session"*).

### Targets

- `docs/cli.md` — §6 **What a host needs.**; §7's opening paragraph, check table and severity bullets.
- `docs/watcher.md` — §1 step 6; §4's knobs paragraph.
- `docs/remote-execution.md` — §2, **Job mode runs exactly one run, in the job's own checkout**.

**Work:**

- [ ] **`docs/cli.md` §6, a Keeping the host awake. paragraph** after the paragraph opening *"`doctor` reports all of this under `sandbox-prerequisites`"*. State each of these:
  - A local run keeps the host awake for its engine's life **on AC power only**. On battery, a closed lid still suspends the run until wake, and the watchdog does not count the suspended time (`watcher.md` §4).
  - macOS needs nothing installed (`caffeinate` ships with it).
  - Linux needs `systemd-inhibit` and a logind that grants the lock. Both lock kinds are needed, because `LidSwitchIgnoreInhibited=yes` makes a closed lid ignore a plain `sleep` lock. polkit allows the lock to an active local session, and a lingering user service may need a polkit rule for `org.freedesktop.login1.inhibit-block-sleep` and `org.freedesktop.login1.inhibit-handle-lid-switch`.
  - WSL2 holds nothing, because nothing inside WSL can keep Windows awake. Set the Windows power plan's "When I close the lid" action to "Do nothing" for "Plugged in". Point to the Windows setup section the branch `feat_wsl2_support` (#160) owns.
  - `doctor` reports the host under `keep-awake` (§7).
  - The opt-out, as its own fenced block with one command on its line (ledger: *"Every command an adopter is meant to run sits in a fenced block"*):

    ```
    npx autonomous-sdlc-harness config set execution.keepAwake false
    ```

  Then say that the watcher reads the key on its next pass with no restart, and that its `status` line reports `KEEP_AWAKE=off`.
- [ ] **`docs/cli.md` §7.** In the opening paragraph, the sentence *"With none given, nothing it does reaches outside the repository it was aimed at at all"* gains its one exception. On Linux, `keep-awake` takes one logind block lock and releases it the moment its `true` exits, through `systemd-run --user` where that resolves. Add the table row `` | `keep-awake` | this host can hold a sleep assertion for the life of a run | `` directly after the `` `sandbox-prerequisites` `` row. Add a severity bullet after **`sandbox-prerequisites` is a warning without `--remote-job` and a failure under it**, opening **`keep-awake` never fails**. It passes for a host that can hold, for `execution.keepAwake: false` (reported as off) and on a GitHub Actions runner or under `--remote-job` (not applicable). It warns, naming the remedy, for a host that cannot hold, which is a missing tool, a refused or unanswered lock, WSL2, or another platform, because a run still launches unheld. The `--remote-job` sentence that counts *"six checks' warnings into failures"* is unchanged, and the bullet says `keep-awake` is not among them.
- [ ] **`docs/watcher.md` §1 step 6.** After the sentence on the per-run profile copy, add one sentence. The session holds the host awake for its engine's life, on AC power only, except in job mode, on a GitHub Actions runner or under WSL2, and the hold ends when the engine does. Point to [`cli.md`](cli.md) §6 for what each host needs and to `autonomous-watcher.sh`'s header for the mechanism.
- [ ] **`docs/watcher.md` §4 knobs.** In "Its policy knobs, by name: …", add `STALL_WAKE_GAP_SECS` to the stall watchdog's list. After the paragraph, add one sentence. A pass that starts more than `POLL_INTERVAL_SECS + STALL_WAKE_GAP_SECS` after the previous one reads as a host wake, and the watchdog then measures a run's silence from that wake, so a run frozen by host sleep is not killed for it. A run silent while the host is awake is killed as before. A watcher stopped for that long reads the same way, at the cost of one deferred window.
- [ ] **`docs/remote-execution.md` §2.** In **Job mode runs exactly one run, in the job's own checkout**, the list *"It turns off the inbox pass, the cleanup sweep, the live-log window and both halves of the machine lane"* gains *"the sleep hold"*. The next sentence's reasons gain one clause: a hosted runner does not sleep.

**Verification:**

- Re-run the story index's five `## Scope register` command entries verbatim. Every hit falls inside a register row, or directly after one marked `change` (the closure invariant).
- `git grep -nE 'items? [0-9]+' -- docs/cli.md docs/watcher.md docs/remote-execution.md` reaches no line this task added, so no new roadmap number is owed (`docs/development.md` §6).
- The `config set` command sits alone on its line inside a fenced block, and no other adopter command is written inline in the added prose.
- Every fact the added prose states matches the task it was restated from. That includes the reason string `execution.keepAwake is false` and the check id `keep-awake`. The table row's title is byte-identical to `KEEP_AWAKE_CHECK`'s `title` in `cli/src/doctor/checks.ts`.
