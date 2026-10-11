export function startCooperativeTask(
  work: Iterator<void>,
  canRun: () => boolean,
  onComplete: () => void,
): () => void {
  let cancelled = false;
  let handle = 0;
  const hasIdleCallback = typeof window.requestIdleCallback === 'function';

  function schedule() {
    handle = hasIdleCallback
      ? window.requestIdleCallback(step, { timeout: 100 })
      : window.setTimeout(() => step(), 16);
  }

  function step(deadline?: IdleDeadline) {
    if (cancelled) return;
    if (canRun()) {
      const end = performance.now() + 2;
      do {
        if (work.next().done) {
          cancelled = true;
          onComplete();
          return;
        }
      } while (performance.now() < end && (!deadline || deadline.timeRemaining() > 1));
    }
    schedule();
  }

  schedule();
  return () => {
    cancelled = true;
    if (hasIdleCallback) window.cancelIdleCallback(handle);
    else window.clearTimeout(handle);
    work.return?.();
  };
}
