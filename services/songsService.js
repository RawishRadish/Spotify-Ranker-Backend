const songsRepository = require('../repositories/songsRepository');

const getSongInfo = async (songId, playlistId) => {
    try {
        const songInfoRes = songsRepository.getSongInfo(songId, playlistId);
        return songInfoRes;
    } catch (error) {
        console.error('Error fetching song info: ', error);
        throw error;
    }
};

module.exports = {
    getSongInfo,
}