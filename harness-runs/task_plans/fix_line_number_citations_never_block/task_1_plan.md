### Task 1 — Reword the parity-review directory README's citation sentence to an anchored source

**Goal:** Make the adopter-facing README for the parity-review directory describe the same citation the plugin's parity reviewers will require after this branch — a `<reference_impl>` source named by an anchor — instead of "a source line", which reads as a request for a line number.

**Where this task stops.** This is the `cli` layer's only edit, and it is to a template an adopter receives, not to the CLI's behaviour. The plugin contracts that grade parity citations (`business-parity-reviewer.md`, `task-plan-reviewer.md`, `task-plan-writer.md`) are Tasks 5 and 6; this file restates their term — **a `<reference_impl>` source anchor: the path plus the symbol, with a quoted substring where the symbol spans more than the behaviour** — and changes nothing else in the README.

### Targets

- `cli/templates/state-dir/business_parity_reviews/README.md` — the closing *"The mistake worth naming …"* paragraph.

**Work:**

- In the sentence *"every constant, call name, wire field and boundary comparison the plan describes has to trace to a source line in the reference implementation"*, replace *"a source line in the reference implementation"* with *"an anchored source in the reference implementation — its path and symbol, never a line number"*. Change no other sentence of the file.

**Verification:**

- Grep the file for `source line` and find no hit; grep it for `anchored source` and find the one sentence above.
- `npm run build` and `npm test` from the repository root both exit zero, run without a pipe (acceptance item 5 — a `cli/` file changed). No test pins this README's text; the run is the gate the acceptance list requires, not a test this edit needs.
- The template is copied, not rendered, so no `{{…}}` token and no generator header is involved; confirm with `git diff --stat` that the only `cli/` path changed is the one target.
