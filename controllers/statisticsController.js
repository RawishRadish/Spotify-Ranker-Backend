const statisticsService = require('../services/statisticsService');

// Get genre breakdown for a playlist
// This function retrieves the genre breakdown for a specific playlist
const getGenreCount = async (req, res) => {
    const playlistId = req.params.playlistId;
    try {
        const genreCount = await statisticsService.getGenreCount(playlistId);
        res.json(genreCount);
    } catch (error) {
        console.error('Error getting genre breakdown:', error);
        res.status(500).send('Error getting genre breakdown');
    }
};

// Get artist breakdown for a playlist
// This function retrieves the artist breakdown for a specific playlist
const getArtistCount = async (req, res) => {
    const playlistId = req.params.playlistId;
    try {
        const artistCount = await statisticsService.getArtistCount(playlistId);
        res.json(artistCount);
    } catch (error) {
        console.error('Error getting artist breakdown:', error);
        res.status(500).send('Error getting artist breakdown');
    }
};

// Get total choices for a playlist
// This function retrieves the total choices for a specific playlist
const getTotalComparisons = async (req, res) => {
    const playlistId = req.params.playlistId;
    try {
        const totalChoices = await statisticsService.getTotalComparisons(playlistId);
        res.json({total: totalChoices});
    } catch (error) {
        console.error('Error getting total choices:', error);
        res.status(500).send('Error getting total choices');
    }
};

// Get sigma per song for a playlist
// This function retrieves the sigma per song for a specific playlist
const getSigmaPerSong = async (req, res) => {
    const playlistId = req.params.playlistId;
    try {
        const sigmaPerSong = await statisticsService.getSigmaPerSong(playlistId);
        res.json(sigmaPerSong);
    } catch (error) {
        console.error('Error getting sigma per song:', error);
        res.status(500).send('Error getting sigma per song');
    }
};

// Export the functions
module.exports = {
    getGenreCount,
    getArtistCount,
    getTotalComparisons,
    getSigmaPerSong,
    // getRankingStability,
};