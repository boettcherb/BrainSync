import express from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/authMiddleware.js';
import * as eventDB from '../db/eventDB.js';

const router = express.Router();
router.use(requireAuth);

// PUT /events/:eventId - Update an event
router.put('/:eventId', async (req: AuthenticatedRequest, res) => {
    try {
        const userId: string = req.user!.userId;
        const eventId = req.params.eventId as string;
        const eventData = req.body;
        const updatedEvent = await eventDB.updateEvent(eventId, eventData, userId);
        if (!updatedEvent) {
            return res.status(404).json({ message: 'Unable to update event' });
        }
        res.json(updatedEvent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: (error as Error).message });
    }
});

// DELETE /events/:eventId - Delete an event
router.delete('/:eventId', async (req: AuthenticatedRequest, res) => {
    try {
        const userId: string = req.user!.userId;
        const eventId = req.params.eventId as string;
        const deletedEvent = await eventDB.deleteEvent(eventId, userId);
        if (!deletedEvent) {
            return res.status(404).json({ message: 'Unable to delete event' });
        }
        res.json(deletedEvent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: (error as Error).message });
    }
});

export default router;