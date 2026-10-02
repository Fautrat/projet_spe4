import crypto 	from 'node:crypto';
import QRCode 	from 'qrcode';
import bcrypt 	from 'bcrypt';
import jwt 		from 'jsonwebtoken';
import * as users from '../models/userModel.js';

const TOTP_DIGITS = 6;
const TOTP_PERIOD = 30;

function normalizeUser(account){
	return{
		id: account.id,
		email: account.email,
		first_name: account.first_name,
		last_name: account.last_name,
		role: account.role,
		is_blocked: account.is_blocked,
		totp_enabled: Boolean(account.totp_enabled),
	};
};

function signUserToken(user, expiresIn = '3d'){return jwt.sign(user, process.env.JWT_SECRET, {expiresIn});};

function base32Decode(secret) {
	const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
	let bits = 0;
	let value = 0;
	const output = [];

	for (const char of secret.toUpperCase()) {
		const idx = alphabet.indexOf(char);
		if (idx === -1) continue;
		value = (value << 5) | idx;
		bits += 5;
		if (bits >= 8) {
			bits -= 8;
			output.push((value >> bits) & 0xff);
		}
	}

	return Buffer.from(output);
}

export function generateTotpSecret(length = 32) {
	const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
	const bytes = crypto.randomBytes(Math.ceil((length * 5) / 8));
	let value = 0;
	let bits = 0;
	let result = '';

	for (const byte of bytes) {
		value = (value << 8) | byte;
		bits += 8;
		while (bits >= 5) {
			result += chars[(value >> (bits - 5)) & 31];
			bits -= 5;
		}
	}

	if (bits > 0) {
		result += chars[(value << (5 - bits)) & 31];
	}

	return result.slice(0, length).toUpperCase();
}

export function generateTotpCode(secret, timestamp = Date.now()) {
	const key = base32Decode(secret);
	const counter = Math.floor(timestamp / 1000 / TOTP_PERIOD);
	const buffer = Buffer.alloc(8);
	let value = BigInt(counter);

	for (let i = 7; i >= 0; i--) {
		buffer[i] = Number(value & 255n);
		value >>= 8n;
	}

	const hash = crypto.createHmac('sha1', key).update(buffer).digest();
	const offset = hash[hash.length - 1] & 0x0f;
	const binary = ((hash[offset] & 0x7f) << 24)
		| ((hash[offset + 1] & 0xff) << 16)
		| ((hash[offset + 2] & 0xff) << 8)
		| (hash[offset + 3] & 0xff);

	const code = binary % 10 ** TOTP_DIGITS;
	return String(code).padStart(TOTP_DIGITS, '0');
}

export function verifyTotpCode(secret, code, timestamp = Date.now()) {
	if (typeof secret !== 'string' || !secret || typeof code !== 'string') {
		return false;
	}

	const normalizedCode = code.trim();
	if (!/^\d{6}$/.test(normalizedCode)) {
		return false;
	}

	const currentWindow = Math.floor(timestamp / 1000 / TOTP_PERIOD);
	for (let offset = -1; offset <= 1; offset++) {
		const candidate = generateTotpCode(secret, (currentWindow + offset) * TOTP_PERIOD * 1000);
		if (candidate === normalizedCode) {
			return true;
		}
	}

	return false;
}

export function buildTotpAuthUrl(email, secret) {
	const issuer = 'Le Grimoire';
	return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

// Sign-in route
export const login = async (req, res) => {
	const {email, password} = req.body || {};

	// Checking validity of given informations
	if(typeof email !== 'string' || !email || typeof password !== 'string' || !password){
		return res.status(400).json({ message: "Email et mot de passe requis." });
	};
	const normalizedEmail = email.trim().toLowerCase();

	try{
		// Looking for an existing account into the database
		const account = await users.findByEmailWithPassword(normalizedEmail);

		// Checking found account's credentials and blocked status
		if(!account || !(await bcrypt.compare(password, account.password_hash))){return res.status(401).json({message: "Identifiants incorrects."});};
		if(account.is_blocked){return res.status(403).json({message: "Ce compte a été banni."});};

		// 2FA active : on renvoie un jeton temporaire de 10 minutes, le vrai token arrive après le code
		const user = normalizeUser(account);
		if(user.totp_enabled){
			const temp_token = jwt.sign({ id: user.id, email: user.email, purpose: 'totp' }, process.env.JWT_SECRET, { expiresIn: '10m' });
			return res.status(200).json({ requires_2fa: true, temp_token });
		};

		// Signing the user in
		return res.status(200).json({user, token: signUserToken(user)});
	}
	catch(err){
		return res.status(500).json({message: "Une erreur est survenue lors de la connexion."});
	};
};

// Registration route
export const register = async (req, res) => {
	const {password} = req.body || {};
	const first_name = typeof req.body?.first_name === 'string' ? req.body.first_name.trim()            : '';
	const last_name  = typeof req.body?.last_name  === 'string' ? req.body.last_name.trim()             : '';
	const email      = typeof req.body?.email      === 'string' ? req.body.email.trim().toLowerCase()   : '';

	// Checking validity of given informations
	if(
		!first_name	||
		!last_name 	||
		!email 		||
		typeof password !== 'string' ||
		password.length < 8
	){
		return res.status(400).json({message: "Prénom, nom, email, et/ou mot de passe de plus de 8 caractères requis."});
	};
	if(first_name.length > 100 || last_name.length > 100 || email.length > 255){
		return res.status(400).json({message: "Prénom et nom : 100 caractères maximum, email : 255."});
	};
	if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
		return res.status(400).json({message: "L'adresse email n'est pas valide."});
	};

	try{
		// Hashing new user's password
		const password_hash = await bcrypt.hash(password, 12);

		// Inserting the new user into the database, create renvoie le compte avec son id
		const account = await users.create({firstName: first_name, lastName: last_name, email, passwordHash: password_hash});

		// Signing the new user in
		const user = normalizeUser(account);
		return res.status(201).json({user, token: signUserToken(user)});
	}
	catch(err){
		if(err.code === 'ER_DUP_ENTRY'){
			return res.status(409).json({message: "Email déjà utilisé par un autre compte."});
		};
		return res.status(500).json({message: "Une erreur est survenue lors de la création du compte."});
	};
};

