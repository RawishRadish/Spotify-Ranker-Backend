const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.get('/genre_count/:playlistId', authenticateToken, statisticsController.getGenreCount);
router.get('/artist_count/:playlistId', authenticateToken, statisticsController.getArtistCount);
router.get('/total_comparisons/:playlistId', authenticateToken, statisticsController.getTotalComparisons);
router.get('/sigma_per_song/:playlistId', authenticateToken, statisticsController.getSigmaPerSong);

module.exports = router;