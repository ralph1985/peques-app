import { localDate } from "@/shared/domain/validation";
import type { HealthRegion } from "@/modules/settings/domain/settings";
export type PlannedVaccineDose = {
  id: string;
  childId: string;
  vaccineName: string;
  doseLabel: string;
  plannedDate: string | null;
  ageLabel: string | null;
  notes: string | null;
};

export type AppliedVaccineDose = {
  id: string;
  childId: string;
  plannedDoseId: string | null;
  appliedOn: string;
  vaccineName: string;
  doseLabel: string;
  place: string;
  lot: string | null;
  notes: string | null;
};

export const vaccineDoseStatuses = ["retrasada", "proxima", "pendiente", "aplicada"] as const;

export type VaccineDoseStatus = (typeof vaccineDoseStatuses)[number];

export type PlannedVaccineDoseWithStatus = PlannedVaccineDose & {
  application: AppliedVaccineDose | null;
  appliedOn: string | null;
  status: VaccineDoseStatus;
};

export type PlannedVaccineDoseGroups = Record<VaccineDoseStatus, PlannedVaccineDoseWithStatus[]>;

export type NewPlannedVaccineDose = Omit<PlannedVaccineDose, "id" | "childId">;

export type NewAppliedVaccineDose = Omit<AppliedVaccineDose, "id" | "childId">;

export type MadridCalendarDoseDefinition = {
  vaccineName: string;
  doseLabel: string;
  ageLabel: string;
  monthsFromBirth?: number;
  confirmCampaign?: boolean;
  notes?: string;
};

export type VaccineCalendarSource = {
  region: HealthRegion;
  name: string;
  verifiedOn: string;
  posterUrl: string;
  technicalDocumentUrl: string;
};

export class PlannedVaccineDoseValidationError extends Error {
  constructor(readonly issues: string[]) {
    super(issues.join(" "));
    this.name = "PlannedVaccineDoseValidationError";
  }
}

export class AppliedVaccineDoseValidationError extends Error {
  constructor(readonly issues: string[]) {
    super(issues.join(" "));
    this.name = "AppliedVaccineDoseValidationError";
  }
}

export const madridVaccineCalendarSource: VaccineCalendarSource = {
  region: "madrid",
  name: "Calendario de vacunacion/inmunizacion a lo largo de toda la vida 2026. Comunidad de Madrid.",
  verifiedOn: "2026-07-18",
  posterUrl: "https://www.comunidad.madrid/publicacion/ref/51768",
  technicalDocumentUrl: "https://www.comunidad.madrid/publicacion/ref/51747",
} as const;

export const castillaLaManchaVaccineCalendarSource: VaccineCalendarSource = {
  region: "castillaLaMancha",
  name: "Calendario de vacunaciones e inmunizaciones a lo largo de toda la vida 2026. Castilla-La Mancha.",
  verifiedOn: "2026-09-07",
  posterUrl: "https://sanidad.castillalamancha.es/ciudadanos/vacunacion/calendario-vacunaciones",
  technicalDocumentUrl:
    "https://sanidad.castillalamancha.es/sites/sescam.castillalamancha.es/files/documentos/pdf/20260107/20251230_documento_tecnico_calendario_sistematico_2026.pdf",
};

export const vaccineCalendarSources: Record<HealthRegion, VaccineCalendarSource> = {
  madrid: madridVaccineCalendarSource,
  castillaLaMancha: castillaLaManchaVaccineCalendarSource,
};

