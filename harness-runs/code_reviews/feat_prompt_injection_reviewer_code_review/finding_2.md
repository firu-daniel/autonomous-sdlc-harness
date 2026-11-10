### 2. A `SAFE` answer is screened a second time once the watcher archives it, and that second verdict can re-ask an answer the run has already used

**File:** `cli/templates/scripts/prompt-injection-screen.sh` (`pis_plan`) — "grep -F -x -q -e \"  - screened: $rel sha256=$hash\""

**Also touched:** `cli/test/prompt-injection-plan.test.mjs`; `scripts/prompt-injection-screen.sh` (the self-adopted copy).

**The problem.** The `SAFE` record matches on **path and hash together**. An answer is screened while it sits at the top level, as `<state_dir>/clarifications/<branch>/answer_<n>.md`, because the resumed launch screens it before anything reads it. The forks then record it as `  - screened: <state_dir>/clarifications/<branch>/answer_<n>.md sha256=<hex>`.

Once that session exits, the watcher archives the pair to `answered/answer_<n>.md` (`plugin/instructions/task_plan_writing_instructions_autonomous.md` → `## Clarification channel — file format (canonical, single source of truth)`, **Consume-then-archive**). On the next launch, `plan` lists `answered/answer_<n>.md` with the same hash. Its `grep -F -x` looks for the `answered/` spelling, finds no line, and classifies the file `screen`. So the agent is dispatched again for every answer the run has ever accepted.

This breaks two things:

- **It breaks the screened-once contract.** The task prompt's goal 2 says "Each file is screened when it first arrives and recorded by SHA-256, so the cost grows with the number of files a person writes", and `prompt_injection_screen.md` → `## No override` says the dispatch cost is bounded by "the number of new or changed files". Every archived answer costs one more dispatch.
- **It can re-park a run on an answer it has already acted on.** The second screen is a fresh LLM verdict. If it comes back `UNSAFE`, or the return is malformed, `pis_park_write` removes `answered/answer_<n>.md` and writes a re-ask of `question_<n>.md` at the next index. The run then parks again and asks the person a question whose original answer has already shaped the plan.

The suite missed this because `cli/test/prompt-injection-plan.test.mjs` → *"a new answer on resume is screened, and a recorded answered/ one stays safe"* writes the record with the `answered/` path. The real flow never writes that path, because the screen runs before the watcher archives.

**Fix.** An answer has one identity whether it sits at the top level or under `answered/`, so the `SAFE` lookup should accept either spelling.

1. In `pis_plan`, add `alt` to the function's `local` list and replace the ledger lookup block with:

   ```bash
       if [ -n "$ledger" ]; then
         # The watcher archives an answer after the session that screened it,
         # so its record may name the other spelling of the same file.
         alt=""
         case "$rel" in
           "$clar"/answered/answer_*.md) alt="$clar/${rel#"$clar"/answered/}" ;;
           "$clar"/answer_*.md) alt="$clar/answered/${rel#"$clar"/}" ;;
         esac
         if [ -n "$alt" ]; then
           grep -F -x -q -e "  - screened: $rel sha256=$hash" -e "  - screened: $alt sha256=$hash" -- "$ledger"
         else
           grep -F -x -q -e "  - screened: $rel sha256=$hash" -- "$ledger"
         fi
         case $? in
           0) out="${out}safe $rel $hash$PIS_NL"; continue ;;
           1) ;;
           *) pis_fault "cannot read the ledger $ledger" ;;
         esac
       fi
   ```

   The `safe` line still prints the current path. The forks may then add an `answered/` record line for an answer already recorded at the top level. That costs one ledger line and dispatches nothing.

2. In the header's PLAN → `SAFE` record description, add after "A missing ledger is an empty record.": ``An answer's record matches it at the top level or under `answered/`: the watcher archives the pair after the session that screened it.``

3. In `cli/test/prompt-injection-plan.test.mjs`, add a case where the ledger records the **top-level** `clarifications/<branch>/answer_2.md` path with the answer's hash, but the file exists only at `clarifications/<branch>/answered/answer_2.md` (written through `put`). Assert that `plan` exits 0 with the lines `safe <state_dir>/clarifications/<branch>/answered/answer_2.md <sha>` (after the prompt's own `safe` line) and `plan: clear`. Run that one file (`npm test --workspace cli -- test/prompt-injection-plan.test.mjs`).

4. Copy the edited template over the self-adopted `scripts/prompt-injection-screen.sh` byte for byte.
