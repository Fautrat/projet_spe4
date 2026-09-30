// Fausse API du profil et de la double authentification, en attendant leurs routes dans le back
// Rien n'est enregistré en base : les changements ne vivent que dans la session du navigateur
import { session } from '../stores/session.js';

// Code accepté pour la double authentification en mode démo
const MOCK_TOTP_CODE = '123456';

function wait() {
	return new Promise((resolve) => setTimeout(resolve, 200));
}

function checkCode(code) {
	if (code !== MOCK_TOTP_CODE) {
		throw new Error('Code incorrect. En mode démo, le code est 123456.');
	}
}

export async function updateProfile(changes) {
	await wait();
	return { ...session.user, ...changes };
}

export async function changePassword(currentPassword) {
	await wait();
	if (!currentPassword) {
		throw new Error('Le mot de passe actuel est obligatoire.');
	}
}

export async function setupTwoFactor() {
	await wait();
	return { secret: 'JBSWY3DPEHPK3PXP', qr_code: null };
}

export async function enableTwoFactor(code) {
	await wait();
	checkCode(code);
	return { ...session.user, totp_enabled: true };
}

export async function disableTwoFactor(code) {
	await wait();
	checkCode(code);
	return { ...session.user, totp_enabled: false };
}
