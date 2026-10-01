import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
// import passport from 'passport';
import apiRoutes from './routes/apiRoutes.js';
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import { checkDatabaseConnection } from './config/db.js';

// Passport initialisation
// passport.serializeUser((user, done) => done(null, user));
// passport.deserializeUser((obj, done) => done(null, obj));
// passport.use(new Strategy(
//     {
//         clientID:       process.env.GOOGLE_CLIENT_ID        || '',
//         clientSecret:	process.env.GOOGLE_CLIENT_SECRET    || '',
//         callbackURL:    process.env.CALLBACK_URL            || ''
//     },
//     (accessToken, refreshToken, profile, done) => {return done(null, profile);}
// ));

// Settings
const PORT 			= Number(process.env.PORT) || 3000;
const CLIENT_URL	= process.env.CLIENT_URL || 'http://localhost:5173';
const app 			= express();
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json({ limit: '2mb' }));
app.get('/api/health', (req, res) => {res.json({ status: 'ok' });});
app.use(morgan(":date[Europe/Paris] \: :remote-addr - :method :url | :status | :response-time ms | :res[content-length]"));

// Routes
app.use('/api', apiRoutes)

// Database check
try {
	await checkDatabaseConnection();
} catch (err) {
	console.error(`Connexion à MySQL impossible (${err.code || err.message}) : vérifiez que le conteneur tourne et les variables DB_* de back/.env.`);
}

// Server starting
app.listen(PORT, () => {
	console.log(`API démarrée sur http://localhost:${PORT}`);
});