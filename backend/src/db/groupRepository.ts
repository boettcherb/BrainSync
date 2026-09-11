import { pool } from "./pool";
import type { User } from '../types/User';

export async function getUserByEmail(email: string): Promise<User> {
    const query = `
        SELECT * FROM users
          WHERE email = $1;
    `;
    const result = await pool.query<User>(query, [email]);
    return result.rows[0];
}
