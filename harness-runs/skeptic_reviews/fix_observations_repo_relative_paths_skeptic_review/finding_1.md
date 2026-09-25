### 1. A single-segment needle such as `/app` or `/src` also matches inside an ordinary repo-relative path, so a correct entry reads as a hit no rewrite can clear and the intake file is never committed

**File:** `plugin/instructions/improvement_observations_instructions.md` → `## Commit mechanics` → **Machine-path check — before every wrapper call.** — the sentence "Drop a needle that is empty or is `/`."

**The problem.** The check runs `grep -nF`, which is a fixed-string **substring** match. Its needles are the home directory (`jq -nr env.HOME`) and every checkout root (the `worktree ` lines of `git worktree list --porcelain`). The only needles the paragraph drops are an empty one and `/`. A needle made of one path segment is kept. Container and CI layouts often produce exactly that kind of needle: a checkout at `/app`, `/src`, `/code`, `/repo` or `/workspace`, or `HOME=/root`.

Such a needle matches inside correct, repo-relative text that `## The entry format` → **Every path in an entry is repo-relative.** requires the entry to contain:

- needle `/src` matches `cli/src/cli.ts`, or any `src/` path under a subdirectory;
- needle `/app` matches `src/app/page.tsx`, or `plugin/apps/…`;
- needle `/root` matches `…/rootfs/…`.

The line is already repo-relative, so no rewrite by the rule can remove the needle. The paragraph then says "run the wrapper only on status `1`, never on `0`" and "A hit the rewrite cannot clear means **no commit**". In that layout, **any** entry that names a normal path under such a directory blocks the commit: a first write is left untracked, a later write is reverted, and the observations are never committed. There is a worse case. An orchestrator told to "rewrite the offending text" may mangle a correct path to make the hit go away, which corrupts the `evidence:` line that rule 2 (*"Encountered, not imagined."*) says must be falsifiable.

**Why it is reachable.** The task prompt (`## Establish, do not assume` → **What the check matches.**) requires needles that "hold in any adopter" whose "home directory and checkout layout are unknown". This branch introduces the check (Task 3), so the regression is new. Before the branch, the same entries committed. The existing drop rule already shows the class is recognised: `/` is dropped because it matches everything. A one-segment root is the same defect in a milder form.

**Fix.**

- [ ] In `## Commit mechanics` → **Machine-path check — before every wrapper call.**, replace the sentence "Drop a needle that is empty or is `/`." with:

  "Drop a needle that is empty, is `/`, or is a single path segment — a `/` followed by a name with no further `/`, such as `/app` or `/root` — and log which source it came from: as a fixed-string match such a needle also matches inside an ordinary repo-relative path (`/src` inside `cli/src/cli.ts`), so a correct entry would read as a hit no rewrite can clear. With every needle dropped, the check could not run."

- [ ] Change nothing else. The existing "**On `2`, or a needle command that fails**, the check could not run: log it and go on to the wrapper … with some needles resolved, run with those and log which source failed" clause already covers what happens after a drop. Do not change either README copy (`cli/templates/state-dir/improvement_observations/README.md`, `harness-runs/improvement_observations/README.md`), because neither names the needles.
