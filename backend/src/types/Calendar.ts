// Calendar data type: Matches the 'calendars' table in the database schema.
export interface Calendar {
    id:          string;
    group_id:    string | null;
    name:        string;
    description: string | null;
    created_at:  Date;
    updated_at:  Date;
}

// CalendarInput data type: Used when creating or updating a calendar.
// Includes only fields that users are allowed to set or modify.
// All other fields are either unchanged or set automatically by the backend.
export interface CalendarInput {
    name:        string;
    description: string | null;
}
