import 'dotenv/config';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import apiRoutes from './routes/apiRoutes.js';
import { checkDatabaseConnection } from './config/db.js';

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

// Front compilé servi par le back, sur la même origine que l'API
const FRONT_DIR = fileURLToPath(new URL('../../front/dist', import.meta.url));
if (existsSync(FRONT_DIR)) {
	app.use(express.static(FRONT_DIR));
	// Les routes du front renvoient index.html, Vue Router prend le relais
	app.use((req, res, next) => {
		if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
		res.sendFile(path.join(FRONT_DIR, 'index.html'));
	});
}

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