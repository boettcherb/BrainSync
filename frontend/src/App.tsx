import { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import GroupSidebar from './components/GroupSidebar';
import CalendarView from './components/CalendarView';
import CreateGroupModal from './components/CreateGroupModal';
import EditGroupModal from './components/EditGroupModal';
import * as authAPI from './api/auth';
import * as groupAPI from './api/groups';
import type { User, SignupInput, GroupMember } from './types/User';
import type { UserGroup, GroupInput, GroupRole } from './types/Group';

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

  async function removeGroupMember(
    groupId: string,
    memberId: string
  ): Promise<void> {
    if (!auth) return;
    await groupAPI.removeGroupMember(groupId, memberId, auth.token);
    setGroupMembers((current) =>
      current.filter((member) => member.id !== memberId)
    );
  }

  async function addGroupMember(
    groupId: string,
    username: string,
    role: GroupRole
  ): Promise<void> {
    if (!auth) return;
    const member = await groupAPI.addGroupMember(
      groupId, username, role, auth.token
    );
    setGroupMembers((current) => [...current, member]);
  }

  // If the user is not logged in, show the login page.
  if (!auth) {
    return <LoginPage login={login} signup={signup} />
  }

  return (
    <>
      <div className="min-vh-100 d-flex flex-column">
        <Header user={auth.user} onLogout={logout} />
        <div className="d-flex flex-grow-1">
          <GroupSidebar
            groups={groups}
            activeGroup={activeGroup}
            groupMembers={groupMembers}
            onSelectGroup={setActiveGroup}
            onCreateGroup={() => setShowCreateGroup(true)}
            onEditGroup={() => setShowEditGroup(true)}
          />
          <CalendarView
            activeGroup={activeGroup}
            onCreateGroup={() => setShowCreateGroup(true)}
          />
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
          groupMembers={groupMembers}
          currentUserId={auth.user.id}
          onClose={() => setShowEditGroup(false)}
          onUpdate={updateGroup}
          onLeave={leaveGroup}
          onDelete={deleteGroup}
          onAddMember={addGroupMember}
          onRemoveMember={removeGroupMember}
        />
      )}
    </>
  );
}

export default App;
