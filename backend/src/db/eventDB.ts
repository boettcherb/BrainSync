import { pool } from './pool.js';
import type { Event, EventInput } from '../types/Event.js';


// Get all events for a group. The user retrieving the events
// must be a member of the group, but can have any role.
export async function getGroupEvents(
    groupId: string,
    userId: string,
): Promise<Event[]> {
    const result = await pool.query<Event>(
        `SELECT e.* FROM events AS e
          WHERE e.group_id = $1
          AND EXISTS (
            SELECT 1 FROM group_memberships AS gm
              WHERE gm.user_id = $2
              AND gm.group_id = e.group_id
            )
          ORDER BY e.start_time;`,
        [groupId, userId]
    );
    return result.rows;
}


// Create an event in the events table. The user creating the event must be a
// member of the group containing the event and must not have a 'viewer' role.
export async function createEvent(
    event: EventInput,
    groupId: string,
    userId: string,
): Promise<Event | null> {
    const result = await pool.query<Event>(
        `INSERT INTO events (group_id, created_by, category_id, name,
            description, location, start_time, end_time, is_all_day)
          SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9
            WHERE EXISTS (
              SELECT 1 FROM group_memberships AS gm
                WHERE gm.user_id = $2
                AND gm.group_id = $1
                AND gm.role <> 'viewer'
            )
          RETURNING *;`,
        [groupId, userId, event.category_id, event.name, event.description,
            event.location, event.start_time, event.end_time, event.is_all_day]
    );
    return result.rowCount !== 1 ? null : result.rows[0];
}


// Update an event in the 'events' table. The user updating the event must
// be a member of the group the event was created in. They cannot edit the
// event after leaving the group. They must be either the user that created
// the event, or have a role of owner, admin, or editor in the group. 
export async function updateEvent(
    eventId: string,
    event: EventInput,
    userId: string,
): Promise<Event | null> {
    const result = await pool.query<Event>(
        `UPDATE events AS e
          SET category_id = $3, name = $4, description = $5, location = $6,
            start_time = $7, end_time = $8, is_all_day = $9
          WHERE e.id = $1
          AND EXISTS (
            SELECT 1 FROM group_memberships AS gm
              WHERE gm.user_id = $2
              AND gm.group_id = e.group_id
              AND (
                gm.role IN ('owner', 'admin', 'editor')
                OR (gm.role = 'contributor' AND e.created_by = $2)
              )
            )
          )
          RETURNING *;`,
        [eventId, userId, event.category_id, event.name, event.description,
            event.location, event.start_time, event.end_time, event.is_all_day]
    );
    return result.rowCount !== 1 ? null : result.rows[0];
}


// Delete an event from the 'events' table. The user deleting the event must
// be a member of the group the event was created in. They cannot delete the
// event after leaving the group. They must either be the original creator of
// the event, or have a role of owner, admin, or editor in the group.
export async function deleteEvent(
    eventId: string,
    userId: string,
): Promise<boolean> {
    const result = await pool.query(
        `DELETE FROM events AS e
          WHERE e.id = $1
          AND EXISTS (
            SELECT 1
            FROM group_memberships AS gm
            WHERE gm.user_id = $2
            AND gm.group_id = e.group_id
            AND (
              gm.role IN ('owner', 'admin', 'editor')
              OR (gm.role = 'contributor' AND e.created_by = $2)
            )
         );`,
        [eventId, userId]
    );
    return result.rowCount === 1;
}
