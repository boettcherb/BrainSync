import type { Category } from "../types/Category";

// Backend API URL
const API_URL = import.meta.env.VITE_BACKEND_API_URL;


// API request to get all of a calendar's categories
export async function getGroupCategories(
    groupId: string,
    token: string,
): Promise<Category[]> {
    const url = `${API_URL}/groups/${groupId}/categories`;
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(data?.message || "Error retrieving categories");
    }
    return data;
}

