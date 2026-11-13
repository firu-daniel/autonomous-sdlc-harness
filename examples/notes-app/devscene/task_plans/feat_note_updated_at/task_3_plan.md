### Task 3 — Render the row's "Edited …" line, published as `note-edited` with the instant as its value

**Goal:** Show, on a note's row, when it was last edited — an "Edited …" line published through the
project's own test-attribute helper, carrying the instant as a value a test can read back
deterministically, and showing nothing at all for a note that has never been edited.

**Depends on:** Task 2, which produces `updatedAt: Date | null` on the `Note` entity
(`src/domain/note.ts`) — a **required** property whose `null` member means the note has never been
edited, stamped by `editNote` alone. This task consumes exactly that property under that name and
that type; it renders it and decides nothing else. It calls no business function: a view module is
handed values and callbacks, and `app.ts` stays untouched — `onEditSaved` already ends in
`refresh()`, which re-reads through `listNotes(filter)` and rebuilds every row, so the new line
updates itself on the path that already exists (`.claude/context/presentation.md`, `## State, and
the render pass`).

**Where this task stops.** It renders the element and publishes its state token; the stylesheet rule
that makes the never-edited state show nothing is **Task 6's** (`styles.css` belongs to the catch-all
layer). Between this task landing and that one, a never-edited row will show an empty paragraph —
that is the expected interim, not a defect to work around here with an inline `style` or a second
modifier class.

### Targets

- `src/presentation/noteListView.ts` — the "Edited …" line inside `renderViewing`.

**Work:**

- [ ] In `renderViewing`, build the line as one element wrapped by the helper at its creation
      expression, the way every published element in this layer is built:
      ```ts
      const edited = qa(document.createElement('p'), {
        id: 'note-edited',
        status: note.updatedAt === null ? 'never-edited' : 'edited',
        value: note.updatedAt === null ? undefined : String(note.updatedAt.getTime()),
      });
      edited.className = 'note__edited';
      edited.textContent = note.updatedAt === null ? '' : `Edited ${note.updatedAt.toLocaleString()}`;
      ```
      Three things are load-bearing and none may be traded for a shorter spelling. The **element is
      built in both states**, because a status token is written in every state including the neutral
      one — a test waits on a token and cannot wait on an absence
      (`.claude/context/presentation.md`, `## Two harness contracts`). The **`data-qa-value` is the
      epoch milliseconds**, `String(note.updatedAt.getTime())` — the same number storage holds — 
      because a human-facing date line is not something a test can assert on: `toLocaleString()`
      depends on the machine's locale and zone, and the value must read back deterministically.
      And the id is `note-edited`: kebab-case, carrying the `note-` prefix its surface already uses
      (`note-title`, `note-body`, `note-edit`), and identical on every row — a repeated element keeps
      one id and is told apart by the row's own `data-qa-value`, never by a generated per-instance id.
- [ ] Append it between the body and the controls: `row.append(title, body, edited, controls);`.
      Set `className` and nothing else about appearance — no inline `style`, and no
      `note--edited` modifier class, because a state that is both visual and testable is expressed
      once as its `data-qa-status` token and styled through an attribute selector
      (`.claude/context/presentation.md`, `## Copy, styling and structure`). No `aria-label` and no
      `role`: the line is static text inside a row, not a control and not an alert region.
- [ ] Change `renderEditing` not at all. A row in edit mode shows the two inputs, Save, Cancel and
      the error region; the edited line belongs to the viewing presentation, and adding it to both
      would give a row two elements with the same `data-qa-id` whenever a row is being edited.
- [ ] Leave the module's exported surface as it is: no new export, no new entry on `NoteListView` or
      `NoteListCallbacks`, no second handle. The row gains a rendered field, not a region — this
      module is still one region with one handle and one callbacks interface
      (`.claude/context/presentation.md`, `## Two harness contracts`, module size).

**Verification:**

- `bash scripts/typecheck.sh` prints `PASS: typecheck` and `bash scripts/test.sh` prints
  `PASS: test`. This layer is not covered by the `node:test` suite, so the tests here are the
  existing ones staying green; the row itself is verified in the interactive QA phase.
- Exercise the path end to end in the browser (`bash scripts/start-dev-server.sh`): add a note and
  its row shows no edited line and carries `data-qa-status="never-edited"` on `note-edited`; edit it
  and save, and the same row now carries `data-qa-status="edited"` with a `data-qa-value` equal to
  the epoch milliseconds now stored for that note, without a reload — the `refresh()` path doing the
  work with no change to `app.ts`. Archive, restore, pin and unpin the note and the value does not
  move.
- `grep -n "data-qa-" src/presentation/noteListView.ts` shows every new attribute arriving through
  `qa`/`setQaStatus`/`setQaValue` and no hand-written `setAttribute('data-qa-…')`.
- The value read off `data-qa-value` parses as a finite number and equals the note's stored
  `updatedAt` — the story index's third `Top risks:` entry is a row that renders an unassertable
  date, and this is the check that it does not.
