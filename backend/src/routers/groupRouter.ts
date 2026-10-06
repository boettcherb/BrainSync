import express from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/authMiddleware';
import * as groupDB from '../db/groupDB';
import * as categoryDB from '../db/categoryDB';
import * as eventDB from '../db/eventDB';
import { AppError } from '../appError';
import { GroupRole } from '../types/Group';

const router = express.Router();
router.use(requireAuth); // Authenticate all endpoints in this file


// GET /groups - Get groups the current user is a member of
router.get('/', async (req: AuthenticatedRequest, res) => {
    try {
        const userId: string = req.user!.userId;
        const userGroups = await groupDB.getGroupsByUserId(userId);
        res.json(userGroups);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// POST /groups - Create a group
router.post('/', async (req: AuthenticatedRequest, res) => {
    try {
        const userId: string = req.user!.userId;
        const { name, description } = req.body;
        if ((description !== null && typeof description !== 'string')
            || typeof name !== 'string' || name.trim().length === 0) {
            res.status(400).json({ message: "Invalid group data" });
            return;
        }
        const groupInput = {
            name: name.trim(),
            description: description === null ? null : description.trim(),
        };
        const group = await groupDB.createGroup(groupInput, userId);
        res.status(201).json(group);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// PUT /groups/:groupId - Update a specific group
router.put('/:groupId', async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user!.userId;
        const groupId = req.params.groupId as string;
        const { name, description } = req.body;
        if ((description !== null && typeof description !== 'string')
            || typeof name !== 'string' || name.trim().length === 0) {
            res.status(400).json({ message: "Invalid group data" });
            return;
        }
        const groupInput = {
            name: name.trim(),
            description: description === null ? null : description.trim(),
        };
        const group = await groupDB.updateGroup(groupId, groupInput, userId);
        if (!group) {
            res.status(403).json({
                message: "You do not have permission to edit this group"
            });
            return;
        }
        res.json(group);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// DELETE /groups/:groupId - Delete a specific group
router.delete('/:groupId', async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user!.userId;
        const groupId = req.params.groupId as string;
        const deleted = await groupDB.deleteGroup(groupId, userId);
        if (!deleted) {
            res.status(403).json({
                message: "You do not have permission to delete this group"
            });
            return;
        }
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
})


// GET /groups/:groupId/members - Get members of a specific group
router.get('/:groupId/members', async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user!.userId;
        const groupId = req.params.groupId as string;
        const groupMembers = await groupDB.getGroupMembers(groupId, userId);
        res.json(groupMembers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// POST /groups/:groupId/members - Add a member to a group
router.post('/:groupId/members', async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user!.userId;
        const groupId = req.params.groupId as string;
        const { username, role } = req.body;
        if (typeof username !== 'string' || username.trim().length === 0) {
            res.status(400).json({ message: 'Username is required' });
            return;
        }
        const validRoles = ['admin', 'editor', 'contributor', 'viewer'];
        if (typeof role !== 'string' || !validRoles.includes(role)) {
            res.status(400).json({ message: 'Invalid group role' });
            return;
        }
        const newMember = await groupDB.addGroupMember(
            groupId, username.trim().toLowerCase(), role as GroupRole, userId
        );
        res.status(201).json(newMember);
    } catch (error) {
        if (error instanceof AppError) {
            res.status(error.statusCode).json({ message: error.message });
            return;
        }
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// DELETE /groups/:groupId/members/me - Leave a specific group
router.delete('/:groupId/members/me', async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user!.userId;
        const groupId = req.params.groupId as string;
        const left = await groupDB.leaveGroup(groupId, userId);
        if (!left) {
            res.status(403).json({ message: "Error leaving the group" });
            return;
        }
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// DELETE /groups/:groupId/members/:memberId - Remove a specific member from a group
router.delete('/:groupId/members/:memberId', async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user!.userId;
        const groupId = req.params.groupId as string;
        const memberId = req.params.memberId as string;
        const removed = await groupDB.removeGroupMember(groupId, memberId, userId);
        if (!removed) {
            res.status(403).json({ message: "You do not have permission to "
                + "remove this member from the group" });
            return;
        }
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// PATCH /groups/:groupId/members/:memberId - update permissions for a group member
router.patch('/:groupId/members/:memberId', async (req: AuthenticatedRequest, res) => {
    try {
        // not implemented yet
        res.status(501).json({ message: "Not implemented yet" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// GET /groups/:groupId/events - Get all of a group's events
router.get('/:groupId/events', async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user!.userId;
        const groupId = req.params.groupId as string;
        const eventList = await eventDB.getGroupEvents(groupId, userId);
        res.json(eventList);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// POST /groups/:groupId/events - Create a new event for a group
router.post('/:groupId/events', async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user!.userId;
        const groupId = req.params.groupId as string;
        const { eventInput } = req.body;
        const newEvent = await eventDB.createEvent(eventInput, groupId, userId);
        if (!newEvent) {
            res.status(400).json({ message: "Failed to create event" });
            return;
        }
        res.status(201).json(newEvent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// GET /groups/:groupId/categories - Get all of a group's categories
router.get('/:groupId/categories', async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user!.userId;
        const groupId = req.params.groupId as string;
        const categoryList = await categoryDB.getCategories(groupId, userId);
        res.json(categoryList);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// POST /groups/:groupId/categories - Create a new category for a group
router.post('/:groupId/categories', async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user!.userId;
        const groupId = req.params.groupId as string;
        // not implemented yet
        res.status(501).json({ message: "Not implemented yet" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


export default router;
