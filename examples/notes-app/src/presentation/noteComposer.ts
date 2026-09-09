// noteComposer.ts — the add form: a title, a body, a submit control, and the region a rejected
// draft is reported in.
//
// It calls nothing. `onSubmit` hands the typed draft to `app.ts`, the only file in this layer
// that talks to `../domain/notesService.js`, and whether the draft was accepted comes back
// through `showError`. That is why this file has no idea what makes a title valid: the rule has
// one home, and a second expression of it here is the copy that would go stale.

import { qa, setQaStatus } from './qaAttrs.js';

/** What `app.ts` holds after `createNoteComposer` returns. */
export interface NoteComposer {
  /** The form, ready to append. */
  readonly element: HTMLFormElement;
  /** Empties the inputs and clears the error region. Called once a draft was accepted. */
  reset(): void;
  /** Shows `message`, or returns the region to `idle` when it is `null`. */
  showError(message: string | null): void;
  /** Flips the submit control between the `idle` and `saving` tokens. */
  setSaving(saving: boolean): void;
}

/** Builds the add form. `onSubmit` receives the raw field values, untrimmed and unvalidated. */
export function createNoteComposer(onSubmit: (title: string, body: string) => void): NoteComposer {
  const form = qa(document.createElement('form'), { id: 'note-composer' });
  form.className = 'composer';
  // The browser's own validation would reject a blank title before `onSubmit` ever ran, which
  // would move the rule out of the domain and into the markup.
  form.noValidate = true;

  const title = qa(document.createElement('input'), { id: 'note-title-input' });
  title.type = 'text';
  title.className = 'composer__title';
  title.placeholder = 'Title';
  title.setAttribute('aria-label', 'Note title');

  const body = qa(document.createElement('textarea'), { id: 'note-body-input' });
  body.className = 'composer__body';
  body.rows = 3;
  body.placeholder = 'Body';
  body.setAttribute('aria-label', 'Note body');

  const submit = qa(document.createElement('button'), { id: 'note-submit', status: 'idle' });
  submit.type = 'submit';
  submit.className = 'composer__submit';
  submit.textContent = 'Add note';

  // Always in the DOM, empty when there is nothing to say: a region that is removed on success
  // has no state for a test to read, and `data-qa-status` is the whole point of it.
  const error = qa(document.createElement('p'), { id: 'note-error', status: 'idle' });
  error.className = 'composer__error';
  error.setAttribute('role', 'alert');

  form.append(title, body, submit, error);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    onSubmit(title.value, body.value);
  });

  function showError(message: string | null): void {
    error.textContent = message ?? '';
    setQaStatus(error, message === null ? 'idle' : 'invalid');
  }

  return {
    element: form,
    reset() {
      title.value = '';
      body.value = '';
      showError(null);
      title.focus();
    },
    showError,
    setSaving(saving: boolean) {
      // Storage is synchronous, so `saving` is rarely on screen for long. The token exists so a
      // test waits for `idle` rather than sleeping a guessed interval — not to drive a spinner.
      setQaStatus(submit, saving ? 'saving' : 'idle');
      submit.disabled = saving;
    },
  };
}
