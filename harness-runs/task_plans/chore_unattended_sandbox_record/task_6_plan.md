### Task 6 — Repoint residual citations in `docs/watcher.md`, `docs/remote-execution.md` and `docs/sandbox-placeholder-upstream-report.md`

**Goal:** Make every citation of a residual in these three documents point at `docs/sandbox-record.md` → `## 6. The residuals` with the same number. That covers the numbered citations, the citations by the old anchor `**Residuals, stated rather than hidden:**`, and the upstream report's unnumbered citations of the Linux interim position.

**Depends on:** Task 5. That task moved `docs/cli.md` §6's residuals 1–13 into `docs/sandbox-record.md` → `## 6. The residuals`, numbers and sub-item numbers unchanged (residual 1's items 1–5). It left `docs/cli.md` §6's `**Residuals, stated rather than hidden:**` as a pointer paragraph. This task consumes that numbering. The citation form, for these files that sit beside the record in `docs/`, is [`sandbox-record.md`](sandbox-record.md) → `## 6. The residuals`, residual N, or the shorter `docs/sandbox-record.md`, residual N where the surrounding sentence already cites by repo path.

### Targets

- `docs/watcher.md`: scope-register rows 30–38.
- `docs/remote-execution.md`: scope-register rows 22–23.
- `docs/sandbox-placeholder-upstream-report.md`: scope-register rows 41–42.

**Work:**

- [ ] **`docs/watcher.md`.** Repoint each of the following to `docs/sandbox-record.md`, keeping its residual number:
  - The `launch-sandboxed-gates.sh` table row's *"residual 13"*.
  - The two old-anchor citations: the paragraph opening *"What this leaves open — the bootstrap'"* and the one opening *"Claude Code silently ignores a `--settin"*. These name the residual by its anchor and opening words. Replace them with the residual's number in the record: residual 1 and residual 11 respectively. Confirm each number against the moved text.
  - The *"residual 12"* and *"residual 2"* citations under `### The per-run profile`.
  - The **On a bubblewrap host (Linux, WSL2),** paragraph.
  - §4's clamp paragraph *"why is `docs/cli.md` §6, residual 12"*.
- [ ] **`docs/watcher.md`, left unchanged.** The two quoted watcher log lines (`bubblewrap host: at most one live run per repository (… docs/cli.md §6)` and `cap: 1 (… docs/cli.md §6)`) are quotes of runtime literals (scope-register rows 39–40).
- [ ] **`docs/remote-execution.md`.** Repoint the **The post-session steps on a job that passed.** bullet: its *"([`cli.md`](cli.md) §6, residual 12)"* and its *"[`cli.md`](cli.md) → `## 6. The failure modes the permission profile encodes` → `**Residuals, stated rather than hidden:**`, residual 1, item 5"*. Repoint the **Residual: `Bootstrap the checkout`'s configured commands…** bullet's anchor plus *"residual 1"* the same way.
- [ ] **`docs/sandbox-placeholder-upstream-report.md`.** Repoint **Who reads this:**'s *"The interim position it would lift is `docs/cli.md` §6"*, and `## The harness's interim position`'s *"`docs/cli.md` §6 states the whole position"*, to `docs/sandbox-record.md` residual 12.

**Verification:**

- `git grep -nIE "[Rr]esiduals? [0-9]" -- docs/watcher.md docs/remote-execution.md docs/sandbox-placeholder-upstream-report.md`: every hit's line names `sandbox-record.md`.
- `git grep -nIF "Residuals, stated rather than hidden" -- docs/watcher.md docs/remote-execution.md` returns nothing.
- `git grep -nIE "cli\.md.{0,5}§ ?6" -- docs/sandbox-placeholder-upstream-report.md` returns nothing.
- In `docs/watcher.md`, the same command's remaining hits are each either content that stays in `docs/cli.md` §6 or scope-register rows 39–40, none of them residual 12's content outside a quote.
- Each repointed number names, in `docs/sandbox-record.md` §6, the residual whose text the sentence describes. Read each one.
