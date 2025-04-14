const songsRepo = require('../repositories/songsRepository');

// Get genre breakdown for a playlist
const getGenreCount = async (playlistId) => {
    const rawCounts = await songsRepo.getGenreCount(playlistId);
    return rawCounts.map(row => ({
        genre: row.genre,
        count: parseInt(row.count, 10),
    }));
};

// Get artist breakdown for a playlist
const getArtistCount = async (playlistId) => {
    const rawCounts = await songsRepo.getArtistCount(playlistId);
    return rawCounts.map(row => ({
        artist: row.artist,
        count: parseInt(row.count, 10),
    }));
}

// Get total choices for a playlist
const getTotalComparisons = async (playlistId) => {
    const totalComparisons = await songsRepo.getTotalComparisons(playlistId);
    return totalComparisons;
}

// Get ranking stability for a playlist
const getSigmaPerSong = async (playlistId) => {
    const rawSigma = await songsRepo.getSigmaPerSong(playlistId);
    return rawSigma.map(row => ({
        title: row.title,
        sigma: parseFloat(row.sigma),
    }));
}

// Export the functions
module.exports = {
    getGenreCount,
    getArtistCount,
    getTotalComparisons,
    getSigmaPerSong,
    // getRankingStability,
};