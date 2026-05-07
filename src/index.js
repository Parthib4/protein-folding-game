// Simple loader for the standalone viewer in `public/index.js`.
// Keeps CRA bundling simple and re-uses the tested module used for static preview.

document.addEventListener('DOMContentLoaded', () => {
  // Avoid double-injection
  if (document.querySelector('script[data-injected-viewer]')) return;
  const s = document.createElement('script');
  s.type = 'module';
  // `public/index.js` is available at the site root when served by CRA or static server
  s.src = '/index.js';
  s.setAttribute('data-injected-viewer', '1');
  document.body.appendChild(s);
});
