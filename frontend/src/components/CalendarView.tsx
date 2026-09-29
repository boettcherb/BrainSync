import type { UserGroup } from '../types/Group';

interface CalendarViewProps {
  activeGroup: UserGroup | null;
  onCreateGroup: () => void;
}

function CalendarView({
  activeGroup,
  onCreateGroup,
}: CalendarViewProps) {
  if (!activeGroup) {
    return (
      <main className="flex-grow-1 p-4">
        <div className="h-100 d-flex align-items-center justify-content-center">
          <div className="text-center">
            <h2 className="h4">
              No groups yet
            </h2>
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

  return (
    <main className="flex-grow-1 p-4">
      <h2 className="mb-3">{activeGroup.name}</h2>
      <div className="card">
        <div className="card-body">
          <p>
            <strong>Description:</strong>{' '}
            {activeGroup.description || 'No description'}
          </p>
          <p>
            <strong>Your role:</strong>{' '}
            {activeGroup.role}
          </p>
          <p>
            <strong>Group ID:</strong>{' '}
            {activeGroup.id}
          </p>
          <p className="mb-0">
            <strong>Created:</strong>{' '}
            {new Date(activeGroup.created_at).toLocaleString()}
          </p>
        </div>
      </div>
      <div className="mt-4 border rounded p-5 text-center text-body-secondary">
        Calendar view will go here.
      </div>
    </main>
  );
}

export default CalendarView;
