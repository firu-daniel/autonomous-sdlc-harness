"""Splitting one Markdown document into chunks; a port of `cli/src/retrieval/chunk.ts`.

The rule this module exists to enforce, quoted from `chunk.ts`'s header: a chunk's identity is its
path and heading anchor, and its change signal is the hash of its text. A refresh re-embeds only the
chunks whose hash moved, so a key that shifted with an unrelated edit, or a hash over anything but
the embedded text, would turn every refresh into a full rebuild or miss a change.

A chunk starts at every `## ` or `### ` line outside a fenced code block, with two exceptions: a
`##` section with no body of its own that has at least one `###` child is folded into those
children, and content before the first heading becomes the preamble chunk only when something but
the title line is in it. A `###` section is otherwise its own chunk and is never folded into its
parent `##`.

Lines, regexes and whitespace follow JavaScript, not Python: `.` excludes U+2028/U+2029, `$` is end
of input, and `trim()` is `js_trim`.
"""

import hashlib
import posixpath
import re
import unicodedata
from dataclasses import dataclass, field

from harness_docs_retrieval.jscompat import js_trim


@dataclass(frozen=True)
class DocChunk:
    """One section of one corpus document; field names are `chunk.ts`'s `DocChunk`, unchanged."""

    # `{path}#{anchor}`, or `path` alone for the preamble.
    key: str
    path: str
    # `""` for the preamble.
    anchor: str
    # The heading text as written, `""` for the preamble.
    heading: str
    # The title, the heading path, a blank line, the body: what is embedded and BM25-indexed.
    text: str
    body: str
    # sha256 hex of `text` as Node encodes it to UTF-8.
    hash: str


_LINE_BREAK = re.compile(r"\r?\n")
_ATX_HEADING = re.compile(r"(#{1,6})[ \t]+([^\n\r\u2028\u2029]*?)(?:[ \t]+#+)?[ \t]*\Z")
_FENCE_OPEN = re.compile(r" {0,3}(`{3,}|~{3,})")


def heading_slug(text: str, seen: dict[str, int]) -> str:
    """`headingSlug`: GitHub's heading slug, distinct within one file through `seen`.

    Keeps a code point whose Unicode category is a letter or a number (`\\p{L}` / `\\p{N}`), a
    space, `_` or `-`, then turns each space into `-`. A repeat takes `-1`, `-2`, … skipping any
    suffixed form a literal heading already took.
    """
    base = "".join(
        ch for ch in text.lower() if ch in " _-" or unicodedata.category(ch)[0] in ("L", "N")
    ).replace(" ", "-")
    slug = base
    if base in seen:
        n = seen.get(base, 0)
        while True:
            n += 1
            slug = f"{base}-{n}"
            if slug not in seen:
                break
        seen[base] = n
    seen[slug] = 0
    return slug


@dataclass
class _Section:
    level: int
    heading: str
    anchor: str
    lines: list[str] = field(default_factory=list)


def _join_body(lines: list[str]) -> str:
    """`joinBody`: trims blank lines from both ends and joins the rest."""
    start = next((i for i, line in enumerate(lines) if js_trim(line) != ""), -1)
    if start == -1:
        return ""
    end = len(lines)
    while js_trim(lines[end - 1]) == "":
        end -= 1
    return "\n".join(lines[start:end])


def _make_chunk(
    path: str, anchor: str | None, heading: str, heading_path: str, title: str, body: str
) -> DocChunk:
    """`makeChunk`: `anchor` is `None` for the preamble alone, so an empty slug still keys `path#`."""
    text = f"{title}\n{heading_path}\n\n{body}"
    # Node's `Hash.update(string)` writes each lone surrogate as U+FFFD; the UTF-16 round trip does
    # the same and keeps a surrogate pair whole, where `errors="replace"` on UTF-8 would write `?`.
    node_text = text.encode("utf-16-be", "surrogatepass").decode("utf-16-be", "replace")
    return DocChunk(
        key=path if anchor is None else f"{path}#{anchor}",
        path=path,
        anchor="" if anchor is None else anchor,
        heading=heading,
        text=text,
        body=body,
        hash=hashlib.sha256(node_text.encode("utf-8")).hexdigest(),
    )


def chunk_markdown(path: str, markdown: str) -> list[DocChunk]:
    """`chunkMarkdown`: splits `markdown`, read from the repo-relative `path`, in document order.

    Every ATX heading outside a fence, at any level, consumes a slug; `##` and `###` start a chunk.
    The title is the first `# ` line outside a fence, falling back to the file's basename.
    """
    lines = _LINE_BREAK.split(markdown)
    seen: dict[str, int] = {}
    current = _Section(level=0, heading="", anchor="")
    sections = [current]
    title: str | None = None
    title_line_in_preamble = -1
    fence: tuple[str, int] | None = None

    for line in lines:
        if fence is not None:
            trimmed = js_trim(line)
            fence_char, fence_length = fence
            if len(trimmed) >= fence_length and trimmed == fence_char * len(trimmed):
                fence = None
            current.lines.append(line)
            continue
        opened = _FENCE_OPEN.match(line)
        if opened is not None:
            marker = opened.group(1)
            # A backtick fence's info string may not contain a backtick; such a line is not a fence.
            rest = line[line.index(marker) + len(marker) :]
            if not (marker.startswith("`") and "`" in rest):
                fence = (marker[0], len(marker))
            current.lines.append(line)
            continue
        heading = _ATX_HEADING.match(line)
        if heading is None:
            current.lines.append(line)
            continue
        level = len(heading.group(1))
        text = heading.group(2)
        anchor = heading_slug(text, seen)
        if level in (2, 3):
            current = _Section(level=level, heading=text, anchor=anchor)
            sections.append(current)
            continue
        if level == 1 and title is None:
            title = text
            if len(sections) == 1:
                title_line_in_preamble = len(current.lines)
        current.lines.append(line)

    resolved_title = title if title is not None else posixpath.basename(path)
    chunks: list[DocChunk] = []
    parent: str | None = None
    for index, section in enumerate(sections):
        if section.level == 0:
            own = [line for i, line in enumerate(section.lines) if i != title_line_in_preamble]
            body = _join_body(own)
            if body != "":
                chunks.append(_make_chunk(path, None, "", resolved_title, resolved_title, body))
            continue
        body = _join_body(section.lines)
        if section.level == 2:
            parent = f"## {section.heading}"
            heading_path = f"{resolved_title} > {parent}"
            # A bodiless `##` wrapper over a `###` is folded: each child spells the parent into its
            # heading path. An empty `##` or `###` with no child is still emitted, because its words
            # survive nowhere else in the index.
            if body == "" and index + 1 < len(sections) and sections[index + 1].level == 3:
                continue
        elif parent is None:
            heading_path = f"{resolved_title} > ### {section.heading}"
        else:
            heading_path = f"{resolved_title} > {parent} > ### {section.heading}"
        chunks.append(
            _make_chunk(path, section.anchor, section.heading, heading_path, resolved_title, body)
        )
    return chunks
