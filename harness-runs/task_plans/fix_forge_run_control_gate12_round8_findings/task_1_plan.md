### Task 1 — `pause-requested` answers "no pause" with its own exit code, `5`

**Goal:** `remote-run.sh pause-requested` exits `5`, never `1`, when its read succeeded and found no `harness pause <branch>` run. Exit `1` then means only a usage error, or a library or configuration that cannot be resolved. A caller can then tell "no pause" from "this call was refused".

Gate 12 round 8, finding 1, names this as one of two suspects for a pause the running job never honoured. Today `EXIT_NO_PAUSE` and `EXIT_USAGE` are both `1`, and the job's watcher reads `1` as "no pause" and advances its bound. So any usage refusal drops a pause silently.

**Where this task stops.** This task changes the verb, its constant, its exit map and its own header paragraph. The caller is `job_control_poll` in `cli/templates/scripts/autonomous-watcher.sh`, and it belongs to **Task 2**, which `**Depends on:**` this task. Task 2 reads exactly this contract:
- `0` — a `harness pause <branch>` run was created at or after `<since_epoch>`;
- `5` — the read succeeded and found none;
- `1` — usage error, or the library or configuration could not be resolved;
- `3` — `gh` failed, or its answer was not the expected JSON.

This task also restates, in the verb's header paragraph, the bound Task 2 will pass. That way the header describes the contract on both sides.

### Targets

- `cli/templates/scripts/remote-run.sh`:
  - the `EXIT_NO_PAUSE` constant and the comment above it;
  - `verb_pause_requested`;
  - the header's `THE VERBS AND THE EXIT MAP` entries for exit `1` and a new exit `5`;
  - the header paragraph `` `pause-requested` AND `run-created-at` ARE THE JOB'S TWO READ VERBS ``;
  - the header's `REPRO` lines for `pause-requested`.
- `cli/test/remote-run.test.mjs`: the `pause-requested` exit cases.

**Work:**

- [ ] **The constant.** Set `EXIT_NO_PAUSE=5`, and keep it separate from `EXIT_USAGE`. Its comment says: "pause-requested only: the read succeeded and found no pause; distinct from EXIT_USAGE so a caller never reads a refused call as no pause". `verb_pause_requested` already exits `"$EXIT_NO_PAUSE"` on no match, so its body changes only if it spells `1` anywhere. Grep it.
- [ ] **The exit map.** In `THE VERBS AND THE EXIT MAP`:
  - remove "for pause-requested, also NO such run — a caller that reads 1 as "no pause" passes arguments it has already validated" from the `1` entry;
  - add a `5` entry after `4`: "pause-requested only: the read succeeded and found no such run".

  Check that no other verb exits `5`: grep `exit 5` and `EXIT_[A-Z_]*=5` in the file.
- [ ] **The verb's header paragraph.** Keep "AT, because `createdAt` has one-second resolution", and keep "seeing one twice is harmless". Replace "the caller takes <since_epoch> just before the query it will next start from" with what Task 2's caller now passes: a bound that starts at the job's own starting bound and afterwards lags each query by an overlap (`CONTROL_POLL_OVERLAP_SECS` in `autonomous-watcher.sh`), floored at that starting bound. Add that exit `5` is "no pause" and exit `1` is never one.
- [ ] **`REPRO`.** Change "`with 1767225620 -> 1`" to "`with 1767225620 -> 5`". Add a usage line: `bash scripts/remote-run.sh pause-requested feat_x` with no `<since_epoch>` gives `-> 1`.
- [ ] **`remote-run.test.mjs`.** Find the existing `pause-requested` cases (grep `pause-requested`). Make the "no match" case expect status `5`. Add two cases:
  - a missing `<since_epoch>` gives status `1`, and stderr names the usage;
  - a non-integer `<since_epoch>` (`abc`) gives status `1`.

  Keep the `gh`-failure case at `3`. Amend the suite header if it lists `pause-requested`'s exits.

**Verification:**

- `npm test --workspace cli -- test/remote-run.test.mjs`, from the repository root, passes.
- `bash scripts/typecheck.sh` exits 0.
- Grep `cli/templates/scripts/remote-run.sh` for `EXIT_NO_PAUSE=`: it finds exactly one assignment, `=5`. No exit-map entry pairs `pause-requested` with `1` as a "no such run" answer.
