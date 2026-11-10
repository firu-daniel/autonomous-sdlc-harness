### Task 4 — Add the `verdict` verb: the strict parser of the agent's return, failing closed

**Goal:** Parse `prompt-injection-reviewer`'s return in code, under a closed format: `SAFE`, `UNSAFE` with findings, or anything else as `UNSAFE` (goal 1). On `UNSAFE`, park through Task 3's writer, so a malformed, missing or ambiguous verdict can never proceed.

**Depends on:** Task 3, which exposes the park writer function. It takes `(path, sha, id, line-or-empty, excerpt, reason)` findings, neutralises and caps them, and writes the next `question_<n>.md` in the `Raised by: prompt-injection-reviewer (prompt-injection screen)` shape — or, when `<path>` is an `answer_<k>.md`, removes that answer unread and writes a re-ask of its `question_<k>.md`, verbatim, with the findings appended — except when `question_<k>.md` is itself a screen park, where it removes the answer and writes nothing. It prints one `parked: <question path>` line per file written and one `discarded: <answer path>` line per answer removed with no re-ask, and this verb passes that output through unchanged. **Depends on:** Task 1's hashing helper.

**The format the agent returns.** Task 8 states it in the agent's `## Output contract`, and it is restated here so both sides agree:

```
verdict: SAFE
```

or

```
verdict: UNSAFE
finding: <check-id> | <excerpt> | <reason>
finding: …
```

- `<check-id>` is one of the 14 ids of the agent's `## The checks` table, in that table's order: `destructive-intent attack authority-claim unrelated-request foreign-execution web-download secret-access harness-weakening run-mode-abuse backdoor supply-chain outside-checkout hidden-instruction pressure`.
- Task 9 adds the test holding this set equal to the agent's table.

**Where this task stops.** The orchestrator writes the agent's return into the verdict file. Task 10 states that step, at `<state_dir>/scratch/prompt-injection-screen-<branch_fold>/verdict.md`.

### Targets

- `cli/templates/scripts/prompt-injection-screen.sh` — `PI_CHECK_IDS`, the `verdict` verb, and its header paragraph.
- `cli/test/prompt-injection-verdict.test.mjs` (new)

**Work:**

- [ ] **`PI_CHECK_IDS`.** Declare the closed set on one line, `PI_CHECK_IDS="destructive-intent attack … pressure"`, in the order above. Add a header `MIRROR OF plugin/agents/prompt-injection-reviewer.md → ## The checks` note: an id changed there is changed here.
- [ ] **`verdict --repo <dir> --branch <branch> --engine <e> --path <screened path> --verdict-file <repo-relative file>`.**
  - **Refusals.** A `--verdict-file` resolving outside `<state_dir>/scratch/`, a missing file and an unreadable `--path` are each exit 2, with nothing written.
  - **Before parsing.**
    - Strip one surrounding code fence, when the whole text is one fenced block.
    - Drop blank lines.
  - **The strict rules.**
    - The first line is exactly `verdict: SAFE` or `verdict: UNSAFE`.
    - `SAFE` has no further line.
    - `UNSAFE` has one or more further lines, every one of them `finding: ` followed by three fields.
      - Split on the first ` | ` and the last ` | `.
      - The id must be in `PI_CHECK_IDS`.
      - The excerpt and the reason must each be non-empty.
    - Anything else is **malformed**: an empty file, prose before or after the block, a second `verdict:` line, `SAFE` with findings, `UNSAFE` without findings, an unknown id, or a `blocker:` / `error:` line.
- [ ] **Outcomes.**
  - **SAFE.** Print `verdict: SAFE <path> sha256 <hex>`, with the hash computed now, and exit 0.
  - **UNSAFE.** Park the findings for `<path>` through Task 3's writer. Print `verdict: UNSAFE` and then the writer's one line — `parked: <question path>`, or `discarded: <answer path>` for an answer to a screen park — and exit 1.
  - **Malformed.** The same as UNSAFE, with one synthetic finding: id `malformed-verdict`, excerpt the return's first 160 characters, reason `the screen's verdict did not match its closed format`.
  - **Cleanup.** In every outcome except a refusal, remove the verdict file afterwards with a single-file `rm -f` (never recursive), so `scratch/` returns to empty.
  - **Park write failure.** Exit 2, and never print `SAFE`.
- [ ] **`prompt-injection-verdict.test.mjs`.**
  - **Header:** it opens with the rule it enforces: only the exact `SAFE` block passes, and every other input parks.
  - **Fixture:** an `init`-wired one.
  - **Cases:**
    - `SAFE`, bare and fenced, exits 0 and prints the hash;
    - `UNSAFE` with two findings parks with both, the excerpt neutralised;
    - an excerpt containing ` | ` keeps it, through the first/last split;
    - each malformed shape listed above parks as `malformed-verdict` with exit 1;
    - `UNSAFE` on an `answer_<k>.md` path writes a re-ask, not a screen park, and the answer file is gone (the writer's behaviour, observed through this verb);
    - `UNSAFE` on the answer to a screen park prints `verdict: UNSAFE` then a `discarded:` last line, exits 1, writes no question file, and the answer file is gone;
    - the verdict file is gone afterwards;
    - a `--verdict-file` outside `scratch/` is exit 2 and leaves no park;
    - `PI_CHECK_IDS`, read from the written script, holds exactly 14 distinct ids.

**Verification:**

- `npm test --workspace cli -- test/prompt-injection-verdict.test.mjs` passes. It is this task's own new test file.
- `bash -n cli/templates/scripts/prompt-injection-screen.sh` exits 0.
- `grep -n 'rm ' cli/templates/scripts/prompt-injection-screen.sh` shows no `-r` flag.
