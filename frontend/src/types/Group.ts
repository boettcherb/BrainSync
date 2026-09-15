// Group data type: Matches the 'groups' table in the database schema.
export interface Group {
    id:          string;
    name:        string;
    description: string | null;
    created_at:  Date;
    updated_at:  Date;
}

// GroupInput data type: Used when creating or updating a group.
// Includes only fields that users are allowed to set or modify.
// All other fields are either unchanged or set automatically by the backend.
export interface GroupInput {
    name:        string;
    description: string | null;
}


// Group Roles:
// owner:       Can do anything, including deleting the group and transferring
//              ownership. Must transfer ownership before leaving group.
// admin:       Can manage all group calendar content and lower members,
//              but cannot perform owner-only actions.
// editor:      Can create/modify/delete any events, but can't modify group
//              or calendar settings
// contributor: Can create events, but can't modify or delete other user's events.
// viewer:      Read-only.
//                                      Owner  Admin  Editor Contributor Viewer
// GROUP
// Delete group                           Y      -      -        -         -
// Transfer ownership                     Y      -      -        -         -
// Modify group name/description          Y      Y      -        -         -
// View group members                     Y      Y      Y        Y         Y
//
// MEMBERS
// Add/remove admins                      Y      -      -        -         -
// Add/remove editors                     Y      Y      -        -         -
// Add/remove contributors                Y      Y      -        -         -
// Add/remove viewers                     Y      Y      -        -         -
// Change admin/owner roles               Y      -      -        -         -
// Change non-admin/owner roles           Y      Y      -        -         -
// Remove self / leave group              -      Y      Y        Y         Y
//
// CALENDARS
// Add/Delete/Modify calendars            Y      Y      -        -         -
// View calendars                         Y      Y      Y        Y         Y
//
// CATEGORIES
// Add/Modify/Delete categories           Y      Y      -        -         -
// View categories                        Y      Y      Y        Y         Y
//
// EVENTS
// Add events                             Y      Y      Y        Y         -
// View events                            Y      Y      Y        Y         Y
// Modify/Delete owned events             Y      Y      Y        Y         -
// Modify all events                      Y      Y      Y        -         -
// Delete all events                      Y      Y      Y        -         -
export type GroupRole = 'owner' | 'admin' | 'editor' | 'contributor' | 'viewer';
