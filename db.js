const { Pool } = require('pg');
const { password } = require('pg/lib/defaults');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'spotify_ranker',
    password: 'Stukje17-07',
    port: 5432,
});

module.exports = pool;