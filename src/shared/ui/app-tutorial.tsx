"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from "react";
import type { PequesApp } from "@/shared/application/peques-app";
import { usePeques } from "./app-context";
import { ActionIcon } from "./action-icon";
import {
  isTutorialRoute,
  tutorialRoutes,
  type TutorialRoute,
} from "@/modules/settings/domain/settings";
import styles from "@/app/(app)/_components/app-shell.module.css";

type TutorialPlacement = "bottom" | "left" | "right" | "top";

type TutorialStep = {
  eyebrow: string;
  title: string;
  description: string;
  target: string;
  fallback: string;
  placement: TutorialPlacement;
};

const steps: Record<TutorialRoute, readonly TutorialStep[]> = {
  "/": [
    {
      eyebrow: "Inicio",
      title: "Empieza por el peque seleccionado",
      description: "Desde aquí puedes cambiar de perfil y consultar siempre los datos correctos.",
      target: "home-child-selector",
      fallback: "La cabecera de Inicio identifica al peque activo.",
      placement: "bottom",
    },
    {
      eyebrow: "Inicio",
      title: "Tu resumen, de un vistazo",
      description: "Revisa avisos, próximos eventos y el último peso sin entrar en cada sección.",
      target: "home-summary",
      fallback: "Inicio reúne el resumen diario cuando hay datos para mostrar.",
      placement: "bottom",
    },
    {
      eyebrow: "Inicio",
      title: "Añade un registro rápido",
      description: "Usa Añadir para guardar un peso, una vacuna, un descanso o algo del viaje.",
      target: "home-add",
      fallback: "El botón Añadir está al final de Inicio.",
      placement: "top",
    },
  ],
  "/peso": [
    {
      eyebrow: "Crecimiento",
      title: "Elige qué quieres ver",
      description:
        "Cambia entre peso, longitud, estatura, IMC y perímetro cefálico según tus registros.",
      target: "growth-indicator",
      fallback: "La gráfica de crecimiento aparece en esta sección.",
      placement: "bottom",
    },
    {
      eyebrow: "Crecimiento",
      title: "Registra un peso",
      description:
        "Guarda la fecha, el lugar y las notas de cada medición para seguir su evolución.",
      target: "weight-add",
      fallback: "Puedes añadir pesos desde el botón flotante de Peso.",
      placement: "top",
    },
    {
      eyebrow: "Crecimiento",
      title: "Completa otras medidas",
      description:
        "Longitud, estatura y perímetro cefálico alimentan las gráficas que necesitan esos datos.",
      target: "growth-measurements",
      fallback: "Otras medidas se encuentra debajo del histórico de pesos.",
      placement: "top",
    },
  ],
  "/vacunas": [
    {
      eyebrow: "Vacunas",
      title: "Escoge tu forma de revisar",
      description:
        "Por estado ayuda a detectar pendientes; Línea temporal ordena las dosis por edad.",
      target: "vaccines-view",
      fallback: "La vista de vacunas se puede cambiar en la primera tarjeta.",
      placement: "bottom",
    },
    {
      eyebrow: "Vacunas",
      title: "Marca una dosis aplicada",
      description:
        "Cuando acudáis al centro de salud, registra la fecha, el lugar y los datos disponibles.",
      target: "vaccines-mark-applied",
      fallback: "Cada dosis planificada tiene una acción para marcarla aplicada.",
      placement: "top",
    },
    {
      eyebrow: "Vacunas",
      title: "Añade vacunas fuera del plan",
      description:
        "Las campañas u otras vacunas que no estén en la planificación tienen su propio apartado.",
      target: "vaccines-standalone",
      fallback: "El apartado Otras vacunas aplicadas está al final de la pantalla.",
      placement: "top",
    },
  ],
  "/sueno": [
    {
      eyebrow: "Sueño",
      title: "Inicia una siesta o una noche",
      description: "Pulsa el tipo de descanso cuando empiece para tener un cronómetro en curso.",
      target: "sleep-start",
      fallback: "Las acciones para iniciar sueño están en la tarjeta Ahora.",
      placement: "bottom",
    },
    {
      eyebrow: "Sueño",
      title: "Corrige o añade descansos",
      description:
        "También puedes introducir un descanso manualmente si no pudiste iniciar el cronómetro.",
      target: "sleep-manual",
      fallback: "La opción de añadir descanso manualmente está bajo los botones de inicio.",
      placement: "top",
    },
    {
      eyebrow: "Sueño",
      title: "Mira el historial",
      description: "El resumen de hoy y el historial te ayudan a reconocer los ritmos de descanso.",
      target: "sleep-history",
      fallback: "El historial aparece debajo del resumen de hoy.",
      placement: "top",
    },
  ],
  "/viaje": [
    {
      eyebrow: "Viaje",
      title: "Elige cómo ordenar la lista",
      description:
        "Preparar agrupa por categoría; Dónde está organiza lo que guardas por ubicación.",
      target: "travel-mode",
      fallback: "Los modos de organización están en la tarjeta Preparado.",
      placement: "bottom",
    },
    {
      eyebrow: "Viaje",
      title: "Añade lo que falta",
      description:
        "Crea elementos desde el botón + y, si estás preparando, también desde cada categoría.",
      target: "travel-add",
      fallback: "El botón + permite añadir elementos a la lista.",
      placement: "bottom",
    },
    {
      eyebrow: "Viaje",
      title: "Marca y reordena",
      description:
        "Marca lo que ya está listo y arrastra los elementos para tener la lista a tu manera.",
      target: "travel-list",
      fallback: "El checklist se encuentra debajo del resumen de progreso.",
      placement: "top",
    },
  ],
  "/calendario": [
    {
      eyebrow: "Calendario",
      title: "Cambia entre agenda y mes",
      description:
        "La agenda prioriza lo próximo y la vista Mes te da una visión completa del calendario.",
      target: "calendar-view",
      fallback: "Los botones Agenda y Mes están en la primera tarjeta.",
      placement: "bottom",
    },
    {
      eyebrow: "Calendario",
      title: "Muévete por los meses",
      description: "En la vista Mes puedes avanzar o retroceder para localizar eventos con fecha.",
      target: "calendar-month",
      fallback: "Los controles de mes aparecen al seleccionar la vista Mes.",
      placement: "bottom",
    },
    {
      eyebrow: "Calendario",
      title: "Abre cualquier evento",
      description: "Toca un evento para ver sus detalles y saltar al registro relacionado.",
      target: "calendar-events",
      fallback: "Los eventos del peque aparecen agrupados en la agenda.",
      placement: "top",
    },
  ],
  "/ajustes": [
    {
      eyebrow: "Ajustes",
      title: "Gestiona los perfiles",
      description: "Añade, edita o elimina peques y elige el perfil activo desde la cabecera.",
      target: "settings-children",
      fallback: "Tus peques es el primer bloque de Ajustes.",
      placement: "bottom",
    },
    {
      eyebrow: "Ajustes",
      title: "Haz copias periódicas",
      description:
        "Exporta un archivo y guárdalo fuera del dispositivo para poder recuperar tus datos.",
      target: "settings-backup",
      fallback: "Copias de seguridad está debajo de Tus peques.",
      placement: "top",
    },
    {
      eyebrow: "Ajustes",
      title: "Vuelve a consultar esta guía",
      description: "Puedes relanzar el recorrido completo desde este bloque cuando quieras.",
      target: "settings-tutorial",
      fallback: "El botón para repetir el tutorial está en la sección Ayuda.",
      placement: "top",
    },
  ],
};

