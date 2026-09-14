// User data type: Matches the 'users' table in the database schema.
export interface User {
    id:            string;
    email:         string;
    username:      string;
    password_hash: string;
    created_at:    Date;
    updated_at:    Date;
}

// PublicUser data type: User type without 'password_hash'
// Used for storing and displaying public user data in the frontend
// without leaking password data.
export type PublicUser = Omit<User, "password_hash">
