import type { Calendar, CalendarInput } from "../types/Calendar";
import type { Category } from "../types/Category";

// Backend API URL
const API_URL = import.meta.env.VITE_BACKEND_API_URL;

// API request to update a calendar
export async function updateCalendar(
    calendarId: string,
    updatedCalendar: CalendarInput,
    token: string,
): Promise<Calendar> {
    const response = await fetch(`${API_URL}/calendars/${calendarId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedCalendar)
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(data?.message || "Error updating caldendar");
    }
    return data;
}

// API request to delete a calendar
export async function deleteCalendar(
    calendarId: string,
    token: string,
): Promise<void> {
    const response = await fetch(`${API_URL}/calendars/${calendarId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(data?.message || "Error deleting calendar");
    }
}

// API request to get all of a calendar's categories
export async function getCalendarCategories(
    calendarId: string,
    token: string,
): Promise<Category[]> {
    const url = `${API_URL}/calendars/${calendarId}/categories`;
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

// API request to get all of a group's calendars
export async function getGroupCalendars(
    groupId: string,
    token: string,
): Promise<Calendar[]> {
    const response = await fetch(`${API_URL}/groups/${groupId}/calendars`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(data?.message || "Error retrieving caldendars");
    }
    return data;
}

// API request to create a calendar for a group
export async function createCalendar(
    groupId: string,
    calendar: CalendarInput,
    token: string,
): Promise<Calendar> {
    const response = await fetch(`${API_URL}/groups/${groupId}/calendars`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(calendar),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new Error(data?.message || "Error creating calendar");
    }
    return data;
}
