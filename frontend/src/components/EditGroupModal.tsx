import { useState } from 'react';
import type { GroupInput, GroupRole, UserGroup } from '../types/Group';
import type { GroupMember } from '../types/User';

interface EditGroupModalProps {
  group: UserGroup;
  groupMembers: GroupMember[];
  currentUserId: string;
  onClose: () => void;
  onUpdate: (groupId: string, newGroupData: GroupInput) => Promise<void>;
  onLeave: (groupId: string) => Promise<void>;
  onDelete: (groupId: string) => Promise<void>;
  onAddMember: (groupId: string, username: string, role: GroupRole) => Promise<void>;
  onRemoveMember: (groupId: string, memberId: string) => Promise<void>;
}

function EditGroupModal({
  group,
  groupMembers,
  currentUserId,
  onClose,
  onUpdate,
  onLeave,
  onDelete,
  onAddMember,
  onRemoveMember,
}: EditGroupModalProps) {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? '');
  const [newMember, setNewMember] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<GroupRole>('viewer');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const canEditGroup = group.role === 'owner' || group.role === 'admin';
  const canManageMembers = group.role === 'owner' || group.role === 'admin';

  // Users cannot remove themselves. Use "Leave Group" instead.
  // Owners can remove any other member.
  // Admins can only remove members with lower roles.
  function canRemoveMember(member: GroupMember): boolean {
    if (member.id === currentUserId) return false;
    if (group.role === 'owner') return true;

    // Admins can only remove lower roles.
    if (group.role === 'admin') {
      return member.role === 'editor'
        || member.role === 'contributor'
        || member.role === 'viewer';
    }
    return false;
  }

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canEditGroup) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Group name is required.');
      return;
    }
    try {
      setError('');
      setIsLoading(true);
      await onUpdate(group.id, {
        name: trimmedName,
        description: description.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update group.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddMember() {
    const username = newMember.trim();
    if (!username) {
      setError('Enter a username.');
      return;
    }
    try {
      setError('');
      setIsLoading(true);
      await onAddMember(group.id, username, newMemberRole);
      setNewMember('');
      setNewMemberRole('viewer');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add member.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRemoveMember(member: GroupMember) {
    const confirmed = window.confirm(
      `Remove ${member.display_name} from "${group.name}"?`
    );
    if (!confirmed) return;
    try {
      setError('');
      setIsLoading(true);
      await onRemoveMember(group.id, member.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove member.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLeave() {
    const confirmed = window.confirm(
      `Are you sure you want to leave "${group.name}"?`
    );
    if (!confirmed) return;
    try {
      setError('');
      setIsLoading(true);
      await onLeave(group.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to leave group.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${group.name}"? This cannot be undone.`
    );
    if (!confirmed) return;
    try {
      setError('');
      setIsLoading(true);
      await onDelete(group.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete group.');
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
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <form onSubmit={handleSubmit}>
              {/* Header */}
              <div className="modal-header">
                <h2 className="modal-title fs-5">
                  {canEditGroup ? 'Edit Group' : 'Group Details'}
                </h2>
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
                {/* Group information */}
                {canEditGroup ? (
                  <>
                    <div className="mb-3">
                      <label htmlFor="edit-group-name" className="form-label">
                        Group Name
                      </label>
                      <input
                        id="edit-group-name"
                        type="text"
                        className="form-control"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={100}
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label
                        htmlFor="edit-group-description"
                        className="form-label"
                      >
                        Description
                        <span className="text-body-secondary">
                          {' '}(optional)
                        </span>
                      </label>
                      <textarea
                        id="edit-group-description"
                        className="form-control"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                  </>
                ) : (
                  <div className="mb-4">
                    <h3 className="h5 mb-1">
                      {group.name}
                    </h3>
                    <p className="text-body-secondary mb-1">
                      {group.description ||
                        'No description'}
                    </p>
                    <span className="badge text-bg-light border">
                      {group.role}
                    </span>
                  </div>
                )}
                {/* Members */}
                <div className="border-top pt-3">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h3 className="h6 mb-0">Members</h3>
                    <span className="badge text-bg-secondary">
                      {groupMembers.length}
                    </span>
                  </div>
                  {/* Member list */}
                  <div className="list-group">
                    {groupMembers.map(
                      (member) => (
                        <div
                          key={member.id}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          <div>
                            <div className="fw-semibold">
                              {member.display_name}
                              {member.id === currentUserId && (
                                <span className="text-body-secondary fw-normal">
                                  {' '}(you)
                                </span>
                              )}
                            </div>
                            <div className="small text-body-secondary">
                              @{member.username}
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-2">
                            <span className="badge text-bg-light border">
                              {member.role}
                            </span>
                            {canRemoveMember(member) && (
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => handleRemoveMember(member)}
                                disabled={isLoading}
                                title={`Remove ${member.display_name}`}
                              >
                                <i className="bi bi-person-x" />
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                  {/* Add member */}
                  {canManageMembers && (
                    <div className="mt-3">
                      <label htmlFor="new-group-member" className="form-label">
                        Add Member
                      </label>
                      <div className="d-flex gap-2">
                        <input
                          id="new-group-member"
                          type="text"
                          className="form-control"
                          placeholder="Username"
                          value={newMember}
                          onChange={(e) => setNewMember(e.target.value)}
                          disabled={isLoading}
                        />
                        <select
                          className="form-select"
                          style={{ maxWidth: '150px' }}
                          value={newMemberRole}
                          onChange={(e) =>
                            setNewMemberRole(e.target.value as GroupRole)
                          }
                          disabled={isLoading}
                        >
                          {/* Only owners can create admins */}
                          {group.role === 'owner' && (
                            <option value="admin">Admin</option>
                          )}
                          <option value="editor">Editor</option>
                          <option value="contributor">Contributor</option>
                          <option value="viewer">Viewer</option>
                        </select>

                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleAddMember}
                          disabled={isLoading || !newMember.trim()}
                          title="Add member"
                        >
                          <i className="bi bi-person-plus" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {/* Leave / delete */}
                <div className="border-top pt-3 mt-4">
                  {group.role === 'owner' ? (
                    <>
                      <h3 className="h6 text-danger">Danger Zone</h3>
                      <p className="small text-body-secondary">
                        Deleting this group will also remove its calendars and related data.
                      </p>
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={handleDelete}
                        disabled={isLoading}
                      >
                        Delete Group
                      </button>
                    </>
                  ) : (
                    <>
                      <h3 className="h6">Membership</h3>
                      <p className="small text-body-secondary">
                        You can leave this group at any time.
                      </p>
                      <button
                        type="button"
                        className="btn btn-outline-danger"
                        onClick={handleLeave}
                        disabled={isLoading}
                      >
                        Leave Group
                      </button>
                    </>
                  )}
                </div>
              </div>
              {/* Footer */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  {canEditGroup ? 'Cancel' : 'Close'}
                </button>
                {canEditGroup && (
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default EditGroupModal;
