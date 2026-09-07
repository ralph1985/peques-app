import type { AppSettings, ConsultationQuestion, NextAppointment } from "../domain/settings";
export type SettingsInput = Pick<
  AppSettings,
  | "travelView"
  | "vaccineView"
  | "calendarAllChildren"
  | "tutorialSeenRoutes"
  | "tutorialReplayRequested"
  | "healthRegion"
  | "nextAppointment"
  | "consultationQuestions"
>;
export interface SettingsRepository {
  read(): Promise<AppSettings>;
  update(input: Partial<SettingsInput>): Promise<void>;
  recordExport(timestamp: string): Promise<void>;
  updateAppointment(appointment: NextAppointment | null): Promise<void>;
  addConsultationQuestion(text: string): Promise<ConsultationQuestion>;
  toggleConsultationQuestion(id: string, completed: boolean): Promise<void>;
  deleteConsultationQuestion(id: string): Promise<void>;
}
