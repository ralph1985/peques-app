import type { Child } from "@/modules/profile/domain/child";
import type { ChildRepository } from "@/modules/profile/application/child-repository";
import type { AppSettings } from "@/modules/settings/domain/settings";
import type { SettingsRepository } from "@/modules/settings/application/settings-repository";
import type { BackupRepository } from "@/modules/backup/application/backup-repository";
import type { WeightRepository } from "@/modules/weight/application/weight-repository";
import type { SleepRepository } from "@/modules/sleep/application/sleep-repository";
import type { VaccinePlanRepository } from "@/modules/vaccines/application/vaccine-plan-repository";
import type { TravelChecklistRepository } from "@/modules/travel/application/travel-checklist-repository";
import type { WeightEntry } from "@/modules/weight/domain/weight-entry";
import type { SleepEntry } from "@/modules/sleep/domain/sleep-entry";
import type {
  PlannedVaccineDose,
  AppliedVaccineDose,
} from "@/modules/vaccines/domain/vaccine-calendar";
import type { TravelChecklist } from "@/modules/travel/application/list-travel-checklist";

export type FamilyState = { children: Child[]; activeChild: Child | null; settings: AppSettings };
export type ChildData = {
  weights: WeightEntry[];
  sleeps: SleepEntry[];
  planned: PlannedVaccineDose[];
  applied: AppliedVaccineDose[];
};
export type Watch<T> = (next: (data: T) => void, error: (error: unknown) => void) => () => void;
export interface PequesApp {
  children: ChildRepository;
  settings: SettingsRepository;
  backup: BackupRepository;
  travel: TravelChecklistRepository;
  forChild(childId: string): {
    weight: WeightRepository;
    sleep: SleepRepository;
    vaccines: VaccinePlanRepository;
  };
  watchFamily: Watch<FamilyState>;
  watchChild(childId: string): Watch<ChildData>;
  watchTravel: Watch<TravelChecklist>;
  watchAllChildren: Watch<{ child: Child; data: ChildData }[]>;
}
