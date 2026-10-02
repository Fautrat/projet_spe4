import * as documents from '../models/documentModel.js';
import * as members from '../models/memberModel.js';
import { kickFromWebsocket } from '../config/websocket.js';
import { HttpError, requireEmail, requireText } from '../middlewares/errors.js';
import { deleteStoredFiles, originalName, storedFilePath } from '../middlewares/upload.js';
import { findOwnFolderOr404 } from './folderController.js';

// Document visible = créé par l'utilisateur ou sur lequel il est invité
export async function findVisibleDocumentOr404(id, user) {
	const doc = await documents.findById(id);
	if (!doc || !(await documents.canSeeDocument(doc.id, user.id))) {
		throw new HttpError(404, 'Document introuvable.');
	}
	return doc;
}

// folder_id absent ou vide = racine ; sinon un dossier créé par l'utilisateur
async function folderIdFrom(value, user) {
	if (!value) {
		return null;
	}
	return (await findOwnFolderOr404(value, user)).id;
}

// POST /api/documents
export async function createDocument(req, res) {
	const name = requireText(req.body?.name, 'Le nom', 255);
	const folderId = await folderIdFrom(req.body?.folder_id, req.user);

	res.status(201).json(await documents.createText(name, folderId, req.user.id));
}

// POST /api/documents/upload : formulaire avec file et folder_id
export async function uploadDocument(req, res) {
	if (!req.file) {
		throw new HttpError(400, 'Aucun fichier reçu.');
	}
	try {
		const folderId = await folderIdFrom(req.body?.folder_id, req.user);
		res.status(201).json(await documents.createFile(originalName(req.file), folderId, req.file, req.user.id));
	} catch (err) {
		await deleteStoredFiles([req.file.filename]);
		throw err;
	}
}

// GET /api/documents/:id
export async function getDocument(req, res) {
	res.json(await findVisibleDocumentOr404(req.params.id, req.user));
}

// PATCH /api/documents/:id : appelé par la sauvegarde automatique
export async function updateDocument(req, res) {
	const doc = await findVisibleDocumentOr404(req.params.id, req.user);
	if (doc.file_path) {
		throw new HttpError(400, 'Un fichier importé ne se modifie pas : remplacez-le.');
	}
	if (typeof req.body?.content !== 'string') {
		throw new HttpError(400, 'Le contenu est manquant.');
	}

	res.json(await documents.updateContent(doc.id, req.body?.content, req.user.id));
}

// PUT /api/documents/:id/file : formulaire avec file
export async function replaceDocumentFile(req, res) {
	if (!req.file) {
		throw new HttpError(400, 'Aucun fichier reçu.');
	}
	try {
		const doc = await findVisibleDocumentOr404(req.params.id, req.user);
		if (!doc.file_path) {
			throw new HttpError(400, 'Ce document est un texte : il n\'a pas de fichier à remplacer.');
		}
		const updated = await documents.replaceFile(doc.id, originalName(req.file), req.file, req.user.id);
		await deleteStoredFiles([doc.file_path]);
		res.json(updated);
	} catch (err) {
		await deleteStoredFiles([req.file.filename]);
		throw err;
	}
}

// GET /api/documents/:id/file
export async function downloadDocumentFile(req, res) {
	const doc = await findVisibleDocumentOr404(req.params.id, req.user);
	if (!doc.file_path) {
		throw new HttpError(404, 'Ce document n\'a pas de fichier.');
	}

	res.set({
		'Content-Type': doc.mime_type,
		'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(doc.name)}`,
		'X-Content-Type-Options': 'nosniff',
	});
	res.sendFile(storedFilePath(doc.file_path));
}

// DELETE /api/documents/:id
export async function deleteDocument(req, res) {
	const doc = await findVisibleDocumentOr404(req.params.id, req.user);
	if (doc.created_by !== req.user.id) {
		throw new HttpError(403, 'Seul le créateur du document peut le supprimer.');
	}

	await documents.remove(doc.id);
	if (doc.file_path) {
		await deleteStoredFiles([doc.file_path]);
	}
	await kickFromWebsocket({ documentId: doc.id, reason: 'deleted' });
	res.status(204).end();
}

// ---------- Invitations ----------

// Seul le créateur du document gère les invitations
function checkIsCreator(doc, user) {
	if (doc.created_by !== user.id) {
		throw new HttpError(403, 'Seul le créateur du document peut gérer les invitations.');
	}
}

// GET /api/documents/:id/members
export async function listMembers(req, res) {
	const doc = await findVisibleDocumentOr404(req.params.id, req.user);
	res.json(await members.findMembers(doc.id));
}

// GET /api/documents/:id/invitable : liste proposée au créateur pour inviter quelqu'un
export async function listInvitableUsers(req, res) {
	const doc = await findVisibleDocumentOr404(req.params.id, req.user);
	checkIsCreator(doc, req.user);
	res.json(await members.findInvitable(doc.id, doc.created_by));
}

// POST /api/documents/:id/members avec { email } : renvoie la personne invitée
export async function inviteMember(req, res) {
	const doc = await findVisibleDocumentOr404(req.params.id, req.user);
	checkIsCreator(doc, req.user);

	const user = await members.findActiveUserByEmail(requireEmail(req.body?.email));
	if (!user) {
		throw new HttpError(404, 'Aucun compte actif ne porte cette adresse.');
	}
	if (user.id === doc.created_by) {
		throw new HttpError(409, 'Cette personne est l\'auteur du parchemin.');
	}
	if (await members.isMember(doc.id, user.id)) {
		throw new HttpError(409, 'Cette personne est déjà invitée.');
	}

	await members.add(doc.id, user.id, req.user.id);
	res.status(201).json(user);
}

// DELETE /api/documents/:id/members/:userId
export async function removeMember(req, res) {
	const doc = await findVisibleDocumentOr404(req.params.id, req.user);
	const { userId } = req.params;
	if (Number(userId) !== req.user.id) {
		checkIsCreator(doc, req.user);
	}

	if (!(await members.remove(doc.id, userId))) {
		throw new HttpError(404, 'Cette personne n\'est pas invitée sur ce document.');
	}
	await kickFromWebsocket({ userId: Number(userId), documentId: doc.id, reason: 'removed' });
	res.status(204).end();
}
