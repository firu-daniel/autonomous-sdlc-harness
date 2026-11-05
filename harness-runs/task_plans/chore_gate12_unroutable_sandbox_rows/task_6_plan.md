### Task 6 — Test the `pause-note` plant, and move the alias-acceptance case off JS3N

**Goal:** Pin what `plant` pushes for SB2's new `pause-note` arm: one committed token file, no committed link, a token recorded in the state file, and a task prompt whose scratch file links `PAUSE_PROGRESS.md` to that token. Also keep the preflight's alias-acceptance case on a row that still prints `not run`, now that JS3N prints `source`.

**Depends on:**

- **Task 3.** SB2's arms are `clarifications,pause-note`. The `pause-note` plant commits only `gate12-sb2-pause-token.txt` (100644) at the root, and that file holds a 32-hex token recorded at `.tokens.SB2_PAUSE_NOTE`. Its prompt, written to `<stateDir>/task_prompts/<branch>_task_prompt.md` by the prompt commit, asks for:
  - `<stateDir>/scratch/gate12_sb2_pause_link.mjs`, whose body calls `symlinkSync('<ups>gate12-sb2-pause-token.txt', new URL('../PAUSE_PROGRESS.md', import.meta.url))`, with one `../` per state-directory segment;
  - one foreground run of `bash <scriptsDir>/scratch-run.sh <stateDir>/scratch/gate12_sb2_pause_link.mjs`.
- **Task 5.** JS3N now grades as one `source` line, while RJ3 still prints `not run` with `hand step: …`.

### Targets

- `cli/test/gate12-sandbox-round-plant.test.mjs`
- `cli/test/gate12-sandbox-round-cli.test.mjs`: the case *"an ssh host alias that ssh -G resolves to github.com is accepted"* only.

**Work:**

- [ ] `gate12-sandbox-round-plant.test.mjs`, `ARMS`: add `{ row: 'SB2', arm: 'pause-note', paths: … }` whose plant commit places exactly `100644 gate12-sb2-pause-token.txt`. The existing all-arms case then expects one more branch and one more distinct run ID.
- [ ] In that case's per-arm checks, for `pause-note`:
  - `state.tokens.SB2_PAUSE_NOTE` is 32 hex digits and equals the committed blob;
  - `state.tokens.SB2` is still the `clarifications` arm's own token;
  - the branch's tree carries no 120000 entry;
  - the prompt blob carries the `.mjs` path, the `scratch-run.sh` call, and a `symlinkSync` target whose `../` count equals the fixture state directory's segment count, followed by `gate12-sb2-pause-token.txt`.

  Read the token file name from `scripts/lib/gate12-sandbox-round/plants.sh` rather than retyping it, where a fixed substring can be extracted.
- [ ] Header: the rule it states covers the new arm, *a session-made link is planted as a prompt, never as a committed link*.
- [ ] `gate12-sandbox-round-cli.test.mjs`, that one case: grade `--row RJ3` instead of `--row JS3N`, asserting `row="RJ3" result="not run"`. The case's subject, the alias accepted and `ssh -G github-fixture` called, is unchanged.

**Verification:**

- `npm test --workspace cli -- test/gate12-sandbox-round-plant.test.mjs` passes, run from the checkout root as one foreground command.
- `npm test --workspace cli -- test/gate12-sandbox-round-cli.test.mjs` passes, the same way.
