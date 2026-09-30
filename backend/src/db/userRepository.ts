import { pool } from "./pool";
import type { User, PublicUser, CreateUserInput } from "../types/User";


// Query the 'users' table for a row containing the given email. Email has
// a UNIQUE constraint, so at most 1 row should be found.
export async function getUserByEmail(email: string): Promise<User | null> {
    const result = await pool.query<User>(
        `SELECT * FROM users
          WHERE email = $1;`,
        [email]
    );
    return result.rows[0] ?? null;
}


// Query the 'users' table for a row containing the given username. Username
// has a UNIQUE constraint, so at most 1 row should be found.
export async function getUserByUsername(username: string): Promise<User | null> {
    const result = await pool.query<User>(
        `SELECT * FROM users
          WHERE username = $1;`,
        [username]
    );
    return result.rows[0] ?? null;
}


// Insert a new User into the 'users' table. Return that row on success.
export async function createUser(newUser: CreateUserInput): Promise<PublicUser> {
    const result = await pool.query<PublicUser>(
        `INSERT INTO users (email, username, display_name, password_hash)
          VALUES ($1, $2, $3, $4)
          RETURNING id, email, email_verified, username,
            display_name, created_at, updated_at;`,
        [newUser.email, newUser.username, newUser.display_name, newUser.password_hash]
    );
    if (!result.rows[0]) throw new Error("Failed to create user");
    return result.rows[0];
}