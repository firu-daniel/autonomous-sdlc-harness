### Test 7 — A never-edited note is stored with the key absent and reloads unrepaired

**Goal:** The compatibility surface. A note that has never been edited is stored with **no** `updatedAt` key — which is exactly the shape of a record written before this branch existed — and that record still loads, still lists, still reads as never-edited, and is not repaired, migrated or dropped on the way in, even after the app has rewritten it.

**Preconditions:**

- The application is already running at `base_url`; never start or stop it. One surface, no router.
- No authentication: no sign-in exists, `harness.config.json` configures no `qa.authProvider`, and no QA account is needed.
- **No storage seeding is needed, and none is performed.** A pre-branch record and a note created here but never edited are the same shape: `toRecord` writes `updatedAt` as `undefined` for a never-edited note and `JSON.stringify` omits the key, so the record this test creates through the composer is the record a user already has in their browser. That is why this test is driven entirely through the interface — the legacy load path is reachable without writing `localStorage` by hand, and writing it by hand would test a shape the app itself never produces.
- This test reads `localStorage['notes-app.notes']` with `browser_evaluate` but never writes it. Whatever notes are already there stay; nothing is deleted.
- The list starts on the **Active** filter and stays there; the reload returns the page to that same default.

**Capability / MCP:** Playwright (interaction + network + console)

**Steps:**

1. Navigate to `base_url`.
2. Add the note: `QA-updatedat-T7` / `Body for the compatibility check.` through `[data-qa-id="note-title-input"]`, `[data-qa-id="note-body-input"]`, `[data-qa-id="note-submit"]`.
3. Locate its row by `[data-qa-id="note-title"]` `data-qa-value="QA-updatedat-T7"` and record its own `data-qa-value` as `rowId`. Read `[data-qa-id="note-list"]`'s `data-qa-value` and keep it as `countBefore`.
4. With `browser_evaluate`, read the stored record: `JSON.parse(localStorage.getItem('notes-app.notes')).find((r) => r.id === rowId)`. Keep `createdBefore = record.createdAt`.
5. Force a rewrite of that record through the app: click the row's `[data-qa-id="note-pin"]` and wait for it to read `data-qa-status="pinned"`. This routes the note through `toRecord` and `writeAll` — the path that would repair or invent a field if anything did.
6. Re-read the stored record for `rowId` with `browser_evaluate`.
7. Reload the page (navigate to `base_url` again).
8. Re-locate the row by title `QA-updatedat-T7` and read its attributes, its `[data-qa-id="note-edited"]` element, and `[data-qa-id="note-list"]`'s `data-qa-value`.
9. Re-read the stored record for `rowId` one final time.
10. Read the console and the network log.

**Expected:**

- Step 4: the stored record has **no** `updatedAt` key — `('updatedAt' in record) === false`. Not `null`, not `0`, not `createdAt` copied into it: absence is the state, and it is the same absence a pre-branch record arrives with.
- Step 6, after the rewrite: `('updatedAt' in record) === false` still. Rewriting a never-edited note keeps the key out of storage; a key that appears here means `toRecord` is writing something for a note that has never been edited. The record's `pinned` is now `true` and its `createdAt` still equals `createdBefore`.
- Step 8, after the reload: the row is **still listed** under the Active filter — `readAll` accepted a record with the field absent and did not drop it. The note surviving the reload is the whole point of this test; a missing row here is the branch breaking notes already in someone's browser.
- The reloaded row's `[data-qa-id="note-edited"]` reads `data-qa-status="never-edited"`, has **no `data-qa-value` attribute**, has empty `textContent`, and computes to `display: none` — a record with the key absent renders the never-edited state, not an "Edited …" line and not a fallback to the creation time.
- The reloaded row's other fields survived intact: `[data-qa-id="note-title"]` reads `data-qa-value="QA-updatedat-T7"`, `[data-qa-id="note-body"]` reads `Body for the compatibility check.`, `[data-qa-id="note-pin"]` reads `data-qa-status="pinned"`, and the row's own `data-qa-value` is still `rowId`.
- `[data-qa-id="note-list"]`'s `data-qa-value` after the reload equals `countBefore` — no note was dropped by the round trip, not this one and not any of the notes the earlier tests left behind.
- Step 9: the record is **unrepaired** — `('updatedAt' in record) === false` after the reload as well. Nothing on the read path writes to storage.
- **Network:** no XHR and no `fetch` at any step; the reload legitimately re-requests the document, `styles.css` and the `dist/*.js` module graph, and nothing else. **Stored state:** every assertion is a read of `localStorage['notes-app.notes']`, this project's only persistence.
- **Console:** no `error`-level messages at any point, and in particular none on the reload — `src/` holds no logger and no `console` call, so a console error there is an uncaught exception (a guard or mapper throwing on the absent field) or a failed load.

**On failure → fix target:** `data` if the record is dropped, rejected or altered on read — the accepting clause for an absent `updatedAt` is in `isNoteRecord` in `src/data/noteRecord.ts`, beside `UPDATED_AT_WHEN_ABSENT`; `domain` if the record survives but the absent field is resolved to the wrong entity value or written back as a key (`src/domain/noteMapper.ts`, `toNote` and `toRecord`).
