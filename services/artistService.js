const artistRepo = require('../repositories/artistRepository');
const spotifyClient = require('../integrations/spotifyClient');

// Save artist information to the database
const saveMissingArtists = async (req, allTracks) => {
    // Get the unique artist IDs from the tracks
    const artistIds = [...new Set(allTracks.flatMap(track => track.track.artists.map(artist => artist.id)))];
    // Check in database if the artist is already present
    const existingArtistIds = await artistRepo.getExistingArtistIds(artistIds);
    const missingArtistIds = artistIds.filter(id => !existingArtistIds.includes(id));
    if (missingArtistIds.length === 0) {
        console.log('All artists are already in the database.');
        return;
    }
    console.log('Missing artist IDs:', missingArtistIds);

    // API call to Spotify for missing artists
    const newArtists = await spotifyClient.getArtistsByIds(req, missingArtistIds);

    // Save new artists + genres to the database
    await artistRepo.saveArtists(newArtists);
    console.log(`Saved ${newArtists.length} new artists to the database.`);
};

// Enrich songs with genre information
const enrichSongsWithGenresFromDb = async (tracks) => {
    // Get the unique artist IDs from the tracks
    const artistIds = [...new Set(tracks.flatMap(track => track.track.artists.map(artist => artist.id)))];
    // Get all genres from the database
    const genres = await artistRepo.getGenresByArtistIds(artistIds);
    // Map genres to the artist IDs
    const artistGenreMap = new Map();
    genres.forEach(( { spotify_artist_id, genre }) => {
        artistGenreMap.set(spotify_artist_id, genre);
    });
    // Enrich the songs with genres
    tracks.forEach(track => {
        const genresPerTrack = track.track.artists.flatMap(artist => {
            const genre = artistGenreMap.get(artist.id);
            return genre || [];
        });
        const uniqueGenres = [...new Set(genresPerTrack)];
        track.track.genres = uniqueGenres;
    });

    return tracks;
};

// Export the functions
module.exports = {
    saveMissingArtists,
    enrichSongsWithGenresFromDb,
};