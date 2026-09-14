import { useState } from 'react';
import LoginPage from './components/LoginPage';
import { loginRequest, signupRequest } from './api/auth';
import type { User } from './types/User';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  async function login(email: string, password: string): Promise<void> {
      const data = await loginRequest(email, password);
      setToken(data.token);
      setUser(data.user);
  }

  async function signup(email: string, username: string, password: string): Promise<void> {
      const data = await signupRequest(email, username, password);
      setToken(data.token);
      setUser(data.user);
  }

  // If the user is not logged in or the token is not available, show the login page.
  if (!user || !token) {
    return <LoginPage login={login} signup={signup} />
  }

  // If the user is logged in and the token is available, show the main content.
  return (
    <div>
      <h1>Successfully Logged In!</h1>
    </div>
  )
}

export default App;
