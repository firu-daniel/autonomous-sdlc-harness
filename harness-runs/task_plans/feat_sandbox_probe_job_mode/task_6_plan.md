### Task 6 — Add PD23's Linux refusal shapes to the judge's layer table

**Goal:** Close PD23 before the runner run, as the task prompt asks: *"A refusal whose text the judge's Linux layer table does not know prints `not run` (PD23); add the shapes the container run met before the runner run."* The three shapes `docs/sandbox-verification.md` → §5 row PD23 quotes from the first Linux run's kept evidence become sandbox-layer refusals, **on Linux only**:

- `Permission denied` — a `dd` onto an F9 placeholder: `dd: failed to open '<main>/.mcp.json': Permission denied`;
- `Device or resource busy` — a rename onto a protected path inside the run copy: `mv: cannot move '<clone>/.git/sbx_wp_mv_28' to '<clone>/.git/config': Device or resource busy`;
- `inter-device move failed` — a rename from the clone onto the main checkout: `inter-device move failed: … unable to remove target: Device or resource busy`. The busy substring already covers this shape, and the evidence line is the first line carrying either.

**Depends on:** nothing in this branch. The judge's header rule stands: *"A Linux refusal string is added to the table above only from a Linux run's kept evidence, never guessed."* These three come from that evidence, as quoted in row PD23. The evidence directory itself was not committed.

**Where this task stops.** It edits `judge.sh` only. `legs-protection.sh`'s own rename classifier reads these strings itself and is aligned in Task 12. Tests, including the existing `unrecognised` cases that used `Device or resource busy` as their example, are Task 19's. The record's PD23 follow-up is Task 23's. The `permission` layer's own strings, *"Permission to use … has been denied"*, are matched earlier in `sp__layer`, so this arm never sees them.

### Targets

- `scripts/lib/sandbox-probe/judge.sh`

**Work:**

- [ ] **The layer table in the header** gains one row after the `Read-only file system` one: *`sandbox` — Linux only: `Permission denied` (a write onto a bubblewrap placeholder), `Device or resource busy` (a rename onto or across a read-only bind), from the first Linux run's kept evidence (docs/sandbox-verification.md §5 PD23). Ordinary file permissions print `Permission denied` too, so the evidence quotes the line rather than naming a cause.*
- [ ] **`sp__layer`'s Linux arm.** The existing `elif [ "${SP_PLATFORM:-}" = linux ] && line="$(sp__line_with "$text" "Read-only file system")"` becomes one test carrying all three substrings, in this order: `"Read-only file system" "Permission denied" "Device or resource busy"`. `sp__line_with` takes several substrings and returns the first line carrying any. It stays after the `Operation not permitted` arm and before `ran`, so the macOS order is unchanged.
- [ ] **The `UNRECOGNISED` paragraph** is unchanged in rule. It gains one sentence: PD23's shapes are recognised since this branch, and any other Linux error against an expected refusal is still `unrecognised`.

**Verification:**

- The type check passes.
- `git diff scripts/lib/sandbox-probe/judge.sh` shows one changed `elif` line in `sp__layer` and the two header edits, and no line outside a `SP_PLATFORM = linux` test.
- By hand, `bash -c '. scripts/lib/sandbox-probe/core.sh; . scripts/lib/sandbox-probe/judge.sh; SP_PLATFORM=linux; sp__layer "dd: failed to open x: Permission denied" command dd ""; echo "$SP_LAYER"; SP_PLATFORM=macos; sp__layer "dd: failed to open x: Permission denied" command dd ""; echo "$SP_LAYER"'` prints `sandbox` then `ran`.
  - **Deviations from plan:** The by-hand `bash -c '. scripts/lib/sandbox-probe/core.sh; …'` check was not executed: the Bash call was refused with `Permission to use Bash has been denied because Claude Code is running in don't ask mode.` It was not routed through a probe. The claim rests on reading `judge.sh`: with `SP_PLATFORM=linux` the text carries neither `Permission to use ` nor the denied-directory message, `permission_denials` reads an empty stream path and yields nothing, no network or `Operation not permitted` substring is present, so the Linux arm's `sp__line_with … "Permission denied" …` matches and sets `sandbox`; with `SP_PLATFORM=macos` the Linux arm is skipped and the `else` sets `ran`. `bash scripts/typecheck.sh` ran and printed `PASS: typecheck` (its `check-shell-parse` step parsed `judge.sh` with bash 3.2). `git diff scripts/lib/sandbox-probe/judge.sh` ran and shows the two header edits and the one `elif` line only.
</content>
</invoke>
