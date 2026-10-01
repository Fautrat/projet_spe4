import jwt from 'jsonwebtoken';
import { db } from '../config/db.js';
import { HttpError } from './errors.js';


export default function auth(req, res, next){
	const token = req.headers.authorization?.split(' ')[1];

	if(!token){return res.status(401).json({message: "Non authentifié."});};
	try{
		req.user = jwt.verify(token, process.env.JWT_SECRET);
		next();
	}
	catch{
		res.status(401).json({message: "Token invalide ou expiré."});
	};
};

// Le token garde le rôle et is_blocked du moment de la connexion : on relit le compte
// en base, pour qu'un blocage ou un changement de rôle s'applique tout de suite
async function checkAccount(req, res, next) {
	const [rows] = await db.query(
		'SELECT id, email, first_name, last_name, role, is_blocked, totp_enabled FROM users WHERE id = ?',
		[req.user.id],
	);
	const account = rows[0];
	if (!account) {
		throw new HttpError(401, 'Ce compte n\'existe plus.');
	}
	if (account.is_blocked) {
		throw new HttpError(403, 'Ce compte a été bloqué.');
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