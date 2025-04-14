const { Rating, rate } = require('openskill');

// Function to compare two songs and update their ratings
const updateRatings = (winner, loser) => {
    console.log('Updating ratings for:', winner, loser);

    const [[newWinner], [newLoser]] = rate([[winner], [loser]]);
    console.log('New ratings:', newWinner, newLoser);
    return [newWinner, newLoser];
};

// Export the functions
module.exports = {
    updateRatings
};