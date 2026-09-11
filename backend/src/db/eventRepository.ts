import { pool } from './pool';
import type { Event } from '../types/Event';

export async function getEventsByDateRange(calendarId: string, startDate: Date, endDate: Date): Promise<Event[]> {
    const query = `
        SELECT * FROM events
          WHERE calendar_id = $1
            AND start_time < $3
            AND end_time > $2
          ORDER BY start_time;
    `;
    const result = await pool.query<Event>(query, [calendarId, startDate, endDate]);
    return result.rows;
}
