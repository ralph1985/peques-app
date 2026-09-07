import { describe, expect, it } from "vitest";
import { createSleepEntry } from "./sleep-entry";

const baseEntry = {
  kind: "nap" as const,
  startedAt: "2024-03-02T12:00:00.000Z",
  endedAt: "2024-03-02T13:00:00.000Z",
};

describe("sleep entry notes", () => {
  it("trims notes and turns empty values into null", () => {
    expect(createSleepEntry({ ...baseEntry, notes: "  Se despertó una vez.  " }).notes).toBe(
      "Se despertó una vez.",
    );
    expect(createSleepEntry({ ...baseEntry, notes: "   " }).notes).toBeNull();
  });

  it("rejects notes longer than 4000 characters", () => {
    expect(() => createSleepEntry({ ...baseEntry, notes: "x".repeat(4001) })).toThrow();
  });
});
