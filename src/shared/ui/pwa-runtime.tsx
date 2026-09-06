"use client";
import { useEffect, useState } from "react";

export function PwaRuntime() {
  const [status, setStatus] = useState("Preparando apertura sin conexión…");
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    let mounted = true;
    let registration: ServiceWorkerRegistration | undefined;
    const update = () => {
      if (!mounted) return;
      setWaiting(registration?.waiting ?? null);
      if (navigator.serviceWorker.controller) setStatus("Lista para abrir sin conexión");
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
      .catch(() => {
        if (mounted) setStatus("Offline aún no preparado. Vuelve a abrir con conexión.");
      });
    return () => {
      mounted = false;
      navigator.serviceWorker.removeEventListener("controllerchange", update);
    };
  }, []);
  if (process.env.NODE_ENV !== "production") return null;
  return (
    <aside className="pwa-status" aria-label="Estado de la aplicación">
      <p role="status">{status}</p>
      {waiting && (
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
      )}
    </aside>
  );
}
