import { useState } from 'react';
import LoginPage from './components/LoginPage';
import { loginRequest, signupRequest } from './api/auth';
import type { User } from './types/User';

interface AuthState {
  user: User;
  token: String;
}

function App() {
  const [auth, setAuth] = useState<AuthState | null>(null);

  async function login(email: string, password: string): Promise<void> {
    const data = await loginRequest(email, password);
    setAuth({ user: data.user, token: data.token });
  }

  async function signup(email: string, username: string, password: string): Promise<void> {
    const data = await signupRequest(email, username, password);
    setAuth({ user: data.user, token: data.token });
  }

  // If the user is not logged in, show the login page.
  if (!auth) {
    return <LoginPage login={login} signup={signup} />
  }

  // If the user is logged in, show the main content.
  return (
    <div>
      <h1>Successfully Logged In!</h1>
    </div>
  )
}

export default App;
