### Task 1 — Ship `prompt-injection-screen.sh` with its `prescan` verb and its `OUTER_LOOP_SCRIPTS` row

**Goal:** Create the outer-loop script every later task builds on, with its first verb, `prescan`. `prescan` is the deterministic pre-scan of goal 7 plus the SHA-256 the record keys on. Register the script so `init` writes it and the unattended profile allow-lists it in all three forms.

**Where this task stops.** This task owns the script's header, its argument parsing, the `prescan` verb and the hashing helper.
- `plan` is Task 2's.
- `park` and the park writer are Task 3's.
- `verdict` is Task 4's.

Leave the dispatcher's `case` ready for those three verbs. Until they land, it answers each with the usage error.

### Targets

- `cli/templates/scripts/prompt-injection-screen.sh` (new, mode `0755`)
- `cli/src/generators/outerLoopScripts.ts` — one row in `OUTER_LOOP_SCRIPTS`, and the module and `agentInvocable` doc comments that enumerate who runs what.
- `cli/test/init.test.mjs` — `OUTER_LOOP_SCRIPT_FILES`
- `cli/test/prompt-injection-prescan.test.mjs` (new)

**Work:**

- [ ] **`prompt-injection-screen.sh` — header and shell.**
  - Open with `#!/usr/bin/env bash`, `set -u`, the `# prompt-injection-screen.sh — …` header, a `REPRO` block, and a verb-by-verb exit-code contract.
  - Source `lib/harness-run-lib.sh` by the `dirname "${BASH_SOURCE[0]}"` idiom that library's header prescribes. Resolve `stateDir` for `--repo <dir>` through the library (the same reader `autonomous-watcher.sh` → `run_state_dir` uses), never by hand.
  - Floors: bash 3.2, no `jq` needed by this verb, every `mktemp` call passes an explicit template.
  - State in the header:
    - It is a **tripwire, not a boundary**, and grants nothing.
    - It needs no network and is never a `sandbox.excludedCommands` entry.
    - The orchestrating session runs the **main checkout's** copy, because a run copy's copy is sandbox-writable.
- [ ] **`prescan --repo <dir> <repo-relative path>…`.** For each path, print `file <path> sha256 <64 lowercase hex>`, then one `hit <id> <path>:<line> "<excerpt>"` per finding.
  - **Hash.** Use `sha256sum` when it resolves, else `shasum -a 256`. Neither resolving is exit 2.
  - **Ids and byte classes.** Under `LC_ALL=C`, matching UTF-8 byte sequences with `grep -n`:

    | id | What it flags |
    |---|---|
    | `prescan-invisible` | the Tags block U+E0000–E007F (`F3 A0 80 80`–`F3 A0 81 BF`); zero-width U+200B–200D; U+2060; U+FEFF **except** a BOM at byte 0 of the file |
    | `prescan-bidi` | U+202A–202E and U+2066–2069 |
    | `prescan-html-comment` | `<!--` |
    | `prescan-encoded-blob` | a run of ≥120 `[A-Za-z0-9+/]` with optional `=` padding, or ≥128 hex digits |
    | `prescan-marker` | `=== BEGIN UNTRUSTED DATA` or `=== END UNTRUSTED DATA` (`plugin/instructions/untrusted_input.md` → `## The markers`) |

  - **Excerpt.** The hit line, made safe by one internal helper this task adds: newlines and tabs become spaces; invisible bytes become `<invisible>` and bidi bytes `<bidi>`; `<!--` becomes `&lt;!--`; a marker string becomes `[marker removed]`. Cap it at 160 characters with `…`, never splitting a multibyte character. Task 3 reuses this helper for every excerpt it writes.
  - **Exit status.** 0 when no path has a hit, 1 when any does. 2 on bad usage, an unreadable or absent path, or a path resolving outside `--repo`.
- [ ] **`outerLoopScripts.ts`.** Add `{ file: 'prompt-injection-screen.sh', mode: 0o755, agentInvocable: true }` beside the other session-run rows, with a comment:
  - It is run by the orchestrating session.
  - It has no `DENY_SCRIPT_BASENAMES` entry, because it must be reachable.
  - It has no `runsUnsandboxed`, because it needs no network and must stay sandboxed.

  Update the module header's opening list and the `agentInvocable` doc comment's enumeration of session-run scripts to name it. The permission profile, the write-protected paths and the watcher's per-run twin all derive from the row, so nothing else in `cli/src` is edited.
- [ ] **`init.test.mjs`.** Add `'prompt-injection-screen.sh'` to `OUTER_LOOP_SCRIPT_FILES`, the subtraction list that keeps an outer-loop script from being graded as a wrapper.
- [ ] **`prompt-injection-prescan.test.mjs`.**
  - **Header:** it opens with the rule it enforces: every byte class goal 7 names is a hit, and a clean prompt is not.
  - **Fixture:** follow `cli/test/ledger-phases.test.mjs`, which runs `init` in a throwaway fixture and runs the written copy, never the template in place. Write every input file inside the fixture, building the invisible and bidi bytes in code.
  - **Cases:**
    - one case per id above, each asserting the id, the line number and exit 1;
    - a Tags-block character and a zero-width joiner, each on its own line;
    - a leading BOM, which is not a hit, and the same character mid-file, which is;
    - a 64-hex SHA-256 inside prose, which is not a blob;
    - a clean prompt, which is exit 0, prints one `file` line and no `hit`;
    - the printed hash, equal to Node's `createHash('sha256')` over the same bytes;
    - an excerpt carrying `<!--` and a Tags character, printed neutralised;
    - a path outside `--repo`, which is exit 2.

**Verification:**

- `npm test --workspace cli -- test/prompt-injection-prescan.test.mjs` passes. It is this task's own new test file.
- `npm test --workspace cli -- test/init.test.mjs` passes. This task edits that file.
- `bash -n cli/templates/scripts/prompt-injection-screen.sh` exits 0, and `grep -n 'mktemp' cli/templates/scripts/prompt-injection-screen.sh` shows only explicit templates.
- In an `init`-wired fixture, `grep -c 'prompt-injection-screen.sh' .claude/settings.autonomous.json` is non-zero, carrying both allow forms.
