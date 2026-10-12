### Task 25 — Document `PERMISSION_MODE` in `docs/watcher.md`, and correct the unlisted-call statements in the remaining docs and evals

**Goal:** Task 15 made `dontAsk` the watcher's `PERMISSION_MODE` default, with `acceptEdits` as an operator override. `docs/watcher.md` §4 owns the `watcher.env` tunables but does not name this one yet, so document it there. It is one of the four owners of the override clause. Then correct the sentences in the remaining developer docs and evals that say an unlisted or `ask`-matched call stalls an unattended run. Under `dontAsk` such a call is **refused at once**. These are scope register rows 85, 86, 88, 89, 92, 94, 151 and 183. Finally, add the two roadmap rows Tasks 6 and 23 cite (row 184).

**Depends on:** Task 15, which changes `cli/templates/scripts/autonomous-watcher.sh`:

```
PERMISSION_MODE="${PERMISSION_MODE:-dontAsk}"
```

Its comment states what `dontAsk` refuses, that the job mode uses the same variable, and that `PERMISSION_MODE=acceptEdits` in `watcher.env` restores prompting, under which those calls stall the run.

**Where this task stops.** `docs/cli.md` is **Task 13's**, and `ARCHITECTURE.md` and `docs/config.md` are **Task 14's**. Dated measurement records and procedures that name `--permission-mode acceptEdits` explicitly stay:

- `docs/development.md` 136 and 690;
- `docs/guard-verification.md` 626, 804, 897 and 984;
- `docs/outer-loop-verification.md`;
- `docs/retrieval.md` 88;
- the `docs/work-report-research/` files;
- `docs/analyze.md`.

### Targets

- `docs/watcher.md` — §4 (`## 4. Pausing, parking and the usage gate`), the tunables paragraphs; 73; 248.
- `docs/remote-execution.md` — 593.
- `docs/development.md` — 2252, and `## 6. The roadmap this tree defers to`, the item table (two new rows, items 20 and 21).
- `docs/guard-verification.md` — 382, 665.
- `docs/retrieval-eval.md` — the heading `### The two execution routes, and the one that stalls` (row 151), 299 with its continuation *"than failing: the run hangs instead of reporting a refusal"* (row 183), and 829.
- `evals/docs-retrieval/arm-a/run-arm-a.sh` — 11 with its continuation *"so an unattended attempt hangs the run instead of"* (row 183); `evals/docs-retrieval/cold-build.mjs` — 26; `evals/docs-retrieval/run.mjs` — 31.

**Work:**

- [ ] `docs/watcher.md` §4: in the paragraph listing the policy knobs by name (*"Its policy knobs, by name: …"*), add `PERMISSION_MODE`. Then add one paragraph:
  - the default is `dontAsk`, under which a call the profile neither allows nor denies, or that hits an `ask` rule, is refused at once, and an unlisted host is refused even where `strictAllowlist` is not honoured;
  - a remote job uses the same default;
  - the override, set in `watcher.env` on the paragraph's own terms, in a fenced block:

    ```
    PERMISSION_MODE=acceptEdits
    ```

    Under it such a call prompts, which an unattended run cannot answer, so it stalls the run;
  - why the default is not a bypass mode: the existing comment's reason.

  Do not change the stall watchdog's paragraphs or its tunables.
- [ ] `docs/watcher.md` 73 *"So a dispatched agent that reaches for one gets a prompt it cannot answer, n…"* → is refused, never permitted. 248 *"What a missing entry costs is a **silent stall** rather than a refusal"* → is a **refusal** at the first helper the run reaches; use the same words Task 22 writes in `plugin/docs/AUTONOMOUS_FLOW.md`. `docs/remote-execution.md` 593 *"typically to stop a stall on a command the generated profile did not allow"* → to stop a refusal of a command ….
- [ ] `docs/development.md` 2252 *"and a missing entry is a silent stall rather than a refusal. It landed."* This is a roadmap record, so make it past tense and scoped: under the permission mode runs then launched with, a missing entry was a silent stall. `docs/guard-verification.md` 382 *"is what keeps an ordinary regex group from stalling a run"* → from being refused in a run. 665 *"a false positive in an allow-only guard is a prompt, which unattended is a stall"* → which unattended is a refusal.
- [ ] `docs/retrieval-eval.md` 299 and 829, and the three eval files: *"an unmatched tool call in print mode **stalls** rather than refusing"* / *"STALLS in print mode rather than prompting — so an unattended attempt hangs the run instead of reporting a refusal"* / *"and stalls an unattended run"* / *"and stalls the run"* → is refused. Where a sentence uses the stall as the reason a step is **hand-run only**, keep the hand-run rule and state the reason that still holds: the profile carries no grant for that subprocess, so an unattended attempt is refused. Each sentence is rewritten whole, its continuation line included (*"the run hangs instead of reporting a refusal"*, *"so an unattended attempt hangs the run instead of …"*). Retitle the heading `### The two execution routes, and the one that stalls` → `### The two execution routes, and the one that is refused`; no file links to its anchor (checked while planning: `git grep -n -i 'one-that-stalls'` printed nothing).
- [ ] `docs/development.md` → `## 6. The roadmap this tree defers to`: add two rows to the item table after item 19, in its two-column form, neither marked **Shipped.** Their text, as table rows:

  ```
  | 20 | The unattended sandbox's prerequisite checks and its launch refusal — a run whose host cannot start the sandbox the generated profile asks for is refused at launch, with a stated reason |
  | 21 | Measuring what the unattended sandbox breaks, and rewriting the containment statements to what it is measured to hold — including whether denying the configuration files every shell or tool invocation reads (`~/.npmrc`, `~/.gitconfig`, `~/.zshenv`) breaks a run |
  ```

  Tasks 6 and 23 cite these numbers as *roadmap item 20* and *roadmap item 21*. The section's closing paragraph listing the shipped items stays as it is: neither new item has shipped.

**Verification:**

- Re-run derivation entry G's two commands with `-n` in place of `-l` and the targets as the pathspec. Every remaining hit must be one a `no-change` row keeps for that file: watcher.md 122 and row 154, remote-execution.md 124 and row 150, development.md 136 and 690 and row 146, guard-verification.md 626, 804, 897 and 984 and row 148, and retrieval-eval.md's two procedure lines (row 152). The one permitted new hit is the §4 override sentence.
- Run the section's own reproducibility command from the tree root, and confirm every number it reports other than 1 and 2 has a row in the table, 20 and 21 included:

  ```
  grep -rn -E "items? [0-9]+" . --exclude-dir=node_modules --exclude-dir=dist
  ```

- `grep -n 'PERMISSION_MODE' docs/watcher.md` hits §4, and its stated default equals the watcher's:

  ```
  grep -n 'PERMISSION_MODE=' cli/templates/scripts/autonomous-watcher.sh
  ```

- Every command an adopter runs sits in a fenced block, one per line (`harness-runs/lessons.md` → `## Adopter-facing documentation`). `bash -n evals/docs-retrieval/arm-a/run-arm-a.sh` exits 0.
