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
		throw new Error(data?.message || 'Le serveur ne répond pas.');
	}
	return data;
}

function fileForm(file, fields = {}) {
	const form = new FormData();
	form.append('file', file);
	for (const [key, value] of Object.entries(fields)) {
		if (value !== null) {
			form.append(key, value);
		}
	}
	return form;
}

// Authentification

export function login(email, password) {
	if (USE_MOCKS) {
		return mock.login(email, password);
	}
	return request('POST', '/api/auth/login', { email, password });
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

// Renvoie { folder, path, folders, documents } ; folderId vide = racine.
export function getFolder(folderId) {
	if (USE_MOCKS) {
		return mock.getFolder(folderId);
	}
	return request('GET', `/api/folders/${folderId || 'root'}`);
}

export function createFolder(name, parentId) {
	if (USE_MOCKS) {
		return mock.createFolder(name, parentId);
	}
	return request('POST', '/api/folders', { name, parent_id: parentId });
}

export function deleteFolder(id) {
	if (USE_MOCKS) {
		return mock.deleteFolder(id);
	}
	return request('DELETE', `/api/folders/${id}`);
}

export function createDocument(name, folderId) {
	if (USE_MOCKS) {
		return mock.createDocument(name, folderId);
	}
	return request('POST', '/api/documents', { name, folder_id: folderId });
}

export function uploadFile(file, folderId) {
	if (USE_MOCKS) {
		return mock.uploadFile(file, folderId);
	}
	return request('POST', '/api/documents/upload', fileForm(file, { folder_id: folderId }));
}

export function getDocument(id) {
	if (USE_MOCKS) {
		return mock.getDocument(id);
	}
	return request('GET', `/api/documents/${id}`);
}

export function saveDocument(id, content) {
	if (USE_MOCKS) {
		return mock.saveDocument(id, content);
	}
	return request('PATCH', `/api/documents/${id}`, { content });
}

export function replaceFile(id, file) {
	if (USE_MOCKS) {
		return mock.replaceFile(id, file);
	}
	return request('PUT', `/api/documents/${id}/file`, fileForm(file));
}

export function deleteDocument(id) {
	if (USE_MOCKS) {
		return mock.deleteDocument(id);
	}
	return request('DELETE', `/api/documents/${id}`);
}

export function fileUrl(doc) {
	if (USE_MOCKS) {
		return doc.file_path;
	}
	return `${API_URL}/api/documents/${doc.id}/file`;
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