const totalStepCount = tutorialRoutes.reduce((total, route) => total + steps[route].length, 0);

type Rect = {
  bottom: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
};

function normalizeRoute(pathname: string): TutorialRoute | null {
  const path = pathname.replace(/\/$/, "") || "/";
  return isTutorialRoute(path) ? path : null;
}

export function AppTutorial() {
  const pathname = usePathname();
  const route = normalizeRoute(pathname);
  const router = useRouter();
  const { app, family } = usePeques();
  const replay = family.settings.tutorialReplayRequested ?? false;
  const [replayReady, setReplayReady] = useState(false);
  const [hiddenRoute, setHiddenRoute] = useState<string | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setHiddenRoute(null));
    return () => cancelAnimationFrame(frame);
  }, [route]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (!replay) {
        setReplayReady(false);
      } else if (route === "/") {
        setReplayReady(true);
      } else {
        router.replace("/");
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [replay, route, router]);

  if (!route || (replay && route !== "/" && !replayReady)) return null;
  const seenRoutes = family.settings.tutorialSeenRoutes ?? [];
  const shouldShow = replay || (!seenRoutes.includes(route) && hiddenRoute !== route);
  if (!shouldShow) return null;

  return (
    <TutorialGuide
      app={app}
      isReplay={replay}
      key={`${replay ? "replay" : "visit"}:${route}`}
      onDismiss={() => setHiddenRoute(route)}
      route={route}
      seenRoutes={seenRoutes}
    />
  );
}

