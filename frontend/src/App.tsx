import { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import { loginRequest, signupRequest } from './api/auth';
import { userGroupsRequest } from './api/groups';
import type { User, SignupInput } from './types/User';
import type { UserGroup } from './types/Group';

interface AuthState {
  user: User;
  token: string;
}

function App() {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [groups, setGroups] = useState<UserGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<UserGroup | null>(null);

  // Load groups whenever authentication changes.
  useEffect(() => {
    async function loadUserGroups() {
      if (!auth) {
        setGroups([]);
        setActiveGroup(null);
        return;
      }
      const userGroups = await userGroupsRequest(auth.token);
      setGroups(userGroups);
      setActiveGroup(userGroups[0] ?? null);
    }
    loadUserGroups();
  }, [auth]);

  async function login(email: string, password: string): Promise<void> {
    const data = await loginRequest(email, password);
    setAuth({ user: data.user, token: data.token });
  }

  async function signup(newUser: SignupInput): Promise<void> {
    const data = await signupRequest(newUser);
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
          className="border-end p-3"
          style={{ width: '240px', minWidth: '240px' }}
        >
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h6 mb-0">Groups</h2>
            <button
              className="btn btn-primary btn-sm"
              type="button"
            >
              +
            </button>
          </div>

          {groups.length === 0 ? (
            <p className="text-body-secondary small">
              No groups yet.
            </p>
          ) : (
            <div className="list-group">
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  className={`list-group-item list-group-item-action ${
                    activeGroup?.id === group.id
                      ? 'active'
                      : ''
                  }`}
                  onClick={() => setActiveGroup(group)}
                >
                  <div className="fw-semibold">
                    {group.name}
                  </div>

                  <div
                    className={
                      activeGroup?.id === group.id
                        ? 'small'
                        : 'small text-body-secondary'
                    }
                  >
                    {group.role}
                  </div>
                </button>
              ))}
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
                    {activeGroup.description ||
                      'No description'}
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
                    {new Date(
                      activeGroup.created_at
                    ).toLocaleString()}
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
  );
}

export default App;
