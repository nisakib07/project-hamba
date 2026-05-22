"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      // In development mode, unregister any active service worker to avoid caching HMR and causing route freezes.
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister().then((success) => {
              if (success) {
                console.log("Dev: Service worker unregistered successfully");
                // Clear caches so stale assets are removed
                caches.keys().then((keys) => {
                  Promise.all(keys.map((key) => caches.delete(key))).then(() => {
                    console.log("Dev: Cache storage cleared");
                    window.location.reload();
                  });
                });
              }
            });
          }
        });
      }
      return;
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered:", registration.scope);
        })
        .catch((err) => {
          console.log("SW registration failed:", err);
        });
    }
  }, []);

  return null;
}
