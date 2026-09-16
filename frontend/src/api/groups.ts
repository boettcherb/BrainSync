import type { Group, UserGroup, GroupInput } from "../types/Group";

// Backend API URL
const API_URL = import.meta.env.VITE_BACKEND_API_URL;

// API request to get all groups a user is a member of
export async function getUserGroupsRequest(token: string): Promise<UserGroup[]> {
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
export async function createGroupRequest(
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
export async function updateGroupRequest(
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
export async function deleteGroupRequest(
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
        throw new Error(data.message || "Error deleting group");
    }
}
