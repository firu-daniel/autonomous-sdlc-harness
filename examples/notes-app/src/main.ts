// main.ts — the mount, and nothing else.
//
// It stays directly under `src/` because `rootDir: "src"` puts its output at `dist/main.js`,
// which is the path `index.html` loads. Moved into `src/presentation/` it would emit at
// `dist/presentation/main.js`, the page would load nothing, and the build would still exit 0.

import { createApp } from './presentation/app.js';

document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector('#app');
  if (root === null) throw new Error("notes-app: no '#app' element to mount into");
  root.append(createApp());
});
