import type { NewSleepEntry, SleepEntry, SleepKind } from "../domain/sleep-entry";
import type { ToggleSleepResult } from "./toggle-sleep-entry";

export type SleepRepository = {
  toggleSleepEntry(kind: SleepKind, now: string): Promise<ToggleSleepResult>;
  listSleepEntries(): Promise<SleepEntry[]>;
  getActiveSleepEntry(): Promise<SleepEntry | null>;
  createSleepEntry(entry: NewSleepEntry): Promise<SleepEntry>;
  updateSleepEntry(id: string, entry: NewSleepEntry): Promise<SleepEntry>;
  deleteSleepEntry(id: string): Promise<void>;
};
