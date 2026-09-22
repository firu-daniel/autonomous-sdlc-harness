### 1. Label the CLI route's per-chunk figure as total wall time, not refresh

**Site.** `docs/retrieval-eval-results.md` → `## Cold build and index size` →
`### The real-catalog build — 1,960 chunks, 2026-09-22`. Two places inside that subsection:

- the cross-check table row quoted `| Refresh per chunk | 60.87 ms median | 55.1 ms |`, under the paragraph beginning
  `**Acceptance 2a — the eval-route cross-check, both routes labelled.**`
- the bullet beginning `- **Time held.** Refresh measured **60.87 ms per chunk**`, under the paragraph
  `**What this did to the extrapolation, in both directions.**`

## The problem

The section attributes a **refresh** figure to the CLI route, which cannot produce one, and the section says so itself two
paragraphs earlier. The cross-check paragraph opens by stating that `measureColdBuild` *"separates the phases the CLI route
reports as **one wall time**"*, and the leg (iii) write-up above records four **wall times** and one `du -sh` figure and
nothing else. `docs/development.md` §5's own leg (iii) text is consistent with that: it asks the operator to record the
summary line, the wall time and the `du` figure. There is no per-phase decomposition on the CLI route to read a refresh
out of.

The 60.87 ms is in fact the **total wall time divided by the chunk count**, and the three numbers in the bullet make that
unambiguous against the run table in the same subsection:

- 111.25 s ÷ 1,960 = 56.76 ms — the bullet's stated `min`
- 119.30 s ÷ 1,960 = 60.87 ms — the bullet's stated median
- 127.58 s ÷ 1,960 = 65.09 ms — the bullet's stated `max`

The eval route's 55.1 ms, by contrast, is a genuine refresh figure: 107,984 ms ÷ 1,960 = 55.1 ms, and the subsection's
own phase-breakdown bullet states that refresh as 107,984 ms of a 109,260 ms total.

Two consequences, and the first is why this is a Must Fix rather than a wording nit.

**The table contradicts the prose beside it.** The paragraph immediately under the table declares *"There is no
disagreement to investigate, and neither route is chosen over the other"* and then justifies that on the totals being
1.8% apart and on the size figures agreeing. It never addresses the row directly above it, where the two routes differ by
**10.5%** (60.87 against 55.1). A reader who takes the row at its label reads an unexplained ten-percent route
disagreement in a section that has just told them there is none — and `## Establish, do not assume` in the task prompt,
and the branch's own leg (iii) write-up, both make a point of investigating a divergence rather than letting it stand. The
divergence here is not real; it is the label.

**This is the file of record.** `docs/retrieval.md` and `docs/development.md` both deliberately restate none of these
numbers and cite this section as their one home, so a mislabelled row here is the only copy anyone downstream can read.
`.claude/context/conventions.md` → `## Documents of record` requires that *"a measured fact states what was measured"*,
and what was measured on the CLI route is a total.

**Note on scope.** The task prompt forbids re-deriving any figure the block carries, and the fix below does not: 55.1 ms,
60.87 ms, 107,984 ms and 62.51 ms are all already in the block or already in this file. The fix is a relabel plus one
sentence, not a recomputation, and it deliberately leaves the **linear-and-lucky** reading exactly as written — that
reading is the prompt's own and is not this finding's to revisit.

## The fix

- [ ] Relabel the table row so each cell says what its route measured. Replace

  ```
  | Refresh per chunk | 60.87 ms median | 55.1 ms |
  ```

  with two rows:

  ```
  | Total per chunk | 60.87 ms median (min 56.76, max 65.09) | 55.7 ms (`totalMs` ÷ 1,960) |
  | Refresh per chunk | — (the CLI route reports one wall time) | 55.1 ms (`refreshMs` ÷ 1,960) |
  ```

- [ ] Add one sentence to the paragraph beginning `**There is no disagreement to investigate…**`, after the
  sentence about `du -sh`, so the row is accounted for rather than left standing:

  > The per-chunk rows are the same comparison in per-chunk units — the CLI route's figure is its total divided by the
  > chunk count, because that route reports one wall time and no phases, so the only like-for-like pair is the two totals.

- [ ] Correct the `**Time held.**` bullet's first clause so it names the quantity it compares. Replace

  > **Time held.** Refresh measured **60.87 ms per chunk** (min 56.76, max 65.09) against the **62.51 ms** the
  > extrapolation used — within **2.6%** of the median.

  with

  > **Time held.** The cold build measured **60.87 ms per chunk of total wall time** (min 56.76, max 65.09) against the
  > **62.51 ms** of per-chunk *refresh* the extrapolation used — within **2.6%** of the median. The two are not the same
  > phase: the CLI route reports one wall time, and the like-for-like refresh figure is the eval route's **55.1 ms**,
  > which runs **11.9%** under the extrapolated one. Both readings are recorded because the prediction was a refresh
  > figure and the shipped route cannot isolate one.

  Leave the rest of the bullet — the **linear-and-lucky** reading and the thermal-band sentence — unchanged.
