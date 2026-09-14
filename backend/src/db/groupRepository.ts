import { pool } from "./pool";
import type { User, PublicUser, CreateUserInput } from '../types/User';

export async function getUserByEmail(email: string): Promise<User | null> {
    const query = `
        SELECT * FROM users
          WHERE email = $1;
    `;
    const result = await pool.query<User>(query, [email]);
    return result.rows.length === 0 ? null : result.rows[0];
}

export async function getUserByUsername(username: string): Promise<User | null> {
    const query = `
        SELECT * FROM users
          WHERE username = $1;
    `;
    const result = await pool.query<User>(query, [username]);
    return result.rows[0] ?? null;
}

export async function createUser(newUser: CreateUserInput): Promise<PublicUser | null> {
    const query = `
        INSERT INTO users (email, username, display_name, password_hash)
          VALUES ($1, $2, $3, $4)
          RETURNING id, email, email_verified, username,
            display_name, created_at, updated_at;
    `;
    const values = [
        newUser.email,
        newUser.username,
        newUser.display_name,
        newUser.password_hash
    ];
    const result = await pool.query<PublicUser>(query, values);
    return result.rows[0] ?? null;
}
