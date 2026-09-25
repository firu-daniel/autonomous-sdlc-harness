### Task 3 — Offer the ntfy topic in `init`'s question, refuse an unrecognised `--push-url`, and cover the re-run paths

**Goal:** Make `init`'s push-destination question offer the no-server ntfy route as a suggestion, beside the full-URL route, in the same question. Make the `--push-url` flag accept exactly what the question accepts. Refuse (flag) or re-ask (terminal) an answer that is neither, and never repeat the value. Prove with fixture tests that an already-configured machine is never re-pointed, re-written or degraded by a re-run.

**Depends on:** Task 1, which exports these from `cli/src/generators/notifications.ts`, restated here so this implementer does not guess:

```ts
export const PUSH_DESTINATION_PLACEHOLDER = '<url-or-ntfy-topic>';
export const PUSH_DESTINATION_FORMS: string;   // the one sentence describing both accepted answers
export type PushDestination =
  | { readonly kind: 'url'; readonly url: string }
  | { readonly kind: 'ntfy-topic'; readonly url: string }   // url is https://ntfy.sh/<topic>
  | { readonly kind: 'unrecognised' };
export function resolvePushDestination(answer: string): PushDestination;
```

Task 1 also makes `writeNotifications` resolve `NotificationsOptions.pushUrl` itself. The field keeps its name and is now *"the destination as given — a full URL or an ntfy topic name"*. So this task passes the answer **as given**, never a pre-resolved URL. For an `unrecognised` value, the generator writes nothing and returns one warning that does not repeat it. This task never re-implements the grammar and never re-words the accepted forms: it calls `resolvePushDestination` and interpolates `PUSH_DESTINATION_FORMS` / `PUSH_DESTINATION_PLACEHOLDER`.

**Where this task stops.** The generator's notes, the file's content and quoting, and the committed example file are Task 1's. `doctor`'s advice is Task 2's. The docs are Task 4's. The delivery script is unchanged by this branch (story index, register row 4).

### Targets

- `cli/src/core/prompt.ts`: export the re-ask bound.
- `cli/src/commands/init.ts`: `parseInitFlags`, the `pushUrl` row of `INIT_OPTIONS`, the `InitFlags.pushUrl` doc comment, the import from `../generators/notifications.js`, and `resolveNotifications`.
- `cli/test/init.test.mjs`: the `push notifications are opt-in, and an opt-in without an endpoint writes nothing at all` suite. Task 1 has already added this suite's `TOPIC` constant and its `a topic given through the flag is written as its ntfy.sh address` subtest. This task reuses both and re-creates neither.

**Work:**

- [ ] **`prompt.ts`**: export `REPROMPT_LIMIT` (value unchanged, `2`). Its doc comment says `init`'s push-destination re-ask shares it, so the two re-ask loops cannot drift apart. The module header's "one way to ask a question" rule still holds, because the caller loops over `askLine` rather than reading the terminal itself.
- [ ] **`parseInitFlags`**: after the loop and beside the analyze-pair and `--docs-retrieval` refusals, check `values.get('pushUrl')` when it is present, **whether or not `--notifications` was given**. If `resolvePushDestination(value).kind === 'unrecognised'`, throw `HarnessError` with this message: `` `init: ${PUSH_URL_FLAG} takes ${PUSH_DESTINATION_FORMS}; the value given is neither, so nothing was written. It is not repeated here, because a push destination is a credential — check it and pass it again` ``. The message must not interpolate the value, unlike `parseQaDriver`'s `JSON.stringify(value)`. The comment on this check explains two things: it sits in the parser for the same reason `--qa-driver` does (so a bad value cannot cost the adopter a repository this run created), and why the value is withheld. Keep the raw string in `InitFlags.pushUrl` and update that field's doc comment to *"an ntfy topic name or a full URL, checked at parse time by `resolvePushDestination`"*.
- [ ] **The `pushUrl` row of `INIT_OPTIONS`**:
  - set `placeholder: PUSH_DESTINATION_PLACEHOLDER`;
  - set `summary` to `'Where notifications are posted: an ntfy topic name, or the full URL of any endpoint that accepts a POST (with --notifications)'`;
  - swap the `GUIDED_ENDPOINT_EXAMPLE` import for `PUSH_DESTINATION_FORMS`, `PUSH_DESTINATION_PLACEHOLDER` and `resolvePushDestination`.

  `GUIDED_ENDPOINT_EXAMPLE` stays exported from Task 1's module for its own use, and `init` no longer imports it.
