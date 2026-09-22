### 7. The 60-second crossover is computed over the refresh phase, while the rule it is applied to is stated over the whole cold build

**Site.** Three durable statements of the same number:

- `docs/retrieval-eval-results.md` → `## Cold build and index size` → the opening **The decision this section settles, first.** paragraph (*"extrapolates to **93.8 s** … and crosses 60 s at about **960 chunks**"*).
- `docs/retrieval.md` → **Why `setup-worktree.sh` does not warm the index.** → the standing-rule paragraph (*"93.8 s of refresh and 94.8 s in total, crossing 60 s at about 960 chunks"*).
- `docs/development.md` → `## 6. The roadmap this tree defers to` → the item 17 row (*"93.8 s of refresh, 94.8 s in total, crossing 60 s at about 960 chunks"*).

**The problem.** The rule is stated over the **cold build**: *"a cold build costing more than 60 seconds moves out of the agent's path"*, because what the 60 s bounds is the MCP tool call, and the tool call pays all three phases. The crossover printed beside it is the refresh phase's alone: 60 / 0.06251 = 959.8 → 960. The same section measures the two fixed phases at a median 192.5 ms model load and 875.8 ms store open, and the extrapolated total it prints (94.8 s = 93.8 + 1.07) includes them — so the chunk count at which the *cold build* crosses 60 s is (60 − 1.07) / 0.06251 ≈ **943**, not 960.

Seventeen chunks does not move the conclusion — the rule trips either way, and the section says so — but the number is load-bearing twice over: `docs/development.md`'s item 17 says a real-catalog figure *"under 60 s at a real catalog's chunk count **cancels this item**"*, and it is the crossover a reader compares their own chunk count against to decide whether the in-line build is inside budget for them. As written, a catalog between about 943 and 960 chunks reads as inside the budget and is over it.

**The fix.** One number, in three places, stated over the quantity the rule governs. In each of the three sites, replace *"crossing 60 s at about 960 chunks"* with *"crossing 60 s in total at about 940 chunks"*, keeping the `93.8 s of refresh` and `94.8 s in total` figures as they are.

- [ ] `docs/retrieval-eval-results.md` → `## Cold build and index size`, opening paragraph.
- [ ] `docs/retrieval.md` → **Why `setup-worktree.sh` does not warm the index.**, the standing-rule paragraph.
- [ ] `docs/development.md` → item 17's row.

The arithmetic belongs in the results file and nowhere else, so add the derivation there alone, in one clause: *"(60 s less the 1.07 s the two fixed phases cost, divided by 62.51 ms per chunk)"*. The other two sites cite that section already and gain no number of their own.
