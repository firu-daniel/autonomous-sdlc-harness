### Task 1 — Own the push-destination grammar, its one wording, and a shell-safe settings file in the notifications generator

**Goal:** Make `cli/src/generators/notifications.ts` the single owner of three things: what an adopter may give as a push destination (a full URL, or an ntfy topic name), the one sentence that describes those answers, and how the chosen destination is written into the machine-local `push.env`. After this task, an answer given as an ntfy topic ends up as a correct `HARNESS_PUSH_URL`. An answer that is neither a URL nor a topic writes nothing and says so. No path prints the value.

**Where this task stops.** This task changes no question, no flag and no parser. `init`'s terminal question, its re-ask and the parse-time refusal of `--push-url` belong to **Task 3**. `doctor`'s advice line belongs to **Task 2**. Both consume the exports below exactly as named. This task keeps `NotificationsOptions.pushUrl` and the exported `GUIDED_ENDPOINT_EXAMPLE` in place so that `cli/src/commands/init.ts` still compiles unchanged when this task ships alone. Until Task 3 lands, `init` passes the raw `--push-url` value through, and this generator resolves it itself.

### Targets

- `cli/src/generators/notifications.ts`: the grammar, the shared wording, the generator's notes, warning and file content, and the module header.
- `cli/templates/claude/push-notify.env.example`: the committed example file's comment above `HARNESS_PUSH_URL=`.
- `cli/test/push-destination.test.mjs` (new): the accompanying test, covering the grammar, the generator's plan and lines, and the template's agreement with the grammar.
- `cli/test/init.test.mjs`: the `push notifications are opt-in, and an opt-in without an endpoint writes nothing at all` suite. This task adds a `TOPIC` constant and one fixture-driven case that runs the compiled CLI. `.claude/context/cli.md` → `## What "done" means here` requires that case for a generator change. Task 3 later extends this suite and reuses both.

**Work:**

- [ ] **The grammar and its constants** in `notifications.ts`, exported with these exact names and shapes. Tasks 2 and 3 restate them.
  ```ts
  export const NTFY_PUBLIC_ORIGIN = 'https://ntfy.sh';
  export const NTFY_TOPIC_PATTERN = /^[-_A-Za-z0-9]{1,64}$/;          // the ntfy server's topic-name rule
  export const PUSH_DESTINATION_PLACEHOLDER = '<url-or-ntfy-topic>';
  export const PUSH_DESTINATION_FORMS: string;                         // the one "what may I type here" sentence
  export type PushDestination =
    | { readonly kind: 'url'; readonly url: string }
    | { readonly kind: 'ntfy-topic'; readonly url: string }
    | { readonly kind: 'unrecognised' };
  export function resolvePushDestination(answer: string): PushDestination;
  ```
  - **Resolution rules.** `resolvePushDestination` trims its argument, then applies these rules in order:
    1. It starts with `http://` or `https://` (any letter case), `new URL()` parses it, the hostname is non-empty, and it contains no whitespace, no control character and no `'` → `url`, keeping the trimmed text verbatim (not `URL.href`).
    2. It matches `ntfy.sh/<topic>` (host case-insensitive, one optional trailing `/`) with `<topic>` matching `NTFY_TOPIC_PATTERN` → `ntfy-topic`, whose `url` is `` `${NTFY_PUBLIC_ORIGIN}/${topic}` ``.
    3. It matches `NTFY_TOPIC_PATTERN` itself → `ntfy-topic`, as in rule 2.
    4. Anything else, including the empty string and a scheme-less `example.com/hook` → `unrecognised`.
  - **`PUSH_DESTINATION_FORMS`.** One sentence, offering the topic as the easy route and the URL as the equal alternative. It says:
    - the topic route: install the free ntfy app from the App Store or Play Store, create a topic there, and type its name, with no server and no account needed;
    - that the topic name works like a password, because anyone who knows it can read and send these notifications, so the adopter should choose one nobody would guess;
    - the URL route: the full `http://` or `https://` URL of any other endpoint that accepts a POST.
  - **Doc comment.** Its doc comment on `resolvePushDestination` states the rule this function exists to enforce: it is the **only** grammar for this value, and every entry point calls it. That covers the `--push-url` flag, the terminal prompt, this generator, and any later one such as `ROADMAP.md`'s unshipped `notifications set-url`. A second copy of the grammar is two answers to "what may I type here".
  - **`GUIDED_ENDPOINT_EXAMPLE`.** Redefine it as `` `${NTFY_PUBLIC_ORIGIN}/<your-topic>` `` (same value) and keep it exported. `PUSH_DESTINATION_FORMS` may quote it as what a topic becomes.