export const madridInitialCalendarDefinitions: MadridCalendarDoseDefinition[] = [
  {
    vaccineName: "Inmunizacion frente a VRS",
    doseLabel: "Campaña por confirmar",
    ageLabel: "Campaña",
    confirmCampaign: true,
    notes: "Consultar con el centro de salud la indicación y fecha de campaña.",
  },
  {
    vaccineName: "Hexavalente (DTPa-VPI-Hib-HB)",
    doseLabel: "1.ª dosis",
    ageLabel: "2 meses",
    monthsFromBirth: 2,
  },
  {
    vaccineName: "Neumococo conjugada (VNC)",
    doseLabel: "1.ª dosis",
    ageLabel: "2 meses",
    monthsFromBirth: 2,
  },
  {
    vaccineName: "Meningococo B",
    doseLabel: "1.ª dosis",
    ageLabel: "2 meses",
    monthsFromBirth: 2,
  },
  {
    vaccineName: "Rotavirus",
    doseLabel: "1.ª dosis",
    ageLabel: "2 meses",
    monthsFromBirth: 2,
  },
  {
    vaccineName: "Hexavalente (DTPa-VPI-Hib-HB)",
    doseLabel: "2.ª dosis",
    ageLabel: "4 meses",
    monthsFromBirth: 4,
  },
  {
    vaccineName: "Neumococo conjugada (VNC)",
    doseLabel: "2.ª dosis",
    ageLabel: "4 meses",
    monthsFromBirth: 4,
  },
  {
    vaccineName: "Meningococo B",
    doseLabel: "2.ª dosis",
    ageLabel: "4 meses",
    monthsFromBirth: 4,
  },
  {
    vaccineName: "Meningococo C",
    doseLabel: "Dosis infantil",
    ageLabel: "4 meses",
    monthsFromBirth: 4,
  },
  {
    vaccineName: "Rotavirus",
    doseLabel: "2.ª dosis",
    ageLabel: "4 meses",
    monthsFromBirth: 4,
  },
  {
    vaccineName: "Gripe",
    doseLabel: "Campaña por confirmar",
    ageLabel: "Desde 6 meses",
    monthsFromBirth: 6,
    notes: "Vacunacion anual entre 6 y 59 meses. Confirmar fecha exacta de campaña.",
  },
  {
    vaccineName: "Hexavalente (DTPa-VPI-Hib-HB)",
    doseLabel: "3.ª dosis",
    ageLabel: "11 meses",
    monthsFromBirth: 11,
  },
  {
    vaccineName: "Neumococo conjugada (VNC)",
    doseLabel: "3.ª dosis",
    ageLabel: "11 meses",
    monthsFromBirth: 11,
  },
  {
    vaccineName: "Meningococo B",
    doseLabel: "3.ª dosis",
    ageLabel: "12 meses",
    monthsFromBirth: 12,
  },
  {
    vaccineName: "Meningococo ACWY",
    doseLabel: "Dosis 12 meses",
    ageLabel: "12 meses",
    monthsFromBirth: 12,
    notes: "Desde 2026 sustituye a MenC a los 12 meses.",
  },
  {
    vaccineName: "Triple virica (TV)",
    doseLabel: "1.ª dosis",
    ageLabel: "12 meses",
    monthsFromBirth: 12,
  },
  {
    vaccineName: "Varicela (VVZ)",
    doseLabel: "1.ª dosis",
    ageLabel: "15 meses",
    monthsFromBirth: 15,
  },
  {
    vaccineName: "Tetraviral (SRPV)",
    doseLabel: "2.ª dosis TV+VVZ",
    ageLabel: "3 años",
    monthsFromBirth: 36,
  },
  {
    vaccineName: "DTPa-VPI",
    doseLabel: "Recuerdo",
    ageLabel: "6 años",
    monthsFromBirth: 72,
  },
  {
    vaccineName: "Meningococo ACWY",
    doseLabel: "Recuerdo",
    ageLabel: "12 años",
    monthsFromBirth: 144,
  },
  {
    vaccineName: "Virus del Papiloma Humano (VPH)",
    doseLabel: "Dosis unica",
    ageLabel: "12 años",
    monthsFromBirth: 144,
  },
  {
    vaccineName: "dTpa",
    doseLabel: "Recuerdo",
    ageLabel: "14 años",
    monthsFromBirth: 168,
  },
];

export function buildMadridInitialVaccinePlan(birthDate: string): NewPlannedVaccineDose[] {
  return buildInitialVaccinePlan(birthDate, "madrid");
}

export function buildInitialVaccinePlan(
  birthDate: string,
  region: HealthRegion,
): NewPlannedVaccineDose[] {
  const definitions =
    region === "castillaLaMancha"
      ? madridInitialCalendarDefinitions.map((definition) =>
          definition.vaccineName === "Meningococo C"
            ? {
                ...definition,
                vaccineName: "Meningococo ACWY",
                notes: "Calendario de Castilla-La Mancha 2026.",
              }
            : definition,
        )
      : madridInitialCalendarDefinitions;
  return definitions
    .map((definition) =>
      createPlannedVaccineDose({
        vaccineName: definition.vaccineName,
        doseLabel: definition.doseLabel,
        plannedDate: calculatePlannedDate(birthDate, definition),
        ageLabel: definition.ageLabel,
        notes: definition.notes ?? null,
      }),
    )
    .sort((left, right) => (left.plannedDate ?? "9999").localeCompare(right.plannedDate ?? "9999"));
}

export function createPlannedVaccineDose(input: NewPlannedVaccineDose): NewPlannedVaccineDose {
  const issues = validatePlannedVaccineDose(input);

  if (issues.length > 0) {
    throw new PlannedVaccineDoseValidationError(issues);
  }

  return {
    vaccineName: input.vaccineName.trim(),
    doseLabel: input.doseLabel.trim(),
    plannedDate: input.plannedDate,
    ageLabel: input.ageLabel?.trim() || null,
    notes: input.notes?.trim() || null,
  };
}

