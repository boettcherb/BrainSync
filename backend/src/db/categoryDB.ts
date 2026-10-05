import { pool } from './pool';
import type { Category, CategoryInput } from '../types/Category';


// Get all event categories belonging to a group. The user requesting the
// categories must be a member of the group.
export async function getCategories(
    groupId: string,
    userId: string,
): Promise<Category[]> {
    const result = await pool.query<Category>(
        `SELECT ec.* FROM event_categories AS ec
          WHERE ec.group_id = $1
          AND EXISTS (
            SELECT 1 FROM group_memberships AS gm
              WHERE gm.user_id = $2
              AND gm.group_id = ec.group_id
          )
          ORDER BY ec.created_at;`,
        [groupId, userId]
    );
    return result.rows;
}


// Add a category to the 'event_categories' table. The user creating the
// category must be a member of the group the category belongs to and they
// must have the required permissions (either group owner or admin).
export async function createCategory(
    groupId: string,
    category: CategoryInput,
    userId: string,
): Promise<Category | null> {
    const result = await pool.query<Category>(
        `INSERT INTO event_categories
          (group_id, name, color, icon, created_by)
          SELECT $1, $2, $3, $4, $5
            WHERE EXISTS (
              SELECT 1 FROM group_memberships AS gm
                WHERE gm.user_id = $5
                AND gm.group_id = $1
                AND gm.role IN ('owner', 'admin')
            )
            RETURNING *;`,
        [groupId, category.name, category.color, category.icon, userId]
    );
    return result.rowCount !== 1 ? null : result.rows[0];
}


// Update a category in the 'event_categories' table. The user updating the
// category must be a member of the group the category belongs to and they
// must have the required permissions (either group owner or admin).
export async function updateCategory(
    categoryId: string,
    category: CategoryInput,
    userId: string,
): Promise<Category | null> {
    const result = await pool.query<Category>(
        `UPDATE event_categories AS ec
          SET name = $2, color = $3, icon = $4
          WHERE ec.id = $1
          AND EXISTS (
            SELECT 1 FROM group_memberships AS gm
              WHERE gm.user_id = $5
              AND gm.group_id = ec.group_id
              AND gm.role IN ('owner', 'admin')
          )
          RETURNING ec.*;`,
        [categoryId, category.name, category.color, category.icon, userId]
    );

    return result.rowCount !== 1 ? null : result.rows[0];
}


// Delete a category from the 'event_categories' table. The user deleting the
// category must be a member of the group containing the category, and they
// must have the required permissions (either group owner or admin).
export async function deleteCategory(
    categoryId: string,
    userId: string,
): Promise<boolean> {
    const result = await pool.query(
        `DELETE FROM event_categories AS ec
          WHERE ec.id = $1
          AND EXISTS (
            SELECT 1 FROM group_memberships AS gm
              WHERE gm.user_id = $2
              AND gm.group_id = ec.group_id
              AND gm.role IN ('owner', 'admin')
          );`,
        [categoryId, userId]
    );
    return result.rowCount === 1;
}
