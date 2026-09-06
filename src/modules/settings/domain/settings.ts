export type AppSettings = {
  id: "main";
  activeChildId: string | null;
  lastExportedAt: string | null;
  travelView: "prepare" | "location";
  vaccineView: "status" | "timeline";
  calendarAllChildren: boolean;
};

export const defaultSettings: AppSettings = {
  id: "main",
  activeChildId: null,
  lastExportedAt: null,
  travelView: "prepare",
  vaccineView: "status",
  calendarAllChildren: false,
};
