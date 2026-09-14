import { pool } from "./pool";
import type { User, PublicUser } from '../types/User';

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

export async function createUser(
    username: string,
    email: string,
    password_hash: string
): Promise<PublicUser | null> {
    const query = `
        INSERT INTO users (username, email, password_hash)
          VALUES ($1, $2, $3)
          RETURNING id, username, email, created_at, updated_at;
    `;
    const values = [username, email, password_hash];
    const result = await pool.query<PublicUser>(query, values);
    return result.rows[0] ?? null;
}
