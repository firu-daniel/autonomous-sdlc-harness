/**
 * Splitting one Markdown document into the chunks docs retrieval embeds, indexes and cites.
 *
 * **The rule this module exists to enforce: a chunk's identity is its path and heading anchor, and
 * its change signal is the hash of its text.** A refresh compares keys and hashes against the stored
 * index and re-embeds only the chunks whose hash moved, so a key that shifted with an unrelated edit,
 * or a hash over anything but the embedded text, would turn every refresh into a full rebuild or miss
 * a change.
 *
 * A chunk starts at every `## ` or `### ` line outside a fenced code block, with two exceptions that
 * exist to keep near-empty rows out of a fixed per-arm candidate budget: a `##` section with no body
 * of its own that has at least one `###` child is folded into those children, and content before the
 * first heading becomes the preamble chunk only when something but the title line is in it. A `###`
 * section is otherwise its own chunk and is never folded into its parent `##`.
 */

import { createHash } from 'node:crypto';
import { posix } from 'node:path';

/** One section of one corpus document: the unit Task 5 persists and a search result cites. */
export interface DocChunk {
  /** `${path}#${anchor}`, or `path` alone for the preamble; unique per corpus. */
  readonly key: string;
  /** Repo-relative, forward slashes. */
  readonly path: string;
  /** GitHub-style heading slug, `''` for the preamble. */
  readonly anchor: string;
  /** The heading text as written, `''` for the preamble. */
  readonly heading: string;
  /** What is embedded and BM25-indexed: the title, the heading path, a blank line, the body. */
  readonly text: string;
  /** The section's own lines, for the snippet. */
  readonly body: string;
  /** sha256 hex of `text`. */
  readonly hash: string;
}

const ATX_HEADING = /^(#{1,6})[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$/;
const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})/;

/**
 * GitHub's heading slug, as the `#anchor` in a `path#heading` citation an agent then opens — so it
 * has to land on the heading GitHub renders, not merely be unique.
 *
 * Lower-cases the text, drops every character that is not a letter, a digit, a space, a hyphen or an
 * underscore (backticks included), and turns each space into `-`. `seen` holds the slugs already
 * issued in this file: a repeat gets `-1`, `-2`, … in order, skipping any suffixed form a literal
 * heading already took, so every slug in one file is distinct.
 */
function headingSlug(text: string, seen: Map<string, number>): string {
  const base = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N} _-]/gu, '')
    .replace(/ /g, '-');
  let slug = base;
  if (seen.has(base)) {
    let n = seen.get(base) ?? 0;
    do {
      n += 1;
      slug = `${base}-${n}`;
    } while (seen.has(slug));
    seen.set(base, n);
  }
  seen.set(slug, 0);
  return slug;
}

interface Section {
  readonly level: 0 | 2 | 3;
  readonly heading: string;
  readonly anchor: string;
  readonly lines: string[];
}

/** Trims blank lines from both ends and joins the rest. */
function joinBody(lines: readonly string[]): string {
  const isBlank = (line: string): boolean => line.trim() === '';
  const start = lines.findIndex((line) => !isBlank(line));
  if (start === -1) return '';
  let end = lines.length;
  while (isBlank(lines[end - 1] ?? '')) end -= 1;
  return lines.slice(start, end).join('\n');
}

/** `anchor` is `undefined` for the preamble alone: a heading whose slug is empty still keys as `path#`. */
function makeChunk(path: string, anchor: string | undefined, heading: string, headingPath: string, title: string, body: string): DocChunk {
  const text = `${title}\n${headingPath}\n\n${body}`;
  return {
    key: anchor === undefined ? path : `${path}#${anchor}`,
    path,
    anchor: anchor ?? '',
    heading,
    text,
    body,
    hash: createHash('sha256').update(text).digest('hex'),
  };
}

/**
 * Splits `markdown`, read from the repo-relative `path`, into its chunks in document order.
 *
 * Every ATX heading outside a fence, at any level, consumes a slug, because GitHub numbers repeats
 * across all levels; `##` and `###` start a chunk, except for the bodiless `##` wrapper the emission
 * loop below folds into its `###` children. The title is the first `# ` line outside a fence, falling
 * back to the file's basename.
 */
export function chunkMarkdown(path: string, markdown: string): DocChunk[] {
  const lines = markdown.split(/\r?\n/);
  const seen = new Map<string, number>();
  let current: Section = { level: 0, heading: '', anchor: '', lines: [] };
  const sections: Section[] = [current];
  let title: string | undefined;
  let titleLineInPreamble = -1;
  let fence: { char: string; length: number } | undefined;

  for (const line of lines) {
    if (fence !== undefined) {
      const trimmed = line.trim();
      if (trimmed.length >= fence.length && trimmed === fence.char.repeat(trimmed.length)) fence = undefined;
      current.lines.push(line);
      continue;
    }
    const open = FENCE_OPEN.exec(line);
    if (open !== null) {
      const marker = open[1] ?? '';
      // A backtick fence's info string may not contain a backtick; such a line is not a fence.
      if (!(marker.startsWith('`') && line.slice(line.indexOf(marker) + marker.length).includes('`'))) {
        fence = { char: marker.charAt(0), length: marker.length };
      }
      current.lines.push(line);
      continue;
    }
    const heading = ATX_HEADING.exec(line);
    if (heading === null) {
      current.lines.push(line);
      continue;
    }
    const level = heading[1]?.length ?? 0;
    const text = heading[2] ?? '';
    const anchor = headingSlug(text, seen);
    if (level === 2 || level === 3) {
      current = { level, heading: text, anchor, lines: [] };
      sections.push(current);
      continue;
    }
    if (level === 1 && title === undefined) {
      title = text;
      if (sections.length === 1) titleLineInPreamble = current.lines.length;
    }
    current.lines.push(line);
  }

  const resolvedTitle = title ?? posix.basename(path);
  const chunks: DocChunk[] = [];
  let parent: string | undefined;
  for (const [index, section] of sections.entries()) {
    if (section.level === 0) {
      const own = section.lines.filter((_, index) => index !== titleLineInPreamble);
      const body = joinBody(own);
      if (body !== '') chunks.push(makeChunk(path, undefined, '', resolvedTitle, resolvedTitle, body));
      continue;
    }
    const body = joinBody(section.lines);
    let headingPath: string;
    if (section.level === 2) {
      parent = `## ${section.heading}`;
      headingPath = `${resolvedTitle} > ${parent}`;
      // A `##` used only to group its `###` children carries no text of its own, so its row would be
      // a near-duplicate of every other wrapper in the corpus while competing for the same fixed
      // per-arm candidate budget. Folding it loses nothing: `headingPath` below spells the parent
      // into each child, so the wrapper's words stay searchable through them.
      //
      // Decision, for the remaining case — an empty `##` or `###` with no child at all: it is still
      // emitted. Unlike the wrapper, its words survive nowhere else in the index, so dropping it
      // would make that heading unfindable; the fold above removes a duplicate, not merely a short row.
      if (body === '' && sections[index + 1]?.level === 3) continue;
    } else {
      headingPath = parent === undefined ? `${resolvedTitle} > ### ${section.heading}` : `${resolvedTitle} > ${parent} > ### ${section.heading}`;
    }
    chunks.push(makeChunk(path, section.anchor, section.heading, headingPath, resolvedTitle, body));
  }
  return chunks;
}
