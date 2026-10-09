### Task 12 — Fix the `typos` hits in `cli/src` prose and messages, keeping every matched identifier

**Goal:** In `cli/src`, the only `typos 1.51.1` hits left are the deliberate identifiers the story index lists:
- `UNPARSEABLE_CONTROL_RELEASES` — `cli/test/trigger-workflow-init.test.mjs` imports it, and `scripts/check-rendered-workflows.mjs` cites it;
- `UNPARSEABLE_CONTROL_IF_LINE`;
- `unparseableControlRoute` — imported by `cli/src/doctor/checks.ts` and `cli/src/commands/init.ts`.

Every comment, doc comment and message word the audit flagged is respelled. One block-local binding is renamed.

**Depends on:** Task 1. That task owns `cli/src/commands/init.ts` and adds the `--scripts-dir` flag row, the refusal and the rebuild resolution there. This task edits only prose in that file, after Task 1 has landed.

**Where this task stops.** No behaviour changes, and no exported or imported name changes. The templates are Task 11's, `harness-control.yml` is Task 9's, and the plugin is Task 13's.

### Targets

- `cli/src/generators/githubWorkflows.ts`
- `cli/src/commands/init.ts`
- `cli/src/doctor/checks.ts`
- `cli/src/machine/registry.ts`
- `cli/src/machine/plugins.ts`
- `cli/src/core/writer.ts`
- `cli/src/core/paths.ts`
- `cli/src/detect/signals.ts`
- `cli/src/generators/scripts.ts`

**Work:**

- [ ] **"unparseable" becomes "unparsable" in prose**, never inside an identifier. That covers `githubWorkflows.ts`'s header choice 6, its doc comments on `UNPARSEABLE_CONTROL_IF_LINE`, `unparseableControlRoute` and `controlRepair`, and the "unparseable" comments and messages in `init.ts`, `checks.ts`, `registry.ts`, `plugins.ts` and `writer.ts`.
  - **Before changing a message string**, grep `cli/test` for that exact sentence. The 2026-10-09 grep found only test titles and comments carrying the word: `doctor.test.mjs` → "a registry that is absent, empty or unparseable warns identically and never fails".
  - **Test titles are left alone.** They are test files no task here edits.
- [ ] **The hyphenated `mis-` words become one word:**
  - "mis-scoped" → "misscoped", in `init.ts` (twice), `paths.ts` and `signals.ts`;
  - "mis-read" → "misread", in `scripts.ts`;
  - "mis-spelled" → "misspelled", in `checks.ts`.

  Where the joined word reads badly, rephrase instead — for example "wrongly scoped". Re-run the probe below to confirm the replacement is not itself flagged.
- [ ] **Rename the block-scoped `const unexcepted` to `unlisted`** in `cli/src/doctor/checks.ts`: the array and its uses in the same block, inside the managed-block negation check.
  - **Why the prompt's identifier rule allows it.** It is declared with `const` inside one function block, so nothing outside the block can name it. The story index records this reading.
  - **The grep that proves it.** `git grep -n unexcepted -- cli` must find only that block's lines before the edit, and nothing after.
  - **The message.** Keep the message text it feeds byte-identical apart from respelled words.
- [ ] **Leave the deliberate identifiers unchanged** — `UNPARSEABLE_CONTROL_RELEASES`, `UNPARSEABLE_CONTROL_IF_LINE` and `unparseableControlRoute` — together with every `{@link …}` that names them.

**Verification:**

- Run `commands.typecheck` (`bash scripts/typecheck.sh`), which proves no identifier was broken.
- **The spelling probe.** A probe under `harness-runs/scratch/`, run through `bash scripts/scratch-run.sh <probe>`, runs `uvx --from typos@1.51.1 typos --format brief cli/src`. Every remaining hit is one of the three deliberate identifiers above, in the files that declare or import them.
- **The diff.** `git diff -U0` of the nine files touches only comment lines, string-literal message text and the `unexcepted` binding.
