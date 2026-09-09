// noteListView.ts — the list: one row per note, four controls on each, and the empty state.
//
// Like the composer it calls nothing: it is handed the notes to draw and the callbacks to report
// a click through, and every one of those callbacks lands in `app.ts`. A row does not know that
// archiving is a write, or that a note has an id in storage at all — it knows the id it was
// given and hands it back.
//
// Rendering replaces the whole list rather than patching rows. For a list this size that is the
// simpler thing to keep correct, and it means one rule decides what is on screen: whatever
// `listNotes(filter)` last returned.

import type { Note } from '../domain/note.js';
import { qa, setQaStatus, setQaValue } from './qaAttrs.js';

/** Every click a row can report. Each one is a request; `app.ts` decides what it costs. */
export interface NoteListCallbacks {
  /** The Edit control on a row. */
  onEditRequested(id: string): void;
  /** Save, from a row already in edit mode. The values are raw, untrimmed and unvalidated. */
  onEditSaved(id: string, title: string, body: string): void;
  /** Cancel, from a row already in edit mode. */
  onEditCancelled(): void;
  /** Archive or Restore. `archived` is the state the row is asking to move *to*. */
  onArchiveToggled(id: string, archived: boolean): void;
  /** Pin or Unpin. `pinned` is the state the row is asking to move *to*. */
  onPinToggled(id: string, pinned: boolean): void;
  /** Delete. */
  onDeleteRequested(id: string): void;
}

/** What `app.ts` holds after `createNoteListView` returns. */
export interface NoteListView {
  /** The list element, ready to append. */
  readonly element: HTMLUListElement;
  /** Draws `notes`; the row whose id is `editingId` draws in edit mode. */
  render(notes: Note[], editingId: string | null): void;
  /** Reports a rejected edit in the row currently in edit mode, if one is on screen. */
  showEditError(message: string | null): void;
}

/** Builds the list. Nothing is drawn until the first `render`. */
export function createNoteListView(callbacks: NoteListCallbacks): NoteListView {
  const list = qa(document.createElement('ul'), { id: 'note-list', value: '0' });
  list.className = 'notes';

  // The error region of the row currently in edit mode. `render` rebuilds every row, so this is
  // re-pointed on each pass and is `null` whenever no row is being edited.
  let editError: HTMLElement | null = null;

  function button(id: string, label: string, className: string): HTMLButtonElement {
    const control = qa(document.createElement('button'), { id });
    control.type = 'button';
    control.className = className;
    control.textContent = label;
    return control;
  }

  function renderViewing(note: Note, row: HTMLElement): void {
    const title = qa(document.createElement('h2'), { id: 'note-title', value: note.title });
    title.className = 'note__title';
    title.textContent = note.title;

    const body = qa(document.createElement('p'), { id: 'note-body' });
    body.className = 'note__body';
    body.textContent = note.body;

    const edited = qa(document.createElement('p'), {
      id: 'note-edited',
      status: note.updatedAt === null ? 'never-edited' : 'edited',
      // Epoch milliseconds, not the rendered line: `toLocaleString()` follows the machine's
      // locale and zone, so only the number storage holds reads back deterministically.
      value: note.updatedAt === null ? undefined : String(note.updatedAt.getTime()),
    });
    edited.className = 'note__edited';
    edited.textContent = note.updatedAt === null ? '' : `Edited ${note.updatedAt.toLocaleString()}`;

    const edit = button('note-edit', 'Edit', 'note__control');
    edit.addEventListener('click', () => callbacks.onEditRequested(note.id));

    const pin = button('note-pin', note.pinned ? 'Unpin' : 'Pin', 'note__control');
    // Token is the state, label is the action — the same pairing as the archive control below.
    setQaStatus(pin, note.pinned ? 'pinned' : 'unpinned');
    pin.addEventListener('click', () => callbacks.onPinToggled(note.id, !note.pinned));

    const archive = button('note-archive', note.archived ? 'Restore' : 'Archive', 'note__control');
    // The token is the state the note is *in*, so a test reads a row's condition off it; the
    // label is the action, which is the opposite word.
    setQaStatus(archive, note.archived ? 'archived' : 'active');
    archive.addEventListener('click', () => callbacks.onArchiveToggled(note.id, !note.archived));

    const remove = button('note-delete', 'Delete', 'note__control');
    remove.addEventListener('click', () => callbacks.onDeleteRequested(note.id));

    const controls = document.createElement('div');
    controls.className = 'note__controls';
    controls.append(edit, pin, archive, remove);
    row.append(title, body, edited, controls);
  }

  function renderEditing(note: Note, row: HTMLElement): void {
    const title = qa(document.createElement('input'), { id: 'note-edit-title' });
    title.type = 'text';
    title.className = 'note__edit-title';
    title.value = note.title;
    title.setAttribute('aria-label', 'Edit note title');

    const body = qa(document.createElement('textarea'), { id: 'note-edit-body' });
    body.className = 'note__edit-body';
    body.rows = 3;
    body.value = note.body;
    body.setAttribute('aria-label', 'Edit note body');

    const save = button('note-edit-save', 'Save', 'note__control');
    save.addEventListener('click', () => callbacks.onEditSaved(note.id, title.value, body.value));

    const cancel = button('note-edit-cancel', 'Cancel', 'note__control');
    cancel.addEventListener('click', () => callbacks.onEditCancelled());

    const error = qa(document.createElement('p'), { id: 'note-edit-error', status: 'idle' });
    error.className = 'note__error';
    error.setAttribute('role', 'alert');
    editError = error;

    const controls = document.createElement('div');
    controls.className = 'note__controls';
    controls.append(save, cancel);
    row.append(title, body, controls, error);
  }

  function renderRow(note: Note, editing: boolean): HTMLLIElement {
    const row = qa(document.createElement('li'), {
      id: 'note-row',
      value: note.id,
      status: editing ? 'editing' : 'viewing',
    });
    const classNames = ['note'];
    if (note.pinned) classNames.push('note--pinned');
    if (note.archived) classNames.push('note--archived');
    row.className = classNames.join(' ');
    if (editing) renderEditing(note, row);
    else renderViewing(note, row);
    return row;
  }

  function renderEmpty(): HTMLLIElement {
    const empty = qa(document.createElement('li'), { id: 'note-empty' });
    empty.className = 'notes__empty';
    empty.textContent = 'Nothing here.';
    return empty;
  }

  return {
    element: list,
    render(notes: Note[], editingId: string | null) {
      editError = null;
      // The count is the rendered count, which is the filtered count — a test asserting on it is
      // asserting on what the filter did, not on how many notes exist.
      setQaValue(list, String(notes.length));
      list.replaceChildren(
        ...(notes.length === 0
          ? [renderEmpty()]
          : notes.map((note) => renderRow(note, note.id === editingId))),
      );
    },
    showEditError(message: string | null) {
      if (editError === null) return;
      editError.textContent = message ?? '';
      setQaStatus(editError, message === null ? 'idle' : 'invalid');
    },
  };
}
