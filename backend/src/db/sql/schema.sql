-- ============================================================
-- Calendar App Database Schema
-- PostgreSQL
-- ============================================================


-- Provides gen_random_uuid(), used to automatically generate
-- UUID primary keys throughout the database.
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
-- USERS
-- ============================================================
-- 
-- Represents a registered user of the calendar application.
--
-- id:            Unique identifier for the user.
-- username:      Public/login username for the user.
-- email:         User's email address, used for login and account recovery.
-- password_hash: Secure hash of the user's password.
-- created_at:    Timestamp recording when the account was created.
-- updated_at:    Timestamp recording when the user record was last changed.
--
CREATE TABLE users (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    username      TEXT        NOT NULL UNIQUE,
    email         TEXT        NOT NULL UNIQUE,
    password_hash TEXT        NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- GROUPS
-- ============================================================
--
-- A group is a collection of users who can share calendars and collaborate on events.
-- Groups with one member are effectively personal groups, and the calendars they own
-- function as personal calendars.
--
-- id:          Unique identifier for the group.
-- name:        Display name of the group.
-- description: Optional longer description explaining the group's purpose.
-- created_at:  Timestamp recording when the group was created.
-- updated_at:  Timestamp recording when the group was last changed.
--
CREATE TABLE groups (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT        NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- GROUP MEMBERSHIPS
-- ============================================================
-- 
-- Junction table connecting users and groups.
-- A user can belong to many groups. A group can contain many users.
-- Primary key: combination of user_id and group_id. Prevents a user
-- from being added to a group more than once.
--
-- user_id:    The user who belongs to the group. If the user account is
--             deleted, their memberships are automatically removed.
-- group_id:   The group the user belongs to. If the group is deleted,
--             all memberships for that group are automatically removed.
-- role:       Determines the user's permissions within the group.
--                owner: Can manage the group, memberships, and calendar content.
--                editor: Can create and edit shared calendar content.
--                viewer: Can view shared calendar content but cannot modify it.
-- created_at: Timestamp recording when the user joined the group.
--
CREATE TABLE group_memberships (
    user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id   UUID        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    role       TEXT        NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (user_id, group_id)
);


-- ============================================================
-- CALENDARS
-- ============================================================
-- 
-- Represents an individual calendar. Each calendar belongs to a group,
-- which can be one or many users.
--
-- id:          Unique identifier for the calendar.
-- group_id:    The group that owns this calendar. If the group
--              is deleted, its calendars are also deleted.
-- name:        Display name of the calendar.
-- description: Optional longer description explaining the calendar's purpose.
-- created_at:  Timestamp recording when the calendar was created.
-- updated_at:  Timestamp recording when the calendar was last changed.
--
CREATE TABLE calendars (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id    UUID        NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- EVENT CATEGORIES
-- ============================================================
-- 
-- Defines customizable event types within a calendar.
-- Categories are calendar-specific, so different calendars can define
-- their own categories and the colors for those categories.
-- Category names must be unique within a calendar, but different
-- calendars can use the same category names.
--
-- id:          Unique identifier for the category.
-- calendar_id: The calendar this category belongs to. If the calendar
--              is deleted, its categories are also deleted.
-- name:        Display name of the category.
-- color:       CSS-compatible color used to render events in this category.
-- icon:        Icon representing the category. Example: "fa-star"
-- created_by:  User who created the category. If the user is deleted,
--              the category remains but created_by is set to NULL.
-- created_at:  Timestamp recording when the category was created.
-- updated_at:  Timestamp recording when the category was last changed.
--
CREATE TABLE event_categories (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id UUID        NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    name        TEXT        NOT NULL,
    color       TEXT        NOT NULL,
    icon        TEXT        NOT NULL DEFAULT 'calendar',
    created_by  UUID        REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (calendar_id, name)
);


-- ============================================================
-- RECURRING EVENTS
-- ============================================================
-- 
-- Stores recurring event SERIES rather than individual occurrences.
-- Example: "Gym every Monday at 6 PM" exists as ONE row here.
-- Future occurrences are generated dynamically from the recurrence rule.
-- Once an occurrence has passed, it can be materialized into the
-- events table so historical calendar data never changes.
-- A recurrence end cannot occur before the series begins.
-- Event duration must be positive.
--
-- id:              Unique identifier for the recurring series.
-- calendar_id:     The calendar this recurring series belongs to. If a calendar
--                  is deleted, its recurring series are also deleted.
-- created_by:      User who originally created the recurring series. If the user
--                  is deleted, the series remains but created_by is set to NULL
--                  (deleting a user should not erase shared group events).
-- category_id:     Optional category controlling the event's color/type. If the category
--                  is deleted, the recurring event remains but becomes uncategorized.
-- name:            Display name of the recurring event.
-- description:     Optional detailed description.
-- location:        Optional location information.
-- start_time:      Start timestamp of the first occurrence in the recurring series.
-- duration:        Length of each generated occurrence. Ex: INTERVAL '1 hour'
-- recurrence_rule: Rule defining how the event repeats. Format: iCalendar RRULE.
-- timezone:        Named timezone used when interpreting recurrence timing.
-- recurrence_end:  Optional timestamp after which no new occurrences should be generated.
--                  Must be derived from the RRULE. NULL means no defined ending.
-- is_all_day:      Whether generated occurrences should be treated as all-day events
--                  rather than events at a specific clock time.
-- created_at:      Timestamp recording when the recurring series was created.
-- updated_at:      Timestamp recording when the recurring series was last changed.
--
CREATE TABLE recurring_events (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id     UUID        NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    created_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
    category_id     UUID        REFERENCES event_categories(id) ON DELETE SET NULL,
    name            TEXT        NOT NULL,
    description     TEXT,
    location        TEXT,
    start_time      TIMESTAMPTZ NOT NULL,
    duration        INTERVAL    NOT NULL,
    recurrence_rule TEXT        NOT NULL,
    timezone        TEXT        NOT NULL,
    recurrence_end  TIMESTAMPTZ,
    is_all_day      BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (recurrence_end IS NULL OR recurrence_end >= start_time),
    CHECK (duration > INTERVAL '0 seconds')
);


-- ============================================================
-- RECURRENCE EXCEPTIONS
-- ============================================================
--
-- Suppresses one specific occurrence of a recurring series.
-- Normally, recurring occurrences are generated dynamically from
-- recurring_events. If a row exists here for an occurrence, that
-- generated occurrence should not be displayed.
-- This is used when a user deletes or edits one occurrence. In the
-- case of edits, the original occurrence is suppressed here and a
-- replacement concrete event is inserted into events.
--
-- recurring_event_id:  Recurring series containing the occurrence.
-- original_start_time: Original start time generated by the recurrence
--                      rule. Together with recurring_event_id, uniquely
--                      identifies the virtual occurrence.
-- created_by:          User who created the exception.
-- created_at:          Timestamp when the exception was created.
--
CREATE TABLE recurrence_exceptions (
    recurring_event_id  UUID        NOT NULL REFERENCES recurring_events(id) ON DELETE CASCADE,
    original_start_time TIMESTAMPTZ NOT NULL,
    created_by          UUID        REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (recurring_event_id, original_start_time)
);


-- ============================================================
-- EVENTS
-- ============================================================
--
-- Stores concrete events.
--
-- These include normal one-off events, past recurring occurrences that
-- have been materialized into permanent historical events, and
-- replacement events created when one occurrence of a recurring series
-- is individually edited. The original dynamically generated occurrence
-- is suppressed through recurrence_exceptions.
-- There are 4 possible states for source_recurrence_id and source_occurrence_start:
-- 1. source_recurrence_id and source_occurrence_start both NULL:
--      originally a normal event
-- 2. source_recurrence_id and source_occurrence_start both NOT NULL:
--      concrete event derived from a recurring occurrence
--      whose recurring series still exists
-- 3. source_recurrence_id = NULL and source_occurrence_start != NULL:
--      concrete event derived from a recurring occurrence
--      whose recurring series was later deleted
-- 4. source_recurrence_id != NULL and source_occurrence_start = NULL
--     invalid state, prevented by a CHECK constraint
--
-- id:                      Unique identifier for the concrete event.
-- calendar_id:             The calendar this event belongs to. If the calendar is
--                          deleted, all of its events are also deleted.
-- created_by:              User who originally created this event. If the user is
--                          deleted, the event remains but created_by is set to NULL.
-- category_id:             Optional category controlling the event's color/type. If the category
--                          is deleted, the event remains but becomes uncategorized.
-- source_recurrence_id:    If this event was created from a recurring series after an occurrence
--                          passed, this references that original series. NULL means this was always
--                          a normal one-off event, or the original series was deleted. SET NULL
--                          preserves historical events if the recurring series is later deleted.
-- source_occurrence_start: If this event was derived from a recurring series,
--                          this is the original start time generated by that
--                          series. It remains populated even if the recurring
--                          series is later deleted. NULL means this was always
--                          a normal one-off event.
-- name:                    Display name of the event.
-- description:             Optional detailed description.
-- location:                Optional location information.
-- start_time:              Actual start time of this concrete event.
-- end_time:                Actual end time of this concrete event.
-- is_all_day:              Whether this event should be displayed as an all-day event.
-- created_at:              Timestamp recording when the event was created.
-- updated_at:              Timestamp recording when the event was last changed.
--
CREATE TABLE events (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id             UUID        NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    created_by              UUID        REFERENCES users(id) ON DELETE SET NULL,
    category_id             UUID        REFERENCES event_categories(id) ON DELETE SET NULL,
    source_recurrence_id    UUID        REFERENCES recurring_events(id) ON DELETE SET NULL,
    source_occurrence_start TIMESTAMPTZ,
    name                    TEXT        NOT NULL,
    description             TEXT,
    location                TEXT,
    start_time              TIMESTAMPTZ NOT NULL,
    end_time                TIMESTAMPTZ NOT NULL,
    is_all_day              BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (end_time > start_time),
    CHECK (source_recurrence_id IS NULL OR source_occurrence_start IS NOT NULL),

    UNIQUE (source_recurrence_id, source_occurrence_start)
);


-- ============================================================
-- ATTACHMENTS
-- ============================================================
-- 
-- Stores metadata for files and images attached to events. The actual file
-- should normally live in object storage such as Amazon S3, Cloudflare R2,
-- or Supabase Storage. This is information needed to locate and describe it.
--
-- id:          Unique identifier for the attachment.
-- uploaded_by: User who uploaded the attachment. If the user is deleted, the
--              attachment remains but uploaded_by is set to NULL.
-- file_name:   File name shown to the user.
-- storage_key: Unique path/key used to locate the file in object storage.
-- mime_type:   MIME type identifying the file format. Example: image/jpeg.
-- size_bytes:  File size in bytes.
-- created_at:  Timestamp recording when the file was uploaded.
--
CREATE TABLE attachments (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    uploaded_by UUID        REFERENCES users(id) ON DELETE SET NULL,
    file_name   TEXT        NOT NULL,
    storage_key TEXT        NOT NULL UNIQUE,
    mime_type   TEXT,
    size_bytes  BIGINT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CHECK (size_bytes IS NULL OR size_bytes >= 0)
);


-- ============================================================
-- EVENT ATTACHMENTS
-- ============================================================
-- 
-- Junction table connecting events and attachments. An event can have many
-- attachments, and an attachment can be associated with many events. The
-- combination of event_id and attachment_id is unique and prevents duplicate
-- associations.
--
-- event_id:      The event this attachment is associated with. If the event
--                is deleted, the association is automatically removed.
-- attachment_id: The attachment associated with the event. If the attachment
--                is deleted, the association is automatically removed.
--
CREATE TABLE event_attachments (
    event_id      UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    attachment_id UUID NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,

    PRIMARY KEY (event_id, attachment_id)
);


-- ============================================================
-- RECURRING EVENT ATTACHMENTS
-- ============================================================
-- 
-- Junction table connecting recurring events and attachments. An attachment
-- can be associated with many recurring events, and a recurring event can have
-- many attachments. The combination of recurring_event_id and attachment_id
-- is unique and prevents duplicate associations.
--
-- recurring_event_id: The recurring event this attachment is associated with. If the
--                     recurring event is deleted, the association is automatically removed.
-- attachment_id:      The attachment associated with the recurring event. If the
--                     attachment is deleted, the association is automatically removed.
--
CREATE TABLE recurring_event_attachments (
    recurring_event_id UUID NOT NULL REFERENCES recurring_events(id) ON DELETE CASCADE,
    attachment_id      UUID NOT NULL REFERENCES attachments(id) ON DELETE CASCADE,

    PRIMARY KEY (recurring_event_id, attachment_id)
);


-- ============================================================
-- INDEXES
-- ============================================================

-- Useful for listing all members of a group. Example:
--   SELECT * FROM group_memberships WHERE group_id = $1;
CREATE INDEX idx_group_memberships_group_user
    ON group_memberships(group_id, user_id);

-- Find all calendars owned by a group.
CREATE INDEX idx_calendars_group_id
    ON calendars(group_id);

-- Supports finding events belonging to a calendar within a date range.
-- Example:
--   SELECT * FROM events WHERE calendar_id = $1
--     AND start_time < $window_end
--     AND end_time > $window_start;
CREATE INDEX idx_events_calendar_start_time
    ON events(calendar_id, start_time);

-- Supports loading recurring series for a calendar
CREATE INDEX idx_recurring_events_calendar_start_time
    ON recurring_events(calendar_id, start_time);

-- Supports finding events that reference a particular attachment.
CREATE INDEX idx_event_attachments_attachment_id
    ON event_attachments(attachment_id);

-- Supports finding recurring series that reference a particular attachment.
CREATE INDEX idx_recurring_event_attachments_attachment_id
    ON recurring_event_attachments(attachment_id);
