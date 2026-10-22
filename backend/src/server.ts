import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { generalApiLimiter, authLimiter } from './middleware/rateLimitMiddleware.js';
import userRouter from './routers/userRouter.js';
import groupRouter from './routers/groupRouter.js';
import eventRouter from './routers/eventRouter.js';

const port = process.env.PORT || 3000;
const app = express();

// Render runs the app behind a proxy. Trust one proxy hop so rate limiting uses the real client IP.
app.set("trust proxy", 1);

app.use(cors({ origin: process.env.FRONTEND_URL })); // Enable CORS for the frontend URL only
app.use(express.json());    // Parse JSON request bodies
app.use(generalApiLimiter); // Apply general API rate limiting to all routes

// Routes:
// GET /       - Home route
// GET /health - Health check endpoint

app.get("/", (req, res) => {
    return res.send("Smart Task Manager API");
});

app.get("/health", (req, res) => {
    return res.json({
        status: "ok",
        message: "Backend is running",
    });
});


// Auth Routes:
// POST /auth/login  - Log in a user and return an authentication token
// POST /auth/signup - Create a new user
app.use('/auth', authLimiter, userRouter);


// Group Routes:
// GET    /groups                            - Get groups the caller belongs to
// POST   /groups                            - Create a new group
// PUT    /groups/:groupId                   - Update a specific group
// DELETE /groups/:groupId                   - Delete a specific group
// GET    /groups/:groupId/members           - Get members of a specific group
// POST   /groups/:groupId/members           - Add a member to a group
// DELETE /groups/:groupId/members/me        - Leave a specific group
// DELETE /groups/:groupId/members/:memberId - Remove a specific member from a group
// PATCH  /groups/:groupId/members/:memberId - Update permissions for a group member
// GET    /groups/:groupId/events            - Get all of a group's events
// POST   /groups/:groupId/events            - Create a new event for a group
// GET    /groups/:groupId/categories        - Get all of a group's categories
// POST   /groups/:groupId/categories        - Create a new category for a group
app.use('/groups', groupRouter);


// Category Routes:
// PUT    /categories/:categoryId       - Update a category
// DELETE /categories/:categoryId       - Delete a category


// Event Routes:
// PUT    /events/:eventId       - Update an event
// DELETE /events/:eventId       - Delete an event
app.use('/events', eventRouter);


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
