"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { usePeques } from "./app-context";
import {
  isTutorialRoute,
  tutorialRoutes,
  type TutorialRoute,
} from "@/modules/settings/domain/settings";
import styles from "@/app/(app)/_components/app-shell.module.css";

type TutorialStep = {
  eyebrow: string;
  title: string;
  description: string;
};

const steps: Record<TutorialRoute, TutorialStep> = {
  "/": {
    eyebrow: "Inicio",
    title: "Tu resumen diario",
    description:
      "Aquí ves la edad, los próximos eventos y accesos rápidos para registrar lo importante.",
  },
  "/peso": {
    eyebrow: "Crecimiento",
    title: "Sigue peso y medidas",
    description:
      "Registra peso, talla y perímetro cefálico. Las curvas OMS se muestran según el sexo del peque.",
  },
  "/vacunas": {
    eyebrow: "Vacunas",
    title: "Consulta lo pendiente",
    description:
      "Revisa las dosis previstas, marca las aplicadas y añade los datos de cada visita.",
  },
  "/sueno": {
    eyebrow: "Sueño",
    title: "Mide los descansos",
    description:
      "Inicia una noche o siesta y deja que el historial te ayude a ver los ritmos de descanso.",
  },
  "/viaje": {
    eyebrow: "Viaje",
    title: "Prepara la lista familiar",
    description:
      "Organiza elementos por categorías y ubicaciones, y márcalos mientras preparas la bolsa.",
  },
  "/calendario": {
    eyebrow: "Calendario",
    title: "Todo en una agenda",
    description:
      "Consulta vacunas, cumpleaños, registros y eventos próximos del peque seleccionado o de todos.",
  },
  "/ajustes": {
    eyebrow: "Ajustes",
    title: "Controla tus datos",
    description:
      "Gestiona peques y copias. Todo se queda en este dispositivo y tú decides cuándo exportarlo.",
  },
};

export function AppTutorial() {
  const pathname = usePathname().replace(/\/$/, "") || "/";
  const route = isTutorialRoute(pathname) ? pathname : null;
  const { app, family } = usePeques();
  const confirmRef = useRef<HTMLButtonElement>(null);
  const [hiddenRoute, setHiddenRoute] = useState<TutorialRoute | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<{ route: TutorialRoute; message: string } | null>(null);
  const step = route ? steps[route] : null;
  const seenRoutes = family.settings.tutorialSeenRoutes ?? [];
  const shouldShow = Boolean(route && step && !seenRoutes.includes(route) && hiddenRoute !== route);
  const stepIndex = route ? tutorialRoutes.indexOf(route) : -1;

  useEffect(() => {
    if (!shouldShow) return;
    confirmRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        confirmRef.current?.click();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shouldShow]);

  async function markSeen(all = false) {
    if (!route || pending) return;
    setPending(true);
    setError(null);
    try {
      const nextRoutes = all ? [...tutorialRoutes] : [...seenRoutes, route];
      await app.settings.update({ tutorialSeenRoutes: nextRoutes });
      setHiddenRoute(route);
    } catch {
      setError({
        route,
        message: "No se pudo guardar el progreso del tutorial. Inténtalo de nuevo.",
      });
    } finally {
      setPending(false);
    }
  }

  if (!shouldShow || !step || !route) return null;
  return (
    <div className={styles.tutorialBackdrop} role="presentation">
      <section
        aria-labelledby="tutorial-title"
        aria-modal="true"
        className={styles.tutorialDialog}
        role="dialog"
      >
        <p className={styles.tutorialProgress}>
          {stepIndex + 1} de {tutorialRoutes.length} · {step.eyebrow}
        </p>
        <h2 id="tutorial-title">{step.title}</h2>
        <p>{step.description}</p>
        {error?.route === route && <p role="alert">{error.message}</p>}
        <div className={styles.tutorialActions}>
          <button
            className={styles.tutorialPrimary}
            disabled={pending}
            onClick={() => void markSeen()}
            ref={confirmRef}
            type="button"
          >
            {pending ? "Guardando…" : "Entendido"}
          </button>
          <button
            className={styles.tutorialSecondary}
            disabled={pending}
            onClick={() => void markSeen(true)}
            type="button"
          >
            Saltar tutorial
          </button>
        </div>
      </section>
    </div>
  );
}
