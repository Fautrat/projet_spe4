import { db } from '../config/db.js';

// updated_by_name : dernière personne ayant modifié le document, demandée par le sujet
export async function findById(id) {
	const [rows] = await db.query(
		`SELECT d.id, d.folder_id, d.name, d.content, d.file_path, d.mime_type, d.file_size,
			d.created_by, d.updated_at, CONCAT(u.first_name, ' ', u.last_name) AS updated_by_name
		FROM documents d
		JOIN users u ON u.id = d.updated_by
		WHERE d.id = ?`,
		[id],
	);
	return rows[0] || null;
}

// Documents du dossier visibles par l'utilisateur (créés par lui ou où il est invité)
export async function findVisibleInFolder(folderId, userId) {
	const [rows] = await db.query(
		`SELECT d.id, d.folder_id, d.name, d.file_path, d.mime_type, d.file_size,
			d.created_by, d.updated_at, CONCAT(u.first_name, ' ', u.last_name) AS updated_by_name
		FROM documents d
		JOIN users u ON u.id = d.updated_by
		WHERE d.folder_id <=> ?
			AND (d.created_by = ? OR EXISTS (
				SELECT 1 FROM document_members m WHERE m.document_id = d.id AND m.user_id = ?
			))
		ORDER BY d.name`,
		[folderId, userId, userId],
	);
	return rows;
}

export async function createText(name, folderId, userId) {
	const [result] = await db.query(
		`INSERT INTO documents (name, folder_id, content, created_by, updated_by) VALUES (?, ?, '', ?, ?)`,
		[name, folderId, userId, userId],
	);
	return findById(result.insertId);
}

export async function createFile(name, folderId, file, userId) {
	const [result] = await db.query(
		`INSERT INTO documents (name, folder_id, file_path, mime_type, file_size, created_by, updated_by)
		VALUES (?, ?, ?, ?, ?, ?, ?)`,
		[name, folderId, file.filename, file.mimetype, file.size, userId, userId],
	);
	return findById(result.insertId);
}

export async function updateContent(id, content, userId) {
	await db.query('UPDATE documents SET content = ?, updated_by = ? WHERE id = ?', [content, userId, id]);
	return findById(id);
}

export async function replaceFile(id, name, file, userId) {
	await db.query(
		'UPDATE documents SET name = ?, file_path = ?, mime_type = ?, file_size = ?, updated_by = ? WHERE id = ?',
		[name, file.filename, file.mimetype, file.size, userId, id],
	);
	return findById(id);
}

export async function remove(id) {
	await db.query('DELETE FROM documents WHERE id = ?', [id]);
}

// Visible = créé par l'utilisateur ou sur lequel il est invité
export async function canSeeDocument(documentId, userId) {
	const [rows] = await db.query(
		`SELECT 1 FROM documents d
		WHERE d.id = ?
			AND (d.created_by = ? OR EXISTS (
				SELECT 1 FROM document_members m WHERE m.document_id = d.id AND m.user_id = ?
			))`,
		[documentId, userId, userId],
	);
	return rows.length > 0;
}
