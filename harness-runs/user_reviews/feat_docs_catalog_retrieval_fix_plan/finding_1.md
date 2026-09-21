### 1. `docs/retrieval.md` → `## Trade-offs` is mis-titled

**Site anchor.** `docs/retrieval.md` → `## Trade-offs` (the file's last section; its five bullets open `**Local, not hosted.**`, `**Embedded and in-process.**`, `**One Postgres engine rather than two stores.**`, `**At scale.**` and `**The costs, stated plainly.**`). Line 79 today, a navigation hint only.

**Problem.** The heading promises trades and delivers mostly upside. Four of the five bullets are design choices that *benefit* the adopter — local and private, embedded and in-process, one engine rather than two stores, and the at-scale adapter seam — and only the fifth, `**The costs, stated plainly.**`, is an actual cost. An adopter skimming for whether to turn the feature on reads a heading that tells them to expect reasons not to, and gets three reasons to. The section's content is right; its framing sells the feature short and buries the one paragraph a reader genuinely needs to weigh.

**Fix.** Replace the single `## Trade-offs` section with three sections, in this order. **Keep every measured fact exactly as written** — the ~300 MB figure, the PGlite pinning reason, the two extension names, the `DocStore` connection-string path. Change only the headings and the framing prose around them; add no new claim and drop none.

- [ ] `## What this buys you` — three bullets, from the first three of today's five:
  - `**Local, not hosted.**` — an adopter's docs never leave their machine; no hosted vector database, no embedding or rerank API, so there is no key to manage and nothing to reach from an unattended run.
  - `**Embedded and in-process.**` — no database server to install or keep running; the index is a per-checkout cache its worktree owns and can rebuild.
  - `**One Postgres engine rather than two stores.**` — BM25 and vectors share one transaction, one set of chunk ids and one refresh, so the lexical and vector arms can never describe different corpus states; one dependency to pin rather than two.

- [ ] `## Where it goes next` — today's `**At scale.**` bullet, reframed as an **adapter seam deliberately kept open** rather than as a limitation. The substance is unchanged: at millions of chunks the move is a real Postgres with the same two extensions, `pgvector` and `pg_textsearch`, behind the same `DocStore` interface, reached by connection string; the store keeps its SQL to plain Postgres plus those extensions so that stays possible. Keep the sentence stating this branch does not build it — that is a scope fact, not a framing choice.

- [ ] `## What it costs` — today's `**The costs, stated plainly.**` bullet, promoted from one bullet to the section, with its three costs as their own bullets: about 300 MB of runtime per machine; a PGlite version pinned exactly, because the two extension packages dictate it; and an index that is a second representation of the docs, which is why it is never committed and always rebuildable.

**Check before finishing.** A cited heading is a wire — its text has to travel byte-identical when the section moves, because a rename strands every citer — so sweep for the citers with the prescribed grep rather than an ad-hoc list of likely files:

- [ ] Run `grep -rn "Trade-offs" .` and `grep -rn "trade-offs" .` (which catches the `#trade-offs` anchor form) across the whole tree, excluding `.git/` and the run-artifact tree, and take **the whole result set** as the work — not a sampled subset. `README.md`, `docs/`, `ARCHITECTURE.md` and the `plugin/` corpus are where hits are expected, but the grep result is what binds.
- [ ] Repoint each hit at whichever of the three new sections carries what it was citing. `README.md`'s pointer (`its design, measured facts and trade-offs`, line 218 today, a navigation hint only) is one such reference: re-word it against the new section names.
- [ ] Re-run the same greps after the edit; every remaining hit must be one that legitimately uses the words in running prose about something other than this section.
