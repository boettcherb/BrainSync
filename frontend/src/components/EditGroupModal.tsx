import { useState } from 'react';
import type { GroupInput, UserGroup } from '../types/Group';

interface EditGroupModalProps {
  group: UserGroup;
  onClose: () => void;
  onUpdate: (groupId: string, newGroupData: GroupInput) => Promise<void>;
  onLeave: (groupId: string) => Promise<void>;
  onDelete: (groupId: string) => Promise<void>;
}

function EditGroupModal({
  group, onClose, onUpdate, onLeave, onDelete,
}: EditGroupModalProps) {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description ?? '');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
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

  async function handleLeave() {
    const confirmed = window.confirm(
      `Are you sure you want to leave "${group.name}"?`
    );
    if (!confirmed) {
      return;
    }
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
    if (!confirmed) {
      return;
    }
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
      <div
        className="modal-backdrop fade show"
        onClick={onClose}
      />
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h2 className="modal-title fs-5">Edit Group</h2>
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
                  <div
                    className="alert alert-danger"
                    role="alert"
                  >
                    {error}
                  </div>
                )}
                <div className="mb-3">
                  <label
                    htmlFor="edit-group-name"
                    className="form-label"
                  >
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
                <div className="border-top pt-3">
                  {group.role === 'owner' ? (
                    <>
                      <h3 className="h6 text-danger">Danger Zone</h3>
                      <p className="small text-body-secondary">
                        Deleting this group will also remove
                        its calendars and related data.
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
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default EditGroupModal;
