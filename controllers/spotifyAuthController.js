const spotifyAuthService = require('../services/spotifyAuthService');
const spotifyService = require('../services/spotifyService');
const db = require('../db');

const getSpotifyAuthURL = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }
    console.log('User authenticated:', req.user);

    req.session.userId = req.user.id;

    try {
        const authURL = spotifyAuthService.generateSpotifyAuthUrl();
        res.json({ authURL });
    } catch (error) {
        res.status(500).json({ message: 'Error getting Spotify auth URL' });
        console.log('Error getting Spotify auth URL:', error);
    }
};

const handleSpotifyCallback = async (req, res) => {
    try {
        const { code } = req.query;
        const userId = req.session.userId;
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated, please reconnect' });
        }
        const tokens = await spotifyAuthService.exchangeCodeForTokens(code);

        if (!tokens.access_token || !tokens.refresh_token) {
            return res.status(400).json({ error: 'No tokens received from Spotify' });
        }

        console.log('Tokens:', tokens);
        
        // Save access token in session
        req.session.spotifyAccessToken = tokens.access_token;
        req.session.spotifyAccessTokenExpiresAt = Date.now() + tokens.expires_in * 1000;


        // Get Spotify user ID
        const spotifyUserId = await spotifyService.getSpotifyUserId(req);
        console.log('Spotify user ID luidt:', spotifyUserId);

        // Save tokens and Spotify ID in database
        await db.query(
            `UPDATE users
            SET spotify_access_token = $1,
                spotify_refresh_token = $2,
                spotify_id = $3
            WHERE id = $4`, [tokens.access_token, tokens.refresh_token, spotifyUserId, userId]
        );

        res.redirect(process.env.FRONTEND_URL);
    } catch (error) {
        console.error('Callback error:', error);
        const errorMessage = error.response ? error.response.data.error : 'Error handling Spotify callback';
        res.redirect(`${process.env.FRONTEND_URL}/?error_message=${errorMessage}`);
    }
};

// Check if user is authenticated
const checkSpotifyToken = async (req, res) => {
    try {
        const response = await spotifyService.getSpotifyUserId(req);
        res.json(response);
    } catch (error) {
        console.error('Error checking Spotify token:', error);
        res.status(500).send('Error checking Spotify token');
    }
};

// Refresh Spotify access token
const refreshSpotifyToken = async (req, res) => {
    console.log('Refreshing Spotify access token');
    console.log('User:', req.headers['x-user-id']);
    const userId = req.headers['x-user-id'];
    const refreshToken = await spotifyAuthService.getSpotifyRefreshToken(userId);
    if (!refreshToken) {
        return res.status(400).json({ message: 'No Spotify refresh token found' });
    }
    console.log('Old refresh token:', refreshToken);

    const newAccessToken = await spotifyAuthService.refreshSpotifyToken(refreshToken);
    if (!newAccessToken) {
        return res.status(500).json({ message: 'Error refreshing Spotify token' });
    }
    res.json({ accessToken: newAccessToken });
}

// Get token from database
const getSpotifyTokenFromDb = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: 'User not authenticated' });
    }
    console.log('User authenticated:', req.user);

    const accessToken = await spotifyAuthService.getSpotifyAccessToken(req.user.id);
    res.json({ access_token: accessToken });
}

module.exports = { 
    getSpotifyAuthURL,
    handleSpotifyCallback,
    checkSpotifyToken,
    refreshSpotifyToken,
    getSpotifyTokenFromDb
};