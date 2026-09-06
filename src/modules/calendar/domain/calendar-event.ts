import { localDate } from "@/shared/domain/validation";

export type CalendarEvent = {
  id: string;
  childId: string;
  title: string;
  dateKey: string;
  startsAt: string;
  endsAt: string;
  isAllDay: boolean;
  location: string | null;
  description: string | null;
  href: "/peso" | "/vacunas" | "/sueno";
};

export function sortCalendarEvents(events: CalendarEvent[]): CalendarEvent[] {
  return [...events].sort(
    (a, b) => a.startsAt.localeCompare(b.startsAt) || a.id.localeCompare(b.id),
  );
}

export function filterCalendarEvents(
  events: CalendarEvent[],
  { includePast = false, now = new Date() }: { includePast?: boolean; now?: Date } = {},
): CalendarEvent[] {
  return sortCalendarEvents(events.filter((event) => includePast || !isPastEvent(event, now)));
}

export function isPastEvent(event: CalendarEvent, now = new Date()): boolean {
  return event.isAllDay ? event.dateKey < localDate(now) : new Date(event.endsAt) < now;
}
