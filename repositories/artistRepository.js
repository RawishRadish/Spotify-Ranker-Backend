const db = require('../db');

// Function to check if artist IDs already exist in the database
const getExistingArtistIds = async (ids) => {
    try {
        const result = await db.query(
            'SELECT spotify_artist_id FROM artists WHERE spotify_artist_id = ANY($1)',
            [ids]
        );
        return result.rows.map(row => row.spotify_artist_id);
    } catch (error) {
        console.error('Error fetching existing artist IDs:', error);
        throw error;
    }
};

// Save or update artist information in the database
const saveArtists = async (artists) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const query = `
            INSERT INTO artists (spotify_artist_id, name, genre)
            VALUES ($1, $2, $3)
            ON CONFLICT (spotify_artist_id)
            DO UPDATE 
                SET name = EXCLUDED.name, 
                    genre = EXCLUDED.genre
        `;
        for (const artist of artists) {
            const { id, name } = artist;
            const genre = artist.genres.length > 0 ? artist.genres[0] : null;
            await client.query(query, [id, name, genre]);
        }
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saving artists:', error);
        throw error;
    } finally {
        client.release();
    }
};

// Get genres by artist IDs
const getGenresByArtistIds = async (ids) => {
    try{
        const result = await db.query(
            'SELECT spotify_artist_id, genre FROM artists WHERE spotify_artist_id = ANY($1)',
            [ids]
        );
        return result.rows;
    } catch (error) {
        console.error('Error fetching genres by artist IDs:', error);
        throw error;
    }
}

// Export the functions
module.exports = {
    getExistingArtistIds,
    saveArtists,
    getGenresByArtistIds
};