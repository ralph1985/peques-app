"use client";
import { ChildPage } from "@/shared/ui/child-page";
import { VaccineView } from "@/modules/vaccines/ui/vaccine-view";
export default function VaccinePage() {
  return (
    <ChildPage title="Vacunas">
      {(child, data) => <VaccineView childId={child.id} data={data} />}
    </ChildPage>
  );
}
