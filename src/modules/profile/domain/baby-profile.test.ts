import { expect, it } from "vitest";
import { calculateAge, formatAge, formatBirthDate } from "./baby-profile";

it("uses Madrid wall time and the optional birth hour", () => {
  const profile = { name: "Peque ficticio", birthDate: "2024-01-01", birthTime: "12:00" };
  expect(calculateAge(profile, new Date("2024-01-02T10:59:30Z"))).toMatchObject({
    years: 0,
    months: 0,
    days: 0,
    hours: 23,
    minutes: 59,
    seconds: 30,
  });
  expect(calculateAge(profile, new Date("2024-01-02T11:00:00Z"))).toMatchObject({
    days: 1,
    hours: 0,
    minutes: 0,
  });
  expect(calculateAge(profile, new Date("2023-01-01T00:00:00Z"))).toEqual({
    years: 0,
    months: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
});

it("does not display invented precision when the birth hour is unknown", () => {
  const profile = { name: "Peque ficticio", birthDate: "2024-01-01" };
  expect(formatAge(profile, new Date("2024-02-02T12:00:00Z"))).toBe("0 años, 1 mes y 1 día");
  expect(formatBirthDate(profile)).toContain("2024");
});

it.each(["2023-01-31", "2024-01-31", "2024-02-29"])(
  "never gives negative age components for month-end birth %s",
  (birthDate) => {
    const profile = { name: "Peque ficticio", birthDate };
    const age = calculateAge(profile, new Date("2025-03-01T12:00:00Z"));
    expect(Object.values(age).every((value) => value >= 0)).toBe(true);
  },
);

it("uses completed, clamped calendar months across February and leap years", () => {
  const profile = { name: "Peque ficticio", birthDate: "2024-01-31" };
  expect(calculateAge(profile, new Date("2024-02-29T12:00:00Z"))).toMatchObject({
    years: 0,
    months: 1,
    days: 0,
  });
  expect(calculateAge(profile, new Date("2024-03-01T12:00:00Z"))).toMatchObject({
    years: 0,
    months: 1,
    days: 1,
  });
  expect(
    calculateAge({ ...profile, birthDate: "2024-02-29" }, new Date("2025-02-28T12:00:00Z")),
  ).toMatchObject({ years: 1, months: 0, days: 0 });
});
