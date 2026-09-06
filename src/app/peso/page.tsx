"use client";
import { ChildPage } from "@/shared/ui/child-page";
import { WeightView } from "@/modules/weight/ui/weight-view";
export default function WeightPage() {
  return (
    <ChildPage title="Peso">
      {(child, data) => <WeightView child={child} entries={data.weights} />}
    </ChildPage>
  );
}
