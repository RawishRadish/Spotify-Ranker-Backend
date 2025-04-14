const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/last_playlist', userController.setLastPlaylist);
router.get('/last_playlist', userController.getLastPlaylist);

// Export the router
module.exports = router;