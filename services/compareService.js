const db = require('../db');
const { updateRatings } = require('./openskillService');

// Fetch pairs of songs to compare
const fetchSongPairs = async (playlist_id) => {

    const songFields = ['id', 'title', 'artist', 'mu', 'album_image_url', 'external_url'];

    const generateSelectFields = (alias1, prefix1, alias2, prefix2) => {
        return songFields.map(field =>
            `${alias1}.${field} AS ${prefix1}_${field}, ${alias2}.${field} AS ${prefix2}_${field}`
        ).join(', ');
    };

    const selectClause = generateSelectFields('s1', 'song1', 's2', 'song2');

    // Fetch songs with low sigma value (unranked songs)
    const unrankedSongs = await db.query(`
        WITH filtered_songs AS (
            SELECT *
            FROM songs
            WHERE playlist_id = $1
            ORDER BY sigma DESC
            LIMIT 50
        )
        SELECT 	${selectClause}
        FROM filtered_songs s1
        JOIN LATERAL (
            SELECT * FROM songs s2
            WHERE s2.playlist_id = $1
            AND s1.id <> s2.id
            ORDER BY random()
        ) s2 ON true
        ORDER BY random()
        LIMIT 10;
        `, [playlist_id]);

    // Fetch songs with match count above threshold
    // Fetch songs with openskill rating difference within 10
    const within200 = await db.query(`
        WITH selected_songs AS (
            SELECT *
            FROM songs
            WHERE playlist_id = $1
            ORDER BY random()
            LIMIT 30
        )
        SELECT	${selectClause}
        FROM 	selected_songs s1
        JOIN LATERAL (
            SELECT * FROM songs s2
            WHERE s2.playlist_id = $1
            AND s2.mu BETWEEN s1.mu - 10 AND s1.mu + 10
            AND s1.id <> s2.id
            ORDER BY random()
        ) s2 ON true
        ORDER BY random()
        LIMIT 30;
    `, [playlist_id]);

    // Fetch songs with openskill rating difference beyond 10
    let beyond200 = await db.query(`
        WITH selected_songs AS (
            SELECT *
            FROM songs
            WHERE playlist_id = $1
            ORDER BY random()
            LIMIT 30
        )
        SELECT	${selectClause}
        FROM 	selected_songs s1
        JOIN LATERAL (
            SELECT * FROM songs s2
            WHERE s2.playlist_id = $1
            AND s2.mu NOT BETWEEN s1.mu - 10 AND s1.mu + 10
            AND s1.id <> s2.id
            ORDER BY random()
        ) s2 ON true
        ORDER BY random()
        LIMIT 10;
        `, [playlist_id]);

    if (beyond200.rowCount < 10) {
        const neededPairs = 10 - beyond200.rowCount;
        const additionalPairs = await db.query(`
            WITH selected_songs AS (
                SELECT *
                FROM songs
                WHERE playlist_id = $1
                ORDER BY random()
                LIMIT 30
            )
            SELECT	${selectClause}
            FROM 	selected_songs s1
            JOIN LATERAL (
                SELECT * FROM songs s2
                WHERE s2.playlist_id = $1
                AND s2.mu BETWEEN s1.mu - 10 AND s1.mu + 10
                AND s1.id <> s2.id
                ORDER BY random()
            ) s2 ON true
            ORDER BY random()
            LIMIT $2;
            `, [playlist_id, neededPairs]);

        beyond200.rows.push(...additionalPairs.rows);
    }

    let allPairs = within200.rows.concat(beyond200.rows, unrankedSongs.rows);
    allPairs = allPairs.sort(() => Math.random() - 0.5);

    allPairs = allPairs.map(pair => ({
        song1: {
            id: pair.song1_id,
            title: pair.song1_title,
            artist: pair.song1_artist,
            mu: pair.song1_mu,
            albumImageUrl: pair.song1_album_image_url,
            externalUrl: pair.song1_external_url
        },
        song2: {
            id: pair.song2_id,
            title: pair.song2_title,
            artist: pair.song2_artist,
            mu: pair.song2_mu,
            albumImageUrl: pair.song2_album_image_url,
            externalUrl: pair.song2_external_url
        }
    }))

    return allPairs;
};

