### Test 4 — A second edit moves the instant forward and keeps only the latest

**Goal:** The row shows the **last** edit, not the first and not a list: a second save replaces the instant with a strictly later one, through the same single element.

**Preconditions:**

- The application is already running at `base_url`; never start or stop it. One surface, no router.
- No authentication: no sign-in exists, `harness.config.json` configures no `qa.authProvider`, and no QA account is needed.
- No seed data required — this test creates its own note under a title no other test uses.
- The instant is epoch **milliseconds**, so two saves in the same millisecond would be indistinguishable. Step 6 waits a full second between the two saves deliberately; do not shorten it, and do not treat the wait as incidental.
- Filter stays on **Active** throughout.

**Capability / MCP:** Playwright (interaction + network + console)

**Steps:**

1. Navigate to `base_url`.
2. Add the note: `QA-updatedat-T4` into `[data-qa-id="note-title-input"]`, `First body.` into `[data-qa-id="note-body-input"]`, click `[data-qa-id="note-submit"]`.
3. Locate the row by its `[data-qa-id="note-title"]` `data-qa-value="QA-updatedat-T4"` and record its own `data-qa-value` as `rowId`.
4. Click the row's `[data-qa-id="note-edit"]`, wait for `[data-qa-id="note-row"][data-qa-value="<rowId>"]` to read `data-qa-status="editing"`, clear `[data-qa-id="note-edit-body"]`, type `Second body.`, click `[data-qa-id="note-edit-save"]`.
5. Wait for the row to read `data-qa-status="viewing"`, read its `[data-qa-id="note-edited"]`'s `data-qa-value` and keep it as `v1`.
6. Wait **at least 1 second** (`browser_wait_for` with a 1-second time) so the clock cannot land in the same millisecond.
7. Click the row's `[data-qa-id="note-edit"]` again, wait for `data-qa-status="editing"`, clear `[data-qa-id="note-edit-body"]`, type `Third body.`, click `[data-qa-id="note-edit-save"]`.
8. Wait for the row to read `data-qa-status="viewing"`, read its `note-edited` `data-qa-value` again and keep it as `v2`.
9. With `browser_evaluate`, read the stored record: `JSON.parse(localStorage.getItem('notes-app.notes')).find((r) => r.id === rowId)`.
10. Read the console and the network log.

**Expected:**

- `Number(v1)` and `Number(v2)` are both finite integers, and `Number(v2) > Number(v1)` — strictly greater. Equal values mean the second save did not stamp (or the wait was skipped); a smaller value means the field is not the latest edit.
- The stored record's `updatedAt` equals `Number(v2)` — storage holds the latest instant too, not the first.
- The row still contains **exactly one** `[data-qa-id="note-edited"]` element after both saves. This branch records one latest timestamp and nothing else: a second line, a history list, or an edit counter appearing on the row is out of scope and a failure.
- The row's `[data-qa-id="note-body"]` reads `Third body.` and `[data-qa-id="note-title"]` still reads `data-qa-value="QA-updatedat-T4"` — the title was never edited and was not disturbed.
- The `note-edited` element still reads `data-qa-status="edited"`, its text still begins with `Edited `, and its computed `display` is not `none`.
- The stored record's `createdAt` is unchanged across both edits.
- **Network:** no XHR and no `fetch` at any step; only the initial document, `styles.css` and the `dist/*.js` module graph appear in the log. **Stored state:** all reads are of `localStorage['notes-app.notes']`.
- **Console:** no `error`-level messages — `src/` contains no logger and no `console` call, so any error is an uncaught exception or a failed load.

**On failure → fix target:** `domain` — the stamp is written in `editNote`'s own `change` callback in `src/domain/notesService.ts` and mapped by `src/domain/noteMapper.ts`; a value that does not advance on a second save is that callback failing to re-read the clock, or the mapper carrying a stale value forward.
