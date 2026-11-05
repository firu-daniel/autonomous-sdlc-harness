# Review — qa-tester-mobile-maestro
verdict: PASS

Checked: every `wc -w` figure and section count (all exact: 1 183 / 7 201 / 1 337; sections 84, 42, 74, 82, 123, 26, 30, 130, 164, 227, 200); dispatch greps; 14 citations; and literal greps over `cli/src`, `cli/test`, `cli/templates`, `plugin/hooks`, `plugin/`.

## Must Fix

None.

## Should Fix

1. **"Capability source" misstates what the plan writer and reviewer read the stub for.** Report `:19` and `:47` say `## What this variant would drive` is their "capability source". The text says the opposite. `plugin/agents/ui-tests-plan-writer.md:105` and `plugin/agents/ui-tests-plan-reviewer.md:143` both say that the mobile variants "state no capability set", and that the only admissible annotation under them is `n/a (<qa_driver> variant declares no capability set)`. So they read the stub to confirm that no capability set exists. They do not draw from it. The real thinning constraint is different from the one the report gives: the trimmed "would drive" bullets must not start to read as a capability set, because that would invalidate the `n/a` marker both files grade against, and the file must keep stating "declared, not implemented". Fix: reword `:19`, `:47` and the `## What this variant would drive` row of the thinning plan (`:92`). Add the `n/a`-marker dependency to `## Risks and costs`. The "keep the bullets" conclusion stands.
2. **The read is up front, but the report does not say so plainly.** Both secondary readers list the stub under `## Read first` (`ui-tests-plan-writer.md:73`/`:84`, `ui-tests-plan-reviewer.md:56`/`:64`), and an unreadable variant file is a `blocker:` (`:87`, `:71`). The claim that they "also save about 750 words each" (`:107`) is correct for that reason. State that this is an up-front read under `## Read first` that blocks when the file is missing, so the stub must keep its path and stay readable even if open question 1 (cut the runtime agent) is pursued.
3. **The sweep-grep phrase in the thinned description is not addressed.** `cli/src/config/model.ts:462-466` names "that driver's `plugin/agents/qa-tester-mobile-*.md` stub" as a load-bearing hit for `declared-not-implemented|declared but not implemented|not implemented in this release`. The proposed description "declared, not implemented — returns a blocker" (`:87`) matches none of the three patterns. The error literal still matches, so the stub stays a hit. Fix: note in the `cli/src/config/model.ts` risk row (`:123`) that the description's phrase drops out of the sweep, or keep "declared but not implemented" in the description.

4. **The "after" total does not match its own parts.** The thinning-plan rows (`:87-94`) sum to 468 (55 + 110 + 26 + 12 + 0 + 130 + 75 + 60), not the ~430 stated at `:83`, `:102` and `:104`, a gap of about 9 %. The constraint still holds by a wide margin (468 < 1 183, and 503 with the S1/S2 template). Fix: restate the totals as ~470 (−715, −60 %), or show the extra trims that reach 430.

## Nice to Have

- `:52`: the stub `diff` also differs at `:8`, `:12`, `:17` and `:28`, where the variant name is substituted (`diff` hunks `2,3c`, `8c`, `12c`, `14c`, `17c`, `28c`, `36,37c`, `39a40,47`, `42c`, `51c`). "Differ only at :3, :14, :36-37, the closure text and :51" understates this. Reword to "differ only in variant names, `:14`, `:36-37`, the closure text and `:51`".
- `:41`: the phase gate is not "copied word for word" from `qa-tester.md:12`. It is near-verbatim ("no reason to open a browser" versus "nothing to drive"). Say "near-verbatim".
- `plugin/agents/README.txt:25-31` and `ARCHITECTURE.md:193` describe the stub's parts: frontmatter, allowlist, "what it would drive", and the pointer to `qa-tester.md`. The thinning keeps all four. Mention them as descriptive readers so the rewrite keeps them true, alongside `context/plugin.md:47`.
- `:113`: `cli/src/config/model.ts:460-470` is accurate, but the grep phrase itself is at `:463`.

## Verified claims (no change needed)

- **No shipped flow dispatches the stub.** CONFIRMED: `grep -rn "qa-tester-mobile-maestro\|mobile-maestro" plugin/instructions plugin/commands` returns nothing. Phase E dispatches `qa-tester` (`plan_orchestration_instructions_core.md:135`, `:415`), as do `qa_test_instructions.md:75` and the user-review QA step (`user_review_fixes_instructions_core.md:70-71`). `branch-qa-test.md:9` refuses non-`web-playwright` drivers. `qa-tester.md:14` returns a terminal `error:` ("not a routing hop").
- **Byte-identical literals.**
  - The error literal (`:17`) is quoted nowhere else byte for byte. Its driver phrase is mirrored in `qa-tester.md:204` and the "Tests blocked" shape comes from `qa-tester.md:196`. The thinning keeps the literal verbatim.
  - No `cli/test` file reads the stub's prose. `mobile-maestro` appears only as a config value (`doctor.test.mjs:155`, `init.test.mjs:138`, `profile.test.mjs:116`, `config-command.test.mjs:255`). The `/declared but not implemented/` assertions at `init.test.mjs:1598`/`:1633` test `cli/src/generators/harnessConfig.ts:623` output, not the stub.
  - Nothing in `plugin/hooks` or `cli/templates` references the stub.
- **PASS writes nothing.** `qa-tester.md:161-168` reads "Write nothing. Return exactly: `verdict: PASS`". Inline-on-PASS for the future variant is correctly grounded.
- **Tools and contracts.** `tools: Read` (`:4`); "write **no** files" (`:10`, `:12`, `:14`). `context/plugin.md:47` says that stubs carry no Invocation/Output contract.
- **Index namespace.** `<qa_review_findings_dir>` + `iteration` + `t<T>` with a round suffix is confirmed at `plan_orchestration_instructions_core.md:96-99` and `qa_test_instructions.md:27`.

## Bug claims

The report names no pre-existing bug. Open question 3 (the UI-test plan is written and reviewed under a mobile driver that Phase E can only block) is a design question, not a bug claim. It is consistent with `ui-tests-plan-writer.md:105`, which requires the plan with `n/a` markers under such drivers.
