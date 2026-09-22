<!--
This file is named `agent-task.md` and must not be renamed to `prompt.md`. `evals/README.md` states
that the native eval runner discovers its cases at `evals/**/case.yaml` or `evals/**/prompt.md`
alongside `graders/*.md`, so any `prompt.md` under `evals/` is by that pattern a runner case. This is
not one: it is the task text for a hand-run measurement that answers to no runner, driven by
`evals/docs-retrieval/arm-a/run-arm-a.sh` and scored by
`evals/docs-retrieval/arm-a/score-transcript.mjs`. Keeping this name keeps the file off that
discovery glob. Do not resolve the collision the other way by restating or widening the discovery
pattern in `evals/README.md`; that statement has one home.

This file carries exactly ONE substitution token — the placeholder standing alone below the words
"The question:", written as `query` inside doubled braces — and that count is checked. The runner
replaces it and nothing else, so a second doubled brace anywhere here, this comment included, would
be handed to the agent verbatim. Everything in this file is the prompt: the runner substitutes and
sends it whole, comment and all.
-->

You are answering a documentation-retrieval question against the documentation catalog rooted in the
working directory you were started in. That catalog is the only material you may use.

Read `docs/INDEX.md` first. It is the catalog's index and the navigation surface you are given: a
document missing from it is a document you cannot reach. Follow its links to the documents that look
relevant, and read the sections you need.

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
