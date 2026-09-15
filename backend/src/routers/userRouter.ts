import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import validator from 'validator';
import * as groupDB from '../db/groupRepository'
import type { User, PublicUser, SignupInput } from '../types/User';

const router = express.Router();


// Helper function to create a JWT authentication token for a user.
function createAuthToken(userId: string): string {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error('JWT secret is not defined');
    }
    return jwt.sign({ userId }, jwtSecret, { expiresIn: '1h' });
}


// Type used as the return type for the validateNewUser function below
type ValidationResult =
    | { data: SignupInput; error: null }
    | { data: null; error: string };


// Validate new user. Requirements:
// 1. The request body for /auth/signup must be an object with the fields
//    email, username, display_name, and password.
// 2. 'email' must be a properly formed email address.
// 3. 'username' must only contain alphanumeric characters and underscores, and
//    must be between 3 and 20 characters in length.
// 4. 'display_name' must be between 1 and 50 characters in length.
// 5. 'password' must be between 6 and 72 characters in length.
function validateNewUser(reqBody: unknown): ValidationResult {
    // Request body must be an object
    if (typeof reqBody !== 'object' || reqBody === null) {
        return { data: null, error: 'Invalid request body' };
    }
    const { email, username, display_name, password } = reqBody as Record<string, unknown>;
    if (typeof email !== 'string')        return { data: null, error: 'Email is required' };
    if (typeof username !== 'string')     return { data: null, error: 'Username is required' };
    if (typeof display_name !== 'string') return { data: null, error: 'Display name is required' };
    if (typeof password !== 'string')     return { data: null, error: 'Password is required' };
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim();
    const normalizedDisplayName = display_name.trim();
    // Validate Email
    if (!validator.isEmail(normalizedEmail)) {
        return { data: null, error: 'Invalid email address' };
    }
    // Validate Username
    const usernameRegex = /^[A-Za-z0-9_]{3,20}$/;
    if (!usernameRegex.test(normalizedUsername)) {
        return { data: null, error: 'Username must be 3-20 characters and ' + 
            'contain only letters, numbers, and underscores' };
    }
    // Validate display name
    if (normalizedDisplayName.length < 1 || normalizedDisplayName.length > 50) {
        return { data: null, error: 'Display name must be between 1 and 50 characters' };
    }
    // Validate password
    if (password.length < 6) {
        return { data: null, error: 'Password must be at least 6 characters' };
    }
    if (Buffer.byteLength(password, 'utf8') > 72) {
        return { data: null, error: 'Password must be between 6 and 72 bytes' };
    }
    return {
        data: {
            email: normalizedEmail,
            username: normalizedUsername,
            display_name: normalizedDisplayName,
            password,
        },
        error: null,
    };
}


// Helper function to convert a User to a PublicUser by removing password data
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
        res.json({ token, user: toPublicUser(user) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


// POST /auth/signup - Create a new user
router.post('/signup', async (req, res) => {
    try {
        // Validate the new user
        const validation = validateNewUser(req.body);
        if (validation.data === null) {
            res.status(400).json({ message: validation.error });
            return;
        }
        // Check if a user with the same email already exists
        if ((await groupDB.getUserByEmail(validation.data.email)) !== null) {
            res.status(409).json({ message: "Email already in use" });
            return;
        }
        // check if a user with the same username already exists
        if ((await groupDB.getUserByUsername(validation.data.username)) !== null) {
            res.status(409).json({ message: "Username already in use" });
            return;
        }
        // Encrypt the password to get a password_hash
        const password_hash = await bcrypt.hash(validation.data.password, 10);
        // Add the new user to the database
        const user = await groupDB.createUser({
            email: validation.data.email,
            username: validation.data.username,
            display_name: validation.data.display_name,
            password_hash,
        });
        if (!user) {
            res.status(500).json({ message: "Unable to create user in database" });
            return;
        }
        // Generate an authentication token for the user
        const token = createAuthToken(user.id);
        // Return the token and user data to the frontend
        res.status(201).json({ token, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

export default router;
