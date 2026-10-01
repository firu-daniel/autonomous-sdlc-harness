"""The rule this file exists to enforce, quoted from `cli/src/retrieval/chunk.ts`: a chunk's
identity is its path and heading anchor, and its change signal is the hash of its text.

Expectations are hand-written from reading `chunk.ts` and the `guide` document
`cli/test/docs-retrieval.test.mjs` builds; Task 4 compares against the running TypeScript.
"""

import hashlib

from harness_docs_retrieval.chunk import chunk_markdown, heading_slug

FENCE = "```"


def _guide(usage_body: str) -> str:
    return "\n".join(
        [
            "# Guide",
            "Intro paragraph about the guide.",
            "## Setup",
            "Install the tool. A fence follows.",
            FENCE,
            "## not a heading",
            FENCE,
            "### Offline",
            "Work without a network.",
            "## Usage",
            usage_body,
            "## Setup",
            "A second setup section.",
            "",
        ]
    )


GUIDE = _guide("Run the tool against a repository.")


def test_guide_keys_follow_headings_outside_the_fence() -> None:
    keys = [chunk.key for chunk in chunk_markdown("docs/guide.md", GUIDE)]
    assert keys == [
        "docs/guide.md",
        "docs/guide.md#setup",
        "docs/guide.md#offline",
        "docs/guide.md#usage",
        "docs/guide.md#setup-1",
    ]


def test_the_preamble_keys_as_the_path_and_its_text_drops_the_title_line() -> None:
    preamble = chunk_markdown("docs/guide.md", GUIDE)[0]
    assert preamble.anchor == ""
    assert preamble.heading == ""
    assert preamble.body == "Intro paragraph about the guide."
    assert preamble.text == "Guide\nGuide\n\nIntro paragraph about the guide."


def test_a_child_heading_path_spells_its_parent() -> None:
    offline = next(c for c in chunk_markdown("docs/guide.md", GUIDE) if c.anchor == "offline")
    assert offline.heading == "Offline"
    assert offline.text == "Guide\nGuide > ## Setup > ### Offline\n\nWork without a network."


def test_the_fenced_heading_stays_in_its_section_body() -> None:
    setup = chunk_markdown("docs/guide.md", GUIDE)[1]
    assert setup.body == "Install the tool. A fence follows.\n```\n## not a heading\n```"


def test_a_bodiless_wrapper_is_folded_and_an_empty_childless_heading_is_kept() -> None:
    markdown = "# T\n## Wrapper\n\n### Child\nChild body.\n## Empty\n## Last\nLast body.\n"
    chunks = chunk_markdown("a.md", markdown)
    assert [c.key for c in chunks] == ["a.md#child", "a.md#empty", "a.md#last"]
    assert chunks[0].text == "T\nT > ## Wrapper > ### Child\n\nChild body."
    assert chunks[1].body == ""
    assert chunks[1].text == "T\nT > ## Empty\n\n"


def test_an_orphan_child_heading_path_names_no_parent() -> None:
    chunks = chunk_markdown("a.md", "# T\n### Orphan\nBody.\n")
    assert [c.text for c in chunks] == ["T\nT > ### Orphan\n\nBody."]


def test_a_title_only_preamble_is_not_emitted() -> None:
    chunks = chunk_markdown("a.md", "# Title\n\n## Only\nBody.\n")
    assert [c.key for c in chunks] == ["a.md#only"]


def test_a_document_with_no_title_takes_its_basename() -> None:
    chunks = chunk_markdown("docs/sub/notes.md", "Loose line.\n## Part\nBody.\n")
    assert chunks[0].key == "docs/sub/notes.md"
    assert chunks[0].text == "notes.md\nnotes.md\n\nLoose line."
    assert chunks[1].text == "notes.md\nnotes.md > ## Part\n\nBody."


def test_backticks_and_punctuation_vanish_from_a_slug() -> None:
    assert heading_slug("The `k` clamp: why?", {}) == "the-k-clamp-why"
    assert heading_slug("Ünïcode_ok-1 (v2)", {}) == "ünïcode_ok-1-v2"


def test_a_repeat_skips_a_suffixed_form_a_literal_heading_took() -> None:
    seen: dict[str, int] = {}
    assert [heading_slug(text, seen) for text in ["A", "A-1", "A", "A"]] == [
        "a",
        "a-1",
        "a-2",
        "a-3",
    ]


def test_crlf_and_lf_yield_identical_keys_and_hashes() -> None:
    lf = chunk_markdown("docs/guide.md", GUIDE)
    crlf = chunk_markdown("docs/guide.md", GUIDE.replace("\n", "\r\n"))
    assert [(c.key, c.hash) for c in crlf] == [(c.key, c.hash) for c in lf]


def test_the_hash_is_sha256_of_the_text() -> None:
    for chunk in chunk_markdown("docs/guide.md", GUIDE):
        assert chunk.hash == hashlib.sha256(chunk.text.encode("utf-8")).hexdigest()
