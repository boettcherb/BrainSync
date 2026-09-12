import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import * as groupDB from '../db/groupRepository'

const router = express.Router();

// Helper function to create a JWT authentication token for a user.
function createAuthToken(userId: string): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('JWT secret is not defined');
    }
    return jwt.sign({ userId }, jwtSecret, { expiresIn: '1h' });
}


// POST /auth/login - Log in a user and return an authentication token
router.post('/login', async (req, res) => {
    try {
        // Retrieve email and password from the request body
        const { email, password } = req.body;
        // Validate that email and password are provided and are strings
        if (typeof email !== "string" || typeof password !== "string") {
            res.status(400).json({ error: "Email and password are required" });
            return;
        }
        // Find user by email (case-insensitive). If not found, return 401 error
        const normalizedEmail = email.trim().toLowerCase();
        const user = await groupDB.getUserByEmail(normalizedEmail);
        if (!user) {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }
        // Check if the provided password matches the stored password
        const passIsValid = await bcrypt.compare(password, user.password_hash);
        if (!passIsValid) {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }
        // Generate an authentication token for the user. Return the
        // token and user data to the frontend.
        const token = createAuthToken(user.id);
        res.json({ token, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
