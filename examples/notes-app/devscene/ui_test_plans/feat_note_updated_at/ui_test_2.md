### Test 2 — Saving an edit stamps the row's edited line in place, with no reload

**Goal:** Editing a note's own content records the moment it happened and shows it: the row's `note-edited` element moves from `never-edited` to `edited`, gains a readable epoch-millisecond value, and shows an "Edited …" line — on the existing `refresh()` path, with no page reload and no change to `app.ts`.

**Preconditions:**

- The application is already running at `base_url`; never start or stop it. One surface, no router — open `base_url` itself.
- No authentication: the app has no sign-in, `harness.config.json` configures no `qa.authProvider`, and no QA account exists or is needed.
- No seed data required — this test creates its own note under a title no other test uses.
- Filter stays on **Active** (the default) for the whole test; the note is never archived here.

**Capability / MCP:** Playwright (interaction + network + console)

**Steps:**

1. Navigate to `base_url`.
2. Type `QA-updatedat-T2` into `[data-qa-id="note-title-input"]`, type `Body before the edit.` into `[data-qa-id="note-body-input"]`, and click `[data-qa-id="note-submit"]`.
3. Locate the new row — the `[data-qa-id="note-row"]` whose descendant `[data-qa-id="note-title"]` carries `data-qa-value="QA-updatedat-T2"` — and record its own `data-qa-value` as `rowId`. Call it **the row**. From here on, when the row is in edit mode it has no `note-title`, so re-find it by `[data-qa-id="note-row"][data-qa-value="<rowId>"]`.
4. Confirm the starting state: the row's `[data-qa-id="note-edited"]` reads `data-qa-status="never-edited"` and has no `data-qa-value` attribute.
5. With `browser_evaluate`, read the browser's clock and keep it as `t0` (`Date.now()`).
6. Click the row's `[data-qa-id="note-edit"]`.
7. Wait for the row to read `data-qa-status="editing"`, then clear `[data-qa-id="note-edit-title"]` inside it and type `QA-updatedat-T2 edited`. Leave `[data-qa-id="note-edit-body"]` as it is.
8. Click the row's `[data-qa-id="note-edit-save"]`.
9. Wait for the row to read `data-qa-status="viewing"` again, then read the browser's clock again with `browser_evaluate` and keep it as `t1`.
10. Read the row's `note-edited` attributes, text and computed `display`, then read the console and the network log.

**Expected:**

- After step 8 the row reads `data-qa-status="viewing"` and its `[data-qa-id="note-title"]` reads `data-qa-value="QA-updatedat-T2 edited"` — the edit landed.
- The row's `[data-qa-id="note-edited"]` now reads `data-qa-status="edited"`.
- It now **has** a `data-qa-value`, and `Number(value)` is a finite integer with `t0 <= Number(value) <= t1`. The value is epoch milliseconds — the same number storage holds — read back deterministically; a value that is `NaN`, empty, `"null"`, a locale-formatted date string, or outside the `t0..t1` window is a failure.
- Its `textContent` is non-empty and begins with `Edited ` (the rest is `toLocaleString()` output and is **not** asserted on — it depends on the machine's locale and zone).
- `getComputedStyle(element).display` is **not** `none` — the edited state is the visible one.
- The line updated **without a reload**: no navigation was performed after step 1, and the network log records no second request for the document or for `dist/main.js`. The `refresh()` path re-read `listNotes(filter)` and rebuilt the row on its own.
- The row is still one row with exactly one `[data-qa-id="note-edited"]` element, and its controls are unchanged: `[data-qa-id="note-pin"]` reads `data-qa-status="unpinned"`, `[data-qa-id="note-archive"]` reads `data-qa-status="active"`.
- `[data-qa-id="note-edit-error"]` is gone with the edit mode, and `[data-qa-id="note-error"]` (the composer's) still reads `data-qa-status="idle"`.
- **Network:** no XHR and no `fetch` at any step; this project issues none. **Stored state:** the write went through `writeAll` into the single `localStorage` key `notes-app.notes` (asserted in detail by Test 3).
- **Console:** no `error`-level messages — `src/` contains no logger and no `console` call, so any error there is an uncaught exception or a failed load.

**On failure → fix target:** `domain` if the value is missing, unchanged or wrong — the stamp lives in `editNote`'s own `change` callback in `src/domain/notesService.ts`, and the mapper carries it in `src/domain/noteMapper.ts`. `presentation` if the instant is stored but the row does not show it or publishes it in an unreadable form (`src/presentation/noteListView.ts`, `renderViewing`).
