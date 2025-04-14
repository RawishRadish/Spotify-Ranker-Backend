const db = require('../db');

const setLastPlaylist = async (userId, playlistId) => {
    await db.query(
        'UPDATE users SET last_playlist = $1 WHERE id = $2',
        [playlistId, userId]
    );
};

const getLastPlaylist = async (userId, playlistId) => {
    const result = await db.query(
        'SELECT last_playlist FROM users WHERE id = $1',
        [userId]
    );
    return result.rows[0]?.last_playlist || null;
};

// Export the functions
module.exports = {
    setLastPlaylist,
    getLastPlaylist,
};