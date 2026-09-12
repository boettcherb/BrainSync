// User data type: Matches the 'users' table in the database schema.
export interface User {
    id:            string;
    username:      string;
    email:         string;
    password_hash: string;
    created_at:    Date;
    updated_at:    Date;
}
