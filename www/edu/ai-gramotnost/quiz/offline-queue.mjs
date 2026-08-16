const KEY = 'vevit-edu-quiz-offline-v1';

function read(storage = window.localStorage) {
  try { const value = JSON.parse(storage.getItem(KEY) || '[]'); return Array.isArray(value) ? value : []; } catch (_) { return []; }
}
function write(items, storage = window.localStorage) { storage.setItem(KEY, JSON.stringify(items)); }

export function enqueueAttempt(attempt, storage = window.localStorage) {
  const items = read(storage); if (!items.some((item) => item.client_attempt_uuid === attempt.client_attempt_uuid)) items.push(attempt);
  write(items, storage); return items.length;
}

export async function flushAttempts(send, storage = window.localStorage) {
  const items = read(storage); const remaining = []; let sent = 0;
  for (const item of items) {
    try { await send(item); sent += 1; } catch (_) { remaining.push(item); }
  }
  write(remaining, storage); return { sent, remaining: remaining.length };
}

export function queuedAttemptCount(storage = window.localStorage) { return read(storage).length; }
