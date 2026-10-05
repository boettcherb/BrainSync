import { useState } from 'react';
import type { GroupMember } from '../types/User';
import type { UserGroup } from '../types/Group';
import type { Category } from '../types/Category';

interface GroupSidebarProps {
  groups: UserGroup[];
  membersByGroup: Record<string, GroupMember[]>;
  categoriesByGroup: Record<string, Category[]>;
  visibleGroupIds: Set<string>;
  visibleCategoryIds: Set<string>;
  onToggleGroup: (groupId: string) => void;
  onToggleCategory: (categoryId: string) => void;
  onCreateGroup: () => void;
  onEditGroup: (group: UserGroup) => void;
}

function GroupSidebar({
  groups,
  membersByGroup,
  categoriesByGroup,
  visibleGroupIds,
  visibleCategoryIds,
  onToggleGroup,
  onToggleCategory,
  onCreateGroup,
  onEditGroup,
}: GroupSidebarProps) {
  const [expandedGroupIds, setExpandedGroupIds]
    = useState<Set<string>>(() => new Set());

  function toggleExpanded(groupId: string) {
    setExpandedGroupIds((current) => {
      const next = new Set(current);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  return (
    <aside
      className="border-end p-3 d-flex flex-column overflow-auto"
      style={{ width: '280px', minWidth: '280px' }}
    >
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
      {groups.length === 0 ? (
        <p className="text-body-secondary small">No groups yet.</p>
      ) : (
        <div className="d-flex flex-column gap-2">
          {groups.map((group) => {
            const isExpanded = expandedGroupIds.has(group.id);
            const isVisible = visibleGroupIds.has(group.id);
            const members = membersByGroup[group.id] ?? [];
            const categories = categoriesByGroup[group.id] ?? [];
            return (
              <div key={group.id} className="border rounded overflow-hidden">
                <div className="d-flex align-items-center p-2 gap-2 bg-body">
                  <input
                    className="form-check-input mt-0"
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => onToggleGroup(group.id)}
                    title={isVisible ? 'Hide group events' : 'Show group events'}
                    aria-label={`Toggle ${group.name} events`}
                  />
                  <button
                    type="button"
                    className="btn border-0 p-0 flex-grow-1 text-start"
                    onClick={() => toggleExpanded(group.id)}
                    aria-expanded={isExpanded}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <i
                        className={`bi bi-chevron-${
                          isExpanded ? 'down' : 'right'
                        } small`}
                      />
                      <div className="overflow-hidden">
                        <div className="fw-semibold text-truncate">
                          {group.name}
                        </div>
                        <div className="small text-body-secondary">
                          {group.role}
                        </div>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary border-0"
                    onClick={() => onEditGroup(group)}
                    title="Group details and settings"
                  >
                    <i className="bi bi-pencil" />
                  </button>
                </div>
                {isExpanded && (
                  <div className="border-top p-2 bg-body-tertiary">
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h3 className="small fw-semibold mb-0">Categories</h3>
                        <span className="badge text-bg-secondary">
                          {categories.length}
                        </span>
                      </div>
                      {categories.length === 0 ? (
                        <p className="small text-body-secondary mb-0">
                          No categories yet.
                        </p>
                      ) : (
                        <div className="d-flex flex-column gap-1">
                          {categories.map((category) => (
                            <label
                              key={category.id}
                              className="d-flex align-items-center gap-2 small"
                            >
                              <input
                                className="form-check-input mt-0"
                                type="checkbox"
                                checked={
                                  isVisible && visibleCategoryIds.has(category.id)
                                }
                                disabled={!isVisible}
                                onChange={() => onToggleCategory(category.id)}
                              />
                              <span
                                className="rounded-circle flex-shrink-0"
                                style={{
                                  width: '10px',
                                  height: '10px',
                                  backgroundColor: category.color,
                                }}
                              />
                              <span className="text-truncate">
                                {category.name}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="border-top pt-2">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h3 className="small fw-semibold mb-0">Members</h3>
                        <span className="badge text-bg-secondary">
                          {members.length}
                        </span>
                      </div>
                      {members.length === 0 ? (
                        <p className="small text-body-secondary mb-0">
                          No members found.
                        </p>
                      ) : (
                        <div className="d-flex flex-column gap-2">
                          {members.map((member) => (
                            <div
                              key={member.id}
                              className="d-flex align-items-center justify-content-between gap-2"
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
                              <span className="badge text-bg-light border flex-shrink-0">
                                {member.role}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}

export default GroupSidebar;
