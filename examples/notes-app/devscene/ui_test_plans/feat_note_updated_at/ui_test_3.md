### Test 3 — The published instant is what storage holds, and it survives a reload

**Goal:** The number the row publishes is the number storage holds — not a render-time value — and it comes back off disk unchanged after a reload, with `createdAt` untouched by the edit.

**Preconditions:**

- The application is already running at `base_url`; never start or stop it. One surface, no router.
- No authentication: no sign-in exists, `harness.config.json` configures no `qa.authProvider`, and no QA account is needed.
- No seed data required — this test creates its own note under a title no other test uses.
- Persistence for this project is the single `localStorage` key `notes-app.notes` (`NOTES_STORAGE_KEY`, `src/data/noteRecord.ts`), read by `readAll` and written by `writeAll`. There is no backend, so a `browser_evaluate` read of that key is this test's stored-state assertion.
- Filter stays on **Active** throughout; the reload in step 8 returns the page to that same default filter.

**Capability / MCP:** Playwright (interaction + network + console)

**Steps:**

1. Navigate to `base_url`.
2. Add the note: type `QA-updatedat-T3` into `[data-qa-id="note-title-input"]`, `Body for the storage check.` into `[data-qa-id="note-body-input"]`, click `[data-qa-id="note-submit"]`.
3. Locate the row — `[data-qa-id="note-row"]` whose `[data-qa-id="note-title"]` carries `data-qa-value="QA-updatedat-T3"` — and record its own `data-qa-value` as `rowId`.
4. With `browser_evaluate`, read the stored record before the edit: `JSON.parse(localStorage.getItem('notes-app.notes')).find((r) => r.id === rowId)`. Keep `createdBefore = record.createdAt`, and confirm `('updatedAt' in record) === false`.
5. Click the row's `[data-qa-id="note-edit"]`, wait for `data-qa-status="editing"` on `[data-qa-id="note-row"][data-qa-value="<rowId>"]`, clear `[data-qa-id="note-edit-body"]` and type `Body after the storage check.`, then click `[data-qa-id="note-edit-save"]`.
6. Wait for the row to read `data-qa-status="viewing"`, then read its `[data-qa-id="note-edited"]`'s `data-qa-value` and keep it as `published`.
7. With `browser_evaluate`, re-read the stored record for `rowId` and keep `stored = record.updatedAt` and `createdAfter = record.createdAt`.
8. Reload the page (navigate to `base_url` again).
9. Re-locate the row by title `QA-updatedat-T3` (the body changed, the title did not) and read its `note-edited` attributes again.
10. Read the console and the network log.

**Expected:**

- Step 4: the freshly added note is stored with **no** `updatedAt` key at all — `('updatedAt' in record) === false`. A key present as `null`, `0` or `undefined`-serialized is a failure: absence is the state.
- Step 6/7: `Number(published) === stored`, exactly. `typeof stored === 'number'` and `Number.isFinite(stored) === true` — the value is epoch milliseconds in both places, the same number in storage and on the row.
- `createdAfter === createdBefore` — the edit did not rewrite `createdAt`, in storage or anywhere else.
- The stored record still holds its other fields unchanged apart from the body just edited: same `id`, same `title` (`QA-updatedat-T3`), `body` now `Body after the storage check.`.
- After the reload (step 9): the row is still listed under the default **Active** filter — `readAll` accepted the record carrying an `updatedAt`, it was not dropped — its `[data-qa-id="note-edited"]` still reads `data-qa-status="edited"`, and its `data-qa-value` is **identical** to `published` from step 6. The value came out of storage through `toNote`, so a mismatch here means the mapper is not an inverse over the field.
- Its `textContent` still begins with `Edited ` and `getComputedStyle(element).display` is not `none`.
- **Network:** no XHR and no `fetch` at any step. The reload in step 8 legitimately re-requests the document, `styles.css` and the `dist/*.js` module graph, and nothing else. **Stored state:** every read above is of `localStorage['notes-app.notes']`, this project's whole persistence.
- **Console:** no `error`-level messages, before or after the reload — `src/` holds no logger and no `console` call, so any error is an uncaught exception or a failed load.

**On failure → fix target:** `data` if the record is dropped on reload or the field is not persisted in the shape the guard accepts (`src/data/noteRecord.ts` — the `updatedAt` clause in `isNoteRecord`); `domain` if the stored number and the entity's `Date` disagree in either direction, or `createdAt` was rewritten (`src/domain/noteMapper.ts`, `src/domain/notesService.ts`); `presentation` if storage is right and the row publishes a different or unparsable value (`src/presentation/noteListView.ts`).
