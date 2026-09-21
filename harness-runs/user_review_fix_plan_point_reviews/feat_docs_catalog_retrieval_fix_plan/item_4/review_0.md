# general review — 4. Gate 10 measures no real-catalog retrieval cost — iteration 0

All four fix items in `finding_4.md` land, and the citations they add resolve:
`docs/retrieval.md` → `**Why `setup-worktree.sh` does not warm the index.**` exists, `## Measured, and how` item (d) exists,
and the `docs index: <files> files, <chunks> chunks; embedded <e>, unchanged <u>, deleted <d>` line the gate now reads the
chunk count off is the literal that `cli/src/commands/docs.ts` emits. `docs/development.md`'s "docs retrieval" wording is
untouched, per the Finding 2 exemption. No Must Fix, no Should Fix.

## Nice to Have
1. **The corpus floor can be confirmed one leg earlier than the gate says** — `docs/development.md` (`**Gate 10 — docs retrieval with the real models.**` lead paragraph) — "The chunk count is read off leg (iii)'s own `docs index: <files> files, <chunks> chunks` summary line"
   True, but it means a runner who built an undersized corpus discovers it only after paying for legs (i)–(iii). `doctor`'s
   `retrieval-index` check — leg (ii) — spawns `docs index --in-memory` and puts the child's **stdout** into its own PASS
   message (`cli/src/doctor/checks.ts` → `RETRIEVAL_INDEX_CHECK`, `return pass(line === undefined ? child.stdout.trim() : …)`),
   so leg (ii)'s pass line already carries the same chunk count, at no extra cost and with nothing written to disk.
   *Confirmation is by reading `cli/src/doctor/checks.ts` and `cli/src/commands/docs.ts`; no probe was run and `doctor` was not executed.*
   **Fix:** in the lead paragraph, say the count may be read off leg (ii)'s `retrieval-index` PASS line and is confirmed again
   on leg (iii)'s summary line — e.g. "The chunk count appears on leg (ii)'s `retrieval-index` PASS line and again on leg (iii)'s
   `docs index: <files> files, <chunks> chunks` summary line; a run whose count falls under the floor is invalid".

2. **Leg (iii)'s closing clause restates the target paragraph's own consequence sentence** — `docs/development.md` (leg `**(iii) Cold build.**`) — "if it is met, warming in `setup-worktree.sh` is the move"
   `docs/retrieval.md` → `**Why `setup-worktree.sh` does not warm the index.**` already ends "Warming in `setup-worktree.sh` is
   then the move.", and leg (iii) now cites that paragraph by name one sentence earlier. The revisit condition itself is worth
   stating here (a runner needs to know what the wall time is judged against); the consequence is the cited document's to state.
   **Fix:** drop the trailing "; if it is met, warming in `setup-worktree.sh` is the move" and end the sentence at
   "This wall time is the number that condition is judged against."
