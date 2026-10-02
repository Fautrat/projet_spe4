import crypto from 'node:crypto';

// Double authentification (TOTP) : génération du secret, calcul et vérification des codes à 6 chiffres
const TOTP_DIGITS = 6;
const TOTP_PERIOD = 30;

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
