import { pool } from "./pool";
import type { User, PublicUser, CreateUserInput, GroupMember } from '../types/User';
import type { Group, GroupInput, GroupRole, UserGroup } from '../types/Group';


// Query the 'users' table for a row containing the given email. Email has
// a UNIQUE constraint, so at most 1 row should be found.
export async function getUserByEmail(email: string): Promise<User | null> {
    const result = await pool.query<User>(
        `SELECT * FROM users
          WHERE email = $1;`,
        [email]
    );
    return result.rows[0] ?? null;
}


// Query the 'users' table for a row containing the given username. Username
// has a UNIQUE constraint, so at most 1 row should be found.
export async function getUserByUsername(username: string): Promise<User | null> {
    const result = await pool.query<User>(
        `SELECT * FROM users
          WHERE username = $1;`,
        [username]
    );
    return result.rows[0] ?? null;
}


// Insert a new User into the 'users' table. Return that row on success.
export async function createUser(newUser: CreateUserInput): Promise<PublicUser> {
    const result = await pool.query<PublicUser>(
        `INSERT INTO users (email, username, display_name, password_hash)
          VALUES ($1, $2, $3, $4)
          RETURNING id, email, email_verified, username,
            display_name, created_at, updated_at;`,
        [newUser.email, newUser.username, newUser.display_name, newUser.password_hash]
    );
    if (!result.rows[0]) throw new Error("Failed to create user");
    return result.rows[0];
}


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


// Add a User to a Group by storing their group membership in the
// 'group_memberships' table.
export async function addUserToGroup(
    userId: string,
    groupId: string,
    role: GroupRole,
): Promise<boolean> {
    if (role === 'owner') {
        throw new Error("Cannot add a user to a group with the owner role");
    }
    const result = await pool.query(
        `INSERT INTO group_memberships (user_id, group_id, role)
          VALUES ($1, $2, $3);`,
        [userId, groupId, role]
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


// Find the role that a user has within a group
export async function getUserRoleInGroup(
    userId: string,
    groupId: string,
): Promise<GroupRole | null> {
    const result = await pool.query<{ role: GroupRole }>(
        `SELECT role FROM group_memberships
          WHERE user_id = $1
          AND group_id = $2;`,
        [userId, groupId]
    );
    return result.rows[0]?.role ?? null;
}


// Delete a group from the database
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


// Update a group in the database. Return null if the row was not updated
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


// Leave a group. An owner cannot leave the group. They must transfer
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


// Retrieve all the members of a group.
export async function getGroupMembers(groupId: string): Promise<GroupMember[]> {
    const result = await pool.query<GroupMember>(
        `SELECT u.id, u.username, u.display_name, gm.role
          FROM group_memberships AS gm
          JOIN users AS u
            ON gm.user_id = u.id
          WHERE gm.group_id = $1
          ORDER BY
            CASE gm.role
              WHEN 'owner' THEN 1
              WHEN 'admin' THEN 2
              WHEN 'editor' THEN 3
              WHEN 'contributor' THEN 4
              WHEN 'viewer' THEN 5
              ELSE 999
            END,
            u.display_name;`,
        [groupId]
    );
    return result.rows;
}
