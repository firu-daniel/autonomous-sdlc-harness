`chore_sandbox_honesty_paragraphs` rewrites every paragraph that describes what the unattended run contains, so each one states what the sandbox now holds and what it still does not, and points at the sandbox's document of record rather than restating it. It then brings the other docs in line with that document.

This is the last of four branches (sandbox3a–3d). It starts from a `dev` that carries `chore_unattended_sandbox_record` (sandbox3c), the document of record, and everything before it. Read that document first: it is the one owner of the model, the results and the residuals.

> ⚠️ **Find every anchor in this prompt by its quoted text or heading, never by line number.** These paragraphs were written at different points in the series. Several still describe the worktree layout, two wrappers, or no sandbox at all.

## The goal

1. **Rewrite the honesty paragraphs.** Each states, in a few lines, what the sandbox now contains and what it still does not, as it applies to that file's reader, and links the document of record for the rest:
   - `scripts/scratch-run.sh` → `# WHAT THIS DOES NOT CONTAIN.`, and its template `cli/templates/scripts/scratch-run.sh`, kept byte-identical;
   - the scratch directory's README;
   - the profile's `_README` (`cli/templates/claude/settings.autonomous.json` and the generator that writes its lines). This is a rendered file: change the template and its tests, and say in the plan which `doctor` check or test pins the text;
   - `plugin/docs/AUTONOMOUS_FLOW_WHITEBOARD.md` → the `**5. The sandbox**` row;
   - `plugin/hooks/README.md`;
   - `README.md` → `## Scope and limits`.
2. **Bring the other docs in line:**
   - `docs/cli.md`, `docs/remote-execution.md` and `docs/watcher.md`: any sentence that describes containment says what the document of record says, or links it;
     - in `docs/cli.md` §6 this includes the three sentences sandbox3c deferred as roadmap items in `docs/development.md` → `## 6. The roadmap this tree defers to`: item 22 (CS2, RG1–RG3 and CS6 still called owed, though each row is **pass**; item 22's other site, the CS2 comment under `WHY THE MAIN CHECKOUT'S COPY RUNS OUTSIDE THE SANDBOX` in `cli/templates/scripts/commit-on-branch.sh`, is in scope too, a comment only, with `scripts/commit-on-branch.sh` kept byte-identical), item 23 (`git-trust-file-guard.sh`'s refusal of the trio called derived from the code, and the control called still to be recorded, though AP9 is **pass** and the control is recorded as session 2, AP7) and item 25 (*"On a bubblewrap host (Linux, WSL2) the gate launcher is the fourth"*, which reads the exclusion as written only there). Fix each, then mark each row **Shipped.** and add it to that section's shipped paragraph, as earlier shipped items are;
   - `docs/outer-loop-verification.md` §3: its measurement stays as recorded, with a following paragraph on what the sandbox changes;
   - `ROADMAP.md` and `llms.txt`.
   - Find the restating sites with a search you record, so the scope can be re-derived. Do not shorten a site that sandbox3c already reduced to a pointer.
3. **Leave the explainer to sandbox10.** `chore_unattended_sandbox_doc` (sandbox10) writes `docs/sandbox.md`, the adopter-facing explainer, and turns the remaining restatements into pointers to it. This branch only makes each honesty paragraph true and points it at the document of record. It does not write the explainer.

## Constraints

- **No behaviour changes.** The guards, the deny floor, the `pre-push` hook, the profile's rules and everything the series added stay as they are. The only rendered output that changes is the `_README` text.
- **No claim stronger than the document of record.** Where it says *not yet measured*, the paragraph says so too.
- The supervised profile and supervised sessions are out of scope.
- `scripts/run-gates.sh` passes.

