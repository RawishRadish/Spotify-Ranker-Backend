const compareService = require('../services/compareService');
const previewService = require('../services/previewService');

// Fetch pairs of songs to compare
const getSongPairs = async (req, res) => {
    const { playlist_id } = req.params;

    try {
        const songPairs = await compareService.fetchSongPairs(playlist_id);
        res.json(songPairs);
    } catch (error) {
        console.error('Error fetching song pairs:', error);
        res.status(500).json({ error: 'Error fetching song pairs' });
    }
};

// Compare two songs and update their ratings
const compareSongs = async (req, res) => {
    const { playlist_id } = req.params;
    const { winner_id, loser_id } = req.body;

    try {
        await compareService.compareSongs(playlist_id, winner_id, loser_id);
        res.json({ message: 'Songs compared successfully' });
    } catch (error) {
        console.error('Error comparing songs:', error);
        res.status(500).json({ error: 'Error comparing songs' });
    }
};

// Undo a comparison between two songs
const undoComparison = async (req, res) => {
    const { playlist_id } = req.params;
    const { winner_id, loser_id } = req.body;

    try {
        await compareService.undoComparison(playlist_id, winner_id, loser_id);
        res.json({ message: 'Comparison undone successfully' });
    } catch (error) {
        console.error('Error undoing comparison:', error);
        res.status(500).json({ error: 'Error undoing comparison' });
    }
};

// // Find preview of songs
// const getPreviewUrl = async (req, res) => {
//     const { songs } = req.body;
//     if (!Array.isArray(songs) || songs.length === 0) {
//         return res.status(400).json({ error: 'No songs provided' });
//     }

//     console.log('Songs in Controller:', songs);
    
//     const previews = await previewService.getPreviewUrl(songs);
//     console.log('Previews in Controller:', previews);
//     res.json(previews);
// };

module.exports = {
    getSongPairs,
    compareSongs,
    undoComparison,
};