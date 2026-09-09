### Test 5 — Pin, unpin, archive and restore do not stamp an edit

**Goal:** Only an edit of a note's own content counts as an edit. Pinning, unpinning, archiving and restoring leave an edited note's instant exactly where it was, and leave a never-edited note never-edited — including in storage, where a stamp leaking into the shared `update` helper would show even if the row happened to re-render correctly.

**Preconditions:**

- The application is already running at `base_url`; never start or stop it. One surface, no router.
- No authentication: no sign-in exists, `harness.config.json` configures no `qa.authProvider`, and no QA account is needed.
- No seed data required — this test creates **two** notes of its own, under titles no other test uses: one it edits once (`QA-updatedat-T5-edited`) and one it never edits (`QA-updatedat-T5-never`). Both states have to be checked, because a leaked stamp shows differently in each.
- Step 5 waits a full second before the first non-edit action, so that any stamp written by one of these four actions lands on a **different** millisecond and is therefore visible. Do not shorten it.
- The list starts on the **Active** filter. Archiving a note removes it from that filter's list (`listNotes('active')` excludes archived notes), so steps that assert on an archived row switch to `[data-qa-id="filter-all"]` first and switch back afterwards. Pinning reorders the list (pinned notes list first), so re-locate a row by its title after every action rather than by position.

**Capability / MCP:** Playwright (interaction + network + console)

**Steps:**

1. Navigate to `base_url`.
2. Add the first note: `QA-updatedat-T5-edited` / `Body A.` through `[data-qa-id="note-title-input"]`, `[data-qa-id="note-body-input"]`, `[data-qa-id="note-submit"]`. Locate its row by `[data-qa-id="note-title"]` `data-qa-value="QA-updatedat-T5-edited"` and record its own `data-qa-value` as `editedId`.
3. Add the second note the same way: `QA-updatedat-T5-never` / `Body B.`. Record its row's `data-qa-value` as `neverId`.
4. Edit the first note once so it has a real instant: click its `[data-qa-id="note-edit"]`, wait for `[data-qa-id="note-row"][data-qa-value="<editedId>"]` to read `data-qa-status="editing"`, clear `[data-qa-id="note-edit-body"]`, type `Body A edited.`, click `[data-qa-id="note-edit-save"]`. When the row reads `viewing` again, read its `[data-qa-id="note-edited"]`'s `data-qa-value` and keep it as `v1`.
5. Wait **at least 1 second** (`browser_wait_for`, 1-second time).
6. **Pin the edited note:** click its `[data-qa-id="note-pin"]` (label `Pin`). Re-locate the row by title and check the assertions marked *(after each action)* below.
7. **Unpin it:** click its `[data-qa-id="note-pin"]` again (label now `Unpin`). Re-locate and check *(after each action)*.
8. **Pin and unpin the never-edited note:** click `[data-qa-id="note-pin"]` on the `QA-updatedat-T5-never` row, check, then click it again and check.
9. **Archive the edited note:** click its `[data-qa-id="note-archive"]` (label `Archive`). The row leaves the Active list; click `[data-qa-id="filter-all"]`, wait for it to read `data-qa-status="selected"`, re-locate the row by title, and check *(after each action)*.
10. **Restore it:** click its `[data-qa-id="note-archive"]` (label now `Restore`), then click `[data-qa-id="filter-active"]`, wait for `data-qa-status="selected"`, re-locate and check.
11. **Archive and restore the never-edited note** the same way, switching to `filter-all` to reach it while archived and back to `filter-active` afterwards, checking after each of the two clicks.
12. With `browser_evaluate`, read both stored records a final time: `JSON.parse(localStorage.getItem('notes-app.notes'))`, finding `editedId` and `neverId`.
13. Read the console and the network log.

**Expected:**

*(after each action, for the edited note)*

- Its `[data-qa-id="note-edited"]` still reads `data-qa-status="edited"`, and its `data-qa-value` is **exactly `v1`** — unchanged by pin, unpin, archive or restore. Any different number is the stamp leaking out of `editNote` into the shared `update` helper the other three actions route through.
- Its text still begins with `Edited ` and its computed `display` is not `none`.

*(after each action, for the never-edited note)*

- Its `[data-qa-id="note-edited"]` still reads `data-qa-status="never-edited"`, still has **no `data-qa-value` attribute** (`hasAttribute('data-qa-value') === false`), still has empty `textContent`, and its computed `display` is still `none`. Pinning or archiving a note is not editing it, so it must not acquire an instant.

*(state each action is supposed to change — these must still work)*

- After step 6 the edited row's `[data-qa-id="note-pin"]` reads `data-qa-status="pinned"` and the row lists before the unpinned one; after step 7 it reads `unpinned` again.
- After step 9 the edited row's `[data-qa-id="note-archive"]` reads `data-qa-status="archived"` and the row is absent from the Active list and present under All; after step 10 it reads `active` and is back in the Active list.
- The rows stay in `data-qa-status="viewing"` throughout — none of these actions opens edit mode.

*(final storage check, step 12)*

- The record for `editedId` has `updatedAt === Number(v1)` — the number never moved in storage either.
- The record for `neverId` has **no** `updatedAt` key at all: `('updatedAt' in record) === false`. A record that gained the key through a pin or an archive is a failure even if it reads as `null` or `undefined`.
- Both records' `createdAt` values are unchanged, and both notes are still present — nothing was dropped by the round trip.

*(the rest)*

- **Network:** no XHR and no `fetch` at any step; only the initial document, `styles.css` and the `dist/*.js` module graph appear in the log. **Stored state:** every write went through `writeAll` into `localStorage['notes-app.notes']`, which is the whole of this project's persistence.
- **Console:** no `error`-level messages — `src/` holds no logger and no `console` call, so any error is an uncaught exception or a failed load.

**On failure → fix target:** `domain` — `setArchived`, `setPinned` and `deleteNote` reach storage through the same `update` helper as `editNote` in `src/domain/notesService.ts`; a moved instant means the stamp was written in `update` (or in one of those three) rather than inside `editNote`'s own `change` callback.
