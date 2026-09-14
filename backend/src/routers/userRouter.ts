import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import validator from 'validator';
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

function validateEmail(email: string): boolean {
    try {
        if (!validator.isEmail(email)) {
            throw new Error("Invalid email address");
        }
    } catch (error) {
        return false;
    }
    return true;
}

// username rules: 3-20 characters
// only ascii characters
function validateUsername(username: string): boolean {
    return validator.isAscii(username)
        && username.length >= 3
        && username.length <= 20;
}

// password rules: 6-128 characters
// only ascii characters
function validatePassword(username: string): boolean {
    return validator.isAscii(username)
        && username.length >= 6
        && username.length <= 128;
}

// POST /auth/login - Log in a user and return an authentication token
router.post('/login', async (req, res) => {
    try {
        // Retrieve email and password from the request body
        const email: string = req.body.email.trim().toLowerCase();
        const password: string = req.body.password;
        // Find user by email (case-insensitive). If not found, return 401 error
        const user = await groupDB.getUserByEmail(email);
        if (!user) {
            res.status(401).json({ error: "There is no account with the given email address" });
            return;
        }
        // Check if the provided password matches the stored password
        const passIsValid = await bcrypt.compare(password, user.password_hash);
        if (!passIsValid) {
            res.status(401).json({ error: "Invalid email or password" });
            return;
        }
        // Generate an authentication token for the user
        const token = createAuthToken(user.id);
        // Return the token and user data to the frontend
        res.json({ token, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// POST /auth/signup - Create a new user
router.post('/signup', async (req, res) => {
    try {
        // Retrieve email, username, and password from the request body
        const email: string = req.body.email.trim().toLowerCase();
        const username: string = req.body.username;
        const password: string = req.body.password;
        // Validate email, username, and password
        if (!validateEmail(email)) {
            res.status(401).json({ error: "Invalid Email address" });
            return;
        }
        if (!validateUsername(username)) {
            res.status(401).json({ error: "Invalid Username" });
            return;
        }
        if (!validatePassword(password)) {
            res.status(401).json({ error: "Invalid Password" });
            return;
        }
        // Check if a user with the same email already exists
        const userWithSameEmail = await groupDB.getUserByEmail(email);
        if (userWithSameEmail !== null) {
            res.status(401).json({ error: "Email already in use" });
            return;
        }
        // check if a user with the same username already exists
        const userWithSameUsername = await groupDB.getUserByUsername(username);
        if (userWithSameUsername !== null) {
            res.status(401).json({ error: "Username already in use" });
            return;
        }
        // Encrypt the password to get a password_hash
        const password_hash = await bcrypt.hash(password, 10);
        // Add the new user to the database
        const user = await groupDB.createUser({ email, username, password_hash });
        if (!user) {
            res.status(401).json({ error: "Unable to create user in database" });
            return;
        }
        // Generate an authentication token for the user
        const token = createAuthToken(user.id);
        // Return the token and user data to the frontend
        res.json({ token, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export default router;
