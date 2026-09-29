// Fausse API pour l'auth, les utilisateurs et le profil, tant que VITE_USE_MOCKS n'est pas à false.
// Les fichiers passent déjà par le vrai back.
// Les données restent en mémoire : elles reviennent à zéro à chaque rechargement.
import { session } from '../stores/session.js';

const users = [
	{
		id: 1,
		email: 'mj@test.fr',
		password: 'admin1234',
		first_name: 'Maitre',
		last_name: 'Jedi',
		role: 'admin',
		is_blocked: false,
		totp_enabled: false,
		totp_secret: null,
		created_at: '2026-09-01T09:00:00',
	},
	{
		id: 2,
		email: 'aventurier@test.fr',
		password: 'user1234',
		first_name: 'Jeune',
		last_name: 'Padawan',
		role: 'user',
		is_blocked: false,
		totp_enabled: false,
		totp_secret: null,
		created_at: '2026-09-12T14:30:00',
	},
];

function wait() {
	return new Promise((resolve) => setTimeout(resolve, 200));
}

function nextId(list) {
	return Math.max(0, ...list.map((item) => item.id)) + 1;
}

// Code accepté par le mock pour la double authentification.
const MOCK_TOTP_CODE = '123456';

function withoutPassword(user) {
	const { password, totp_secret, ...rest } = user;
	return rest;
}

function currentUser() {
	return users.find((item) => item.id === session.user.id);
}

function checkCode(code) {
	if (code !== MOCK_TOTP_CODE) {
		throw new Error('Code incorrect. En mode démo, le code est 123456.');
	}
}

function addUser(user) {
	if (users.some((item) => item.email === user.email)) {
		throw new Error('Cet email est déjà inscrit au registre.');
	}
	const newUser = {
		...user,
		id: nextId(users),
		is_blocked: false,
		totp_enabled: false,
		totp_secret: null,
		created_at: new Date().toISOString(),
	};
	users.push(newUser);
	return newUser;
}

export async function login(email, password) {
	await wait();
	const user = users.find((item) => item.email === email && item.password === password);
	if (!user) {
		throw new Error('Identifiants incorrects.');
	}
	if (user.is_blocked) {
		throw new Error('Ce compte a été banni par le maître du jeu.');
	}
	if (user.totp_enabled) {
		return { requires_2fa: true, temp_token: `temp-${user.id}` };
	}
	return { user: withoutPassword(user), token: 'mock-token' };
}

export async function verifyTwoFactor(tempToken, code) {
	await wait();
	checkCode(code);
	const user = users.find((item) => `temp-${item.id}` === tempToken);
	return { user: withoutPassword(user), token: 'mock-token' };
}

export async function register(user) {
	await wait();
	const newUser = addUser({ ...user, role: 'user' });
	return { user: withoutPassword(newUser), token: 'mock-token' };
}

export async function logout() {
	await wait();
}

export async function getUsers() {
	await wait();
	return users.map(withoutPassword);
}

export async function createUser(user) {
	await wait();
	return withoutPassword(addUser(user));
}

export async function setUserBlocked(id, isBlocked) {
	await wait();
	const user = users.find((item) => item.id === id);
	user.is_blocked = isBlocked;
	return withoutPassword(user);
}

// Profil de l'utilisateur connecté

export async function updateProfile(changes) {
	await wait();
	const user = currentUser();
	if (users.some((item) => item.email === changes.email && item.id !== user.id)) {
		throw new Error('Cet email est déjà inscrit au registre.');
	}
	Object.assign(user, changes);
	return withoutPassword(user);
}

export async function changePassword(currentPassword, newPassword) {
	await wait();
	const user = currentUser();
	if (user.password !== currentPassword) {
		throw new Error('Le mot de passe actuel est incorrect.');
	}
	user.password = newPassword;
}

export async function setupTwoFactor() {
	await wait();
	currentUser().totp_secret = 'JBSWY3DPEHPK3PXP';
	return { secret: 'JBSWY3DPEHPK3PXP', qr_code: null };
}

export async function enableTwoFactor(code) {
	await wait();
	checkCode(code);
	const user = currentUser();
	user.totp_enabled = true;
	return withoutPassword(user);
}

export async function disableTwoFactor(code) {
	await wait();
	checkCode(code);
	const user = currentUser();
	user.totp_enabled = false;
	user.totp_secret = null;
	return withoutPassword(user);
}
