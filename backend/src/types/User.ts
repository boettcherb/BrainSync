// User data type: Matches the 'users' table in the database schema.
export interface User {
    id:            string;
    username:      string;
    email:         string;
    password_hash: string;
    created_at:    Date;
    updated_at:    Date;
}

// UserInput data type: Used when creating or updating a User.
// Includes only fields that users are allowed to set or modify.
// All other fields are either unchanged or set automatically by the backend.
export interface UserInput {
    username:      string;
    email:         string;
    password_hash: string;
}
