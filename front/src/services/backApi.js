import * as mock from '../mocks/mockBackApi.js';
import { API_URL, USE_MOCKS } from '../config/config.js';
import { closeSession, session } from '../stores/session.js';

// Les champs suivent les colonnes de la base (first_name, is_blocked, file_path...)

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
		// Token expiré ou invalide : on renvoie vers la connexion
		if (response.status === 401 && session.token) {
			closeSession();
			window.location.assign('/login');
		}
		throw new Error(data?.message || data?.error || 'Le serveur ne répond pas.');
	}
	return data;
}

// Authentification

export function login(email, password) {
	return request('POST', '/api/auth/login', { email, password });
}

// Si la double authentification est activée, login renvoie { requires_2fa: true, temp_token }
export function verifyTwoFactor(tempToken, code) {
	return request('POST', '/api/auth/2fa/verify', { temp_token: tempToken, code });
}

export function register(user) {
	return request('POST', '/api/auth/register', user);
}

// Le token JWT n'est pas gardé côté serveur : se déconnecter revient à l'oublier côté front
export async function logout() {}

// Dossiers et documents (vrai back, même en mode mock)

function fileForm(file, fields = {}) {
	const form = new FormData();
	form.append('file', file);
	for (const [key, value] of Object.entries(fields)) {
		if (value !== null && value !== undefined) {
			form.append(key, value);
		}
	}
	return form;
}

// Renvoie { folder, path, folders, documents } ; folderId vide = racine
export function getFolder(folderId) {
	return request('GET', `/api/folders/${folderId || 'root'}`);
}

export function createFolder(name, parentId) {
	return request('POST', '/api/folders', { name, parent_id: parentId });
}

export function deleteFolder(id) {
	return request('DELETE', `/api/folders/${id}`);
}

export function createDocument(name, folderId) {
	return request('POST', '/api/documents', { name, folder_id: folderId });
}

export function uploadFile(file, folderId) {
	return request('POST', '/api/documents/upload', fileForm(file, { folder_id: folderId }));
}

export function getDocument(id) {
	return request('GET', `/api/documents/${id}`);
}

export function saveDocument(id, content) {
	return request('PATCH', `/api/documents/${id}`, { content });
}

export function replaceFile(id, file) {
	return request('PUT', `/api/documents/${id}/file`, fileForm(file));
}

export function deleteDocument(id) {
	return request('DELETE', `/api/documents/${id}`);
}

// Invitations (composant DocumentMembers.vue)

export function getMembers(documentId) {
	return request('GET', `/api/documents/${documentId}/members`);
}

// Invite par adresse email ; renvoie la personne invitée
// Comptes qu'on peut encore inviter (réservé au créateur du document)
export function getInvitableUsers(documentId) {
	return request('GET', `/api/documents/${documentId}/invitable`);
}

export function inviteMember(documentId, email) {
	return request('POST', `/api/documents/${documentId}/members`, { email });
}

export function removeMember(documentId, userId) {
	return request('DELETE', `/api/documents/${documentId}/members/${userId}`);
}

// <img>, <iframe> et les liens n'envoient pas le token : on télécharge le fichier avec le token
// puis on l'affiche par une adresse locale (blob:), à libérer avec URL.revokeObjectURL
export async function loadFileUrl(doc) {
	const response = await fetch(`${API_URL}/api/documents/${doc.id}/file`, {
		headers: { Authorization: `Bearer ${session.token}` },
	});
	if (!response.ok) {
		throw new Error('Impossible de charger le fichier.');
	}
	return URL.createObjectURL(await response.blob());
}

// Utilisateurs (admin, vrai back, même en mode mock)

export function getUsers() {
	return request('GET', '/api/admin/users');
}

export function createUser(user) {
	return request('POST', '/api/admin/users', user);
}

export function setUserRole(id, role) {
	return request('PATCH', `/api/admin/users/${id}/role`, { role });
}

export function setUserBlocked(id, isBlocked) {
	return request('PATCH', `/api/admin/users/${id}`, { is_blocked: isBlocked });
}

// Profil de l'utilisateur connecté (vrai back, même en mode mock)

export function updateProfile(changes) {
	return request('PATCH', '/api/users/me', changes);
}

export function changePassword(currentPassword, newPassword) {
	return request('PATCH', '/api/users/me/password', {
		current_password: currentPassword,
		new_password: newPassword,
	});
}

// Renvoie { secret, qr_code } : qr_code est une image (data URL) générée par le back
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
