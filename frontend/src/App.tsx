import { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import Header from './components/Header';
import GroupSidebar from './components/GroupSidebar';
import CalendarView from './components/CalendarView';
import CreateGroupModal from './components/CreateGroupModal';
import EditGroupModal from './components/EditGroupModal';
import CreateEventModal from './components/CreateEventModal';
import * as authAPI from './api/authAPI';
import * as groupAPI from './api/groupAPI';
import * as categoryAPI from './api/categoryAPI';
import * as eventAPI from './api/eventAPI';
import type { User, SignupInput, GroupMember } from './types/User';
import type { UserGroup, GroupInput, GroupRole } from './types/Group';
import type { Category } from './types/Category';
import type { EventInput } from './types/Event';

interface AuthState {
  user: User;
  token: string;
}

type MembersByGroup = Record<string, GroupMember[]>;
type CategoriesByGroup = Record<string, Category[]>;

function App() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  // The group currently being managed in EditGroupModal
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null);
  const [membersByGroup, setMembersByGroup] = useState<MembersByGroup>({});
  const [categoriesByGroup, setCategoriesByGroup] = useState<CategoriesByGroup>({});
  // Visibility filters for the unified calendar view
  const [visibleGroupIds, setVisibleGroupIds]
    = useState<Set<string>>(() => new Set());
  const [visibleCategoryIds, setVisibleCategoryIds]
    = useState<Set<string>>(() => new Set());
  const [showCreateGroup, setShowCreateGroup] = useState<boolean>(false);
  const [showCreateEvent, setShowCreateEvent] = useState<boolean>(false);

  // Load the user's groups and the data needed by the sidebar whenever
  // authentication changes.
  useEffect(() => {
    async function loadUserData() {
      if (!auth) {
        setGroups([]);
        setEditingGroup(null);
        setMembersByGroup({});
        setCategoriesByGroup({});
        setVisibleGroupIds(new Set());
        setVisibleCategoryIds(new Set());
        return;
      }
      const userGroups = await groupAPI.getUserGroups(auth.token);
      setGroups(userGroups);
      setVisibleGroupIds(new Set(userGroups.map((group) => group.id)));
      const details = await Promise.all(
        userGroups.map(async (group) => {
          const [members, categories] = await Promise.all([
            groupAPI.getGroupMembers(group.id, auth.token),
            categoryAPI.getGroupCategories(group.id, auth.token),
          ]);
          return { groupId: group.id, members, categories };
        })
      );
      const nextMembers: MembersByGroup = {};
      const nextCategories: CategoriesByGroup = {};
      const categoryIds = new Set<string>();
      for (const detail of details) {
        nextMembers[detail.groupId] = detail.members;
        nextCategories[detail.groupId] = detail.categories;
        for (const category of detail.categories) {
          categoryIds.add(category.id);
        }
      }
      setMembersByGroup(nextMembers);
      setCategoriesByGroup(nextCategories);
      setVisibleCategoryIds(categoryIds);
    }
    loadUserData().catch((error) => {
      console.error('Unable to load group data:', error);
    });
  }, [auth]);

  function toggleGroupVisibility(groupId: string) {
    setVisibleGroupIds((current) => {
      const next = new Set(current);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }

  function toggleCategoryVisibility(categoryId: string) {
    setVisibleCategoryIds((current) => {
      const next = new Set(current);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  }

  async function createGroup(newGroup: GroupInput): Promise<void> {
    if (!auth) return;
    const group = await groupAPI.createGroup(newGroup, auth.token);
    const userGroup: UserGroup = { ...group, role: 'owner' };
    setGroups((current) => [...current, userGroup]);
    setVisibleGroupIds((current) => new Set(current).add(userGroup.id));
    // Reload the new group's details so the sidebar has accurate member data.
    const [members, categories] = await Promise.all([
      groupAPI.getGroupMembers(userGroup.id, auth.token),
      categoryAPI.getGroupCategories(userGroup.id, auth.token),
    ]);
    setMembersByGroup((current) => ({
      ...current, [userGroup.id]: members
    }));
    setCategoriesByGroup((current) => ({
      ...current, [userGroup.id]: categories
    }));
    setVisibleCategoryIds((current) => {
      const next = new Set(current);
      categories.forEach((category) => next.add(category.id));
      return next;
    });
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
    setEditingGroup((current) =>
      current?.id === groupId ? { ...current, ...updatedGroup } : current
    );
  }

  function removeGroupFromState(groupId: string) {
    setGroups((current) => current.filter((group) => group.id !== groupId));
    setEditingGroup((current) =>
      current?.id === groupId ? null : current
    );
    setMembersByGroup((current) => {
      const next = { ...current };
      delete next[groupId];
      return next;
    });
    setCategoriesByGroup((current) => {
      const removedCategoryIds = new Set(
        (current[groupId] ?? []).map((category) => category.id)
      );
      setVisibleCategoryIds((visible) => {
        const next = new Set(visible);
        removedCategoryIds.forEach((id) => next.delete(id));
        return next;
      });
      const next = { ...current };
      delete next[groupId];
      return next;
    });
    setVisibleGroupIds((current) => {
      const next = new Set(current);
      next.delete(groupId);
      return next;
    });
  }

  async function deleteGroup(groupId: string) {
    if (!auth) return;
    await groupAPI.deleteGroup(groupId, auth.token);
    removeGroupFromState(groupId);
  }

  async function leaveGroup(groupId: string) {
    if (!auth) return;
    await groupAPI.leaveGroup(groupId, auth.token);
    removeGroupFromState(groupId);
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
  }

  async function removeGroupMember(
    groupId: string,
    memberId: string
  ): Promise<void> {
    if (!auth) return;
    await groupAPI.removeGroupMember(groupId, memberId, auth.token);
    setMembersByGroup((current) => ({
      ...current,
      [groupId]: (current[groupId] ?? []).filter(
        (member) => member.id !== memberId
      ),
    }));
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
    setMembersByGroup((current) => ({
      ...current,
      [groupId]: [...(current[groupId] ?? []), member],
    }));
  }

  async function createEvent(
    groupId: string,
    newEvent: EventInput
  ): Promise<void> {
    if (!auth) return;
    await eventAPI.createEvent(groupId, newEvent, auth.token);
    // TODO: handle created event
  }

  // If the user is not logged in, show the login page.
  if (!auth) {
    return <LoginPage login={login} signup={signup} />;
  }

  return (
    <>
      <div className="min-vh-100 d-flex flex-column">
        <Header user={auth.user} onLogout={logout} />
        <div className="d-flex flex-grow-1">
          <GroupSidebar
            groups={groups}
            membersByGroup={membersByGroup}
            categoriesByGroup={categoriesByGroup}
            visibleGroupIds={visibleGroupIds}
            visibleCategoryIds={visibleCategoryIds}
            onToggleGroup={toggleGroupVisibility}
            onToggleCategory={toggleCategoryVisibility}
            onCreateGroup={() => setShowCreateGroup(true)}
            onCreateEvent={() => setShowCreateEvent(true)}
            onEditGroup={setEditingGroup}
          />
          <CalendarView
            groups={groups}
            visibleGroupIds={visibleGroupIds}
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
      {showCreateEvent && (
        <CreateEventModal
          groups={groups}
          categoriesByGroup={categoriesByGroup}
          onClose={() => setShowCreateEvent(false)}
          onCreate={createEvent}
        />
      )}
      {editingGroup && (
        <EditGroupModal
          group={editingGroup}
          groupMembers={membersByGroup[editingGroup.id] ?? []}
          currentUserId={auth.user.id}
          onClose={() => setEditingGroup(null)}
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
