"use client";
import { usePeques } from "@/shared/ui/app-context";
import { LiveAge } from "@/modules/profile/ui/live-age";
import { useState } from "react";

export default function Home() {
  const { family } = usePeques();
  const child = family.activeChild;
  const [now] = useState(() => new Date().toISOString());
  if (!child) return null;
  return (
    <main className="content-page">
      <section className="local-panel">
        <h1>{child.name}</h1>
        <LiveAge profile={child} initialNow={now} />
        <p>
          Nacimiento: {child.birthDate}
          {child.birthTime ? ` · ${child.birthTime}` : ""}
        </p>
        {child.healthId && <p>Identificador sanitario: {child.healthId}</p>}
      </section>
    </main>
  );
}
