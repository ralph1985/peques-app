"use client";

import { useMemo } from "react";
import { ConsultationPanel } from "@/modules/consultation/ui/consultation-panel";
import { usePeques } from "@/shared/ui/app-context";
import { useLocalData } from "@/shared/ui/use-local-data";

export default function ConsultationPage() {
  const { app, family } = usePeques();
  const child = family.activeChild;
  const watch = useMemo(() => app.watchChild(child?.id ?? ""), [app, child?.id]);
  const state = useLocalData(watch);
  if (!child || !state?.data)
    return (
      <main className="content-page">
        <h1>Consulta</h1>
        <p role="status">Cargando resumen…</p>
      </main>
    );
  return <ConsultationPanel child={child} data={state.data} />;
}
