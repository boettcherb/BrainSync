import type { Event } from '../types/Event';

interface CalendarEventProps {
  event: Event;
  date: Date;
}

function CalendarEvent({ event, date }: CalendarEventProps) {
  const start = new Date(event.start_time);
  const end = new Date(event.end_time);

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

  const startsToday =
    start >= dayStart &&
    start < dayEnd;

  const endsToday =
    end > dayStart &&
    end <= dayEnd;

  const isMultiDay =
    start < dayStart ||
    end > dayEnd;

  function formatTime(value: Date) {
    return value.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  if (event.is_all_day) {
    return (
      <div
        className="calendar-event calendar-event-all-day px-2 py-1 rounded small"
        title={event.name}
      >
        {event.name}
      </div>
    );
  }

  if (isMultiDay) {
    return (
      <div
        className="calendar-event calendar-event-multi-day px-2 py-1 rounded small"
        title={event.name}
      >
        <div className="fw-semibold text-truncate">
          {event.name}
        </div>

        <div className="small text-body-secondary">
          {startsToday && formatTime(start)}
          {startsToday && endsToday && ' – '}
          {endsToday && formatTime(end)}

          {!startsToday && !endsToday && 'All day'}
        </div>
      </div>
    );
  }

  return (
    <div
      className="calendar-event px-2 py-1 rounded small"
      title={event.name}
    >
      <div className="text-truncate">
        <span className="fw-semibold me-1">
          {formatTime(start)}
        </span>

        {event.name}
      </div>

      <div className="small text-body-secondary">
        {formatTime(start)} – {formatTime(end)}
      </div>
    </div>
  );
}

export default CalendarEvent;