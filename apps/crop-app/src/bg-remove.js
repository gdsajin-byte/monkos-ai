let worker = null;

function getWorker() {
  if (!worker) {
    worker = new Worker(
      new URL('./bg-remove-worker.js', import.meta.url),
      { type: 'module' }
    );
  }
  return worker;
}

export async function removeBG(imageBlob, onProgress) {
  const w = getWorker();

  return new Promise((resolve, reject) => {
    function handler(e) {
      const { type, phase, percent, blob, message } = e.data;

      if (type === 'progress' && onProgress) {
        onProgress(phase, percent);
      } else if (type === 'result') {
        w.removeEventListener('message', handler);
        resolve(blob);
      } else if (type === 'error') {
        w.removeEventListener('message', handler);
        reject(new Error(message));
      }
    }

    w.addEventListener('message', handler);
    w.postMessage({ type: 'remove', image: imageBlob });
  });
}
