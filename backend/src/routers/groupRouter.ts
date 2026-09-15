import express from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/authMiddleware';
import * as groupDB from '../db/groupRepository';
import type { UserGroup } from '../types/Group';

const router = express.Router();
router.use(requireAuth); // Authenticate all endpoints in this file

// GET /groups - Get groups the current user is a member of
router.get("/", async (req: AuthenticatedRequest, res) => {
    try {
        const userId: string = req.user!.userId;
        const userGroups = await groupDB.getGroupsByUserId(userId);
        res.json(userGroups);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// GET /groups/:groupId/members - Get members of a specific group
router.get("/:groupId/members", (req, res) => {
    res.send(`Get members of group with ID ${req.params.groupId}`);
});


// GET /groups/:groupId/calendars - Get calendars for a specific group
router.get('/:groupId/calendars', (req, res) => {
    res.send(`Get calendars for group with ID ${req.params.groupId}`);
});


export default router;
