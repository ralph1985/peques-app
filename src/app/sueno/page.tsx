"use client";
import { ChildPage } from "@/shared/ui/child-page";
import { usePeques } from "@/shared/ui/app-context";
import { SleepView } from "@/modules/sleep/ui/sleep-view";
import { registerSleepEntry } from "@/modules/sleep/application/create-sleep-entry";
import { updateSleepEntry } from "@/modules/sleep/application/update-sleep-entry";
import { deleteSleepEntry } from "@/modules/sleep/application/delete-sleep-entry";
import { isSleepKind } from "@/modules/sleep/domain/sleep-entry";
import { field } from "@/shared/ui/local-form";
import { assert } from "@/shared/domain/validation";

function input(data: FormData) {
  const kind = field(data, "kind");
  assert(isSleepKind(kind), "Tipo de sueño no válido.");
  return { kind, startedAt: field(data, "startedAt"), endedAt: field(data, "endedAt") || null };
}
export default function SleepPage() {
  const { app } = usePeques();
  return (
    <ChildPage title="Sueño">
      {(child, data) => {
        const repository = app.forChild(child.id).sleep;
        return (
          <SleepView
            entries={data.sleeps}
            createAction={async (form) => {
              await registerSleepEntry(repository, input(form));
            }}
            updateAction={async (form) => {
              await updateSleepEntry(repository, field(form, "id"), input(form));
            }}
            deleteAction={(form) => deleteSleepEntry(repository, field(form, "id"))}
          />
        );
      }}
    </ChildPage>
  );
}
