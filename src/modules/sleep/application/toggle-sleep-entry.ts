import type { SleepRepository } from "./sleep-repository";
import type { SleepEntry, SleepKind } from "../domain/sleep-entry";

export type ToggleSleepResult = {
  action: "started" | "stopped";
  entry: SleepEntry;
};

export async function toggleSleepEntry(
  repository: Pick<SleepRepository, "toggleSleepEntry">,
  kind: SleepKind,
  now = new Date().toISOString(),
): Promise<ToggleSleepResult> {
  return repository.toggleSleepEntry(kind, now);
}
