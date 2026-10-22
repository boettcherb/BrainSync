import { useMemo, useState } from 'react';
import type { Category } from '../types/Category';
import type { Event, EventInput } from '../types/Event';
import type { UserGroup } from '../types/Group';

interface EditEventModalProps {
  event: Event;
  groups: UserGroup[];
  categoriesByGroup: Record<string, Category[]>;
  onClose: () => void;
  onEdit: (groupId: string, eventId: string, event: EventInput) => Promise<void>;
  onDelete: (groupId: string, eventId: string) => Promise<void>;
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toDateTimeLocalValue(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${toDateInputValue(date)}T${hours}:${minutes}`;
}

function EditEventModal({
  event,    
  groups,
  categoriesByGroup,
  onClose,
  onEdit,
  onDelete,
}: EditEventModalProps) {
  const creatableGroups = useMemo(
    () => groups.filter((group) => group.role !== 'viewer'),
    [groups]
  );
  const [groupId, setGroupId] = useState(event.group_id ?? creatableGroups[0]?.id ?? '');
  const [categoryId, setCategoryId] = useState(event.category_id ?? '');
  const [name, setName] = useState(event.name);
  const [description, setDescription] = useState(event.description ?? '');
  const [location, setLocation] = useState(event.location ?? '');
  const [isAllDay, setIsAllDay] = useState(event.is_all_day);
  const [startDateTime, setStartDateTime]
    = useState(toDateTimeLocalValue(new Date(event.start_time)));
  const [endDateTime, setEndDateTime]
    = useState(toDateTimeLocalValue(new Date(event.end_time)));
  const [startDate, setStartDate] = useState(toDateInputValue(new Date(event.start_time)));
  const [endDate, setEndDate] = useState(toDateInputValue(new Date(event.end_time)));
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const categories = categoriesByGroup[groupId] ?? [];

  function handleGroupChange(newGroupId: string) {
    setGroupId(newGroupId);
    setCategoryId('');
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!groupId) {
      setError('Select a group.');
      return;
    }
    if (!trimmedName) {
      setError('Event name is required.');
      return;
    }
    let startTime: Date;
    let endTime: Date;
    if (isAllDay) {
      if (!startDate || !endDate) {
        setError('Start and end dates are required.');
        return;
      }
      startTime = new Date(`${startDate}T00:00:00`);
      // Store all-day ranges with an exclusive end timestamp. A one-day event
      // therefore runs from midnight on its date to midnight the next day.
      endTime = new Date(`${endDate}T00:00:00`);
      endTime.setDate(endTime.getDate() + 1);
    } else {
      if (!startDateTime || !endDateTime) {
        setError('Start and end times are required.');
        return;
      }
      startTime = new Date(startDateTime);
      endTime = new Date(endDateTime);
    }
    if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
      setError('Enter valid event dates.');
      return;
    }
    if (endTime <= startTime) {
      setError('Event end must be after its start.');
      return;
    }
    try {
      setError('');
      setIsLoading(true);
      await onEdit(groupId, event.id, {
        category_id: categoryId || null,
        name: trimmedName,
        description: description.trim() || null,
        location: location.trim() || null,
        start_time: startTime,
        end_time: endTime,
        is_all_day: isAllDay,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create event.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    if (!groupId || !event) return;
    setIsLoading(true);
    try {
      await onDelete(groupId, event.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete event.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="modal-backdrop fade show" />
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        onClick={isLoading ? undefined : onClose}
      >
        <div
          className="modal-dialog modal-dialog-centered modal-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h2 className="modal-title fs-5">Edit Event</h2>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={onClose}
                  disabled={isLoading}
                />
              </div>
              <div className="modal-body">
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
                {creatableGroups.length === 0 ? (
                  <div className="alert alert-secondary mb-0">
                    You do not have permission to create events in any group.
                  </div>
                ) : (
                  <>
                    <div className="row g-3 mb-3">
                      <div className="col-md-6">
                        <label htmlFor="event-group" className="form-label">
                          Group
                        </label>
                        <select
                          id="event-group"
                          className="form-select"
                          value={groupId}
                          onChange={(e) => handleGroupChange(e.target.value)}
                          disabled={isLoading}
                          required
                        >
                          {creatableGroups.map((group) => (
                            <option key={group.id} value={group.id}>
                              {group.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="event-category" className="form-label">
                          Category
                        </label>
                        <select
                          id="event-category"
                          className="form-select"
                          value={categoryId}
                          onChange={(e) => setCategoryId(e.target.value)}
                          disabled={isLoading}
                        >
                          <option value="">Uncategorized</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="event-name" className="form-label">
                        Event Name
                      </label>
                      <input
                        id="event-name"
                        type="text"
                        className="form-control"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="event-description" className="form-label">
                        Description
                        <span className="text-body-secondary"> (optional)</span>
                      </label>
                      <textarea
                        id="event-description"
                        className="form-control"
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="mb-3">
                      <label htmlFor="event-location" className="form-label">
                        Location
                        <span className="text-body-secondary"> (optional)</span>
                      </label>
                      <input
                        id="event-location"
                        type="text"
                        className="form-control"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        disabled={isLoading}
                      />
                    </div>
                    <div className="form-check mb-3">
                      <input
                        id="event-all-day"
                        className="form-check-input"
                        type="checkbox"
                        checked={isAllDay}
                        onChange={(e) => setIsAllDay(e.target.checked)}
                        disabled={isLoading}
                      />
                      <label className="form-check-label" htmlFor="event-all-day">
                        All-day event
                      </label>
                    </div>
                    {isAllDay ? (
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label htmlFor="event-start-date" className="form-label">
                            Start Date
                          </label>
                          <input
                            id="event-start-date"
                            type="date"
                            className="form-control"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            disabled={isLoading}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="event-end-date" className="form-label">
                            End Date
                          </label>
                          <input
                            id="event-end-date"
                            type="date"
                            className="form-control"
                            value={endDate}
                            min={startDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            disabled={isLoading}
                            required
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label htmlFor="event-start" className="form-label">
                            Start
                          </label>
                          <input
                            id="event-start"
                            type="datetime-local"
                            className="form-control"
                            value={startDateTime}
                            onChange={(e) => setStartDateTime(e.target.value)}
                            disabled={isLoading}
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label htmlFor="event-end" className="form-label">
                            End
                          </label>
                          <input
                            id="event-end"
                            type="datetime-local"
                            className="form-control"
                            value={endDateTime}
                            onChange={(e) => setEndDateTime(e.target.value)}
                            disabled={isLoading}
                            required
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={isLoading || creatableGroups.length === 0}
                >
                  {isLoading ? 'Deleting...' : 'Delete Event'}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading || creatableGroups.length === 0}
                >
                  {isLoading ? 'Editing...' : 'Edit Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default EditEventModal;
