import { pool } from './pool';
import type { Calendar } from '../types/Calendar';
import type { Category } from '../types/Category';
import type { Event } from '../types/Event';

export async function getCalendarsByGroupId(groupId: string): Promise<Calendar[]> {
    const query = `
        SELECT * FROM calendars
          WHERE group_id = $1;
    `;
    const result = await pool.query<Calendar>(query, [groupId]);
    return result.rows;
}

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

export async function getCategoriesByCalendarId(calendarId: string): Promise<Category[]> {
    const query = `
        SELECT * FROM event_categories
          WHERE calendar_id = $1
          ORDER BY name;
    `;
    const result = await pool.query<Category>(query, [calendarId]);
    return result.rows;
}

