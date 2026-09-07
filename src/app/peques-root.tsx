"use client";
import { useState, type ReactNode } from "react";
import { createPequesApp } from "@/shared/infrastructure/local/create-peques-app";
import { AppContext } from "@/shared/ui/app-context";
import { useLocalData } from "@/shared/ui/use-local-data";
import { AppShell } from "./(app)/_components/app-shell";
import { ChildForm } from "@/modules/profile/ui/child-form";
import { BackupPanel } from "@/modules/backup/ui/backup-panel";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { LocalForm, field } from "@/shared/ui/local-form";
import styles from "./(app)/peso/page.module.css";

export function PequesRoot({ children }: { children: ReactNode }) {
  const [app] = useState(createPequesApp);
  const state = useLocalData(app.watchFamily);
  const [selector, setSelector] = useState(false);
  const [adding, setAdding] = useState(false);
  if (state?.error)
    return (
      <main className="welcome">
        <p className="kicker">Peques</p>
        <h1>No podemos abrir tus datos</h1>
        <p>
          No se ha borrado nada. Comprueba que el navegador permite el almacenamiento del sitio y
          que tienes espacio disponible.
        </p>
        <button onClick={() => window.location.reload()}>Reintentar</button>
      </main>
    );
  if (!state?.data)
    return (
      <main className="welcome" aria-busy="true">
        <p className="kicker">Peques</p>
        <p role="status">Abriendo tus datos…</p>
      </main>
    );
  const family = state.data;
  return (
    <AppContext value={{ app, family }}>
      {!family.children.length ? (
        <main className="onboarding">
          <p className="kicker">Peques</p>
          <h1>Añade tu primer hijo</h1>
          <p>Su día a día, siempre a mano. Todo se guarda en este dispositivo.</p>
          <section className="local-panel">
            <ChildForm />
          </section>
          <BackupPanel />
        </main>
      ) : (
        <AppShell>
          <header className="child-header">
            <span className="kicker">Peques</span>
            <button
              data-tutorial-target="home-child-selector"
              type="button"
              onClick={() => setSelector(true)}
              aria-label={`Cambiar hijo: ${family.activeChild?.name ?? "Seleccionar"}`}
            >
              {family.activeChild?.name ?? "Seleccionar hijo"}
              <span aria-hidden="true">⌄</span>
            </button>
          </header>
          <div key={family.activeChild?.id ?? "none"}>{children}</div>
        </AppShell>
      )}
      {selector && (
        <BottomSheet
          ariaLabel="Seleccionar hijo"
          labelledBy="selector-title"
          onClose={() => {
            setSelector(false);
            setAdding(false);
          }}
          styles={styles}
        >
          <div className="sheet-content">
            <h2 id="selector-title">{adding ? "Añadir hijo" : "Tus peques"}</h2>
            {adding ? (
              <ChildForm
                onDone={() => {
                  setSelector(false);
                  setAdding(false);
                }}
                onCancel={() => setAdding(false)}
              />
            ) : (
              <>
                <LocalForm
                  submitLabel="Seleccionar"
                  action={(data) => app.children.select(field(data, "childId"))}
                  onSuccess={() => setSelector(false)}
                >
                  <label>
                    Hijo
                    <select name="childId" defaultValue={family.activeChild?.id}>
                      {family.children.map((child) => (
                        <option key={child.id} value={child.id}>
                          {child.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </LocalForm>
                <button className="text-button" onClick={() => setAdding(true)}>
                  Añadir otro hijo
                </button>
              </>
            )}
          </div>
        </BottomSheet>
      )}
    </AppContext>
  );
}
