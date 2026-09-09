### Task 6 — Style `.note__edited` and hide the never-edited state through its status attribute selector

**Goal:** Give the row's edited line its rule in the project's only stylesheet, and make a note that
has never been edited show nothing at all — through the element's own `data-qa-status` token, so the
state is expressed once and the element stays in the DOM for a test to read.

**Depends on:** Task 3, which renders, inside `renderViewing` in
`src/presentation/noteListView.ts`, one `<p>` with `className = 'note__edited'` published as
`data-qa-id="note-edited"` and carrying `data-qa-status="edited"` — with the instant as
`data-qa-value` and the text `Edited <locale date>` — or `data-qa-status="never-edited"` with empty
text. This task styles exactly those two states and changes no TypeScript: the view module sets
`className` and nothing else about appearance, and every class it sets has a BEM rule here
(`.claude/context/conventions.md`, `## The `general` layer`).

**Why the catch-all task ships last.** `styles.css` sits at the repository root, outside every
`src/` layer path, and it finishes what the layers below built — so it lands after them by the
project's own ordering rule rather than by a preference of this branch. Between Task 3 landing and
this one, a never-edited row shows an empty paragraph; this task is what makes it show nothing.

### Targets

- `styles.css` — the `.note__edited` rule and its never-edited attribute selector.

**Work:**

- [ ] Add a `.note__edited` rule beside the existing `.note__body` rule, in the same block order the
      row renders in (title, body, edited line, controls): muted, small, and spaced like its
      neighbours — `color: var(--muted); font-size: 0.875rem; margin: 0 0 0.5rem;`. Read the shared
      values back through `var(…)` rather than re-declaring them: `--muted` already exists in
      `:root` and is what `.note--archived` and `.notes__empty` use, and `0.875rem` is the size
      `.composer__error` / `.note__error` already use. Introduce no new `:root` custom property —
      a value used at one site is written as a literal here.
- [ ] Add `.note__edited[data-qa-status='never-edited'] { display: none; }` immediately after it. The
      attribute selector is the required shape, not a stylistic choice: a state that is both visual
      and testable is expressed **once**, as the `data-qa-status` token, and styled through a
      selector on that token rather than by also toggling a modifier class
      (`.claude/context/presentation.md`, `## Copy, styling and structure`). The existing
      `.filters__control[data-qa-status='selected']` rule is the shape to copy. Carry a one-line
      comment saying why the element is hidden rather than omitted: a removed element has no state
      for a test to read, and never-edited is a real state of a note.
- [ ] Change nothing else. No new custom property, no rule for `note--edited` (there is no such
      modifier class), and no edit to any file under `src/` — this task is the stylesheet alone.

**Verification:**

- Exercise the surface end to end from a cold start (`bash scripts/start-dev-server.sh`, then the
  page in a browser): a freshly added note's row shows **no** edited line and nothing shifts or
  gains a blank gap where one would be; edit and save that note and an "Edited …" line appears,
  muted and smaller than the body, in the row between the body and the controls. Reload the page and
  the line is still there with the same instant, since it came out of storage.
- With the element inspected rather than eyeballed: the never-edited row still holds a
  `data-qa-id="note-edited"` element carrying `data-qa-status="never-edited"` — hidden, not removed
  — and the edited row's element carries `data-qa-status="edited"` and a `data-qa-value` of epoch
  milliseconds. That pairing is what this run's interactive QA scenarios read.
- `bash scripts/typecheck.sh` prints `PASS: typecheck` and `bash scripts/test.sh` prints
  `PASS: test` — unchanged by this task, since `styles.css` is neither compiled nor covered by the
  suite, and a green run here is the check that nothing under `src/` was touched by accident.
