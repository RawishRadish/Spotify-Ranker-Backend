const db = require('../db');

// Fetch all tracks from a playlist
const getTracksByPlaylistId = async (playlistId) => {
    try {
        const result = await db.query('SELECT * FROM songs WHERE playlist_id = $1', [playlistId]);
        return result.rows;
    } catch (error) {
        console.error('Error fetching tracks by playlist ID:', error);
        throw error;
    }
};

// Delete a track from a playlist
const deleteTracksByIds = async (trackIds) => {
    try {
        const result = await db.query('DELETE FROM songs WHERE id = ANY($1)', [trackIds]);
        console.log(`Deleted ${result.rowCount} tracks`);
        return result.rowCount;
    } catch (error) {
        console.error('Error deleting tracks by IDs:', error);
        throw error;
    }
};

// Save or update a track in the database
const saveOrUpdateTracks = async (tracks, playlistId) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        // Basic query to insert or update tracks
        const query = `
            INSERT INTO songs (spotify_song_id, title, artist, playlist_id, genres, album_image_url, external_url)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (spotify_song_id, playlist_id)
            DO UPDATE 
                SET title = EXCLUDED.title, 
                artist = EXCLUDED.artist, 
                genres = EXCLUDED.genres,
                album_image_url = EXCLUDED.album_image_url,
                external_url = EXCLUDED.external_url
            `;

        // For each track, execute the query
        for (const track of tracks) {
            const { id, name, artists, genres } = track.track;
            const artist = artists.map(artist => artist.name).join(', ');
            const albumImageUrl = track.track.album.images[0]?.url || null;
            const externalUrl = track.track.external_urls?.spotify || null;
            const res = await client.query(query, [id, name, artist, playlistId, genres, albumImageUrl, externalUrl]);
            if (res.rowCount > 0) {
                console.log(`Track ${name} inserted/updated successfully`);
            }
        }
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saving or updating tracks:', error);
        throw error;
    } finally {
        client.release();
    }
};

// Get genre count for a playlist
const getGenreCount = async (playlistId) => {
    try {
        const result = await db.query(`
            SELECT unnest(genres) AS genre, COUNT(*) AS count
            FROM songs
            WHERE playlist_id = $1
            GROUP BY genre
            ORDER BY count DESC
            `, [playlistId]);
        return result.rows;
    } catch (error) {
        console.error('Error fetching genre count:', error);
        throw error;
    }
};

// Get artist count for a playlist
const getArtistCount = async (playlistId) => {
    try {
        const result = await db.query(`
            SELECT artist, COUNT(*) AS count
            FROM songs
            WHERE playlist_id = $1
            GROUP BY artist
            ORDER BY count DESC
            `, [playlistId]);
        return result.rows;
    } catch (error) {
        console.error('Error fetching artist count:', error);
        throw error;
    }
};

// Get total comparisons for a playlist
const getTotalComparisons = async (playlistId) => {
    try {
        const result = await db.query(`
            SELECT (SUM(match_count)/2) AS total_comparisons
            FROM songs
            WHERE playlist_id = $1
            `, [playlistId]);
        return result.rows[0].total_comparisons;
    } catch (error) {
        console.error('Error fetching total comparisons:', error);
        throw error;
    }
};

// Get sigma per song for a playlist
const getSigmaPerSong = async (playlistId) => {
    try {
        const result = await db.query(`
            SELECT title, sigma
            FROM songs
            WHERE playlist_id = $1
            ORDER BY sigma DESC
            `, [playlistId]);
        return result.rows;
    } catch (error) {
        console.error('Error fetching sigma per song:', error);
        throw error;
    }
};

// Get info about one specific song of a playlist, like the album image URL or the external URL
const getSongInfo = async (songId, playlistId) => {
    try {
        const result = await db.query(`
            SELECT *
            FROM songs
            WHERE playlist_id = $1
            AND id = $2`, [playlistId, songId]);
        return result.rows;
    } catch (error) {
        console.error('Error fetching song info from database: ', error);
        throw error;
    }
};

// Export the functions
module.exports = {
    getTracksByPlaylistId,
    deleteTracksByIds,
    saveOrUpdateTracks,
    getGenreCount,
    getArtistCount,
    getTotalComparisons,
    getSigmaPerSong,
    getSongInfo,
};