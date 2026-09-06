"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePeques } from "@/shared/ui/app-context";
import { toggleSleepEntry } from "@/modules/sleep/application/toggle-sleep-entry";
import { errorMessage } from "@/shared/ui/local-form";

export default function SleepShortcutPage() {
  const { app, family } = usePeques();
  const router = useRouter();
  const triggered = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const childId = family.activeChild?.id;
  useEffect(() => {
    if (!childId || triggered.current) return;
    triggered.current = true;
    const kind =
      new URLSearchParams(window.location.search).get("type") === "noche" ? "night" : "nap";
    void toggleSleepEntry(app.forChild(childId).sleep, kind)
      .then(() => {
        // Leave the action URL once consumed: refresh and child selection must not toggle again.
        router.replace("/sueno/");
      })
      .catch((cause) => setError(errorMessage(cause)));
  }, [app, childId, router]);
  return (
    <main className="content-page">
      <h1>Atajo de sueño</h1>
      {error ? (
        <p role="alert">{error}</p>
      ) : (
        <p role="status">Registrando sueño de {family.activeChild?.name}…</p>
      )}
      <Link href="/sueno/">Abrir Sueño</Link>
    </main>
  );
}
