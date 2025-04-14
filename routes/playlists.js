const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const db = require('../db');

//Delete a playlist from the database
router.delete('/playlists/:id', async (req, res) => {
    const playlistId = req.params.id;
    if (!playlistId) {
        return res.status(400).send('No playlist ID provided');
    }

    try {
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            const deleteSongs = `
                DELETE FROM songs WHERE playlist_id = $1
            `;
            await client.query(deleteSongs, [playlistId]);

            const deletePlaylist = `
                DELETE FROM playlists WHERE id = $1
            `;
            await client.query(deletePlaylist, [playlistId]);

            await client.query('COMMIT');
            res.status(200).send('Playlist deleted');
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Database error:', error);
            res.status(500).send('Database error');
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error deleting playlist:', error);
        res.status(500).send('Error deleting playlist');
    }
});

//Get a random pair of songs from a playlist
router.get('/playlists/:id/random', async (req, res) => {
    if (!req.headers.authorization) {
        return res.status(401).send('Unauthorized, no header found');
    }
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
        return res.status(401).send('Unauthorized');
    }
    const playlistId = req.params.id;
    try {
        const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const { items } = response.data;
        const randomIndex = Math.floor(Math.random() * items.length);
        res.json(items[randomIndex].track);
    } catch (error) {
        console.error('Error retrieving random song:', error.response ? error.response.data : error);
        res.status(500).send('Error retrieving random song');
    }
});



module.exports = router;