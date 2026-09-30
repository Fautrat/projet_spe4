import { randomUUID } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';

// Les fichiers sont enregistrés sous un nom aléatoire, jamais sous le nom envoyé par le client
export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || 'uploads');

export const MAX_FILE_SIZE_MB = 10;

// Pas de SVG ni de HTML : ils peuvent contenir du JavaScript exécuté à l'ouverture
const ALLOWED_TYPES = [
	'application/pdf',
	'image/png',
	'image/jpeg',
	'image/gif',
	'image/webp',
	'text/plain',
];

export const upload = multer({
	storage: multer.diskStorage({
		destination: UPLOAD_DIR,
		filename: (req, file, callback) => callback(null, randomUUID()),
	}),
	limits: { fileSize: MAX_FILE_SIZE_MB * 1024 * 1024 },
	fileFilter: (req, file, callback) => {
		if (ALLOWED_TYPES.includes(file.mimetype)) {
			callback(null, true);
		} else {
			callback(Object.assign(new Error('Type de fichier refusé : PDF, image (PNG, JPEG, GIF, WebP) ou texte uniquement.'), { code: 'FILE_TYPE_REFUSED' }));
		}
	},
});

export function originalName(file) {
	const decoded = Buffer.from(file.originalname, 'latin1').toString('utf8');
	return decoded.includes('\uFFFD') ? file.originalname : decoded;
}

export function storedFilePath(fileName) {
	return path.join(UPLOAD_DIR, path.basename(fileName));
}

export async function deleteStoredFiles(fileNames) {
	await Promise.all(fileNames.map((name) => unlink(storedFilePath(name)).catch(() => {})));
}
