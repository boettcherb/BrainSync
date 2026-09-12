import { useState } from 'react';
import type { User } from './types/User';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Backend API URL
  const API_URL = import.meta.env.VITE_API_URL;

  function handleSubmitLogIn(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    login(email, password);
    // TODO: Handle login errors and display them to the user
  }

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

  if (!user || !token) {
    return (
      <div>
        <h1>Log in</h1>
        <form onSubmit={handleSubmitLogIn}>
          <input type="text" name="email" placeholder="Email" />
          <input type="password" name="password" placeholder="Password" />
          <button>Log In</button>
        </form>
      </div>
    )
  }

  return (
    <div>
      <h1>Successfully Logged In!</h1>
    </div>
  )
}

export default App
