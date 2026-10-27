### 5. The Linux-legs deferral cites "sandbox3b", which resolves to nothing in the tree, instead of a numbered roadmap item

**Sites:**
- `docs/development.md` → `**The rows this probe does not take, named so the list is complete.**` — "are sandbox3b's, `feat_sandbox_probe_linux_legs`"
- `scripts/lib/sandbox-probe/preflight.sh` (`sp_preflight`) — "the Linux legs are sandbox3b's" (the refusal message), and the header's check 2 — "The Linux legs are sandbox3b's."
- `scripts/sandbox-probe.sh` (header) — "macOS only on this branch; the Linux legs are sandbox3b's."
- `cli/test/sandbox-probe-shell.test.mjs` — `assertRefused(run, "this probe measures the macOS sandbox and 'uname -s' is 'Linux'; the Linux legs are sandbox3b's")`

`.claude/context/conventions.md` → `## Documents of record`: *"A deferral cites a numbered roadmap item, and the number owes a row. The legend is `docs/development.md` → `## 6. The roadmap this tree defers to`."* Gate 15 defers the Linux legs to "sandbox3b", and the probe's macOS refusal tells the person who hit it that those legs are "sandbox3b's".

"sandbox3b" is a label from this branch's task prompt under `harness-runs/`. No document of record defines it, so a reader of Gate 15, and a maintainer refused at a Linux terminal, gets a pointer that leads nowhere. The roadmap does carry the item this work belongs to: `docs/development.md` → `## 6` row 21, *"Measuring what the unattended sandbox breaks, and rewriting the containment statements to what it is measured to hold"*. `docs/sandbox-verification.md` already cites that row in the same way (row `CS11`: *"(roadmap item 21; …)"*).

**Fix.** Replace each occurrence with the roadmap citation, keeping the branch name where it already appears:

- `docs/development.md` Gate 15: *"…and the Linux-only legs are owed under roadmap item 21 (§6), on the branch `feat_sandbox_probe_linux_legs`, and this probe refuses to start off macOS."*
- `scripts/lib/sandbox-probe/preflight.sh`, the `sp_preflight_refuse` message in check 2: `"this probe measures the macOS sandbox and 'uname -s' is '$uname_s'; the Linux legs are owed under roadmap item 21 (docs/development.md §6)"`. The header's check-2 line becomes `2. Not macOS (`uname -s` is not Darwin). The Linux legs are owed under roadmap item 21 (docs/development.md §6).`
- `scripts/sandbox-probe.sh` header: `# macOS only; the Linux legs are owed under roadmap item 21 (docs/development.md §6).`
- `cli/test/sandbox-probe-shell.test.mjs`: change the asserted string to `"this probe measures the macOS sandbox and 'uname -s' is 'Linux'; the Linux legs are owed under roadmap item 21 (docs/development.md §6)"`.

That test file is the one this fix edits, so it is the only test file the fix runs.
