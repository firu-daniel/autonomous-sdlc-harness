// qaAttrs.ts — the one place a test attribute is written, for every element in this layer.
//
// Three names and no fourth, because the QA agent that drives this app reads exactly these:
// `data-qa-id` locates an element, `data-qa-status` carries a state token to wait on instead of
// sleeping, `data-qa-value` carries a value to read. Every control goes through this helper
// rather than calling `setAttribute` by hand, which is what makes the convention checkable —
// `grep -rn "addEventListener" src/presentation/` against `grep -rn "data-qa-id"` finds a
// control nobody can drive, and a hand-written attribute would hide from both.

/** The attributes an element is published to a test under. */
export interface QaAttrs {
  /** The stable hook a test locates this element by. Required — every control has one. */
  id: string;
  /** A state token a test waits on, e.g. `idle` / `saving`. */
  status?: string;
  /** A value a test reads, e.g. a rendered count or a row's note id. */
  value?: string;
}

/** Writes `attrs` onto `element` and returns it, so it wraps a freshly created element. */
export function qa<E extends Element>(element: E, attrs: QaAttrs): E {
  element.setAttribute('data-qa-id', attrs.id);
  if (attrs.status !== undefined) element.setAttribute('data-qa-status', attrs.status);
  if (attrs.value !== undefined) element.setAttribute('data-qa-value', attrs.value);
  return element;
}

/** Moves an already-published element to a new state token. */
export function setQaStatus(element: Element, status: string): void {
  element.setAttribute('data-qa-status', status);
}

/** Updates an already-published element's readable value. */
export function setQaValue(element: Element, value: string): void {
  element.setAttribute('data-qa-value', value);
}
