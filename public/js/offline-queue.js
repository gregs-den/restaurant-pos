// /js/offline-queue.js
// Shared offline queue for the Restaurant POS.
// Include this AFTER nav.js and BEFORE your page's own <script> block.
//
// Usage:
//   const result = await offlineFetch('/orders', { method: 'POST', body: JSON.stringify({...}) }, { queueable: true, label: 'New order' });
//   result.queued === true means it was saved for later, not sent yet.
//   result.data contains the response (or the locally-generated placeholder if queued).

(function () {
  const QUEUE_KEY = "pos_offline_queue";
  const API_BASE = window.location.origin;

  function genId() {
    return "idem_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
  }

  function getQueue() {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
    } catch {
      return [];
    }
  }

  function saveQueue(queue) {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    updateIndicator();
  }

  function addToQueue(item) {
    const queue = getQueue();
    queue.push(item);
    saveQueue(queue);
  }

  function removeFromQueue(idempotencyKey) {
    const queue = getQueue().filter(q => q.idempotencyKey !== idempotencyKey);
    saveQueue(queue);
  }

  // ---- Core: attempt a request, queue it if it fails due to connectivity ----
  window.offlineFetch = async function (path, options = {}, meta = {}) {
    const token = localStorage.getItem("pos_token");
    const idempotencyKey = meta.idempotencyKey || genId();

    // Inject idempotency key into body if this is a queueable POST
    let body = options.body;
    if (meta.queueable && body) {
      try {
        const parsed = JSON.parse(body);
        parsed.idempotencyKey = idempotencyKey;
        body = JSON.stringify(parsed);
      } catch {}
    }

    const fetchOptions = {
      ...options,
      body,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {})
      }
    };

    try {
      const res = await fetch(`${API_BASE}${path}`, fetchOptions);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Request failed");
      return { queued: false, data };
    } catch (err) {
      // Only queue on genuine connectivity failures, not on server-side validation errors.
      const isNetworkError = err instanceof TypeError || !navigator.onLine;

      if (isNetworkError && meta.queueable) {
        addToQueue({
          idempotencyKey,
          path,
          options: fetchOptions,
          label: meta.label || path,
          queuedAt: new Date().toISOString(),
        });
        return { queued: true, data: null, idempotencyKey };
      }
      throw err;
    }
  };

  // ---- Sync queued items when connection returns ----
  async function syncQueue() {
    const queue = getQueue();
    if (!queue.length) return;

    const indicator = document.getElementById("offline-indicator");
    if (indicator) indicator.textContent = `Syncing ${queue.length} queued item(s)…`;

    for (const item of queue) {
      try {
        const res = await fetch(`${API_BASE}${item.path}`, item.options);
        if (res.ok) {
          removeFromQueue(item.idempotencyKey);
        }
        // If it fails for a non-network reason (e.g. 400), leave it queued for manual review
      } catch (err) {
        // Still offline or server down — stop trying, will retry on next online event
        break;
      }
    }
    updateIndicator();
  }

  // ---- Connection status indicator ----
  function updateIndicator() {
    let indicator = document.getElementById("offline-indicator");
    if (!indicator) {
      indicator = document.createElement("div");
      indicator.id = "offline-indicator";
      indicator.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; z-index: 9999;
        text-align: center; padding: 8px; font-size: 13px; font-family: monospace;
        color: #fff; display: none; font-weight: 600;
      `;
      document.body.prepend(indicator);
    }

    const queue = getQueue();
    const isOffline = !navigator.onLine;

    if (isOffline) {
      indicator.style.display = "block";
      indicator.style.background = "#c4452b";
      indicator.textContent = `⚠️ No connection — actions will be saved and sent automatically when back online${queue.length ? ` (${queue.length} queued)` : ""}`;
    } else if (queue.length > 0) {
      indicator.style.display = "block";
      indicator.style.background = "#e0a72e";
      indicator.style.color = "#1a1200";
      indicator.textContent = `🔄 Syncing ${queue.length} queued item(s)…`;
    } else {
      indicator.style.display = "none";
    }
  }

  window.addEventListener("online", () => {
    updateIndicator();
    syncQueue();
  });
  window.addEventListener("offline", updateIndicator);

  // Check periodically in case 'online' event doesn't fire reliably
  setInterval(() => {
    if (navigator.onLine) syncQueue();
  }, 15000);

  // Initial check on page load
  document.addEventListener("DOMContentLoaded", () => {
    updateIndicator();
    if (navigator.onLine) syncQueue();
  });

  window.getOfflineQueueCount = function () {
    return getQueue().length;
  };
})();