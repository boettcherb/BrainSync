import { pool } from "./pool.js";
import type { GroupMember } from '../types/User.js';
import type { Group, GroupInput, GroupRole, UserGroup } from '../types/Group.js';
import { AppError } from "../appError.js";


// Insert a new Group into the 'groups' table. The User with the given userId
// will be the group owner. Use a transaction to ensure the group is created,
// and that the User with the given userId is stored as the group owner
// in the 'group_memberships' table. 
export async function createGroup(
    newGroup: GroupInput,
    userId: string
): Promise<Group> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await client.query<Group>(
            `INSERT INTO groups (name, description)
              VALUES ($1, $2)
              RETURNING *;`,
            [newGroup.name, newGroup.description]
        );
        const group = result.rows[0];
        if (!group) throw new Error("Failed to create group");
        await client.query(
            `INSERT INTO group_memberships (user_id, group_id, role)
              VALUES ($1, $2, 'owner');`,
            [userId, group.id]
        );
        await client.query('COMMIT');
        return group;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}


// Update a group in the database. Only the group owner or group admins can
// update the group. Return null if the row was not updated
export async function updateGroup(
    groupId: string,
    groupData: GroupInput,
    userId: string,
): Promise<Group | null> {
    const result = await pool.query<Group>(
        `UPDATE groups g
          SET name = $1, description = $2
          WHERE g.id = $3
          AND EXISTS (
            SELECT 1 FROM group_memberships gm
              WHERE gm.group_id = g.id
              AND gm.user_id = $4
              AND gm.role IN ('owner', 'admin')
          )
          RETURNING g.*;`,
        [groupData.name, groupData.description, groupId, userId]
    );
    return result.rows[0] ?? null;
}


// Delete a group from the 'groups' table. Only the group
// owner can delete a group
export async function deleteGroup(
    groupId: string,
    userId: string,
): Promise<boolean> {
    const result = await pool.query(
        `DELETE FROM groups g
          WHERE g.id = $1
          AND EXISTS (
            SELECT 1 FROM group_memberships gm
              WHERE gm.group_id = g.id
              AND gm.user_id = $2
              AND gm.role = 'owner'
            );`,
        [groupId, userId]
    );
    return result.rowCount === 1;
}


// Retrieve all groups that the User with the given userId is a part of.
// Achieve this by joining the 'groups' and 'group_memberships' tables.
export async function getGroupsByUserId(userId: string): Promise<UserGroup[]> {
    const result = await pool.query<UserGroup>(
        `SELECT g.id, g.name, g.description, g.created_at, g.updated_at, gm.role
          FROM groups g
          JOIN group_memberships gm
            ON g.id = gm.group_id
          WHERE gm.user_id = $1
          ORDER BY g.created_at;`,
        [userId]
    );
    return result.rows;
}


// Retrieve all the members of a group. The user requesting the group's
// members must be a member of the group.
export async function getGroupMembers(
    groupId: string,
    userId: string,
): Promise<GroupMember[]> {
    const result = await pool.query<GroupMember>(
        `SELECT u.id, u.username, u.display_name, gm.role
          FROM group_memberships AS gm
          JOIN users AS u
            ON gm.user_id = u.id
          WHERE gm.group_id = $1
          AND EXISTS (
              SELECT 1 FROM group_memberships AS requester
              WHERE requester.group_id = $1
              AND requester.user_id = $2
          )
          ORDER BY
            array_position(
              ARRAY['owner', 'admin', 'editor', 'contributor', 'viewer'],
              gm.role
            ),
            u.display_name;`,
        [groupId, userId]
    );
    return result.rows;
}


// Leave a group. An owner cannot leave a group. They must transfer
// ownership first.
export async function leaveGroup(
    groupId: string,
    userId: string,
): Promise<boolean> {
    const result = await pool.query(
        `DELETE FROM group_memberships
          WHERE group_id = $1
          AND user_id = $2
          AND role <> 'owner';`,
        [groupId, userId]
    );
    return result.rowCount === 1;
}


// Add a member to a group. The user adding the member have the required
// permissions (must be owner adding a member with role < 'owner', or an admin
// adding a member with role < 'admin'). The member being added must exist in
// the 'users' table, and cannot already be a member of the group.
export async function addGroupMember(
  groupId: string,
  username: string,
  role: GroupRole,
  userId: string,
): Promise<GroupMember> {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        // verify requester permissions
        const resultRoles = await client.query(
            `SELECT role FROM group_memberships
              WHERE user_id = $1
              AND group_id = $2
              FOR UPDATE;`,
            [userId, groupId]
        );
        if (resultRoles.rowCount === 0) {
            throw new AppError("You do not have access to this group", 403);
        }
        const requesterRole = resultRoles.rows[0].role as GroupRole;
        const allowed = role !== 'owner' && (requesterRole === 'owner' ||
            (requesterRole === 'admin' && role !== 'admin'));
        if (!allowed) {
            throw new AppError("Insufficient permissions", 403);
        }
        // verify member is in the users table
        type userResultRow = {
            id: string,
            username: string,
            display_name: string
        };
        const userResult = await client.query<userResultRow>(
            `SELECT id, username, display_name FROM users
              WHERE username = $1;`,
            [username]
        ); 
        if (userResult.rowCount === 0) {
            throw new AppError('User not found', 404);
        }
        const member = userResult.rows[0];
        // Add the member to the group
        const insertResult = await client.query(
            `INSERT INTO group_memberships (user_id, group_id, role)
              VALUES ($1, $2, $3)
              ON CONFLICT (user_id, group_id) DO NOTHING
              RETURNING *;`,
            [member.id, groupId, role]
        );
        if (insertResult.rowCount === 0) {
            throw new AppError('User is already a group member', 409);
        }
        // No errors: commit the transaction and return a GroupMember
        await client.query('COMMIT');
        return {
            id: member.id,
            username: member.username,
            display_name: member.display_name,
            role: role,
        }
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}


// Remove a specific member from a group. Owners can remove any member
// (except themselves), while admins can only remove members with lower
// roles (editors, contributors, and viewers).
// Users cannot remove themselves here. Use leaveGroup instead.
export async function removeGroupMember(
    groupId: string,
    memberId: string,   // the member to be removed from the group
    userId: string,     // the owner or admin performing the removal
): Promise<boolean> {
    if (memberId === userId) return false;
    const result = await pool.query(
        `DELETE FROM group_memberships AS member
          WHERE member.group_id = $1
          AND member.user_id = $2
          AND EXISTS (
            SELECT 1 FROM group_memberships AS requester
              WHERE requester.group_id = member.group_id
              AND requester.user_id = $3
              AND (
                (requester.role = 'owner' AND member.role <> 'owner')
                OR
                (requester.role = 'admin' AND member.role NOT IN ('owner', 'admin'))
              )
          );`,
        [groupId, memberId, userId]
    );
    return result.rowCount === 1;
}