function TutorialGuide({
  app,
  isReplay,
  onDismiss,
  route,
  seenRoutes,
}: {
  app: PequesApp;
  isReplay: boolean;
  onDismiss: () => void;
  route: TutorialRoute;
  seenRoutes: TutorialRoute[];
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const routeSteps = steps[route];
  const step = routeSteps[stepIndex] ?? routeSteps[0];
  const routeIndex = tutorialRoutes.indexOf(route);
  const globalStep =
    tutorialRoutes.slice(0, routeIndex).reduce((total, item) => total + steps[item].length, 0) +
    stepIndex +
    1;
  const isLastStep = stepIndex === routeSteps.length - 1;

  useEffect(() => {
    primaryRef.current?.focus();
  }, [stepIndex, route]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !pending) {
        event.preventDefault();
        onDismiss();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss, pending]);

  useEffect(() => {
    let frame = 0;
    const updateTarget = () => {
      const primary = document.querySelector<HTMLElement>(
        `[data-tutorial-target="${step.target}"]`,
      );
      const fallback = document.querySelector<HTMLElement>(
        `[data-tutorial-section="${route === "/" ? "home" : route.slice(1)}"]`,
      );
      const element = primary ?? fallback;
      setUsingFallback(!primary && Boolean(element));
      if (!element) {
        setTargetRect(null);
        return;
      }
      const rect = element.getBoundingClientRect();
      if (rect.top < 74 || rect.bottom > window.innerHeight - 110) {
        element.scrollIntoView({ block: "center", behavior: "auto" });
        frame = requestAnimationFrame(updateTarget);
        return;
      }
      setTargetRect({
        bottom: rect.bottom,
        height: rect.height,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        width: rect.width,
      });
    };
    frame = requestAnimationFrame(updateTarget);
    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget, true);
    const observer =
      typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateTarget);
    observer?.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget, true);
      observer?.disconnect();
    };
  }, [route, step.target]);

  async function saveProgress(nextRoutes: readonly TutorialRoute[], replayRequested: boolean) {
    setPending(true);
    setError(null);
    try {
      await app.settings.update({
        tutorialReplayRequested: replayRequested,
        tutorialSeenRoutes: [...new Set(nextRoutes)],
      });
      return true;
    } catch {
      setError("No se pudo guardar el progreso del tutorial. Inténtalo de nuevo.");
      return false;
    } finally {
      setPending(false);
    }
  }

  async function finishRoute() {
    const nextSeen = [...new Set([...seenRoutes, route])];
    if (!isReplay) {
      if (await saveProgress(nextSeen, false)) onDismiss();
      return;
    }
    const nextRoute = tutorialRoutes[routeIndex + 1];
    if (nextRoute) {
      if (await saveProgress(nextSeen, true)) router.push(nextRoute);
    } else if (await saveProgress(tutorialRoutes, false)) {
      onDismiss();
    }
  }

  async function skipTutorial() {
    if (await saveProgress(tutorialRoutes, false)) onDismiss();
  }

  function nextStep() {
    if (isLastStep) {
      void finishRoute();
    } else {
      setStepIndex((current) => current + 1);
    }
  }

  function trapFocus(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab") return;
    const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
      "button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])",
    );
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  const bubblePosition = targetRect
    ? getBubblePosition(targetRect, step.placement)
    : { left: "50%", top: "50%", transform: "translate(-50%, -50%)" };
  return (
    <div className={styles.tutorialBackdrop} role="presentation">
      <div aria-hidden="true" className={styles.tutorialScrim} />
      {targetRect && (
        <div
          aria-hidden="true"
          className={styles.tutorialSpotlight}
          style={{
            height: `${targetRect.height + 12}px`,
            left: `${targetRect.left - 6}px`,
            top: `${targetRect.top - 6}px`,
            width: `${targetRect.width + 12}px`,
          }}
        />
      )}
      <section
        aria-describedby="tutorial-description"
        aria-labelledby="tutorial-title"
        aria-modal="true"
        className={styles.tutorialDialog}
        ref={dialogRef}
        role="dialog"
        style={bubblePosition}
        onKeyDown={trapFocus}
      >
        <p className={styles.tutorialProgress}>
          Paso {globalStep} de {totalStepCount} · {step.eyebrow}
        </p>
        <h2 id="tutorial-title">{step.title}</h2>
        <p id="tutorial-description">{step.description}</p>
        {usingFallback && <p className={styles.tutorialFallback}>{step.fallback}</p>}
        {error && <p role="alert">{error}</p>}
        <div className={styles.tutorialActions}>
          <button
            className={styles.tutorialSecondary}
            disabled={pending || stepIndex === 0}
            onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
            type="button"
          >
            <ActionIcon name="arrow-left" size={17} /> Atrás
          </button>
          <button
            className={styles.tutorialPrimary}
            disabled={pending}
            onClick={nextStep}
            ref={primaryRef}
            type="button"
          >
            <ActionIcon name="arrow-right" size={17} />
            {pending ? "Guardando…" : isLastStep ? "Terminar" : "Siguiente"}
          </button>
        </div>
        <div className={styles.tutorialFooterActions}>
          <button
            className={styles.tutorialSkip}
            disabled={pending}
            onClick={onDismiss}
            type="button"
          >
            <ActionIcon name="x" size={17} /> Ahora no
          </button>
          <button
            className={styles.tutorialSkip}
            disabled={pending}
            onClick={() => void skipTutorial()}
            type="button"
          >
            <ActionIcon name="arrow-right" size={17} /> Saltar tutorial
          </button>
        </div>
      </section>
    </div>
  );
}

