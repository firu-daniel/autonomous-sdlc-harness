### Task 1 — Write `harness-control.yml`'s job `if:` as a folded block scalar

**Goal:** Make the shipped `cli/templates/github/workflows/harness-control.yml` valid YAML. Its `control` job's `if:` is a plain scalar today. #64 extended it with `contains(join(github.event.issue.labels.*.name, ','), 'sdlc-harness: ')`, and the `: ` inside that plain scalar is read as a mapping indicator. As a result:
- the file does not parse;
- GitHub lists the workflow by its path;
- every comment, review, close and deletion is ignored.

Gate 12 round 7 (2026-10-05, CLI 0.6.1) observed all of this, then hand-patched the `if:` to a folded block scalar. The patched file linted clean with `actionlint` 1.7.7, and GitHub then listed it as `harness-control`.

**Where this task stops.**
- **It fixes the template's syntax and states why, in the template's own header and in its text-level test.** That is all it does.
- **It does not touch `# WHO WRITES IT.`** That paragraph states the upgrade route, which Task 2 changes, so Task 2 owns it.
- **It adds no YAML parser.** Parsing the rendered workflows with a real parser is Task 7's gate, at the repository root. This task's test stays a text-level reading, as the rest of `cli/test/workflow-templates.test.mjs` is.

### Targets

- `cli/templates/github/workflows/harness-control.yml`: the `control` job's `if:`, and two header paragraphs, `# THE PREFILTER.` and `# TWO RULES EVERY EDIT KEEPS.`
- `cli/test/workflow-templates.test.mjs`: the control `if:` case, and a new scalar-form case.

**Work:**

- [ ] **`harness-control.yml`, the job's `if:`.** Replace the one-line `    if: (github.event_name == 'issue_comment' && …` with `    if: >-`. Put the **unchanged** expression on one continuation line beneath it, indented six spaces: the same five `||`-joined arms, byte for byte. This is exactly the shape round 7 verified on GitHub. Do not split the expression over several lines, and do not reword any arm.
- [ ] **`harness-control.yml`, `# THE PREFILTER.`** Add a sentence saying the `if:` is a folded block scalar (`>-`) because its expression carries `: ` (the state-label prefix `'sdlc-harness: '`), which a plain scalar reads as a mapping indicator. Say that 0.6.1 shipped it plain, so GitHub could not parse the file and ran it for no event (docs/development.md, Gate 12, Round 7, finding 1). Cite the heading in prose, as this header's other citations do, never by line number.
- [ ] **`harness-control.yml`, `# TWO RULES EVERY EDIT KEEPS.`** Add a third rule: a value carrying `: ` or ` #` is never a plain scalar. Write it as a block scalar (`>-`) or quote it. Then update the heading to `THREE RULES EVERY EDIT KEEPS.` (or whatever count the paragraph then holds), so that the heading and its bullets agree.
- [ ] **Audit the other three templates for the same hazard.** Run `git grep -nE ": [^'\"|>].*(: | #)" -- cli/templates/github/workflows`, then read each hit. A line inside a `run: |` block body is shell, not a YAML scalar, and does not count. A plain-scalar mapping value that carries `: ` or ` #` does. At plan time `js-yaml` parsed `harness-run.yml`, `harness-resume.yml` and `harness-trigger.yml` without error. But a ` #` inside a plain scalar parses silently as a comment and truncates the value, so a parse alone does not clear that half. Rewrite any real hit as a block or quoted scalar, and name every hit you judged in your return.
- [ ] **`workflow-templates.test.mjs`.**
  - Rewrite the case `control: the job's if: prefilters on the handle, the marker and the review state, and skips a fork's review`. It still finds exactly one job-level `if:`. It now asserts that the line is exactly `if: >-`, and reads the condition off the continuation line beneath it. Every existing `includes` assertion then holds against that line unchanged.
  - Add a case over all four templates. Outside a `|` / `>` block body, no mapping value that opens as a plain scalar carries `: ` or ` #`. Track block bodies by indentation.
  - Amend the suite's header to state both rules in its contract paragraph for `harness-control.yml`.

**Verification:**

- From `cli/`, run `npm test -- test/workflow-templates.test.mjs`, the one test file this task edits. It passes, including the new scalar-form case.
- From the repository root, this check exits 0, where at plan time the same call threw `incomplete explicit mapping pair; a key node is missed … at line 174`. It uses the `js-yaml` already installed in the workspace, through `ajv-cli`:

  ```
  node -e "require('js-yaml').safeLoad(require('fs').readFileSync('cli/templates/github/workflows/harness-control.yml', 'utf8'))"
  ```
- `git diff` of the template shows the five arms of the `if:` byte-identical to the line they replace, apart from the move to the continuation line. Only the scalar form changed.
