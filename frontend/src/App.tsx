import { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import CreateGroupModal from './components/CreateGroupModal';
import EditGroupModal from './components/EditGroupModal';
import * as authAPI from './api/auth';
import * as groupAPI from './api/groups';
import type { User, SignupInput, GroupMember } from './types/User';
import type { UserGroup, GroupInput } from './types/Group';

interface AuthState {
  user: User;
  token: string;
}

function App() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<UserGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState<boolean>(false);
  const [showEditGroup, setShowEditGroup] = useState<boolean>(false);

  // Load user's groups whenever authentication changes
  useEffect(() => {
    async function loadUserGroups() {
      if (!auth) {
        setGroups([]);
        setActiveGroup(null);
        return;
      }
      const userGroups = await groupAPI.getUserGroups(auth.token);
      setGroups(userGroups);
      setActiveGroup(userGroups[0] ?? null);
    }
    loadUserGroups();
  }, [auth]);

  // Load members of the active group whenever the active group changes
  useEffect(() => {
    async function loadGroupMembers() {
      if (!auth || !activeGroup) {
        setGroupMembers([]);
        return;
      }
      const members = await groupAPI.getGroupMembers(
        activeGroup.id,
        auth.token
      );
      setGroupMembers(members);
    }
    loadGroupMembers();
  }, [auth, activeGroup]);

  async function createGroup(newGroup: GroupInput): Promise<void> {
    if (!auth) return;
    const group = await groupAPI.createGroup(newGroup, auth.token);
    const userGroup: UserGroup = { ...group, role: 'owner' };
    setGroups((current) => [...current, userGroup]);
    setActiveGroup(userGroup);
  }

  async function updateGroup(groupId: string, newGroupData: GroupInput) {
    if (!auth) return;
    const updatedGroup = await groupAPI.updateGroup(
      groupId,
      newGroupData,
      auth.token
    );
    setGroups((current) =>
      current.map((group) =>
        group.id === groupId ? { ...group, ...updatedGroup } : group
      )
    );
    if (activeGroup?.id === groupId) {
      setActiveGroup({ ...activeGroup, ...updatedGroup });
    }
  }

  async function deleteGroup(groupId: string) {
    if (!auth) return;
    await groupAPI.deleteGroup(groupId, auth.token);
    const remainingGroups = groups.filter((group) => group.id !== groupId);
    setGroups(remainingGroups);
    setActiveGroup(remainingGroups[0] ?? null);
  }

  async function leaveGroup(groupId: string) {
    if (!auth) return;
    await groupAPI.leaveGroup(groupId, auth.token);
    const remainingGroups = groups.filter(
      (group) => group.id !== groupId
    );
    setGroups(remainingGroups);
    setActiveGroup(remainingGroups[0] ?? null);
  }

  async function login(email: string, password: string): Promise<void> {
    const data = await authAPI.login(email, password);
    setAuth({ user: data.user, token: data.token });
  }

  async function signup(newUser: SignupInput): Promise<void> {
    const data = await authAPI.signup(newUser);
    setAuth({ user: data.user, token: data.token });
  }

  function logout() {
    setAuth(null);
    setGroups([]);
    setActiveGroup(null);
  }

  // If the user is not logged in, show the login page.
  if (!auth) {
    return <LoginPage login={login} signup={signup} />
  }

  return (
    <>
      <div className="min-vh-100 d-flex flex-column">
        {/* Header */}
        <header className="border-bottom bg-body px-4 py-3">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h4 mb-0">BrainSync</h1>
            </div>
            <div className="d-flex align-items-center gap-3">
              <div className="text-end">
                <div className="fw-semibold">
                  {auth.user.display_name}
                </div>
                <div className="small text-body-secondary">
                  @{auth.user.username}
                </div>
              </div>
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={logout}
              >
                Log Out
              </button>
            </div>
          </div>
        </header>
        {/* Main layout */}
        <div className="d-flex flex-grow-1">
          {/* Group sidebar */}
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
                onClick={() => setShowCreateGroup(true)}
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
                      {/* Select group */}
                      <button
                        type="button"
                        className={`btn flex-grow-1 text-start border-0 rounded-0 py-2 px-3 ${
                          isActive ? 'text-white' : ''
                        }`}
                        onClick={() => setActiveGroup(group)}
                      >
                        <div className="fw-semibold">
                          {group.name}
                        </div>
                        <div
                          className={`small ${
                            isActive
                              ? 'text-white-50'
                              : 'text-body-secondary'
                          }`}
                        >
                          {group.role}
                        </div>
                      </button>
                      {/* Edit group */}
                      {isActive && canEdit && (
                        <button
                          type="button"
                          className="btn border-0 rounded-0 px-3 text-white"
                          onClick={() => setShowEditGroup(true)}
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
          {/* Main calendar area */}
          <main className="flex-grow-1 p-4">
            {!activeGroup ? (
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
                    onClick={() => setShowCreateGroup(true)}
                  >
                    Create Group
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="mb-3">
                  {activeGroup.name}
                </h2>
                <div className="card">
                  <div className="card-body">
                    <p>
                      <strong>Description:</strong>{' '}
                      {activeGroup.description || 'No description'}
                    </p>

                    <p>
                      <strong>Your role:</strong>{' '}{activeGroup.role}
                    </p>

                    <p>
                      <strong>Group ID:</strong>{' '}{activeGroup.id}
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
              </div>
            )}
          </main>
        </div>
      </div>
      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onCreate={createGroup}
        />
      )}
      {showEditGroup && activeGroup && (
        <EditGroupModal
          group={activeGroup}
          onClose={() => setShowEditGroup(false)}
          onUpdate={updateGroup}
          onLeave={leaveGroup}
          onDelete={deleteGroup}
        />
      )}
    </>
  );
}

export default App;
