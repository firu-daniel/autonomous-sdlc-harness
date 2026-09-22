### 2. A deferral in `docs/retrieval.md` cites no numbered roadmap item

**Site.** `docs/retrieval.md` → the section **Why `setup-worktree.sh` does not warm the index**, the
paragraph beginning *"The standing rule is that a cold build costing more than 60 seconds moves out of
the agent's path and into `setup-worktree.sh`"*, and specifically its closing clause:

> **the rule trips, and the recorded decision is that the cold build belongs in `setup-worktree.sh`**
> rather than in an agent's first `search_docs` call. This branch does not make that move — it changes
> no script — so what ships is still the in-line build, correct for any catalog under that crossover
> and over budget above it.

**Rule it violates.** `.claude/context/conventions.md` → `## Documents of record`: *"**A deferral cites
a numbered roadmap item, and the number owes a row.** The legend is `docs/development.md` → `## 6. The
roadmap this tree defers to`; a deferral whose numbered roadmap item has no row there is a defect."*

The passage is a deferral in the strict sense the rule means: a **decision taken** that a named change
belongs in a named file, plus an explicit statement that this branch does not make it. It cites no
number. A grep for `setup-worktree` across `ROADMAP.md` and `docs/development.md` returns exactly one
hit — `docs/development.md` line 488, inside gate 10's leg (iii) — and that hit is a *revisit
condition* ("if it is met, warming in `setup-worktree.sh` is the move"), not a roadmap row that owns
the work. So the branch has converted an open question into a settled decision with deferred
implementation, and no row anywhere owns the implementation.

**Why it matters architecturally.** `docs/development.md` → `## 6` is the single legend every deferral
in the tree resolves against; its own opening says references *"cite a number and nothing else, so
without it a reader has no way to turn 'item 5' into a description."* A deferral that names no number
is invisible to that legend: there is no row a later reader or a later branch can find, so the work has
no owner and the decision is recoverable only by reading this one paragraph of one reference document.
The section also now sits in tension with `docs/development.md` line 488, which still frames the move
as conditional on a measurement that has not been taken, while `docs/retrieval.md` records the rule as
already tripped on an extrapolation.

**The fix.** Two edits, in this order:

1. Add a row to `docs/development.md` → `## 6. The roadmap this tree defers to` for the deferred move —
   the cold build leaving the agent's first `search_docs` call for `setup-worktree.sh` — written in the
   same shape as the existing rows (what it delivers, and the limits it states rather than leaves to be
   discovered, including that the trip is an extrapolation from 62.51 ms per chunk rather than a measured
   catalog).
2. In `docs/retrieval.md`, have that paragraph cite the new item by number where it says *"This branch
   does not make that move"*, so the deferral resolves against the legend.

Do not resolve this by softening the paragraph back to an open question: the extrapolation and the
crossover figure are measured facts this branch earned, and `docs/retrieval.md` is their correct home
(`.claude/context/conventions.md` → `### Where a new responsibility goes`, *"a measured fact or a
decision of record | `docs/`, and nowhere else"*). What is missing is the roadmap row the decision owes,
not the decision.
