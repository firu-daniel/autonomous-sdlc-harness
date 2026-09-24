<!--
This file is the A-search task text: what `evals/docs-retrieval/arm-a/run-arm-a.sh --variant search`
sends, where the A-index variant sends `agent-task.md`. It must not be renamed to `prompt.md`, for the
reason `agent-task.md`'s own opening comment gives. Outside this comment and the paragraph that tells
the agent how to navigate, every line is byte-identical to `agent-task.md`, so the two variants differ
in that instruction alone.

This file carries exactly ONE substitution token — the placeholder standing alone below the words
"The question:", written as `query` inside doubled braces — and names no index, so it carries no
`index` token; both counts are checked before any agent call. The runner replaces that token and
nothing else, so any other doubled brace anywhere here, this comment included, would be handed to the
agent verbatim. Everything in this file is the prompt: the runner substitutes and sends it whole,
comment and all.
-->

You are answering a documentation-retrieval question against the documentation catalog rooted in the
working directory you were started in. That catalog is the only material you may use.

The catalog is the set of Markdown documents under that working directory. No index is given: find
the sections that answer the question yourself, with your read-only tools — search the documents, list
them, and read the sections you need.

The question:

{{query}}

Answer with **nothing but section references**, one per line, most useful first, at most five. Write
no prose, no preamble, no numbering and no explanation — a line that is not a reference invalidates
the answer. Do not wrap the answer in a code fence. The blocks below show what one reference and the
no-answer word look like; your own answer is bare lines with no `` ``` `` around them, because a
fence line is scored as a reference and misses.

A reference is written `path#anchor`:

- `path` is **repo-relative** — relative to the working directory you were started in, not to the
  document you found the section in.
- `anchor` is the **GitHub slug** of the section's heading: lower-cased, spaces replaced with
  hyphens, punctuation dropped.
- Omit `#anchor`, leaving `path` alone, when what answers the question is a document's opening text
  above its first sub-heading.

Worked example: the heading `## Signature verification` in the file `docs/webhooks.md` is written

```
docs/webhooks.md#signature-verification
```

If the catalog holds no section that answers the question, answer with the single word

```
none
```

and nothing else. A wrong reference and a guessed reference both score as misses, so `none` is the
correct answer whenever the catalog does not cover the question. Answer it as the bare word on its
own line, with nothing else — not inside a fence.