- [ ] **`resolveNotifications`**: the endpoint question becomes `` `Where should notifications be posted? Type ${PUSH_DESTINATION_FORMS}.` ``, still with `flag: PUSH_URL_FLAG` and no `defaultValue`. Move the ask into a small `askPushDestination(promptCtx)` loop of at most `REPROMPT_LIMIT + 1` asks:
  - `undefined` (blank line, no terminal, `--non-interactive`, `--quiet`) returns `undefined` at once. That is the unchanged guided-note route.
  - An answer whose `resolvePushDestination` kind is not `unrecognised` is returned **as typed**.
  - An `unrecognised` answer prints one `ctx.report.info` line saying the answer is neither an ntfy topic name nor a full `http://` or `https://` URL, so it was not used, and that it is not repeated because a push destination is a credential. Then it asks again.
  - After the last unrecognised answer, return it, so the generator emits its warning and writes nothing.

  `flags.pushUrl` still wins over asking. Update the function's doc comment to say what the three outcomes are.
- [ ] **`init.test.mjs`**: reuse the `TOPIC` constant Task 1 added (unique, matching the ntfy topic pattern, and in no fixture path). Add subtests to the notifications suite, each passing `machineHome`'s `XDG_CONFIG_HOME`:
  1. **Topic through the flag:** do not add a new subtest. **Extend** Task 1's `a topic given through the flag is written as its ntfy.sh address` subtest, which already asserts exit 0, `HARNESS_PUSH_URL=https://ntfy.sh/${TOPIC}` at `0600` in a `0700` directory, and `TOPIC` in neither stream. Add one comment and one assertion: the value now passes the new parse-time check in `parseInitFlags` The run still exits 0, and stderr does not contain `init: --push-url takes`.
  2. **The host form:** `ntfy.sh/${TOPIC}` produces the same file line.
  3. **Another service's URL is equally accepted:** `https://example.invalid/hook?a=1&b=2` is written single-quoted, exit 0, and not echoed.
  4. **Refused, on a fresh fixture:** `--notifications --push-url 'not a destination'` exits 1 through `runCli`. stderr names `--push-url` and says `ntfy`. Neither stream contains the value. The machine directory does not exist and no `harness.config.json` was written.
  5. **Refused without `--notifications` too:** the same value with no `--notifications` exits 1.
  6. **Re-runs over an already-configured machine**, each asserting the file is byte-identical afterwards:
     - (a) pre-seed a hand-written `push.env` holding `HARNESS_PUSH_URL=${PUSH_URL}` plus an adopter comment, then run `init --notifications --push-url ${TOPIC}`;
     - (b) after a first `init --notifications --push-url ${PUSH_URL}`, run a plain `init` with no flags;
     - (c) over the same configured machine, run `init --notifications --push-url 'not a destination'`, which exits 1.
  7. **One wording on both surfaces:** import `PUSH_DESTINATION_FORMS` from `../dist/generators/notifications.js`. A piped `init --notifications` prints it in both the question's no-terminal note (the line containing `Where should notifications be posted?`) and the guided note, so it occurs at least twice. stdout also literally contains `ntfy` and `App Store` and `https://`.
  8. **The help row:** `init --help` stdout contains `--push-url <url-or-ntfy-topic>`.

  Update the suite header to say the terminal re-ask is not reachable through a piped stdin and is covered by the hand-run gate in `docs/development.md` §5 instead (Task 4). This follows the testing bar's rule that a documented behaviour left uncovered is named in the header.

**Verification:**

- `bash scripts/typecheck.sh` and `bash scripts/test.sh` exit 0, run without a pipe. The pre-existing notification cases pass unchanged, including the blank-line assertions on `Set up push notifications for unattended runs?`.
- Exercise the flow end to end against a throwaway directory. Build first with `npm run build`. Then run `node cli/dist/cli.js init --cwd <scratch> --git-init --notifications --push-url <a-topic>` with `XDG_CONFIG_HOME` pointed at a scratch directory. `push.env` there holds `HARNESS_PUSH_URL=https://ntfy.sh/<a-topic>`, and `node cli/dist/cli.js doctor --cwd <scratch>` reports the `notifications` check as passing without printing the value. That is the story's wiring path: the question's answer, then the generator, then the file, then the notifier's reader.
- On a real terminal, answer the endpoint question first with `not a destination` (the question is asked again, and the value is not printed back), then with a topic name. This is the hand-run step Task 4 writes into `docs/development.md` §5, because no subprocess test can allocate a terminal.
