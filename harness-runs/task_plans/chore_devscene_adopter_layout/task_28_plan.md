### Task 28 — Respell `docs/cli.md`, `docs/analyze.md` and the rest of `docs/config.md`, and drop the split-default prose

**Goal:** Make the CLI reference, the configuration reference and the analyze command's decisions of record describe the renamed config file, the one `scriptsDir` default `devscene-scripts`, the `devscene/` state-directory default, the offer file and marker, the two hidden markers, `/devscene:analyze` and the systemd unit `devscene-watcher@<slug>.service`.

**Depends on:**
- Task 1: one `scriptsDir` value and no absent-key warning.
- Task 15: the schema's `default` values `devscene/` and `devscene-scripts`.
- Task 36, which already stated those defaults in `docs/config.md` §3's default sentence and §5's `stateDir` and `scriptsDir` rows. `docs/config.md` §5 is the fourth place of the configuration contract (`.claude/context/conventions.md` → `### The order files are created…`, item 1), so it landed right after the schema and the model. This task leaves those three places as Task 36 wrote them.

**Where this task stops.** No sentence names an old value or says a name changed. A fenced command block stays fenced, one command per line. `docs/cli.md`'s paragraph about the absent-`scriptsDir` warning is deleted, together with the fenced `config set scriptsDir scripts` remedy under it. Nothing replaces them, because the behaviour no longer exists (task prompt, goal 2).

### Targets

- `docs/cli.md`, `docs/analyze.md`
- `docs/config.md`, except §3's default sentence and §5's `stateDir` and `scriptsDir` rows (Task 36's)

**Work:**

- [ ] `docs/config.md`: apply rows 1–3 of `## Context`'s spelling table everywhere outside the three places Task 36 owns (§3's default sentence, §5's `stateDir` and `scriptsDir` rows).
- [ ] `docs/cli.md`: delete the bullet that opens *"**`config` fails on a structural error, and an absent `scriptsDir` is a warning**"* and its fenced remedy. Rewrite any other sentence that explains `scripts` versus `harness-scripts` so it states the one value. Apply rows 1–6, 8 and 9 everywhere: `devscene.config.json`, `devscene-scripts/`, `.claude/devscene-task-offer.md`, `.claude/devscene-no-offer`, `/devscene:analyze`, `devscene-watcher@<slug>.service`, `<!-- devscene:unfilled -->`, `<!-- devscene:setup-pending -->`.
- [ ] `docs/analyze.md`: apply rows 1, 6 and 9 everywhere.

**Verification:**

- `git grep -nE 'harness\.config|sdlc-harness|harness-scripts|harness-task-offer|harness-no-offer|harness-analyze|harness-watcher@|harness:unfilled|harness:setup-pending|absent `scriptsDir`|An absent key means `scripts`|before 0\.6\.6' -- docs/cli.md docs/config.md docs/analyze.md` prints nothing.
- `git diff -- docs/config.md` leaves §3's default sentence and §5's `stateDir` and `scriptsDir` rows exactly as Task 36 committed them.
