# UI Test Plan: feat_note_updated_at

## Context

This branch gives a note a **last-edited instant** and shows it on the row: `updatedAt?: number` on the persisted record, `Note.updatedAt` as `Date | null` on the entity, a stamp written by `editNote` and by no other action, and a `note-edited` line on the row that publishes the instant as `data-qa-value` in epoch milliseconds. A note nobody has edited since it was created shows **nothing** — the element is still built and still publishes `data-qa-status="never-edited"`, and `styles.css` hides it through that token rather than the view omitting it, so the never-edited state has something a test can read. These seven tests cover the whole of that user-facing behaviour: the never-edited state and its hidden-not-removed element, the stamp appearing in place on save without a reload, the published value matching what storage holds and surviving a reload, a second edit moving the instant forward, the four non-edit actions (pin, unpin, archive, restore) leaving it alone, a rejected edit stamping nothing, and the compatibility surface — a record stored with the `updatedAt` key absent loading unrepaired, which is the exact shape of a note already in someone's browser from before this branch.

Two things shape how these tests are written. **There is no network to assert on:** nothing under `src/` calls `fetch` or `XMLHttpRequest`, and this project's whole persistence is the single `localStorage` key `notes-app.notes` reached through `readAll` / `writeAll` (`src/data/noteRecord.ts`, `src/data/notesStore.ts`). So each test's network expectation is the absence of any XHR/fetch traffic, and the stored-state assertion is a `localStorage` read through `browser_evaluate` — this project's analog of a backend assertion, and the only way to see a stamp that leaked into `setArchived` or `setPinned` even when the row happens to re-render correctly. **Every test is self-contained:** the app has no sign-in (`harness.config.json` configures no `qa.authProvider` and `.claude/qa-accounts.env` does not exist), and each test creates the note it needs through the composer under a title unique to that test, so no test depends on another test's data and there are no `**Depends on:**` links. Run order below is the order the behaviour builds in, not a state chain.

## Phase 2 Readiness — Ordered Fix List

**This section is the single source of truth for the interactive-test loop.** The orchestrator walks the `[ ]` entries below top-to-bottom, dispatching the `qa-tester` once per entry; the committer flips each one to `[x]` as that test passes. `[ ]` markers anywhere else — the sub-step bullets inside the per-test files — are informational only and are never the iteration source.

Each entry resolves 1:1 to a self-contained `sdlc-harness/ui_test_plans/feat_note_updated_at/ui_test_<K>.md` file. The trailing `_(layer: …)_` tag is the layer a failure should be fixed in, not the layer that runs the test.

1. [x] **Test 1** — A newly added note publishes `never-edited` and shows no edited line _(layer: presentation, general)_
2. [x] **Test 2** — Saving an edit stamps the row's edited line in place, with no reload _(layer: domain, presentation)_
3. [x] **Test 3** — The published instant is what storage holds, and it survives a reload _(layer: data, domain, presentation)_
4. [x] **Test 4** — A second edit moves the instant forward and keeps only the latest _(layer: domain)_
5. [x] **Test 5** — Pin, unpin, archive and restore do not stamp an edit _(layer: domain)_
6. [x] **Test 6** — A rejected edit stamps nothing _(layer: domain)_
7. [x] **Test 7** — A never-edited note is stored with the key absent and reloads unrepaired _(layer: data, domain)_
