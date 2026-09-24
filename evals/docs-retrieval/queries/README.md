# Docs-retrieval query sets

**Read this when** you are adding a corpus to the docs-retrieval eval, or editing a query set it already has, and you need to know what belongs in this directory and under what name.

This directory holds the labelled query sets the docs-retrieval eval scores its arms against — **one set per corpus, and nothing else**. A set is named `<corpus-id>.jsonl`, and that name is the whole binding between the set and the corpus it labels: `fixture-catalog.jsonl` labels the `fixture-catalog` corpus, `self-docs.jsonl` labels `self-docs`. Adding a corpus means adding a file here under the corpus's own id; renaming a corpus means renaming its set with it.

A corpus **held outside this tree** is named the same way: its id is the one given with `--corpus-id`, its set is committed here under that id, and `docs/retrieval-eval-results.md` identifies the corpus itself by its commit and size, never by a path.

Every set stays parseable as **one JSON object per line** — no blank lines, no array wrapper, no trailing commentary.

The record format — the fields a record carries, what each one means and what the metrics do with each — is stated in `docs/retrieval-eval.md` → `## The query-set format`, and there alone. Do not restate any of it here.

The parse and the labels are checked by machine, by `evals/docs-retrieval/queries.mjs`, not by this file.
