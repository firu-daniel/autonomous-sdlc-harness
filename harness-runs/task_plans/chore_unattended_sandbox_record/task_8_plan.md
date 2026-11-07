### Task 8 — Register the document in `README.md` → `## Where to read more` and in `llms.txt`

**Goal:** Make `docs/sandbox-record.md` findable from the two indexes this repository keeps: one bullet in `README.md` → `## Where to read more` and one in `llms.txt` → `## Where to read more`, each in its file's existing style.

**Depends on:** Task 7, by which point `docs/sandbox-record.md` is complete. It holds the model, the commands outside the sandbox, the domain list, the measured results per leg, the Linux runner's PID-namespace and no-new-privileges results, the residuals and the follow-ups. Task 3 created it and Tasks 4, 5 and 7 filled it. This task describes it and changes nothing inside it.

### Targets

- `README.md`: `## Where to read more`.
- `llms.txt`: `## Where to read more`.

**Work:**

- [ ] `README.md`: add one bullet directly after the `docs/sandbox-verification.md` bullet, in that list's form: `` [`docs/sandbox-record.md`](docs/sandbox-record.md) — `` followed by a description. The description says it is the unattended sandbox's document of record: what the sandbox contains and leaves out, what runs outside it and why, what an allowed domain still permits, the measured results per leg, and the residuals, each citing its evidence row.
- [ ] `llms.txt`: add one bullet directly after the `docs/sandbox-verification.md` bullet, in that file's form. The link target is `https://github.com/firu-daniel/autonomous-sdlc-harness/blob/main/docs/sandbox-record.md`, with no fragment and no query, followed by `: ` and a one-sentence description matching the README's.

**Verification:**

- Both new links name a tracked file under `docs/`, which `scripts/publish-main.sh`'s `removed_paths` does not remove. `llms.txt`'s link is the `blob/main/` form, with no `#` or `?`.
- Each description matches what `docs/sandbox-record.md`'s headings actually hold. Read them with `grep -n "^## " docs/sandbox-record.md`.
