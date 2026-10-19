### Task 13 — Restate the profile template's sentence about which targets the excluded wrappers accept

**Goal:** Keep the unattended profile's own rationale true for every adopter who regenerates it. The template's `_README` says the excluded wrappers *"refuse any target but the main checkout or a worktree it lists"*. After Tasks 1 and 9 they also accept a clone the run registry records at the branch's derived path. Restate that sentence, and say that nothing creates such a clone yet.

**Depends on:** Task 1, whose clone arm of `hr_wrapper_target_check_var` accepts a target only when the run registry records it as a clone (`copy_kind=clone`, `worktree=<target>`) for the branch its `HEAD` names, at `hr_worktree_dir <main> <branch>`, with no `commondir`, `config.worktree` or `objects/info/http-alternates` in its `.git`, alternates naming the main checkout's objects only, and an allow-listed `.git/config`. Also Task 9, whose three wrappers act on such a clone only through the main checkout (sync-in, the unchanged operation, sync-out).

**Where this task stops.** The rendered copy in the worked example is **Task 17's**. The registry's write protection is rendered into a different `_README` line, generated from `protectedPaths` (Task 12), and is not this task's.

### Targets

- `cli/templates/claude/settings.autonomous.json` — the `_README` line beginning `THREE COMMANDS RUN OUTSIDE THE SANDBOX, EACH IN ONE SPELLING`, its last sentence only.

**Work:**

- [ ] **Replace only the last sentence.** `The excluded rule's \`:*\` accepts any argument, so all three wrappers refuse any target but the main checkout or a worktree it lists.` becomes one sentence saying all three wrappers refuse any target but these, and that a clone is reached only through the main checkout, which fetches its branch before acting and sets its ref after:
  - the main checkout;
  - a worktree it lists;
  - a clone the run registry records at that branch's derived working-copy path, whose configuration and alternates the wrappers check, and which nothing creates yet.

  Keep the rest of the line byte-identical, `{{scriptsDirAbs}}` included, and keep the file valid JSON.
- [ ] **Check every test that quotes that line.** Run `grep -rn 'refuse any target\|EACH IN ONE SPELLING' cli/test cli/src` and read each hit. A test asserting the old sentence verbatim is updated in this task to the new sentence. No such test exists when this plan was written; if one appears, it is this task's single permitted test edit, recorded in the deviation notes.

**Verification:**

- `jq -e . cli/templates/claude/settings.autonomous.json > /dev/null` exits 0.
- `git diff cli/templates/claude/settings.autonomous.json` changes exactly one line, and within it only the final sentence. Read the diff to confirm.
- `bash scripts/typecheck.sh` (`commands.typecheck`) exits 0.
