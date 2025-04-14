const userService = require('../services/userService');

// Save the last playlist for a user
const setLastPlaylist = async (req, res) => {
    const userId = req.session.userId;
    const { playlistId } = req.body;

    try {
        await userService.setLastPlaylist(userId, playlistId);
        res.status(200).send('Last playlist saved');
    } catch (error) {
        console.error('Error saving last playlist:', error);
        res.status(500).send('Error saving last playlist');
    }
};

// Get the last playlist for a user
const getLastPlaylist = async (req, res) => {
    const userId = req.session.userId;
    try {
        const lastPlaylist = await userService.getLastPlaylist(userId);
        res.status(200).json({ playlistId: lastPlaylist });
    } catch (error) {
        console.error('Error fetching last playlist:', error);
        res.status(500).send('Error fetching last playlist');
    }
};

// Export the functions
module.exports = {
    setLastPlaylist,
    getLastPlaylist,
};