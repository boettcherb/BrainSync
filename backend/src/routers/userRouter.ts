import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import validator from 'validator';
import * as groupDB from '../db/groupRepository'
import type { User, PublicUser } from '../types/User';

const router = express.Router();

// Helper function to create a JWT authentication token for a user.
function createAuthToken(userId: string): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('JWT secret is not defined');
    }
    return jwt.sign({ userId }, jwtSecret, { expiresIn: '1h' });
}

// Validate new user. Requirements:
// 1. The request body for /auth/signup should have three string fields:
//    email, username, and password.
// 2. 'email' must be a properly formed email address.
// 3. 'username' must only contain alphanumeric characters and underscores, and
//    must be between 3 and 20 characters in length.
// 4. 'password' must be between 6 and 72 characters in length.
function validateNewUser(reqBody: any): string | null {
    if (typeof reqBody.email !== 'string') return "Email is required";
    if (typeof reqBody.username !== 'string') return "Username is required";
    if (typeof reqBody.password !== 'string') return "Password is required";
    if (!validator.isEmail(reqBody.email)) return "Invalid Email address";
    const usernameRegex = /^[A-Za-z0-9_]{3,20}$/;
    if (!usernameRegex.test(reqBody.username)) return "Invalid Username";
    if (reqBody.password.length < 6) {
        return "Password must be at least 6 characters";
    }
    if (Buffer.byteLength(reqBody.password) > 72) {
        return "Password must be between 6 and 72 characters";
    }
    return null;
}

// Convert User type to PublicUser type by removing password data (password_hash)
function toPublicUser(user: User): PublicUser {
    const { password_hash: _, ...publicUser } = user;
    return publicUser;
}

// POST /auth/login - Log in a user and return an authentication token
router.post('/login', async (req, res) => {
    try {
        // Retrieve email and password from the request body
        const { email, password } = req.body;
        // Validate email and password have been provided and are strings:
        if (typeof email !== 'string' || typeof password !== 'string') {
            res.status(400).json({ message: "Email and password are required"});
            return;
        }
        // Find user by email (case-insensitive). If not found, return 401 error
        const normalizedEmail = email.trim().toLowerCase();
        const user = await groupDB.getUserByEmail(normalizedEmail);
        if (!user) {
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }
        // Check if the provided password matches the stored password
        const passIsValid = await bcrypt.compare(password, user.password_hash);
        if (!passIsValid) {
            res.status(401).json({ message: "Invalid email or password" });
            return;
        }
        // Generate an authentication token for the user
        const token = createAuthToken(user.id);
        // Return the token and user data to the frontend
        const publicUser: PublicUser = toPublicUser(user);
        res.json({ token, user: publicUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

// POST /auth/signup - Create a new user
router.post('/signup', async (req, res) => {
    try {
        // Validate the email, username, and password provided by the user
        const err_message = validateNewUser(req.body);
        if (err_message !== null) {
            res.status(400).json({ message: err_message });
            return;
        }
        const email: string = req.body.email.trim().toLowerCase();
        const username: string = req.body.username;
        const password: string = req.body.password;
        // Check if a user with the same email already exists
        const userWithSameEmail = await groupDB.getUserByEmail(email);
        if (userWithSameEmail !== null) {
            res.status(409).json({ message: "Email already in use" });
            return;
        }
        // check if a user with the same username already exists
        const userWithSameUsername = await groupDB.getUserByUsername(username);
        if (userWithSameUsername !== null) {
            res.status(409).json({ message: "Username already in use" });
            return;
        }
        // Encrypt the password to get a password_hash
        const password_hash = await bcrypt.hash(password, 10);
        // Add the new user to the database
        const user = await groupDB.createUser(username, email, password_hash);
        if (!user) {
            res.status(400).json({ message: "Unable to create user in database" });
            return;
        }
        // Generate an authentication token for the user
        const token = createAuthToken(user.id);
        // Return the token and user data to the frontend
        res.json({ token, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
