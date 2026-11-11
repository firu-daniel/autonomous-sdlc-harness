### Task 22 — Respell `docs/development.md`, the gate contracts included

**Goal:** The contributor's document of record names the product `devscene` / DevScene throughout. Its gate contracts state exactly what the renamed gates enforce, and its measured records say plainly that they were taken under the earlier name. Apply the spelling table and the measured-records rule in the story index's `## Context`.

**Depends on:** these tasks, whose values the contracts quote byte for byte:

- Task 15: the release tag `devscene--v<version>` with message `devscene <version>`, the published package `devscene`, and `publish-main.sh`'s strip of the `# >>> devscene ` block.
- Task 16: gate 6d's rule, every slash spelling of a shipped command written `/devscene:<name>`, and its finding text `bare command spelling; write /devscene:<name>`.
- Task 19: gate 6c's contract, first line exactly `# DevScene`, and link targets under `https://github.com/firu-daniel/devscene/blob/main/` or `…/tree/main/`.
- Tasks 11 and 14: the plugin and marketplace name `devscene`, `devscene@devscene`, and `firu-daniel/devscene`. Task 11 also adds `plugin/.claude-plugin/plugin.json` → `"displayName": "DevScene"`; this task records in `## 3.` that the field is present and that gate `1` is what grades it. It records no validator result: gate `1` runs in the Run gates round, after this task lands.

**Where this task stops.** Every heading keeps its text, so `## 5. Verifying a change`, `## 6. The roadmap this tree defers to` and the rest stay valid citation anchors. The paragraph opening **A third debt belongs to no row at all, and it is paid:** keeps that opening byte-identical: `scripts/check-command-spelling.sh` exempts it by that substring, and `README.md` / `ARCHITECTURE.md` cite it by that phrase. Gate 8's fenced `/harness-analyze --dry-run` / `/harness-analyze` lines carry no product name and stay byte-identical, because gate 6d exempts them as whole lines. No date, version, run id, count or verbatim wording other than the name changes in any record. The one addition beyond the name is the `displayName` sentence in `## 3.` (Work bullet 2), which is new text appended to a rule paragraph, not an edit to a measured record.

### Targets

- `docs/development.md`

**Work:**

- [ ] Add the story index's measured-records disclosure sentence once, directly under the document's opening statement of what it is and who reads it, ahead of `## 1.`.
- [ ] `## 1.` – `## 4.` and `## 7.` – `## 8.`: respell every `npx autonomous-sdlc-harness …`, `/autonomous-sdlc-harness:<command>`, `autonomous-sdlc-harness@autonomous-sdlc-harness`, `firu-daniel/autonomous-sdlc-harness`, release-tag shape and machine path. That includes the `claude -p --plugin-dir … --settings '{"enabledPlugins":{"devscene@devscene":false}}' …` line in `## 3.`, the install block, and `## 7. Releasing`'s tag and package names. In `## 3. Manifest facts a contributor must not rediscover`, append one sentence to the closing paragraph that opens *"More generally, `--strict` promotes unknown fields …"*, recording Task 11's new field and claiming only what is true when it is written, in substance: *"`plugin/.claude-plugin/plugin.json` carries `displayName`, added when the product was renamed DevScene; gate `1` (`claude plugin validate --strict plugin`) is what establishes that the validator accepts it."* Cite no manifest-reference URL and no check date: the task prompt records no check of `displayName`, and gate `1` has not run when this task lands. Only if the implementer actually checks the plugin manifest reference while doing this task may the sentence cite that reference, with the date of that check. Add it as a sentence, not a new bullet, so the section's opening count *"Six measured behaviours and one shipped contract"* stays true and unchanged.
- [ ] `## 5. Verifying a change` → gate 6: restate the spelling rule as `/devscene:<name>`; respell 6c's contract to the values above; respell 6d's finding text. The rest of `## 5.`: respell every remaining occurrence, including the gate-12 round records' plugin-cache paths (`…/plugins/cache/devscene/devscene/<version>`) and `npx devscene@<version> init` commands.
- [ ] `## 6.` → the debt paragraph's measurement records: respell the plugin name and the `…:branch-start-plan-autonomous` / `…:harness-analyze` spellings inside its quoted measurements. Its existing sentence about the former slug `harness` stays as it is. Keep the opening phrase byte-identical.
- [ ] Re-read every changed record sentence against `git show HEAD:docs/development.md`. Each must differ from `HEAD` only in the product name.

**Verification:**

- `git grep -n -F 'autonomous-sdlc-harness' -- docs/development.md` prints nothing.
- `git grep -n -F 'Measurements recorded in this document before the product was renamed DevScene' -- docs/development.md` prints exactly one line.
- `git grep -n -F '**A third debt belongs to no row at all, and it is paid:**' -- docs/development.md` prints exactly one line, and `git grep -n -x -e '/harness-analyze --dry-run' -e '/harness-analyze' -- docs/development.md` prints the same lines as at `HEAD`.
- `git diff -U0 -- docs/development.md` shows no changed line starting with `#`.
- `git grep -n -F 'displayName' -- docs/development.md` prints at least one line, and every line it prints sits in `## 3.`'s closing *"More generally, `--strict` promotes unknown fields …"* paragraph.
