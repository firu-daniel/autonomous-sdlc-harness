### 4. The results file says the withdrawal removes `ABSTAIN_SCORE_THRESHOLD` and every mode

**File:** `docs/retrieval-eval-results.md` — three hand-written passages outside the generated region:

- (a) `## Threshold calibration` → the "**The value.**" paragraph — "so the constant goes with the tool under roadmap item 18".
- (b) `## Threshold calibration` → `### The limit on this calibration` → the "**What would move the value next.**" paragraph — "Nothing on this branch: the withdrawn outcome removes the constant with the tool (roadmap item 18). Were that decision reversed,".
- (c) `## The shipped default against fusion alone` → the "**What this section does not decide.**" paragraph — "roadmap item 18 in … withdraws the tool with every mode in it. A change that reverses that verdict and keeps docs retrieval is where".

**The problem.** Each passage states, as the tree's settled future, that the withdrawal removes the threshold constant (a, b) or every search mode (c). The maintainer kept retrieval opt-in (Finding 1), so the constant stays and what would move it next is a re-calibration, not a removal; and the default-mode decision is open, not moot.

**Fix.** Edit only these sentences; keep every figure, the method's result (`cannot-separate`), the value `0.32` and the rest of each paragraph.

- (a) Replace "The decision of record is also **withdrawn** (`## The decision, applied to the real catalog`), so the constant goes with the tool under roadmap item 18 in `docs/development.md` → `## 6. The roadmap this tree defers to`." with, in substance: "The decision of record is **withdrawn** (`## The decision, applied to the real catalog`), and the maintainer kept retrieval opt-in rather than execute it (`### The maintainer's decision` there), so the method's *On a withdrawn verdict* clause below was not acted on: the constant stays, at this value, until a re-calibration moves it."
- (b) Replace "Nothing on this branch: the withdrawn outcome removes the constant with the tool (roadmap item 18). Were that decision reversed, the method returns a value only when…" with, in substance: "A re-calibration, not a removal — retrieval is kept opt-in (`## The decision, applied to the real catalog` → `### The maintainer's decision`), so the constant stays with the tool. The method returns a value only when…", keeping the rest of that sentence and the next one ("…so that takes a different reranker or a different query set, measured and pooled the same way.") as they are.
- (c) Replace "While the verdict of record in `## The decision, applied to the real catalog` stands, it does not arise: roadmap item 18 in `docs/development.md` → `## 6. The roadmap this tree defers to` withdraws the tool with every mode in it. A change that reverses that verdict and keeps docs retrieval is where the default mode and the scope of abstention would be decided, against this table." with, in substance: "The verdict of record is withdrawn and the maintainer kept retrieval opt-in (`## The decision, applied to the real catalog` → `### The maintainer's decision`), so the decision is open rather than moot: a later change that takes it decides the default mode and the scope of abstention, against this table." Keep the sentence before it ("That decision stays open, and it is not taken in this file.").

**Deliberately not edited, and why** — so no reviewer re-raises them:

- `### The re-calibration method, fixed before the real-catalog run` → "**On a *withdrawn* verdict** the distributions are recorded here and the constant goes with the tool." That subsection is a method fixed before any figure existed and says of itself that it "is kept as written when the rest of this section is rewritten". Changing it would falsify the pre-registration. Passage (a) records that its clause was not acted on.
- `## The decision, applied to the real catalog` — the "**The outcome: withdrawn.**" paragraph, `### The verdict`'s "**The change it names: roadmap item 18**" paragraph, and `### Findings about the rule`'s bullet "its withdrawn outcome removes every mode". The user's review keeps the figures, the grading and the verdict unchanged, and these describe what the rule's outcome names rather than what the tree does. Finding 1's new subsection sits beside them.
- Everything between `<!-- eval:generated:start -->` and `<!-- eval:generated:end -->`, and the `withdrawal` hits in query ids such as `q-g10-ew-withdrawal-labels-romanian`, which are product vocabulary of the measured catalog.

**Depends on:** Finding 1.

**Verification.** `grep -n "goes with the tool\|removes the constant\|withdraws the tool" docs/retrieval-eval-results.md` should return only the method line kept above; `bash scripts/test.sh`.
