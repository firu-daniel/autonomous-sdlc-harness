# Task prompt — record when a note was last edited

Branch: `feat_note_updated_at`.

A note records **when it was last edited**, and its row shows it. A note nobody has edited since it
was created shows nothing: never-edited is a real state, not a zero and not the creation time.

## What this delivers

1. **Data.** An optional `updatedAt` on the persisted record — epoch milliseconds, like `createdAt`
   — with a named constant beside `PINNED_WHEN_ABSENT` stating what an absent field means. The type
   guard accepts both shapes: a record written before this branch must still load, and must not be
   dropped or repaired on the way in.
2. **Domain.** The entity carries the value and the mapper maps it in both directions. **Only an
   edit of the note's own content stamps it** — `editNote` does; `setArchived`, `setPinned` and
   `deleteNote` do not, because archiving or pinning a note is not an edit of it. `createdAt` is
   never rewritten, and whichever module reads the clock is the one that already does.
3. **Presentation.** The row renders an "Edited …" line, published through the same test-attribute
   helper every other control goes through and carrying a readable value — and renders nothing at
   all for a note that has never been edited.

## Constraints

- The existing tests must stay green. This adds behaviour; it changes none of the rules already
  covered — a blank title is still rejected, `readAll` still never throws, `writeAll` still does,
  and pinned notes still list first.
- No new runtime dependency. The project has none and ships no framework.
- Absence is the compatibility surface, and two unlike things arrive at it: a record written before
  this branch existed, and a note genuinely never edited since it was created. Decide explicitly
  whether those are one state or two, and make the decision visible in the code rather than implied
  by a default.
- A rendered timestamp is not something a test can assert on as text. What the row publishes for a
  test to read has to be readable back deterministically, which a human-facing date line is not.

## Out of scope

- Any change to listing order — no sorting or grouping by edit time.
- Relative time ("3 minutes ago"), and any library brought in to format one.
- Any change to `createdAt`: what it means, when it is set, or whether it is shown.
- A new filter, a new view, or any second screen, route or navigation change.
- Recording who edited, how many times, or any other history beyond the one latest timestamp.