// Compare two songs and update their ratings (NEW FUNCTION WITH OPENSKILL)
const compareSongs = async (playlist_id, winner_id, loser_id) => {
    // Fetch current Openskill ratings from database
    const result = await db.query(`
        SELECT id, mu, sigma
        FROM songs
        WHERE playlist_id = $1
        AND id IN ($2, $3);
        `, [playlist_id, winner_id, loser_id]);

    // Save old Openskill ratings in variables
    const winnerRow = result.rows.find(row => row.id === winner_id);
    const loserRow = result.rows.find(row => row.id === loser_id);

    const winner = { 
        mu: winnerRow.mu,
        sigma: winnerRow.sigma };
    const loser = { 
        mu: loserRow.mu,
        sigma: loserRow.sigma };

    console.log('Old ratings:', winner, loser);

    // Openskill rating calculation
    const [newWinner, newLoser] = updateRatings(winner, loser);

    // Update database with new ratings
    await db.query(`
        UPDATE songs
        SET
            mu = CASE
                WHEN id = $1 THEN $2::double precision
                WHEN id = $3 THEN $4::double precision
            END,
            sigma = CASE
                WHEN id = $1 THEN $5::double precision
                WHEN id = $3 THEN $6::double precision
            END,
            match_count = match_count + 1
        WHERE id IN ($1, $3);
    `, [winner_id, newWinner.mu, loser_id, newLoser.mu, newWinner.sigma, newLoser.sigma]
    );

    // Log comparison in database for undo functionality
    await db.query(`
        INSERT INTO compare_history (playlist_id, winner_id, loser_id, winner_mu_before, loser_mu_before, winner_mu_after, loser_mu_after, winner_sigma_before, loser_sigma_before, winner_sigma_after, loser_sigma_after)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);
        `, [playlist_id, winner_id, loser_id, winner.mu, loser.mu, newWinner.mu, newLoser.mu, winner.sigma, loser.sigma, newWinner.sigma, newLoser.sigma]
    );
        
    return {
        message: 'Ratings updated successfully',
        winnerNewRating: newWinner,
        loserNewRating: newLoser
    };
};

// Undo a comparison between two songs
const undoComparison = async (playlist_id, winner_id, loser_id) => {
    try {
        // Get previous elo ratings from compare_history
        const previousScores = await db.query(`
            SELECT winner_mu_before, loser_mu_before, winner_sigma_before, loser_sigma_before
            FROM compare_history
            WHERE playlist_id = $1 AND winner_id = $2 AND loser_id = $3
            ORDER BY timestamp DESC
            LIMIT 1;
            `, [playlist_id, winner_id, loser_id]
        );

        if (previousScores.rows.length === 0) {
            throw new Error('No previous comparison found');
        }

        const { winner_mu_before, loser_mu_before, winner_sigma_before, loser_sigma_before } = previousScores.rows[0];

        // Restore previous elo ratings
        await db.query(`
            UPDATE songs
            SET mu = CASE
                WHEN id = $1 THEN $2::double precision
                WHEN id = $3 THEN $4::double precision
            END,
            sigma = CASE
                WHEN id = $1 THEN $5::double precision
                WHEN id = $3 THEN $6::double precision
            END,
            match_count = match_count - 1
            WHERE id IN ($1, $3);
            `, [winner_id, winner_mu_before, loser_id, loser_mu_before, winner_sigma_before, loser_sigma_before]
        );

        // Delete comparison from compare_history
        await db.query(`
            DELETE FROM compare_history
            WHERE ctid = (
                SELECT ctid
                FROM compare_history
                WHERE playlist_id = $1 AND winner_id = $2 AND loser_id = $3
                ORDER BY timestamp DESC
                LIMIT 1
            );
            `, [playlist_id, winner_id, loser_id]
        );
    } catch (error) {
        console.error('Error undoing comparison:', error);
        throw error;
    }
};

    // Export the functions
module.exports = {
    fetchSongPairs,
    compareSongs,
    undoComparison
}