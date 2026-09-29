import * as mock from '../mocks/mockBackApi.js';
import { API_URL, USE_MOCKS } from '../config/config.js';
import { session } from '../stores/session.js';

// Les champs suivent les colonnes de la base (first_name, is_blocked, file_path...).

async function request(method, path, body) {
	const options = { method, headers: {} };

	if (session.token) {
		options.headers.Authorization = `Bearer ${session.token}`;
	}
	if (body instanceof FormData) {
		options.body = body;
	} else if (body) {
		options.headers['Content-Type'] = 'application/json';
		options.body = JSON.stringify(body);
	}

	const response = await fetch(API_URL + path, options);
	const data = await response.json().catch(() => null);

	if (!response.ok) {
		throw new Error(data?.message || data?.error || 'Le serveur ne répond pas.');
	}
	return data;
}

// Authentification

export function login(email, password) {
	if (USE_MOCKS) {
		return mock.login(email, password);
	}
	return request('POST', '/api/auth/login', { email, password });
}

// Si la double authentification est activée, login renvoie { requires_2fa: true, temp_token }.
export function verifyTwoFactor(tempToken, code) {
	if (USE_MOCKS) {
		return mock.verifyTwoFactor(tempToken, code);
	}
	return request('POST', '/api/auth/2fa/verify', { temp_token: tempToken, code });
}

export function register(user) {
	if (USE_MOCKS) {
		return mock.register(user);
	}
	return request('POST', '/api/auth/register', user);
}

export function logout() {
	if (USE_MOCKS) {
		return mock.logout();
	}
	return request('POST', '/api/auth/logout');
}

// Dossiers et documents

// Pas encore de route côté back pour les dossiers et l'upload
async function notAvailableYet() {
	throw new Error('Pas encore disponible côté serveur.');
}

// Renvoie { folder, path, folders, documents }. Sans dossiers, tous les fichiers sont à la racine.
export async function getFolder() {
	const documents = await request('GET', '/files');
	return { folder: null, path: [], folders: [], documents };
}

export function createFolder() {
	return notAvailableYet();
}

export function deleteFolder() {
	return notAvailableYet();
}

// TODO: created_by / updated_by viendront du token quand l'auth sera faite côté back
export function createDocument(name, folderId) {
	return request('POST', '/files', { name, folder_id: folderId, created_by: session.user.id });
}

export function uploadFile() {
	return notAvailableYet();
}

export function getDocument(id) {
	return request('GET', `/files/${id}`);
}

export function saveDocument(id, content) {
	return request('PUT', `/files/${id}`, { content, updated_by: session.user.id });
}

export function replaceFile() {
	return notAvailableYet();
}

export function deleteDocument(id) {
	return request('DELETE', `/files/${id}`);
}

export function fileUrl(doc) {
	return `${API_URL}/files/${doc.id}/file`;
}

// Utilisateurs (admin)

export function getUsers() {
	if (USE_MOCKS) {
		return mock.getUsers();
	}
	return request('GET', '/api/users');
}

export function createUser(user) {
	if (USE_MOCKS) {
		return mock.createUser(user);
	}
	return request('POST', '/api/users', user);
}

export function setUserBlocked(id, isBlocked) {
	if (USE_MOCKS) {
		return mock.setUserBlocked(id, isBlocked);
	}
	return request('PATCH', `/api/users/${id}`, { is_blocked: isBlocked });
}

// Profil de l'utilisateur connecté

export function updateProfile(changes) {
	if (USE_MOCKS) {
		return mock.updateProfile(changes);
	}
	return request('PATCH', '/api/users/me', changes);
}

export function changePassword(currentPassword, newPassword) {
	if (USE_MOCKS) {
		return mock.changePassword(currentPassword, newPassword);
	}
	return request('PATCH', '/api/users/me/password', {
		current_password: currentPassword,
		new_password: newPassword,
	});
}

// Renvoie { secret, qr_code } : qr_code est une image (data URL) générée par le back.
export function setupTwoFactor() {
	if (USE_MOCKS) {
		return mock.setupTwoFactor();
	}
	return request('POST', '/api/auth/2fa/setup');
}

export function enableTwoFactor(code) {
	if (USE_MOCKS) {
		return mock.enableTwoFactor(code);
	}
	return request('POST', '/api/auth/2fa/enable', { code });
}

export function disableTwoFactor(code) {
	if (USE_MOCKS) {
		return mock.disableTwoFactor(code);
	}
	return request('POST', '/api/auth/2fa/disable', { code });
}
