let removeBackground = null;

async function loadEngine() {
  if (removeBackground) return;
  self.postMessage({ type: 'progress', phase: 'loading', percent: 0 });

  const mod = await import(
    'https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/+esm'
  );
  removeBackground = mod.removeBackground || mod.default?.removeBackground || mod.default;

  self.postMessage({ type: 'progress', phase: 'loading', percent: 100 });
}

self.addEventListener('message', async (e) => {
  if (e.data.type !== 'remove') return;

  try {
    await loadEngine();

    self.postMessage({ type: 'progress', phase: 'processing', percent: 0 });

    const blob = await removeBackground(e.data.image, {
      progress: (key, current, total) => {
        if (total > 0) {
          const percent = Math.round((current / total) * 100);
          self.postMessage({ type: 'progress', phase: 'processing', percent });
        }
      },
    });

    self.postMessage({ type: 'progress', phase: 'done', percent: 100 });
    self.postMessage({ type: 'result', blob });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message });
  }
});
