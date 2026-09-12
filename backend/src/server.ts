import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { generalApiLimiter, authLimiter } from './middleware/rateLimitMiddleware';
import groupRouter from './routers/groupRouter';
import calendarRouter from './routers/calendarRouter';
import userRouter from './routers/userRouter';

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
    res.send("Smart Task Manager API");
});

app.get("/health", (req, res) => {
    res.json({
        status: "ok",
        message: "Backend is running",
    });
});


// Auth Routes:
// POST /auth/login - Log in a user and return an authentication token
app.use('/auth', authLimiter, userRouter);


// Group Routes:
// GET /groups                    - Get groups the current user belongs to
// GET /groups/:groupId/members   - Get members of a specific group
// GET /groups/:groupId/calendars - Get calendars for a specific group
app.use('/groups', groupRouter);


// Calendar Routes:
// GET /calendars/:calendarId            - Get details of a specific calendar
// GET /calendars/:calendarId/events     - Get events for a specific calendar
// GET /calendars/:calendarId/categories - Get categories for a specific calendar
app.use('/calendars', calendarRouter);


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
