### 2. Stop grounding the cancellation on cost in the file of record

**Site.** `docs/retrieval-eval-results.md` → `## Cold build and index size`, the paragraph beginning
`**What replaces the constant.**`, and specifically its closing clause quoted
*"`docs/retrieval.md` carries that decision; this section carries the figures it is taken on"*.

## The problem

The paragraph says that with the 60-second rule struck, *"where the build belongs is then a **cost** question"*, that
`docs/retrieval.md` carries that decision, and that this section carries **the figures the decision is taken on**. The two
documents that actually own the decision say the opposite, in so many words:

- `docs/retrieval.md` → **Why `setup-worktree.sh` does not warm the index.** grounds it on coverage —
  *"The cold build stays inside the first `search_docs` call, because that is the only mechanism serving every entry
  point"* — and then states outright, at the end of the `**What the move would have cost…**` passage, *"the move is close
  to free rather than a trade. It is cancelled on **coverage, not on cost**."*
- `docs/development.md` → `## 6. The roadmap this tree defers to`, row 17, opens its justification with
  *"**The reason is not a measurement.**"* and closes *"it is cancelled because it buys nothing the in-line build does
  not already give every entry point, not because it costs too much."*

So the file of record tells a reader that the cancellation rests on the figures in that very section, while both homes of
the decision tell them it rests on a mechanism property and on no figure at all. This is the exact substitution the task
prompt's third-named risk warns about and that acceptance 6 is written to prevent — *"records the item as cancelled, on
the stated reason … rather than on a figure"* — landing in the one document acceptance 6 does not name, and therefore in
the one place the branch's own verification did not check it.

It is a Should Fix rather than a Must Fix because the decision is stated correctly in both of its owning documents and no
consumer routes through this sentence to reach it: the cancellation is not re-derived from this section by anything. What
is wrong is the claim this section makes about its own role.

What *is* true, and is worth keeping, is the narrower point the paragraph is reaching for: cost is what would **reopen**
the question, which is precisely how `docs/retrieval.md` → `**What would reopen the question.**` uses it. The figures here
are that reopener's evidence base, not the cancellation's grounds.

## The fix

Replace the paragraph's closing two sentences. Currently:

> Where the build belongs is then a **cost** question, what warming is worth to the worktree that pays it, and not a
> timeout question. `docs/retrieval.md` carries that decision; this section carries the figures it is taken on, for two
> corpora, each with its own host and corpus stamp.

with:

> Where the build belongs is then no longer a timeout question at all. `docs/retrieval.md` carries that decision, and it
> is taken on **coverage** rather than on any figure in this section: the first `search_docs` call is the only mechanism
> that serves every entry point, so the build stays there and roadmap item 17 is cancelled. What the figures below bear
> on is the **cost** side — what warming would be worth to the worktree that pays it — which is what would reopen the
> question rather than what settles it. They are recorded for two corpora, each with its own host and corpus stamp.

Change nothing else in the section; the struck-rule bullets above this paragraph and the subsections below it are correct
as written.
