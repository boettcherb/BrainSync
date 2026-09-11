import express from 'express';

const router = express.Router();


// GET /groups - Get groups the current user belongs to
router.get("/", (req, res) => {
    res.send("Get groups the current user belongs to");
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
