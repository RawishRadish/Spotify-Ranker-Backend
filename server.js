require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');

const pool = require('./db');
const app = express();
const playlistRoutes = require('./routes/playlistRoutes');
const compareRoutes = require('./routes/compareRoutes');
const songRoutes = require('./routes/songsRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const userAuthRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const spotifyAuthRoutes = require('./routes/spotifyAuthRoutes');
const { authenticateToken } = require('./middlewares/authMiddleware');

const allowedOrigins = [
    'http://localhost:5173',
    'https://spotify-ranker-frontend.vercel.app',
    'https://spotify-ranker.com',
    'https://www.spotify-ranker.com',
];

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            return callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.set('trust proxy', 1);
app.use(session({
    store: new (require('connect-pg-simple')(session))({
        pool: pool,
        tableName: 'session',
        pruneSessionInterval: 60,
    }),
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
    resave: false,
    proxy: true,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'None',
        domain: '.spotify-ranker.com',
    }
}));

app.get('/', (req, res) => {
    res.send('Welcome to the Spotify Ranking API');
});

app.get('/session-test', (req, res) => {
    req.session.test = 'Hello, session!';
    res.send('Session set');
})

app.get('/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json(result.rows);
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).send('Database error');
    }
});

app.get('/test-auth', authenticateToken, (req, res) => {
    res.json(req.user);
});


app.use('/playlists', playlistRoutes);
app.use('/spotify', spotifyAuthRoutes);
app.use('/user', userRoutes);
app.use('/pairs', compareRoutes);
app.use('/auth', userAuthRoutes);
app.use('/stats', statisticsRoutes);
app.use('/songs', songRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
});