const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Generate JWT tokens
const generateAccessToken = (user) => {
    return jwt.sign(
        { username: user.username, id: user.id },
        process.env.ACCESS_TOKEN_SECRET, 
        { expiresIn: '15m' });
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { username: user.username, id: user.id }, 
        process.env.REFRESH_TOKEN_SECRET, 
        { expiresIn: '7d' });
};

// Find user by username
const getUserByUsername = async (username) => {
    const result = await db.query(`SELECT * FROM users WHERE username = $1`, [username]);
    return result.rows[0];
};

// Find user by ID
const getUserById = async (id) => {
    const result = await db.query(`SELECT * FROM users WHERE id = $1`, [id]);
    console.log('Searched for user ' + id + ' and found: ', result.rows[0]);
    return result.rows[0];
};

// Register user
const register = async (username, password) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const existingUser = await getUserByUsername(username);
    if (existingUser) {
        throw new Error('Username already exists');
    }
    const result = await db.query(
        `INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id`,
        [username, hashedPassword]
    );
    const userId = result.rows[0].id;
    const accessToken = generateAccessToken({ username, id: userId });
    const refreshToken = generateRefreshToken({ username, id: userId });
    await db.query(`UPDATE users SET user_refresh_token = $1 WHERE id = $2`, [refreshToken, userId]);
    return {
        accessToken,
        refreshToken,
        userId,
    };
}

// Login user
const login = async (username, password) => {
    const user = await getUserByUsername(username);

    if (!user) {
        throw new Error('Invalid username');
    } 
    if (!await bcrypt.compare(password, user.password)) {
        throw new Error('Invalid password');
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await db.query(`UPDATE users SET user_refresh_token = $1 WHERE id = $2`, [refreshToken, user.id]);

    return {
        accessToken,
        refreshToken,
        userId: user.id,
    };
};

// Refresh token function
const refreshUserToken = async (refreshToken) => {
    if (!refreshToken) {
        throw new Error('No refresh token provided');
    }

    return new Promise((resolve, reject) => {
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, user) => {
            if (err) return reject(err);

            const dbUser = await db.query(`SELECT username, id FROM users WHERE id = $1`, [user.id]);

            const newRefreshToken = generateRefreshToken(dbUser.rows[0]);

            await db.query(`UPDATE users SET user_refresh_token = $1 WHERE id = $2`, [newRefreshToken, dbUser.rows[0].id]);

            const newAccessToken = generateAccessToken(dbUser.rows[0]);

            resolve({
                accessToken: newAccessToken,
                refreshToken: newRefreshToken,
                username: dbUser.rows[0].username,
                userId: dbUser.rows[0].id,
            });
        });
    });
};

// Logout user
const logout = async (refreshToken) => {
    if (!refreshToken) {
        return;
    }

    try {
        // Delete refresh token from database
        await db.query(`UPDATE users SET user_refresh_token = NULL WHERE user_refresh_token = $1`, [refreshToken]);
    } catch (error) {
        console.error('Error logging out user:', error);
    }
}

module.exports = { register, login, logout, refreshUserToken, getUserById };