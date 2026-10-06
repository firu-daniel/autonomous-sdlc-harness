### 1. The folded-pause line on a `park_loop` comment says the run continues once answered, but a hold continues only on `clear`

**File:** `cli/templates/scripts/remote-run.sh` (`forge_report`) — "parked|park_loop)" and "PAUSE_FOLDED_NOTE='A pause was requested on this run before it parked"

**Problem.** Task 4 appends one fixed line, `PAUSE_FOLDED_NOTE`, to both the `parked` and the `park_loop` comment when the registry's `pause_reason` is `user`. The line reads *"… so it is folded into this park: the run waits for the answer and continues once it is answered, and no separate `paused` comment follows."* That is right for `parked`. It is wrong for `park_loop`.

A `park_loop` record is one the park-loop guard holds after `PARK_LOOP_MAX_CYCLES` resumes that made no progress (`autonomous-watcher.sh` → `classify_run_exit`, "registry_set \"$branch\" status park_loop"). Its questions may well be answered already, which is how the loop arises. The run continues only once someone comments `@sdlc-harness clear`, and the comment's own text says exactly that: *"Comment `@sdlc-harness clear` to clear the hold and let it continue."* The folded line appended under it then says the opposite: that the run continues once it is answered.

The reader who gets this wrong is the operator reading a `park_loop` comment. They can answer the question again and wait for a resume that never comes, because no answer releases a hold. The same contradicting sentence is quoted for `park_loop` in `docs/github-run-control.md` (`## 1.`, the paragraph under the `pause` reply block, and the `park_loop` row of `## 5.`'s table), and `cli/test/remote-report.test.mjs` (`park_loop with a user pause pending carries the folded-pause line after its text`) asserts it.

**Fix.** Give `park_loop` its own folded line. `parked` keeps the existing one.

- [ ] **`cli/templates/scripts/remote-run.sh`, the constants.** Directly after the `PAUSE_FOLDED_NOTE='…'` line, add:

  ```bash
  PAUSE_FOLDED_HOLD_NOTE='A pause was requested on this run before it was put on hold, so it is folded into this hold: the run waits for the hold to be cleared and continues once it is, and no separate `paused` comment follows.'
  ```

  The comment line above `PAUSE_FOLDED_NOTE` ("Names no login: the job sees only the `harness pause` run, whose actor is the bot.") now covers both constants. Change it to: `# Name no login: the job sees only the `harness pause` run, whose actor is the bot.`

- [ ] **`forge_report`'s locals.** Change `local gone_prs="" reported=""` to `local gone_prs="" reported="" folded=""`.

- [ ] **`forge_report`'s folding block.** Replace

  ```bash
    case "$event" in
      parked|park_loop)
        if [ "$reason" = user ]; then
          if [ -z "$note" ]; then note="$PAUSE_FOLDED_NOTE"; else note="$note"$'\n\n'"$PAUSE_FOLDED_NOTE"; fi
        fi ;;
    esac
  ```

  with

  ```bash
    case "$event" in
      parked|park_loop)
        if [ "$reason" = user ]; then
          folded="$PAUSE_FOLDED_NOTE"
          [ "$event" != park_loop ] || folded="$PAUSE_FOLDED_HOLD_NOTE"
          if [ -z "$note" ]; then note="$folded"; else note="$note"$'\n\n'"$folded"; fi
        fi ;;
    esac
  ```

- [ ] **The header's `report` paragraph.** Replace these four lines:

  ```
  # is set once per target, not per question. `parked` and `park_loop` append
  # `PAUSE_FOLDED_NOTE` to <note>, after one blank line, when the registry's
  # `pause_reason` is `user`: a pause the job dropped and the run never honoured. On a public repository a question
  # comment and its answer are public, as the artifact already is
  ```

  with:

  ```
  # is set once per target, not per question. When the registry's `pause_reason`
  # is `user` (a pause the job dropped and the run never honoured), `parked`
  # appends `PAUSE_FOLDED_NOTE` to <note> and `park_loop` appends
  # `PAUSE_FOLDED_HOLD_NOTE`, each after one blank line. On a public repository a
  # question comment and its answer are public, as the artifact already is
  ```

- [ ] **`cli/test/remote-report.test.mjs`.** Directly after the `const PAUSE_FOLDED_NOTE = …;` declaration, add:

  ```js
  const PAUSE_FOLDED_HOLD_NOTE =
    'A pause was requested on this run before it was put on hold, so it is folded into this hold: the run waits for the hold to be cleared and continues once it is, and no separate `paused` comment follows.';
  ```

  In the test `park_loop with a user pause pending carries the folded-pause line after its text`, rename it to `park_loop with a user pause pending carries the folded-hold line after its text`. Replace its last assertion with these two:

  ```js
  assert.ok(posted.body.includes(`to clear the hold and let it continue.\n\n${PAUSE_FOLDED_HOLD_NOTE}\n`), posted.body);
  assert.ok(!posted.body.includes(PAUSE_FOLDED_NOTE), posted.body);
  ```

  In the file's header, replace "A `parked` or `park_loop` report whose registry\n * `pause_reason` is `user` appends the folded-pause line; no other event or reason does." with "A `parked` report whose registry `pause_reason` is\n * `user` appends the folded-pause line, and a `park_loop` report the folded-hold line; no other event or reason\n * does." Keep the following sentence, "Only `round` changes a pull request's draft state, undoing a", on its own line after it.

- [ ] **`docs/github-run-control.md` → `## 1.`**, the paragraph under the `pause` reply block that opens "That promise holds when the run yields to the pause." Replace the whole paragraph with:

  > That promise holds when the run yields to the pause. A run that parks first posts no `paused` comment. Its `parked` comment carries this line instead: *"A pause was requested on this run before it parked, so it is folded into this park: the run waits for the answer and continues once it is answered, and no separate `paused` comment follows."* A `park_loop` comment carries this one: *"A pause was requested on this run before it was put on hold, so it is folded into this hold: the run waits for the hold to be cleared and continues once it is, and no separate `paused` comment follows."* ([`development.md`](development.md) → Gate 12 → Round 9, finding 2).

- [ ] **`docs/github-run-control.md` → `## 5.`**, the `park_loop` row's *What it says* cell. Change "a line saying the pause is folded into it" to "a line saying the pause is folded into the hold". Leave the `parked` row unchanged.

- [ ] **`docs/development.md` → Gate 12 → leg (f)**, the `@SDLC-HARNESS pause` pass condition that begins "Passes when a `harness-control.yml` run for it gets past its `if:`". Directly after the quoted folded line's closing `*,`, insert ` or, on a `park_loop` comment, the line *"A pause was requested on this run before it was put on hold, so it is folded into this hold: the run waits for the hold to be cleared and continues once it is, and no separate `paused` comment follows."*,`. The sentence's remaining text, "and no `paused` comment follows; …", follows unchanged. Do not edit the Round 9 record paragraphs: they are a dated copy.

`cli/test/remote-report.test.mjs` is the one test file this fix edits, so it is the only one the fix runs: `npm test --workspace cli -- test/remote-report.test.mjs`.