- [ ] **`writeNotifications` resolves what it is handed.** Update the doc comment of `NotificationsOptions.pushUrl`: it is now "the destination as given — a full URL or an ntfy topic name, resolved here through `resolvePushDestination`". The field name stays, so `init` compiles unchanged.
  - **When the opt-in is taken and `pushUrl` resolves to `unrecognised`,** enqueue nothing. Push one warning saying the destination given is neither of `PUSH_DESTINATION_FORMS`, so nothing was written, and that the value is not repeated because a push destination is a credential. The warning names `--notifications --push-url ${PUSH_DESTINATION_PLACEHOLDER}` and the hand-written-file route. Return `written: false`.
  - **When it resolves to `url` or `ntfy-topic`,** write `destination.url`. The written note says which form was recognised without printing either value, e.g. *"the ntfy topic you gave, as its ntfy.sh address"*.
  - **The blank-answer note and the no-opt-in note** replace `--push-url <url>` and their own descriptions of the value with `--push-url ${PUSH_DESTINATION_PLACEHOLDER}` and `PUSH_DESTINATION_FORMS`.
  - **The `--push-url`-without-`--notifications` warning** does not change.
- [ ] **A shell-safe file, and the header that says so.** `pushEnvContent(url)` writes `HARNESS_PUSH_URL=<url>` unquoted when `url` matches `^[A-Za-z0-9._:/?#@%+=,-]+$`, and single-quoted (`HARNESS_PUSH_URL='<url>'`) otherwise. `~` is deliberately outside the set, because bash tilde-expands it after a `:` in an assignment. The file is a shell fragment `autonomous-notify.sh` sources under `set -a`, so an unquoted `&` or `;` in a query string would break the file or run a command. The grammar has already excluded `'`, so single quotes are always sufficient. Add header lines stating that `HARNESS_PUSH_URL` always holds a full URL, that an ntfy topic is written as `https://ntfy.sh/<topic>`, and that the topic in it is itself the credential. In the module header:
  - extend choice 2 (*"The value is never logged back"*) to cover the topic, and say why the topic is a credential;
  - add a numbered choice for the single grammar and the quoting;
  - state as a finding that `autonomous-notify.sh` needs no change, because the stored value is always a full URL it POSTs verbatim.
- [ ] **`cli/templates/claude/push-notify.env.example`**: rewrite the two comment lines above `HARNESS_PUSH_URL=` to say three things:
  - the value is a full URL of any endpoint that accepts an HTTP POST;
  - for ntfy with no server of your own, install the app, create a topic and write `https://ntfy.sh/<your-topic>` here, where the topic name works like a password;
  - a URL containing shell characters such as `&` must be single-quoted, because the file is sourced.

  Keep the key line `HARNESS_PUSH_URL=` empty. Introduce no `{{…}}` token (the generator renders this file with `assertNoneSurvive` on, `cli/src/generators/claudeContext.ts`). Leave the top of the file untouched.
