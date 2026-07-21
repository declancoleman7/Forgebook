// Same "hold onto the deferred prompt until Settings asks for it" pattern
// as the old app -- a module-level singleton, registered once in main.jsx.
let deferredPrompt = null;

export function registerInstallPromptListener() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
}

export function promptInstall() {
  if (deferredPrompt) deferredPrompt.prompt();
  return !!deferredPrompt;
}
