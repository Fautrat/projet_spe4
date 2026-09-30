import { db } from '../config/db.js';

export async function findById(id) {
	const [rows] = await db.query(
		'SELECT id, name, parent_id, created_by, updated_at FROM folders WHERE id = ?',
		[id],
	);
	return rows[0] || null;
}

// parentId null = racine ; « <=> » compare correctement avec NULL
export async function findChildren(parentId) {
	const [rows] = await db.query(
		'SELECT id, name, parent_id, created_by, updated_at FROM folders WHERE parent_id <=> ? ORDER BY name',
		[parentId],
	);
	return rows;
}

// Dossiers parents, de la racine jusqu'au dossier demandé inclus
export async function findPath(id) {
	const path = [];
	let folder = await findById(id);
	while (folder) {
		path.unshift({ id: folder.id, name: folder.name });
		folder = folder.parent_id ? await findById(folder.parent_id) : null;
	}
	return path;
}

export async function create(name, parentId, userId) {
	const [result] = await db.query(
		'INSERT INTO folders (name, parent_id, created_by) VALUES (?, ?, ?)',
		[name, parentId, userId],
	);
	return findById(result.insertId);
}

// Fichiers stockés dans le dossier et tous ses sous-dossiers, à effacer du disque avant la suppression
export async function findStoredFilesInTree(id) {
	const [rows] = await db.query(
		`WITH RECURSIVE tree AS (
			SELECT id FROM folders WHERE id = ?
			UNION ALL
			SELECT f.id FROM folders f JOIN tree t ON f.parent_id = t.id
		)
		SELECT file_path FROM documents
		WHERE folder_id IN (SELECT id FROM tree) AND file_path IS NOT NULL`,
		[id],
	);
	return rows.map((row) => row.file_path);
}

// Les sous-dossiers et documents partent avec (ON DELETE CASCADE)
export async function remove(id) {
	await db.query('DELETE FROM folders WHERE id = ?', [id]);
}

// Visible = créé par l'utilisateur, ou contenant (même dans un sous-dossier) un document visible
export async function visibleFolderIds(userId) {
	const [rows] = await db.query(
		`WITH RECURSIVE ancestors AS (
			SELECT f.id, f.parent_id FROM folders f
			WHERE f.id IN (
				SELECT d.folder_id FROM documents d
				WHERE d.created_by = ? OR EXISTS (
					SELECT 1 FROM document_members m WHERE m.document_id = d.id AND m.user_id = ?
				)
			)
			UNION
			SELECT p.id, p.parent_id FROM folders p JOIN ancestors a ON p.id = a.parent_id
		)
		SELECT id FROM ancestors
		UNION
		SELECT id FROM folders WHERE created_by = ?`,
		[userId, userId, userId],
	);
	return new Set(rows.map((row) => row.id));
}
