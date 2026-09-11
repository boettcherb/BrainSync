import { pool } from './pool';
import type { Category } from '../types/Category';

export async function getCategoriesByCalendarId(calendarId: string): Promise<Category[]> {
    const query = `
        SELECT * FROM event_categories
          WHERE calendar_id = $1
          ORDER BY name;
    `;
    const result = await pool.query<Category>(query, [calendarId]);
    return result.rows;
}
