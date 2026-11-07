### Task 7 — Bring `docs/watcher.md`'s containment sentences in line with the record

**Goal:** The three `docs/watcher.md` sentences that describe containment out of date with `docs/sandbox-record.md` say what the record says, or link it: the probe-reach sentences under the outer-loop table, and the two per-run-profile statuses that still call recorded results owed.

**This is a catch-all task** (`path` `"."`): its implementer reads every configured layer's conventions document.

**Where this task stops.** `docs/watcher.md` only. Every `docs/sandbox-record.md`, residual N citation sandbox3c wrote stays as it is, and so do the quoted runtime log lines in §4 (`… docs/cli.md §6)`), which are roadmap item 32's and runtime strings this branch does not change. The scratch runner's own header paragraph this file cites, *WHAT THIS DOES NOT CONTAIN*, is rewritten by Task 1 to say that the probe runs inside the sandbox and reaches, inside its write roots, what a command string is refused; this file's sentences must agree with that and cite it by the same heading.

**What the record says** (`docs/sandbox-record.md`): §1 — every Bash command and every process it starts is inside the sandbox; §4 `scratch` leg — SR2 **pass**, a write outside the sandbox's roots from a probe refused; §2 — CS2 **pass**, the main checkout's whole `.git` refused to a sandboxed command; no row drives a deny-listed basename from inside a probe under the sandbox, so which of their effects the sandbox stops is **not measured**. Residual 12 — AP1–AP6 **pass** and AP9 **pass** on the second round's head (AP6 is the sibling row: a sibling's absent trio paths stay absent during a sandboxed call; AP9 is the guard refusing a `Write` to the run copy's own absent `commondir`); AP8, the `dd` row, reads *not on disk; `dd` reported success*; the control is `docs/sandbox-verification.md` §5 *Session 2*, AP7, **recorded** (not graded).

### Targets

- `docs/watcher.md` → the paragraph **Why only the `yes` rows carry a profile entry, and why that is not the reachability answer.**
- `docs/watcher.md` → `### The per-run profile` → **What it adds.**, and the sibling-trio bullet under it.

**Work:**

- [ ] **The reachability paragraph.** Keep every sentence up to *"…no command string an unattended run composes starts a run about itself, bounces the daemon supervising it, reaches the sweep's `git branch -D`, or dispatches, pauses or cancels a remote run through `remote-run.sh`."* Rewrite the sentences from *"**That is a bound on command strings, not on the run.**"* to *"The layer that holds for a subprocess is the `pre-push` git hook."*: it is still a bound on command strings; `scratch-run.sh` runs a file the agent wrote, and under the unattended profile that file runs inside the sandbox, held to its write roots and network allowlist ([`sandbox-record.md`](sandbox-record.md) §4, SR2), and inside them reaches what a deny-listed basename does as far as the sandbox lets it — which of the five the sandbox stops is not measured; its own header says so under *WHAT THIS DOES NOT CONTAIN*, `docs/outer-loop-verification.md` §3 records the pre-sandbox reach, and the `pre-push` hook still holds for a push git performs. Keep the rest of the paragraph, from **That guard auto-allows the `no` rows …**, unchanged.
- [ ] **What it adds.** Replace *"to be recorded in `docs/sandbox-verification.md` §5 by this round's Finding 6"* with *"recorded in `docs/sandbox-verification.md` §5 as *Session 2*, AP7"*. Change nothing else in that sentence.
- [ ] **The sibling-trio bullet.** This bullet is about re-rooting the trio at **other** sibling run copies, so its evidence is the sibling row. Replace *"its effect predicted, AP1–AP7 and the `dd` row owed"* with the measured state in residual 12's own words: AP1–AP6 **pass** on the second round's head, AP6 being the sibling row — a sibling's absent trio paths stay absent during a sandboxed call; AP8 (the `dd` row, which is about the run copy's own trio) reads *not on disk; `dd` reported success*; and the control, AP7, is **recorded** (not graded). Do not cite AP9 here: it measures the guard refusing a `Write` to the run copy's **own** absent `commondir`, not the siblings' trio. Keep the existing `docs/sandbox-record.md`, residual 12 citation as the owner. State no row more strongly than residual 12 does.

**Verification:**

- `git grep -n -E "this round's Finding 6|AP1–AP7 and the .dd. row owed|That is a bound on command strings, not on the run" -- docs/watcher.md` finds nothing that still reads as before; the reworded bound sentence, if kept, now names the sandbox.
- `git grep -n -F "WHAT THIS DOES NOT CONTAIN" -- docs/watcher.md` still finds the citation.
- `git grep -c -F "sandbox-record.md" -- docs/watcher.md` is not lower than before the edit: no sandbox3c pointer was removed.
- Re-read each verdict written against residual 12 and its rows; none is stronger.
- Re-run the story index's derivation entry C over `docs/watcher.md` and confirm every reached hit is a register row.
