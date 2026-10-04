import express from 'express';
import { requireAuth, type AuthenticatedRequest } from '../middleware/authMiddleware';
import * as calendarDB from '../db/calendarDB';

const router = express.Router();
router.use(requireAuth); // Authenticate all endpoints in this file


// PUT /calendars/:calendarId - Update a calendar
router.put('/:calendarId', async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user!.userId;
        const calendarId = req.params.calendarId as string;
        const { name, description } = req.body;
        if (typeof name !== 'string' || name.trim().length === 0) {
            res.status(400).json({ message: 'Calendar name required'});
            return;
        }
        if (description !== undefined && description !== null &&
            typeof description !== 'string') {
            res.status(400).json({
                message: 'Calendar description must be a string'
            });
            return;
        }
        const desc = typeof description === 'string'
            ? description.trim() || null : null;
        const updatedCalendar = await calendarDB.updateCalendar(
            calendarId, { name: name.trim(), description: desc }, userId
        );
        if (updatedCalendar === null) {
            res.status(403).json({ message: 'Unable to update calendar'});
            return;
        }
        res.json(updatedCalendar);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// DELETE /calendars/:calendarId - Delete a calendar
router.delete('/:calendarId', async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user!.userId;
        const calendarId = req.params.calendarId as string;
        const deleted = await calendarDB.deleteCalendar(calendarId, userId);
        if (!deleted) {
            res.status(403).json({ message: "Unable to delete calendar" });
            return;
        }
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// GET /calendars/:calendarId/categories - Get all of a calendar's categories
router.get('/:calendarId/categories', async (req: AuthenticatedRequest, res) => {
    try {
        const userId = req.user!.userId;
        const calendarId = req.params.calendarId as string;
        const categoryList = await calendarDB.getCalendarCategories(
            calendarId, userId
        );
        res.json(categoryList);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// POST /calendars/:calendarId/categories - Create a category for a calendar
router.post('/:calendarId/categories', async (req: AuthenticatedRequest, res) => {
    
});


// GET /calendars/:calendarId/events - Get all of a calendar's events
router.get('/:calendarId/events', async (req: AuthenticatedRequest, res) => {

});


// POST /calendars/:calendarId/events - Create an event
router.post('/:calendarId/events', async (req: AuthenticatedRequest, res) => {

});


export default router;
