const db = require('../db');
const spotifyRequest = require('../middlewares/spotifyRequest');
const playlistRepo = require('../repositories/playlistRepository');
const artistService = require('./artistService');
const songsRepo = require('../repositories/songsRepository');
const spotifyClient = require('../integrations/spotifyClient');

const processAndSavePlaylists = async (req) => {
    const { playlistIds } = req.body; // Get the playlist IDs from the request body

    for (const playlistId of playlistIds) {
        await refreshPlaylist(req, playlistId);
    }
};

const updatePlaylist = async (req, playlistId) => {
    const dbSnapshot = await playlistRepo.getSnapshotId(playlistId);
    const spotifyData = await spotifyClient.getPlaylistMetadata(req, playlistId);
    const spotifySnapshot = spotifyData.snapshot_id;

    if (dbSnapshot === spotifySnapshot) {
        return { updated: false, message: 'Playlist is niet gewijzigd sinds laatste import' };
    }

    await refreshPlaylist(req, playlistId);
    return { updated: true, message: 'Playlist is succesvol bijgewerkt' };
};



// Check if Spotify playlist has changed
const checkIfPlaylistChanged = async (req, playlistId) => {
    try {
        const dbQuery = await db.query('SELECT snapshot_id FROM playlists WHERE id = $1', [playlistId]);
        const dbSnapshotId = dbQuery.rows[0]?.snapshot_id;
        const spotifyResponse = await spotifyRequest(req, `playlists/${playlistId}`);
        const spotifySnapshotId = spotifyResponse.snapshot_id;
        console.log('DB snapshot ID:', dbSnapshotId);
        console.log('Spotify snapshot ID:', spotifySnapshotId);
        if (dbSnapshotId === spotifySnapshotId) {
            return false; // No changes
        }
        return spotifySnapshotId; // Playlist has changed
    } catch (error) {
        console.error('Error checking if playlist changed:', error);
        throw new Error('Error checking if playlist changed');
    }
};

// Fetch all playlists from the database
const getAllPlaylistsFromDb = async (userId) => {
    const client = await db.connect();
    try {
        const result = await client.query('SELECT * FROM playlists WHERE user_id = $1', [userId]);
        return result.rows;
    } catch (error) {
        console.error('Error getting playlists:', error);
        throw new Error('Error getting playlists');
    } finally {
        client.release();
    }
};

// Fetch all playlists from Spotify
const getPlaylists = async (req) => {
    try {
        const response = await spotifyRequest(req, 'me/playlists');
        return response.items;
    } catch (error) {
        console.error('Error fetching playlists:', error);
        throw new Error('Error fetching playlists');
    }
};

// Save a single playlist to the database
const savePlaylistToDb = async (playlist, userId) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        // Basic insert query for the playlists
        const playlistInsert = `
            INSERT INTO playlists (id, playlist_name, playlist_length, snapshot_id, user_id)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO UPDATE
            SET playlist_name = EXCLUDED.playlist_name,
                playlist_length = EXCLUDED.playlist_length,
                user_id = EXCLUDED.user_id
        `;

        const { id, name, tracks, snapshot_id } = playlist;
        const playlistLength = tracks.total;

        await client.query(playlistInsert, [id, name, playlistLength, snapshot_id, userId]);
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saving playlists:', error);
        throw new Error('Error saving playlists');
    } finally {
        client.release();
    }
};

// Save or update playlist and its tracks in the database
const refreshPlaylist = async (req, playlistId) => {
    const { playlistData, allTracks } = await spotifyClient.getAllTracksFromPlaylist(req, playlistId);
    await playlistRepo.savePlaylist(playlistData, req.user.id);
    await artistService.saveMissingArtists(req, allTracks);
    const allTracksWithGenre = await artistService.enrichSongsWithGenresFromDb(allTracks);
    
    const existingTracks = await songsRepo.getTracksByPlaylistId(playlistId);
    const updatedTrackIds = new Set(allTracks.map(track => track.track.id));
    const tracksToRemove = existingTracks.filter(track => !updatedTrackIds.has(track.spotify_song_id));
    if (tracksToRemove.length > 0) {
        const trackIdsToRemove = tracksToRemove.map(track => track.id);
        await songsRepo.deleteTracksByIds(trackIdsToRemove);
    }
    await songsRepo.saveOrUpdateTracks(allTracksWithGenre, playlistId);
};

// Delete playlist from the database
const deletePlaylistFromDb = async (playlistId) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        // Delete songs from the playlist
        const deleteSongs = `
            DELETE FROM songs WHERE playlist_id = $1
        `;
        await client.query(deleteSongs, [playlistId]);
        // Delete playlist from the database
        const deletePlaylist = `
            DELETE FROM playlists WHERE id = $1
        `;
        await client.query(deletePlaylist, [playlistId]);
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting playlist:', error);
        throw new Error('Error deleting playlist');
    }
    finally {
        client.release();
    }
};

// Fetch the playlist from the database in descending order of openskill rating (Best songs first)
const getRankedPlaylist = async (playlistId) => {
    const client = await db.connect();
    try {
        const result = await client.query(`
            SELECT id, title, artist, mu, sigma, album_image_url
            FROM songs
            WHERE playlist_id = $1
            ORDER BY mu DESC;
            `, [playlistId]);
        return result.rows;
    } catch (error) {
        console.error('Error fetching ranked playlist:', error);
        throw new Error('Error fetching ranked playlist');
    }
}

// Get information about a single playlist
const getPlaylistInfo = async (req, playlistId) => {
    try {
        console.log('Fetching playlist info for:', playlistId);
        const response = await spotifyRequest(req, `playlists/${playlistId}`);
        return response;
    } catch (error) {
        console.error('Error fetching playlist info:', error);
    }
};



// Export the functions
module.exports = {
    checkIfPlaylistChanged,
    getAllPlaylistsFromDb,
    getPlaylists,
    savePlaylistToDb,
    deletePlaylistFromDb,
    getRankedPlaylist,
    getPlaylistInfo,
    processAndSavePlaylists,
    updatePlaylist,
};