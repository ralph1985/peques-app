"use client";

import { useMemo, useState } from "react";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import {
  filterCalendarEvents,
  isPastEvent,
  sortCalendarEvents,
  type CalendarEvent,
} from "@/modules/calendar/domain/calendar-event";
import { formatCalendarDayHeading, formatCalendarEventDate } from "./calendar-date-format";
import styles from "./calendar-view.module.css";

type CalendarViewProps = {
  events: CalendarEvent[];
  onOpen: (event: CalendarEvent) => Promise<void>;
};

type ViewMode = "agenda" | "month";

export function CalendarView({ events, onOpen }: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("agenda");
  const [pastEventsVisible, setPastEventsVisible] = useState(0);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const pastEvents = filterCalendarEvents(events, { includePast: true }).filter((event) =>
    isPastEvent(event),
  );
  const upcomingEvents = filterCalendarEvents(events, { includePast: false });
  const visiblePastEvents = pastEvents.slice(Math.max(0, pastEvents.length - pastEventsVisible));
  const visibleEvents = sortCalendarEvents([...visiblePastEvents, ...upcomingEvents]);
  const remainingPastEvents = pastEvents.length - visiblePastEvents.length;

  return (
    <>
      <section className={styles.panel} aria-label="Eventos del calendario">
        <div className={styles.toolbar}>
          <div className={styles.segmentedControl} aria-label="Cambiar vista">
            <button
              aria-pressed={viewMode === "agenda"}
              className={viewMode === "agenda" ? styles.selected : undefined}
              onClick={() => setViewMode("agenda")}
              type="button"
            >
              Agenda
            </button>
            <button
              aria-pressed={viewMode === "month"}
              className={viewMode === "month" ? styles.selected : undefined}
              onClick={() => setViewMode("month")}
              type="button"
            >
              Mes
            </button>
          </div>
          {remainingPastEvents > 0 && viewMode === "agenda" ? (
            <button
              className={styles.pastButton}
              onClick={() => setPastEventsVisible((current) => current + 3)}
              type="button"
            >
              Ver {Math.min(3, remainingPastEvents)} eventos anteriores
            </button>
          ) : null}
        </div>

        {(viewMode === "month" ? events.length : visibleEvents.length) === 0 ? (
          <p className={styles.emptyState}>
            {events.length > 0
              ? "No hay eventos próximos. Puedes consultar los eventos anteriores."
              : "No hay eventos guardados con fecha."}
          </p>
        ) : null}

        {visibleEvents.length > 0 && viewMode === "agenda" ? (
          <Agenda events={visibleEvents} onSelect={setSelectedEvent} />
        ) : null}

        {events.length > 0 && viewMode === "month" ? (
          <MonthCalendar events={events} onSelect={setSelectedEvent} />
        ) : null}
      </section>

      {selectedEvent ? (
        <BottomSheet
          ariaLabel="Detalle del evento"
          labelledBy="calendar-event-title"
          onClose={() => setSelectedEvent(null)}
          styles={styles}
        >
          <div className={styles.sheetContent}>
            <p className={styles.sheetKicker}>Evento</p>
            <h2 id="calendar-event-title">{selectedEvent.title}</h2>
            <dl className={styles.details}>
              <div>
                <dt>Cuándo</dt>
                <dd>{formatEventDate(selectedEvent)}</dd>
              </div>
              {selectedEvent.location ? (
                <div>
                  <dt>Dónde</dt>
                  <dd>{selectedEvent.location}</dd>
                </div>
              ) : null}
              {selectedEvent.description ? (
                <div>
                  <dt>Notas</dt>
                  <dd>{selectedEvent.description}</dd>
                </div>
              ) : null}
            </dl>
            {selectedEvent.href ? (
              <button
                className={styles.primaryButton}
                type="button"
                onClick={() => void onOpen(selectedEvent)}
              >
                Ir al registro
              </button>
            ) : null}
          </div>
        </BottomSheet>
      ) : null}
    </>
  );
}

function Agenda({
  events,
  onSelect,
}: {
  events: CalendarEvent[];
  onSelect: (event: CalendarEvent) => void;
}) {
  const groups = useMemo(() => {
    const grouped = new Map<string, CalendarEvent[]>();

    for (const event of events) {
      const key = event.dateKey;
      grouped.set(key, [...(grouped.get(key) ?? []), event]);
    }

    return [...grouped.entries()];
  }, [events]);

  return (
    <div className={styles.agenda}>
      {groups.map(([date, dateEvents]) => (
        <section className={styles.day} key={date}>
          <h2>{formatCalendarDayHeading(date)}</h2>
          <ul>
            {dateEvents.map((event) => (
              <li key={event.id}>
                <button
                  className={styles.eventButton}
                  onClick={() => onSelect(event)}
                  type="button"
                >
                  <span className={styles.eventTime}>{formatEventTime(event)}</span>
                  <span className={styles.eventBody}>
                    <strong>{event.title}</strong>
                    {event.location ? <small>{event.location}</small> : null}
                  </span>
                  <span aria-hidden="true" className={styles.chevron}>
                    ›
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function MonthCalendar({
  events,
  onSelect,
}: {
  events: CalendarEvent[];
  onSelect: (event: CalendarEvent) => void;
}) {
  const [month, setMonth] = useState(() => new Date().getMonth());
  const [year, setYear] = useState(() => new Date().getFullYear());
  const days = useMemo(() => buildMonthDays(year, month), [month, year]);
  const eventMap = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();

    for (const event of events) {
      const key = event.dateKey;
      map.set(key, [...(map.get(key) ?? []), event]);
    }

    return map;
  }, [events]);

  function moveMonth(offset: number) {
    const next = new Date(year, month + offset, 1);
    setMonth(next.getMonth());
    setYear(next.getFullYear());
  }

  return (
    <div className={styles.monthView}>
      <div className={styles.monthHeader}>
        <button aria-label="Mes anterior" onClick={() => moveMonth(-1)} type="button">
          ‹
        </button>
        <h2>
          {new Intl.DateTimeFormat("es-ES", { month: "long", year: "numeric" }).format(
            new Date(year, month, 1),
          )}
        </h2>
        <button aria-label="Mes siguiente" onClick={() => moveMonth(1)} type="button">
          ›
        </button>
      </div>
      <div className={styles.weekdays} aria-hidden="true">
        {(["L", "M", "X", "J", "V", "S", "D"] as const).map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className={styles.monthGrid}>
        {days.map((day) => {
          const dayEvents = eventMap.get(day.key) ?? [];

          return (
            <div
              aria-current={day.isToday ? "date" : undefined}
              className={`${styles.monthDay} ${day.inMonth ? "" : styles.outsideMonth} ${day.isToday ? styles.today : ""}`}
              key={day.key}
            >
              <span>{day.day}</span>
              {dayEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => onSelect(event)}
                  type="button"
                  title={event.title}
                >
                  {event.title}
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function buildMonthDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = toDateKey(new Date());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(year, month, index - startOffset + 1);
    return {
      day: date.getDate(),
      inMonth: date.getMonth() === month,
      isToday: date.getMonth() === month && toDateKey(date) === today,
      key: toDateKey(date),
    };
  }).slice(0, Math.ceil((startOffset + daysInMonth) / 7) * 7);
}

function formatEventDate(event: CalendarEvent): string {
  return formatCalendarEventDate(event.startsAt, event.isAllDay);
}

function formatEventTime(event: CalendarEvent): string {
  if (event.isAllDay) {
    return "Todo el día";
  }

  return new Intl.DateTimeFormat("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(new Date(event.startsAt));
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
