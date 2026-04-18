import PQueue from "p-queue";

export const apiQueue = new PQueue({
  concurrency: 1,
  intervalCap: 1,
  interval: 1000,
  carryoverConcurrencyCount: true,
});

let pausedUntil = 0;

export function pauseQueue(ms: number): void {
  pausedUntil = Math.max(pausedUntil, Date.now() + ms);
  apiQueue.pause();
  setTimeout(() => {
    if (Date.now() >= pausedUntil) apiQueue.start();
  }, ms);
}

export function isQueuePaused(): boolean {
  return apiQueue.isPaused;
}
