// User data type: Matches the 'users' table in the database schema.
export interface User {
    id:             string;
    email:          string;
    email_verified: boolean;
    username:       string;
    display_name:   string;
    password_hash:  string;
    created_at:     Date;
    updated_at:     Date;
}

// PublicUser data type: User type without 'password_hash'
// Used for storing and displaying public user data in the frontend
// without leaking password data.
export type PublicUser = Omit<User, "password_hash">

// SignupInput data type: Used when creating a User through sign up.
// Includes only fields that users are allowed to set themselves.
// All other fields are set automatically by the backend.
export interface SignupInput {
    email:          string;
    username:       string;
    display_name:   string;
    password:       string;
}

// CreateUserInput data type: Used when creating a User through sign up.
// Includes only fields entered into the database from the signup.
// Note change from SignupInput: password is changed to password_hash.
export interface CreateUserInput {
  email: string;
  username: string;
  display_name: string;
  password_hash: string;
}
