### 4. Record both 2026-10-31 sessions (AP1–AP8 on round 1's head, and the AP7 control) and bring the documents of record into line

**File:** `docs/sandbox-verification.md` §5 — "**Owed on the round's head.** `fix_linux_sandbox_sibling_glob_trio`'s user-review round changes the route from AP7" and its table rows "| AP1 | as the first table | exits 0 in phases A and B | `not run — owed` | `not run — owed` |" … "| AP8 | the `dd` row:"; the closing "**Owed:** AP1–AP7 plus the `dd` row, AP8, re-taken by hand"; §0 — "**Why `config.worktree` differed: unknown.**"; §6 — "- **Claude Code's built-in protected paths in a run copy:** **measured in part; accepted, not swept.**"; `docs/sandbox-placeholder-upstream-report.md` — `### Environment`, `### Claude Code's built-in protected paths`; `docs/cli.md` §6 residual 12 — "12. **Linux placeholders: the interim position on a bubblewrap host" (its lead paragraph and the "**What can run.**" and "Claude Code's own placeholders: accepted, not swept" bullets)

**What is wrong.** Checked against the current tree.

`docs/sandbox-verification.md` §5's **Owed on the round's head.** table still reads `not run — owed` in every cell, AP1–AP8. The user took those rows on round 1's head, `d764fb2b`, on 2026-10-31 (Claude Code 2.1.316), and the review quotes the readings.

Nothing yet records:
- the Claude Code version change from 2.1.314 to 2.1.316;
- the 2026-10-31 stamps;
- that `config.worktree` appeared again with no rule naming it;
- the 21 built-in leftovers re-measured;
- AP8's `dd` result.

`docs/cli.md` residual 12 is the one statement of the Linux position. Its lead paragraph and "**What can run.**" bullet still say AP1 measured sandboxed git failing and that AP1–AP6 are owed on the branch's head. The built-in-leftovers bullet still says "Unmeasured: the full post-kill list, and each leftover's type and mode".

**Fix.** Write in each document's own style. Use `<main>`, `<clone>` and `<sibling>`, and no machine paths other than the stamp's. Invent nothing: whatever the review does not quote stays *derived* or *owed*, and nothing explains AP8's mechanism. Keep every 2026-10-30 record exactly as it stands.

1. **§5, the round's-head table.**
   - Retitle the bold lead to `**The round's head, taken 2026-10-31.**`. Nothing else cites the old label; a grep finds it only on line 557.
   - Under the lead, add session 1's stamp as a fenced block: `date: 2026-10-31T08:07:43+00:00`, then the six stamp lines verbatim from the review, then `clone: chore_sbx_probe_20261031080639`. Add one sentence: the checkout was cloned from the branch with a local `dev` pointed at it, the sibling was made with `git clone --shared` before the probe, and the Claude Code version is 2.1.316, where the 2026-10-30 sessions ran 2.1.314.
   - Fill **Observed** and **Verdict** for AP1–AP6 and AP8 from the review's *Session 1, the re-take*:
     - **AP1 `pass`.** Sandboxed and excluded `git status` in the clone exit 0 in A and B. `<main>` lists `## dev ?? .mcp.json ?? harness-runs/.mcp.json`. Every outside reading exits 0.
     - **AP2 `pass`.** `commondir` and `http-alternates` read `absent` in every phase, inside and outside. `config.worktree` reads `outside before: absent`, then `regular empty file, 0 B, -rw-r--r--, probe` from `after-A` through `after-sweep`, mounted `(overlay, ro,nosuid,nodev,relatime)` over itself inside the sandbox.
     - **AP3 `pass`.** `sweep | exit 0` removed the seven paths the review names, `hr_wrapper_main_of | exit 0`, `hr_run_copy_check_var | exit 0`, `git status (clone) | exit 0` with the 21 untracked built-ins, and `git status (sibling) | exit 0 | ## dev...origin/dev`.
     - **AP4 `pass`.** The `<main>/harness-runs/.mcp.json` reading after D-kill, and `absent` after sweep.
     - **AP5 `pass`.** The seven `/null` readings, and `absent` in the excluded calls.
     - **AP6 `pass`, against round 1's rewritten expectation.** The sibling's paths `absent` throughout, no mount line on its existing entries (e.g. `<sibling>/.git/config | A-sandboxed: regular file, 256 B, -rw-r--r--, probe`), and `git status (sibling)` exit 0 throughout.
     - **AP8.** Observed: the review's four lines (`before | absent`, the `dd` call, the `dd` result `0+0 records in / 0+0 records out / 0 bytes copied`, `dd call | in the stream after 6 s` · `plain shell | absent through 21 s of polling` · `session | exit 0`), noting that the script then wrote `verdict refused`. Verdict: ***not on disk; `dd` reported success***. Add one sentence that where the write went is unmeasured and no mechanism is offered.
   - **AP8's Expected cell.** Replace "*written* or *refused*; both are possible…" with the three outcomes Finding 3 names: *written*, *not on disk, the call reported success*, and *refused*. Grade on the disk outcome. Keep its "no `dd call` line is no verdict" clause.
   - **AP7.** Fill from *Session 2, the control*. The stamp is the same six lines with `date: 2026-10-31T08:21:52+00:00`, `clone: chore_sbx_probe_20261031082100` and `profile: /tmp/sbx-absent-path/control-profile.json`; that is the stamp's own line, kept verbatim. Then:
     - **The profile change.** `control-profile` removed the six remaining trio `Edit` rules, the sibling's (98 → 92 `permissions.deny` entries), and left `0`.
     - **The readings, identical to session 1's.** Those the review lists, including both reports holding the same 56 `mount: /null` readings.
     - **The conclusion.** On Linux the sibling's exact `Edit` rules mount nothing and change nothing, because the sibling sits outside every write root. `config.worktree` appears with no rule naming it, on 2.1.316 as on 2.1.314.
     - Verdict: recorded, not graded.
     - One sentence that a first control attempt wrote nothing, because of the command as typed. Record only the successful one.
   - **Add a row AP9.** Check: the guard's row, `hook-probe` (Finding 3), where a session's `Write` to `<clone>/.git/commondir` runs on the per-run profile with this checkout's plugin loaded. Expected: *refused by the hook*, and the plain shell finds the path absent. Observed and Verdict: `not run — owed`.
   - **Replace the closing "**Owed:**" line** with what is owed after this round, taken by hand on the head this round produces, before merge:
     - AP9;
     - AP1–AP6 again, to show the guard changes no placeholder.
