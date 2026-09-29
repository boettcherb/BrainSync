import type { GroupMember } from '../types/User';
import type { UserGroup } from '../types/Group';

interface GroupSidebarProps {
  groups: UserGroup[];
  activeGroup: UserGroup | null;
  groupMembers: GroupMember[];
  onSelectGroup: (group: UserGroup) => void;
  onCreateGroup: () => void;
  onEditGroup: () => void;
}

function GroupSidebar({
  groups,
  activeGroup,
  groupMembers,
  onSelectGroup,
  onCreateGroup,
  onEditGroup,
}: GroupSidebarProps) {
  return (
    <aside
      className="border-end p-3 d-flex flex-column"
      style={{ width: '260px', minWidth: '260px' }}
    >
      {/* Groups header */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h6 mb-0">Groups</h2>
        <button
          className="btn btn-primary btn-sm"
          type="button"
          onClick={onCreateGroup}
          title="Create group"
        >
          <i className="bi bi-plus-lg" />
        </button>
      </div>
      {/* Group list */}
      {groups.length === 0 ? (
        <p className="text-body-secondary small">
          No groups yet.
        </p>
      ) : (
        <div className="list-group mb-4">
          {groups.map((group) => {
            const isActive = activeGroup?.id === group.id;
            const canEdit = group.role === 'owner' || group.role === 'admin';
            return (
              <div
                key={group.id}
                className={`list-group-item p-0 d-flex align-items-stretch ${
                  isActive ? 'active' : ''
                }`}
              >
                <button
                  type="button"
                  className={`btn flex-grow-1 text-start border-0 rounded-0 py-2 px-3 ${
                    isActive ? 'text-white' : ''
                  }`}
                  onClick={() => onSelectGroup(group)}
                >
                  <div className="fw-semibold">
                    {group.name}
                  </div>
                  <div
                    className={`small ${
                      isActive ? 'text-white-50' : 'text-body-secondary'
                    }`}
                  >
                    {group.role}
                  </div>
                </button>
                {isActive && canEdit && (
                  <button
                    type="button"
                    className="btn border-0 rounded-0 px-3 text-white"
                    onClick={onEditGroup}
                    title="Edit group"
                  >
                    <i className="bi bi-pencil" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      {/* Active group members */}
      {activeGroup && (
        <div className="border-top pt-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h2 className="h6 mb-0">Members</h2>
            <span className="badge text-bg-secondary">
              {groupMembers.length}
            </span>
          </div>
          {groupMembers.length === 0 ? (
            <p className="small text-body-secondary mb-0">
              No members found.
            </p>
          ) : (
            <div className="d-flex flex-column gap-2">
              {groupMembers.map((member) => (
                <div
                  key={member.id}
                  className="d-flex align-items-center justify-content-between"
                >
                  <div className="overflow-hidden">
                    <div
                      className="small fw-semibold text-truncate"
                      title={member.display_name}
                    >
                      {member.display_name}
                    </div>
                    <div
                      className="small text-body-secondary text-truncate"
                      title={`@${member.username}`}
                    >
                      @{member.username}
                    </div>
                  </div>
                  <span className="badge text-bg-light border ms-2">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

export default GroupSidebar;
