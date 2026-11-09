### 4. `docs/cli.md` §7 still lists `remote-github` as the only check whose `gh` queries `--check-github` turns on

**File:** `docs/cli.md` → `## 7.`, the paragraph beginning `Nothing is repaired and nothing is written` — "the read-only `gh` queries `remote-github` puts."

This paragraph lists everything a `doctor` run reaches outside the repository. Its last clause names one network reader under `--check-github`: "and — under `--check-github` — the read-only `gh` queries `remote-github` puts." This branch adds a second, `branch-protection`, which runs `gh auth status` and up to two `gh api` GETs per protected branch under the same flag. The branch updated the other two sentences in this section that made the same claim — the section's opening paragraph and the `**\`--check-github\`**` paragraph, rows 3 and 4 of the story plan's scope register. This third sentence is not in the register, so it was left stating the old single-check scope.

Who gets this wrong: an operator who reads this paragraph to learn what `doctor --check-github` sends to GitHub, for example before allowing it on a restricted network, counts only `remote-github`'s queries and misses the per-branch rules and protection reads.

**Fix:** replace

> and — under `--check-github` — the read-only `gh` queries `remote-github` puts.

with

> and — under `--check-github` — the read-only `gh` queries `remote-github` and `branch-protection` put.

Change nothing else in the paragraph. This edit touches no test.
