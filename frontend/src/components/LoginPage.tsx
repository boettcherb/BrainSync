import { useState } from 'react';
import type { SignupInput } from '../types/User';

interface LoginPageProps {
  login: (email: string, password: string) => Promise<void>;
  signup: (newUser: SignupInput) => Promise<void>;
}

function LoginPage({ login, signup }: LoginPageProps) {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  async function handleSubmitLogIn(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to log in. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmitSignUp(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const username = formData.get('username') as string;
    const display_name = formData.get('displayName') as string;
    const password = formData.get('password') as string;
    try {
      const newUser: SignupInput = { email, username, password, display_name };
      await signup(newUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function toggleMode() {
    setIsSignUp((current) => !current);
    setError('');
  }

  return (
    <div className="container min-vh-100 d-flex align-items-center justify-content-center">
      <div className="card border-0 shadow-lg" style={{ width: '100%', maxWidth: '430px' }}>
        <div className="card-body p-4 p-md-5">
          <div className="text-center mb-4">
            <h1 className="h2 fw-bold mb-2">
              {isSignUp ? 'Create an account' : 'Welcome back'}
            </h1>
            <p className="text-body-secondary mb-0">
              {isSignUp
                ? 'Create an account to start managing your calendars.'
                : 'Log in to access your calendars.'}
            </p>
          </div>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          <form onSubmit={isSignUp ? handleSubmitSignUp : handleSubmitLogIn}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label fw-semibold">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                className="form-control"
                placeholder="name@example.com"
                autoComplete="email"
                required
              />
            </div>
            {isSignUp && (
              <>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label fw-semibold">
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    name="username"
                    minLength={3}
                    maxLength={20}
                    pattern="[A-Za-z0-9_]+"
                    title="Username can only contain letters, numbers, and underscores. 3-20 characters."
                    className="form-control"
                    placeholder="Username"
                    autoComplete="username"
                    required
                  />
                  <small style={{fontSize: "12px"}}>
                    3-20 characters. Letters, numbers, and underscores only.
                  </small>
                </div>
                <div className="mb-3">
                  <label htmlFor="displayName" className="form-label fw-semibold">
                    Display Name
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    name="displayName"
                    minLength={1}
                    maxLength={50}
                    className="form-control"
                    placeholder="Name"
                    autoComplete="displayName"
                    required
                  />
                </div>
              </>
            )}
            <div className="mb-4">
              <label htmlFor="password" className="form-label fw-semibold">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                minLength={6}
                className="form-control"
                placeholder="Password"
                autoComplete="off"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100 py-2" disabled={isLoading}>
              {isLoading
                ? (isSignUp ? 'Creating account...' : 'Logging in...')
                : (isSignUp ? 'Sign Up' : 'Log In')}
            </button>
          </form>
          <div className="text-center mt-4">
            <span className="text-body-secondary">
              {isSignUp
                ? 'Already have an account? '
                : "Don't have an account? "}
            </span>
            <button
              type="button"
              className="btn btn-link p-0 align-baseline text-decoration-none"
              onClick={toggleMode}
              disabled={isLoading}
            >
              {isSignUp ? 'Log in' : 'Sign up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
