// Event data type: Matches the 'events' table in the database schema.
export interface Event {
    id:                       string;
    calendar_id:              string;
    created_by?:              string | null;
    category_id?:             string | null;
    source_recurrence_id?:    string | null;
    source_occurrence_start?: Date | null;
    name:                     string;
    description?:             string | null;
    location?:                string | null;
    start_time:               Date;
    end_time:                 Date;
    is_all_day:               boolean;
    created_at:               Date;
    updated_at:               Date;
};

// EventInput data type: Used when creating or updating events.
// Includes only fields that users are allowed to set or modify.
// All other fields are either unchanged or set automatically by the backend.
export interface EventInput {
    category_id?: string | null;
    name:         string;
    description?: string | null;
    location?:    string | null;
    start_time:   Date;
    end_time:     Date;
    is_all_day:   boolean;
}
