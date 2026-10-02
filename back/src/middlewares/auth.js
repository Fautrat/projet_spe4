import jwt from 'jsonwebtoken';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { findById } from '../models/userModel.js';
import { HttpError } from './errors.js';


export default function auth(req, res, next){
	const token = req.headers.authorization?.split(' ')[1];

	if(!token){return res.status(401).json({message: "Non authentifié."});};
	try{
		req.user = jwt.verify(token, process.env.JWT_SECRET);
		// le jeton temporaire de la 2FA (purpose: 'totp') ne sert qu'à /auth/2fa/verify
		if(req.user.purpose){return res.status(401).json({message: "Token invalide ou expiré."});};
		next();
	}
	catch{
		res.status(401).json({message: "Token invalide ou expiré."});
	};
};

// Le token garde le rôle et is_blocked du moment de la connexion : on relit le compte
// en base, pour qu'un blocage ou un changement de rôle s'applique tout de suite
async function checkAccount(req, res, next) {
	const account = await findById(req.user.id);
	if (!account) {
		throw new HttpError(401, 'Ce compte n\'existe plus.');
	}
	if (account.is_blocked) {
		throw new HttpError(401, 'Ce compte a été bloqué.');
	}
	req.user = account;
	next();
}

function checkAdmin(req, res, next) {
	if (req.user.role !== 'admin') {
		throw new HttpError(403, 'Action réservée aux administrateurs.');
	}
	next();
}

// À mettre sur chaque route, par exemple : apiRoutes.get('/chemin', connected, controleur)
export const connected = [auth, checkAccount];
export const admin = [auth, checkAccount, checkAdmin];

// 5 connexions ratées par tranche de 15 minutes pour un même couple adresse IP et email,
// les connexions réussies ne comptent pas
// En production derrière Nginx, ajouter app.set('trust proxy', 1) dans index.js, sinon req.ip vaut l'adresse de Nginx
export const loginLimit = rateLimit({
	windowMs: 15 * 60 * 1000,
	limit: 5,
	skipSuccessfulRequests: true,
	keyGenerator: (req) => `${ipKeyGenerator(req.ip)} ${String(req.body?.email || '').trim().toLowerCase()}`,
	message: { message: 'Trop de tentatives de connexion, réessayez dans 15 minutes.' },
	standardHeaders: 'draft-8',
	legacyHeaders: false,
});
