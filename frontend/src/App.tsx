import { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import GroupSidebar from './components/GroupSidebar';
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
        <Header user={auth.user} onLogout={logout} />
        {/* Main layout */}
        <div className="d-flex flex-grow-1">
          <GroupSidebar
            groups={groups}
            activeGroup={activeGroup}
            groupMembers={groupMembers}
            onSelectGroup={setActiveGroup}
            onCreateGroup={() => setShowCreateGroup(true)}
            onEditGroup={() => setShowEditGroup(true)}
          />
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
