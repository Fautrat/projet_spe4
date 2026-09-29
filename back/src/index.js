import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
// import passport from 'passport';
import authRoutes from './routes/authRoutes.js';
import filesRoutes from './routes/filesRoutes.js';
import mainRoutes from './routes/mainRoutes.js';


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
app.use(express.json());
app.get('/api/health', (req, res) => {res.json({ status: 'ok' });});
app.use(morgan(":date[Europe/Paris] \: :remote-addr - :method :url | :status | :response-time ms | :res[content-length]"));

// Routes
app.use('/', mainRoutes)
app.use('/auth', authRoutes)
app.use('/files', filesRoutes)

// Server starting
app.listen(PORT, () => {
	console.log(`API démarrée sur http://localhost:${PORT}`);
});
