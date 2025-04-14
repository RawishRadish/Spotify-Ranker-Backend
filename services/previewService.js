const spotifyPreviewFinder = require('spotify-preview-finder');
const fuzzy = require('fuzzy');

// Function to get the preview URL of a song
const getPreviewUrl = async (song) => {
    console.log('Getting preview URL for:', song);
    const result = await spotifyPreviewFinder(`${song.title} - ${song.artist}`, 1);
    const songWithPreview = result.results[0];
    
    
    // await spotifyPreviewFinder(songs);
    console.log('Preview URL:', songWithPreview.name);

    const match = fuzzy.filter(`${song.title} - ${song.artist}`, [songWithPreview.name]);

    if (match.length > 0) {
        return songWithPreview;
    }
    return null;
};

// Export the functions
module.exports = {
    getPreviewUrl,
};