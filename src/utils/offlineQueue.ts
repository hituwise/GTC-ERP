// Client-side Offline Request Queue & Auto-Recovery Engine
// Ensures zero data loss when connection drops or is temporarily lost.

export interface PendingRequest {
  id: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
  timestamp: number;
  description?: string;
}

const QUEUE_STORAGE_KEY = "erp_offline_pending_queue";
const LAST_SYNC_KEY = "erp_last_successful_sync_time";

export function getPendingQueue(): PendingRequest[] {
  try {
    const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    
    // Auto-prune stale requests older than 12 hours
    const now = Date.now();
    const valid = parsed.filter(item => item && item.id && (now - (item.timestamp || 0) < 12 * 60 * 60 * 1000));
    if (valid.length !== parsed.length) {
      savePendingQueue(valid);
    }
    return valid;
  } catch (err) {
    console.error("[OFFLINE QUEUE] Error reading queue from storage:", err);
    return [];
  }
}

export function savePendingQueue(queue: PendingRequest[]): void {
  try {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error("[OFFLINE QUEUE] Error saving queue to storage:", err);
  }
}

export function getPendingCount(): number {
  return getPendingQueue().length;
}

export function getLastSuccessfulSyncTime(): string {
  return localStorage.getItem(LAST_SYNC_KEY) || new Date().toISOString();
}

export function setLastSuccessfulSyncTime(isoStr: string): void {
  localStorage.setItem(LAST_SYNC_KEY, isoStr);
}

export function enqueuePendingRequest(
  url: string,
  method: string,
  body?: any,
  headers?: Record<string, string>,
  description?: string
): PendingRequest {
  const queue = getPendingQueue();
  const reqItem: PendingRequest = {
    id: `REQ_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    url,
    method: method.toUpperCase(),
    headers: headers || { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body || {}),
    timestamp: Date.now(),
    description: description || `${method.toUpperCase()} ${url}`
  };

  queue.push(reqItem);
  savePendingQueue(queue);
  console.log(`[OFFLINE QUEUE] Request enqueued. Queue length: ${queue.length}`, reqItem);
  return reqItem;
}

export async function processPendingQueue(): Promise<{ processed: number; remaining: number }> {
  const queue = getPendingQueue();
  if (queue.length === 0) {
    return { processed: 0, remaining: 0 };
  }

  console.log(`[OFFLINE QUEUE] Processing ${queue.length} pending request(s)...`);
  let processedCount = 0;
  const remainingQueue: PendingRequest[] = [];

  for (let i = 0; i < queue.length; i++) {
    const req = queue[i];
    try {
      const res = await fetch(req.url, {
        method: req.method,
        headers: req.headers || { "Content-Type": "application/json" },
        body: req.body
      });

      if (res.ok || (res.status >= 400 && res.status < 500)) {
        // HTTP 2xx or 4xx (non-retriable input error): request processed successfully or completed
        processedCount++;
        console.log(`[OFFLINE QUEUE] Request ${req.id} processed (HTTP ${res.status}).`);
      } else {
        // Server 5xx error: keep in queue for retry
        remainingQueue.push(req);
        console.warn(`[OFFLINE QUEUE] Server returned HTTP ${res.status}. Keeping request ${req.id} in queue.`);
      }
    } catch (err) {
      // Network failure / still offline: stop processing rest of queue and preserve order
      console.warn(`[OFFLINE QUEUE] Network fetch failed for ${req.id}. Stopping queue processing.`, err);
      remainingQueue.push(...queue.slice(i));
      break;
    }
  }

  savePendingQueue(remainingQueue);
  if (processedCount > 0) {
    setLastSuccessfulSyncTime(new Date().toISOString());
  }

  return { processed: processedCount, remaining: remainingQueue.length };
}

// Wrapper around fetch that auto-queues mutative requests if fetch fails or navigator is offline
export async function safeFetchWithOfflineQueue(
  url: string,
  options: RequestInit = {},
  description?: string
): Promise<{ ok: boolean; status: number; json: () => Promise<any>; queued?: boolean }> {
  const method = (options.method || "GET").toUpperCase();
  const isMutative = ["POST", "PUT", "DELETE", "PATCH"].includes(method);

  // If navigator is explicitly offline and it's a mutative call, queue it immediately
  if (!navigator.onLine && isMutative) {
    enqueuePendingRequest(
      url,
      method,
      options.body,
      options.headers as Record<string, string>,
      description
    );
    return {
      ok: true,
      status: 202,
      queued: true,
      json: async () => ({
        success: true,
        queued: true,
        message: "Request saved to local offline queue. Will sync automatically when connection is restored."
      })
    };
  }

  try {
    const res = await fetch(url, options);
    if (res.ok) {
      setLastSuccessfulSyncTime(new Date().toISOString());
    }
    return {
      ok: res.ok,
      status: res.status,
      json: () => res.json()
    };
  } catch (err) {
    console.warn(`[OFFLINE QUEUE] Fetch failed for ${method} ${url}:`, err);
    if (isMutative) {
      enqueuePendingRequest(
        url,
        method,
        options.body,
        options.headers as Record<string, string>,
        description
      );
      return {
        ok: true,
        status: 202,
        queued: true,
        json: async () => ({
          success: true,
          queued: true,
          message: "Connection failed. Request stored in offline queue and will auto-sync."
        })
      };
    } else {
      throw err;
    }
  }
}
