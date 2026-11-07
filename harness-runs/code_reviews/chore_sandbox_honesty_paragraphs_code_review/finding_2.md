### 2. The `_README` line says HP1 compared one call and "nothing else", while HP1 compared three and `docs/cli.md` now says so

**File:** `cli/templates/claude/settings.autonomous.json` (`_README`) — "A HEADLESS `-p` SESSION WAS COMPARED WITH AN INTERACTIVE ONE ON ONE CALL:"
**And its pin:** `cli/test/profile.test.mjs` (the case `the _README says what the sandbox leaves outside and points at its document of record`) — "exactlyOne('A HEADLESS `-p` SESSION WAS COMPARED WITH AN INTERACTIVE ONE ON ONE CALL:')"

Task 2 replaced the old "UNRESOLVED" line with:

> A HEADLESS `-p` SESSION WAS COMPARED WITH AN INTERACTIVE ONE ON ONE CALL: an interactive session matched a headless one on RT1's call, on macOS and on Linux (row HP1, docs/sandbox-record.md §1). Nothing else was compared, and an unattended run is a `-p` session.

The evidence row it cites says otherwise. In `docs/sandbox-verification.md`, row `HP1` is *"Headless parity: N1's network call, RT1's retry call and CS2's write-protection call, re-run in interactive sessions"*, and its verdict is *"interactive results match headless for N1, RT1 and CS2"*. `HP1 (Linux)` likewise records N1, RT1 and CS2 matching. So "ON ONE CALL" and "Nothing else was compared" are false: two more calls were compared and matched. The line followed `docs/sandbox-record.md` §1's bullet, which names only RT1 because that bullet is about `dangerouslyDisableSandbox`.

The same branch's Task 6 wrote the opposite into `docs/cli.md` §6: **Headless parity, measured on three calls:** *"on N1's network call, RT1's retry call and CS2's write-protection call, on macOS and on Linux"*. The rendered profile and the CLI reference now contradict each other on one fact. The new test pins the `_README`'s wrong version by its prefix.

**Fix:**

1. In `cli/templates/claude/settings.autonomous.json` → `_README`, replace that whole string with:

   ```
   "A HEADLESS `-p` SESSION WAS COMPARED WITH AN INTERACTIVE ONE ON THREE CALLS: an interactive session matched a headless one on N1's network call, RT1's retry call and CS2's write-protection call, on macOS and on Linux (rows HP1 and HP1 (Linux), docs/sandbox-record.md §4, the `headless-parity` leg). Nothing else was compared, and an unattended run is a `-p` session.",
   ```

   Keep its position in the array and the trailing comma.

2. In `cli/test/profile.test.mjs`, in the case `the _README says what the sandbox leaves outside and points at its document of record`, change the prefix in

   ```js
   const headless = exactlyOne('A HEADLESS `-p` SESSION WAS COMPARED WITH AN INTERACTIVE ONE ON ONE CALL:');
   ```

   to

   ```js
   const headless = exactlyOne('A HEADLESS `-p` SESSION WAS COMPARED WITH AN INTERACTIVE ONE ON THREE CALLS:');
   ```

   Leave the `HP1` assertion and the `WHETHER A HEADLESS` refusal loop as they are.

3. Run the one test file this fix edits, from the repository root, as one plain foreground command: `npm test --workspace cli -- test/profile.test.mjs`.

`examples/notes-app/.claude/settings.autonomous.json` is not touched here. The story index's `**Manual setup required:**` post-merge re-render picks up this line along with the others Tasks 2 and 3 changed.
