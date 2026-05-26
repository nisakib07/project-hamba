"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const swCleaned = sessionStorage.getItem("sw-cleaned");
      if (!swCleaned && "serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          if (registrations.length > 0) {
            sessionStorage.setItem("sw-cleaned", "true");
            Promise.all(
              registrations.map((registration) =>
                registration.unregister().then((success) => {
                  if (success) console.log("Dev: Service worker unregistered successfully");
                })
              )
            ).then(() => {
              caches.keys().then((keys) => {
                Promise.all(keys.map((key) => caches.delete(key))).then(() => {
                  console.log("Dev: Cache storage cleared");
                  window.location.reload();
                });
              });
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