// POST /api/auth/2fa/verify avec { temp_token, code } : deuxième étape de la connexion
export const verifyTwoFactor = async (req, res) => {
	const { temp_token, code } = req.body || {};

	if (typeof temp_token !== 'string' || !temp_token || typeof code !== 'string' || !code) {
		return res.status(400).json({ message: 'Le jeton et le code sont requis.' });
	}

	try {
		const payload = jwt.verify(temp_token, process.env.JWT_SECRET);
		if (!payload || payload.purpose !== 'totp' || !payload.id) {
			return res.status(401).json({ message: 'Jeton de validation invalide.' });
		}

		const account = await users.findWithTotp(payload.id);
		if (!account || !account.totp_enabled || !account.totp_secret) {
			return res.status(401).json({ message: 'La double authentification n\'est pas active pour ce compte.' });
		}
		if (account.is_blocked) {
			return res.status(403).json({ message: 'Ce compte a été banni.' });
		}
		if (!verifyTotpCode(account.totp_secret, code)) {
			return res.status(401).json({ message: 'Code de validation incorrect.' });
		}

		const user = normalizeUser(account);
		return res.status(200).json({ user, token: signUserToken(user) });
	} catch (error) {
		return res.status(401).json({ message: 'Le jeton ou le code de validation est invalide.' });
	}
};

// POST /api/auth/2fa/setup : nouveau secret enregistré, pas encore actif tant que enable n'a pas validé un code
export const setupTwoFactor = async (req, res) => {
	const secret = generateTotpSecret();
	const qrCode = await QRCode.toDataURL(buildTotpAuthUrl(req.user.email, secret));

	try {
		await users.setTotpSecret(req.user.id, secret);
		return res.status(200).json({ secret, qr_code: qrCode });
	} catch (error) {
		return res.status(500).json({ message: 'Impossible de préparer la double authentification.' });
	}
};

// Un code faux répond 400 et pas 401 : le front prendrait un 401 pour un token expiré et déconnecterait la personne

// POST /api/auth/2fa/enable avec { code }
export const enableTwoFactor = async (req, res) => {
	const { code } = req.body || {};
	if (typeof code !== 'string' || !/^\d{6}$/.test(code.trim())) {
		return res.status(400).json({ message: 'Le code à 6 chiffres est requis.' });
	}

	try {
		const account = await users.findWithTotp(req.user.id);
		if (!account || !account.totp_secret) {
			return res.status(400).json({ message: 'La préparation de la double authentification est manquante.' });
		}
		if (!verifyTotpCode(account.totp_secret, code)) {
			return res.status(400).json({ message: 'Code incorrect.' });
		}

		return res.status(200).json(normalizeUser(await users.enableTotp(req.user.id)));
	} catch (error) {
		return res.status(500).json({ message: 'Impossible d\'activer la double authentification.' });
	}
};

// POST /api/auth/2fa/disable avec { code }
export const disableTwoFactor = async (req, res) => {
	const { code } = req.body || {};
	if (typeof code !== 'string' || !/^\d{6}$/.test(code.trim())) {
		return res.status(400).json({ message: 'Le code à 6 chiffres est requis.' });
	}

	try {
		const account = await users.findWithTotp(req.user.id);
		if (!account || !account.totp_secret || !account.totp_enabled) {
			return res.status(400).json({ message: 'La double authentification n\'est pas activée.' });
		}
		if (!verifyTotpCode(account.totp_secret, code)) {
			return res.status(400).json({ message: 'Code incorrect.' });
		}

		return res.status(200).json(normalizeUser(await users.disableTotp(req.user.id)));
	} catch (error) {
		return res.status(500).json({ message: 'Impossible de désactiver la double authentification.' });
	}
};
