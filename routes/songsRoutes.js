const express = require('express');
const router = express.Router();
const songsController = require('../controllers/songsController');

router.get('/info/:playlistId/:songId', songsController.getSongInfo);
router.get('/preview', songsController.getSongPreview);

module.exports = router;