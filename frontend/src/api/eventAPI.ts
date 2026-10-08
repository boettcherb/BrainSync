import type { Event, EventInput } from '../types/Event';

const API_URL = import.meta.env.VITE_BACKEND_API_URL;

// API request to fetch all events for a specific group.
export async function getGroupEvents(
  groupId: string,
  token: string,
): Promise<Event[]> {
  const response = await fetch(`${API_URL}/groups/${groupId}/events`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || 'Error fetching group events');
  }
  return data;
}

// API request to create an event for a group.
export async function createEvent(
  groupId: string,
  event: EventInput,
  token: string,
): Promise<Event> {
  const response = await fetch(`${API_URL}/groups/${groupId}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(event),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message || 'Error creating event');
  }
  return data;
}
