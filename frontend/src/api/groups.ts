import type { UserGroup } from "../types/Group";

// Backend API URL
const API_URL = import.meta.env.VITE_BACKEND_API_URL;

// API request to get all groups a user is a member of
export async function userGroupsRequest(token: string): Promise<UserGroup[]> {
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
