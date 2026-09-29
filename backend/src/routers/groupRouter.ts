import express from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/authMiddleware';
import * as groupDB from '../db/groupRepository';

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
        // Retrieve the userId from the authenticated request
        // and the new group's data from the request body
        const userId: string = req.user!.userId;
        const { name, description } = req.body;
        // Ensure the group data is valid
        if ((description !== null && typeof description !== 'string')
            || typeof name !== 'string' || name.trim().length === 0) {
            res.status(400).json({ message: "Invalid group data" });
            return;
        }
        // Add the new group to the database and return the group
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
        // Retrieve the userId from the authenticated request, the groupId from
        // the request parameters, and the new group's data from the request body.
        const userId = req.user!.userId;
        const groupId = req.params.groupId as string;
        const { name, description } = req.body;
        // Ensure the group data is valid
        if ((description !== null && typeof description !== 'string')
            || typeof name !== 'string' || name.trim().length === 0) {
            res.status(400).json({ message: "Invalid group data" });
            return;
        }
        // Update the group with the new data. updateGroup ensures the user
        // updating the group has permission to (either its owner or an admin)
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
        // Return the updated group
        res.json(group);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// DELETE /groups/:groupId - Delete a specific group
router.delete('/:groupId', async (req: AuthenticatedRequest, res) => {
    try {
        // Retrieve the userId from the authenticated request
        // and the groupId from the request parameters.
        const userId = req.user!.userId;
        const groupId = req.params.groupId as string;
        // Delete the group from the database
        // deleteGroup checks that the user deleting the group is its owner
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
        // Retrieve the userId from the authenticated request
        // and the groupId from the request parameters.
        const userId = req.user!.userId;
        const groupId = req.params.groupId as string;
        // Ensure the user is a member of the group
        const role = await groupDB.getUserRoleInGroup(userId, groupId);
        if (!role) {
            res.status(403).json({
                message: "You do not have access to this group"
            });
            return;
        }
        // Retrieve and return a list of the group's members from the database
        const groupMembers = await groupDB.getGroupMembers(groupId);
        res.json(groupMembers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// DELETE /groups/:groupId/members/me - Leave a specific group
router.delete('/:groupId/members/me', async (req: AuthenticatedRequest, res) => {
    try {
        // Retrieve the userId from the authenticated request
        // and the groupId from the request parameters.
        const userId = req.user!.userId;
        const groupId = req.params.groupId as string;
        // Leave the group. The leaveGroup function ensures that the user
        // leaving is not the owner.
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
        // Retrieve the userId from the authenticated request
        // and the groupId and memberId from the request parameters.
        const userId = req.user!.userId;
        const groupId = req.params.groupId as string;
        const memberId = req.params.memberId as string;
        // Attempt to remove the member from the group. The function checks that
        // the user performing the removal has the necessary permissions.
        const removed = await groupDB.removeGroupMember(groupId, memberId, userId);
        if (!removed) {
            res.status(403).json({
                message: "You do not have permission to remove this member from the group"
            });
            return;
        }
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// GET /groups/:groupId/calendars - Get calendars for a specific group
router.get('/:groupId/calendars', async (req: AuthenticatedRequest, res) => {
    res.send(`Get calendars for group with ID ${req.params.groupId}`);
});


export default router;
