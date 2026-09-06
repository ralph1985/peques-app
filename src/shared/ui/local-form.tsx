"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { LoadingButton } from "./pending-submit-button";
import styles from "./local-form.module.css";

export function errorMessage(error: unknown): string {
  if (
    error instanceof Error &&
    (error.name.endsWith("ValidationError") || error.name === "ValidationError")
  )
    return error.message;
  return "No se pudo guardar. Revisa los datos y el almacenamiento disponible e inténtalo de nuevo.";
}

export function LocalForm({
  action,
  children,
  submitLabel = "Guardar",
  onSuccess,
  onCancel,
  className,
}: {
  action: (data: FormData) => void | Promise<unknown>;
  children: ReactNode;
  submitLabel?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const data = new FormData(event.currentTarget);
    submitting.current = true;
    setPending(true);
    setError(null);
    try {
      await action(data);
      onSuccess?.();
    } catch (reason) {
      setError(errorMessage(reason));
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }
  return (
    <form onSubmit={submit} className={className ?? styles.form} aria-busy={pending}>
      <fieldset disabled={pending} className={styles.fields}>
        {children}
      </fieldset>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <div className={styles.actions}>
        {onCancel && (
          <button type="button" onClick={onCancel} disabled={pending} className={styles.secondary}>
            Cancelar
          </button>
        )}
        <LoadingButton type="submit" pending={pending} className={styles.primary}>
          {submitLabel}
        </LoadingButton>
      </div>
    </form>
  );
}

export function field(data: FormData, name: string): string {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
}
