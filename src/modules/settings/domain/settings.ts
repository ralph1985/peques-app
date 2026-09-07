export const tutorialRoutes = [
  "/",
  "/peso",
  "/vacunas",
  "/sueno",
  "/viaje",
  "/calendario",
  "/ajustes",
] as const;

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
  };
}