- [ ] **`cli/test/push-destination.test.mjs`** (new). Its header opens with the rule it enforces: one grammar, and no path prints the value. It imports `resolvePushDestination`, `writeNotifications`, `NTFY_PUBLIC_ORIGIN` and `PUSH_DESTINATION_FORMS` from `../dist/generators/notifications.js`, and `WritePlan` from `../dist/core/writer.js`, the way `cli/test/docs-retrieval-store.test.mjs` imports from `../dist`. Before any call, it sets `process.env.XDG_CONFIG_HOME` to a directory under `os.tmpdir()`. The plan is **never applied**, so nothing is written. It covers:
  - **The grammar table:** a bare topic; `ntfy.sh/<topic>` and `NTFY.SH/<topic>/`; `https://ntfy.sh/<topic>` (kept as `url`, verbatim); `http://127.0.0.1:9/x`; an `https://…?a=1&b=2` URL; surrounding whitespace trimmed; and the unrecognised cases — `''`, `example.com/hook`, `my topic`, a 65-character topic, `ftp://x`, `https://`, and a URL containing `'`.
  - **`writeNotifications` with `enabled: true`:**
    - a topic enqueues a file request whose `content` has `HARNESS_PUSH_URL=https://ntfy.sh/<topic>`;
    - the `&` URL is written single-quoted. That content is written to a file under `os.tmpdir()` and sourced with `execFileSync('bash', ['-c', '. "$1"; printf %s "$HARNESS_PUSH_URL"', 'bash', file])`, a fixed argument vector with no shell string. The output must equal the URL;
    - an unrecognised answer enqueues nothing (`plan.size === 0`) and returns exactly one warning;
    - across every case, no note or warning contains the topic or the URL.
  - **The template:** `cli/templates/claude/push-notify.env.example`, read from the workspace root, names `NTFY_PUBLIC_ORIGIN` and says `http://` / `https://`, so the committed example and the grammar cannot disagree.

  **The compiled CLI against a fixture, in `cli/test/init.test.mjs`.** Add a `TOPIC` constant to the notifications suite. Choose it the way `PUSH_URL` is chosen: unique, matching `NTFY_TOPIC_PATTERN`, and appearing in no fixture path. Add one subtest, **`a topic given through the flag is written as its ntfy.sh address`**. Using the suite's existing `machineHome` helper, it runs `init --notifications --push-url ${TOPIC}` against a throwaway fixture repository with `XDG_CONFIG_HOME` pointed at a scratch directory, the same way the existing cases do. It asserts four things:
  - exit 0;
  - `push.env` holds the line `HARNESS_PUSH_URL=https://ntfy.sh/${TOPIC}`, with the literal written out rather than built from an imported constant;
  - the file is `0600` and its directory is `0700`;
  - neither stdout nor stderr contains `TOPIC`.

  The case passes on this task alone: until Task 3 lands, `init` hands the raw flag value to this generator, which resolves it. Task 3's case 1 extends this subtest rather than re-creating it.

**Verification:**

- `bash scripts/typecheck.sh` and `bash scripts/test.sh` both exit 0, run without a pipe. The existing `cli/test/init.test.mjs` notification cases still pass unchanged. In particular, `^HARNESS_PUSH_URL=https://example.invalid/t0p1c-appears-nowhere-else$` still matches, because that value is in the shell-safe set and stays unquoted.
- `grep -n 'ntfy\|<url>' cli/src/generators/notifications.ts` shows no hand-written description of the accepted answers outside `PUSH_DESTINATION_FORMS`, `GUIDED_ENDPOINT_EXAMPLE` and the module header. Every note uses the shared sentence and placeholder. This guards the story's first `Top risks:` entry.
- The sourcing case in `push-destination.test.mjs` passes. It is the proof that a URL a service really issues, with a `&` in its query string, reaches the notifier intact, and that the delivery side needs no change for it.
- The new `init.test.mjs` subtest passes. It is this task's end-to-end proof: the compiled `init` hands a flag-given topic to this generator, the plan is applied, and the file lands at `0600` in a `0700` directory holding `https://ntfy.sh/<topic>`, with the topic printed nowhere. Task 3 adds the terminal question, the parse-time refusal and the re-run cases on top of it.
