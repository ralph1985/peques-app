"use client";
import { createContext, useContext } from "react";
import type { FamilyState, PequesApp } from "@/shared/application/peques-app";
export const AppContext = createContext<{ app: PequesApp; family: FamilyState } | null>(null);
export function usePeques() {
  const value = useContext(AppContext);
  if (!value) throw new Error("Peques provider missing");
  return value;
}
