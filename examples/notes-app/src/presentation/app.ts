// app.ts — the filter control, and the wiring that holds this layer together.
//
// This is the only file in `src/presentation/` that imports from `../domain/`. The view modules
// are handed data and callbacks and call nothing themselves, so there is exactly one place a
// reader has to look to see which business call a click makes, and exactly one place that knows
// what is on screen. Nothing here imports from `../data/`: storage is two layers down and this
// file cannot see it.
//
// The state is two values — the active filter and the id of the row being edited. Every handler
// updates one of them and calls `refresh()`, which re-reads through `listNotes(filter)` rather
// than trusting what it just wrote.

import type { NoteFilter } from '../domain/note.js';
import {
  ValidationError,
  addNote,
  deleteNote,
  editNote,
  listNotes,
  setArchived,
  setPinned,
} from '../domain/notesService.js';
import { createNoteComposer } from './noteComposer.js';
import { createNoteListView } from './noteListView.js';
import { qa, setQaStatus } from './qaAttrs.js';

const FILTERS: ReadonlyArray<{ filter: NoteFilter; id: string; label: string }> = [
  { filter: 'active', id: 'filter-active', label: 'Active' },
  { filter: 'archived', id: 'filter-archived', label: 'Archived' },
  { filter: 'all', id: 'filter-all', label: 'All' },
];

/** Builds the whole surface and draws its first pass. Mounted by `../main.ts`. */
export function createApp(): HTMLElement {
  let filter: NoteFilter = 'active';
  let editingId: string | null = null;

  const composer = createNoteComposer((title, body) => {
    composer.setSaving(true);
    try {
      addNote(title, body);
      composer.reset();
      refresh();
    } catch (error) {
      // Only a rejected draft is the user's to fix. A storage failure is rethrown deliberately:
      // clearing the form on one would tell the user a note was saved that was not.
      if (!(error instanceof ValidationError)) throw error;
      composer.showError(error.message);
    } finally {
      composer.setSaving(false);
    }
  });

  const list = createNoteListView({
    onEditRequested(id) {
      editingId = id;
      refresh();
    },
    onEditSaved(id, title, body) {
      try {
        editNote(id, { title, body });
        editingId = null;
        refresh();
      } catch (error) {
        // Same split as the composer's, and the row stays open so the title can be fixed.
        if (!(error instanceof ValidationError)) throw error;
        list.showEditError(error.message);
      }
    },
    onEditCancelled() {
      editingId = null;
      refresh();
    },
    onArchiveToggled(id, archived) {
      setArchived(id, archived);
      refresh();
    },
    onPinToggled(id, pinned) {
      setPinned(id, pinned);
      refresh();
    },
    onDeleteRequested(id) {
      deleteNote(id);
      refresh();
    },
  });

  const filters = document.createElement('nav');
  filters.className = 'filters';
  filters.setAttribute('aria-label', 'Filter notes');
  const filterControls = FILTERS.map((entry) => {
    const control = qa(document.createElement('button'), { id: entry.id });
    control.type = 'button';
    control.className = 'filters__control';
    control.textContent = entry.label;
    control.addEventListener('click', () => {
      filter = entry.filter;
      // A row being edited under one filter has no row to return to under another.
      editingId = null;
      refresh();
    });
    return { entry, control };
  });
  filters.append(...filterControls.map(({ control }) => control));

  function refresh(): void {
    for (const { entry, control } of filterControls) {
      setQaStatus(control, entry.filter === filter ? 'selected' : 'unselected');
    }
    list.render(listNotes(filter), editingId);
  }

  const heading = document.createElement('h1');
  heading.className = 'app__heading';
  heading.textContent = 'Notes';

  const root = document.createElement('main');
  root.className = 'app';
  root.append(heading, composer.element, filters, list.element);

  refresh();
  return root;
}
