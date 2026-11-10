### 5. `prompt-injection-screen.sh` header does not declare the plugin readers of its park wire strings

**Severity:** Should Fix

**Site:** `cli/templates/scripts/prompt-injection-screen.sh`, in the header comment's `# PARK —` block. This is the block that describes the screen park and the re-ask: *"then a section headed `## Prompt-injection screen: the answer to `question_<k>.md` was discarded` with the findings"*. The `Raised by:` literal it writes is the constant `PIS_RAISED`. The self-adopted copy `scripts/prompt-injection-screen.sh` must stay byte-identical, so it takes the same edit.

**Problem.** The script produces three strings that `plugin/` assets match byte for byte:

- `Raised by: prompt-injection-reviewer (prompt-injection screen)`, which `plugin/instructions/task_plan_writing_instructions_autonomous.md` (Override 2(a) and **Consume-then-archive**), `plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md` (Override 2(a)) and `plugin/instructions/clarification_digest_instructions.md` (`## The entry format`) key on;
- the re-ask heading `## Prompt-injection screen: the answer to `question_<n>.md` was discarded`, which `plugin/instructions/clarification_digest_instructions.md` → `## The entry format` keys on;
- the `Screened file:` / `sha256:` pair, which the script's own `plan` reads back.

The two halves are coupled by contract, with `cli/` writing and `plugin/` reading (`.claude/context/conventions.md` → `## The layers`). `.claude/context/plugin.md` → `## The placeholder vocabulary` makes a run-artifact shape *"a wire"*: *"Changing a shape is a change to every reader of it, inside this tree and outside it."*

The script header declares one mirror of this kind, the ledger's `screened:` record (*"Two records, each a mirror of a shape another file owns"*). The shared library it sources declares its plugin-side mirrors the same way (`cli/templates/scripts/lib/harness-run-lib.sh` → `# MIRROR OF plugin/instructions/autonomous_pause_and_ledger.md …`). The park strings carry no such declaration, so someone editing the script's wording cannot tell from this file which plugin readers a rename would strand.

No conventions document requires this declaration of a standalone template script, so this is graded Should Fix. Making the change brings the script in line with the practice its own header and its library follow.

**Fix.** In `cli/templates/scripts/prompt-injection-screen.sh`, add one comment paragraph at the end of the `# PARK —` header block:

```
#   READERS OF THESE STRINGS — a rename here is an edit there, byte for byte:
#   the `Raised by:` line (PIS_RAISED) is keyed on by
#   plugin/instructions/task_plan_writing_instructions_autonomous.md (Override 2(a),
#   Consume-then-archive), plugin/instructions/user_review_fix_plan_writing_instructions_autonomous.md
#   (Override 2(a)) and plugin/instructions/clarification_digest_instructions.md
#   (`## The entry format`); the re-ask heading by the last of those. The file
#   format itself is plugin/instructions/task_plan_writing_instructions_autonomous.md
#   → `## Clarification channel — file format (canonical, single source of truth)`.
```

Then copy the file byte for byte to `scripts/prompt-injection-screen.sh`. Change no code.

- **Deviations from plan:**
  - The paragraph also names `plugin/instructions/prompt_injection_screen.md`, which writes the same `Raised by: prompt-injection-reviewer (prompt-injection screen)` line by hand on a halt (its step-6 route, quoted from the line carrying `It opens `Raised by: …``): a rename of `PIS_RAISED` strands that writer too, so the declaration the finding asks for would be incomplete without it. The re-ask-heading clause names `clarification_digest_instructions.md` by file name instead of "the last of those", since the list no longer ends on it.
  - `scripts/prompt-injection-screen.sh` was **not** copied: it lies outside this dispatch's `cli` path scope (it is the `general` layer's self-adopted copy, last brought to the template bytes by `eca1f541`, "Task 16 — Bring self-adopted copies to the template bytes"). The two copies now differ by this header comment only; a catch-all-layer dispatch copies `cli/templates/scripts/prompt-injection-screen.sh` over it byte for byte.
