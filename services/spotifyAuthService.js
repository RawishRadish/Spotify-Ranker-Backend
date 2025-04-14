const db = require('../db');
const axios = require('axios');
const querystring = require('querystring');

// Generate Spotify auth URL
const generateSpotifyAuthUrl = () => {
    console.log('Creating Spotify auth URL');
    const queryParams = {
        client_id: process.env.SPOTIFY_CLIENT_ID,
        response_type: 'code',
        redirect_uri: process.env.REDIRECT_URI,
        scope: 'user-read-private playlist-read-private streaming user-read-email',
        show_dialog: true,
    };
    const authURL = `https://accounts.spotify.com/authorize?${querystring.stringify(queryParams)}`;
    return authURL;
};

// Exchange code for access and refresh tokens
const exchangeCodeForTokens = async (code) => {
    console.log('Exchanging code for tokens');
    const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', process.env.REDIRECT_URI);
        params.append('client_id', process.env.SPOTIFY_CLIENT_ID);
        params.append('client_secret', process.env.SPOTIFY_CLIENT_SECRET);
    
    const response = await axios.post('https://accounts.spotify.com/api/token', params, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
    return response.data;
};

// Get Spotify access token from database
const getSpotifyAccessToken = async (userId) => {
    console.log('Searching for Access Token in database');
    const response = await db.query(
        `SELECT spotify_access_token
        FROM users
        WHERE id = $1`, [userId]
    );
    return response.rows[0].spotify_access_token;
};

// Get Spotify refresh token from database
const getSpotifyRefreshToken = async (userId) => {
    console.log('Searching for Refresh Token in database');
    const response = await db.query(
        `SELECT spotify_refresh_token
        FROM users
        WHERE id = $1`, [userId]
    );
    if (response.rows.length === 0) {
        throw new Error('No refresh token found');
    }
    return response.rows[0].spotify_refresh_token;
};

// Update Spotify tokens in database
const updateSpotifyTokensInDb = async (newAccessToken, newRefreshToken, oldRefreshToken) => {
    console.log('Updating Spotify tokens');
    if (newRefreshToken) {
        await db.query(
            `UPDATE users
            SET spotify_access_token = $1,
                spotify_refresh_token = $2
            WHERE spotify_refresh_token = $3`, [newAccessToken, newRefreshToken, oldRefreshToken]
        );
    } else {
        await db.query(
            `UPDATE users
            SET spotify_access_token = $1
            WHERE spotify_refresh_token = $2`, [newAccessToken, oldRefreshToken]
        );
    }
}

// Refresh Spotify access token
const refreshSpotifyToken = async (refreshToken) => {
    try {
        const params = new URLSearchParams();
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', refreshToken);
        const response = await axios.post('https://accounts.spotify.com/api/token', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + (new Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'))
            }
        }); 
        const newAccessToken = response.data.access_token;
        const newRefreshToken = response.data.refresh_token;
        console.log('New refresh token:', newRefreshToken);
        req.session.accessToken = newAccessToken;
        await updateSpotifyTokensInDb(newAccessToken, newRefreshToken, refreshToken);
        return newAccessToken;
    } catch (error) {
        console.error('Error refreshing Spotify access token:', error);
        return;
    }
};

// Export functions
module.exports = {
    generateSpotifyAuthUrl,
    exchangeCodeForTokens,
    getSpotifyAccessToken,
    getSpotifyRefreshToken,
    updateSpotifyTokensInDb,
    refreshSpotifyToken,
};