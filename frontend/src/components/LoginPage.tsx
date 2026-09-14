import React from 'react';

interface LoginPageProps {
  login: (email: string, password: string) => void;
}

function LoginPage({ login }: LoginPageProps) {

  function handleSubmitLogIn(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    login(email, password);
    // TODO: Handle login errors and display them to the user
  }

  return (
      <div>
        <h1>Log in</h1>
        <form onSubmit={handleSubmitLogIn}>
          <input type="text" name="email" placeholder="Email" />
          <input type="password" name="password" placeholder="Password" />
          <button type="submit">Log In</button>
        </form>
      </div>
  );
};

export default LoginPage;
