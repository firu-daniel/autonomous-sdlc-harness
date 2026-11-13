### Test 6 — A rejected edit stamps nothing

**Goal:** An edit the app refuses is not an edit. Saving a blank title leaves the row open with its error showing and the note's last-edited instant exactly as it was — unchanged for a note that had one, and still absent for a note that never did.

**Preconditions:**

- The application is already running at `base_url`; never start or stop it. One surface, no router.
- No authentication: no sign-in exists, `harness.config.json` configures no `qa.authProvider`, and no QA account is needed.
- No seed data required — this test creates **two** notes of its own, under titles no other test uses: `QA-updatedat-T6-edited` (edited once, so it carries an instant) and `QA-updatedat-T6-never` (never successfully edited). The rejection has to leave both states alone.
- The rejection is raised by the app's own validation (`a note needs a title`), so no backend failure has to be forced and nothing has to be mocked — this is the one failure path this project can drive from the interface.
- Step 5 waits a full second before the rejected save, so a stamp written by the rejected attempt would land on a different millisecond and be visible. Do not shorten it.
- Filter stays on **Active** throughout.

**Capability / MCP:** Playwright (interaction + network + console)

**Steps:**

1. Navigate to `base_url`.
2. Add `QA-updatedat-T6-edited` / `Body A.` through the composer; locate its row by `[data-qa-id="note-title"]` `data-qa-value="QA-updatedat-T6-edited"` and record its `data-qa-value` as `editedId`.
3. Add `QA-updatedat-T6-never` / `Body B.`; record its row's `data-qa-value` as `neverId`.
4. Edit the first note once successfully: click its `[data-qa-id="note-edit"]`, wait for `[data-qa-id="note-row"][data-qa-value="<editedId>"]` to read `data-qa-status="editing"`, clear `[data-qa-id="note-edit-body"]`, type `Body A edited.`, click `[data-qa-id="note-edit-save"]`. When the row reads `viewing`, read its `[data-qa-id="note-edited"]`'s `data-qa-value` and keep it as `v1`.
5. Wait **at least 1 second** (`browser_wait_for`, 1-second time).
6. **Reject an edit on the note that has an instant:** click the row's `[data-qa-id="note-edit"]`, wait for `data-qa-status="editing"`, clear `[data-qa-id="note-edit-title"]` so it is empty, and click `[data-qa-id="note-edit-save"]`.
7. Read the row's `[data-qa-id="note-edit-error"]`, then click `[data-qa-id="note-edit-cancel"]` and wait for the row to read `data-qa-status="viewing"`. Read its `note-edited` attributes.
8. **Reject an edit on the never-edited note:** click `[data-qa-id="note-edit"]` on the `QA-updatedat-T6-never` row, wait for `data-qa-status="editing"` on `[data-qa-id="note-row"][data-qa-value="<neverId>"]`, clear `[data-qa-id="note-edit-title"]`, click `[data-qa-id="note-edit-save"]`, read the error, then click `[data-qa-id="note-edit-cancel"]` and read that row's `note-edited` attributes.
9. With `browser_evaluate`, read both stored records: `JSON.parse(localStorage.getItem('notes-app.notes'))`, finding `editedId` and `neverId`.
10. Read the console and the network log.

**Expected:**

*(the rejection itself)*

- After each blank-title save, that row's `[data-qa-id="note-edit-error"]` reads `data-qa-status="invalid"` and its `textContent` is `a note needs a title`.
- The row **stays open** — still `data-qa-status="editing"` — so the title can be fixed; it does not close, and no row is removed from the list.
- The composer's own `[data-qa-id="note-error"]` is untouched, still `data-qa-status="idle"`: the failure belongs to the row being edited, not to the add form.

*(nothing was stamped)*

- After step 7, the `QA-updatedat-T6-edited` row's `[data-qa-id="note-edited"]` reads `data-qa-status="edited"` with `data-qa-value` **exactly `v1`** — the rejected attempt did not move it. Its `[data-qa-id="note-title"]` still reads `data-qa-value="QA-updatedat-T6-edited"` and its `[data-qa-id="note-body"]` still reads `Body A edited.`, so nothing else was written either.
- After step 8, the `QA-updatedat-T6-never` row's `[data-qa-id="note-edited"]` still reads `data-qa-status="never-edited"`, still has **no `data-qa-value` attribute**, still has empty text, and its computed `display` is still `none`. A rejected edit must not push a note out of the never-edited state.
- Step 9: the record for `editedId` has `updatedAt === Number(v1)`, and the record for `neverId` has **no** `updatedAt` key (`('updatedAt' in record) === false`). Validation runs before anything is written, so a rejected input must leave storage untouched — an instant appearing here is the check that failed, whatever the row showed.
- Both records' `createdAt` and `title` are unchanged, and both notes are still listed.

*(the rest)*

- **Network:** no XHR and no `fetch` at any step. **Stored state:** all reads are of `localStorage['notes-app.notes']`; a rejected edit produces no `writeAll` at all.
- **Console:** no `error`-level messages. A `ValidationError` is caught in `src/presentation/app.ts` and shown in the row's error region, not logged and not thrown — an uncaught error in the console here is a defect, and so is any other console error, since `src/` holds no logger and no `console` call.

**On failure → fix target:** `domain` — `editNote` in `src/domain/notesService.ts` validates inside its `change` callback and `update` writes only after that callback returns; an instant that moved on a rejected save means the stamp was taken before validation, or written outside that ordering.
