### 11. The two renderers emit typographic punctuation no other prose in the tree uses

**Site.** `evals/docs-retrieval/results.mjs` → `tableSection` (*"the arms’ scores"*) and `provenanceSection` (*"this checkout’s own `docs/`"*, *"the resolved checkout’s `harness.config.json`"*); `evals/docs-retrieval/query-log-pass.mjs` → `signed`, which renders a negative difference with `−` (U+2212 MINUS SIGN) rather than a hyphen.

**The problem.** A grep for `’` over `docs/`, `README.md`, `llms.txt`, `evals/` and `cli/src` returns exactly two files: `evals/docs-retrieval/results.mjs` and the document it generates. Every other prose file in the tree writes the ASCII apostrophe, and `docs/retrieval-eval-results.md` is now the one document that mixes both — its hand-written sections use `'` and its generated region uses `’`, in adjacent paragraphs about the same figures.

No rule in the conventions documents covers Markdown punctuation, so this is consistency rather than a breach: the em dash `—` is used throughout the corpus and is not at issue. What makes it worth a line is that the punctuation is produced by code, so it will be reintroduced on every regeneration, and the U+2212 in `signed` is additionally a character that does not survive a copy into a terminal or a grep written with a hyphen.

**The fix.** Three string edits, no behaviour change:

- [ ] In `evals/docs-retrieval/results.mjs`, replace the three `’` characters with `'` — one in `tableSection`'s comparability sentence, two in `provenanceSection`'s corpus and `layers[]` lines.
- [ ] In `evals/docs-retrieval/query-log-pass.mjs` → `signed`, replace `'−'` with `'-'`.
- [ ] Leave the committed generated region and the rendered query-log section alone: the region has one writer and is rewritten wholesale by the next `--out` run, and hand-editing it for punctuation would be a change inside bytes the runner owns.
