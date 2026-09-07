import type { AppSettings } from "../domain/settings";
export type SettingsInput = Pick<
  AppSettings,
  "travelView" | "vaccineView" | "calendarAllChildren" | "tutorialSeenRoutes"
>;
export interface SettingsRepository {
  read(): Promise<AppSettings>;
  update(input: Partial<SettingsInput>): Promise<void>;
  recordExport(timestamp: string): Promise<void>;
}
