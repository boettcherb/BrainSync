import type { Event, EventInput } from '../types/Event';

const API_URL = import.meta.env.VITE_BACKEND_API_URL;

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
