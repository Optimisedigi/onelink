// Fire-and-forget visit/click counting. Sent as text/plain so the browser
// delivers it even while the page navigates away; failures never affect visitors.
export function trackEvent(payload) {
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon?.("/api/track", body)) return;
    fetch("/api/track", { method: "POST", body, keepalive: true, credentials: "same-origin" }).catch(() => {});
  } catch { /* counting is best effort */ }
}
