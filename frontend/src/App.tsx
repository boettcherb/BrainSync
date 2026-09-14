import { useState } from 'react';
import LoginPage from './components/LoginPage';
import { loginRequest, signupRequest } from './api/auth';
import type { User, SignupInput } from './types/User';

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

  async function signup(newUser: SignupInput): Promise<void> {
    const data = await signupRequest(newUser);
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
      <p> User id: {auth.user.id}</p>
      <p> User email: {auth.user.email}</p>
      <p> User email_verified: {auth.user.email_verified ? "true" : "false"}</p>
      <p> User username: {auth.user.username}</p>
      <p> User display_name: {auth.user.display_name}</p>
    </div>
  )
}

export default App;
