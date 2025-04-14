const db = require('../db');

// Get snapshot ID from the database
const getSnapshotId = async (playlistId) => {
    try {
        const result = await db.query('SELECT snapshot_id FROM playlists WHERE id = $1', [playlistId]);
        return result.rows[0]?.snapshot_id;
    } catch (error) {
        console.error('Error fetching snapshot ID:', error);
        throw new Error('Error fetching snapshot ID');
    }
};

// Save or update a playlist to the database
const savePlaylist = async (playlist, userId) => {
    try {
        const { id, name, tracks, snapshot_id } = playlist;
        const playlistLength = tracks.total;

        await db.query( `
            INSERT INTO playlists (id, playlist_name, playlist_length, snapshot_id, user_id)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id) DO UPDATE
            SET playlist_name = EXCLUDED.playlist_name,
                playlist_length = EXCLUDED.playlist_length,
                snapshot_id = EXCLUDED.snapshot_id,
                user_id = EXCLUDED.user_id
        `, [id, name, playlistLength, snapshot_id, userId]);
    } catch (error) {
        console.error('Error saving playlists:', error);
        throw new Error('Error saving playlists');
    }
};



// Export the functions
module.exports = {
    getSnapshotId,
    savePlaylist,
};