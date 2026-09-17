### Task 6 — Compact `README.md`'s `## How it is measured`, `## Two ledgers` and `## Scope and limits`

**Goal:** Cut the bottom half of `README.md` to what a new reader needs: short sentences and one idea per paragraph. Each of the five long measured caveats becomes one or two plain sentences plus a link to the section that now holds its full text. No fact is lost: every claim the `dev` README makes in this region is either still in the README or present at the linked destination.

**Depends on:** Task 5, which rewrote the file above `## How it is measured` and left this region byte-identical. Also Tasks 2, 3 and 4, which placed the full caveat text at these destinations (the link targets this task writes):

| README bullet (on `dev`) | Its full text now lives in | Placed by |
|---|---|---|
| `### The shape of the system` → *git only* (hard gate) | `docs/cli.md` → `## 2. \`init\``, bullet **"Not inside a git repository, and the run was not told to create one."** | Task 2 |
| *git only* (the jj half) and `### Measured…` → *Both `jj` shapes adopt* | `docs/cli.md` → `## 7. \`doctor\``, bullet **"`jj-repository` is a warning in every state it can report"** | Task 2 |
| `### Measured…` → *A remote is a precondition for a run to start* | `docs/cli.md` → `## 7. \`doctor\``, bullet **"`remote` is a failure…"** | Task 2 |
| `### Measured…` → *Every documented slash spelling is interactive-only* | `docs/development.md` → `## 6. The roadmap this tree defers to`, paragraph **"A third debt belongs to no row at all"** | Task 3 |
| `### Measured…` → *Any write under a repository's own `.claude/` tree is a supervised action* | `docs/analyze.md` → `## 3. What it may write` | Task 4 |

Link each as a repo-relative Markdown link to the file, with the section named in text (`[`docs/cli.md`](docs/cli.md) §7, the `remote` check`). Do not use a `#fragment`, because GitHub's generated anchors for these numbered, code-spanned headings are fragile.

**Where this task stops.** This task owns the file from `## How it is measured` to the end. Everything above it is Task 5's and stays byte-identical. `ARCHITECTURE.md`'s and `docs/development.md`'s citations of this region are Task 7's to re-point, and this task edits no other file.

**Invariants this task must keep** (the story index's `## Context` names who cites each):

- Headings keep their exact text: `## How it is measured`, `## Two ledgers`, `## Scope and limits`, `### The shape of the system`, `### What the shipped evidence covers, and what it does not`, `### Measured while building that evidence, and not fixed here`, `## Where to read more`.
- Bullets keep their bold lead words: **Claude-bound today** (still one paragraph), **Single-machine** (still carrying the burn-rate statement that cap, model and effort multiply and nothing bounds burn rate), **git only**, **Forge-agnostic, which means the last step is yours**, **Design→code generation is out of scope**.
- `## Two ledgers` keeps a **Why both** statement of what each ledger closes the loop on (the work product versus the process).
- No new `item <N>` phrase.

### Targets

- `README.md` — from `## How it is measured` to the end.

**Work:**

- [ ] **`## How it is measured`.** Four paragraphs become short ones, one idea each: every branch is scored against its own plan's story points; the headline `100%` means not reviewed yet (`pre-user-review` versus `post-user-review`); "eval" names two things, the offline `evals/` corpus and the online per-branch rate; and it is neither a scoreboard nor precise. Keep every link. Drop a detail only when the linked file states it (`plugin/samples/sample_statistics.md`, `cli/templates/state-dir/branch_statistics/README.md`, `plugin/docs/AUTONOMOUS_FLOW.md` → `## Statistics`).
- [ ] **`## Two ledgers`.** Four paragraphs become short ones: the lessons ledger (a review escape becomes a one-line rule; the fix-plan writer is its only writer; planners and graders read it first); the improvement ledger (one intake per branch; a human folds them in; no agent reads it); **Why both**; and neither ledger being a live file in this repository. The append rules, the category vocabulary and the one-intake-per-branch rationale stay only as links to `cli/templates/state-dir/lessons.md`, `plugin/instructions/improvement_observations_instructions.md` and `cli/templates/state-dir/improvement_observations/README.md`, which state them. Keep the captured intake link.
- [ ] **`### The shape of the system`.** The intro paragraph of `## Scope and limits` becomes one or two sentences naming the three groups. Each shape bullet becomes two to four short sentences under its kept lead words, with its links kept. *Git only* keeps "No SVN, no Mercurial; `init` refuses outside a repository; a `jj` repository adopts in both shapes" and links `docs/cli.md` §2 and §7. The rest of its jj text is at those destinations.
- [ ] **`### What the shipped evidence covers, and what it does not`.** The three bullets become short: the captured run has `phases.parity` and `phases.docs` off, so it exercises neither phase; `evals/` has one provisional case and no published result; and the outer-loop and guard verification documents name which paths ship undriven. Keep all links.
- [ ] **`### Measured while building that evidence, and not fixed here`.** Each of the four bullets becomes one or two plain sentences plus its destination link from the table above. Slash spellings: *the documented `/…harness-analyze` spellings work only in an interactive session; headless, both answer `Unknown command`.* The write wall: *any write under `.claude/` is supervised-only and no permission entry opens it; an unattended run exits 0 having written nothing.* Remote: *with no remote, a dropped prompt never starts, and a run started in place reports success while nothing is pushed; `doctor`'s `remote` check fails first.* jj: *both `jj` shapes adopt, and a `jj git push` is not seen by the git pre-push hook.* Leave `## Where to read more` as a one-line-per-link list. Shorten a description where it runs past one sentence, and keep every link and its order.

**Verification:**

- **Moved-paragraph table (the plan's record of where each paragraph ended up).** In the final report, fill one row per paragraph or bullet of this region on `dev`: its lead words, then either *kept (shortened)* or the destination file and section. A sentence whose fact has no home in either column fails the task. The rows must include at least the five caveats in the table above, plus *How it is measured* ¶1–4, *Two ledgers* ¶1–4, the five shape bullets and the three evidence bullets.
- `grep -n "^## \|^### " README.md` lists every heading named under *Invariants* with identical text, and `git grep -n -F "#scope-and-limits" -- README.md` hits still resolve to that heading.
- `grep -n -F -e "Claude-bound today" -e "Single-machine" -e "git only" -e "Forge-agnostic" -e "Design→code" -e "Why both" README.md` hits each kept lead.
- `git diff --numstat dev -- README.md` shows far more deleted lines than added ones, and `git diff --word-diff=porcelain dev -- README.md` confirms the removed text outweighs the added. Report the numstat figures. The invariant is "materially shorter", and no fixed target applies.
- `grep -n -E "items? [0-9]+" README.md` reports nothing the `dev` README did not.
- Every relative link in the file resolves: `git ls-files --error-unmatch <path>` exits 0 for each `](path)` target that is not a directory, and a directory target holds tracked files.