export function createAppliedVaccineDose(input: NewAppliedVaccineDose): NewAppliedVaccineDose {
  const issues = validateAppliedVaccineDose(input);

  if (issues.length > 0) {
    throw new AppliedVaccineDoseValidationError(issues);
  }

  return {
    plannedDoseId: input.plannedDoseId || null,
    appliedOn: input.appliedOn,
    vaccineName: input.vaccineName.trim(),
    doseLabel: input.doseLabel.trim(),
    place: input.place.trim(),
    lot: input.lot?.trim() || null,
    notes: input.notes?.trim() || null,
  };
}

export function calculatePlannedDate(
  birthDate: string,
  definition: MadridCalendarDoseDefinition,
): string | null {
  if (definition.confirmCampaign) return null;

  if (typeof definition.monthsFromBirth !== "number") {
    throw new Error("Missing vaccine calendar date rule");
  }

  return addMonths(birthDate, definition.monthsFromBirth);
}

export function assignPlannedVaccineDoseStatuses(
  doses: PlannedVaccineDose[],
  applications: AppliedVaccineDose[],
  today: Date,
): PlannedVaccineDoseWithStatus[] {
  const applicationsByPlannedDose = new Map(
    applications
      .filter((application) => application.plannedDoseId)
      .map((application) => [application.plannedDoseId, application]),
  );

  return doses
    .map((dose) => {
      const application = applicationsByPlannedDose.get(dose.id);
      const status = getPlannedVaccineDoseStatus(dose, application, today);

      return {
        ...dose,
        application: application ?? null,
        appliedOn: application?.appliedOn ?? null,
        status,
      };
    })
    .sort(comparePlannedDoses);
}

export function groupPlannedVaccineDosesByStatus(
  doses: PlannedVaccineDoseWithStatus[],
): PlannedVaccineDoseGroups {
  return {
    retrasada: doses.filter((dose) => dose.status === "retrasada"),
    proxima: doses.filter((dose) => dose.status === "proxima"),
    pendiente: doses.filter((dose) => dose.status === "pendiente"),
    aplicada: doses.filter((dose) => dose.status === "aplicada"),
  };
}

export function getVaccineDoseStatusLabel(status: VaccineDoseStatus): string {
  const labels: Record<VaccineDoseStatus, string> = {
    retrasada: "Retrasada",
    proxima: "Próxima",
    pendiente: "Pendiente",
    aplicada: "Aplicada",
  };

  return labels[status];
}

export function getPlannedVaccineDoseStatus(
  dose: PlannedVaccineDose,
  application: AppliedVaccineDose | undefined,
  today: Date,
): VaccineDoseStatus {
  if (application) {
    return "aplicada";
  }

  if (dose.plannedDate === null) return "pendiente";
  const todayIso = localDate(today);

  if (dose.plannedDate < todayIso) {
    return "retrasada";
  }

  return daysBetween(todayIso, dose.plannedDate) <= 14 ? "proxima" : "pendiente";
}

function validatePlannedVaccineDose(input: NewPlannedVaccineDose): string[] {
  const issues: string[] = [];

  if (!input.vaccineName.trim()) {
    issues.push("La vacuna es obligatoria.");
  }

  if (!input.doseLabel.trim()) {
    issues.push("La dosis es obligatoria.");
  }

  if (input.plannedDate !== null && !isIsoDate(input.plannedDate)) {
    issues.push("La fecha planificada no es válida.");
  }

  return issues;
}

function validateAppliedVaccineDose(input: NewAppliedVaccineDose): string[] {
  const issues: string[] = [];

  if (!isIsoDate(input.appliedOn)) {
    issues.push("La fecha de aplicación no es válida.");
  }

  if (!input.vaccineName.trim()) {
    issues.push("La vacuna es obligatoria.");
  }

  if (!input.doseLabel.trim()) {
    issues.push("La dosis es obligatoria.");
  }

  if (!input.place.trim()) {
    issues.push("El lugar de vacunación es obligatorio.");
  }

  return issues;
}

function comparePlannedDoses(
  left: PlannedVaccineDoseWithStatus,
  right: PlannedVaccineDoseWithStatus,
): number {
  const dateComparison = (left.plannedDate ?? "9999").localeCompare(right.plannedDate ?? "9999");

  if (dateComparison !== 0) {
    return dateComparison;
  }

  return left.vaccineName.localeCompare(right.vaccineName, "es");
}

function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  return Math.floor((end.getTime() - start.getTime()) / 86_400_000);
}

function addMonths(date: string, months: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const target = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));

  return target.toISOString().slice(0, 10);
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
