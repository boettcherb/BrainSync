// User data type: Matches the 'users' table in the database schema.
export interface User {
    id:            string;
    username:      string;
    email:         string;
    password_hash: string;
    created_at:    Date;
    updated_at:    Date;
}

// PublicUser data type: User type without 'password_hash'
// Used for storing and displaying public user data in the frontend
// without leaking password data.
export interface PublicUser {
    id:            string;
    username:      string;
    email:         string;
    created_at:    Date;
    updated_at:    Date;
}
