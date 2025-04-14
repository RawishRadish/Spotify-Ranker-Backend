const songsService = require('../services/songsService');
const previewService = require('../services/previewService');

const getSongInfo = async (req, res) => {
    const { songId, playlistId } = req.params;

    try {
        const songInfo = await songsService.getSongInfo(songId, playlistId);
        res.status(200).json(songInfo);
    } catch (error) {
        console.error ('Error fetching song info: ', error);
        res.status(500).json({ message: 'Error fetching song info', error });
    }
};

const getSongPreview = async (req, res) => {
    const { title, artist } = req.query;
    try {
        const preview = await previewService.getPreviewUrl({ title, artist });
        res.status(200).json(preview);
    } catch (error) {
        console.error('Error fetching preview', error);
        res.status(500).json({ message: 'Preview could not be fetched from backend' });
    }
}

module.exports = {
    getSongInfo,
    getSongPreview,
};