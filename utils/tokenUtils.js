// Desc: Helper function to check if the Spotify access token has expired

const { getUserById } = require('../services/authService');
const axios = require('axios');
const db = require('../db');

const checkSpotifyToken = async (req) => {
    console.log('Helper function checkSpotifyToken called');
    if (!req.session.spotifyAccessTokenExpiresAt || Date.now() >= req.session.spotifyAccessTokenExpiresAt) {
        // Access token has expired
        console.log('Access token has expired');
        const user = await getUserById(req.session.userId);
        const spotifyRefreshToken = user.spotify_refresh_token;

        const response = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: spotifyRefreshToken
        }).toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + (new Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'))
            }
        });

        const { access_token, expires_in, refresh_token } = response.data;
        req.session.spotifyAccessToken = access_token;
        req.session.spotifyAccessTokenExpiresAt = Date.now() + expires_in * 1000;

        await db.query(
            `UPDATE users
            SET spotify_access_token = $1,
                spotify_refresh_token = COALESCE($2, spotify_refresh_token)
            WHERE id = $3`, [access_token, refresh_token, req.session.userId]
        );
    }
};

module.exports = { checkSpotifyToken };