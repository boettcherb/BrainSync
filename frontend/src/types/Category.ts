// Category data type: Matches the 'event_categories' table in the database schema.
export interface Category {
    id:          string;
    calendar_id: string;
    name:        string;
    color:       string;
    icon:        string;
    created_by:  string | null;
    created_at:  Date;
    updated_at:  Date;
}

// CategoryInput data type: Used when creating or updating a category.
// Includes only fields that users are allowed to set or modify.
// All other fields are either unchanged or set automatically by the backend.
export interface CategoryInput {
    name:        string;
    color:       string;
    icon:        string;
}
