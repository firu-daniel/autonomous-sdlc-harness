### Task 4 — Describe the two answer forms, the refusal and the unchanged delivery side in `docs/`

**Goal:** Every `docs/` section that describes the push destination, its delivery or its precedence should describe the contract Tasks 1–3 built, and none should still describe the old one. That means: the question offers an ntfy topic name as the no-server route beside a full URL for any other service; `--push-url` accepts exactly the same two forms; an answer that is neither is refused by the flag, or re-asked on a terminal and then written nowhere with a warning; the topic name is a credential and is never printed; what is stored is always a full URL; and the delivery script is unchanged.

**Depends on:** Tasks 1, 2 and 3. This is the catch-all task, so it ships last and documents what the `cli` layer built. It changes no code. The facts it writes are these, restated from those tasks so this implementer does not open them:

- The flag is still `--push-url`. Its placeholder is now `<url-or-ntfy-topic>`, and its `--help` summary reads *"Where notifications are posted: an ntfy topic name, or the full URL of any endpoint that accepts a POST (with --notifications)"*.
- **Accepted forms** (`resolvePushDestination`, `cli/src/generators/notifications.ts`):
  - a full `http://` or `https://` URL with a host, containing no whitespace and no `'`, is kept verbatim;
  - a bare ntfy topic, or `ntfy.sh/<topic>`, is written as `https://ntfy.sh/<topic>`, where a topic is letters, digits, `-` and `_`, 1–64 characters;
  - anything else is unrecognised, including a URL without a scheme.
- **Unrecognised through the flag:** `--push-url` exits 1 at flag-parse time, before the git gate, whether or not `--notifications` was given. It writes nothing and does not repeat the value.
- **Unrecognised on a terminal:** the answer is re-asked up to twice (the `askYesNo` bound), with a line that does not repeat it. If it is still unrecognised, nothing is written and a warning goes to stderr.
- **The file:** `HARNESS_PUSH_URL` always holds a full URL. A value with shell characters (for example `&` in a query string) is written single-quoted, because `autonomous-notify.sh` sources the file. The notifier POSTs the value verbatim and needs no change.
- **The credential:** anyone who knows an ntfy topic on the public server can read and send to it, so it is treated like the URL. It appears in no note, warning, refusal or preview. The prompt tells the adopter to choose one nobody would guess.
- **Re-runs:** the machine-local file stays `create-if-absent`. A re-run with a topic, a plain re-run and a refused re-run all leave an existing file byte-identical.

**How this task's implementer reads the conventions.** This is the `"."` layer, so read `.claude/context/conventions.md` (its own rules, and `## Documents of record`) plus `.claude/context/cli.md` → *"Every interactive decision has three parts"*, which the prose must stay consistent with. Two lessons-ledger rules bind this task:
- every command an adopter is meant to run sits in a fenced block, one command per line, never inline;
- an adopter-facing surface is named with the term adopters arrive with ("ntfy topic"), while the wire identifiers (`--push-url`, `HARNESS_PUSH_URL`, `pushEnvPath`) are never renamed.

### Targets

- `docs/cli.md`: §2 flag table `--push-url` row; §2 **Notifications are opt-in, and default to nothing pushed.**; §2 question list item `5. **Push notifications**`; §2 paragraph *"Those three are the preconditions, not the whole of what `init` can refuse"*.
- `docs/watcher.md`: `## 6.` step **2. Configure notifications, or accept getting none.**
- `docs/development.md`: `## 5. Verifying a change`, the hand-run `init --cwd <scratch-gitless> --qa` question-sequence paragraphs.

**Work:**

- [ ] `docs/cli.md` §2 **flag table**, `--push-url` row: spell it `` `--push-url <url-or-ntfy-topic>` `` and state both forms, the topic's written form, and the parse-time refusal that does not repeat the value. Question list item 5: *"`--notifications`, with `--push-url` for the ntfy topic or endpoint URL; default off"*. **Refusal paragraph:** add the unrecognised `--push-url` beside `--qa-driver`'s parser check as a refusal raised before the git gate.
- [ ] `docs/cli.md` §2 **Notifications are opt-in** paragraph. Keep everything still true: the opt-in, the default, the no-endpoint rule and its shadowing reason, `0600` / `0700`, and create-if-absent. Add:
  - the question offers the ntfy app route (App Store / Play Store, create a topic, type its name; no server, no account) as a suggestion beside any other service's full URL;
  - the flag accepts the same two forms, so the prompt and the flag cannot disagree;
  - what happens to an unrecognised answer on each path;
  - the topic is a credential, and why;
  - what is stored is always a full URL, single-quoted where the shell requires it;
  - `docs/watcher.md` §6 for delivery, which is unchanged.

  Put any full command an adopter is meant to run, such as `npx autonomous-sdlc-harness init --notifications --push-url <url-or-ntfy-topic>`, in a fenced block.
- [ ] `docs/watcher.md` §6 step 2: rewrite the sentence *"`init --notifications --push-url <url>` writes it for you"* so it names both answer forms. Move the command into a fenced block on its own line. For the hand-written route, add that the file takes a full URL: an ntfy topic is written `https://ntfy.sh/<your-topic>`, and a URL containing shell characters is single-quoted because the file is sourced. State once that the notifier itself is unchanged by the topic route, because what it reads is always a URL. Keep the precedence sentence and the machine-local-first reasoning exactly as they are.
- [ ] `docs/development.md` §5, the hand-run question sequence: replace *"then `y`, and an endpoint"*. To the endpoint question, first answer `not a destination`: the question is put again, and the typed value is not printed back by the run. Then answer with a bare topic name. Extend the expected outcome paragraph: `push.env` holds `HARNESS_PUSH_URL=https://ntfy.sh/<the topic>`, and the topic appears nowhere in what the run itself prints. Keep the existing sentence that the terminal echoing your own typing is the terminal, not the run. Say this is the only place the terminal re-ask is exercised, because the subprocess suite hands `init` a pipe. The `--non-interactive` paragraph's *"`--notifications --push-url` for delivery"* stays as it is (register row 13).

**Verification:**

- Re-run the story index's `## Scope register` command entry verbatim: `git grep -l -i -E 'ntfy|push-url|--notifications|HARNESS_PUSH_URL|push\.env' -- . ':!cli/src' ':!cli/test' ':!harness-runs'`. Its output must be ⊆ the register's rows, with no hit outside the register.
- `git grep -n 'push-url <url>' -- docs` returns no hit: no doc still describes the old placeholder.
- Every flag, placeholder, key name and path written here matches the source. Check that the flag-and-placeholder cell of `docs/cli.md`'s `--push-url` row is spelled exactly as `node cli/dist/cli.js init --help` prints it after `npm run build`.
- Every full command an adopter is meant to run in the edited paragraphs sits in a fenced block (lessons ledger, *Adopter-facing documentation*).
