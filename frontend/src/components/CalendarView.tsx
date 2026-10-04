import { useEffect, useState } from 'react';
import type { UserGroup } from '../types/Group';
import type { Calendar } from '../types/Calendar';
import * as calendarAPI from '../api/calendarAPI';
import './CalendarView.css';

interface CalendarViewProps {
  activeGroup: UserGroup | null;
  token: string;
  onCreateGroup: () => void;
}

const WEEKDAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

function CalendarView({activeGroup, token, onCreateGroup}: CalendarViewProps) {
  const today = new Date();
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [activeCalendar, setActiveCalendar] = useState<Calendar | null>(null);
  const [displayYear, setDisplayYear] = useState(today.getFullYear());
  const [displayMonth, setDisplayMonth] = useState(today.getMonth());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Load the calendars whenever the active group changes.
  useEffect(() => {
    async function loadCalendars() {
      if (!activeGroup) {
        setCalendars([]);
        setActiveCalendar(null);
        return;
      }
      try {
        setError('');
        setIsLoading(true);
        const groupCalendars = await calendarAPI.getGroupCalendars(
          activeGroup.id, token
        );
        setCalendars(groupCalendars);
        setActiveCalendar(groupCalendars[0] ?? null);
      } catch (err) {
        setCalendars([]);
        setActiveCalendar(null);
        setError(err instanceof Error
          ? err.message : 'Unable to retrieve calendars.');
      } finally {
        setIsLoading(false);
      }
    }
    loadCalendars();
  }, [activeGroup?.id, token]);

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
    // First day of the displayed month.
    const firstDay = new Date(displayYear, displayMonth, 1);
    // Sunday = 0, Monday = 1, ..., Saturday = 6.
    const startingWeekday = firstDay.getDay();
    // Start the grid on the Sunday before (or on) the first day of the month.
    const gridStart = new Date(displayYear, displayMonth, 1 - startingWeekday);
    // Six weeks gives us a consistent 7 x 6 calendar grid.
    const dates: Date[] = [];
    for (let i = 0; i < 42; ++i) {
      dates.push(new Date(gridStart.getFullYear(), gridStart.getMonth(),
        gridStart.getDate() + i));
    }
    return dates;
  }

  function isToday(date: Date): boolean {
    const current = new Date();
    return date.getFullYear() === current.getFullYear()
      && date.getMonth() === current.getMonth()
      && date.getDate() === current.getDate();
  }

  if (!activeGroup) {
    return (
      <main className="flex-grow-1 p-4">
        <div className="h-100 d-flex align-items-center justify-content-center">
          <div className="text-center">
            <h2 className="h4">No groups yet</h2>
            <p className="text-body-secondary">
              Create a group to start creating calendars.
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
    <main className="flex-grow-1 p-4 overflow-auto">
      {/* Group / calendar heading */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 mb-1">{activeGroup.name}</h2>
          {activeCalendar && (
            <div className="text-body-secondary">
              {activeCalendar.name}
            </div>
          )}
        </div>
        {/* Calendar selector */}
        {calendars.length > 0 && (
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '180px' }}
            value={activeCalendar?.id ?? ''}
            onChange={(e) => {
              const calendar = calendars.find((calendar) =>
                calendar.id === e.target.value
              );
              setActiveCalendar(calendar ?? null);
            }}
          >
            {calendars.map((calendar) => (
              <option key={calendar.id} value={calendar.id}>
                {calendar.name}
              </option>
            ))}
          </select>
        )}
      </div>
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}
      {isLoading ? (
        <div className="text-center p-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : calendars.length === 0 ? (
        <div className="border rounded p-5 text-center">
          <h3 className="h5">No calendars yet</h3>
          <p className="text-body-secondary mb-0">
            Create a calendar to start adding events.
          </p>
        </div>
      ) : (
        <>
          {/* Calendar navigation */}
          <div className="d-flex align-items-center justify-content-between mb-3">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={goToToday}
            >
              Today
            </button>
            <div className="d-flex align-items-center gap-2">
              {/* Previous year */}
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={goToPreviousYear}
                title="Previous year"
              >
                <i className="bi bi-chevron-double-left" />
              </button>
              {/* Previous month */}
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={goToPreviousMonth}
                title="Previous month"
              >
                <i className="bi bi-chevron-left" />
              </button>
              <h3
                className="h5 text-center mb-0"
                style={{ minWidth: '180px' }}
              >
                {monthTitle}
              </h3>
              {/* Next month */}
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={goToNextMonth}
                title="Next month"
              >
                <i className="bi bi-chevron-right" />
              </button>
              {/* Next year */}
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={goToNextYear}
                title="Next year"
              >
                <i className="bi bi-chevron-double-right" />
              </button>
            </div>
            {/* Keeps the title centered */}
            <div style={{ width: '67px' }} />
          </div>
          {/* Calendar */}
          <div className="border rounded overflow-hidden">
            {/* Weekday headings */}
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
            {/* Day cells */}
            <div className="calendar-grid">
              {calendarDates.map((date) => {
                const belongsToCurrentMonth = date.getMonth() === displayMonth;
                const dateKey = [
                  date.getFullYear(),
                  date.getMonth(),
                  date.getDate(),
                ].join('-');
                return (
                  <div
                    key={dateKey}
                    className={`calendar-day border-end border-bottom p-2 ${
                      belongsToCurrentMonth ? ''
                      : 'bg-body-tertiary text-body-secondary'
                    }`}
                  >
                    <div
                      className={`calendar-date-number ${
                        isToday(date) ? 'bg-primary text-white' : ''
                      }`}
                    >
                      {date.getDate()}
                    </div>
                    {/* Events eventually go here */}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </main>
  );
}

export default CalendarView;
