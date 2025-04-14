const playlistService = require('../services/playlistService');

// Fetch all playlists from the database
const getAllPlaylists = async (req, res) => {
    const userId = req.user.id;
    try {
        const playlists = await playlistService.getAllPlaylistsFromDb(userId);
        res.json(playlists);
    } catch (error) {
        console.error('Error getting playlists:', error);
        res.status(500).send('Error getting playlists');
    }
};

// Save selected playlists from the Spotify user to the database
const savePlaylists = async (req, res) => {
    try {
        await playlistService.processAndSavePlaylists(req);
        res.status(201).send('Playlists and songs saved');
    } catch (error) {
        console.error('Error saving playlists:', error);
        res.status(500).send('Error saving playlists');
    }
};

// Fetch all playlists from Spotify
const getPlaylists = async (req, res) => {
    try {
        const response = await playlistService.getPlaylists(req);
        res.json(response);
    } catch (error) {
        console.error('Error fetching playlists:', error);
        res.status(500).json({ error: 'Error fetching playlists' });
    }
}

// Update a playlist to the database
const updatePlaylist = async (req, res) => {
    const { playlistId } = req.params;
    try {
        const { updated, message } = await playlistService.updatePlaylist(req, playlistId);
        res.status(200).json({ updated, message });
    } catch (error) {
        console.error('Error updating playlist:', error);
        res.status(500).json({ error: 'Error updating playlist' });
    }
};

// Delete a playlist from the database
const deletePlaylist = async (req, res) => {
    const playlistId = req.params.id;
    try {
        await playlistService.deletePlaylistFromDb(playlistId);
        res.status(200).send('Playlist deleted');
    } catch (error) {
        console.error('Error deleting playlist:', error);
        res.status(500).send('Error deleting playlist');
    }
};

// Get the playlist ranked by openskill rating (best to worst)
const getRankedPlaylist = async (req, res) => {
    const { playlist_id } = req.params;
    try {
        const rankedTracks = await playlistService.getRankedPlaylist(playlist_id);
        res.json(rankedTracks);
    } catch (error) {
        console.error('Error fetching ranked playlist:', error);
        res.status(500).json({ error: 'Error fetching ranked playlist' });
    }
};

// Get information about a single playlist
const getPlaylistInfo = async (req, res) => {
    console.log('Request came in for playlist: ', req.params.id);
    const { id: playlistId } = req.params;
    try {
        const response = await playlistService.getPlaylistInfo(req, playlistId);
        res.json({
            playlistInfo: response,
            totalTracks: response.tracks?.total,
        });
    } catch (error) {
        console.error('Error in controller:', error);
        res.status(500).json({ error: 'Error fetching playlist info' });
    }
};

// Export the functions
module.exports = {
    getAllPlaylists,
    getPlaylists,
    savePlaylists,
    deletePlaylist,
    getRankedPlaylist,
    getPlaylistInfo,
    updatePlaylist,
};