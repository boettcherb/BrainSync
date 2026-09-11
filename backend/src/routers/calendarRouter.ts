import express from 'express';

const router = express.Router();


// GET /calendars/:calendarId - Get details of a specific calendar
router.get('/:calendarId', async (req, res) => {
    res.send('Get details of calendar with ID ' + req.params.calendarId);
});


// GET /calendars/:calendarId/events - Get events for a specific calendar
router.get('/:calendarId/events', async (req, res) => {
    res.send('Get events for calendar with ID ' + req.params.calendarId);
});


// GET /calendars/:calendarId/categories - Get categories for a specific calendar
router.get('/:calendarId/categories', async (req, res) => {
    res.send('Get categories for calendar with ID ' + req.params.calendarId);
});


export default router;
