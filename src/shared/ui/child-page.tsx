"use client";
import { useMemo, type ReactNode } from "react";
import { usePeques } from "./app-context";
import { useLocalData } from "./use-local-data";
import type { Child } from "@/modules/profile/domain/child";
import type { ChildData } from "@/shared/application/peques-app";

export function ChildPage({
  title,
  children,
}: {
  title: string;
  children: (child: Child, data: ChildData) => ReactNode;
}) {
  const { app, family } = usePeques();
  const child = family.activeChild;
  const watch = useMemo(() => app.watchChild(child?.id ?? ""), [app, child?.id]);
  const state = useLocalData(watch);
  return (
    <main className="content-page">
      <h1>{title}</h1>
      {state?.error ? (
        <p role="alert">
          No se pudieron leer los datos locales. Reabre la aplicación para intentarlo de nuevo.
        </p>
      ) : child && state?.data ? (
        children(child, state.data)
      ) : (
        <p role="status">Cargando…</p>
      )}
    </main>
  );
}
