import type { Group, UserGroup, GroupInput, GroupRole } from "../types/Group";
import type { GroupMember } from "../types/User";

// Backend API URL
const API_URL = import.meta.env.VITE_BACKEND_API_URL;

// API request to get all groups a user is a member of
export async function getUserGroups(token: string): Promise<UserGroup[]> {
    const response = await fetch(`${API_URL}/groups`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        }
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Error retrieving user groups");
    }
    return data;
}

// API Request to create a group
export async function createGroup(
    newGroup: GroupInput,
    token: string,
): Promise<Group> {
    const response = await fetch(`${API_URL}/groups`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newGroup),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Error creating new group");
    }
    return data;
}

// API request to update group details
export async function updateGroup(
    groupId: string,
    newGroupData: GroupInput,
    token: string,
): Promise<Group> {
    const response = await fetch(`${API_URL}/groups/${groupId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newGroupData),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Error updating group");
    }
    return data;
}

// API request to delete a group
export async function deleteGroup(
    groupId: string,
    token: string,
): Promise<void> {
    const response = await fetch(`${API_URL}/groups/${groupId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        }
    });
    if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Error deleting group");
    }
}

// API request to retrieve the members of a group
export async function getGroupMembers(
    groupId: string,
    token: string,
): Promise<GroupMember[]> {
    const response = await fetch(`${API_URL}/groups/${groupId}/members`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        }
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Error retrieving group members");
    }
    return data;
}

// API request to leave a group
export async function leaveGroup(
    groupId: string,
    token: string,
): Promise<void> {
    const response = await fetch(`${API_URL}/groups/${groupId}/members/me`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        }
    });
    if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Error leaving group");
    }
}

// API request to add a member to a group
export async function addGroupMember(
    groupId: string,
    username: string,
    role: GroupRole,
    token: string,
): Promise<GroupMember> {
    const url = `${API_URL}/groups/${groupId}/members/`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username, role }),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || "Error adding member to group");
    }
    return data;
}

// API request to remove a specific member from a group
export async function removeGroupMember(
    groupId: string,
    memberId: string,
    token: string,
): Promise<void> {
    const url = `${API_URL}/groups/${groupId}/members/${memberId}`;
    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        }
    });
    if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || "Error removing group member");
    }
}
