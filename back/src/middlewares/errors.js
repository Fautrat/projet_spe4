import { MAX_FILE_SIZE_MB } from './upload.js';

// Erreur avec un code HTTP et un message affiché tel quel par le front
export class HttpError extends Error {
	constructor(status, message) {
		super(message);
		this.status = status;
	}
}

// Vérification des champs reçus : erreur 400 si la valeur ne convient pas
export function requireText(value, label, maxLength) {
	const text = typeof value === 'string' ? value.trim() : '';
	if (!text) {
		throw new HttpError(400, `${label} est obligatoire.`);
	}
	if (text.length > maxLength) {
		throw new HttpError(400, `${label} ne doit pas dépasser ${maxLength} caractères.`);
	}
	return text;
}

export function requireEmail(value) {
	const email = requireText(value, 'L\'email', 255).toLowerCase();
	if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
		throw new HttpError(400, 'L\'email n\'est pas valide.');
	}
	return email;
}

export function errorHandler(err, req, res, next) {
	if (err instanceof HttpError) {
		return res.status(err.status).json({ message: err.message });
	}
	if (err.code === 'LIMIT_FILE_SIZE') {
		return res.status(413).json({ message: `Fichier trop volumineux : ${MAX_FILE_SIZE_MB} Mo maximum.` });
	}
	if (err.code === 'FILE_TYPE_REFUSED') {
		return res.status(415).json({ message: err.message });
	}
	if (err.code === 'ER_DATA_TOO_LONG') {
		return res.status(400).json({ message: 'Un des champs dépasse la longueur autorisée.' });
	}
	if (err.code === 'ER_DUP_ENTRY') {
		return res.status(409).json({ message: 'Cette valeur est déjà utilisée.' });
	}
	if (err.code === 'ENOENT') {
		return res.status(404).json({ message: 'Fichier introuvable sur le serveur.' });
	}
	console.error(err);
	res.status(500).json({ message: 'Erreur du serveur, réessayez plus tard.' });
}
