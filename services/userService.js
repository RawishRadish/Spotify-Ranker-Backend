const userRepo = require('../repositories/userRepository');

const setLastPlaylist = async (userId, playlistId) => {
    return await userRepo.setLastPlaylist(userId, playlistId);
};

const getLastPlaylist = async (userId) => {
    return await userRepo.getLastPlaylist(userId);
};

// Export the functions
module.exports = {
    setLastPlaylist,
    getLastPlaylist,
};