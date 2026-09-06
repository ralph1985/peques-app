import type { Child } from "./child";
export type BabyProfile = Pick<Child, "name" | "birthDate" | "birthTime">;

export function formatBirthDate(profile: BabyProfile): string {
  const birthDate = parseUtcDate(profile.birthDate);

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(birthDate);
}

export function formatBirthTime(profile: BabyProfile): string {
  return profile.birthTime ?? "00:00";
}

export function calculateAgeInDays(profile: BabyProfile, today: Date): number {
  const birthDate = parseUtcDate(profile.birthDate);
  const currentDate = parseUtcDate(today.toISOString().slice(0, 10));

  return Math.max(0, Math.floor((currentDate.getTime() - birthDate.getTime()) / 86_400_000));
}

export type BabyAge = {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

export function calculateAge(profile: BabyProfile, today: Date): BabyAge {
  const birthDate = parseUtcDate(profile.birthDate);
  const currentDate = getEffectiveCurrentDate(profile, today);

  if (currentDate < birthDate) {
    return { days: 0, hours: 0, minutes: 0, months: 0, seconds: 0, years: 0 };
  }

  let completedMonths =
    (currentDate.getUTCFullYear() - birthDate.getUTCFullYear()) * 12 +
    currentDate.getUTCMonth() -
    birthDate.getUTCMonth();
  // Monthly anniversaries clamp to the last day of shorter months.
  // Subtracting the previous month's length could yield negative days for January 31.
  const anniversary = (months: number) => {
    const first = new Date(
      Date.UTC(birthDate.getUTCFullYear(), birthDate.getUTCMonth() + months, 1),
    );
    const lastDay = new Date(
      Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
    ).getUTCDate();
    first.setUTCDate(Math.min(birthDate.getUTCDate(), lastDay));
    return first;
  };
  if (anniversary(completedMonths) > currentDate) completedMonths -= 1;
  const years = Math.floor(completedMonths / 12);
  const months = completedMonths % 12;
  const days = Math.floor(
    (currentDate.getTime() - anniversary(completedMonths).getTime()) / 86400000,
  );

  const currentTime = getMadridDateTime(today);
  const [birthHour, birthMinute] = (profile.birthTime ?? "00:00").split(":").map(Number);
  let elapsedSeconds =
    currentTime.hour * 3_600 +
    currentTime.minute * 60 +
    currentTime.second -
    birthHour * 3_600 -
    birthMinute * 60;

  if (elapsedSeconds < 0) {
    elapsedSeconds += 86_400;
  }

  const hours = Math.floor(elapsedSeconds / 3_600);
  elapsedSeconds %= 3_600;
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  return { days, hours, minutes, months, seconds, years };
}

function getEffectiveCurrentDate(profile: BabyProfile, today: Date): Date {
  const madridParts = getMadridDateTime(today);
  const [birthHour, birthMinute] = (profile.birthTime ?? "00:00").split(":").map(Number);
  const currentDate = new Date(Date.UTC(madridParts.year, madridParts.month - 1, madridParts.day));

  if (
    madridParts.hour < birthHour ||
    (madridParts.hour === birthHour && madridParts.minute < birthMinute)
  ) {
    currentDate.setUTCDate(currentDate.getUTCDate() - 1);
  }

  return currentDate;
}

function getMadridDateTime(date: Date): {
  day: number;
  hour: number;
  minute: number;
  month: number;
  second: number;
  year: number;
} {
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: "Europe/Madrid",
    year: "numeric",
  })
    .formatToParts(date)
    .reduce<Record<string, number>>((parts, part) => {
      if (part.type !== "literal") {
        parts[part.type] = Number(part.value);
      }
      return parts;
    }, {});

  return {
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    month: parts.month,
    second: parts.second,
    year: parts.year,
  };
}

export function formatAge(profile: BabyProfile, today: Date): string {
  const age = calculateAge(profile, today);

  if (!profile.birthTime)
    return `${age.years} ${pluralize(age.years, "año")}, ${age.months} ${pluralize(age.months, "mes")} y ${age.days} ${pluralize(age.days, "día")}`;

  return `${age.years} ${pluralize(age.years, "año")}, ${age.months} ${pluralize(age.months, "mes")}, ${age.days} ${pluralize(age.days, "día")}, ${age.hours} ${pluralize(age.hours, "hora")}, ${age.minutes} ${pluralize(age.minutes, "minuto")} y ${age.seconds} ${pluralize(age.seconds, "segundo")}`;
}

function pluralize(value: number, singular: string): string {
  if (singular === "mes") {
    return value === 1 ? "mes" : "meses";
  }

  return value === 1 ? singular : `${singular}s`;
}

function parseUtcDate(date: string): Date {
  const [year, month, day] = date.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}
