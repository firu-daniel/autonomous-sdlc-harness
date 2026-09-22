### 2. The size bullet's per-chunk figure and two-anchor fit do not follow from the byte counts the same section records

**Site.** `docs/retrieval-eval-results.md` → `## Cold build and index size` →
`### The real-catalog build — 1,960 chunks, 2026-09-22` → the paragraph
`**What this did to the extrapolation, in both directions.**` → the second bullet, the one beginning
`- **Size missed, by 5.6×.**`. Added by this branch (Task 1). It is the only site in the tree carrying these
figures — `git grep -n '5\.6×\|37\.6\|16\.5 kB\|40\.3 MB' -- '*.md' ':!harness-runs' ':!examples'` returns three
lines, all inside this one bullet — so the fix is contained to it.

## The problem

Three numbers in that bullet do not follow from the byte counts printed a few lines below it, and one of the two
anchors it fits is taken on a different basis from the other. The bullet reads:

> - **Size missed, by 5.6×.** The index is **37.6 kB per chunk** at 1,960 chunks against the **244 kB** the
>   extrapolation used, and the **~366 MB** it projected at ~1,500 chunks overshoots by **5.6×** — the fit
>   gives ~65 MB there. The two-point fit, over its two anchors **43.2 MB @ 177 chunks** and **72 MB @ 1,960
>   chunks**, is **~40.3 MB fixed overhead plus ~16.5 kB per chunk** […]

**(a) 37.6 kB per chunk is not any of the three figures this section records.** The section's own cross-check
table gives three index sizes at 1,960 chunks, and none of them divides to 37.6 kB:

| Recorded figure | Source in this section | ÷ 1,960 |
| --- | --- | --- |
| `du -sh` **72M** | leg (iii) run table and the cross-check table | 36.7 kB |
| `apparentBytes` **74,195,245** | cross-check table | **37.9 kB** |
| `allocatedBytes` **75,808,768** | cross-check table | 38.7 kB |

**37.9 kB is the one that belongs in that sentence**, because the 244 kB it is compared against is the
*apparent* row: the 177-chunk table states `| Apparent size (sum of size) | 43,163,949 B (43.2 MB) | 244 kB |`,
and 43,163,949 ÷ 177 = 243,864 B. Comparing 37.6 kB (no recorded basis) to 244 kB (apparent) is not a
like-for-like comparison, which is the same defect the already-applied code-review finding 1 corrected in the
time bullet directly above this one.

**(b) The fit's slope does not follow from the fit's own stated anchors.** With the anchors the bullet names,
43.2 MB @ 177 and 72 MB @ 1,960: (72 − 43.2) MB ÷ (1,960 − 177) chunks = 28.8 MB ÷ 1,783 = **16.2 kB per
chunk**, not the stated ~16.5 kB.

**(c) The two anchors are on different bases.** 43.2 MB is the *apparent* sum-of-`size` figure; 72 MB is
`du -sh`, which the cross-check paragraph itself identifies as *"the allocated one rounded to the megabyte"*.
Fitting an apparent anchor against an allocated-and-rounded one mixes two measures that the 177-chunk table
deliberately keeps in separate rows. On a consistent apparent basis, using the two byte counts this file already
prints:

- slope = (74,195,245 − 43,163,949) ÷ 1,783 = 17,404 B = **~17.4 kB per chunk**
- fixed = 43,163,949 − (17,404 × 177) = **~40.1 MB**
- at ~1,500 chunks = 40.1 MB + 26.1 MB = **~66 MB**, so the ~366 MB projection overshoots by **5.5×**

**Why it matters, and why it is only a Should Fix.** Every qualitative conclusion the bullet draws survives the
correction untouched — the index is still fixed-cost dominated, the original 244 kB is still a fixed cost
divided by a small chunk count, the projection still overshoots by more than five times, and no new projection
is published. Nothing downstream re-derives anything from these numbers: `docs/retrieval.md` deliberately
restates none of them and cites this section, and `docs/development.md` row 17 does the same. What is wrong is
that the **file of record** — the one place these numbers are written, and the document whose entire subject is
correcting a figure that was a fixed cost divided by a small sample — publishes a per-chunk figure with no
recorded basis and a fit whose slope its own anchors contradict.

**On the task prompt's prohibition.** The prompt forbids re-running a leg and re-deriving a figure the block
carries. This fix does neither: it re-labels and re-divides byte counts already recorded in this file, exactly
as the branch's own already-applied code-review finding 1 did for 60.87 ms, 55.7 ms and 55.1 ms. No measurement
is repeated and no new measurement is asserted.

## The fix

Replace the whole `- **Size missed, by 5.6×.**` bullet with:

> - **Size missed, by 5.5×.** The index is **37.9 kB per chunk** at 1,960 chunks (`apparentBytes` 74,195,245 ÷
>   1,960) against the **244 kB** per chunk the extrapolation used — both figures apparent, which is the basis
>   the 177-chunk table's own 244 kB row is on. The **~366 MB** that extrapolation projected at ~1,500 chunks
>   overshoots by **5.5×**: the fit gives ~66 MB there. The two-point fit, over its two anchors on that same
>   apparent basis — **43,163,949 B (43.2 MB) @ 177 chunks** and **74,195,245 B (74.2 MB) @ 1,960 chunks** — is
>   **~40.1 MB fixed overhead plus ~17.4 kB per chunk**: the index is fixed-cost dominated, and the original
>   number was a fixed cost divided by a small chunk count — the same error shape as the struck 60-second rule
>   and as the six-minute download prediction leg (i) replaced. (The `du -sh` **72M** in the runs table is the
>   allocated figure rounded to the megabyte, which is why the fit is stated on the apparent pair rather than on
>   it.) **No projection beyond those two anchors is published here**: one further data point buys a fit, not a
>   third extrapolation.

Change nothing else in the subsection. In particular leave the run table, the cross-check table, the
`**Time held.**` bullet and the three phase-breakdown bullets exactly as they are — all of their arithmetic
checks out against the recorded figures.
