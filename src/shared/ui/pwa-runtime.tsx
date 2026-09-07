"use client";
import { useEffect, useState } from "react";

export function PwaRuntime() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    let mounted = true;
    let registration: ServiceWorkerRegistration | undefined;
    const update = () => {
      if (!mounted) return;
      setWaiting(registration?.waiting ?? null);
    };
    navigator.serviceWorker.addEventListener("controllerchange", update);
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .then((value) => {
        registration = value;
        update();
        value.addEventListener("updatefound", () => {
          value.installing?.addEventListener("statechange", update);
        });
        return navigator.serviceWorker.ready;
      })
      .then(update)
      .catch(() => undefined);
    return () => {
      mounted = false;
      navigator.serviceWorker.removeEventListener("controllerchange", update);
    };
  }, []);
  if (process.env.NODE_ENV !== "production") return null;
  if (!waiting) return null;
  return (
    <aside className="pwa-status" aria-label="Actualización disponible">
      <button
        className="text-button"
        onClick={() => {
          if (
            !window.confirm(
              "Hay una versión nueva. Guarda o cancela los formularios abiertos antes de recargar. ¿Actualizar ahora?",
            )
          )
            return;
          navigator.serviceWorker.addEventListener(
            "controllerchange",
            () => window.location.reload(),
            { once: true },
          );
          waiting.postMessage({ type: "SKIP_WAITING" });
        }}
      >
        Actualizar aplicación
      </button>
    </aside>
  );
}
