### 2. Roadmap item 18 still reads as owed work: "Withdrawing docs retrieval"

**File:** `docs/development.md` (`## 6. The roadmap this tree defers to`) — the table row beginning "| 18 | Withdrawing docs retrieval, the change the decision rule named on a real catalog.", and the paragraph beneath the table beginning "**Items 3, 4, 13 and 14 have shipped**".

**The problem.** Row 18 describes the withdrawal as the change still to be made — it lists what the withdrawal removes (the `docs` verb, its optional peers, `ABSTAIN_SCORE_THRESHOLD`, the plugin's `search_docs` grants, the `docs.retrieval` key) and says the deciding branch "deliberately did not execute it". The maintainer has decided it is not executed at all. And the paragraph under the table says "everything not named in this paragraph or marked in its own row is still owed", so an unmarked row 18 still reads as outstanding work.

**Fix.**

1. **Replace row 18's text, keeping the number `18`** — the row keeps its number and its place because citations to "item 18" exist across the tree (`docs/cli.md`, `docs/config.md`, `docs/retrieval.md`, `ROADMAP.md`, `docs/retrieval-eval-results.md`), and the paragraph under the table ("Every number that command reports, other than 1 and 2, must have a row above") requires it. Mark it in its own row the way item 17 is marked (`**CANCELLED.**`). Suggested text:

   ```markdown
   | 18 | **NOT EXECUTED, by maintainer decision.** Withdrawing docs retrieval was the change the decision rule named on a real catalog: arm E's relevance did not clear against the stronger arm A variant, so `docs/retrieval-eval.md` → `## The decision rule` names **withdrawn**, and `docs/retrieval-eval-results.md` → `## The decision, applied to the real catalog` keeps that verdict and its figures unchanged. The maintainer did not execute it and keeps retrieval opt-in: it is a working system measured once, on one kind of corpus — a small, technical catalog searched with identifier-dense queries, where grep is strongest — with its smallest-model stack unoptimised, and it costs an adopter nothing while off. The decision and its full reasons are recorded in that section's `### The maintainer's decision`. Nothing is owed under this number: the `docs` verb, its optional peers, `ABSTAIN_SCORE_THRESHOLD`, the plugin's `search_docs` grants and the `docs.retrieval` key all stay. The row keeps its number and its place — a citation written before the decision still has to resolve to something |
   ```

   The "reasons in one or two sentences" requirement is the sentence starting "The maintainer did not execute it"; keep it to that length.

2. **Name item 18 in the paragraph under the table**, next to item 17, so the "everything not named … is still owed" rule does not class it as owed. After the sentence "**Item 17 is neither shipped nor owed:** it is **cancelled**, and its own row states on what reason." add: "**Item 18 is neither shipped nor owed either:** the withdrawal it named was **not executed**, by maintainer decision, and its own row points at where that decision is recorded."

**Depends on:** Finding 1 (the `### The maintainer's decision` subsection this row points at).

**Verification.** `grep -rn -E "items? [0-9]+" . --exclude-dir=node_modules --exclude-dir=dist` from the repository root (the command §6 itself gives) still reports 18, and row 18 still exists; `bash scripts/test.sh`.
