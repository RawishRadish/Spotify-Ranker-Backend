const express = require('express');
const { getSpotifyAuthURL, handleSpotifyCallback, checkSpotifyToken, refreshSpotifyToken, getSpotifyTokenFromDb } = require('../controllers/spotifyAuthController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/connect', authenticateToken, getSpotifyAuthURL);
router.get('/callback', handleSpotifyCallback);
router.get('/status', authenticateToken, checkSpotifyToken);
router.get('/refresh', refreshSpotifyToken);
router.get('/token', authenticateToken, getSpotifyTokenFromDb);

module.exports = router;