function getBubblePosition(rect: Rect, placement: TutorialPlacement): CSSProperties {
  const width = Math.min(340, window.innerWidth - 24);
  const gap = 18;
  let left = rect.left + rect.width / 2 - width / 2;
  let top = rect.bottom + gap;
  if (placement === "top") top = rect.top - 236 - gap;
  if (placement === "left") {
    left = rect.left - width - gap;
    top = rect.top + rect.height / 2 - 118;
  }
  if (placement === "right") {
    left = rect.right + gap;
    top = rect.top + rect.height / 2 - 118;
  }
  return {
    left: `${Math.max(12, Math.min(left, window.innerWidth - width - 12))}px`,
    top: `${Math.max(12, Math.min(top, window.innerHeight - 250))}px`,
  };
}

export function TutorialRestartButton() {
  const { app } = usePeques();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function restart() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await app.settings.update({ tutorialReplayRequested: true, tutorialSeenRoutes: [] });
    } catch {
      setError("No se pudo preparar el tutorial. Inténtalo de nuevo.");
    } finally {
      setPending(false);
    }
  }
  return (
    <div>
      <button
        className="text-button"
        data-tutorial-target="settings-tutorial"
        disabled={pending}
        onClick={() => void restart()}
        type="button"
      >
        <ActionIcon name="refresh" size={18} />
        {pending ? "Preparando tutorial…" : "Ver tutorial de nuevo"}
      </button>
      {error && <p role="alert">{error}</p>}
    </div>
  );
}
