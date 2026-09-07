export const tutorialRoutes = [
  "/",
  "/peso",
  "/vacunas",
  "/sueno",
  "/viaje",
  "/calendario",
  "/ajustes",
] as const;

export const healthRegions = ["madrid", "castillaLaMancha"] as const;
export type HealthRegion = (typeof healthRegions)[number];

export const healthRegionLabels: Record<HealthRegion, string> = {
  madrid: "Comunidad de Madrid",
  castillaLaMancha: "Castilla-La Mancha",
};

export type NextAppointment = {
  date: string;
  title: string;
  place: string;
  notes: string | null;
};

export type ConsultationQuestion = {
  id: string;
  text: string;
  createdAt: string;
  completed: boolean;
};

export type TutorialRoute = (typeof tutorialRoutes)[number];

export function isTutorialRoute(value: unknown): value is TutorialRoute {
  return typeof value === "string" && tutorialRoutes.includes(value as TutorialRoute);
}

export type AppSettings = {
  id: "main";
  firstUsedAt: string;
  activeChildId: string | null;
  lastExportedAt: string | null;
  tutorialSeenRoutes: TutorialRoute[];
  tutorialReplayRequested: boolean;
  travelView: "prepare" | "location";
  vaccineView: "status" | "timeline";
  calendarAllChildren: boolean;
  healthRegion: HealthRegion;
  nextAppointment: NextAppointment | null;
  consultationQuestions: ConsultationQuestion[];
};

export function createDefaultSettings(firstUsedAt = new Date().toISOString()): AppSettings {
  return {
    id: "main",
    firstUsedAt,
    activeChildId: null,
    lastExportedAt: null,
    tutorialSeenRoutes: [],
    tutorialReplayRequested: false,
    travelView: "prepare",
    vaccineView: "status",
    calendarAllChildren: false,
    healthRegion: "madrid",
    nextAppointment: null,
    consultationQuestions: [],
  };
}
