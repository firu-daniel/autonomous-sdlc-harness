### Test 1 — A newly added note publishes `never-edited` and shows no edited line

**Goal:** A note that has just been created — and so has never been edited — shows no "Edited …" line at all, while still publishing a state token a test can read: the `note-edited` element is built and hidden, never omitted.

**Preconditions:**

- The application is already running and served by the caller at `base_url`; never start, restart or stop it. Open `base_url` itself — this project has one mounted surface, no router and no second route (`index.html` holds `#app`, `src/main.ts` mounts `createApp()` into it).
- No authentication of any kind. The app has no sign-in, `harness.config.json` configures no `qa.authProvider`, and `.claude/qa-accounts.env` does not exist — no QA account is needed or reserved for this project.
- No seed data is required. Whatever notes `localStorage` already holds may stay; this test creates the one note it asserts on, under a title no other test uses.
- The default filter on load is **Active** (`filter` starts as `'active'` in `createApp`), which is the filter this test runs under throughout.

**Capability / MCP:** Playwright (interaction + network + console)

**Steps:**

1. Navigate to `base_url`.
2. Read `[data-qa-id="note-list"]`'s `data-qa-value` and keep it as `countBefore` (it is the rendered, filtered count).
3. Type `QA-updatedat-T1` into `[data-qa-id="note-title-input"]`.
4. Type `Never edited yet.` into `[data-qa-id="note-body-input"]`.
5. Click `[data-qa-id="note-submit"]`.
6. Wait for the new row: the `[data-qa-id="note-row"]` whose descendant `[data-qa-id="note-title"]` carries `data-qa-value="QA-updatedat-T1"`. Locate it with `browser_evaluate`, e.g. `[...document.querySelectorAll('[data-qa-id="note-row"]')].find((r) => r.querySelector('[data-qa-id="note-title"]')?.getAttribute('data-qa-value') === 'QA-updatedat-T1')`. Call it **the row** for the rest of this test.
7. Read, off the row, every attribute the Expected list below names — including `getComputedStyle` on the `note-edited` element, which is the only way to tell "hidden" from "shown but empty".
8. Read the console and the network log.

**Expected:**

- After step 5, `[data-qa-id="note-submit"]` reads `data-qa-status="idle"` again (it is set to `saving` and back to `idle` in the composer's `finally`), and `[data-qa-id="note-error"]` reads `data-qa-status="idle"` — the draft was accepted.
- `[data-qa-id="note-list"]`'s `data-qa-value` is `countBefore + 1`.
- The row exists, reads `data-qa-status="viewing"`, and carries a non-empty `data-qa-value` (the note's id).
- The row contains **exactly one** `[data-qa-id="note-edited"]` element. It is present in **both** states by design — a test waits on a token and cannot wait on an absence — so a missing element here is a failure, not a pass.
- That element reads `data-qa-status="never-edited"`.
- That element has **no `data-qa-value` attribute at all** — not an empty one, not `"null"`, not `"0"`. The view passes `value: undefined` for a never-edited note and `qa` in `src/presentation/qaAttrs.ts` only writes `data-qa-value` when the value is defined. Assert with `hasAttribute('data-qa-value') === false`.
- That element's `textContent` is the empty string, and its `className` is `note__edited`.
- `getComputedStyle(element).display === 'none'` — it is **hidden by the stylesheet**, through `.note__edited[data-qa-status='never-edited'] { display: none; }`, not removed from the DOM. A visible empty line, or a blank gap between the body and the controls, is a failure of the styling half.
- The row's other published elements are unaffected: `[data-qa-id="note-title"]` reads `data-qa-value="QA-updatedat-T1"`, `[data-qa-id="note-pin"]` reads `data-qa-status="unpinned"`, `[data-qa-id="note-archive"]` reads `data-qa-status="active"`.
- **Network:** no XHR and no `fetch` request is made at any step — this project makes none, anywhere under `src/`. The only requests in the log are the initial document, `styles.css`, and the `dist/*.js` module graph loaded by `index.html`. **Stored state:** persistence is the single `localStorage` key `notes-app.notes` written by `writeAll`; after step 5 it contains a record whose `title` is `QA-updatedat-T1`.
- **Console:** no `error`-level messages. There is no logger and no `console` call anywhere under `src/` (`.claude/context/conventions.md`, `## Errors and logging`), so **any** console error is either an uncaught exception or a failed resource load, and either is a defect.

**On failure → fix target:** `presentation` if the `note-edited` element is missing, carries the wrong `data-qa-status`, or wrongly carries a `data-qa-value` while never edited (`src/presentation/noteListView.ts`, `renderViewing`); `general` if the element is correct but visible — the hiding rule lives in `styles.css`, which the catch-all layer owns.
