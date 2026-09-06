export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new ValidationError(message);
}

export function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

export function isDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function isTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    isDate(value.slice(0, 10)) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}

export function localDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function text(value: unknown, label: string, max = 120): string {
  assert(
    typeof value === "string" && value.trim().length > 0 && value.trim().length <= max,
    `${label}: introduce entre 1 y ${max} caracteres.`,
  );
  return value.trim();
}

export function optionalText(value: unknown, label: string, max = 4000): string | null {
  if (value === undefined || value === null || value === "") return null;
  assert(typeof value === "string" && value.length <= max, `${label}: texto no válido.`);
  return value.trim() || null;
}

export function order(value: unknown): number {
  assert(
    Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 10000,
    "Orden no válido.",
  );
  return Number(value);
}
