import { pool } from './pool';
import type { Calendar, CalendarInput } from '../types/Calendar';
import type { Category, CategoryInput } from '../types/Category';

// Get all calendars belonging to a group. The user requesting the calendars
// must be a member of the group.
export async function getGroupCalendars(
    groupId: string,
    userId: string,
): Promise<Calendar[]> {
    const result = await pool.query<Calendar>(
        `SELECT * FROM calendars AS c
          WHERE c.group_id = $1
          AND EXISTS (
            SELECT 1 FROM group_memberships AS gm
              WHERE gm.group_id = $1
              AND gm.user_id = $2
          )
          ORDER BY c.created_at;`,
        [groupId, userId]
    );
    return result.rows;
}

// Add a calendar to the 'calendars' table. The calendar will belong to the
// group with groupId. The user creating the calendar must be a member of that
// group and must have the required permissions (either 'owner' or 'admin')
export async function createCalendar(
    groupId: string,
    calendar: CalendarInput,
    userId: string
): Promise<Calendar | null> {
    const result = await pool.query<Calendar>(
        `INSERT INTO calendars (group_id, name, description)
          SELECT $1, $2, $3
          WHERE EXISTS (
            SELECT 1 FROM group_memberships AS gm
              WHERE gm.group_id = $1
              AND gm.user_id = $4
              AND gm.role IN ('owner', 'admin')
            )
          RETURNING *;`,
        [groupId, calendar.name, calendar.description, userId]
    );
    return result.rowCount !== 1 ? null : result.rows[0];
}

// Update a calendar in the 'calendars' table. The user must be a member of
// the group containing the calendar, and must have the required permissions
// (either group owner or group admin).
export async function updateCalendar(
    calendarId: string,
    calendar: CalendarInput,
    userId: string,
): Promise<Calendar | null> {
    const result = await pool.query<Calendar>(
        `UPDATE calendars AS c
          SET name = $2, description = $3
          WHERE c.id = $1 
          AND EXISTS (
            SELECT 1 FROM group_memberships AS gm
            WHERE gm.user_id = $4
            AND gm.group_id = c.group_id
            AND gm.role IN ('owner', 'admin')
          )
          RETURNING *;`,
        [calendarId, calendar.name, calendar.description, userId]
    );
    return result.rowCount !== 1 ? null : result.rows[0];
}

// Delete a calendar from the 'calendars' table. The user performing the
// deleting must be a member of the group containing the calendar and must
// have the required permissions (either group owner or group admin).
export async function deleteCalendar(
    calendarId: string,
    userId: string,
): Promise<boolean> {
    const result = await pool.query(
        `DELETE FROM calendars AS c
          WHERE c.id = $1
          AND EXISTS (
            SELECT 1 FROM group_memberships AS gm
              WHERE gm.user_id = $2
              AND gm.group_id = c.group_id
              AND gm.role IN ('owner', 'admin')
          );`,
        [calendarId, userId]
    );
    return result.rowCount === 1;
}

// Get all event categories belonging to a calendar. The user requesting the
// categories must be a member of the group containing the calendar.
export async function getCalendarCategories(
    calendarId: string,
    userId: string,
): Promise<Category[]> {
    const result = await pool.query<Category>(
        `SELECT ec.* FROM event_categories AS ec
          JOIN calendars AS c
            ON ec.calendar_id = c.id
          WHERE ec.calendar_id = $1
          AND EXISTS (
            SELECT 1 FROM group_memberships AS gm
              WHERE gm.user_id = $2
              AND gm.group_id = c.group_id
          )
          ORDER BY ec.created_at;`,
        [calendarId, userId]
    );
    return result.rows;
}

// Add a category to the 'event_categories' table. The user creating the
// category must be a member of the group containing the category's calendar,
// and they must have the required permissions (either group owner or admin).
export async function createCategory(
    calendarId: string,
    category: CategoryInput,
    userId: string,
): Promise<Category | null> {
    const result = await pool.query<Category>(
        `INSERT INTO event_categories
          (calendar_id, name, color, icon, created_by)
          SELECT c.id, $2, $3, $4, $5 FROM calendars AS c
            WHERE c.id = $1
            AND EXISTS (
              SELECT 1 FROM group_memberships AS gm
                WHERE gm.user_id = $5
                AND gm.group_id = c.group_id
                AND gm.role IN ('owner', 'admin')
            )
            RETURNING *;`,
        [calendarId, category.name, category.color, category.icon, userId]
    );
    return result.rowCount !== 1 ? null : result.rows[0];
}

// Update a category in the 'event_categories' table. The user updating the
// category must be a member of the group containing the category's calendar,
// and they must have the required permissions (either group owner or admin).
export async function updateCategory(
    categoryId: string,
    category: CategoryInput,
    userId: string,
): Promise<Category | null> {
    const result = await pool.query<Category>(
        `UPDATE event_categories AS ec
          SET name = $2, color = $3, icon = $4
          FROM calendars AS c
          WHERE ec.id = $1
          AND ec.calendar_id = c.id
          AND EXISTS (
            SELECT 1 FROM group_memberships AS gm
              WHERE gm.user_id = $5
              AND gm.group_id = c.group_id
              AND gm.role IN ('owner', 'admin')
          )
          RETURNING ec.*;`,
        [categoryId, category.name, category.color, category.icon, userId]
    );

    return result.rowCount !== 1 ? null : result.rows[0];
}

// Delete a category from the 'event_categories' table. The user deleting the
// category must be a member of the group containing the category's calendar,
// and they must have the required permissions (either group owner or admin).
export async function deleteCategory(
    categoryId: string,
    userId: string,
): Promise<boolean> {
    const result = await pool.query(
        `DELETE FROM event_categories AS ec
          USING calendars AS c
          WHERE ec.id = $1
          AND ec.calendar_id = c.id
          AND EXISTS (
            SELECT 1 FROM group_memberships AS gm
              WHERE gm.user_id = $2
              AND gm.group_id = c.group_id
              AND gm.role IN ('owner', 'admin')
          );`,
        [categoryId, userId]
    );
    return result.rowCount === 1;
}
