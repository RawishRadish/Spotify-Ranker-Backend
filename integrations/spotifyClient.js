const spotifyRequest = require('../middlewares/spotifyRequest');

// Get playlist metadata from Spotify
const getPlaylistMetadata = async (req, playlistId) => {
    return await spotifyRequest(req, `playlists/${playlistId}`);
};

// Get all songs from a playlist
const getAllTracksFromPlaylist = async (req, playlistId) => {
    const playlistData = await spotifyRequest(req, `playlists/${playlistId}`);
        const totalTracks = playlistData.tracks.total;
        const items = playlistData.tracks.items;

        if (totalTracks <= items.length) {
            console.log('Received all tracks in one request');
            return { playlistData, allTracks: items };
        }
        
        console.log('Received only some tracks, need to fetch more');
        
        const getRemainingTracks = async () => {
            const allTracks = [...items];
            let offset = items.length;
            const limit = 100;

            while (offset < totalTracks) {
                const response = await spotifyRequest(req, `playlists/${playlistId}/tracks`, {
                    params: { offset, limit }
                });
                allTracks.push(...response.items);
                offset += limit;
            }

            return allTracks;
        };

        const allTracks = await getRemainingTracks();
        return { playlistData, allTracks };        
};

// Get artist info from Spotify by ID
const getArtistsByIds = async (req, artistIds) => {
    const batchsize = 50;
    const batches = [];
    for (let i = 0; i < artistIds.length; i += batchsize) {
        batches.push(artistIds.slice(i, i + batchsize));
    }

    const results = await Promise.all(
        batches.map(batch => 
            spotifyRequest(req, 'artists', {
                params: { ids: batch.join(',') }
            })
        )
    );

    const allArtists = results.flatMap(result => result.artists);
    return allArtists;
};

// Export the functions
module.exports = {
    getPlaylistMetadata,
    getAllTracksFromPlaylist,
    getArtistsByIds,
};