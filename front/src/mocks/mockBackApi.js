// Fausse API utilisée tant que VITE_USE_MOCKS n'est pas à false.
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

let folders = [
	{ id: 1, name: 'Bestiaire', parent_id: null, updated_at: '2026-09-20T18:00:00' },
	{ id: 2, name: 'Chroniques de campagne', parent_id: null, updated_at: '2026-09-26T21:15:00' },
	{ id: 3, name: 'Dragons', parent_id: 1, updated_at: '2026-09-22T10:40:00' },
];

let documents = [
	{
		id: 1,
		folder_id: null,
		name: 'Règles de la maison',
		content: 'Un 20 naturel double les dégâts.\nUn 1 naturel fait tomber votre arme.\nLe maître du jeu a toujours raison.',
		file_path: null,
		updated_at: '2026-09-25T20:30:00',
		updated_by_name: 'Maitre Jedi',
	},
	{
		id: 2,
		folder_id: 3,
		name: 'Le dragon de Brumeval',
		content: 'Vieux dragon rouge endormi sous la montagne.\nPoints faibles : l\'orgueil et les chants elfiques.',
		file_path: null,
		updated_at: '2026-09-22T10:40:00',
		updated_by_name: 'Jeune Padawan',
	},
	{
		id: 3,
		folder_id: 2,
		name: 'Session 1 : la taverne du Sanglier noir',
		content: 'Le groupe se rencontre à la taverne. Une bagarre éclate, le barde s\'enfuit avec la caisse.',
		file_path: null,
		updated_at: '2026-09-26T21:15:00',
		updated_by_name: 'Maitre Jedi',
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

function touch(doc) {
	doc.updated_at = new Date().toISOString();
	doc.updated_by_name = `${session.user.first_name} ${session.user.last_name}`;
}

function findDocument(id) {
	const doc = documents.find((item) => item.id === Number(id));
	if (!doc) {
		throw new Error('Ce parchemin est introuvable.');
	}
	return doc;
}

function pathTo(folderId) {
	const path = [];
	let folder = folders.find((item) => item.id === folderId);
	while (folder) {
		path.unshift(folder);
		const parentId = folder.parent_id;
		folder = folders.find((item) => item.id === parentId);
	}
	return path;
}

function subFolderIds(folderId) {
	const ids = [folderId];
	for (const child of folders.filter((item) => item.parent_id === folderId)) {
		ids.push(...subFolderIds(child.id));
	}
	return ids;
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

export async function getFolder(folderId) {
	await wait();
	const id = folderId ? Number(folderId) : null;
	return structuredClone({
		folder: folders.find((item) => item.id === id) || null,
		path: pathTo(id),
		folders: folders.filter((item) => item.parent_id === id),
		documents: documents.filter((item) => item.folder_id === id),
	});
}

export async function createFolder(name, parentId) {
	await wait();
	const folder = { id: nextId(folders), name, parent_id: parentId, updated_at: new Date().toISOString() };
	folders.push(folder);
	return { ...folder };
}

export async function deleteFolder(id) {
	await wait();
	const ids = subFolderIds(id);
	folders = folders.filter((item) => !ids.includes(item.id));
	documents = documents.filter((item) => !ids.includes(item.folder_id));
}

export async function createDocument(name, folderId) {
	await wait();
	const doc = { id: nextId(documents), folder_id: folderId, name, content: '', file_path: null };
	touch(doc);
	documents.push(doc);
	return { ...doc };
}

export async function uploadFile(file, folderId) {
	await wait();
	const doc = {
		id: nextId(documents),
		folder_id: folderId,
		name: file.name,
		content: null,
		file_path: URL.createObjectURL(file),
		mime_type: file.type || 'application/octet-stream',
		file_size: file.size,
	};
	touch(doc);
	documents.push(doc);
	return { ...doc };
}

export async function getDocument(id) {
	await wait();
	return { ...findDocument(id) };
}

export async function saveDocument(id, content) {
	await wait();
	const doc = findDocument(id);
	doc.content = content;
	touch(doc);
	return { ...doc };
}

export async function replaceFile(id, file) {
	await wait();
	const doc = findDocument(id);
	doc.name = file.name;
	doc.file_path = URL.createObjectURL(file);
	doc.mime_type = file.type || 'application/octet-stream';
	doc.file_size = file.size;
	touch(doc);
	return { ...doc };
}

export async function deleteDocument(id) {
	await wait();
	documents = documents.filter((item) => item.id !== id);
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