2. **§0 *Why `config.worktree` differed: unknown*.** Append one sentence: on Claude Code 2.1.316 too, it appeared with no rule naming it (§5 AP7, 2026-10-31).
3. **§6, the built-in-paths bullet.** Add the re-measurement on 2.1.316 (2026-10-31, §5 session 1):
   - each of the same 21 paths reads `character special file, 0 B, crw-rw-rw-, nobody; mount: /null (tmpfs, ro,nosuid,nodev)` inside the sandbox at the clone's root;
   - after the kill each is a `regular empty file, 0 B, -r--r--r--, probe`;
   - `sweep` leaves all but `.mcp.json`, which the manifest records;
   - git is unaffected: `git status (clone)` exits 0.

   This settles the "type and mode unmeasured" gap.
4. **`docs/sandbox-placeholder-upstream-report.md`.**
   - In `### Environment`, add `2.1.316 (Claude Code)` for the 2026-10-31 readings.
   - Add the 2.1.316 observations as dated bullets in the existing sections:
     - placeholders and their leftovers unchanged;
     - `config.worktree` again with no rule naming it, under the third ask's section;
     - the 21 built-in leftovers, 0-byte and read-only after a kill, under `### Claude Code's built-in protected paths`.
   - Add AP8's result where it fits, as an observation with no mechanism: inside a sandboxed call, `dd if=/dev/null of=<clone>/.git/commondir conv=notrunc` for an absent path named by no deny entry or rule reported success, and the file never appeared on disk.
5. **`docs/cli.md` §6 residual 12, status sentences only.**
   - **The lead paragraph.** Add the 2026-10-31 session (Claude Code 2.1.316) to what **Measured** means. Point the review-file references at `docs/sandbox-verification.md` §5, now that it records them. Replace "AP1–AP6, and the control and `dd` rows … are owed again on `fix_linux_sandbox_sibling_glob_trio`'s head" with what was taken on 2026-10-31 (AP1–AP6 `pass`, AP8 *not on disk; `dd` reported success*, AP7 recorded) and what is owed (AP9, and AP1–AP6 on this round's head).
   - **"**What can run.**".** Replace "Sandboxed git in the run copy was predicted; AP1 measured it failing on 2026-10-30 …" with measured on 2026-10-31: sandboxed `git status` in the run copy exits 0 in phases A and B. Keep the 2026-10-30 failure as the earlier reading.
   - **The built-in-leftovers bullet.** Replace "Unmeasured: the full post-kill list, and each leftover's type and mode, because the check script truncated the reading. This round's Finding 5 changes that script so the owed re-take measures them." with the 2.1.316 measurement from item 3.
   - Leave the first "**What a run cannot rely on:**" bullet to Finding 2.

**Evidence.** Prose only. Re-read each edited table row against the review's quoted text, and grep that no `not run — owed` remains in the AP1–AP8 rows of the round's-head table.
