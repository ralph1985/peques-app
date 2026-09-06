import type { PequesBackup } from "../domain/backup";
export interface BackupRepository {
  export(): Promise<PequesBackup>;
  restore(backup: PequesBackup): Promise<void>;
}
