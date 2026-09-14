import { useState } from 'react';
import LoginPage from './components/LoginPage';
import type { User } from './types/User';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Backend API URL
  const API_URL = import.meta.env.VITE_API_URL;

  // Function to handle login logic. Return an error message if login
  // fails and null if login succeeds.
  async function login(email: string, password: string): Promise<string | null> {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        return errorData.message || 'Login failed';
      }
      const data = await response.json();
      setToken(data.token);
      setUser(data.user);
      return null; // Login succeeded
    } catch (error) {
      console.error(error);
      return error instanceof Error ? error.message : 'An unknown error occurred';
    }
  }

  // If the user is not logged in or the token is not available, show the login page.
  if (!user || !token) {
    return <LoginPage login={login} />
  }

  // If the user is logged in and the token is available, show the main content.
  return (
    <div>
      <h1>Successfully Logged In!</h1>
    </div>
  )
}

export default App;
