import { useState } from 'react';
import CalendarEvent from './CalendarEvent';
import type { UserGroup } from '../types/Group';
import type { Event } from '../types/Event';
import './CalendarView.css';

interface CalendarViewProps {
  groups: UserGroup[];
  eventsByGroup: Record<string, Event[]>;
  visibleGroupIds: Set<string>;
  onCreateGroup: () => void;
  onEventClick: (event: Event) => void;
}

const WEEKDAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

function CalendarView({
  groups,
  eventsByGroup,
  visibleGroupIds,
  onCreateGroup,
  onEventClick,
}: CalendarViewProps) {
  const today = new Date();
  const [displayYear, setDisplayYear] = useState(today.getFullYear());
  const [displayMonth, setDisplayMonth] = useState(today.getMonth());
  function goToPreviousMonth() {
    if (displayMonth === 0) {
      setDisplayMonth(11);
      setDisplayYear((year) => year - 1);
    } else {
      setDisplayMonth((month) => month - 1);
    }
  }

  function goToNextMonth() {
    if (displayMonth === 11) {
      setDisplayMonth(0);
      setDisplayYear((year) => year + 1);
    } else {
      setDisplayMonth((month) => month + 1);
    }
  }

  function goToPreviousYear() {
    setDisplayYear((year) => year - 1);
  }

  function goToNextYear() {
    setDisplayYear((year) => year + 1);
  }

  function goToToday() {
    const current = new Date();
    setDisplayYear(current.getFullYear());
    setDisplayMonth(current.getMonth());
  }

  function getCalendarDates(): Date[] {
    const firstDay = new Date(displayYear, displayMonth, 1);
    const startingWeekday = firstDay.getDay();
    const gridStart = new Date(displayYear, displayMonth, 1 - startingWeekday);
    const dates: Date[] = [];
    for (let i = 0; i < 42; ++i) {
      dates.push(new Date(
        gridStart.getFullYear(),
        gridStart.getMonth(),
        gridStart.getDate() + i
      ));
    }
    return dates;
  }

  function isToday(date: Date): boolean {
    const current = new Date();
    return date.getFullYear() === current.getFullYear()
      && date.getMonth() === current.getMonth()
      && date.getDate() === current.getDate();
  }

  const visibleEvents = Object.values(eventsByGroup).flat().filter((event) =>
    visibleGroupIds.has(event.group_id)
  );

  function getEventsForDate(date: Date): Event[] {
    const dayStart = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const dayEnd = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1
    );
    return visibleEvents.filter((event) => {
      const eventStart = new Date(event.start_time);
      const eventEnd = new Date(event.end_time);

      return eventStart < dayEnd && eventEnd > dayStart;
    });
  }

  if (groups.length === 0) {
    return (
      <main className="flex-grow-1 p-4">
        <div className="h-100 d-flex align-items-center justify-content-center">
          <div className="text-center">
            <h2 className="h4">No groups yet</h2>
            <p className="text-body-secondary">
              Create a group to start adding events.
            </p>
            <button
              className="btn btn-primary"
              type="button"
              onClick={onCreateGroup}
            >
              Create Group
            </button>
          </div>
        </div>
      </main>
    );
  }

  const calendarDates = getCalendarDates();
  const monthTitle = new Date(displayYear, displayMonth, 1)
    .toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <main className="flex-grow-1 px-4 py-2 overflow-auto">
      {visibleGroupIds.size === 0 && (
        <div className="alert alert-secondary py-2">
          All groups are hidden. Use the sidebar to choose which events to
          display.
        </div>
      )}
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <div>
            <h2 className="h4 mb-1">Schedule</h2>
            <div className="text-body-secondary small">
              Showing {visibleGroupIds.size} of {groups.length}{' '}
              {groups.length === 1 ? 'group' : 'groups'}
            </div>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={goToPreviousYear}
            title="Previous year"
          >
            <i className="bi bi-chevron-double-left" />
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={goToPreviousMonth}
            title="Previous month"
          >
            <i className="bi bi-chevron-left" />
          </button>
          <h3 className="h5 text-center mb-0" style={{ minWidth: '180px' }}>
            {monthTitle}
          </h3>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={goToNextMonth}
            title="Next month"
          >
            <i className="bi bi-chevron-right" />
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={goToNextYear}
            title="Next year"
          >
            <i className="bi bi-chevron-double-right" />
          </button>
        </div>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={goToToday}
        >
          Jump to Today
        </button>
      </div>
      <div className="border rounded overflow-hidden">
        <div className="calendar-grid bg-body-tertiary">
          {WEEKDAYS.map((weekday) => (
            <div
              key={weekday}
              className="p-2 text-center fw-semibold border-bottom"
            >
              <span className="d-none d-md-inline">{weekday}</span>
              <span className="d-md-none">{weekday.slice(0, 3)}</span>
            </div>
          ))}
        </div>
        <div className="calendar-grid">
          {calendarDates.map((date) => {
            const isInCurMonth =
              date.getMonth() === displayMonth;
            const dateKey = [
              date.getFullYear(),
              date.getMonth(),
              date.getDate(),
            ].join('-');
            const dayEvents = getEventsForDate(date);
            return (
              <div
                key={dateKey}
                className={`calendar-day border-end border-bottom p-2 ${
                  isInCurMonth
                    ? ''
                    : 'bg-body-tertiary text-body-secondary'
                }`}
              >
                <div
                  className={`calendar-date-number ${
                    isToday(date)
                      ? 'bg-primary text-white'
                      : ''
                  }`}
                >
                  {date.getDate()}
                </div>
                <div className="mt-1 d-flex flex-column gap-1">
                  {dayEvents.map((event) => (
                    <CalendarEvent
                      key={event.id}
                      event={event}
                      date={date}
                      onClick={() => onEventClick(event)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

export default CalendarView;
