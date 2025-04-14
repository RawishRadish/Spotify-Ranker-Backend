const spotifyRequest = require('../middlewares/spotifyRequest');

const getSpotifyUserId = async (req) => {
    console.log('Getting Spotify user ID for user: ', req.session.userId);

    const data = await spotifyRequest(req, 'me');

    return data.id;
};

module.exports = {
    getSpotifyUserId, 
    };