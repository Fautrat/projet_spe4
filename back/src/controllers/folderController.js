import * as documents from '../models/documentModel.js';
import * as folders from '../models/folderModel.js';
import { HttpError, requireText } from '../middlewares/errors.js';
import { deleteStoredFiles } from '../middlewares/upload.js';
import { kickFromWebsocket } from '../config/websocket.js';

// Un dossier invisible pour l'utilisateur répond 404, pour ne pas révéler qu'il existe
async function findVisibleOr404(id, user) {
	const folder = await folders.findById(id);
	if (!folder || !(await folders.visibleFolderIds(user.id)).has(folder.id)) {
		throw new HttpError(404, 'Dossier introuvable.');
	}
	return folder;
}

// On ne crée des dossiers et documents que dans ses propres dossiers (ou à la racine)
export async function findOwnFolderOr404(id, user) {
	const folder = await findVisibleOr404(id, user);
	if (folder.created_by !== user.id) {
		throw new HttpError(403, 'Vous ne pouvez rien ajouter dans un dossier créé par quelqu\'un d\'autre.');
	}
	return folder;
}

// GET /api/folders/root et /api/folders/:id
export async function getFolderContents(req, res) {
	const folder = req.params.id === 'root' ? null : await findVisibleOr404(req.params.id, req.user);
	const id = folder ? folder.id : null;
	const visibleIds = await folders.visibleFolderIds(req.user.id);
	const children = await folders.findChildren(id);

	res.json({
		folder,
		path: folder ? await folders.findPath(id) : [],
		folders: children.filter((child) => visibleIds.has(child.id)),
		documents: await documents.findVisibleInFolder(id, req.user.id),
	});
}

// POST /api/folders
export async function createFolder(req, res) {
	const name = requireText(req.body?.name, 'Le nom', 255);
	const parent = req.body?.parent_id ? await findOwnFolderOr404(req.body.parent_id, req.user) : null;

	const folder = await folders.create(name, parent ? parent.id : null, req.user.id);
	res.status(201).json(folder);
}

// DELETE /api/folders/:id
export async function deleteFolder(req, res) {
	const folder = await findVisibleOr404(req.params.id, req.user);
	if (folder.created_by !== req.user.id) {
		throw new HttpError(403, 'Seul le créateur du dossier peut le supprimer.');
	}

	const storedFiles = await folders.findStoredFilesInTree(folder.id);
	const documentIds = await folders.findDocumentIdsInTree(folder.id);
	await folders.remove(folder.id);
	await deleteStoredFiles(storedFiles);
	await Promise.all(documentIds.map((documentId) => kickFromWebsocket({ documentId, reason: 'deleted' })));
	res.status(204).end();
}
