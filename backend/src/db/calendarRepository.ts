import { pool } from './pool';
import type { Calendar } from '../types/Calendar';

export async function getCalendarsByGroupId(groupId: string): Promise<Calendar[]> {
    const query = `
        SELECT * FROM calendars
          WHERE group_id = $1;
    `;
    const result = await pool.query<Calendar>(query, [groupId]);
    return result.rows;
}
